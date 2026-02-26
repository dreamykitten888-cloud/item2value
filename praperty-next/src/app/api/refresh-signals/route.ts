import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60 // Allow up to 60s for batch processing

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/refresh-signals
 *
 * Background batch fetcher: refreshes market signals for ALL of a user's items.
 * Called from the app on load (debounced) or could be wired to a cron later.
 *
 * Body: { userId: string }
 *
 * For each item:
 * 1. Hits /api/market-signal for live eBay prices + Google Trends
 * 2. Computes conviction score
 * 3. Calculates price change vs previous signal
 * 4. Upserts into market_signals table
 */
export async function POST(req: NextRequest) {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'no_service_key' }, { status: 500 })
  }

  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'missing userId' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all active (unsold) items for this user
    const { data: items, error: itemsErr } = await supabase
      .from('items')
      .select('id, name, brand, model, category, cost, value, asking, comps, price_history, date_purchased, date_sold')
      .eq('user_id', userId)
      .is('date_sold', null)

    if (itemsErr) {
      console.error('[refresh-signals] items fetch error:', itemsErr.message)
      return NextResponse.json({ error: itemsErr.message }, { status: 500 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ refreshed: 0, message: 'no active items' })
    }

    // Get existing signals for price change comparison
    const { data: existingSignals } = await supabase
      .from('market_signals')
      .select('item_id, ebay_avg_price')
      .eq('user_id', userId)

    const prevPriceMap = new Map<number, number>()
    existingSignals?.forEach(s => prevPriceMap.set(s.item_id, s.ebay_avg_price || 0))

    // Process items in parallel batches of 3 (be nice to eBay API)
    const BATCH_SIZE = 3
    const results: { itemId: number; success: boolean; error?: string }[] = []

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(item => processItem(item, userId, prevPriceMap, supabase))
      )

      batchResults.forEach((result, idx) => {
        const item = batch[idx]
        if (result.status === 'fulfilled') {
          results.push({ itemId: item.id, success: true })
        } else {
          results.push({ itemId: item.id, success: false, error: result.reason?.message })
        }
      })

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < items.length) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    const successCount = results.filter(r => r.success).length
    return NextResponse.json({
      refreshed: successCount,
      total: items.length,
      errors: results.filter(r => !r.success),
    })
  } catch (err: any) {
    console.error('[refresh-signals] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function processItem(
  item: any,
  userId: string,
  prevPriceMap: Map<number, number>,
  supabase: any
) {
  // Build search query from item name + brand
  const query = [item.name, item.brand].filter(Boolean).join(' ').trim()
  if (!query) return

  // Fetch live market signal from our existing endpoint
  const baseUrl = supabaseUrl.replace('.supabase.co', '.supabase.co')
  const signalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/market-signal?q=${encodeURIComponent(query)}&category=${encodeURIComponent(item.category || '')}`

  const signalRes = await fetch(signalUrl, { signal: AbortSignal.timeout(12000) })
  if (!signalRes.ok) throw new Error(`Signal fetch failed: ${signalRes.status}`)

  const signal = await signalRes.json()

  // Compute conviction score using the same logic as frontend
  const convictionResult = computeConvictionServer(item, signal)

  // Calculate price change vs previous signal
  const currentAvg = signal.ebayAvgSold || 0
  const previousAvg = prevPriceMap.get(item.id) || 0
  const priceChangeAbs = previousAvg > 0 ? currentAvg - previousAvg : 0
  const priceChangePct = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0

  // Upsert into market_signals
  const { error } = await supabase
    .from('market_signals')
    .upsert({
      item_id: item.id,
      user_id: userId,
      ebay_prices: signal.ebayPrices || [],
      ebay_avg_price: currentAvg,
      ebay_listing_count: signal.ebaySoldCount || 0,
      trend_score: signal.trendScore ?? 0,
      trend_direction: signal.trendDirection || 'stable',
      conviction_score: convictionResult.score,
      conviction_level: convictionResult.level,
      conviction_headline: convictionResult.headline,
      price_change_pct: Math.round(priceChangePct * 100) / 100,
      price_change_abs: Math.round(priceChangeAbs * 100) / 100,
      previous_avg_price: previousAvg,
      fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'item_id' })

  if (error) throw new Error(`Upsert failed: ${error.message}`)

  // Also update the item's price_history with this data point
  if (currentAvg > 0) {
    const today = new Date().toISOString().split('T')[0]
    const existingHistory = Array.isArray(item.price_history) ? item.price_history : []

    // Don't add duplicate entries for same day
    const alreadyHasToday = existingHistory.some((p: any) => p.date === today)
    if (!alreadyHasToday) {
      const updatedHistory = [...existingHistory, { date: today, value: currentAvg }]
        .slice(-90) // Keep last 90 days

      await supabase
        .from('items')
        .update({
          price_history: updatedHistory,
          value: currentAvg, // Update current value to market avg
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
    }
  }
}

/**
 * Server-side conviction calculation (simplified version of client-side conviction.ts)
 * We duplicate the core logic here to avoid importing client-side modules
 */
function computeConvictionServer(
  item: any,
  signal: any
): { score: number; level: string; headline: string } {
  const scores: number[] = []
  const weights: number[] = []

  // 1. Price Velocity (weight 0.35) - based on price history trend
  const history = Array.isArray(item.price_history) ? item.price_history : []
  let velocityScore = 50
  if (history.length >= 2) {
    const recent = history.slice(-3)
    const older = history.slice(0, Math.max(1, history.length - 3))
    const recentAvg = recent.reduce((s: number, p: any) => s + (p.value || 0), 0) / recent.length
    const olderAvg = older.reduce((s: number, p: any) => s + (p.value || 0), 0) / older.length
    if (olderAvg > 0) {
      const change = (recentAvg - olderAvg) / olderAvg
      velocityScore = Math.max(0, Math.min(100, 50 + change * 200))
    }
  }
  scores.push(velocityScore)
  weights.push(0.35)

  // 2. Market Delta (weight 0.30) - eBay avg vs item value/cost
  let marketDeltaScore = 50
  if (signal.ebayPrices?.length > 0) {
    const ebayAvg = signal.ebayAvgSold || 0
    const itemRef = item.value || item.cost || 0
    if (itemRef > 0 && ebayAvg > 0) {
      const ratio = ebayAvg / itemRef
      // Above 1 = market paying more than your value (good to sell)
      // Below 1 = market paying less (hold or buy more)
      marketDeltaScore = Math.max(0, Math.min(100, ratio * 50))
    }
  }
  scores.push(marketDeltaScore)
  weights.push(0.30)

  // 3. ROI Position (weight 0.15)
  let roiScore = 50
  const cost = item.cost || 0
  const value = item.value || signal.ebayAvgSold || 0
  if (cost > 0 && value > 0) {
    const roi = ((value - cost) / cost) * 100
    roiScore = Math.max(0, Math.min(100, 50 + roi / 2))
  }
  scores.push(roiScore)
  weights.push(0.15)

  // 4. Hold Duration (weight 0.10)
  let holdScore = 50
  if (item.date_purchased) {
    const holdDays = Math.floor((Date.now() - new Date(item.date_purchased).getTime()) / 86400000)
    // Longer hold = lower score (unless appreciating asset)
    holdScore = Math.max(20, 80 - holdDays * 0.3)
  }
  scores.push(holdScore)
  weights.push(0.10)

  // 5. Social Trend (weight 0.10)
  let trendScoreVal = 50
  if (signal.trendScore != null) {
    trendScoreVal = signal.trendScore
    if (signal.trendDirection === 'rising') trendScoreVal = Math.min(100, trendScoreVal + 15)
    if (signal.trendDirection === 'declining') trendScoreVal = Math.max(0, trendScoreVal - 15)
  }
  scores.push(trendScoreVal)
  weights.push(0.10)

  // Weighted average
  const totalWeight = weights.reduce((s, w) => s + w, 0)
  const finalScore = Math.round(
    scores.reduce((s, score, i) => s + score * weights[i], 0) / totalWeight
  )

  // Determine level
  const level = finalScore >= 70 ? 'SELL' : finalScore <= 35 ? 'BUY' : 'HOLD'

  // Generate headline
  let headline = ''
  if (level === 'SELL' && signal.ebayAvgSold > 0) {
    headline = `Market avg $${signal.ebayAvgSold} - strong sell signal`
  } else if (level === 'BUY' && signal.trendDirection === 'rising') {
    headline = `Trending up - good time to buy more`
  } else if (level === 'SELL') {
    headline = `Consider selling - conditions favorable`
  } else if (level === 'BUY') {
    headline = `Hold or accumulate - prices are low`
  } else {
    headline = `Market stable - hold position`
  }

  return { score: finalScore, level, headline }
}
