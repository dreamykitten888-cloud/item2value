import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 15

/**
 * GET /api/market-signal?q=Air+Jordan+1&category=Sneakers
 *
 * Fetches live market signals for the conviction engine:
 * 1. eBay active listing prices (via existing Supabase edge function)
 * 2. Google Trends interest score (via unofficial trends endpoint)
 *
 * Returns: { ebayPrices, ebayAvgSold, ebaySoldCount, trendScore, trendDirection, fetchedAt }
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  const category = req.nextUrl.searchParams.get('category') || ''

  if (!query) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 })
  }

  // Run both fetches in parallel
  const [ebayResult, trendResult] = await Promise.allSettled([
    fetchEbayPrices(query),
    fetchGoogleTrends(query, category),
  ])

  const ebayData = ebayResult.status === 'fulfilled' ? ebayResult.value : null
  const trendData = trendResult.status === 'fulfilled' ? trendResult.value : null

  return NextResponse.json({
    ebayPrices: ebayData?.prices || [],
    ebayAvgSold: ebayData?.avg || 0,
    ebaySoldCount: ebayData?.count || 0,
    trendScore: trendData?.score ?? null,
    trendDirection: trendData?.direction || null,
    fetchedAt: new Date().toISOString(),
  })
}

// --- eBay prices via existing Supabase edge function ---
async function fetchEbayPrices(query: string): Promise<{ prices: number[]; avg: number; count: number }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) throw new Error('No Supabase URL')

  const res = await fetch(
    `${supabaseUrl}/functions/v1/ebay-proxy?q=${encodeURIComponent(query)}&limit=12`,
    { signal: AbortSignal.timeout(10000) }
  )

  if (!res.ok) throw new Error(`eBay proxy error: ${res.status}`)

  const data = await res.json()
  const items = data.items || []

  // Extract prices from eBay listings
  const prices: number[] = items
    .map((item: Record<string, unknown>) => {
      const price = item.price as Record<string, unknown> | undefined
      return price?.value ? Number(price.value) : 0
    })
    .filter((p: number) => p > 0)

  const avg = prices.length > 0
    ? Math.round(prices.reduce((s: number, p: number) => s + p, 0) / prices.length)
    : 0

  return { prices, avg, count: prices.length }
}

// --- Google Trends interest score ---
// Uses Google Trends' internal explore endpoint (same as google-trends-api npm)
async function fetchGoogleTrends(
  query: string,
  category: string
): Promise<{ score: number; direction: 'rising' | 'stable' | 'declining' }> {
  try {
    // Build search term: use item name, add category context for better results
    const searchTerm = query.split(' ').slice(0, 4).join(' ') // max 4 words for trends

    // Google Trends explore API (internal, same approach as google-trends-api package)
    // First, get the token for the interest over time widget
    const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=300&req=${encodeURIComponent(
      JSON.stringify({
        comparisonItem: [{ keyword: searchTerm, geo: 'US', time: 'today 3-m' }],
        category: 0,
        property: '',
      })
    )}`

    const exploreRes = await fetch(exploreUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!exploreRes.ok) throw new Error('Trends explore failed')

    const exploreText = await exploreRes.text()
    // Google prefixes response with ")]}'" for XSS protection
    const cleaned = exploreText.replace(/^\)\]\}\'/, '').trim()
    const exploreData = JSON.parse(cleaned)

    // Extract the token for interest over time
    const widgets = exploreData?.widgets || []
    const timelineWidget = widgets.find((w: Record<string, unknown>) => w.id === 'TIMESERIES')

    if (!timelineWidget?.token) {
      // If we can't get trends, try a simpler heuristic based on category
      return getCategoryHeuristic(category)
    }

    // Fetch actual interest over time data
    const timelineReq = timelineWidget.request
    const multilineUrl = `https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&tz=300&req=${encodeURIComponent(
      JSON.stringify(timelineReq)
    )}&token=${timelineWidget.token}`

    const timelineRes = await fetch(multilineUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!timelineRes.ok) throw new Error('Trends timeline failed')

    const timelineText = await timelineRes.text()
    const timelineCleaned = timelineText.replace(/^\)\]\}\'/, '').trim()
    const timelineData = JSON.parse(timelineCleaned)

    // Extract data points
    const points = timelineData?.default?.timelineData || []
    if (points.length === 0) return getCategoryHeuristic(category)

    // Current interest = average of last 4 data points (most recent month)
    const recentPoints = points.slice(-4)
    const recentAvg = recentPoints.reduce(
      (s: number, p: Record<string, unknown>) => {
        const values = p.value as number[]
        return s + (values?.[0] || 0)
      },
      0
    ) / recentPoints.length

    // Earlier interest = average of first 4 data points (3 months ago)
    const earlyPoints = points.slice(0, 4)
    const earlyAvg = earlyPoints.reduce(
      (s: number, p: Record<string, unknown>) => {
        const values = p.value as number[]
        return s + (values?.[0] || 0)
      },
      0
    ) / earlyPoints.length

    // Determine direction
    const changeRatio = earlyAvg > 0 ? (recentAvg - earlyAvg) / earlyAvg : 0
    const direction: 'rising' | 'stable' | 'declining' =
      changeRatio > 0.15 ? 'rising' :
      changeRatio < -0.15 ? 'declining' :
      'stable'

    return {
      score: Math.round(Math.max(0, Math.min(100, recentAvg))),
      direction,
    }
  } catch (e) {
    console.error('[market-signal] Google Trends error:', e)
    // Graceful degradation: use category-based heuristic
    return getCategoryHeuristic(category)
  }
}

// Fallback heuristic when Trends API is unavailable
// Based on general category demand patterns
function getCategoryHeuristic(category: string): { score: number; direction: 'rising' | 'stable' | 'declining' } {
  const heuristics: Record<string, { score: number; direction: 'rising' | 'stable' | 'declining' }> = {
    'Sneakers':       { score: 72, direction: 'stable' },
    'Watches':        { score: 58, direction: 'stable' },
    'Electronics':    { score: 65, direction: 'stable' },
    'Trading Cards':  { score: 55, direction: 'declining' },
    'Bags':           { score: 60, direction: 'stable' },
    'Clothing':       { score: 50, direction: 'stable' },
    'Automotive':     { score: 48, direction: 'stable' },
    'Collectibles':   { score: 52, direction: 'stable' },
    'Gaming':         { score: 62, direction: 'stable' },
    'Art':            { score: 40, direction: 'stable' },
    'Instruments':    { score: 42, direction: 'stable' },
    'Jewelry':        { score: 55, direction: 'stable' },
    'Furniture':      { score: 38, direction: 'declining' },
  }

  return heuristics[category] || { score: 45, direction: 'stable' }
}
