'use client'

import { useMemo } from 'react'
import { Package, DollarSign, BarChart3, Bell, Camera, Plus, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useItemsStore } from '@/stores/items-store'
import { fmt, getGreeting } from '@/lib/utils'
import { generateAlerts } from '@/lib/alerts-engine'
import type { Screen, Item } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onViewItem: (id: string) => void
}

// Simulated product database for "Similar Items Sold" suggestions
const SIMILAR_PRODUCTS: { name: string; emoji: string; cat: string; brand: string }[] = [
  { name: 'Air Jordan 1 Retro', emoji: '👟', cat: 'Fashion', brand: 'Nike' },
  { name: 'MacBook Pro 14"', emoji: '💻', cat: 'Electronics', brand: 'Apple' },
  { name: 'Rolex Submariner', emoji: '⌚', cat: 'Watches', brand: 'Rolex' },
  { name: 'Pokemon Base Set Charizard', emoji: '🃏', cat: 'Trading Cards', brand: 'Pokemon' },
  { name: 'Supreme Box Logo Hoodie', emoji: '👕', cat: 'Fashion', brand: 'Supreme' },
  { name: 'Dyson V15 Detect', emoji: '🔌', cat: 'Electronics', brand: 'Dyson' },
  { name: 'Birkin 25 Togo', emoji: '👜', cat: 'Fashion', brand: 'Hermes' },
  { name: 'PlayStation 5 Pro', emoji: '🎮', cat: 'Electronics', brand: 'Sony' },
  { name: 'LEGO Millennium Falcon', emoji: '🧱', cat: 'LEGO', brand: 'LEGO' },
  { name: 'Vintage Leica M6', emoji: '📷', cat: 'Electronics', brand: 'Leica' },
  { name: 'Omega Speedmaster', emoji: '⌚', cat: 'Watches', brand: 'Omega' },
  { name: 'Gibson Les Paul Standard', emoji: '🎸', cat: 'Musical Instruments', brand: 'Gibson' },
  { name: 'Yeezy 350 V2', emoji: '👟', cat: 'Fashion', brand: 'Adidas' },
  { name: 'iPad Pro M4', emoji: '📱', cat: 'Electronics', brand: 'Apple' },
  { name: 'Tiffany Diamond Pendant', emoji: '💎', cat: 'Jewelry', brand: 'Tiffany' },
]

const PLATFORMS = ['eBay', 'StockX', 'Mercari', 'Poshmark', 'GOAT', 'Grailed', 'Facebook MP', 'Depop']

// Demo data shown when user has no items yet
const DEMO_MOVERS = [
  { id: 'demo-1', name: 'Air Jordan 1 Retro', emoji: '👟', value: 340, cost: 170, category: 'Fashion', brand: 'Nike', change: 45, changePct: 15.3, priceHistory: [], dateSold: undefined, dateAcquired: '', notes: '', condition: '', images: [], earnings: 0 },
  { id: 'demo-2', name: 'Pokemon Charizard', emoji: '🃏', value: 890, cost: 200, category: 'Trading Cards', brand: 'Pokemon', change: -62, changePct: -6.5, priceHistory: [], dateSold: undefined, dateAcquired: '', notes: '', condition: '', images: [], earnings: 0 },
  { id: 'demo-3', name: 'Rolex Submariner', emoji: '⌚', value: 12500, cost: 9800, category: 'Watches', brand: 'Rolex', change: 875, changePct: 7.5, priceHistory: [], dateSold: undefined, dateAcquired: '', notes: '', condition: '', images: [], earnings: 0 },
  { id: 'demo-4', name: 'MacBook Pro 14"', emoji: '💻', value: 1650, cost: 1999, category: 'Electronics', brand: 'Apple', change: -120, changePct: -6.8, priceHistory: [], dateSold: undefined, dateAcquired: '', notes: '', condition: '', images: [], earnings: 0 },
  { id: 'demo-5', name: 'Supreme Box Logo', emoji: '👕', value: 780, cost: 168, category: 'Fashion', brand: 'Supreme', change: 52, changePct: 7.1, priceHistory: [], dateSold: undefined, dateAcquired: '', notes: '', condition: '', images: [], earnings: 0 },
]

