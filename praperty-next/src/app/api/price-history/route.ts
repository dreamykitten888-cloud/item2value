import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 10

/**
 * GET /api/price-history?key=gucci-marmont-bag&days=365
 * Returns price history for a product from Supabase price_snapshots
 */
export async function GET(req: NextRequest) {
  const productKey = req.nextUrl.searchParams.get('key')
  const days = Math.min(Number(req.nextUrl.searchParams.get('days')) || 365, 365)

  if (!productKey) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/price-snapshot?action=history&key=${encodeURIComponent(productKey)}&days=${days}`,
      { signal: AbortSignal.timeout(8000) }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error('[price-history] Error:', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
