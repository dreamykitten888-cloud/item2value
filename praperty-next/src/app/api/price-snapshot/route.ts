import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

/**
 * POST /api/price-snapshot
 * Body: { products: [{ name, brand?, category? }] }
 *
 * Triggers a price snapshot for given products.
 * Called by the client when products are viewed to build up history.
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const products = body.products

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 })
    }

    const res = await fetch(
      `${supabaseUrl}/functions/v1/price-snapshot?action=snapshot`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
        signal: AbortSignal.timeout(25000),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('[price-snapshot] Edge function error:', err)
      return NextResponse.json({ error: 'Snapshot failed' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error('[price-snapshot] Error:', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

/**
 * GET /api/price-snapshot?keys=key1,key2,key3
 * Returns latest prices + daily change for multiple product keys
 */
export async function GET(req: NextRequest) {
  const keys = req.nextUrl.searchParams.get('keys')
  if (!keys) {
    return NextResponse.json({ error: 'Missing keys parameter' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/price-snapshot?action=latest&keys=${encodeURIComponent(keys)}`,
      { signal: AbortSignal.timeout(8000) }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch latest' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error('[price-snapshot] Error:', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
