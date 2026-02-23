# PrAperty Process Document
**Last updated:** February 23, 2026 | **Version:** v2.6.0-feb23

---

## What is PrAperty?

"E-Trade for your stuff." A mobile-first portfolio tracker for personal items (sneakers, watches, electronics, bags, collectibles, etc.). Users snap a photo, AI identifies the item, and the app tracks value, comps, and resale potential.

**Live URL:** https://praperty.vercel.app
**Repo:** GitHub (pushed from `~/Documents/No Code Projects/praperty/praperty-next`)
**Owner:** Kitty (kittyisrando@gmail.com)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14.2.21 (App Router) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS 3.4 + custom CSS vars |
| State | Zustand 5.0 |
| Auth | Supabase Auth (localStorage persistence) |
| Database | Supabase Postgres |
| AI (primary) | OpenAI GPT-4o Vision API |
| AI (fallback) | Google Gemini 2.5 Flash |
| Barcode lookup | UPC Item DB (free trial API) |
| Barcode scanner | @yudiel/react-qr-scanner (BROKEN, needs replacement) |
| Icons | Lucide React |
| Hosting | Vercel |

---

## Project Structure

```
praperty-next/
  src/
    app/
      page.tsx                    # Root: auth gate (loading -> AuthScreen -> AppShell)
      layout.tsx                  # Root layout
      globals.css                 # Tailwind + custom CSS vars (Copper Forest palette)
      api/
        identify/
          route.ts                # AI photo identification endpoint (OpenAI + Gemini)
    components/
      app-shell.tsx               # Main app wrapper: nav, FAB, bottom sheet, screen router
      auth-screen.tsx             # Sign in / Sign up / Forgot password
      screens/
        home-screen.tsx           # Dashboard: portfolio value, top gainers, alerts
        inventory-screen.tsx      # Item grid/list view
        detail-screen.tsx         # Single item detail with comps, price history
        add-item-screen.tsx       # Add new item form (receives scanData from scan)
        edit-item-screen.tsx      # Edit existing item
        scan-screen.tsx           # AI Photo mode + Barcode mode
        discover-screen.tsx       # Browse/research marketplace
        research-screen.tsx       # Deep dive on a product
        pricing-screen.tsx        # Pricing tools
        settings-screen.tsx       # User settings, sign out
        setup-screen.tsx          # 2-step onboarding for first-time users
        sold-items-screen.tsx     # Track sold items
        alerts-screen.tsx         # Smart alerts (price changes, action items)
        watchlist-screen.tsx      # Items you're watching
    lib/
      supabase.ts                 # Supabase client (createClient + localStorage)
    stores/
      auth-store.ts               # Auth state (Zustand): user, session, profile, initialize
      items-store.ts              # Items + watchlist state: CRUD, eBay comps, community search
    types/
      index.ts                    # App types: Item, Profile, Comp, Screen, etc.
      database.ts                 # Supabase generated types
  .env.local                      # API keys (see Environment Variables section)
  package.json
  tailwind.config.ts
  tsconfig.json
```

---

## Environment Variables

### .env.local (local dev)
```
NEXT_PUBLIC_SUPABASE_URL=https://tzasuddushojjurbzqfe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-_rtEmLUuCfT6lgP-...  (server-side only)
GEMINI_API_KEY=AIzaSyAf0q4inOlB4FFJkv4vLoLsf0FCj1S2WhE  (server-side only)
```

### Vercel Environment Variables
Same keys as above. Both OPENAI_API_KEY and GEMINI_API_KEY are set in Vercel project settings.

**Important notes:**
- `NEXT_PUBLIC_` prefix = exposed to browser. Only Supabase URL and anon key use this.
- AI keys are server-side only (no NEXT_PUBLIC prefix). They're used in `/api/identify/route.ts`.
- Vercel "Sensitive" toggle only works for Production/Preview, not Development.
- User has $5 credits on OpenAI, paid account on Gemini.

---

## Design System: Copper Forest

Dark theme with warm amber accents and forest green undertones.

