'use client'

import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { Search, ChevronDown, Plus, X, Edit3, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { BRAND_DB } from '@/lib/product-db'
import { fmt, makeProductKey } from '@/lib/utils'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onResearch?: (query: string, imageUrl?: string) => void
  /** Restore discover topic/sub when returning from research (e.g. Gucci > Perfume) */
  initialDiscoverTopic?: string | null
  initialTopicSubCategory?: string | null
  onDiscoverContextChange?: (ctx: { topic: string | null; subCategory: string | null }) => void
}

// Category metadata
const CATEGORY_COLORS: Record<string, string> = {
  Fashion: '#ec4899', Electronics: '#3b82f6', Watches: '#EB9C35',
  'Trading Cards': '#8b5cf6', LEGO: '#f97316', Home: '#10b981',
  'Musical Instruments': '#ef4444', Jewelry: '#ec4899', Collectibles: '#a855f7',
  Sports: '#22c55e', 'Vinyl & Music': '#6366f1', Art: '#f43f5e',
  Automotive: '#64748b', Books: '#78716c', Toys: '#f59e0b',
  Tools: '#475569', Sneakers: '#3b82f6', Bags: '#ec4899',
  Clothing: '#a855f7', Fragrance: '#f43f5e', Accessories: '#EB9C35',
  Other: '#94a3b8',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Fashion: '👗', Electronics: '📱', Watches: '⌚',
  'Trading Cards': '🃏', LEGO: '🧱', Home: '🏠',
  'Musical Instruments': '🎸', Jewelry: '💎', Collectibles: '🏆',
  Sports: '⚽', 'Vinyl & Music': '🎵', Art: '🎨',
  Automotive: '🚗', Books: '📚', Toys: '🧸',
  Tools: '🔧', Sneakers: '👟', Bags: '👜',
  Clothing: '👕', Fragrance: '🧴', Accessories: '🕶️',
  Other: '📦',
}

const ALL_CATEGORIES = [
  'Fashion', 'Electronics', 'Home', 'Watches', 'Sports',
  'Collectibles', 'Trading Cards', 'Vinyl & Music', 'Musical Instruments',
  'LEGO', 'Art', 'Automotive', 'Books', 'Toys', 'Tools',
  'Sneakers', 'Bags', 'Clothing', 'Jewelry', 'Fragrance', 'Accessories',
]

const DEFAULT_BROWSE_TERMS = ['Chanel', 'Gucci', 'Rolex', 'Nike']

// Sub-category filter for Discover [brand]: label shown in UI, searchTerm appended to query (e.g. "Chanel" + " perfume")
const SUB_CATEGORY_OPTIONS: { label: string; searchTerm: string }[] = [
  { label: 'Bags', searchTerm: 'bags' },
  { label: 'Perfume', searchTerm: 'perfume' },
  { label: 'Shoes', searchTerm: 'shoes' },
  { label: 'Sneakers', searchTerm: 'sneakers' },
  { label: 'Clothing', searchTerm: 'clothing' },
  { label: 'Watches', searchTerm: 'watches' },
  { label: 'Trading Cards', searchTerm: 'trading cards' },
  { label: 'Plushies', searchTerm: 'plush' },
  { label: 'Collectibles', searchTerm: 'collectibles' },
  { label: 'Electronics', searchTerm: 'electronics' },
  { label: 'Jewelry', searchTerm: 'jewelry' },
  { label: 'Accessories', searchTerm: 'accessories' },
]

// Persistence keys
const CATS_KEY = 'praperty_discover_categories'
const PRODUCTS_KEY = 'praperty_discover_products' // per-category curated product lists

