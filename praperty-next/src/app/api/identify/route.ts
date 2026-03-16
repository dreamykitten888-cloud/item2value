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

AUTOMOTIVE EXPERTISE (VEHICLES):
- Identify exact year, make, model, trim, and generation (e.g. "2002 Nissan Skyline GT-R R34 V-Spec II Nur")
- Know JDM cars: Skyline (R31/R32/R33/R34/R35), Supra (A70/A80/A90), RX-7 (SA/FB/FC/FD), NSX (NA1/NA2/NC1), Silvia (S13/S14/S15), 180SX, 240SX, Evo (I-X), STI (GC8/GDB/GRB/VAB), AE86 (Trueno/Levin), S2000 (AP1/AP2), Z cars (S30/Z31/Z32/Z33/Z34/RZ34), Chaser/Mark II (JZX90/JZX100), Soarer, Aristo, Stagea, CRX, Integra (DC2/DC5), Beat, Cappuccino, Copen
- Know Euro cars: BMW (2002/E30/E36/E46/E90/E92/F80/G80 M3, E39/E60/F90 M5), Porsche (356/964/993/996/997/991/992, 944/928, Cayman/Boxster), Mercedes AMG (190E Evo/C63/E63/GT/G63), VW (Mk1-Mk8 GTI/R, Corrado, R32), Audi (B5/B8 S4/RS4, RS3, TTRS, R8), Alfa Romeo, Lancia (Delta Integrale/Stratos), Volvo (240/850)
- Know Domestic cars: Ford (Mustang generations, GT, Focus RS, Bronco, Raptor), Chevy (Corvette C1-C8, Camaro ZL1/Z28/SS), Dodge (Challenger/Charger Hellcat/Demon, Viper GTS/ACR), Pontiac (GTO/Firebird/Trans Am), Tesla (Model S/3/Y/X Plaid)
- Distinguish generations: R32 vs R33 vs R34, A80 vs A90 Supra, FD vs FC RX-7, NA1 vs NA2 NSX, E46 vs E92 M3, 997 vs 991 GT3
- Identify from tail lights, body kits, wheel designs, hood vents, badge placement, exhaust tips, fender flares, bumper design
- estimatedValue for cars = rough market value (KBB/Hagerty range). For JDM, use current US import market prices.

