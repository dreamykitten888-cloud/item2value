'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { ArrowLeft, Edit3, Trash2, Plus, ExternalLink, X, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { useAuthStore } from '@/stores/auth-store'
import { fmt, fmtFull } from '@/lib/utils'
import { getMarketplacesForCategory, buildSearchTerms, getTrendLinks, COMP_SOURCES } from '@/lib/marketplaces'
import { calculateConviction } from '@/lib/conviction'
import SignalBreakdown from '@/components/signal-breakdown'
import MarketIntel from '@/components/market-intel'
import TrendIndicator from '@/components/trend-indicator'
import type { Screen, Comp } from '@/types'

interface Props {
  itemId: string | null
  onBack: () => void
  onNavigate: (screen: Screen) => void
  onResearch?: (query: string) => void
}

export default function DetailScreen({ itemId, onBack, onNavigate, onResearch }: Props) {
  const { items, deleteItem, ebayComps, ebayLoading, ebayError, communityComps, fetchEbayComps, fetchCommunityComps, addCompToItem, deleteCompFromItem, clearEbayComps, clearCommunityComps, syncItem, marketSignal, marketSignalLoading, fetchMarketSignal, clearMarketSignal } = useItemsStore()
  const { profileId } = useAuthStore()

  const item = items.find(i => i.id === itemId)

  // UI state (Research & market data collapsed by default for less TMI)
  const [showResearchMarket, setShowResearchMarket] = useState(false)
  const [showComps, setShowComps] = useState(false)
  const [showEbay, setShowEbay] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [addingComp, setAddingComp] = useState(false)
  const [compForm, setCompForm] = useState({ title: '', url: '', price: '', source: 'eBay', condition: 'Good' })

  // Auto-fetch market signal when item loads (eBay prices + Google Trends)
  const lastFetchedId = useRef<string | null>(null)
  useEffect(() => {
    if (item && item.id !== lastFetchedId.current) {
      lastFetchedId.current = item.id
      clearMarketSignal()
      fetchMarketSignal(item)
    }
  }, [item?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Conviction score (now powered by live market data when available)
  const conviction = useMemo(
    () => item ? calculateConviction(item, marketSignal ?? undefined) : null,
    [item, marketSignal]
  )

  if (!item) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-dim text-sm">Item not found</p>
          <button onClick={onBack} className="mt-4 text-amber-brand text-sm font-semibold">Go back</button>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (window.confirm(`Delete "${item.name}"? This cannot be undone.`)) {
      await deleteItem(item.id)
      onBack()
    }
  }

  const profit = item.value - item.cost
  const profitPct = item.cost > 0 ? Math.round((profit / item.cost) * 100) : null
  const isUp = profit >= 0
  const netIfSold = item.asking > 0 ? item.asking - item.cost : null

  const searchTerms = buildSearchTerms(item.name, item.brand, item.model)
  const marketplaces = getMarketplacesForCategory(item.category, searchTerms)

  // Comp avg
  const compPrices = (item.comps || []).filter(c => c.price > 0).map(c => c.price)
  const avgComp = compPrices.length > 0
    ? Math.round(compPrices.reduce((s, p) => s + p, 0) / compPrices.length)
    : null

  const handleSaveComp = () => {
    if (!compForm.title || !compForm.price) return
    const newComp: Comp = {
      id: Date.now(),
      source: compForm.source,
      title: compForm.title,
      price: parseFloat(compForm.price),
      condition: compForm.condition,
      date: 'just now',
      url: compForm.url,
    }
    const updated = addCompToItem(item.id, newComp)
    setCompForm({ title: '', url: '', price: '', source: 'eBay', condition: 'Good' })
    setAddingComp(false)
    if (profileId && updated) syncItem(updated, profileId)
  }

  const handleAddEbayAsComp = (listing: typeof ebayComps[0], idx: number) => {
    const newComp: Comp = {
      id: Date.now() + idx,
      source: 'eBay',
      title: listing.title,
      price: listing.price?.value || 0,
      condition: listing.condition || 'Good',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      url: listing.itemUrl,
    }
    const updated = addCompToItem(item.id, newComp)
    if (profileId && updated) syncItem(updated, profileId)
  }

  const handleAddCommunityComp = (c: Comp, ci: number) => {
    const newComp: Comp = {
      id: Date.now() + ci,
      source: c.source || 'Community',
      title: c.title,
      price: c.price,
      condition: c.condition || 'Good',
      date: 'community',
      url: c.url || '',
    }
    const updated = addCompToItem(item.id, newComp)
    clearCommunityComps()
    if (profileId && updated) syncItem(updated, profileId)
  }

  const handleDeleteComp = (compId: number) => {
    if (window.confirm('Delete this comparable?')) {
      const updated = deleteCompFromItem(item.id, compId)
      if (profileId && updated) syncItem(updated, profileId)
    }
  }

  const handleResearch = () => {
    if (onResearch) {
      onResearch(searchTerms)
    } else {
      onNavigate('research')
    }
  }

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(to bottom, var(--bg-primary) 60%, transparent)' }}>
        <button onClick={onBack} className="p-1 -ml-1 text-dim hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-sm font-bold text-white truncate max-w-[60%]">{item.name}</h1>
        <button onClick={() => onNavigate('edit-item')} className="p-1 text-dim hover:text-amber-brand transition-colors">
          <Edit3 size={18} />
        </button>
      </div>

      {/* ─── Photo Strip ─── */}
      {item.photos && item.photos.length > 0 ? (
        <div className="px-6 pb-4">
          <div className="flex gap-2 overflow-x-auto scroll-hide">
            {item.photos.map((photo, idx) => (
              <div
                key={idx}
                className={`${item.photos.length === 1 ? 'w-full' : 'w-[75%] flex-shrink-0'} aspect-square rounded-2xl overflow-hidden bg-white/5`}
              >
                <img src={photo} alt={item.name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-6 pb-4">
          <div className="w-full h-40 rounded-2xl bg-white/5 flex items-center justify-center">
            <span className="text-5xl">{item.emoji}</span>
          </div>
        </div>
      )}

      {/* ─── Profit Hero ─── */}
      <div className="px-6 pb-4">
        <div className="glass rounded-2xl p-5">
          {/* Big profit number */}
          <div className="text-center mb-3">
            <p className={`text-3xl font-black ${isUp ? 'text-green-400' : 'text-red-400'}`}>
              {isUp ? '+' : '-'}${Math.abs(Math.round(profit)).toLocaleString()}
            </p>
            {profitPct !== null && (
              <div className="flex items-center justify-center gap-1.5 mt-1">
                {isUp ? <TrendingUp size={14} className="text-green-400" /> : <TrendingDown size={14} className="text-red-400" />}
                <span className={`text-sm font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {isUp ? '+' : ''}{profitPct}% {isUp ? 'PROFIT' : 'LOSS'}
                </span>
              </div>
            )}
          </div>

          {/* Paid → Now bar */}
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-dim">Paid {fmtFull(item.cost)}</span>
            <span className="text-white font-bold">Now {fmtFull(item.value)}</span>
          </div>

          {/* Visual gain bar */}
          {item.cost > 0 && item.value > 0 && (
            <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(5, (item.value / (Math.max(item.value, item.cost) * 1.1)) * 100))}%`,
                  background: isUp
                    ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                    : 'linear-gradient(90deg, #f87171, #ef4444)',
                }}
              />
            </div>
          )}

          {/* If sold calculation */}
          {item.asking > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-dim text-xs">Asking {fmtFull(item.asking)}</span>
              {netIfSold !== null && (
                <span className={`text-xs font-bold ${netIfSold >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  If sold: {netIfSold >= 0 ? '+' : ''}{fmtFull(netIfSold)} net
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Conviction Gauge ─── */}
      <div className="px-6 pb-4">
        {conviction && <SignalBreakdown result={conviction} fetchedAt={marketSignal?.fetchedAt} />}
      </div>

      {/* ─── Action Buttons ─── */}
      <div className="px-6 pb-4">
        <div className="flex gap-2">
          <a
            href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchTerms)}&LH_Sold=1&LH_Complete=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 gradient-amber rounded-2xl py-3.5 text-sm font-bold text-black text-center no-underline"
          >
            🔍 Search Market
          </a>
          <button
            onClick={handleResearch}
            className="flex-1 border border-amber-brand/40 rounded-2xl py-3.5 text-sm font-bold text-amber-brand bg-amber-brand/[0.08]"
          >
            📊 Deep Research
          </button>
        </div>
      </div>

      {/* ─── Research & market data (collapsible, collapsed by default) ─── */}
      <div className="px-6 pb-4">
        <button
          onClick={() => setShowResearchMarket(!showResearchMarket)}
          className="w-full flex items-center justify-between glass rounded-2xl p-4"
        >
          <h3 className="text-sm font-bold text-white">Research & market data</h3>
          {showResearchMarket ? <ChevronUp size={16} className="text-dim" /> : <ChevronDown size={16} className="text-dim" />}
        </button>

        {showResearchMarket && (
          <div className="mt-2 space-y-4 animate-fade-up">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-white">Market Intel</h4>
                <button
                  onClick={() => fetchEbayComps(item)}
                  disabled={ebayLoading}
                  className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg"
                >
                  {ebayLoading ? 'Searching...' : ebayComps.length > 0 ? '↻ Refresh' : 'Search eBay'}
                </button>
              </div>

              {ebayLoading && (
                <div className="py-4 text-center">
                  <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto" />
                  <p className="text-dim text-[10px] mt-2">Searching eBay...</p>
                </div>
              )}

              {ebayError && !ebayLoading && (
                <p className="text-red-400 text-xs text-center py-2">{ebayError}</p>
              )}

              {!ebayLoading && !ebayError && ebayComps.length === 0 && !avgComp && (
                <p className="text-dim text-xs py-1">Tap &quot;Search eBay&quot; for live market prices.</p>
              )}

              {!ebayLoading && ebayComps.length > 0 && (() => {
                const prices = ebayComps.map(c => c.price?.value).filter((p): p is number => !!p && p > 0)
                if (prices.length === 0) return null
                const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
                const low = Math.round(Math.min(...prices))
                const high = Math.round(Math.max(...prices))
                const diff = item.value > 0 ? ((avg - item.value) / item.value) * 100 : 0
                return (
                  <div className="space-y-1.5 py-1">
                    <div className="flex justify-between items-center">
                      <span className="text-dim text-xs">eBay avg ({prices.length} listings)</span>
                      <span className="text-base font-bold text-blue-400">{fmtFull(avg)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-dim text-xs">Range</span>
                      <span className="text-xs text-white/70">{fmtFull(low)} - {fmtFull(high)}</span>
                    </div>
                    {item.value > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-dim text-xs">vs. your value</span>
                        <span className={`text-xs font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {diff >= 0 ? '+' : ''}{diff.toFixed(0)}% {diff >= 0 ? 'above' : 'below'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })()}

              {avgComp && (
                <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-white/5">
                  <span className="text-dim text-xs">My comps avg ({compPrices.length})</span>
                  <span className="text-sm font-bold text-amber-brand">{fmtFull(avgComp)}</span>
                </div>
              )}

              {marketplaces.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-white/5">
                  {marketplaces.slice(0, 5).map(m => (
                    <a
                      key={m.name}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg no-underline"
                      style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}22` }}
                    >
                      {m.name} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>

            <MarketIntel item={item} />

            <div>
              <TrendIndicator />
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Price Tools</h4>
              <div className="flex flex-col gap-1.5">
                {getTrendLinks(buildSearchTerms(item.name, item.brand, item.model)).slice(0, 3).map(t => (
                  <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 no-underline hover:border-white/20 transition-colors">
                    <div>
                      <span className="text-sm font-semibold text-white">{t.name}</span>
                      <br />
                      <span className="text-[10px] text-white/40">{t.desc}</span>
                    </div>
                    <ExternalLink size={14} className="text-white/30" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Comps (collapsible) ─── */}
      <div className="px-6 pb-4">
        <button
          onClick={() => setShowComps(!showComps)}
          className="w-full flex items-center justify-between glass rounded-2xl p-4"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Comps</h3>
            <span className="text-dim text-[11px]">({(item.comps || []).length})</span>
          </div>
          {showComps ? <ChevronUp size={16} className="text-dim" /> : <ChevronDown size={16} className="text-dim" />}
        </button>

        {showComps && (
          <div className="mt-2 space-y-2 animate-fade-up">
            {/* Existing comps */}
            {(item.comps || []).map((comp, i) => (
              <div key={comp.id || i} className="flex justify-between items-center glass rounded-xl p-3">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm text-white truncate">{comp.title}</p>
                  <p className="text-[10px] text-dim">
                    {comp.source}{comp.condition ? ` · ${comp.condition}` : ''}{comp.date ? ` · ${comp.date}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-amber-brand">{fmt(comp.price)}</span>
                  {comp.url && (
                    <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      <ExternalLink size={12} />
                    </a>
                  )}
                  <button onClick={() => handleDeleteComp(comp.id || 0)} className="text-red-400/60 hover:text-red-400 p-1">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* eBay listings (if fetched) */}
            {!ebayLoading && ebayComps.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-dim uppercase tracking-wider font-semibold mt-2">eBay Listings</p>
                {ebayComps.map((listing, idx) => (
                  <div key={listing.id || idx} className="flex gap-3 p-3 glass rounded-xl">
                    {listing.image && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                        <img src={listing.image} alt="" loading="lazy" className="w-full h-full object-cover" onError={e => { (e.target as HTMLElement).parentElement!.style.display = 'none' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{listing.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-sm font-bold text-amber-brand">${listing.price?.value?.toLocaleString() || '?'}</span>
                        {listing.condition && <span className="text-[10px] text-dim bg-white/5 px-1.5 py-0.5 rounded">{listing.condition}</span>}
                      </div>
                      <div className="flex gap-1.5 mt-1.5">
                        {listing.itemUrl && (
                          <a href={listing.itemUrl} target="_blank" rel="noopener noreferrer"
                            className="bg-blue-500/15 border border-blue-500/30 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-blue-400 no-underline">
                            eBay ↗
                          </a>
                        )}
                        <button onClick={() => handleAddEbayAsComp(listing, idx)}
                          className="bg-amber-brand/10 border border-amber-brand/25 rounded-lg px-2 py-0.5 text-[10px] font-bold text-amber-brand">
                          + Comp
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Community comps */}
            {communityComps.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-dim uppercase tracking-wider font-semibold mt-2">Community</p>
                {communityComps.slice(0, 5).map((c, ci) => (
                  <div key={ci} className="flex justify-between items-center glass rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{c.title}</p>
                      <p className="text-dim text-[10px]">{c.source} · {c.condition}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-amber-brand">{fmt(c.price)}</span>
                      <button onClick={() => handleAddCommunityComp(c, ci)}
                        className="bg-amber-brand/20 rounded-lg px-2 py-0.5 text-[10px] font-bold text-amber-brand">
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add comp form */}
            {addingComp ? (
              <div className="space-y-2 mt-2">
                <input type="text" placeholder="Title (e.g. eBay listing name)"
                  value={compForm.title} onChange={e => setCompForm(p => ({ ...p, title: e.target.value }))}
                  className="form-input w-full" />
                <input type="number" placeholder="Price" step="0.01"
                  value={compForm.price} onChange={e => setCompForm(p => ({ ...p, price: e.target.value }))}
                  className="form-input w-full" />
                <input type="url" placeholder="URL (optional)"
                  value={compForm.url} onChange={e => setCompForm(p => ({ ...p, url: e.target.value }))}
                  className="form-input w-full" />
                <div className="flex gap-2">
                  <select value={compForm.source} onChange={e => setCompForm(p => ({ ...p, source: e.target.value }))} className="form-input flex-1">
                    {COMP_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={compForm.condition} onChange={e => setCompForm(p => ({ ...p, condition: e.target.value }))} className="form-input flex-1">
                    {['New','Like New','Excellent','Very Good','Good','Fair'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveComp} className="flex-1 gradient-amber rounded-xl py-3 text-sm font-bold text-black">Save</button>
                  <button onClick={() => { setAddingComp(false); setCompForm({ title: '', url: '', price: '', source: 'eBay', condition: 'Good' }) }}
                    className="flex-1 glass rounded-xl py-3 text-sm font-semibold text-white border border-white/10">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setAddingComp(true)}
                  className="flex-1 glass rounded-xl py-3 text-sm font-semibold text-amber-brand border border-white/10 flex items-center justify-center gap-1.5">
                  <Plus size={14} /> Add Comp
                </button>
                <button onClick={() => { clearCommunityComps(); fetchCommunityComps(item.name, item.brand) }}
                  className="flex-1 glass rounded-xl py-3 text-sm font-semibold text-purple-400 border border-white/10 flex items-center justify-center gap-1.5">
                  Community
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Details (collapsible) ─── */}
      <div className="px-6 pb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between glass rounded-2xl p-4"
        >
          <h3 className="text-sm font-bold text-white">Details</h3>
          {showDetails ? <ChevronUp size={16} className="text-dim" /> : <ChevronDown size={16} className="text-dim" />}
        </button>

        {showDetails && (
          <div className="mt-2 glass rounded-2xl p-4 space-y-2.5 animate-fade-up">
            <div className="flex justify-between">
              <span className="text-dim text-sm">Brand</span>
              <span className="text-white text-sm font-medium">{item.brand || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dim text-sm">Model</span>
              <span className="text-white text-sm font-medium">{item.model || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dim text-sm">Category</span>
              <span className="text-white text-sm font-medium">{item.emoji} {item.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dim text-sm">Condition</span>
              <span className="text-white text-sm font-medium">{item.condition}</span>
            </div>
            {item.datePurchased && (
              <div className="flex justify-between">
                <span className="text-dim text-sm">Purchased</span>
                <span className="text-white text-sm font-medium">{new Date(item.datePurchased).toLocaleDateString()}</span>
              </div>
            )}
            {item.dateSold && (
              <>
                <div className="flex justify-between">
                  <span className="text-dim text-sm">Date Sold</span>
                  <span className="text-white text-sm font-medium">{new Date(item.dateSold).toLocaleDateString()}</span>
                </div>
                {item.soldPlatform && (
                  <div className="flex justify-between">
                    <span className="text-dim text-sm">Sold On</span>
                    <span className="text-white text-sm font-medium">{item.soldPlatform}</span>
                  </div>
                )}
              </>
            )}
            {item.notes && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-dim text-[10px] uppercase tracking-wider mb-1">Notes</p>
                <p className="text-white text-sm leading-relaxed">{item.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Mark as Sold ─── */}
      {!item.dateSold && (
        <div className="px-6 pb-3">
          <button
            onClick={() => onNavigate('edit-item')}
            className="w-full glass rounded-2xl py-4 text-sm font-bold text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-500/[0.06] transition-colors"
          >
            💰 Mark as Sold
          </button>
        </div>
      )}

      {/* ─── Delete ─── */}
      <div className="px-6 pb-6">
        <button
          onClick={handleDelete}
          className="w-full text-center py-3 text-red-400/50 text-xs font-medium hover:text-red-400 transition-colors"
        >
          Delete Item
        </button>
      </div>
    </div>
  )
}
