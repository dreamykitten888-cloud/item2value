import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/identify
 * Accepts a base64 image, sends it to Google Gemini 2.0 Flash (free tier),
 * and returns structured product identification data.
 *
 * Circle Hand style: snap → AI identifies → auto-fill everything
 */

const PROMPT = `You are a product identification expert for a personal inventory/resale app.
Users photograph items they own (sneakers, watches, electronics, bags, clothing, collectibles, etc.) and you identify them.

Given this photo, return ONLY a JSON object (no markdown, no code blocks) with these fields:
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
- If you can read text, labels, tags, or serial numbers in the photo, USE that info
- estimatedValue = rough current resale/market value in USD (number, no $ sign). Use 0 if unknown.
- confidence = how sure you are (0.0 to 1.0)
- If you can't ID the exact product, give your best guess with lower confidence
- Return ONLY valid JSON. No explanation, no markdown.`

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

    // Gemini API: generateContent with inline image
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`

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
          maxOutputTokens: 400,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[identify] Gemini error:', response.status, errText)

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limited. Wait a moment and try again.' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: 'AI identification failed. Try again.' },
        { status: 502 }
      )
    }

    const data = await response.json()

    // Gemini response structure: candidates[0].content.parts[0].text
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    let parsed
    try {
      // Clean up potential markdown wrapping just in case
      const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(jsonStr)
    } catch {
      console.error('[identify] Failed to parse Gemini response:', raw)
      return NextResponse.json(
        { error: 'Could not parse AI response. Try again with a clearer photo.' },
        { status: 500 }
      )
    }

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
  } catch (e) {
    console.error('[identify] Error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