AUTOMOTIVE EXPERTISE (AFTERMARKET & OEM PARTS):
- Identify the exact part: brand, model/series, and fitment (what car it is for)
- TURBO: Know Garrett (GTX/G-series by size: G25/G30/G35), BorgWarner EFR, Precision Turbo, HKS GT-series turbo kits. Identify by compressor housing, CHRA, inlet size, wastegate style.
- ENGINE INTERNALS: Identify forged pistons (CP, Wiseco, JE), rods (Manley, Eagle, Brian Crower), camshafts (Tomei Poncam, HKS, BC, Skunk2), head gaskets (Cometic MLS). Note the engine code fitment (RB26, 2JZ, SR20, B/K series, EJ, 4G63, LS).
- INTAKE/MANIFOLD: Skunk2 Ultra Series, GReddy intake plenums, HKS racing suction kits. Know the difference between plenum, throttle body, and velocity stacks.
- ECU/ENGINE MANAGEMENT: Haltech (Elite, Nexus), Link ECU (G4X), AEM (Infinity), MoTeC (M1, M150), GReddy e-Manage. Identify from display, connector count, case design.
- EXHAUST: Invidia (N1, Q300, Gemini), Fujitsubo (Legalis R), Tomei (Expreme Ti), HKS (Hi-Power, Silent Hi-Power), Borla (ATAK, S-Type), MagnaFlow. Identify from tip design, canister shape, piping diameter.
- SUSPENSION: Coilovers by brand and tier: Tein (Flex Z / Mono Sport / Super Racing), KW (V1/V2/V3/Clubsport), Ohlins (Road & Track, DFV), BC Racing (BR/DR), Fortune Auto, Bilstein (B14/B16). Also sway bars (Cusco, Whiteline, Eibach), strut braces, control arms.
- BRAKES: Brembo (GT, Gran Turismo 4/6 piston), StopTech (ST-40/ST-60), Wilwood, AP Racing. Brake pads: Project Mu (HC+, Club Racer), Endless (MX72, SSM), EBC (Yellowstuff, Bluestuff). Identify caliper piston count, rotor style (slotted/drilled/plain).
- WHEELS: Japanese forged: Volk Racing (TE37, CE28N, ZE40), Work (Meister S1, Emotion D9R, VS-XX), Enkei (RPF1, NT03), Gram Lights (57DR, 57CR), WedsSport (TC105X), SSR, Advan (GT, RG). Euro: BBS (LM, RS-GT, RI-A, FI-R). US: Rotiform, Fifteen52, Cosmis. Identify by spoke pattern, center cap, lip style, piece count (1pc/2pc/3pc).
- DRIVETRAIN: Clutch kits (Exedy, ACT, Competition Clutch, OS Giken), LSD (Kaaz, OS Giken, Nismo, Cusco), shifter (TRD, Mugen).
- BODY/AERO: Widebody kits (Rocket Bunny, Pandem, Varis), carbon fiber (Seibon hoods/trunks), GT wings (Voltex Type 5/7, APR GTC-300/500), front lips, splitters. Identify by fender bolt pattern, ducting, carbon weave pattern (1x1 vs 2x2 twill).
- INTERIOR: Seats (Bride ZETA/Stradia/Vios, Recaro, Sparco), steering wheels (Momo Prototipo, Nardi Classic/Deep Corn), harnesses (Takata, Sabelt), quick release hubs (NRG, Works Bell).
- GAUGES: Defi (Advance BF/CR/A1), AEM (X-Series wideband), Innovate (MTX-L). Identify by face color, bezel, gauge type (boost, oil temp, oil pressure, wideband AFR).
- FUEL: Injectors (Injector Dynamics ID1050X/1700X/2600X), fuel pumps (DeatschWerks DW300/DW400, Walbro 255/450), fuel rails, regulators.
- TIRES: Yokohama (Advan Neova AD09, A052), Toyo (R888R, Proxes Sport), Nitto (NT555/NT05), Federal (595RS-RR), Michelin (Pilot Sport 4S/Cup 2). Identify by tread pattern, sidewall markings.
- OEM PERFORMANCE: Nismo (S-Tune, R-Tune, aero), TRD, Mugen (intake, exhaust, hardtop), STI (flexible tower bar, short shifter), Ralliart. Know that these command premium prices.
- estimatedValue for parts = typical eBay/marketplace/vendor price. Rare JDM parts (discontinued Nismo, Mugen, etc.) can be worth significantly more.
- If you cannot identify the exact part: still return part type (e.g. turbocharger, coilover, wheel), any visible brand logos, part numbers, or casting marks, and fitment if visible. Use description to list what you see. Lower confidence accordingly.

CAMERAS & LENSES:
- Read ALL text on the body and lens: model name is often engraved on the front (camera) or around the barrel (lens). Look for badge, dial engravings, and baseplate.
- BODIES: Canon (EOS R/R5/R6/R3, 5D/5Ds, 6D, 90D, Rebel/SL series; PowerShot G1 X Mark II/III), Nikon (Z8/Z9/Z6/Z7, D850/D780/D750, D3xxx/D5xxx), Sony (A7/A9 series: A7 IV, A7R V, A1; A6xxx), Fujifilm (X-T5/X-T4, X-H2/X-H2S, X-S10, GFX), Olympus/OM System (OM-1/OM-5, E-M1/E-M5), Panasonic (S5/S1, GH5/GH6, G9), Leica (M10/M11, Q2/Q3, SL2/SL3), Pentax (K-3 III, K-1).
- LENSES: Identify mount (RF, EF, Z, E, X, M43, L), focal length and aperture on barrel (e.g. 24-70mm 1:2.8), and line (Canon L red ring, Nikon gold ring, Sony G Master, Sigma Art, Tamron G2). Kit lens vs premium. Example: "Canon RF 24-70mm F2.8 L IS USM".
- name should include body + lens if both visible (e.g. "Canon EOS R5 with RF 24-70mm F2.8 L"). For lens-only shots, name is the full lens name with focal length and aperture.
- estimatedValue: bodies and lenses have strong resale; check generation (Mark I vs II) and condition.

