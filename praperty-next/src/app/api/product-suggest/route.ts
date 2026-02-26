import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/product-suggest
 *
 * When a user saves an item, fire-and-forget this endpoint to contribute
 * the product to the catalog if it doesn't already exist.
 * User-contributed items start with is_user_contributed = true and popularity = 1.
 * Each duplicate submission bumps popularity, so organically popular items rise.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  // Service role key required for writes (RLS blocks anon writes)
  if (!supabaseServiceKey) {
    return NextResponse.json({ ok: false, reason: 'no_service_key' }, { status: 200 })
  }

  try {
    const body = await req.json()
    const { name, brand, model, category, emoji } = body

    if (!name || !brand) {
      return NextResponse.json({ ok: false, reason: 'missing_fields' }, { status: 200 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if product already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id, popularity')
      .ilike('name', name.trim())
      .ilike('brand', brand.trim())
      .limit(1)
      .single()

    if (existing) {
      // Bump popularity of existing product
      await supabase
        .from('products')
        .update({ popularity: (existing.popularity || 0) + 1 })
        .eq('id', existing.id)

      return NextResponse.json({ ok: true, action: 'bumped' })
    }

    // Insert new user-contributed product
    const { error } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        brand: brand.trim(),
        model: (model || '').trim(),
        category: category || 'Other',
        emoji: emoji || '📦',
        aliases: [],
        popularity: 1,
        is_user_contributed: true,
      })

    if (error) {
      // Unique constraint violation = duplicate, just ignore
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, action: 'exists' })
      }
      console.error('[product-suggest] Insert error:', error.message)
      return NextResponse.json({ ok: false, reason: error.message }, { status: 200 })
    }

    return NextResponse.json({ ok: true, action: 'created' })
  } catch (err: any) {
    console.error('[product-suggest] Error:', err.message)
    return NextResponse.json({ ok: false, reason: 'server_error' }, { status: 200 })
  }
}
