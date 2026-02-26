import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 10

/**
 * GET /api/product-search?q=supra&limit=8
 *
 * Server-side product search using Supabase full-text search + trigram matching.
 * Falls back gracefully if Supabase is unreachable.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim()
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get('limit') || '8', 10),
    20
  )

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase.rpc('search_products', {
      search_query: query,
      result_limit: limit,
    })

    if (error) {
      console.error('[product-search] Supabase RPC error:', error.message)
      return NextResponse.json({ results: [], source: 'error' }, { status: 200 })
    }

    const results = (data || []).map((row: any) => ({
      name: row.name,
      brand: row.brand,
      model: row.model,
      category: row.category,
      emoji: row.emoji,
      relevance: row.relevance,
    }))

    return NextResponse.json({ results, source: 'supabase' })
  } catch (err: any) {
    console.error('[product-search] Unexpected error:', err.message)
    return NextResponse.json({ results: [], source: 'error' }, { status: 200 })
  }
}
