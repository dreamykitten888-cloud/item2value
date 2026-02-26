import { NextRequest, NextResponse } from 'next/server'
import { matchProduct } from '@/lib/product-db'

export const maxDuration = 10

/**
 * GET /api/ebay-search?q=gucci+bag&limit=8
 *
 * Returns real eBay product suggestions by hitting the eBay Browse API
 * and extracting/deduplicating listing titles into clean product names.
 *
 * This makes the product search effectively infinite: anything on eBay is searchable.
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit')) || 8, 20)

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return NextResponse.json({ results: [], source: 'error' })
    }

    // Hit eBay proxy for real listings
    const res = await fetch(
      `${supabaseUrl}/functions/v1/ebay-proxy?q=${encodeURIComponent(query)}&limit=20`,
      { signal: AbortSignal.timeout(8000) }
    )

    if (!res.ok) {
      return NextResponse.json({ results: [], source: 'error' })
    }

    const data = await res.json()
    const items = data.items || []

    if (items.length === 0) {
      return NextResponse.json({ results: [], source: 'ebay_empty' })
    }

    // Extract and clean product suggestions from eBay listing titles
    const seen = new Set<string>()
    const results: { name: string; brand: string; category: string; emoji: string; price?: number; source: string }[] = []

    for (const item of items) {
      if (results.length >= limit) break

      const title = item.title as string
      if (!title) continue

      // Clean up eBay title: remove condition tags, sizes, "NEW", "AUTHENTIC", etc.
      const cleaned = cleanEbayTitle(title)
      const dedupeKey = cleaned.toLowerCase().replace(/[^a-z0-9]/g, '')

      // Skip duplicates (fuzzy: ignore spaces/punctuation)
      if (seen.has(dedupeKey)) continue

      // Skip very short or very long titles
      if (cleaned.length < 5 || cleaned.length > 80) continue

      seen.add(dedupeKey)

      // Try to match against our local brand DB for category/emoji
      const match = matchProduct(cleaned)

      // Extract price if available
      const priceObj = item.price as Record<string, unknown> | undefined
      const price = priceObj?.value ? Number(priceObj.value) : undefined

      results.push({
        name: cleaned,
        brand: match?.brand || extractBrandFromTitle(cleaned, query),
        category: match?.category || guessCategoryFromTitle(cleaned),
        emoji: match?.emoji || guessCategoryEmoji(cleaned),
        price,
        source: 'ebay',
      })
    }

    return NextResponse.json({ results, source: 'ebay' })
  } catch (e) {
    console.error('[ebay-search] Error:', e)
    return NextResponse.json({ results: [], source: 'error' })
  }
}

/**
 * Clean up eBay listing titles into proper product names.
 * eBay sellers stuff titles with keywords like "NEW AUTHENTIC 100% GENUINE"
 */
function cleanEbayTitle(title: string): string {
  // Remove common eBay noise words/phrases
  const noisePatterns = [
    /\b(NEW|USED|PRE-OWNED|PREOWNED|NWT|NWOT|NWB|NIB|NWOB)\b/gi,
    /\b(AUTHENTIC|100%|GENUINE|REAL|ORIGINAL|OFFICIAL)\b/gi,
    /\b(FREE SHIP(PING)?|FAST SHIP(PING)?|SHIPS FREE)\b/gi,
    /\b(RARE|HTF|HARD TO FIND|SOLD OUT|LIMITED|EDITION)\b/gi,
    /\b(MSRP|RETAIL|RRP)\s*\$?\d+/gi,
    /\b(SIZE|SZ)\s*\d+(\.\d+)?\s*(US|UK|EU|CM|M|L|S|XS|XL|XXL)?\b/gi,
    /\b(MENS?|WOMENS?|UNISEX|BOYS?|GIRLS?|KIDS?|YOUTH)\b/gi,
    /\b(BRAND NEW|LIKE NEW|MINT|EXCELLENT|GOOD|FAIR)\b/gi,
    /[!*~#]+/g,
    /\s{2,}/g,
  ]

  let cleaned = title
  for (const pattern of noisePatterns) {
    cleaned = cleaned.replace(pattern, ' ')
  }

  // Trim and normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  // Title case it for cleaner display
  cleaned = cleaned
    .split(' ')
    .map(word => {
      if (word.length <= 2) return word.toUpperCase() // Keep short words uppercase (GG, LV, etc.)
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')

  return cleaned
}

/**
 * Try to extract a brand name from the title based on the search query.
 * If the user searched "gucci bag", the brand is likely "Gucci".
 */
function extractBrandFromTitle(title: string, query: string): string {
  // Take the first 1-2 words as a brand guess
  const words = query.trim().split(/\s+/)
  if (words.length > 0) {
    const guess = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase()
    if (title.toLowerCase().includes(words[0].toLowerCase())) {
      return guess
    }
  }
  return ''
}

/**
 * Guess category from title keywords
 */
function guessCategoryFromTitle(title: string): string {
  const lower = title.toLowerCase()
  if (/\b(heel|pump|boot|sandal|mule|loafer|shoe|sneaker|slipper|flat)\b/.test(lower)) return 'Shoes'
  if (/\b(bag|tote|clutch|purse|wallet|handbag|crossbody|satchel|backpack)\b/.test(lower)) return 'Bags'
  if (/\b(dress|skirt|blouse|top|jacket|coat|pant|jean|shirt|hoodie|sweater|cardigan)\b/.test(lower)) return 'Clothing'
  if (/\b(watch|chronograph)\b/.test(lower)) return 'Watches'
  if (/\b(ring|necklace|bracelet|earring|pendant)\b/.test(lower)) return 'Jewelry'
  if (/\b(perfume|cologne|fragrance|eau de)\b/.test(lower)) return 'Fragrance'
  if (/\b(sunglasses|glasses|frames)\b/.test(lower)) return 'Accessories'
  return 'Clothing'
}

function guessCategoryEmoji(title: string): string {
  const cat = guessCategoryFromTitle(title)
  const emojiMap: Record<string, string> = {
    'Shoes': '👠',
    'Bags': '👜',
    'Clothing': '👗',
    'Watches': '⌚',
    'Jewelry': '💍',
    'Fragrance': '🧴',
    'Accessories': '🕶️',
    'Sneakers': '👟',
  }
  return emojiMap[cat] || '👗'
}