### CSS Variables (globals.css)
```css
--bg-primary: #0a0f0a        /* Deep forest black */
--bg-surface: #111a11        /* Card/surface background */
--amber-brand: #d4a574       /* Primary accent (copper/amber) */
--amber-light: #e8c49a       /* Lighter amber for hover */
--forest: #2d4a2d            /* Forest green */
--forest-mid: #4e7145        /* Mid forest green */
--text-primary: #ffffff
--text-dim: #8a9a8a          /* Muted text */
```

### Key Utility Classes
- `.gradient-amber` - amber gradient background (buttons, badges)
- `.glass` - frosted glass card (bg-white/5, backdrop-blur, border)
- `.glass-hover` - glass with hover state
- `.form-input` - styled input field
- `.text-dim` - muted text color
- `.text-amber-brand` - accent color

---

## Authentication Architecture

### How it works (v2.6.0)
1. `supabase.ts` creates a single Supabase client using `createClient` from `@supabase/supabase-js`
2. Auth sessions are persisted in **localStorage** under key `praperty-auth`
3. `auth-store.ts` (Zustand) is the single source of truth for auth state
4. `page.tsx` calls `store.initialize()` once on mount
5. `initialize()` sets up `onAuthStateChange` listener + 2s backup `getSession()` call
6. Page has a 5s safety timeout to force loading=false if auth is stuck

### Why localStorage (not cookies)
We switched from `@supabase/ssr`'s `createBrowserClient` (cookie-based) to `@supabase/supabase-js`'s `createClient` (localStorage) because:
- Cookie-based sessions were getting lost on every Vercel deploy
- Users were getting logged out after every push
- localStorage persists across deploys since it's browser-local storage, not tied to server state
- For a client-side SPA-style app, localStorage is more reliable

### Auth flow
```
page.tsx mount
  -> store.initialize()
    -> onAuthStateChange('INITIAL_SESSION')
      -> if session: set user + profile, loading=false
      -> if no session: loading=false (show AuthScreen)
    -> 2s backup: getSession() if still loading
  -> 5s safety: force loading=false
```

### Key files
- `src/lib/supabase.ts` - Client creation with localStorage config
- `src/stores/auth-store.ts` - Auth state management
- `src/app/page.tsx` - Auth gate (loading -> AuthScreen -> AppShell)
- `src/components/auth-screen.tsx` - Sign in/up/forgot UI

### Profile auto-creation
When a user signs in for the first time, `loadProfile()` in auth-store:
1. Queries `profiles` table by `auth_user_id`
2. If no row exists (PGRST116 error), auto-inserts a profile
3. Updates `last_login_at` on each login

---

## AI Photo Identification

### Architecture
```
User snaps photo
  -> scan-screen.tsx compresses image (canvas: 1200px max, JPEG 85%)
  -> POST /api/identify { image: base64 }
  -> route.ts tries OpenAI GPT-4o first
    -> if success: return parsed JSON
    -> if fail: try Gemini 2.5 Flash
  -> scan-screen.tsx shows product card with confidence bar
  -> User taps "Review & Save" -> add-item-screen with pre-filled data
```

### Image Compression
Phone photos are 5-10MB raw. We compress before sending:
- Max width: 1200px (maintains aspect ratio)
- Format: JPEG at 85% quality
- Result: ~300-500KB (well under Next.js 1MB body limit)
- Location: `compressImage()` function in `scan-screen.tsx`

### OpenAI Configuration (primary)
- Model: `gpt-4o` (NOT gpt-4o-mini, which was too inaccurate)
- Detail: `auto` (NOT `low`, which sent tiny thumbnails)
- Temperature: `0.1` (low for consistent identification)
- Max tokens: 500
- System prompt: detailed product identification expert prompt

