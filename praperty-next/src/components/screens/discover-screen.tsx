'use client'

import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { Search, ChevronDown, Plus, X, Edit3, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { BRAND_DB } from '@/lib/product-db'
import { fmt } from '@/lib/utils'
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

// Persistence key for user's custom categories
const STORAGE_KEY = 'praperty_discover_categories'

function loadSavedCategories(): string[] {
  if (typeof window === 'undefined') return DEFAULT_BROWSE_TERMS
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return DEFAULT_BROWSE_TERMS
}

function saveCategories(cats: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cats)) } catch {}
}

// Get color/emoji metadata for a brand or category
function getTermMeta(term: string) {
  // Check if it's a brand in our DB
  const brandInfo = BRAND_DB[term]
  if (brandInfo) {
    return {
      color: CATEGORY_COLORS[brandInfo.category] || '#EB9C35',
      emoji: brandInfo.emoji,
      isBrand: true,
    }
  }
  // Check if it's a category
  if (CATEGORY_COLORS[term]) {
    return {
      color: CATEGORY_COLORS[term],
      emoji: CATEGORY_EMOJIS[term] || '📦',
      isBrand: false,
    }
  }
  // Unknown term, treat as brand search
  return { color: '#EB9C35', emoji: '🔍', isBrand: true }
}

// Product result from eBay search
interface LiveProduct {
  name: string
  brand: string
  category: string
  emoji: string
  price?: number
  source: string
}

// Cache for fetched products so we don't re-fetch on every expand
const productCache: Record<string, { products: LiveProduct[]; fetchedAt: number }> = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 min cache

