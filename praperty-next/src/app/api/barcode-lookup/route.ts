import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 15

/**
 * GET /api/barcode-lookup?code=4521329338422
 *
 * Server-side barcode proxy that tries multiple sources:
 * 1. UPC Item DB (best for US products)
 * 2. Open Food Facts / Open Beauty Facts / Open Products Facts (international)
 * 3. BarcodeLookup-style Google search fallback
 *
 * Solves the CORS issue (upcitemdb only allows requests from their own domain)
 * and adds international barcode coverage (JAN, EAN-13, etc.)
 */

interface ProductResult {
  name: string
  brand: string
  model: string
  category: string
  cost: number
  value: number
  photos: string[]
  barcode: string
  source: string
  description?: string
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim()
  if (!code) {
    return NextResponse.json({ error: 'Missing ?code= parameter' }, { status: 400 })
  }

  console.log(`[barcode-lookup] Looking up: ${code}`)

  // Try sources in parallel for speed, use first match
  const [upcResult, openResult] = await Promise.allSettled([
    lookupUPCItemDB(code),
    lookupOpenProductFacts(code),
  ])

  // Prefer UPC Item DB (richer data for US products)
  if (upcResult.status === 'fulfilled' && upcResult.value) {
    console.log(`[barcode-lookup] Found via UPC Item DB: ${upcResult.value.name}`)
    return NextResponse.json(upcResult.value)
  }

  // Fallback to Open Products Facts (great international coverage)
  if (openResult.status === 'fulfilled' && openResult.value) {
    console.log(`[barcode-lookup] Found via Open Products Facts: ${openResult.value.name}`)
    return NextResponse.json(openResult.value)
  }

  console.log(`[barcode-lookup] No results for ${code}`)
  return NextResponse.json({ found: false, barcode: code })
}

// ─── Source 1: UPC Item DB ─────────────────
async function lookupUPCItemDB(code: string): Promise<ProductResult | null> {
  try {
    const resp = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!resp.ok) return null
    const data = await resp.json()

    if (!data.items || data.items.length === 0) return null

    const product = data.items[0]
    if (!product.title) return null

    return {
      name: product.title || '',
      brand: product.brand || '',
      model: product.model || '',
      category: inferCategory(product.category || product.title || ''),
      cost: product.lowest_recorded_price ? parseFloat(product.lowest_recorded_price) : 0,
      value: product.highest_recorded_price ? parseFloat(product.highest_recorded_price) : 0,
      photos: (product.images || []).slice(0, 3),
      barcode: code,
      source: 'upc-itemdb',
      description: product.description || '',
    }
  } catch (e) {
    console.error('[barcode-lookup] UPC Item DB error:', e)
    return null
  }
}

// ─── Source 2: Open Products Facts (covers food, beauty, and general products) ─────
async function lookupOpenProductFacts(code: string): Promise<ProductResult | null> {
  // Try all three Open Facts databases in parallel
  const apis = [
    `https://world.openfoodfacts.org/api/v2/product/${code}.json`,
    `https://world.openbeautyfacts.org/api/v2/product/${code}.json`,
    `https://world.openproductsfacts.org/api/v2/product/${code}.json`,
  ]

  const results = await Promise.allSettled(
    apis.map(async (url) => {
      const resp = await fetch(url, { signal: AbortSignal.timeout(6000) })
      if (!resp.ok) return null
      const data = await resp.json()
      if (data.status !== 1 || !data.product) return null
      return data.product
    })
  )

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      const p = r.value
      const name = p.product_name || p.product_name_en || p.product_name_ja || ''
      if (!name) continue

      return {
        name: name,
        brand: p.brands || '',
        model: p.generic_name || '',
        category: inferCategory(
          p.categories || p.categories_tags?.join(', ') || name
        ),
        cost: 0,
        value: 0,
        photos: [p.image_url, p.image_front_url, p.image_small_url].filter(Boolean).slice(0, 3),
        barcode: code,
        source: 'open-facts',
        description: p.generic_name || p.categories || '',
      }
    }
  }

  return null
}

// ─── Category inference ─────────────────
function inferCategory(raw: string): string {
  const lower = raw.toLowerCase()
  const map: Record<string, string> = {
    shoe: 'Sneakers', sneaker: 'Sneakers', footwear: 'Sneakers', jordan: 'Sneakers',
    watch: 'Watches', timepiece: 'Watches', horology: 'Watches',
    phone: 'Electronics', laptop: 'Electronics', computer: 'Electronics', camera: 'Electronics',
    tablet: 'Electronics', headphone: 'Electronics', speaker: 'Electronics', console: 'Electronics',
    gaming: 'Gaming', playstation: 'Gaming', xbox: 'Gaming', nintendo: 'Gaming', pokemon: 'Gaming',
    shirt: 'Clothing', pant: 'Clothing', jacket: 'Clothing', dress: 'Clothing', apparel: 'Clothing',
    bag: 'Bags', purse: 'Bags', handbag: 'Bags', backpack: 'Bags',
    ring: 'Jewelry', necklace: 'Jewelry', bracelet: 'Jewelry',
    card: 'Trading Cards', trading: 'Trading Cards',
    vinyl: 'Music', record: 'Music', album: 'Music',
    book: 'Books', novel: 'Books', manga: 'Books',
    guitar: 'Instruments', piano: 'Instruments', drum: 'Instruments',
    figure: 'Collectibles', figurine: 'Collectibles', plush: 'Collectibles',
    toy: 'Collectibles', doll: 'Collectibles', lego: 'Collectibles',
    kirby: 'Collectibles', amiibo: 'Collectibles',
    tool: 'Tools', drill: 'Tools', wrench: 'Tools',
    furniture: 'Furniture', chair: 'Furniture', desk: 'Furniture', table: 'Furniture',
    art: 'Art', painting: 'Art', print: 'Art',
    car: 'Automotive', auto: 'Automotive', vehicle: 'Automotive',
    sport: 'Sports', ball: 'Sports', racket: 'Sports',
  }

  for (const [keyword, category] of Object.entries(map)) {
    if (lower.includes(keyword)) return category
  }
  return 'Other'
}