CLOTHING & APPAREL:
- Read tags and labels: size, material, style code, country of manufacture. Neck tags, wash/care labels, and (for sneakers) box label, size tag, and style code (e.g. Nike DM0035-001).
- BRANDS: Streetwear (Supreme, Bape, Stüssy, Palace, Kith, Off-White, Fear of God), luxury (Gucci, Louis Vuitton, Balenciaga, Prada, Dior, Burberry), vintage (Levi's 501, Carhartt, Champion), athletic (Nike, Adidas, Jordan, Yeezy). Identify collabs and limited drops when possible.
- SNEAKERS: Model name + colorway + year/variant (e.g. "Nike Air Jordan 4 Retro Bred 2019", "Adidas Yeezy Boost 350 V2 Zebra"). Look for style code on size tag. Condition: deadstock, VNDS, used.
- APPAREL: "Brand + Type + key detail" (e.g. "Supreme Box Logo Hoodie FW21 Grey", "Levi's 501 Original Fit Jeans"). Note vintage vs reissue, condition (NWT, pre-owned, fading, holes).
- category: use "Sneakers" for shoes, "Clothing" for tops/bottoms/outerwear/accessories. condition reflects wear (New, Like New, Good, Fair, Poor).
- estimatedValue: resale for hype/limited; vintage and luxury hold value. Use description for style code or identifying details if visible.

ART & COLLECTIBLES:
- Identify medium: oil, acrylic, watercolor, print (giclée, screen print, lithograph), photograph, sculpture, mixed media, poster.
- Look for signature (signature, monogram, stamp), edition info (e.g. "12/100", "AP", "artist proof"), title, and date if visible. Frame style (gallery, ornate) can help with era.
- If artist is known: "Artist Name, Title, medium, year if visible" (e.g. "Banksy, Girl with Balloon, screen print"). If unknown: describe subject and style; use "Unknown artist" or "Attributed to [style]". estimatedValue 0 if unknown; for known artists or limited editions give a range.
- category: "Art" for paintings, prints, sculptures, photographs; "Collectibles" for figurines, limited merch, etc.
- Be conservative with attribution: only name an artist if clearly signed or unmistakable. Otherwise describe and lower confidence.

GENERAL RULES:
- Be obsessively specific. "Owala FreeSip 24oz Lilac" beats "water bottle". "Pokemon Cubone Plush 8in" beats "stuffed animal"
- estimatedValue = current market/resale value in USD (number, no $). 0 if truly unknown.
- confidence = how sure you are (0.0 to 1.0). Lower it if you can't distinguish between versions.
- If multiple generations look similar, mention which ones in description and lower confidence
- ALWAYS return valid JSON. Nothing else.`

const CATEGORY_HINT_LABELS: Record<string, string> = {
  camera: 'Camera or camera lens',
  clothing: 'Clothing, sneakers, or apparel',
  art: 'Art piece (painting, print, sculpture, photograph)',
  car_parts: 'Vehicle or automotive part',
  other: 'Other / general item',
}

export async function POST(req: NextRequest) {
  try {
    const { image, categoryHint } = await req.json() as { image?: string; categoryHint?: string }

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const hintLabel = categoryHint && CATEGORY_HINT_LABELS[categoryHint]
    const categoryHintInstruction = hintLabel
      ? ` The user indicated this item is likely: ${hintLabel}. Prioritize identification rules for that category and read any visible text (model numbers, tags, signatures, part numbers) accordingly.`
      : ''

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
                      detail: 'high',
                    },
                  },
                  { type: 'text', text: 'Examine every detail and return only JSON. Read all visible text: logos, labels, tags, serial numbers, model names, style codes. For cameras/lenses: read engravings on body and lens barrel (model, focal length, aperture). For clothing: read neck tags, wash labels, size tags, style codes. For art: look for signature, edition (e.g. x/100), medium, title. For car parts: part numbers, casting marks, brand logos, fitment. Identify EXACT product with version/mark/generation/year where applicable. If uncertain, describe what you see and lower confidence.' + categoryHintInstruction },
                ],
              },
            ],
            max_tokens: 800,
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
                { text: SYSTEM_PROMPT + '\n\nIdentify this item. Return only JSON.' + categoryHintInstruction },
              ],
            }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
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
