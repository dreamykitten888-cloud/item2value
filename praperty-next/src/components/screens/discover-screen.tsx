'use client'

import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { Search, ChevronDown, Plus, X, Edit3, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { BRAND_DB } from '@/lib/product-db'
import { fmt, makeProductKey } from '@/lib/utils'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onResearch?: (query: string) => void
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
  source: string
}

// Cache for fetched products
const productCache: Record<string, { products: LiveProduct[]; fetchedAt: number }> = {}
const CACHE_TTL = 5 * 60 * 1000

export default function DiscoverScreen({ onNavigate, onResearch }: Props) {
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

  const handleSearch = () => {
    if (searchQuery.trim() && onResearch) {
      onResearch(searchQuery)
      onNavigate('research')
    }
  }

  const handleAddTerm = (term: string) => {
    if (!browseCats.includes(term)) {
      setBrowseCats(prev => [...prev, term])
    }
    setAddQuery('')
  }

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-2">
        <h1 className="text-2xl font-bold text-white mb-1">Discover</h1>
        <p className="text-dim text-sm">Track brands, find the best investments</p>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-3">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search any item (e.g. Chanel Classic Flap)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-3.5 py-3.5 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none transition-colors text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSearch} className="flex-1 gradient-amber rounded-lg py-3 font-bold text-black text-sm">
            Search Market
          </button>
          {searchQuery.trim() && (
            <button
              onClick={handleSearch}
              className="flex-1 bg-white/6 border border-amber-brand/40 rounded-lg py-3 font-bold text-amber-brand text-sm hover:bg-white/10"
            >
              Deep Research
            </button>
          )}
        </div>
      </div>

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

        {/* Brand/Category sections */}
        {browseCats.map(term => {
          const meta = getTermMeta(term)
          const isExpanded = expandedCats.includes(term)
          const isLoading = loadingCats.has(term)
          const products = getDisplayProducts(term)
          const productCount = products.length
          const isAddingProduct = addingProductTo === term

          return (
            <div key={term} className="mb-2.5">
              {/* Collapsible header */}
              <div
                className="w-full flex items-center justify-between px-2 py-2.5 rounded-lg transition-colors"
                style={{ background: isExpanded ? 'rgba(255,255,255,0.04)' : 'transparent' }}
              >
                <button
                  onClick={() => toggleExpand(term)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <span className="text-sm">{meta.emoji}</span>
                  <p className="text-[13px] font-bold" style={{ color: meta.color }}>{term}</p>
                  {isExpanded && productCount > 0 && (
                    <span className="text-dim text-[11px]">({productCount})</span>
                  )}
                  {isLoading && <Loader2 size={12} className="text-dim animate-spin" />}
                </button>
                <div className="flex items-center gap-1.5">
                  {/* Delete category X: only visible in edit mode */}
                  {editing && (
                    <button
                      onClick={() => setBrowseCats(prev => prev.filter(c => c !== term))}
                      className="p-1 rounded hover:bg-red-500/20 transition-colors"
                    >
                      <X size={14} className="text-red-400" />
                    </button>
                  )}
                  <button onClick={() => toggleExpand(term)}>
                    <ChevronDown
                      size={14}
                      className={`text-dim transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* Expanded product list */}
              {isExpanded && (
                <div className="animate-fade-up mt-1">
                  {isLoading && products.length === 0 ? (
                    <div className="flex items-center justify-center py-6 gap-2">
                      <Loader2 size={16} className="text-amber-brand animate-spin" />
                      <span className="text-dim text-[12px]">Finding {term} products...</span>
                    </div>
                  ) : products.length === 0 && !isAddingProduct ? (
                    <div className="text-center py-4">
                      <p className="text-dim text-[12px]">No products yet.</p>
                      <button
                        onClick={() => { setAddingProductTo(term); setTimeout(() => productSearchRef.current?.focus(), 100) }}
                        className="mt-2 text-amber-brand text-[12px] font-semibold"
                      >
                        + Add products
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Table header */}
                      <div className="grid grid-cols-[1fr_auto_auto] gap-1 px-2 pb-1.5 border-b border-white/8">
                        <span className="text-dim text-[9px] uppercase tracking-wider">Item</span>
                        <span className="text-dim text-[9px] uppercase tracking-wider text-right min-w-[70px]">Price</span>
                        <span className="w-6" />
                      </div>
                      {products.map((p, pi) => {
                        const owned = items.find(it => it.name.toLowerCase() === p.name.toLowerCase())
                        const price = owned ? (owned.value || owned.cost) : p.price
                        const pKey = makeProductKey(p.name, p.brand)
                        const changeData = priceChanges[pKey]
                        return (
                          <div
                            key={pi}
                            className="w-full grid grid-cols-[1fr_auto_auto] gap-1 items-center px-2 py-2 hover:bg-white/4 transition-colors rounded-lg"
                            style={{ borderBottom: pi < products.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                          >
                            {/* Tappable product name -> research */}
                            <button
                              onClick={() => {
                                if (onResearch) onResearch(p.name)
                                onNavigate('research')
                              }}
                              className="flex items-center gap-2 min-w-0 text-left"
                            >
                              <span className="text-sm flex-shrink-0">{p.emoji}</span>
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-white truncate">{p.name}</p>
                                <p className="text-dim text-[10px]">{p.brand}{p.source === 'ebay' ? ' · eBay' : ''}</p>
                              </div>
                              {owned && (
                                <span className="flex-shrink-0 text-[8px] font-bold text-amber-brand bg-amber-brand/10 px-1.5 py-0.5 rounded">OWNED</span>
                              )}
                            </button>
                            <div className="text-right min-w-[80px]">
                              <p className="text-[13px] font-bold text-white">
                                {price ? fmt(price) : '---'}
                              </p>
                              {changeData?.changePct !== null && changeData?.changePct !== undefined && (
                                <div className="flex items-center justify-end gap-0.5">
                                  {changeData.changePct >= 0 ? (
                                    <TrendingUp size={9} className="text-emerald-400" />
                                  ) : (
                                    <TrendingDown size={9} className="text-red-400" />
                                  )}
                                  <span className={`text-[10px] font-semibold ${changeData.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {changeData.changePct >= 0 ? '+' : ''}{changeData.changePct.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Delete individual product */}
                            <button
                              onClick={() => removeProduct(term, p.name)}
                              className="p-1 rounded hover:bg-red-500/20 transition-colors opacity-40 hover:opacity-100"
                            >
                              <X size={12} className="text-red-400" />
                            </button>
                          </div>
                        )
                      })}

                      {/* Add product to this category */}
                      {isAddingProduct ? (
                        <div className="px-2 pt-2 pb-1">
                          <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                              ref={productSearchRef}
                              placeholder={`Search ${term} products...`}
                              value={productSearchQuery}
                              onChange={e => handleProductSearchChange(e.target.value, term)}
                              onKeyDown={e => {
                                if (e.key === 'Escape') {
                                  setAddingProductTo(null)
                                  setProductSearchQuery('')
                                  setProductSearchResults([])
                                }
                              }}
                              className="w-full py-2 pl-8 pr-8 rounded-lg border border-white/12 bg-white/6 text-white text-[12px] focus:border-amber-brand/50 focus:outline-none placeholder-slate-500"
                              autoFocus
                            />
                            <button
                              onClick={() => { setAddingProductTo(null); setProductSearchQuery(''); setProductSearchResults([]) }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2"
                            >
                              <X size={13} className="text-slate-500 hover:text-white" />
                            </button>
                          </div>
                          {/* Search results */}
                          {productSearchLoading && (
                            <div className="flex items-center gap-2 py-2 px-1">
                              <Loader2 size={12} className="text-amber-brand animate-spin" />
                              <span className="text-dim text-[11px]">Searching...</span>
                            </div>
                          )}
                          {!productSearchLoading && productSearchResults.length > 0 && (
                            <div className="mt-1 rounded-lg border border-white/8 overflow-hidden" style={{ background: '#1a1a2e' }}>
                              {productSearchResults.map((r, ri) => {
                                const alreadyAdded = products.some(p => p.name.toLowerCase() === r.name.toLowerCase())
                                return (
                                  <button
                                    key={ri}
                                    onClick={() => { if (!alreadyAdded) addProductToCategory(term, r) }}
                                    disabled={alreadyAdded}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${alreadyAdded ? 'opacity-40' : 'hover:bg-white/6'}`}
                                    style={{ borderBottom: ri < productSearchResults.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                                  >
                                    <span className="text-sm">{r.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[12px] text-white font-medium truncate">{r.name}</p>
                                      {r.price ? <p className="text-dim text-[10px]">{fmt(r.price)}</p> : null}
                                    </div>
                                    {alreadyAdded ? (
                                      <span className="text-[10px] text-dim">Added</span>
                                    ) : (
                                      <Plus size={14} className="text-amber-brand flex-shrink-0" />
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                          {!productSearchLoading && productSearchQuery.trim().length >= 2 && productSearchResults.length === 0 && (
                            <p className="text-dim text-[11px] py-2 px-1">No results. Try a different search.</p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingProductTo(term); setProductSearchQuery(''); setProductSearchResults([]) }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 text-amber-brand/60 hover:text-amber-brand text-[11px] font-semibold hover:bg-white/4 rounded-lg transition-colors mt-0.5"
                        >
                          <Plus size={12} />
                          Add item
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
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
