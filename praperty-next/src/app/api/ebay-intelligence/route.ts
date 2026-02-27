import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 25

/**
 * GET /api/ebay-intelligence?q=gucci+ace+sneaker&condition=Used
 *
 * Makes multiple smart eBay Browse API calls in parallel to build
 * a comprehensive market intelligence report:
 *
 * 1. FULL refinements (condition/category/aspect distributions + items)
 * 2. Price-sorted low (cheapest listings = market floor)
 * 3. Price-sorted high (most expensive = market ceiling)
 * 4. Condition-filtered search (match user's item condition)
 *
 * Returns: { market, conditionPricing, priceRange, aspects, categories }
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  const condition = req.nextUrl.searchParams.get('condition') || ''

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'No Supabase URL' }, { status: 500 })
  }

  const proxyBase = `${supabaseUrl}/functions/v1/ebay-proxy`

  // Map user condition to eBay condition filter values
  const conditionMap: Record<string, string> = {
    'New': 'NEW',
    'Like New': 'NEW',
    'Excellent': 'USED_EXCELLENT',
    'Very Good': 'USED_VERY_GOOD',
    'Good': 'USED_GOOD',
    'Fair': 'USED_ACCEPTABLE',
    'Poor': 'USED_ACCEPTABLE',
  }
  const ebayCondition = conditionMap[condition] || ''

  // Exclude common accessories/junk from eBay queries
  const cleanQuery = `${query} -case -cover -protector -adapter -charger -cable -mount -holder -skin -film`

  try {
    // Fire all 4 calls in parallel for speed
    const [fullResult, lowResult, highResult, conditionResult] = await Promise.allSettled([
      // 1. Full refinements + top items (gives us distributions)
      fetchProxy(proxyBase, cleanQuery, {
        limit: '12',
        fieldgroups: 'FULL',
      }),
      // 2. Cheapest listings (market floor)
      fetchProxy(proxyBase, cleanQuery, {
        limit: '5',
        sort: 'price',
        filter: 'buyingOptions:{FIXED_PRICE}',
      }),
      // 3. Most expensive listings (market ceiling)
      fetchProxy(proxyBase, cleanQuery, {
        limit: '5',
        sort: '-price',
        filter: 'buyingOptions:{FIXED_PRICE}',
      }),
      // 4. Condition-specific search (if condition provided)
      ebayCondition
        ? fetchProxy(proxyBase, cleanQuery, {
            limit: '8',
            filter: `conditions:{${ebayCondition}},buyingOptions:{FIXED_PRICE}`,
          })
        : Promise.resolve(null),
    ])

    const full = fullResult.status === 'fulfilled' ? fullResult.value : null
    const low = lowResult.status === 'fulfilled' ? lowResult.value : null
    const high = highResult.status === 'fulfilled' ? highResult.value : null
    const condMatch = conditionResult.status === 'fulfilled' ? conditionResult.value : null

    // Build market depth from full results
    const totalListings = full?.total || 0
    const conditionDist = (full?.conditionDistributions || []) as ConditionDist[]
    const categoryDist = (full?.categoryDistributions || []) as CategoryDist[]
    const aspectDist = (full?.aspectDistributions || []) as AspectDist[]

    // Extract all prices from the main search
    const allItems = full?.items || []
    const allPrices = extractPrices(allItems)
    const allAvg = avg(allPrices)

    // Market floor and ceiling from sorted searches
    const floorPrices = extractPrices(low?.items || [])
    const ceilingPrices = extractPrices(high?.items || [])
    const marketFloor = floorPrices.length > 0 ? Math.min(...floorPrices) : null
    const marketCeiling = ceilingPrices.length > 0 ? Math.max(...ceilingPrices) : null

    // Condition-specific pricing
    const condPrices = extractPrices(condMatch?.items || [])
    const condAvg = avg(condPrices)

    // Compute market depth rating
    const depthRating = getMarketDepth(totalListings)

    // Find dominant brand from aspects
    const brandAspect = aspectDist.find(
      a => a.localizedAspectName?.toLowerCase() === 'brand'
    )
    const topBrands = (brandAspect?.aspectValues || []).slice(0, 5)

    // Compute condition breakdown percentages
    const totalCondCount = conditionDist.reduce((s, c) => s + (c.count || 0), 0)
    const conditionBreakdown = conditionDist.map(c => ({
      condition: c.condition,
      count: c.count || 0,
      percent: totalCondCount > 0 ? Math.round(((c.count || 0) / totalCondCount) * 100) : 0,
    }))

    // Build response
    return NextResponse.json({
      market: {
        totalListings,
        depth: depthRating,
        avgPrice: allAvg,
        medianPrice: median(allPrices),
        sampleSize: allPrices.length,
      },
      priceRange: {
        floor: marketFloor,
        ceiling: marketCeiling,
        floorItems: (low?.items || []).slice(0, 3),
        ceilingItems: (high?.items || []).slice(0, 3),
      },
      conditionPricing: {
        userCondition: condition || 'Unknown',
        ebayCondition: ebayCondition || 'ALL',
        conditionAvg: condAvg,
        conditionMedian: median(condPrices),
        conditionCount: condPrices.length,
        allConditionAvg: allAvg,
        premium: condAvg && allAvg ? Math.round(((condAvg - allAvg) / allAvg) * 100) : null,
        breakdown: conditionBreakdown,
      },
      aspects: {
        topBrands,
        all: aspectDist.slice(0, 6).map(a => ({
          name: a.localizedAspectName,
          values: (a.aspectValues || []).slice(0, 5),
        })),
      },
      categories: categoryDist.slice(0, 5).map(c => ({
        name: c.categoryName,
        id: c.categoryId,
        count: c.count,
      })),
      fetchedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[ebay-intelligence] Error:', e)
    return NextResponse.json({ error: 'Intelligence fetch failed' }, { status: 500 })
  }
}

// --- Helpers ---

interface ConditionDist { condition: string; conditionId?: string; count: number; refinementHref?: string }
interface CategoryDist { categoryId: string; categoryName: string; count: number; refinementHref?: string }
interface AspectDist { localizedAspectName: string; aspectValues: { value: string; count: number }[] }

async function fetchProxy(
  base: string,
  query: string,
  params: Record<string, string>
): Promise<any> {
  const url = new URL(base)
  url.searchParams.set('q', query)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(12000),
  })

  if (!res.ok) {
    console.error(`[ebay-intelligence] Proxy error ${res.status} for params:`, params)
    throw new Error(`Proxy ${res.status}`)
  }

  return res.json()
}

function extractPrices(items: any[]): number[] {
  return items
    .map((item: any) => {
      const p = item.price
      return p?.value ? Number(p.value) : 0
    })
    .filter((p: number) => p > 0)
}

function avg(prices: number[]): number | null {
  if (prices.length === 0) return null
  return Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
}

function median(prices: number[]): number | null {
  if (prices.length === 0) return null
  const sorted = [...prices].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

function getMarketDepth(total: number): { label: string; level: 'saturated' | 'healthy' | 'limited' | 'rare'; score: number } {
  if (total >= 1000) return { label: 'Saturated Market', level: 'saturated', score: 90 }
  if (total >= 200) return { label: 'Healthy Supply', level: 'healthy', score: 70 }
  if (total >= 50) return { label: 'Limited Supply', level: 'limited', score: 40 }
  if (total >= 10) return { label: 'Scarce', level: 'rare', score: 20 }
  return { label: 'Very Rare', level: 'rare', score: 10 }
}
