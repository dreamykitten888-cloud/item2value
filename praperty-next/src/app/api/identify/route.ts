import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/identify
 * Accepts a base64 image, sends it to Google Gemini (free tier),
 * and returns structured product identification data.
 *
 * Circle Hand style: snap → AI identifies → auto-fill everything
 */

const PROMPT = `You are a product identification expert for a personal inventory/resale app.
Users photograph items they own (sneakers, watches, electronics, bags, clothing, collectibles, etc.) and you identify them.

Given this photo, return ONLY a JSON object (no markdown, no code blocks, no explanation) with these fields:
{
  "name": "Full product name (e.g. Nike Air Jordan 4 Retro Bred)",
  "brand": "Brand name (e.g. Nike, Rolex, Apple)",
  "model": "Model name without brand (e.g. Air Jordan 4 Retro Bred)",
  "category": "One of: Sneakers, Watches, Electronics, Clothing, Bags, Jewelry, Trading Cards, Collectibles, Instruments, Gaming, Furniture, Art, Automotive, Sports, Tools, Books, Home, Music, Other",
  "condition": "Your best guess: New, Like New, Good, Fair, or Poor",
  "emoji": "A single emoji for this item category",
  "estimatedValue": 0,
  "confidence": 0.0,
  "description": "One sentence describing what you see"
}

RULES:
- Be specific. "Nike Dunk Low Panda" beats "Nike shoes"
- "Owala FreeSip 24oz" beats "water bottle"
- If you can read text, labels, tags, or serial numbers in the photo, USE that info
- estimatedValue = rough current resale/market value in USD (number, no $ sign). Use 0 if unknown.
- confidence = how sure you are (0.0 to 1.0)
- If you can't ID the exact product, give your best guess with lower confidence
- ALWAYS return valid JSON even if you're unsure. Never return empty or error text.`

// Models to try in order (fallback chain)
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
]

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI not configured. Add GEMINI_API_KEY to environment variables.' },
        { status: 503 }
      )
    }

    // Strip data URL prefix, extract mime type and base64
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/)
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
    const base64 = image.replace(/^data:image\/\w+;base64,/, '')

    let lastError = ''

    // Try each model in the fallback chain
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

      console.log(`[identify] Trying model: ${model}`)

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64,
                },
              },
              {
                text: PROMPT,
              },
            ],
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 500,
          },
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error(`[identify] ${model} error:`, response.status, errText)
        lastError = errText

        if (response.status === 429) {
          return NextResponse.json(
            { error: 'Rate limited. Wait a moment and try again.' },
            { status: 429 }
          )
        }

        // Try next model
        continue
      }

      const data = await response.json()
      console.log(`[identify] ${model} response received`)

      // Gemini response structure: candidates[0].content.parts[0].text
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

      if (!raw) {
        console.error(`[identify] ${model} returned empty response`)
        lastError = 'Empty response from AI'
        continue
      }

      let parsed
      try {
        // Clean up markdown wrapping if present
        const jsonStr = raw
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim()
        parsed = JSON.parse(jsonStr)
      } catch {
        console.error(`[identify] ${model} JSON parse failed:`, raw.substring(0, 200))
        lastError = 'Failed to parse AI response'
        continue
      }

      // Success!
      console.log(`[identify] Success with ${model}:`, parsed.name)
      return NextResponse.json({
        name: parsed.name || '',
        brand: parsed.brand || '',
        model: parsed.model || '',
        category: parsed.category || 'Other',
        condition: parsed.condition || 'Good',
        emoji: parsed.emoji || '📦',
        estimatedValue: parsed.estimatedValue || 0,
        confidence: parsed.confidence || 0.5,
        description: parsed.description || '',
      })
    }

    // All models failed
    console.error('[identify] All models failed. Last error:', lastError)
    return NextResponse.json(
      { error: 'AI identification failed. Try again with a clearer photo.' },
      { status: 502 }
    )
  } catch (e) {
    console.error('[identify] Error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
