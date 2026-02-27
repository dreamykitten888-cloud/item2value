'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { ArrowLeft, Search, Plus, X, TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp, ExternalLink, Edit3, Check, AlertTriangle } from 'lucide-react'
import { fmt, fmtFull, CATEGORIES, CATEGORY_EMOJIS } from '@/lib/utils'
import { useItemsStore } from '@/stores/items-store'
import { useAuthStore } from '@/stores/auth-store'
import type { Screen, WatchlistItem } from '@/types'

type SortOption = 'recent' | 'name' | 'price-change' | 'alerts-first'

interface Props {
  onNavigate: (screen: Screen) => void
  onResearch?: (query: string) => void
}

// Mini sparkline component for price history
function MiniSparkline({ history, width = 60, height = 20 }: { history: { date: string; value: number }[]; width?: number; height?: number }) {
  if (history.length < 2) return null
  const values = history.map(h => h.value).filter(v => v > 0)
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  const isUp = values[values.length - 1] >= values[0]

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? '#4ade80' : '#f87171'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function WatchlistScreen({ onNavigate, onResearch }: Props) {
  const {
    watchlist, syncWatchlistItem, updateWatchlistItem, deleteWatchlistItem,
    refreshWatchlistPrices,
  } = useItemsStore()
  const { profileId } = useAuthStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('alerts-first')
  const [showAddForm, setShowAddForm] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const notesInputRef = useRef<HTMLTextAreaElement>(null)

  // Add form state
  const [newItem, setNewItem] = useState({
    name: '', brand: '', model: '', category: 'Other', targetPrice: '',
  })

  // Auto-refresh prices on mount
  const hasRefreshed = useRef(false)
  useEffect(() => {
    if (profileId && watchlist.length > 0 && !hasRefreshed.current) {
      hasRefreshed.current = true
      setRefreshing(true)
      refreshWatchlistPrices(profileId).finally(() => setRefreshing(false))
    }
  }, [profileId, watchlist.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus notes input when editing
  useEffect(() => {
    if (editingNotes && notesInputRef.current) {
      notesInputRef.current.focus()
    }
  }, [editingNotes])

  // Compute alert status per item
  const getAlertStatus = (item: WatchlistItem) => {
    if (item.targetPrice <= 0 || item.lastKnownPrice <= 0) return null
    if (item.lastKnownPrice <= item.targetPrice) return 'at-target'
    const pctAbove = ((item.lastKnownPrice - item.targetPrice) / item.targetPrice) * 100
    if (pctAbove <= 10) return 'near-target'
    return null
  }

  // Compute price change
  const getPriceChange = (item: WatchlistItem) => {
    const h = item.priceHistory
    if (h.length < 2) return null
    const prev = h[h.length - 2].value
    const curr = item.lastKnownPrice
    if (prev <= 0 || curr <= 0) return null
    const change = curr - prev
    const pct = (change / prev) * 100
    return { change, pct, isUp: change >= 0 }
  }

  // Filter + sort
  const processed = useMemo(() => {
    let items = watchlist.filter(w =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.brand.toLowerCase().includes(searchQuery.toLowerCase())
    )

    switch (sortBy) {
      case 'name':
        items = [...items].sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'price-change':
        items = [...items].sort((a, b) => {
          const aChange = getPriceChange(a)?.pct || 0
          const bChange = getPriceChange(b)?.pct || 0
          return Math.abs(bChange) - Math.abs(aChange)
        })
        break
      case 'alerts-first':
        items = [...items].sort((a, b) => {
          const aAlert = getAlertStatus(a)
          const bAlert = getAlertStatus(b)
          if (aAlert && !bAlert) return -1
          if (!aAlert && bAlert) return 1
          return 0
        })
        break
      default:
        break
    }
    return items
  }, [watchlist, searchQuery, sortBy])

  // Command center stats
  const stats = useMemo(() => {
    const total = watchlist.length
    const atTarget = watchlist.filter(w => getAlertStatus(w) === 'at-target').length
    const nearTarget = watchlist.filter(w => getAlertStatus(w) === 'near-target').length
    const withPrices = watchlist.filter(w => w.lastKnownPrice > 0).length
    const priceUp = watchlist.filter(w => { const c = getPriceChange(w); return c && c.isUp }).length
    const priceDown = watchlist.filter(w => { const c = getPriceChange(w); return c && !c.isUp }).length
    return { total, atTarget, nearTarget, withPrices, priceUp, priceDown }
  }, [watchlist])

  const handleAddItem = () => {
    if (!newItem.name.trim()) return
    const emoji = CATEGORY_EMOJIS[newItem.category] || '⭐'
    const item: WatchlistItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name.trim(),
      category: newItem.category,
      emoji,
      brand: newItem.brand.trim(),
      model: newItem.model.trim(),
      targetPrice: parseFloat(newItem.targetPrice) || 0,
      lastKnownPrice: 0,
      priceHistory: [],
      addedAt: new Date().toISOString(),
      linkedItemId: null,
      notes: '',
    }
    if (profileId) {
      syncWatchlistItem(item, profileId)
    }
    setNewItem({ name: '', brand: '', model: '', category: 'Other', targetPrice: '' })
    setShowAddForm(false)
  }

  const handleRefresh = async () => {
    if (!profileId || refreshing) return
    setRefreshing(true)
    await refreshWatchlistPrices(profileId)
    setRefreshing(false)
  }

  const handleSaveNotes = (itemId: string) => {
    updateWatchlistItem(itemId, { notes: notesDraft })
    // Persist to DB
    const updated = useItemsStore.getState().watchlist.find(w => w.id === itemId)
    if (updated && profileId) {
      syncWatchlistItem({ ...updated, notes: notesDraft }, profileId)
    }
    setEditingNotes(null)
  }

  const handleTapItem = (item: WatchlistItem) => {
    const query = [item.name, item.brand].filter(Boolean).join(' ').trim()
    if (onResearch && query) {
      onResearch(query)
    }
  }

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(to bottom, var(--bg-primary) 80%, transparent)' }}>
        <button onClick={() => onNavigate('home')} className="text-white hover:text-amber-brand">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-base font-bold text-white">Watchlist</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1 text-dim hover:text-amber-brand transition-colors"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ─── Command Center Summary ─── */}
      {watchlist.length > 0 && (
        <div className="px-6 pb-4">
          <div className="rounded-2xl p-4" style={{
            background: 'linear-gradient(135deg, rgba(235,156,53,0.08), rgba(168,85,247,0.08))',
            border: '1px solid rgba(235,156,53,0.15)',
          }}>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-black text-white">{stats.total}</p>
                <p className="text-[10px] text-dim uppercase tracking-wider">Watching</p>
              </div>
              <div>
                <p className="text-xl font-black text-green-400">{stats.atTarget}</p>
                <p className="text-[10px] text-dim uppercase tracking-wider">At Target</p>
              </div>
              <div>
                <p className="text-xl font-black text-amber-brand">{stats.nearTarget}</p>
                <p className="text-[10px] text-dim uppercase tracking-wider">Near Target</p>
              </div>
            </div>
            {(stats.priceUp > 0 || stats.priceDown > 0) && (
              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
                {stats.priceUp > 0 && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <TrendingUp size={12} /> {stats.priceUp} trending up
                  </span>
                )}
                {stats.priceDown > 0 && (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <TrendingDown size={12} /> {stats.priceDown} trending down
                  </span>
                )}
              </div>
            )}
            {refreshing && (
              <p className="text-center text-[10px] text-amber-brand/70 mt-2">Refreshing prices...</p>
            )}
          </div>
        </div>
      )}

      <div className="px-6 space-y-3">
        {/* Search + Sort Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search watchlist..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="px-2.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:border-amber-brand/50 focus:outline-none appearance-none"
          >
            <option value="alerts-first">Alerts First</option>
            <option value="recent">Recent</option>
            <option value="name">A-Z</option>
            <option value="price-change">Price Change</option>
          </select>
        </div>

        {/* Add Button or Form */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 glass rounded-xl py-3 text-sm font-semibold text-amber-brand border border-amber-brand/20 hover:bg-amber-brand/[0.06] transition-colors"
          >
            <Plus size={16} /> Add to Watchlist
          </button>
        ) : (
          <div className="glass rounded-xl p-4 border border-amber-brand/20 space-y-2.5 animate-fade-up">
            <div className="flex items-center justify-between mb-1">
              <p className="text-white text-xs font-bold uppercase tracking-wider">New Watchlist Item</p>
              <button onClick={() => setShowAddForm(false)} className="text-dim hover:text-white">
                <X size={16} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Item name (e.g. Nike Air Max 90)"
              value={newItem.name}
              onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAddItem()}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none text-sm"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Brand"
                value={newItem.brand}
                onChange={e => setNewItem(p => ({ ...p, brand: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none text-sm"
              />
              <input
                type="text"
                placeholder="Model"
                value={newItem.model}
                onChange={e => setNewItem(p => ({ ...p, model: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none text-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={newItem.category}
                onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white focus:border-amber-brand/50 focus:outline-none text-sm"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>
                ))}
              </select>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dim text-sm">$</span>
                <input
                  type="number"
                  placeholder="Target price"
                  value={newItem.targetPrice}
                  onChange={e => setNewItem(p => ({ ...p, targetPrice: e.target.value }))}
                  className="w-full pl-7 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleAddItem}
              disabled={!newItem.name.trim()}
              className="w-full gradient-amber rounded-lg py-2.5 font-bold text-black text-sm disabled:opacity-40"
            >
              Add to Watchlist
            </button>
          </div>
        )}

        {/* ─── Watchlist Items ─── */}
        {watchlist.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-base font-bold text-white mb-2">Build your watchlist</p>
            <p className="text-dim text-xs leading-relaxed max-w-[260px] mx-auto">
              Track items you want to buy, set target prices, and get alerts when prices drop
            </p>
          </div>
        ) : processed.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dim text-sm">No items match your search.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {processed.map((item, i) => {
              const priceData = getPriceChange(item)
              const alertStatus = getAlertStatus(item)
              const isEditing = editingNotes === item.id

              return (
                <div
                  key={item.id}
                  className="glass rounded-2xl overflow-hidden border animate-fade-up"
                  style={{
                    animationDelay: `${i * 0.03}s`,
                    borderColor: alertStatus === 'at-target'
                      ? 'rgba(74,222,128,0.3)'
                      : alertStatus === 'near-target'
                      ? 'rgba(235,156,53,0.2)'
                      : 'rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Alert banner */}
                  {alertStatus === 'at-target' && (
                    <div className="px-4 py-1.5 bg-green-500/10 border-b border-green-500/20 flex items-center gap-1.5">
                      <Check size={12} className="text-green-400" />
                      <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
                        At or below target price!
                      </span>
                    </div>
                  )}
                  {alertStatus === 'near-target' && (
                    <div className="px-4 py-1.5 bg-amber-brand/5 border-b border-amber-brand/15 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-amber-brand" />
                      <span className="text-[10px] font-bold text-amber-brand uppercase tracking-wider">
                        Within 10% of target
                      </span>
                    </div>
                  )}

                  {/* Main card content */}
                  <button
                    onClick={() => handleTapItem(item)}
                    className="w-full p-4 text-left hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Emoji */}
                      <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center text-lg flex-shrink-0">
                        {item.emoji}
                      </div>

                      {/* Name + meta */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.brand && <span className="text-dim text-[11px]">{item.brand}</span>}
                          {item.brand && item.category && <span className="text-dim text-[11px]">·</span>}
                          <span className="text-dim text-[11px]">{item.category}</span>
                        </div>
                      </div>

                      {/* Sparkline */}
                      <MiniSparkline history={item.priceHistory} />

                      {/* Price + change */}
                      <div className="text-right flex-shrink-0 ml-1">
                        <p className="font-bold text-white text-sm">
                          {item.lastKnownPrice > 0 ? fmt(item.lastKnownPrice) : '--'}
                        </p>
                        {priceData ? (
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            {priceData.isUp
                              ? <TrendingUp size={11} className="text-green-400" />
                              : <TrendingDown size={11} className="text-red-400" />
                            }
                            <span className={`text-[11px] font-semibold ${priceData.isUp ? 'text-green-400' : 'text-red-400'}`}>
                              {priceData.isUp ? '+' : ''}{priceData.pct.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-dim mt-0.5">--</p>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Bottom bar: target + notes + actions */}
                  <div className="px-4 pb-3 space-y-2">
                    {/* Target price row */}
                    {item.targetPrice > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-dim">Target: {fmtFull(item.targetPrice)}</span>
                        {item.lastKnownPrice > 0 && (
                          <span className={`font-semibold ${item.lastKnownPrice <= item.targetPrice ? 'text-green-400' : 'text-dim'}`}>
                            {item.lastKnownPrice <= item.targetPrice
                              ? '✓ Buy now!'
                              : `${fmtFull(item.lastKnownPrice - item.targetPrice)} above`
                            }
                          </span>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {isEditing ? (
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <textarea
                          ref={notesInputRef}
                          value={notesDraft}
                          onChange={e => setNotesDraft(e.target.value)}
                          placeholder="Add notes (e.g. where to buy, size, colorway...)"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-amber-brand/30 text-white text-xs resize-none focus:outline-none placeholder-slate-500"
                          rows={2}
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleSaveNotes(item.id)}
                            className="text-green-400 hover:text-green-300 p-1"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingNotes(null)}
                            className="text-dim hover:text-white p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : item.notes ? (
                      <button
                        onClick={e => { e.stopPropagation(); setEditingNotes(item.id); setNotesDraft(item.notes) }}
                        className="w-full text-left bg-white/[0.03] rounded-lg px-2.5 py-1.5 text-xs text-dim hover:text-white transition-colors flex items-start gap-1.5"
                      >
                        <Edit3 size={10} className="mt-0.5 flex-shrink-0 text-amber-brand/50" />
                        <span className="line-clamp-2">{item.notes}</span>
                      </button>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); setEditingNotes(item.id); setNotesDraft('') }}
                        className="text-[10px] text-dim hover:text-amber-brand transition-colors"
                      >
                        + Add notes
                      </button>
                    )}

                    {/* Action row */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04]">
                      <a
                        href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent([item.name, item.brand].filter(Boolean).join(' '))}&LH_Sold=1&LH_Complete=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg no-underline hover:bg-blue-500/20 transition-colors"
                      >
                        eBay Sold ↗
                      </a>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); handleTapItem(item) }}
                          className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg hover:bg-purple-500/20 transition-colors"
                        >
                          Research
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteWatchlistItem(item.id) }}
                          className="text-dim hover:text-red-400 transition-colors p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
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
