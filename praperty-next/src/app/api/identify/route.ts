import { NextRequest, NextResponse } from 'next/server'

// Vercel: allow longer timeout for AI calls
export const maxDuration = 30

/**
 * POST /api/identify
 * Accepts a base64 image, sends it to OpenAI GPT-4o-mini vision,
 * and returns structured product identification data.
 *
 * Circle Hand style: snap → AI identifies → auto-fill everything
 */

const SYSTEM_PROMPT = `You are the world's best product identification expert for PrÄperty, a personal inventory and resale tracker.
Users photograph items they own and you identify them with extreme specificity.

Return ONLY a JSON object:
{
  "name": "Full product name with generation/version/mark/year (e.g. Canon PowerShot G1 X Mark II, 2014 Nissan Skyline GT-R R34 V-Spec II)",
  "brand": "Brand name",
  "model": "Exact model with variant (e.g. G1 X Mark II, GT-R R34 V-Spec II, Air Jordan 4 Retro Bred 2019)",
  "category": "One of: Sneakers, Watches, Electronics, Clothing, Bags, Jewelry, Trading Cards, Collectibles, Instruments, Gaming, Furniture, Art, Automotive, Sports, Tools, Books, Home, Music, Other",
  "condition": "New, Like New, Good, Fair, or Poor",
  "emoji": "A single emoji",
  "estimatedValue": 0,
  "confidence": 0.0,
  "description": "One sentence with key identifying details"
}

CRITICAL RULES FOR SPECIFICITY:
- ALWAYS identify the exact generation, version, mark, revision, or year. "Canon G1 X Mark II" not "Canon G1 X". "iPhone 15 Pro Max" not "iPhone".
- Look for subtle design differences between generations: button placement, screen size, body shape, port types, lens rings, badge styles
- Read ALL visible text: model numbers, serial plates, version stickers, year stamps, spec badges
- For cameras: identify the exact Mark/generation from body design, dial layout, viewfinder hump, grip shape
- For electronics: identify storage size, color name, chipset generation when visible

AUTOMOTIVE EXPERTISE:
- Identify exact year, make, model, trim, and generation (e.g. "2002 Nissan Skyline GT-R R34 V-Spec II Nur")
- Know JDM cars: Skyline, Supra, RX-7, NSX, Silvia, Evo, STI, AE86, S2000, 240SX, Z cars
- Distinguish generations: R32 vs R33 vs R34, A80 vs A90 Supra, FD vs FC RX-7, NA1 vs NA2 NSX
- Identify from tail lights, body kits, wheel designs, hood vents, badge placement, exhaust tips
- For parts: identify the specific part, fitment (what car it's for), OEM vs aftermarket, brand if visible
- estimatedValue for cars = rough market value (KBB/Hagerty range). For JDM, use current US import market prices.
- estimatedValue for parts = typical eBay/marketplace price

GENERAL RULES:
- Be obsessively specific. "Owala FreeSip 24oz Lilac" beats "water bottle". "Pokemon Cubone Plush 8in" beats "stuffed animal"
- estimatedValue = current market/resale value in USD (number, no $). 0 if truly unknown.
- confidence = how sure you are (0.0 to 1.0). Lower it if you can't distinguish between versions.
- If multiple generations look similar, mention which ones in description and lower confidence
- ALWAYS return valid JSON. Nothing else.`

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Try OpenAI first, fall back to Gemini
    const openaiKey = process.env.OPENAI_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY

    if (!openaiKey && !geminiKey) {
      return NextResponse.json(
        { error: 'AI not configured. Add OPENAI_API_KEY or GEMINI_API_KEY to environment variables.' },
        { status: 503 }
      )
    }

    // Strip data URL prefix, extract mime type and base64
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/)
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
    const base64 = image.replace(/^data:image\/\w+;base64,/, '')

    // ─── Try OpenAI (primary) ─────────────────
    if (openaiKey) {
      console.log('[identify] Trying OpenAI gpt-4o-mini')
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mimeType};base64,${base64}`,
                      detail: 'auto',
                    },
                  },
                  { type: 'text', text: 'Examine every detail: logos, text, labels, serial numbers, body shape, button layout, generation-specific design cues, badges, trim levels. Identify the EXACT product with version/mark/generation/year. If it is a vehicle or vehicle part, include year, make, model, trim, and generation code. Return only JSON.' },
                ],
              },
            ],
            max_tokens: 600,
            temperature: 0.1,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const raw = data.choices?.[0]?.message?.content?.trim() || ''
          const parsed = parseJSON(raw)
          if (parsed) {
            console.log('[identify] OpenAI success:', parsed.name)
            return NextResponse.json(formatResult(parsed))
          }
        } else {
          const err = await response.text()
          console.error('[identify] OpenAI error:', response.status, err)
        }
      } catch (e) {
        console.error('[identify] OpenAI fetch error:', e)
      }
    }

    // ─── Try Gemini (fallback) ─────────────────
    if (geminiKey) {
      console.log('[identify] Trying Gemini 2.0 Flash')
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: SYSTEM_PROMPT + '\n\nIdentify this item. Return only JSON.' },
              ],
            }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
          const parsed = parseJSON(raw)
          if (parsed) {
            console.log('[identify] Gemini success:', parsed.name)
            return NextResponse.json(formatResult(parsed))
          }
        } else {
          const err = await response.text()
          console.error('[identify] Gemini error:', response.status, err)
        }
      } catch (e) {
        console.error('[identify] Gemini fetch error:', e)
      }
    }

    return NextResponse.json(
      { error: 'AI identification failed. Try again with a clearer photo.' },
      { status: 502 }
    )
  } catch (e) {
    console.error('[identify] Error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Parse JSON from AI response (handles markdown code blocks)
function parseJSON(raw: string): Record<string, unknown> | null {
  if (!raw) return null
  try {
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    console.error('[identify] JSON parse failed:', raw.substring(0, 200))
    return null
  }
}

// Normalize the parsed result
function formatResult(parsed: Record<string, unknown>) {
  return {
    name: (parsed.name as string) || '',
    brand: (parsed.brand as string) || '',
    model: (parsed.model as string) || '',
    category: (parsed.category as string) || 'Other',
    condition: (parsed.condition as string) || 'Good',
    emoji: (parsed.emoji as string) || '📦',
    estimatedValue: (parsed.estimatedValue as number) || 0,
    confidence: (parsed.confidence as number) || 0.5,
    description: (parsed.description as string) || '',
  }
}