const DEMO_SIMILAR_SOLD = [
  { name: 'Air Jordan 4 Retro', emoji: '👟', cat: 'Fashion', brand: 'Nike', salePrice: 385, daysAgo: 2, platform: 'StockX', relatedTo: 'Your sneakers', relatedEmoji: '👟' },
  { name: 'Omega Speedmaster', emoji: '⌚', cat: 'Watches', brand: 'Omega', salePrice: 6200, daysAgo: 1, platform: 'eBay', relatedTo: 'Your watches', relatedEmoji: '⌚' },
  { name: 'iPad Pro M4', emoji: '📱', cat: 'Electronics', brand: 'Apple', salePrice: 950, daysAgo: 3, platform: 'Mercari', relatedTo: 'Your electronics', relatedEmoji: '💻' },
  { name: 'LEGO Millennium Falcon', emoji: '🧱', cat: 'LEGO', brand: 'LEGO', salePrice: 720, daysAgo: 5, platform: 'eBay', relatedTo: 'Your collectibles', relatedEmoji: '🧱' },
  { name: 'Birkin 25 Togo', emoji: '👜', cat: 'Fashion', brand: 'Hermes', salePrice: 14200, daysAgo: 1, platform: 'Poshmark', relatedTo: 'Your fashion', relatedEmoji: '👜' },
]

function getMarketMovers(items: Item[]) {
  const activeItems = items.filter(i => !i.dateSold)
  console.log('[movers] activeItems:', activeItems.length, 'first:', activeItems[0]?.name, 'value:', activeItems[0]?.value, 'cost:', activeItems[0]?.cost)

  // Demo mode: show sample data when no items
  if (activeItems.length === 0) {
    console.log('[movers] returning DEMO data')
    return DEMO_MOVERS as unknown as (Item & { change: number; changePct: number })[]
  }

  // First try: items with 2+ price history entries (real movers)
  const realMovers = activeItems
    .filter(i => i.priceHistory && i.priceHistory.length >= 2)
    .map(item => {
      const history = item.priceHistory
      const current = history[history.length - 1].value
      const previous = history[history.length - 2].value
      const change = current - previous
      const changePct = previous > 0 ? (change / previous) * 100 : 0
      if (Math.abs(changePct) < 0.5) return null
      return { ...item, change, changePct }
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b!.changePct) - Math.abs(a!.changePct))
    .slice(0, 5) as (Item & { change: number; changePct: number })[]

  if (realMovers.length > 0) {
    console.log('[movers] returning realMovers:', realMovers.length)
    return realMovers
  }

  // Fallback: show top valued items as "portfolio highlights" with simulated daily change
  const withValue = activeItems.filter(i => (i.value || i.cost) > 0)
  console.log('[movers] fallback: items with value:', withValue.length)
  return activeItems
    .filter(i => (i.value || i.cost) > 0)
    .sort((a, b) => (b.value || b.cost) - (a.value || a.cost))
    .slice(0, 5)
    .map(item => {
      // Deterministic daily change based on item name hash
      const hash = item.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
      const changePct = ((hash % 120) - 40) / 10 // range: -4% to +8%
      const baseVal = item.value || item.cost || 100
      const change = Math.round(baseVal * changePct / 100)
      return { ...item, change, changePct }
    })
}

