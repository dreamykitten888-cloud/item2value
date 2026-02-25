# Item Detail Screen: Redesign Mockups

## Current Problems

1. **Photos are completely missing** — items have photos but the detail screen only shows the emoji
2. **No visual hierarchy** — Cost, Value, ROI, Asking, Comps, eBay, Community, Marketplaces all compete equally
3. **Decision-making info is buried** — "Should I sell? At what price?" isn't answerable at a glance
4. **Action buttons at the very bottom** — Edit, Research, Search Market are after 5+ scrollable sections
5. **Comps section is overwhelming** — CRUD form + eBay + Community + Marketplaces = information overload
6. **No profit/loss clarity** — ROI is just a percentage tucked into a 3-column grid

---

## Option A: "Investment Card" Layout
Hero photo up top, financial summary front and center, tabs for deeper info.

```
┌─────────────────────────────┐
│ ←                    ✏️  🗑️ │
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │     📸 HERO PHOTO     │  │
│  │     (swipeable)       │  │
│  │                       │  │
│  │  · · ○ · ·            │  │
│  └───────────────────────┘  │
│                             │
│  Nike Air Jordan 1 Retro    │
│  Nike · Dunk Low · Fashion  │
│  ┌─────┐ ┌──────┐          │
│  │ New │ │ 📷 5 │          │
│  └─────┘ └──────┘          │
│                             │
│  ┌───────────────────────┐  │
│  │  YOUR POSITION        │  │
│  │                       │  │
│  │  Paid        $170     │  │
│  │  Value       $340     │  │
│  │  ─────────────────    │  │
│  │  Profit    +$170 ▲    │  │
│  │            +100%      │  │
│  │                       │  │
│  │  Asking     $385      │  │
│  └───────────────────────┘  │
│                             │
│  ┌─────────────────────────┐│
│  │ [Overview] [Comps] [Mkt]││
│  └─────────────────────────┘│
│                             │
│  (Tab content below)        │
│                             │
│  ┌────────┐ ┌─────────────┐│
│  │  Sell  │ │  Research → ││
│  └────────┘ └─────────────┘│
└─────────────────────────────┘
```

**Pros**: Photo-first, clear profit/loss, tabs reduce clutter
**Cons**: Tabs add a tap to reach comps

---

## Option B: "Dashboard" Layout
Everything visible in scrollable cards, photo as background header.

```
┌─────────────────────────────┐
│ ┌───────────────────────────┐
│ │ ←    PHOTO BANNER    ✏️🗑️│
│ │                           │
│ │  Nike Air Jordan 1 Retro  │
│ │  Nike · Fashion · New     │
│ └───────────────────────────┘
│                             │
│  ┌──────────┬──────────┐   │
│  │ PAID     │ VALUE    │   │
│  │ $170     │ $340     │   │
│  └──────────┴──────────┘   │
│  ┌─────────────────────┐   │
│  │   +$170  (+100%) ▲  │   │
│  │   You'd profit $170 │   │
│  └─────────────────────┘   │
│                             │
│  ── Quick Actions ───────   │
│  ┌────────┬───────┬──────┐ │
│  │Search  │Sell   │Edit  │ │
│  │Market  │Item   │      │ │
│  └────────┴───────┴──────┘ │
│                             │
│  ── Price Check ─────────   │
│  ┌─────────────────────┐   │
│  │ eBay avg: $320      │   │
│  │ Range: $280 - $380  │   │
│  │        [Search eBay] │   │
│  └─────────────────────┘   │
│                             │
│  ── My Comps (3) ────────   │
│  ┌─────────────────────┐   │
│  │ eBay listing  $310  │   │
│  │ StockX       $345   │   │
│  │ Mercari      $299   │   │
│  │      [+ Add Comp]   │   │
│  └─────────────────────┘   │
│                             │
│  ── Notes ───────────────   │
│  Serial: ABC123             │
│  Bought at Foot Locker      │
│                             │
└─────────────────────────────┘
```

**Pros**: Everything visible, no hidden tabs, quick actions prominent
**Cons**: Still a long scroll, similar to current just reorganized

---

## Option C: "Profit-First" Layout (RECOMMENDED)
Optimized for the core question: "What's my position on this item?"

```
┌─────────────────────────────┐
│ ←  Nike Air Jordan 1   ✏️  │
│                             │
│  ┌──────┐ ┌──────┐ ┌─────┐ │
│  │ 📸 1 │ │ 📸 2 │ │📸 3 │ │
│  └──────┘ └──────┘ └─────┘ │
│  (horizontal scroll strip)  │
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │    +$170              │  │
│  │    PROFIT  ▲ +100%    │  │
│  │                       │  │
│  │  Paid $170 → Now $340 │  │
│  │  ░░░░░░░░░░░████████  │  │
│  │  (visual gain bar)    │  │
│  │                       │  │
│  │  Asking: $385         │  │
│  │  If sold → +$215 net  │  │
│  └───────────────────────┘  │
│                             │
│  ┌──────────┬──────────┐   │
│  │ 🔍Search │ 📊Deep   │   │
│  │ Market   │ Research  │   │
│  └──────────┴──────────┘   │
│                             │
│  ── Market Intel ────────   │
│  eBay avg $320 · 12 listed  │
│  Range $280-$380            │
│  Your value is 6% above avg │
│  ┌─────────────────────┐   │
│  │    [Search eBay]     │   │
│  └─────────────────────┘   │
│                             │
│  ── Comps (3) ───────────   │
│  (condensed comp list)      │
│  [+ Add]                    │
│                             │
│  ── Details ─────────────   │
│  Nike · Dunk Low · Fashion  │
│  New · Bought 1/15/25       │
│  Notes: Serial ABC123       │
│                             │
│  ┌─────────────────────┐   │
│  │  Mark as Sold 💰     │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │  🗑️ Delete Item      │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

**Why this is the best option:**

1. **Photo strip at top** — finally shows the actual photos users took
2. **Profit card is THE hero** — big green/red number, visual bar showing gain
3. **"If sold" calculation** — tells you exactly what you'd net at asking price
4. **Actions right after the money** — Search Market and Research are where your eyes go
5. **Market Intel is a summary** — not a wall of eBay cards; one-liner with a button to expand
6. **Details pushed to bottom** — brand, model, condition, notes are reference info, not decision info
7. **"Mark as Sold"** — prominent CTA for the most important action
8. **Delete is clearly separated** — at the very bottom, less accidental

---

## My Recommendation: Option C

The current screen treats every piece of info equally. Option C creates a clear **decision funnel**:

1. **See it** (photos)
2. **Know your position** (profit/loss)
3. **Take action** (search/research/sell)
4. **Go deeper if needed** (comps, details)

This mirrors how traders think: "What do I have? Am I up or down? What should I do?"