export default function DiscoverScreen({ onNavigate, onResearch }: Props) {
  const { items } = useItemsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [browseCats, setBrowseCats] = useState<string[]>(DEFAULT_BROWSE_TERMS)
  const [expandedCats, setExpandedCats] = useState<string[]>([])
  const [editing, setEditing] = useState(false)
  const [addQuery, setAddQuery] = useState('')
  const [loadingCats, setLoadingCats] = useState<Set<string>>(new Set())
  const [liveProducts, setLiveProducts] = useState<Record<string, LiveProduct[]>>({})
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)

  // Load saved categories on mount
  useEffect(() => {
    setBrowseCats(loadSavedCategories())
    setMounted(true)
  }, [])

  // Save categories whenever they change
  useEffect(() => {
    if (mounted) saveCategories(browseCats)
  }, [browseCats, mounted])

  // Fetch live products for a term (brand or category)
  const fetchProductsForTerm = useCallback(async (term: string) => {
    // Check cache
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

      // Cache it
      productCache[term] = { products, fetchedAt: Date.now() }
      setLiveProducts(prev => ({ ...prev, [term]: products }))
    } catch (e) {
      console.error(`[discover] Failed to fetch products for "${term}":`, e)
      setLiveProducts(prev => ({ ...prev, [term]: [] }))
    } finally {
      setLoadingCats(prev => {
        const next = new Set(prev)
        next.delete(term)
        return next
      })
    }
  }, [])

  // When a category is expanded, fetch products
  const toggleExpand = useCallback((term: string) => {
    setExpandedCats(prev => {
      const isCurrentlyExpanded = prev.includes(term)
      if (!isCurrentlyExpanded) {
        // Expanding: fetch products if not cached
        if (!liveProducts[term]) {
          fetchProductsForTerm(term)
        }
        return [...prev, term]
      }
      return prev.filter(t => t !== term)
    })
  }, [liveProducts, fetchProductsForTerm])

  // Build brand/category suggestions for edit mode
  const addSuggestions = useMemo(() => {
    if (!addQuery.trim()) return []
    const lower = addQuery.toLowerCase()
    const seen = new Set<string>()
    const results: { text: string; type: string; emoji: string }[] = []

    // Search brands from BRAND_DB (80+ brands)
    for (const [brand, info] of Object.entries(BRAND_DB)) {
      if (results.length >= 12) break
      const matchesBrand = brand.toLowerCase().includes(lower)
      const matchesAlias = info.aliases?.some(a => a.includes(lower))
      if ((matchesBrand || matchesAlias) && !seen.has(brand) && !browseCats.includes(brand)) {
        seen.add(brand)
        results.push({ text: brand, type: info.category, emoji: info.emoji })
      }
    }

    // Search categories
    for (const cat of ALL_CATEGORIES) {
      if (results.length >= 12) break
      if (cat.toLowerCase().includes(lower) && !seen.has(cat) && !browseCats.includes(cat)) {
        seen.add(cat)
        results.push({ text: cat, type: 'Category', emoji: CATEGORY_EMOJIS[cat] || '📦' })
      }
    }

    return results.slice(0, 10)
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
            onClick={() => { setEditing(!editing); setAddQuery('') }}
            className="text-amber-brand text-[11px] font-semibold flex items-center gap-1"
          >
            {editing ? 'Done' : <><Edit3 size={11} /> Edit</>}
          </button>
        </div>

        {/* Edit mode: add/remove brands */}
        {editing && (
          <div className="glass rounded-xl p-3.5 mb-3 animate-fade-up">
            <p className="text-dim text-[11px] mb-2">Add any brand or category to track:</p>
            <div className="relative mb-2.5">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                placeholder="e.g. Chanel, Leica, Hermes, Jordan..."
                value={addQuery}
                onChange={e => setAddQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && addQuery.trim()) {
                    handleAddTerm(addQuery.trim())
                  }
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
                  {/* Allow custom entry */}
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
            {/* Current tracked brands/categories as removable chips */}
            <div className="flex flex-wrap gap-1.5">
              {browseCats.map(term => {
                const meta = getTermMeta(term)
                return (
                  <div
                    key={term}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                    style={{ border: `1px solid ${meta.color}44`, background: `${meta.color}15`, color: meta.color }}
                  >
                    <span className="text-[11px]">{meta.emoji}</span>
                    {term}
                    <button
                      onClick={() => setBrowseCats(prev => prev.filter(c => c !== term))}
                      className="ml-0.5 hover:opacity-70"
                      style={{ color: meta.color }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Brand/Category sections with live products */}
        {browseCats.map(term => {
          const meta = getTermMeta(term)
          const isExpanded = expandedCats.includes(term)
          const isLoading = loadingCats.has(term)
          const products = liveProducts[term] || []
          const productCount = products.length

          return (
            <div key={term} className="mb-2.5">
              {/* Collapsible header */}
              <button
                onClick={() => toggleExpand(term)}
                className="w-full flex items-center justify-between px-2 py-2.5 rounded-lg text-left transition-colors"
                style={{ background: isExpanded ? 'rgba(255,255,255,0.04)' : 'transparent' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{meta.emoji}</span>
                  <p className="text-[13px] font-bold" style={{ color: meta.color }}>{term}</p>
                  {isExpanded && productCount > 0 && (
                    <span className="text-dim text-[11px]">({productCount} items)</span>
                  )}
                  {isLoading && <Loader2 size={12} className="text-dim animate-spin" />}
                </div>
                <ChevronDown
                  size={14}
                  className={`text-dim transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Expanded product list */}
              {isExpanded && (
                <div className="animate-fade-up mt-1">
                  {isLoading && products.length === 0 ? (
                    <div className="flex items-center justify-center py-6 gap-2">
                      <Loader2 size={16} className="text-amber-brand animate-spin" />
                      <span className="text-dim text-[12px]">Finding {term} products on the market...</span>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-dim text-[12px]">No products found. Try searching directly.</p>
                      <button
                        onClick={() => {
                          if (onResearch) onResearch(term)
                          onNavigate('research')
                        }}
                        className="mt-2 text-amber-brand text-[12px] font-semibold"
                      >
                        Research &quot;{term}&quot;
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Table header */}
                      <div className="grid grid-cols-[1fr_auto] gap-2 px-2 pb-1.5 border-b border-white/8">
                        <span className="text-dim text-[9px] uppercase tracking-wider">Item</span>
                        <span className="text-dim text-[9px] uppercase tracking-wider text-right min-w-[75px]">Market Price</span>
                      </div>
                      {products.map((p, pi) => {
                        const owned = items.find(it => it.name.toLowerCase() === p.name.toLowerCase())
                        const price = owned ? (owned.value || owned.cost) : p.price
                        return (
                          <button
                            key={pi}
                            onClick={() => {
                              if (onResearch) onResearch(p.name)
                              onNavigate('research')
                            }}
                            className="w-full grid grid-cols-[1fr_auto] gap-2 items-center px-2 py-2.5 hover:bg-white/4 transition-colors rounded-lg text-left"
                            style={{ borderBottom: pi < products.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm flex-shrink-0">{p.emoji}</span>
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-white truncate">{p.name}</p>
                                <p className="text-dim text-[10px]">{p.brand}{p.source === 'ebay' ? ' · eBay' : ''}</p>
                              </div>
                              {owned && (
                                <span className="flex-shrink-0 text-[8px] font-bold text-amber-brand bg-amber-brand/10 px-1.5 py-0.5 rounded">OWNED</span>
                              )}
                            </div>
                            <p className="text-[13px] font-bold text-white text-right min-w-[75px]">
                              {price ? fmt(price) : 'Research'}
                            </p>
                          </button>
                        )
                      })}
                      {/* Research all button */}
                      <button
                        onClick={() => {
                          if (onResearch) onResearch(term)
                          onNavigate('research')
                        }}
                        className="w-full text-center py-2.5 text-amber-brand text-[11px] font-semibold hover:bg-white/4 rounded-lg transition-colors"
                      >
                        Deep Research &quot;{term}&quot; →
                      </button>
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
