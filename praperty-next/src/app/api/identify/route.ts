import { NextRequest, NextResponse } from 'next/server'

// Allow larger body for base64 images
export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
}
export const maxDuration = 30 // seconds (Vercel timeout)

/**
 * POST /api/identify
 * Accepts a base64 image, sends it to OpenAI GPT-4o-mini vision,
 * and returns structured product identification data.
 *
 * Circle Hand style: snap → AI identifies → auto-fill everything
 */

const SYSTEM_PROMPT = `You are a product identification expert for a personal inventory/resale app called PrÄperty.
Users photograph items they own (sneakers, watches, electronics, bags, clothing, collectibles, water bottles, plushies, etc.) and you identify them.

Given a photo, return ONLY a JSON object with these fields:
{
  "name": "Full product name (e.g. Nike Air Jordan 4 Retro Bred)",
  "brand": "Brand name (e.g. Nike, Rolex, Apple, Owala, Pokemon)",
  "model": "Model name without brand (e.g. Air Jordan 4 Retro Bred, FreeSip 24oz)",
  "category": "One of: Sneakers, Watches, Electronics, Clothing, Bags, Jewelry, Trading Cards, Collectibles, Instruments, Gaming, Furniture, Art, Automotive, Sports, Tools, Books, Home, Music, Other",
  "condition": "Your best guess: New, Like New, Good, Fair, or Poor",
  "emoji": "A single emoji for this item",
  "estimatedValue": 0,
  "confidence": 0.0,
  "description": "One sentence describing what you see"
}

RULES:
- Be specific. "Owala FreeSip 24oz Lilac" beats "water bottle"
- "Pokemon Cubone Plush 8 inch" beats "stuffed animal"
- If you can read text, labels, tags, or serial numbers, USE that info
- estimatedValue = rough current market/resale value in USD (number, no $). Use 0 if truly unknown.
- confidence = how sure you are (0.0 to 1.0)
- If you can't ID the exact product, give your best guess with lower confidence
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
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mimeType};base64,${base64}`,
                      detail: 'low',
                    },
                  },
                  { type: 'text', text: 'Identify this item. Return only JSON.' },
                ],
              },
            ],
            max_tokens: 400,
            temperature: 0.2,
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
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`
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
            generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
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
