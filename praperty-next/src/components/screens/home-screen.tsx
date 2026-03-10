'use client'

import { useEffect, useMemo, useState } from 'react'
import { Package, DollarSign, BarChart3, Bell, Search, TrendingUp, TrendingDown, Info, Eye, Plus, X, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useItemsStore, type StoredSignal } from '@/stores/items-store'
import { fmt, getGreeting } from '@/lib/utils'
import { generateAlerts } from '@/lib/alerts-engine'
import { getSuggestions, matchProduct, searchProducts } from '@/lib/product-db'
import type { Screen, Item, WatchlistItem } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onViewItem: (id: string) => void
  onResearch: (query: string) => void
}

/**
 * Market Movers: uses REAL stored signals from background refresh.
 * Falls back to price history when signals haven't loaded yet.
 */
function getMarketMovers(items: Item[], signals: Map<string, StoredSignal>) {
  const activeItems = items.filter(i => !i.dateSold)
  if (activeItems.length === 0) return []

  // Priority 1: Items with stored signals that show real price changes
  const withSignals = activeItems
    .map(item => {
      const signal = signals.get(item.id)
      if (signal && signal.ebayAvgPrice > 0) {
        return {
          ...item,
          change: signal.priceChangeAbs,
          changePct: signal.priceChangePct,
          convictionLevel: signal.convictionLevel,
          convictionScore: signal.convictionScore,
          ebayAvg: signal.ebayAvgPrice,
        }
      }
      return null
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b!.changePct) - Math.abs(a!.changePct))
    .slice(0, 5) as (Item & { change: number; changePct: number; convictionLevel?: string; convictionScore?: number; ebayAvg?: number })[]

  if (withSignals.length > 0) return withSignals

  // Priority 2: Items with 2+ price history entries (from comps or manual updates)
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

  if (realMovers.length > 0) return realMovers

  // Priority 3: Show top items by value (no fake changes, just portfolio view)
  return activeItems
    .filter(i => (i.value || i.cost) > 0)
    .sort((a, b) => (b.value || b.cost) - (a.value || a.cost))
    .slice(0, 5)
    .map(item => ({ ...item, change: 0, changePct: 0 }))
}

/**
 * Conviction Banners: Items with strong BUY or SELL signals.
 * The "AYOOO SELL" energy. Only shows when real signals exist.
 */
function getConvictionAlerts(items: Item[], signals: Map<string, StoredSignal>) {
  const activeItems = items.filter(i => !i.dateSold)

  return activeItems
    .map(item => {
      const signal = signals.get(item.id)
      if (!signal || signal.ebayAvgPrice === 0) return null
      if (signal.convictionLevel === 'SELL' && signal.convictionScore >= 65) {
        return { ...item, signal, urgency: 'sell' as const }
      }
      if (signal.convictionLevel === 'BUY' && signal.priceChangePct < -10) {
        return { ...item, signal, urgency: 'buy' as const }
      }
      return null
    })
    .filter(Boolean) as (Item & { signal: StoredSignal; urgency: 'buy' | 'sell' })[]
}

/**
 * Top Market Values: replaces fake "Similar Items Sold" with real eBay avg prices
 * from stored signals. Shows your items ranked by market value.
 */
function getMarketPriced(items: Item[], signals: Map<string, StoredSignal>) {
  const activeItems = items.filter(i => !i.dateSold)

  return activeItems
    .map(item => {
      const signal = signals.get(item.id)
      const ebayAvg = signal?.ebayAvgPrice || 0
      const listingCount = signal?.ebayListingCount || 0
      const trendDirection = signal?.trendDirection || 'stable'
      const roi = item.cost > 0 && ebayAvg > 0
        ? Math.round(((ebayAvg - item.cost) / item.cost) * 100)
        : null
      return { ...item, ebayAvg, listingCount, trendDirection, roi }
    })
    .filter(i => i.ebayAvg > 0)
    .sort((a, b) => b.ebayAvg - a.ebayAvg)
    .slice(0, 5)
}