function loadSavedCategories(): string[] {
  if (typeof window === 'undefined') return DEFAULT_BROWSE_TERMS
  try {
    const saved = localStorage.getItem(CATS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return DEFAULT_BROWSE_TERMS
}

function saveCategories(cats: string[]) {
  try { localStorage.setItem(CATS_KEY, JSON.stringify(cats)) } catch {}
}

// Load user-curated products per category
// Format: { "Chanel": [{name, brand, ...}], "Nike": [...] }
function loadCuratedProducts(): Record<string, LiveProduct[]> {
  if (typeof window === 'undefined') return {}
  try {
    const saved = localStorage.getItem(PRODUCTS_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return {}
}

function saveCuratedProducts(products: Record<string, LiveProduct[]>) {
  try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)) } catch {}
}

function getTermMeta(term: string) {
  const brandInfo = BRAND_DB[term]
  if (brandInfo) {
    return {
      color: CATEGORY_COLORS[brandInfo.category] || '#EB9C35',
      emoji: brandInfo.emoji,
    }
  }
  if (CATEGORY_COLORS[term]) {
    return { color: CATEGORY_COLORS[term], emoji: CATEGORY_EMOJIS[term] || '📦' }
  }
  return { color: '#EB9C35', emoji: '🔍' }
}

interface LiveProduct {
  name: string
  brand: string
  category: string
  emoji: string
  price?: number
  image?: string
  source: string
}

type DiscoveryOpportunity = LiveProduct & {
  opportunity: 'buy' | 'sell'
  marketAvg: number
  diffPct: number
}

// TODO: Revisit "your list" (saved products per brand for discovery) vs Watchlist — user to decide later.

// Cache for fetched products
const productCache: Record<string, { products: LiveProduct[]; fetchedAt: number }> = {}
const CACHE_TTL = 5 * 60 * 1000

export default function DiscoverScreen({
  onNavigate,
  onResearch,
  initialDiscoverTopic = null,
  initialTopicSubCategory = null,
  onDiscoverContextChange,
}: Props) {
  const { items } = useItemsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [browseCats, setBrowseCats] = useState<string[]>(DEFAULT_BROWSE_TERMS)
  const [expandedCats, setExpandedCats] = useState<string[]>([])
  const [editing, setEditing] = useState(false)
  const [addQuery, setAddQuery] = useState('')
  const [loadingCats, setLoadingCats] = useState<Set<string>>(new Set())
  const [liveProducts, setLiveProducts] = useState<Record<string, LiveProduct[]>>({})
  // User-curated products: if a user has curated a category, we show their list instead of the fetched one
  const [curatedProducts, setCuratedProducts] = useState<Record<string, LiveProduct[]>>({})
  // Per-category "add product" search
  const [addingProductTo, setAddingProductTo] = useState<string | null>(null)
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [productSearchResults, setProductSearchResults] = useState<LiveProduct[]>([])
  const [productSearchLoading, setProductSearchLoading] = useState(false)
  // Daily price changes from snapshots
  const [priceChanges, setPriceChanges] = useState<Record<string, { price: number; change: number | null; changePct: number | null }>>({})
  const snapshotTriggered = useRef<Set<string>>(new Set())
  const searchInputRef = useRef<HTMLInputElement>(null)
  const productSearchRef = useRef<HTMLInputElement>(null)
  const productSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mounted, setMounted] = useState(false)

  // Discover [topic] view: Buy / Sell opportunities (no "your list" — discovery only). Sync from parent when returning from research.
  const [discoverTopic, setDiscoverTopicState] = useState<string | null>(initialDiscoverTopic ?? null)
  const [topicSubCategory, setTopicSubCategoryState] = useState<string | null>(initialTopicSubCategory ?? null)
  // Restore topic view when navigating back from research
  useEffect(() => {
    if (initialDiscoverTopic != null) {
      setDiscoverTopicState(initialDiscoverTopic)
      setTopicSubCategoryState(initialTopicSubCategory ?? null)
    }
  }, [initialDiscoverTopic, initialTopicSubCategory])
  const setDiscoverTopic = useCallback(
    (topic: string | null) => {
      setDiscoverTopicState(topic)
      setTopicSubCategoryState(null)
      onDiscoverContextChange?.({ topic, subCategory: null })
    },
    [onDiscoverContextChange]
  )
  const setTopicSubCategory = useCallback(
    (sub: string | null) => {
      setTopicSubCategoryState(sub)
      onDiscoverContextChange?.({ topic: discoverTopic, subCategory: sub })
    },
    [onDiscoverContextChange, discoverTopic]
  )
  const [topicLoading, setTopicLoading] = useState(false)
  const [topicOpportunities, setTopicOpportunities] = useState<{
    buy: DiscoveryOpportunity[]
    sell: DiscoveryOpportunity[]
    marketAvg: number
    trendScore: number | null
    trendDirection: 'rising' | 'stable' | 'declining' | null
  } | null>(null)

  // Load on mount
  useEffect(() => {
    setBrowseCats(loadSavedCategories())
    setCuratedProducts(loadCuratedProducts())
    setMounted(true)
  }, [])

  // Save categories
  useEffect(() => {
    if (mounted) saveCategories(browseCats)
  }, [browseCats, mounted])

  // Save curated products
  useEffect(() => {
    if (mounted) saveCuratedProducts(curatedProducts)
  }, [curatedProducts, mounted])

  // Fetch Buy/Sell opportunities when user opens Discover [topic] (with optional sub-category)
  const topicEffectiveQuery = discoverTopic?.trim()
    ? discoverTopic.trim() + (topicSubCategory ? ` ${topicSubCategory}` : '')
    : ''
  useEffect(() => {
    if (!discoverTopic?.trim()) {
      setTopicOpportunities(null)
      return
    }
    const q = topicEffectiveQuery
    const category = (discoverTopic && BRAND_DB[discoverTopic]?.category) || ''
    setTopicLoading(true)
    setTopicOpportunities(null)
    Promise.all([
      fetch(`/api/ebay-search?q=${encodeURIComponent(q)}&limit=20`).then(r => r.json()),
      fetch(`/api/market-signal?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`).then(r => r.json()),
    ])
      .then(([ebayData, signalData]) => {
        const listings: LiveProduct[] = ebayData.results || []
        const trendScore = signalData.trendScore ?? null
        const trendDirection = signalData.trendDirection || null
        if (listings.length === 0) {
          setTopicOpportunities({ buy: [], sell: [], marketAvg: 0, trendScore, trendDirection })
          setTopicLoading(false)
          return
        }
        let marketAvg = signalData.ebayAvgPrice || 0
        if (marketAvg <= 0) {
          const prices = listings.map(p => p.price ?? 0).filter(Boolean)
          marketAvg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
        }
        const buy: DiscoveryOpportunity[] = []
        const sell: DiscoveryOpportunity[] = []
        const buyThreshold = marketAvg * 0.9
        const sellThreshold = marketAvg * 0.95
        for (const p of listings) {
          const price = p.price ?? 0
          // Skip obvious junk / low-ticket noise
          if (price <= 0) continue
          if (price < Math.max(15, marketAvg * 0.3)) continue
          const diffPct = marketAvg > 0 ? Math.round(((price - marketAvg) / marketAvg) * 100) : 0
          if (price < buyThreshold) {
            buy.push({ ...p, opportunity: 'buy', marketAvg, diffPct })
          } else if (price >= sellThreshold) {
            sell.push({ ...p, opportunity: 'sell', marketAvg, diffPct })
          }
        }
        buy.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
        sell.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
        setTopicOpportunities({
          buy: buy.slice(0, 8),
          sell: sell.slice(0, 8),
          marketAvg,
          trendScore,
          trendDirection,
        })
      })
      .catch(() => setTopicOpportunities({ buy: [], sell: [], marketAvg: 0, trendScore: null, trendDirection: null }))
      .finally(() => setTopicLoading(false))
  }, [discoverTopic, topicSubCategory])

  // Trigger a price snapshot for products (background, non-blocking)
  const triggerSnapshot = useCallback(async (products: LiveProduct[]) => {
    if (products.length === 0) return
    // Only snapshot products we haven't already snapshotted this session
    const toSnapshot = products.filter(p => {
      const key = makeProductKey(p.name, p.brand)
      if (snapshotTriggered.current.has(key)) return false
      snapshotTriggered.current.add(key)
      return true
    })
    if (toSnapshot.length === 0) return

    try {
      await fetch('/api/price-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: toSnapshot.map(p => ({ name: p.name, brand: p.brand, category: p.category })),
        }),
      })
    } catch {} // silent fail, it's background work

    // Fetch latest daily changes for these products
    const keys = toSnapshot.map(p => makeProductKey(p.name, p.brand)).join(',')
    try {
      const res = await fetch(`/api/price-snapshot?keys=${encodeURIComponent(keys)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.results) {
          setPriceChanges(prev => ({ ...prev, ...data.results }))
        }
      }
    } catch {} // silent fail
  }, [])

  // Fetch live products for a term
  const fetchProductsForTerm = useCallback(async (term: string) => {
    const cached = productCache[term]
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      setLiveProducts(prev => ({ ...prev, [term]: cached.products }))
      return
    }

    setLoadingCats(prev => new Set(prev).add(term))
    try {
      const res = await fetch(`/api/ebay-search?q=${encodeURIComponent(term)}&limit=12`, {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      const products: LiveProduct[] = data.results || []
      productCache[term] = { products, fetchedAt: Date.now() }
      setLiveProducts(prev => ({ ...prev, [term]: products }))
      // Trigger background snapshot for price tracking
      triggerSnapshot(products)
    } catch (e) {
      console.error(`[discover] Failed to fetch for "${term}":`, e)
      setLiveProducts(prev => ({ ...prev, [term]: [] }))
    } finally {
      setLoadingCats(prev => { const n = new Set(prev); n.delete(term); return n })
    }
  }, [triggerSnapshot])

  const toggleExpand = useCallback((term: string) => {
    setExpandedCats(prev => {
      if (prev.includes(term)) return prev.filter(t => t !== term)
      // Fetch if no curated list and no live products
      if (!curatedProducts[term] && !liveProducts[term]) {
        fetchProductsForTerm(term)
      } else if (curatedProducts[term]) {
        // Still trigger snapshots for curated products
        triggerSnapshot(curatedProducts[term])
      }
      return [...prev, term]
    })
  }, [curatedProducts, liveProducts, fetchProductsForTerm, triggerSnapshot])

  // Get the products to display for a term: curated takes priority over fetched
  const getDisplayProducts = useCallback((term: string): LiveProduct[] => {
    if (curatedProducts[term]) return curatedProducts[term]
    return liveProducts[term] || []
  }, [curatedProducts, liveProducts])

  // Remove a product from a category (creates a curated list if one doesn't exist)
  const removeProduct = useCallback((term: string, productName: string) => {
    setCuratedProducts(prev => {
      const current = prev[term] || liveProducts[term] || []
      const updated = current.filter(p => p.name !== productName)
      return { ...prev, [term]: updated }
    })
  }, [liveProducts])

  // Add a product to a category's curated list
  const addProductToCategory = useCallback((term: string, product: LiveProduct) => {
    setCuratedProducts(prev => {
      const current = prev[term] || liveProducts[term] || []
      // Don't add duplicates
      if (current.some(p => p.name.toLowerCase() === product.name.toLowerCase())) return prev
      return { ...prev, [term]: [...current, product] }
    })
    setProductSearchQuery('')
    setProductSearchResults([])
  }, [liveProducts])

  // Search for products to add to a category
  const searchProductsForAdd = useCallback(async (query: string, term: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setProductSearchResults([])
      return
    }
    setProductSearchLoading(true)
    try {
      // Search with the brand/category + specific query
      const searchTerm = `${term} ${query}`
      const res = await fetch(`/api/ebay-search?q=${encodeURIComponent(searchTerm)}&limit=8`, {
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error('search failed')
      const data = await res.json()
      setProductSearchResults(data.results || [])
    } catch {
      setProductSearchResults([])
    } finally {
      setProductSearchLoading(false)
    }
  }, [])

  // Debounced product search
  const handleProductSearchChange = useCallback((query: string, term: string) => {
    setProductSearchQuery(query)
    if (productSearchTimer.current) clearTimeout(productSearchTimer.current)
    productSearchTimer.current = setTimeout(() => searchProductsForAdd(query, term), 400)
  }, [searchProductsForAdd])

  // Brand/category suggestions for edit mode
  const addSuggestions = useMemo(() => {
    if (!addQuery.trim()) return []
    const lower = addQuery.toLowerCase()
    const seen = new Set<string>()
    const results: { text: string; type: string; emoji: string }[] = []

    for (const [brand, info] of Object.entries(BRAND_DB)) {
      if (results.length >= 10) break
      const matchesBrand = brand.toLowerCase().includes(lower)
      const matchesAlias = info.aliases?.some(a => a.includes(lower))
      if ((matchesBrand || matchesAlias) && !seen.has(brand) && !browseCats.includes(brand)) {
        seen.add(brand)
        results.push({ text: brand, type: info.category, emoji: info.emoji })
      }
    }

    for (const cat of ALL_CATEGORIES) {
      if (results.length >= 10) break
      if (cat.toLowerCase().includes(lower) && !seen.has(cat) && !browseCats.includes(cat)) {
        seen.add(cat)
        results.push({ text: cat, type: 'Category', emoji: CATEGORY_EMOJIS[cat] || '📦' })
      }
    }

    return results
  }, [addQuery, browseCats])

  const handleSearchMarket = () => {
    if (searchQuery.trim()) {
      setDiscoverTopic(searchQuery.trim())
      setTopicSubCategory(null)
    }
  }

  const handleDeepResearch = () => {
    if (searchQuery.trim() && onResearch) {
      onResearch(searchQuery)
      onNavigate('research')
    }
  }

  const openDiscoverTopic = (term: string) => {
    setDiscoverTopic(term)
    setTopicSubCategory(null)
  }

  const handleAddTerm = (term: string) => {
    if (!browseCats.includes(term)) {
      setBrowseCats(prev => [...prev, term])
    }
    setAddQuery('')
  }

  // ─── Discover [topic] view: Buy / Sell opportunities ─────────────────
  if (discoverTopic) {
    const meta = getTermMeta(discoverTopic)
    return (
      <div className="h-full flex flex-col pb-24">
        <div className="px-6 pt-8 pb-4 flex-shrink-0">
          <button
            onClick={() => {
              setDiscoverTopicState(null)
              setTopicSubCategoryState(null)
              setTopicOpportunities(null)
              onDiscoverContextChange?.({ topic: null, subCategory: null })
            }}
            className="flex items-center gap-2 text-dim hover:text-white mb-3"
          >
            <ChevronDown size={20} className="rotate-90" />
            Back
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{meta.emoji}</span>
            Discover {discoverTopic}
          </h1>
          <p className="text-dim text-sm mt-0.5">Deals you can buy low or sell high</p>
          {/* Sub-category filter: e.g. Chanel bags vs perfumes, Nike shoes, Pokemon cards vs plushies */}
          <div className="flex gap-2 overflow-x-auto scroll-hide py-3 -mx-1">
            <button
              onClick={() => setTopicSubCategory(null)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-colors ${
                topicSubCategory === null
                  ? 'bg-amber-brand text-black'
                  : 'bg-white/8 text-white/80 hover:bg-white/12'
              }`}
            >
              All
            </button>
            {SUB_CATEGORY_OPTIONS.map(({ label, searchTerm }) => (
              <button
                key={searchTerm}
                onClick={() => setTopicSubCategory(searchTerm)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-colors ${
                  topicSubCategory === searchTerm
                    ? 'bg-amber-brand text-black'
                    : 'bg-white/8 text-white/80 hover:bg-white/12'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scroll-hide px-6">
          {topicLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="text-amber-brand animate-spin" />
              <p className="text-dim text-sm">Finding opportunities...</p>
            </div>
          ) : topicOpportunities ? (
            <div className="space-y-6 pb-6">
              {/* Google Trends: interest before buying/selling */}
              {(topicOpportunities.trendScore != null || topicOpportunities.trendDirection) && (
                <div className="glass rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📈</span>
                    <h3 className="text-sm font-bold text-white">Search interest</h3>
                  </div>
                  <p className="text-dim text-[11px] mb-3">
                    Google Trends — see if people are interested before buying/selling picks up
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {topicOpportunities.trendScore != null && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-bold text-white">{topicOpportunities.trendScore}</span>
                        <span className="text-dim text-xs">/ 100 interest</span>
                      </div>
                    )}
                    {topicOpportunities.trendDirection && (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          topicOpportunities.trendDirection === 'rising'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : topicOpportunities.trendDirection === 'declining'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {topicOpportunities.trendDirection === 'rising'
                          ? 'Rising'
                          : topicOpportunities.trendDirection === 'declining'
                            ? 'Declining'
                            : 'Stable'}
                      </span>
                    )}
                  </div>
                  {topicOpportunities.trendDirection === 'rising' && (
                    <p className="text-emerald-400/90 text-[11px] font-medium mt-2">
                      People are searching for this more — demand may be building.
                    </p>
                  )}
                </div>
              )}
              {/* Trending now (strong market / hype) */}
              <section>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-brand" />
                  Trending now
                </h2>
                <p className="text-dim text-[11px] mb-3">High-interest items with strong markets</p>
                {topicOpportunities.sell.length === 0 ? (
                  <div className="glass rounded-xl py-6 text-center">
                    <p className="text-dim text-sm">No trending items right now</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topicOpportunities.sell.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => { if (onResearch) onResearch(p.name, p.image); onNavigate('research') }}
                        className="w-full glass rounded-xl p-3 flex items-center gap-3 text-left hover:bg-white/8 transition-colors"
                      >
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-white/10"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
                            {p.emoji}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-white truncate">{p.name}</p>
                          <p className="text-dim text-[10px]">{p.brand} · eBay</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-white">{p.price ? fmt(p.price) : '—'}</p>
                          <span className="text-[10px] font-semibold text-amber-brand">Strong market</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
              {/* Value plays (below market but still in strong category) */}
              <section>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Value plays
                </h2>
                <p className="text-dim text-[11px] mb-3">Listings below market in active categories</p>
                {topicOpportunities.buy.length === 0 ? (
                  <div className="glass rounded-xl py-6 text-center">
                    <p className="text-dim text-sm">No value plays right now</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topicOpportunities.buy.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => { if (onResearch) onResearch(p.name, p.image); onNavigate('research') }}
                        className="w-full glass rounded-xl p-3 flex items-center gap-3 text-left hover:bg-white/8 transition-colors"
                      >
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-white/10"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
                            {p.emoji}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-white truncate">{p.name}</p>
                          <p className="text-dim text-[10px]">{p.brand} · eBay</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-white">{p.price ? fmt(p.price) : '—'}</p>
                          <span className="text-[10px] font-semibold text-emerald-400">Below market</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
              {topicOpportunities.marketAvg > 0 && (
                <p className="text-dim text-[10px] text-center">
                  Market avg {fmt(topicOpportunities.marketAvg)} for this search
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  // ─── Main Discover: search + tracked brands (no expanded table) ─────────────────
  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      <div className="px-6 pt-8 pb-2">
        <h1 className="text-2xl font-bold text-white mb-1">Discover</h1>
        <p className="text-dim text-sm">Track brands, find the best investments</p>
      </div>

      <div className="px-6 py-3">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search any item (e.g. Selkie dresses, Chanel flap)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchMarket()}
            className="w-full pl-10 pr-3.5 py-3.5 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none transition-colors text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSearchMarket} className="flex-1 gradient-amber rounded-lg py-3 font-bold text-black text-sm">
            Search Market
          </button>
          {searchQuery.trim() && (
            <button
              onClick={handleDeepResearch}
              className="flex-1 bg-white/6 border border-amber-brand/40 rounded-lg py-3 font-bold text-amber-brand text-sm hover:bg-white/10"
            >
              Deep Research
            </button>
          )}
        </div>
      </div>

      {/* Trending across your brands */}
      {browseCats.length > 0 && (
        <div className="px-6 pt-1">
          <p className="text-dim text-[11px] uppercase tracking-wider font-semibold mb-2">
            Trending across your brands
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scroll-hide">
            {browseCats.slice(0, 4).map(term => {
              const meta = getTermMeta(term)
              return (
                <button
                  key={term}
                  onClick={() => openDiscoverTopic(term)}
                  className="min-w-[160px] max-w-[200px] flex-shrink-0 glass rounded-2xl p-3 flex items-center gap-3 hover:bg-white/8 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-semibold truncate" style={{ color: meta.color }}>
                      {term}
                    </p>
                    <p className="text-dim text-[10px] truncate">
                      Tap to see hot items and value plays
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Brand/Category Tracking Section */}
      <div className="px-6 pt-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-dim text-[11px] uppercase tracking-wider font-semibold">Your Tracked Brands</p>
          <button
            onClick={() => { setEditing(!editing); setAddQuery(''); setAddingProductTo(null) }}
            className="text-amber-brand text-[11px] font-semibold flex items-center gap-1"
          >
            {editing ? 'Done' : <><Edit3 size={11} /> Edit</>}
          </button>
        </div>

        {/* Edit mode: search to add brands */}
        {editing && (
          <div className="glass rounded-xl p-3.5 mb-3 animate-fade-up">
            <p className="text-dim text-[11px] mb-2">Add any brand or category to track:</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                placeholder="e.g. Selkie, Leica, Hermes, Jordan..."
                value={addQuery}
                onChange={e => setAddQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && addQuery.trim()) handleAddTerm(addQuery.trim())
                }}
                className="w-full py-2.5 pl-9 pr-3 rounded-lg border border-white/12 bg-white/6 text-white text-[13px] focus:border-amber-brand/50 focus:outline-none placeholder-slate-500"
                autoFocus
              />
              {addQuery.trim() && addSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-white/12 overflow-hidden max-h-[300px] overflow-y-auto" style={{ background: '#1a1a2e' }}>
                  {addSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleAddTerm(s.text)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/6 transition-colors"
                      style={{ borderBottom: i < addSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                    >
                      <span className="text-sm">{s.emoji}</span>
                      <span className="flex-1 text-[13px] text-white font-medium">{s.text}</span>
                      <span className="text-[10px] text-dim bg-white/6 px-2 py-0.5 rounded-md font-semibold">{s.type}</span>
                    </button>
                  ))}
                  {!addSuggestions.some(s => s.text.toLowerCase() === addQuery.toLowerCase()) && (
                    <button
                      onClick={() => handleAddTerm(addQuery.trim())}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/6 transition-colors border-t border-white/8"
                    >
                      <Plus size={14} className="text-amber-brand" />
                      <span className="flex-1 text-[13px] text-amber-brand font-medium">Add &quot;{addQuery.trim()}&quot; as custom</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tracked brands: tap to discover deals (no expanded list) */}
        {browseCats.map(term => {
          const meta = getTermMeta(term)
          return (
            <div key={term} className="mb-2">
              <div className="w-full flex items-center justify-between gap-2">
                <button
                  onClick={() => openDiscoverTopic(term)}
                  className="flex-1 flex items-center gap-3 px-3 py-3 rounded-xl glass hover:bg-white/8 transition-colors text-left"
                >
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="text-[13px] font-bold flex-1" style={{ color: meta.color }}>{term}</span>
                  <span className="text-[11px] text-amber-brand font-semibold">See deals</span>
                </button>
                {editing && (
                  <button
                    onClick={() => setBrowseCats(prev => prev.filter(c => c !== term))}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <X size={16} className="text-red-400" />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Empty state */}
        {browseCats.length === 0 && (
          <div className="text-center py-8">
            <p className="text-dim text-sm mb-2">No brands tracked yet</p>
            <button
              onClick={() => setEditing(true)}
              className="text-amber-brand text-sm font-semibold"
            >
              + Add brands to track
            </button>
          </div>
        )}
      </div>

      {/* Community Data */}
      <div className="px-6 pt-4 pb-4">
        <div className="glass rounded-2xl p-4 border border-white/8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-purple flex items-center justify-center text-sm">👥</div>
            <div>
              <p className="font-bold text-white text-sm">Community Data</p>
              <p className="text-dim text-xs mt-0.5">See what others are valuing items at</p>
            </div>
          </div>
          <p className="text-dim text-xs">
            Add items to your inventory to help the community and access collective pricing data
          </p>
        </div>
      </div>
    </div>
  )
}
