'use client'

import { useState, useRef, useMemo } from 'react'
import { Search, ChevronDown, Plus, X, Edit3 } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { fmt } from '@/lib/utils'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onResearch?: (query: string) => void
}

// Product database for trending items (similar to prototype's PRODUCT_DB)
const PRODUCT_DB: { name: string; emoji: string; cat: string; brand: string; model?: string; basePrice: number }[] = [
  { name: 'Air Jordan 1 Retro High OG', emoji: '👟', cat: 'Fashion', brand: 'Nike', model: 'Jordan 1', basePrice: 180 },
  { name: 'MacBook Pro 14" M3', emoji: '💻', cat: 'Electronics', brand: 'Apple', model: 'MacBook Pro', basePrice: 1999 },
  { name: 'Rolex Submariner Date', emoji: '⌚', cat: 'Watches', brand: 'Rolex', model: 'Submariner', basePrice: 9500 },
  { name: 'Pokemon PSA 10 Charizard', emoji: '🃏', cat: 'Trading Cards', brand: 'Pokemon', basePrice: 450 },
  { name: 'Supreme Box Logo Tee', emoji: '👕', cat: 'Fashion', brand: 'Supreme', basePrice: 250 },
  { name: 'Dyson Airwrap Complete', emoji: '🔌', cat: 'Electronics', brand: 'Dyson', basePrice: 599 },
  { name: 'Birkin 25 Togo Leather', emoji: '👜', cat: 'Fashion', brand: 'Hermes', basePrice: 12000 },
  { name: 'PlayStation 5 Pro', emoji: '🎮', cat: 'Electronics', brand: 'Sony', basePrice: 699 },
  { name: 'LEGO Star Wars UCS', emoji: '🧱', cat: 'LEGO', brand: 'LEGO', basePrice: 850 },
  { name: 'Vintage Leica M6 TTL', emoji: '📷', cat: 'Electronics', brand: 'Leica', basePrice: 2800 },
  { name: 'Omega Speedmaster Pro', emoji: '⌚', cat: 'Watches', brand: 'Omega', model: 'Speedmaster', basePrice: 6500 },
  { name: 'Gibson Les Paul Standard', emoji: '🎸', cat: 'Musical Instruments', brand: 'Gibson', basePrice: 2500 },
  { name: 'Yeezy Boost 350 V2', emoji: '👟', cat: 'Fashion', brand: 'Adidas', model: 'Yeezy', basePrice: 230 },
  { name: 'iPad Pro M4 12.9"', emoji: '📱', cat: 'Electronics', brand: 'Apple', model: 'iPad Pro', basePrice: 1299 },
  { name: 'Tiffany T Wire Bracelet', emoji: '💎', cat: 'Jewelry', brand: 'Tiffany', basePrice: 1200 },
  { name: 'Nike Dunk Low Panda', emoji: '👟', cat: 'Fashion', brand: 'Nike', model: 'Dunk Low', basePrice: 110 },
  { name: 'Canon EOS R5', emoji: '📷', cat: 'Electronics', brand: 'Canon', basePrice: 3899 },
  { name: 'Sonos Arc Soundbar', emoji: '🔊', cat: 'Electronics', brand: 'Sonos', basePrice: 899 },
  { name: 'MTG Black Lotus (Replica)', emoji: '🃏', cat: 'Trading Cards', brand: 'MTG', basePrice: 350 },
  { name: 'Vintage Chanel Flap Bag', emoji: '👜', cat: 'Fashion', brand: 'Chanel', basePrice: 8500 },
  { name: 'Herman Miller Aeron', emoji: '🪑', cat: 'Home', brand: 'Herman Miller', basePrice: 1400 },
  { name: 'Fender Stratocaster', emoji: '🎸', cat: 'Musical Instruments', brand: 'Fender', basePrice: 1800 },
  { name: 'Bose QC Ultra Headphones', emoji: '🎧', cat: 'Electronics', brand: 'Bose', basePrice: 429 },
  { name: 'LEGO Technic Bugatti', emoji: '🧱', cat: 'LEGO', brand: 'LEGO', basePrice: 450 },
  { name: 'Tudor Black Bay 58', emoji: '⌚', cat: 'Watches', brand: 'Tudor', basePrice: 3800 },
]

const DEFAULT_BROWSE_CATS = ['Fashion', 'Electronics', 'Watches', 'Trading Cards']