export default function HomeScreen({ onNavigate, onViewItem, onResearch }: Props) {
  const { profile, profileId } = useAuthStore()
  const { items, watchlist, syncWatchlistItem, setWatchlist, deleteWatchlistItem, storedSignals, signalsLoading, loadStoredSignals, refreshAllSignals, refreshWatchlistPrices } = useItemsStore()
  const [watchSearchQuery, setWatchSearchQuery] = useState('')
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null)
  const userName = profile?.name || 'there'
  const userInitial = userName.charAt(0).toUpperCase()

  const activeItems = items.filter(i => !i.dateSold)
  const soldItems = items.filter(i => !!i.dateSold)
  const totalValue = activeItems.reduce((sum, i) => sum + (i.value || 0), 0)
  const totalEarnings = soldItems.reduce((sum, i) => sum + (i.earnings || i.value || 0), 0)

  // Load stored signals on mount, trigger background refresh if stale
  // CRITICAL: Throttle to prevent race conditions when navigating back from add/edit
  // Without this, loadAll fires before syncItem finishes and wipes new items
  useEffect(() => {
    if (!profileId) return
    if (items.length > 0) {
      loadStoredSignals(profileId)

      // Only refresh if last refresh was > 30s ago (prevents race with syncItem)
      const lastRefresh = useItemsStore.getState().signalsLastRefresh
      const stale = !lastRefresh || (Date.now() - new Date(lastRefresh).getTime() > 30_000)
      if (stale) {
        refreshAllSignals(profileId)
      }
    }
    // Also refresh watchlist prices client-side (no service key needed)
    if (watchlist.length > 0) {
      const lastRefresh = useItemsStore.getState().signalsLastRefresh
      const stale = !lastRefresh || (Date.now() - new Date(lastRefresh).getTime() > 30_000)
      if (stale) {
        refreshWatchlistPrices(profileId)
      }
    }
  }, [profileId, items.length, watchlist.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const alerts = useMemo(() => generateAlerts(items, storedSignals), [items, storedSignals])
  const alertCount = alerts.length
  const movers = useMemo(() => getMarketMovers(items, storedSignals), [items, storedSignals])
  const convictionAlerts = useMemo(() => getConvictionAlerts(items, storedSignals), [items, storedSignals])
  const marketPriced = useMemo(() => getMarketPriced(items, storedSignals), [items, storedSignals])

  // Watchlist search suggestions: instant local + debounced Supabase
  const [watchSearchSuggestions, setWatchSearchSuggestions] = useState<{ name: string; brand: string; category: string; emoji: string }[]>([])
  useEffect(() => {
    if (watchSearchQuery.trim().length < 2) {
      setWatchSearchSuggestions([])
      return
    }
    // Instant local results
    setWatchSearchSuggestions(getSuggestions(watchSearchQuery, 6))
    // Debounced Supabase upgrade
    const timer = setTimeout(async () => {
      const results = await searchProducts(watchSearchQuery, 6)
      if (results.length > 0) setWatchSearchSuggestions(results)
    }, 250)
    return () => clearTimeout(timer)
  }, [watchSearchQuery])

  const handleAddToWatchlist = (name: string, category: string, emoji: string, brand: string) => {
    const newItem = {
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      category,
      emoji,
      brand,
      model: '',
      targetPrice: 0,
      lastKnownPrice: 0,
      priceHistory: [],
      addedAt: new Date().toISOString(),
      linkedItemId: null,
      notes: '',
    }
    setWatchlist([newItem, ...watchlist])
    if (profileId) syncWatchlistItem(newItem, profileId)
  }

  const stats = [
    { label: 'Total Items', value: String(items.length), icon: Package, gradient: 'bg-gradient-blue', info: 'All items in your inventory (active + sold)' },
    { label: 'Total Value', value: fmt(totalValue), icon: DollarSign, gradient: 'bg-gradient-amber', info: 'Combined market value of all active items' },
    { label: 'Total Earnings', value: totalEarnings > 0 ? fmt(totalEarnings) : '--', icon: BarChart3, gradient: 'bg-gradient-purple', onClick: () => onNavigate('sold-items'), info: 'Revenue from all sold items' },
    { label: 'Alerts', value: alertCount > 0 ? String(alertCount) : '--', icon: Bell, gradient: 'bg-gradient-amber', onClick: () => onNavigate('alerts'), info: 'Price alerts, action items, and insights' },
  ]

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
                className="glass rounded-2xl p-4 animate-fade-up cursor-default relative group"
                style={{ animationDelay: `${i * 0.08}s` }}
                onClick={stat.onClick}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-dim text-[11px] uppercase tracking-wider">{stat.label}</p>
                      <div className="relative">
                        <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center cursor-help peer">
                          <Info size={10} className="text-zinc-500" />
                        </div>
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 peer-hover:opacity-100 peer-active:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg border border-white/10">
                          {stat.info}
                        </div>
                      </div>
                    </div>
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

      {/* Conviction Banners - "AYOOO SELL" / "YO BUY" */}
      {convictionAlerts.length > 0 && (
        <div className="px-6 pb-3">
          {convictionAlerts.map((alert, i) => {
            const isSell = alert.urgency === 'sell'
            return (
              <div
                key={alert.id}
                onClick={() => onViewItem(alert.id)}
                className="rounded-2xl p-4 mb-2 cursor-pointer animate-fade-up"
                style={{
                  animationDelay: `${i * 0.08}s`,
                  background: isSell
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.10))'
                    : 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.10))',
                  border: `1px solid ${isSell ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{alert.emoji}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{alert.name}</p>
                      <p className={`text-xs font-bold mt-0.5 ${isSell ? 'text-red-400' : 'text-green-400'}`}>
                        {isSell ? '🔥 SELL NOW' : '💰 BUY OPPORTUNITY'} - Score {alert.signal.convictionScore}/100
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-extrabold text-white">{fmt(alert.signal.ebayAvgPrice)}</p>
                    <p className="text-[10px] text-dim">eBay avg</p>
                  </div>
                </div>
                <p className="text-xs text-dim mt-2">{alert.signal.convictionHeadline}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Market Movers */}
      {movers.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Market Movers</h2>
              {signalsLoading && (
                <span className="text-[10px] text-amber-brand/60 bg-amber-brand/10 px-2 py-0.5 rounded-full animate-pulse">Refreshing</span>
              )}
            </div>
            <button onClick={() => onNavigate('alerts')} className="text-amber-brand text-xs font-semibold">
              All Alerts
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto scroll-hide pb-1">
            {movers.map((m, i) => {
              const isUp = m.change >= 0
              const hasChange = m.changePct !== 0
              const conviction = (m as any).convictionLevel
              return (
                <div
                  key={m.id}
                  onClick={() => onViewItem(m.id)}
                  className="glass glass-hover rounded-2xl p-3.5 min-w-[150px] flex-shrink-0 cursor-pointer animate-fade-up"
                  style={{
                    animationDelay: `${i * 0.06}s`,
                    borderTop: `3px solid ${hasChange ? (isUp ? '#4ade80' : '#f87171') : '#EB9C35'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{m.emoji}</span>
                    <p className="text-xs font-semibold text-white truncate max-w-[100px]">{m.name}</p>
                  </div>
                  {hasChange ? (
                    <>
                      <p className={`text-base font-extrabold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {isUp ? '+' : ''}{m.changePct.toFixed(1)}%
                      </p>
                      <p className="text-dim text-[10px] mt-0.5">
                        {isUp ? '+' : ''}${Math.abs(Math.round(m.change)).toLocaleString()} since last check
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-extrabold text-amber-brand">{fmt(m.value || m.cost)}</p>
                      <p className="text-dim text-[10px] mt-0.5">Current value</p>
                    </>
                  )}
                  {conviction && (
                    <span className={`inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      conviction === 'SELL' ? 'bg-red-500/20 text-red-400' :
                      conviction === 'BUY' ? 'bg-green-500/20 text-green-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>{conviction}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Market Values (replaces fake "Similar Items Sold" with real eBay data) */}
      {marketPriced.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-base font-bold text-white">Market Values</h2>
            <span className="text-dim text-[10px] bg-white/5 px-2 py-0.5 rounded-full">
              Live eBay data
            </span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto scroll-hide pb-1">
            {marketPriced.map((item, i) => {
              const roiColor = item.roi !== null ? (item.roi >= 0 ? 'text-green-400' : 'text-red-400') : 'text-dim'
              return (
                <div
                  key={item.id}
                  onClick={() => onViewItem(item.id)}
                  className="glass glass-hover rounded-2xl p-3.5 min-w-[180px] max-w-[200px] flex-shrink-0 cursor-pointer animate-fade-up"
                  style={{
                    animationDelay: `${i * 0.06}s`,
                    borderTop: '3px solid #a855f7',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{item.emoji}</span>
                    <p className="text-xs font-semibold text-white truncate max-w-[130px]">{item.name}</p>
                  </div>
                  <p className="text-lg font-extrabold text-purple-400">{fmt(item.ebayAvg)}</p>
                  <p className="text-dim text-[10px] mt-0.5">{item.listingCount} listings on eBay</p>
                  {item.roi !== null && (
                    <p className={`text-[11px] font-bold mt-1 ${roiColor}`}>
                      {item.roi >= 0 ? '+' : ''}{item.roi}% ROI vs cost
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-1.5 bg-white/4 rounded-md px-2 py-1">
                    <span className="text-[11px]">{item.trendDirection === 'rising' ? '📈' : item.trendDirection === 'declining' ? '📉' : '➡️'}</span>
                    <p className="text-dim text-[10px] capitalize">{item.trendDirection} trend</p>
                  </div>
                </div>
              )
            })}
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

      {/* Watchlist */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-emerald-400" />
            <h2 className="text-base font-bold text-white">Watchlist</h2>
            {watchlist.length > 0 && (
              <span className="text-dim text-[10px] bg-white/5 px-2 py-0.5 rounded-full">{watchlist.length}</span>
            )}
          </div>
        </div>

        {/* Search to add */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input
            placeholder="Search items to watch..."
            value={watchSearchQuery}
            onChange={e => setWatchSearchQuery(e.target.value)}
            className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-white/10 bg-white/5 text-white text-[13px] focus:border-emerald-400/50 focus:outline-none placeholder-slate-500"
          />
          {/* Search dropdown */}
          {watchSearchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-white/12 overflow-hidden shadow-xl" style={{ background: '#111a11' }}>
              {/* Custom add: whatever they typed */}
              {(() => {
                const typed = watchSearchQuery.trim()
                const alreadyWatching = watchlist.some(w => w.name.toLowerCase() === typed.toLowerCase())
                const brandMatch = matchProduct(typed)
                if (!alreadyWatching && typed.length >= 2) {
                  return (
                    <button
                      onClick={() => {
                        handleAddToWatchlist(typed, brandMatch?.category || 'Other', brandMatch?.emoji || '👀', brandMatch?.brand || '')
                        setWatchSearchQuery('')
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/6 transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <Plus size={14} className="text-emerald-400 flex-shrink-0" />
                      <span className="flex-1 text-[13px] text-white font-medium truncate">Add &ldquo;{typed}&rdquo;</span>
                      <span className="text-[10px] text-dim">Custom</span>
                    </button>
                  )
                }
                return null
              })()}
              {/* Product suggestions */}
              {watchSearchSuggestions.map((suggestion, i) => {
                const alreadyWatching = watchlist.some(w => w.name.toLowerCase() === suggestion.name.toLowerCase())
                return (
                  <button
                    key={i}
                    disabled={alreadyWatching}
                    onClick={() => {
                      if (!alreadyWatching) {
                        handleAddToWatchlist(suggestion.name, suggestion.category, suggestion.emoji, suggestion.brand)
                        setWatchSearchQuery('')
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${alreadyWatching ? 'opacity-40' : 'hover:bg-white/6'}`}
                    style={{ borderBottom: i < watchSearchSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                  >
                    <span className="text-sm">{suggestion.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] text-white font-medium truncate block">{suggestion.name}</span>
                      {suggestion.brand !== suggestion.name && (
                        <span className="text-[10px] text-dim">{suggestion.brand}</span>
                      )}
                    </div>
                    {alreadyWatching ? (
                      <span className="text-[10px] text-emerald-400 font-semibold">Watching</span>
                    ) : (
                      <Plus size={14} className="text-emerald-400 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {watchlist.length === 0 ? (
          <div className="glass rounded-2xl p-5 text-center">
            <p className="text-xs text-dim">Search above to start watching items you're interested in.</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 pb-1.5 border-b border-white/8">
              <span className="text-dim text-[9px] uppercase tracking-wider">Item</span>
              <span className="text-dim text-[9px] uppercase tracking-wider text-right min-w-[65px]">Mkt Value</span>
              <span className="text-dim text-[9px] uppercase tracking-wider text-right min-w-[70px]">Daily Chg</span>
            </div>
            {watchlist.map((w, wi) => {
              // Real price change from actual history only, no fake hash fallback
              const hasRealHistory = w.priceHistory.length >= 2 && w.priceHistory[w.priceHistory.length - 2].value > 0
              const changePct = hasRealHistory
                ? ((w.lastKnownPrice - w.priceHistory[w.priceHistory.length - 2].value) / w.priceHistory[w.priceHistory.length - 2].value) * 100
                : null
              const isUp = changePct !== null ? changePct >= 0 : true
              const isSwiped = swipedItemId === w.id
              return (
                <div
                  key={w.id}
                  className="relative overflow-hidden rounded-lg"
                  style={{ borderBottom: wi < watchlist.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  {/* Delete button (behind the row) */}
                  <div className="absolute right-0 top-0 bottom-0 flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteWatchlistItem(w.id)
                        setSwipedItemId(null)
                      }}
                      className="h-full px-4 bg-red-500/90 flex items-center gap-1.5 text-white text-xs font-bold hover:bg-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                  {/* Row content (slides left on swipe) */}
                  <div
                    className={`relative grid grid-cols-[1fr_auto_auto] gap-2 items-center px-2 py-2.5 transition-transform duration-200 ease-out cursor-pointer ${isSwiped ? '-translate-x-[88px]' : 'translate-x-0'}`}
                    style={{ background: 'var(--bg-primary)' }}
                    onClick={() => {
                      if (isSwiped) {
                        setSwipedItemId(null)
                      } else {
                        onResearch(w.name)
                      }
                    }}
                    onTouchStart={(e) => {
                      const touch = e.touches[0]
                      const el = e.currentTarget
                      el.dataset.startX = String(touch.clientX)
                      el.dataset.startY = String(touch.clientY)
                    }}
                    onTouchMove={(e) => {
                      const el = e.currentTarget
                      const startX = Number(el.dataset.startX || 0)
                      const startY = Number(el.dataset.startY || 0)
                      const dx = e.touches[0].clientX - startX
                      const dy = e.touches[0].clientY - startY
                      // Only trigger swipe if horizontal movement > vertical
                      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
                        if (dx < -30) setSwipedItemId(w.id)
                        if (dx > 30) setSwipedItemId(null)
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm flex-shrink-0">{w.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-white truncate">{w.name}</p>
                        <p className="text-dim text-[10px]">{w.brand || w.category}</p>
                      </div>
                    </div>
                    <p className="text-[13px] font-bold text-white text-right min-w-[65px]">
                      {w.lastKnownPrice > 0 ? fmt(w.lastKnownPrice) : '--'}
                    </p>
                    <p className={`text-[12px] font-bold text-right min-w-[70px] ${changePct === null ? 'text-dim' : isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {changePct !== null ? `${isUp ? '+' : ''}${changePct.toFixed(1)}%` : '--'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