### Gemini Configuration (fallback)
- Model: `gemini-2.5-flash` (NOT gemini-2.0-flash which was deprecated)
- Endpoint: `generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- Temperature: 0.2
- Max output tokens: 400
- Note: `responseMimeType: 'application/json'` was removed (caused issues)

### AI Response Format
```json
{
  "name": "Apple AirPods Max Silver",
  "brand": "Apple",
  "model": "AirPods Max",
  "category": "Electronics",
  "condition": "Like New",
  "emoji": "🎧",
  "estimatedValue": 425,
  "confidence": 0.92,
  "description": "Over-ear noise cancelling headphones with aluminum ear cups"
}
```

### JSON Parsing
AI responses sometimes come wrapped in markdown code blocks. `parseJSON()` strips them:
```typescript
const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
```

---

## Barcode Scanner (BROKEN)

### Current state
- Uses `@yudiel/react-qr-scanner` (dynamically imported, client-side only)
- Scanner component renders but fails to detect barcodes reliably
- This is a known issue with the library

### Barcode lookup API
- UPC Item DB: `https://api.upcitemdb.com/prod/trial/lookup?upc={code}`
- Free trial tier, returns product name, brand, images, price range
- Category mapping via `CAT_MAP` in scan-screen.tsx

### Planned fix
Replace `@yudiel/react-qr-scanner` with `html5-qrcode` which is more reliable.
This is the next task to implement.

---

## Navigation & Screens

### Screen types (defined in types/index.ts)
```typescript
type Screen = 'setup' | 'home' | 'inventory' | 'detail' | 'add-item' | 'edit-item'
  | 'scan' | 'discover' | 'research' | 'pricing' | 'sold-items' | 'alerts'
  | 'settings' | 'watchlist'
```

### Bottom nav tabs
- Home (left)
- Inventory (left)
- **+ Add** (center FAB, opens bottom sheet)
- Discover (right)
- Settings (right)

### Add Item Bottom Sheet (3 options)
1. **Snap a photo** (hero, gradient-amber, "NEW" badge) -> scan screen (AI photo mode)
2. **Scan barcode** (forest green) -> scan screen (barcode mode)
3. **Type it in** (glass style) -> add-item screen directly

### Tab hiding
Bottom nav is hidden on: scan, add-item, edit-item, and setup screens.

---

## Data Model

### Supabase Tables
- `profiles` - User profiles (id, auth_user_id, name, email, created_at, last_login_at)
- `items` - User inventory items (id, user_id, name, brand, model, category, condition, cost, asking, value, earnings, emoji, notes, photos, comps, price_history, date_purchased, date_sold, sold_platform, created_at)
- `watchlist` - Watched items (id, user_id, name, category, emoji, brand, model, target_price, last_known_price, price_history, added_at, linked_item_id)

### Key relationships
- `items.user_id` -> `profiles.id` (NOT auth_user_id)
- `watchlist.user_id` -> `profiles.id`
- `watchlist.linked_item_id` -> `items.id` (optional)

### JSON fields stored as strings
- `photos` - array of base64 data URLs or image URLs
- `comps` - array of Comp objects (title, price, url, source, date, condition)
- `price_history` - array of PriceSnapshot objects (date, value)

---

## State Management (Zustand)

### auth-store.ts
- `user`, `session`, `profile`, `profileId`, `loading`, `initialized`, `error`
- Actions: `initialize()`, `signUp()`, `signIn()`, `signOut()`, `sendMagicLink()`, `resetPassword()`, `loadProfile()`

### items-store.ts
- `items`, `watchlist`, `loading`
- `ebayComps`, `ebayLoading`, `ebayError`, `communityComps`
- Actions: `loadAll()`, `syncItem()`, `syncAllItems()`, `deleteItem()`
- `fetchEbayComps()`, `fetchCommunityComps()`, `searchCommunityItems()`
- `addCompToItem()`, `deleteCompFromItem()`, `recalcMarketFromComps()`

---

## Deployment & Build

### Build command
```bash
cd ~/Documents/No\ Code\ Projects/praperty/praperty-next
npm run build  # or: next build
```

### Push to production
```bash
git add -A && git commit -m "description" && git push
```
Vercel auto-deploys on push to main.

### Common build issues
1. **`export const config`** - Pages Router syntax, doesn't work in App Router. Use `export const maxDuration = 30` instead.
2. **SWC binary errors on Linux ARM** - Happens in VMs, use `npx tsc --noEmit` to type-check instead.
3. **Vercel env vars** - Must run `npx vercel link` before `npx vercel env add`.