const CATEGORY_COLORS: Record<string, string> = {
  Fashion: '#ec4899', Electronics: '#3b82f6', Watches: '#d4a853',
  'Trading Cards': '#8b5cf6', LEGO: '#f97316', Home: '#10b981',
  'Musical Instruments': '#ef4444', Jewelry: '#ec4899', Collectibles: '#a855f7',
  Sports: '#22c55e', 'Vinyl & Music': '#6366f1', Art: '#f43f5e',
  Automotive: '#64748b', Books: '#78716c', Toys: '#f59e0b',
  Tools: '#475569', Other: '#94a3b8',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Fashion: '👗', Electronics: '📱', Watches: '⌚',
  'Trading Cards': '🃏', LEGO: '🧱', Home: '🏠',
  'Musical Instruments': '🎸', Jewelry: '💎', Collectibles: '🏆',
  Sports: '⚽', 'Vinyl & Music': '🎵', Art: '🎨',
  Automotive: '🚗', Books: '📚', Toys: '🧸',
  Tools: '🔧', Other: '📦',
}

function getTermMeta(term: string) {
  // Check if it's a category
  if (CATEGORY_COLORS[term]) return { color: CATEGORY_COLORS[term], emoji: CATEGORY_EMOJIS[term] || '📦' }
  // Check if it's a brand
  const brandProduct = PRODUCT_DB.find(p => p.brand === term)
  if (brandProduct) return { color: CATEGORY_COLORS[brandProduct.cat] || '#94a3b8', emoji: brandProduct.emoji }
  return { color: '#94a3b8', emoji: '🔍' }
}

function getItemsForTerm(term: string) {
  return PRODUCT_DB.filter(p =>
    p.cat === term || p.brand === term || (p.model && p.model === term)
  ).slice(0, 8)
}

// Generate deterministic "market value" and "daily change" from item name
function getSimulatedPrice(item: { name: string; basePrice: number }) {
  const hash = item.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const variance = 0.85 + (hash % 30) / 100
  const mktVal = Math.round(item.basePrice * variance)
  const dailyPct = ((hash % 7) - 3) * 0.8 // -2.4% to +2.4%
  return { mktVal, dailyPct }
}

