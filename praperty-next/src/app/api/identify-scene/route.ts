import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

/**
 * POST /api/identify-scene
 * Multi-object scene analysis: salient items with rough USD value and normalized anchor points (0–1).
 */

const SCENE_SYSTEM_PROMPT = `You are a product spotter for PrÄperty, a personal inventory app.
The user is panning a live camera across a room. Identify DISTINCT, salient physical objects visible in the frame (furniture, electronics, decor, bags, watches, art, collectibles, etc.).

Return ONLY valid JSON in this exact shape:
{
  "items": [
    {
      "label": "Short readable name (max ~8 words)",
      "estimatedValueUSD": 0,
      "category": "One of: Sneakers, Watches, Electronics, Clothing, Bags, Jewelry, Trading Cards, Collectibles, Instruments, Gaming, Furniture, Art, Automotive, Sports, Tools, Books, Home, Music, Other",
      "confidence": 0.0,
      "anchor": { "x": 0.5, "y": 0.5 }
    }
  ]
}

Rules:
- anchor.x and anchor.y are normalized 0–1 relative to the IMAGE width and height (left/top origin). Point (anchor.x, anchor.y) should be near the visual center of that object.
- Return 3 to 12 items when the scene is busy; fewer if only a couple of objects are clearly visible. Skip tiny background clutter.
- estimatedValueUSD = rough current resale/market USD (integer). Use 0 only if unknown.
- confidence: 0.0–1.0 per item.
- Do not include people, faces, or pets as items.
- Be specific in labels when possible: "Samsung Frame TV 55\"" not just "TV".
- ALWAYS return valid JSON only, no markdown.`

export interface SceneItemRaw {
  label: string
  estimatedValueUSD: number
  category: string
  confidence: number
  anchor: { x: number; y: number }
}

function parseJSON(raw: string): Record<string, unknown> | null {
  if (!raw) return null
  try {
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    console.error('[identify-scene] JSON parse failed:', raw.substring(0, 200))
    return null
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0.5
  return Math.min(1, Math.max(0, n))
}

function normalizeItems(parsed: Record<string, unknown>): SceneItemRaw[] {
  const raw = parsed.items
  if (!Array.isArray(raw)) return []
  const out: SceneItemRaw[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const label = String(o.label || '').trim() || 'Item'
    const estimatedValueUSD = typeof o.estimatedValueUSD === 'number' ? Math.round(o.estimatedValueUSD) : 0
    const category = String(o.category || 'Other')
    const confidence = typeof o.confidence === 'number' ? o.confidence : 0.5
    const a = o.anchor
    let x = 0.5
    let y = 0.5
    if (a && typeof a === 'object') {
      const ax = (a as Record<string, unknown>).x
      const ay = (a as Record<string, unknown>).y
      x = typeof ax === 'number' ? ax : 0.5
      y = typeof ay === 'number' ? ay : 0.5
    }
    out.push({
      label,
      estimatedValueUSD,
      category,
      confidence,
      anchor: { x: clamp01(x), y: clamp01(y) },
    })
  }
  return out.slice(0, 15)
}

export async function POST(req: NextRequest) {
  try {
    const { image } = (await req.json()) as { image?: string }

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY

    if (!openaiKey && !geminiKey) {
      return NextResponse.json(
        { error: 'AI not configured. Add OPENAI_API_KEY or GEMINI_API_KEY to environment variables.' },
        { status: 503 }
      )
    }

    const mimeMatch = image.match(/^data:(image\/\w+);base64,/)
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
    const base64 = image.replace(/^data:image\/\w+;base64,/, '')

    const userText =
      'List distinct salient objects in this frame with anchor points (normalized 0-1) for each object center and rough resale USD. Return only JSON.'

    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: SCENE_SYSTEM_PROMPT },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mimeType};base64,${base64}`,
                      detail: 'high',
                    },
                  },
                  { type: 'text', text: userText },
                ],
              },
            ],
            max_tokens: 1200,
            temperature: 0.2,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const raw = data.choices?.[0]?.message?.content?.trim() || ''
          const parsed = parseJSON(raw)
          if (parsed) {
            const items = normalizeItems(parsed)
            console.log('[identify-scene] OpenAI success:', items.length, 'items')
            return NextResponse.json({ items })
          }
        } else {
          const err = await response.text()
          console.error('[identify-scene] OpenAI error:', response.status, err)
        }
      } catch (e) {
        console.error('[identify-scene] OpenAI fetch error:', e)
      }
    }

    if (geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inlineData: { mimeType, data: base64 } },
                  { text: `${SCENE_SYSTEM_PROMPT}\n\n${userText}` },
                ],
              },
            ],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1200 },
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
          const parsed = parseJSON(raw)
          if (parsed) {
            const items = normalizeItems(parsed)
            console.log('[identify-scene] Gemini success:', items.length, 'items')
            return NextResponse.json({ items })
          }
        } else {
          const err = await response.text()
          console.error('[identify-scene] Gemini error:', response.status, err)
        }
      } catch (e) {
        console.error('[identify-scene] Gemini fetch error:', e)
      }
    }

    return NextResponse.json(
      { error: 'Scene identification failed. Try again with better lighting.' },
      { status: 502 }
    )
  } catch (e) {
    console.error('[identify-scene] Error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