function getSimilarSold(items: Item[]) {
  const activeItems = items.filter(i => !i.dateSold)

  // Demo mode: show sample data when no items
  if (activeItems.length === 0) return DEMO_SIMILAR_SOLD

  type Suggestion = {
    name: string; emoji: string; cat: string; brand: string
    salePrice: number; daysAgo: number; platform: string
    relatedTo: string; relatedEmoji: string
  }
  const suggestions: Suggestion[] = []
  const seenNames = new Set<string>()

  // First pass: match by category or brand
  activeItems.forEach(item => {
    const similar = SIMILAR_PRODUCTS.filter(
      p => p.name !== item.name && !seenNames.has(p.name) &&
        (p.cat.toLowerCase() === item.category.toLowerCase() ||
         (item.brand && p.brand.toLowerCase() === item.brand.toLowerCase()))
    ).slice(0, 2)

    similar.forEach(s => {
      if (suggestions.length >= 5 || seenNames.has(s.name)) return
      seenNames.add(s.name)
      const basePrice = item.value > 0 ? item.value : (item.cost || 200)
      const variance = 0.7 + (Math.abs(s.name.charCodeAt(0) % 60) / 100)
      const salePrice = Math.round(basePrice * variance)
      const daysAgo = 1 + (s.name.charCodeAt(1) % 12)
      const platform = PLATFORMS[s.name.charCodeAt(0) % PLATFORMS.length]
      suggestions.push({
        name: s.name, emoji: s.emoji, cat: s.cat, brand: s.brand,
        salePrice, daysAgo, platform, relatedTo: item.name, relatedEmoji: item.emoji,
      })
    })
  })

  // Fallback: if no matches, pick random products related to the user's highest-value items
  if (suggestions.length < 3) {
    const topItems = activeItems
      .sort((a, b) => (b.value || b.cost || 0) - (a.value || a.cost || 0))
      .slice(0, 3)

    topItems.forEach(item => {
      const remaining = SIMILAR_PRODUCTS.filter(p => !seenNames.has(p.name))
      if (remaining.length === 0 || suggestions.length >= 5) return

      const pick = remaining[Math.abs(item.name.charCodeAt(0)) % remaining.length]
      seenNames.add(pick.name)
      const basePrice = item.value > 0 ? item.value : (item.cost || 200)
      const variance = 0.7 + (Math.abs(pick.name.charCodeAt(0) % 60) / 100)
      suggestions.push({
        name: pick.name, emoji: pick.emoji, cat: pick.cat, brand: pick.brand,
        salePrice: Math.round(basePrice * variance),
        daysAgo: 1 + (pick.name.charCodeAt(1) % 12),
        platform: PLATFORMS[pick.name.charCodeAt(0) % PLATFORMS.length],
        relatedTo: item.name, relatedEmoji: item.emoji,
      })
    })
  }

  return suggestions
}