### Version stamps
Version stamps appear in:
- `page.tsx` loading screen
- `auth-screen.tsx` bottom
- `auth-store.ts` console log
Current: `v2.6.0-feb23`

---

## Bug History & Fixes

### AI misidentification (AirPods Max -> Theragun)
- **Root cause:** `gpt-4o-mini` model + `detail: 'low'` sent tiny thumbnail
- **Fix:** Upgraded to `gpt-4o`, `detail: 'auto'`, better prompt, `temperature: 0.1`
- **Also:** Increased image compression quality from 800px/70% to 1200px/85%

### Users logged out on every deploy
- **Root cause:** `@supabase/ssr`'s `createBrowserClient` stores sessions in cookies, which can be invalidated on deploy
- **Fix:** Switched to `@supabase/supabase-js`'s `createClient` with localStorage persistence (`storageKey: 'praperty-auth'`)
- **Note:** Existing users need to re-login once after this change

### Gemini API quota zero
- **Root cause:** User created API key while VPN (Bitdefender) routed through EU; Google assigned zero quota
- **Fix:** Turn off VPN, or add a payment card to Gemini

### Gemini 2.0 Flash deprecated
- **Root cause:** `gemini-2.0-flash` returned 404 "no longer available to new users"
- **Fix:** Updated to `gemini-2.5-flash`

### OpenAI insufficient quota / missing scopes
- **Root cause:** Free tier had no credits; API key created with "Restricted" permissions
- **Fix:** Added $5 to OpenAI; created new key with "All" permissions

### Phone photos too large
- **Root cause:** Raw base64 photos 5-10MB, exceeding Next.js 1MB body limit
- **Fix:** Canvas-based compression (1200px max width, JPEG 85%)

---

## Pending Tasks

1. **Fix barcode scanner** - Replace `@yudiel/react-qr-scanner` with `html5-qrcode`
2. **Push v2.6.0 changes** - Auth fix + AI accuracy + timeout tweaks (ready to push)
3. **Resale API integrations** - StockX, GOAT, eBay Browse, Google Shopping, PriceCharting
4. **Better AI prompt tuning** - Test with more item types, improve accuracy
5. **Photo storage** - Currently base64 in JSON column; should move to Supabase Storage

---

## Dev Workflow Notes

### User's local setup
- Mac (Apple Silicon)
- Path: `~/Documents/No Code Projects/praperty/praperty-next`
- No VS Code installed (uses terminal + Cowork)
- Bitdefender VPN (can cause issues with Google APIs if routing through EU)

### Terminal commands reference
```bash
# Navigate to project
cd ~/Documents/No\ Code\ Projects/praperty/praperty-next

# Type-check
npx tsc --noEmit

# Build locally
npm run build

# Push to production
git add -A && git commit -m "msg" && git push

# Test API with curl
curl -s https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY" | head -c 200
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" | head -c 200

# Add Vercel env var
npx vercel link  # first time only
npx vercel env add VARIABLE_NAME
```

---

## Onboarding Flow (2-step)

1. **Step 1:** Welcome screen with value props
2. **Step 2:** Add first item prompt
3. Stored in localStorage: `praperty_setup_done = '1'`
4. Shows before AppShell content, handled in `app-shell.tsx`

---

## API Endpoints

### POST /api/identify
- **Input:** `{ image: "data:image/jpeg;base64,..." }`
- **Output:** `{ name, brand, model, category, condition, emoji, estimatedValue, confidence, description }`
- **Timeout:** 30s (Vercel `maxDuration`)
- **Error codes:** 400 (no image), 502 (AI failed), 503 (no API keys configured), 500 (server error)

### Supabase Edge Function: ebay-proxy
- **URL:** `{SUPABASE_URL}/functions/v1/ebay-proxy?q={query}&limit=6`
- **Returns:** eBay listing data for comps

### External APIs
- **UPC Item DB:** `https://api.upcitemdb.com/prod/trial/lookup?upc={code}` (barcode lookup, free trial)