export default function DiscoverScreen({ onNavigate, onResearch }: Props) {
  const { items } = useItemsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [browseCats, setBrowseCats] = useState<string[]>(DEFAULT_BROWSE_CATS)
  const [expandedCats, setExpandedCats] = useState<string[]>([browseCats[0]])
  const [editing, setEditing] = useState(false)
  const [addQuery, setAddQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const CATEGORIES = [
    'All', 'Fashion', 'Electronics', 'Home', 'Watches', 'Sports',
    'Collectibles', 'Trading Cards', 'Vinyl & Music', 'Musical Instruments',
    'LEGO', 'Coins & Stamps', 'Art', 'Automotive', 'Books', 'Toys', 'Tools', 'Other',
  ]

  // Suggestions when adding categories in edit mode
  const addSuggestions = useMemo(() => {
    if (!addQuery.trim()) return []
    const lower = addQuery.toLowerCase()
    const seen = new Set<string>()
    const results: { text: string; type: string; emoji: string }[] = []
    // Brands
    PRODUCT_DB.forEach(p => {
      if (p.brand.toLowerCase().includes(lower) && !seen.has(p.brand) && !browseCats.includes(p.brand)) {
        seen.add(p.brand); results.push({ text: p.brand, type: 'Brand', emoji: p.emoji })
      }
    })
    // Categories
    CATEGORIES.forEach(cat => {
      if (cat !== 'All' && cat.toLowerCase().includes(lower) && !seen.has(cat) && !browseCats.includes(cat)) {
        seen.add(cat); results.push({ text: cat, type: 'Category', emoji: CATEGORY_EMOJIS[cat] || '📦' })
      }
    })
    return results.slice(0, 8)
  }, [addQuery, browseCats])

  const handleSearch = () => {
    if (searchQuery.trim() && onResearch) {
      onResearch(searchQuery)
      onNavigate('research')
    }
  }

  const toggleExpand = (term: string) => {
    setExpandedCats(prev => prev.includes(term) ? prev.filter(t => t !== term) : [...prev, term])
  }

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-2">
        <h1 className="text-2xl font-bold text-white mb-1">Discover</h1>
        <p className="text-dim text-sm">Search what anything is buying and selling for</p>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-3">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search any item (e.g. Nike Air Max 90)"
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

      {/* Trending Items Section */}
      <div className="px-6 pt-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-dim text-[11px] uppercase tracking-wider font-semibold">Trending Items</p>
          <button
            onClick={() => { setEditing(!editing); setAddQuery('') }}
            className="text-amber-brand text-[11px] font-semibold"
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>

        {/* Edit mode: add/remove categories */}
        {editing && (
          <div className="glass rounded-xl p-3.5 mb-3 animate-fade-up">
            <p className="text-dim text-[11px] mb-2">Search to add any brand, category, or model:</p>
            <div className="relative mb-2.5">
              <input
                placeholder="e.g. Nike, Coach, Fujifilm..."
                value={addQuery}
                onChange={e => setAddQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && addQuery.trim() && !browseCats.includes(addQuery.trim())) {
                    setBrowseCats(prev => [...prev, addQuery.trim()])
                    setAddQuery('')
                  }
                }}
                className="w-full py-2.5 px-3 rounded-lg border border-white/12 bg-white/6 text-white text-[13px] focus:border-amber-brand/50 focus:outline-none placeholder-slate-500"
              />
              {addQuery.trim() && addSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-white/12 overflow-hidden" style={{ background: '#1a1a2e' }}>
                  {addSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setBrowseCats(prev => [...prev, s.text]); setAddQuery('') }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/6 transition-colors"
                      style={{ borderBottom: i < addSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                    >
                      <span className="text-sm">{s.emoji}</span>
                      <span className="flex-1 text-[13px] text-white font-medium">{s.text}</span>
                      <span className="text-[10px] text-dim bg-white/6 px-2 py-0.5 rounded-md font-semibold">{s.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Current categories as removable chips */}
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

        {/* Category sections with collapsible rows */}
        {browseCats.map(term => {
          const meta = getTermMeta(term)
          const catItems = getItemsForTerm(term)
          if (catItems.length === 0) return null
          const isExpanded = expandedCats.includes(term)

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
                  <span className="text-dim text-[11px]">({catItems.length})</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-dim transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Expanded table */}
              {isExpanded && (
                <div className="animate-fade-up mt-1">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 pb-1.5 border-b border-white/8">
                    <span className="text-dim text-[9px] uppercase tracking-wider">Item</span>
                    <span className="text-dim text-[9px] uppercase tracking-wider text-right min-w-[65px]">Mkt Value</span>
                    <span className="text-dim text-[9px] uppercase tracking-wider text-right min-w-[70px]">Daily Chg</span>
                  </div>
                  {catItems.map((p, pi) => {
                    const owned = items.find(it => it.name.toLowerCase() === p.name.toLowerCase())
                    const { mktVal, dailyPct } = getSimulatedPrice(p)
                    const displayPrice = owned ? (owned.value || owned.cost) : mktVal
                    const isUp = dailyPct >= 0
                    return (
                      <button
                        key={pi}
                        onClick={() => {
                          if (onResearch) onResearch(p.name)
                          onNavigate('research')
                        }}
                        className="w-full grid grid-cols-[1fr_auto_auto] gap-2 items-center px-2 py-2.5 hover:bg-white/4 transition-colors rounded-lg text-left"
                        style={{ borderBottom: pi < catItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm flex-shrink-0">{p.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-white truncate">{p.name}</p>
                            <p className="text-dim text-[10px]">{p.brand}</p>
                          </div>
                          {owned && (
                            <span className="flex-shrink-0 text-[8px] font-bold text-amber-brand bg-amber-brand/10 px-1.5 py-0.5 rounded">OWNED</span>
                          )}
                        </div>
                        <p className="text-[13px] font-bold text-white text-right min-w-[65px]">{fmt(displayPrice)}</p>
                        <p className={`text-[12px] font-bold text-right min-w-[70px] ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                          {isUp ? '+' : ''}{dailyPct.toFixed(1)}%
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Helpful Links */}
      <div className="px-6 pt-4 pb-4 space-y-3">
        <div className="glass rounded-2xl p-4 border border-white/8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-amber flex items-center justify-center text-sm">🌐</div>
            <div>
              <p className="font-bold text-white text-sm">Popular Marketplaces</p>
              <p className="text-dim text-xs mt-0.5">Find real prices online</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { name: 'eBay', url: 'https://ebay.com' },
              { name: 'Amazon', url: 'https://amazon.com' },
              { name: 'StockX', url: 'https://stockx.com' },
              { name: 'Mercari', url: 'https://mercari.com' },
            ].map(m => (
              <a key={m.name} href={m.url} target="_blank" rel="noopener noreferrer" className="block text-amber-brand text-xs font-semibold hover:text-amber-brand/80">
                {m.name}
              </a>
            ))}
          </div>
        </div>

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