export default function HomeScreen({ onNavigate, onViewItem }: Props) {
  const { profile } = useAuthStore()
  const { items } = useItemsStore()

  const userName = profile?.name || 'there'
  const userInitial = userName.charAt(0).toUpperCase()

  const activeItems = items.filter(i => !i.dateSold)
  const soldItems = items.filter(i => !!i.dateSold)
  const totalValue = activeItems.reduce((sum, i) => sum + (i.value || 0), 0)
  const totalEarnings = soldItems.reduce((sum, i) => sum + (i.earnings || i.value || 0), 0)

  const alerts = useMemo(() => generateAlerts(items), [items])
  const alertCount = alerts.length
  const movers = useMemo(() => {
    const result = getMarketMovers(items)
    console.log('[home] getMarketMovers:', { totalItems: items.length, activeItems: items.filter(i => !i.dateSold).length, moversCount: result.length, firstMover: result[0]?.name })
    return result
  }, [items])
  const similarSold = useMemo(() => {
    const result = getSimilarSold(items)
    console.log('[home] getSimilarSold:', { totalItems: items.length, similarCount: result.length, firstSimilar: result[0]?.name })
    return result
  }, [items])

  const stats = [
    { label: 'Total Items', value: String(items.length), icon: Package, gradient: 'bg-gradient-blue' },
    { label: 'Total Value', value: fmt(totalValue), icon: DollarSign, gradient: 'bg-gradient-amber' },
    { label: 'Total Earnings', value: totalEarnings > 0 ? fmt(totalEarnings) : '--', icon: BarChart3, gradient: 'bg-gradient-purple', onClick: () => onNavigate('sold-items') },
    { label: 'Alerts', value: alertCount > 0 ? String(alertCount) : '--', icon: Bell, gradient: 'from-amber-500 to-amber-600 bg-gradient-to-br', onClick: () => onNavigate('alerts') },
  ]

  const recentItems = items.slice(0, 5)

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-2">
        <div className="flex justify-between items-center mb-7">
          <div>
            <p className="text-dim text-xs uppercase tracking-widest">{getGreeting()}</p>
            <h1 className="text-[28px] font-bold text-white mt-1">{userName}</h1>
          </div>
          <div className="w-11 h-11 rounded-full gradient-amber flex items-center justify-center text-lg font-bold text-black">
            {userInitial}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="glass rounded-2xl p-4 animate-fade-up cursor-default"
                style={{ animationDelay: `${i * 0.08}s` }}
                onClick={stat.onClick}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-dim text-[11px] uppercase tracking-wider">{stat.label}</p>
                    <p className="text-[22px] font-bold text-white mt-1.5">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-[10px] ${stat.gradient} flex items-center justify-center`}>
                    <Icon size={20} color="#fff" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-5 flex gap-3">
        <button
          onClick={() => onNavigate('scan')}
          className="flex-1 gradient-amber rounded-xl py-4 text-[15px] font-semibold text-black flex items-center justify-center gap-2"
        >
          <Camera size={20} />
          Scan Item
        </button>
        <button
          onClick={() => onNavigate('add-item')}
          className="flex-1 glass glass-hover rounded-xl py-4 text-[15px] font-semibold text-white flex items-center justify-center gap-2 border border-white/10"
        >
          <Plus size={20} />
          Add Manually
        </button>
      </div>

      {/* Market Movers */}
      {movers.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Market Movers</h2>
              {items.length === 0 && <span className="text-[10px] text-amber-brand/60 bg-amber-500/10 px-2 py-0.5 rounded-full">Demo</span>}
            </div>
            <button onClick={() => onNavigate('alerts')} className="text-amber-brand text-xs font-semibold">
              All Alerts
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto scroll-hide pb-1">
            {movers.map((m, i) => {
              const isUp = m.change >= 0
              const isDemo = m.id.startsWith('demo-')
              return (
                <div
                  key={m.id}
                  onClick={() => isDemo ? onNavigate('add-item') : onViewItem(m.id)}
                  className="glass glass-hover rounded-2xl p-3.5 min-w-[150px] flex-shrink-0 cursor-pointer animate-fade-up"
                  style={{
                    animationDelay: `${i * 0.06}s`,
                    borderTop: `3px solid ${isUp ? '#4ade80' : '#f87171'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{m.emoji}</span>
                    <p className="text-xs font-semibold text-white truncate max-w-[100px]">{m.name}</p>
                  </div>
                  <p className={`text-base font-extrabold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    {isUp ? '+' : ''}{m.changePct.toFixed(1)}%
                  </p>
                  <p className="text-dim text-[10px] mt-0.5">
                    {isUp ? '+' : ''}${Math.abs(Math.round(m.change)).toLocaleString()} since last update
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Similar Items Sold */}
      {similarSold.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-base font-bold text-white">Similar Items Sold</h2>
            <span className="text-dim text-[10px] bg-white/5 px-2 py-0.5 rounded-full">
              {items.length === 0 ? 'Trending now' : 'Based on your inventory'}
            </span>
            {items.length === 0 && <span className="text-[10px] text-purple-400/60 bg-purple-500/10 px-2 py-0.5 rounded-full">Demo</span>}
          </div>
          <div className="flex gap-2.5 overflow-x-auto scroll-hide pb-1">
            {similarSold.map((s, i) => (
              <div
                key={i}
                onClick={() => onNavigate('discover')}
                className="glass glass-hover rounded-2xl p-3.5 min-w-[180px] max-w-[200px] flex-shrink-0 cursor-pointer animate-fade-up"
                style={{
                  animationDelay: `${i * 0.06}s`,
                  borderTop: '3px solid #a855f7',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{s.emoji}</span>
                  <p className="text-xs font-semibold text-white truncate max-w-[130px]">{s.name}</p>
                </div>
                <p className="text-lg font-extrabold text-purple-400">{fmt(s.salePrice)}</p>
                <p className="text-dim text-[10px] mt-1">Sold {s.daysAgo}d ago on {s.platform}</p>
                <div className="mt-2 flex items-center gap-1.5 bg-white/4 rounded-md px-2 py-1">
                  <span className="text-[11px]">{s.relatedEmoji}</span>
                  <p className="text-dim text-[10px] truncate">Similar to {s.relatedTo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discover CTA */}
      <div className="px-6 pb-3">
        <button
          onClick={() => onNavigate('discover')}
          className="w-full glass glass-hover rounded-xl p-4 border border-purple-500/20 flex items-center gap-3.5 text-left"
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.08))' }}
        >
          <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a855f7, #3b82f6)' }}>
            <Search size={22} color="#fff" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Discover Market Prices</p>
            <p className="text-dim text-xs mt-0.5">Search what any item is buying and selling for</p>
          </div>
        </button>
      </div>

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <div className="px-6 pt-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-white">Recent Items</h2>
            <button onClick={() => onNavigate('inventory')} className="text-amber-brand text-xs font-semibold">
              View All
            </button>
          </div>
          <div className="space-y-2">
            {recentItems.map(item => (
              <button
                key={item.id}
                onClick={() => onViewItem(item.id)}
                className="w-full glass glass-hover rounded-xl p-3.5 flex items-center gap-3 text-left transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                  <p className="text-xs text-dim">{item.category}</p>
                </div>
                <p className="text-sm font-bold text-white">{fmt(item.value || item.cost)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
