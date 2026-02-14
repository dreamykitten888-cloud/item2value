'use client'

import { useState } from 'react'
import { ArrowLeft, Edit3, Trash2, Plus, ExternalLink, X } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { useAuthStore } from '@/stores/auth-store'
import { fmt, fmtFull } from '@/lib/utils'
import { getMarketplacesForCategory, buildSearchTerms, COMP_SOURCES } from '@/lib/marketplaces'
import type { Screen, Comp } from '@/types'

interface Props {
  itemId: string | null
  onBack: () => void
  onNavigate: (screen: Screen) => void
  onResearch?: (query: string) => void
}

export default function DetailScreen({ itemId, onBack, onNavigate, onResearch }: Props) {
  const { items, deleteItem, ebayComps, ebayLoading, ebayError, communityComps, fetchEbayComps, fetchCommunityComps, addCompToItem, deleteCompFromItem, clearEbayComps, clearCommunityComps, syncItem } = useItemsStore()
  const { profileId } = useAuthStore()

  const item = items.find(i => i.id === itemId)

  // Comp form state
  const [addingComp, setAddingComp] = useState(false)
  const [compForm, setCompForm] = useState({ title: '', url: '', price: '', source: 'eBay', condition: 'Good' })

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

  const roi = item.cost > 0 && item.value > 0
    ? Math.round(((item.value - item.cost) / item.cost) * 100)
    : null

  const searchTerms = buildSearchTerms(item.name, item.brand, item.model)
  const marketplaces = getMarketplacesForCategory(item.category, searchTerms)

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
    addCompToItem(item.id, newComp)
    setCompForm({ title: '', url: '', price: '', source: 'eBay', condition: 'Good' })
    setAddingComp(false)
    // Auto-sync
    if (profileId) {
      const updated = useItemsStore.getState().items.find(i => i.id === item.id)
      if (updated) syncItem(updated, profileId)
    }
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
    addCompToItem(item.id, newComp)
    if (profileId) {
      setTimeout(() => {
        const updated = useItemsStore.getState().items.find(i => i.id === item.id)
        if (updated) syncItem(updated, profileId)
      }, 100)
    }
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
    addCompToItem(item.id, newComp)
    clearCommunityComps()
    if (profileId) {
      setTimeout(() => {
        const updated = useItemsStore.getState().items.find(i => i.id === item.id)
        if (updated) syncItem(updated, profileId)
      }, 100)
    }
  }

  const handleDeleteComp = (compId: number) => {
    if (window.confirm('Delete this comparable?')) {
      deleteCompFromItem(item.id, compId)
      if (profileId) {
        setTimeout(() => {
          const updated = useItemsStore.getState().items.find(i => i.id === item.id)
          if (updated) syncItem(updated, profileId)
        }, 100)
      }
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
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-dim hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2">
          <button onClick={() => onNavigate('edit-item')} className="p-2 glass rounded-lg hover:bg-white/10 transition-colors">
            <Edit3 size={18} />
          </button>
          <button onClick={handleDelete} className="p-2 glass rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Item header */}
      <div className="px-6 pb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl flex-shrink-0">
            {item.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">{item.name}</h1>
            <p className="text-dim text-sm mt-0.5">
              {item.brand && `${item.brand} · `}{item.model && `${item.model} · `}{item.category}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-xs font-medium text-dim">{item.condition}</span>
              {item.dateSold && (
                <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 text-xs font-medium text-green-400">Sold</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Value card */}
      <div className="px-6 pb-4">
        <div className="glass rounded-2xl p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-dim text-[10px] uppercase tracking-wider">Cost</p>
              <p className="text-lg font-bold text-white mt-1">{fmtFull(item.cost)}</p>
            </div>
            <div>
              <p className="text-dim text-[10px] uppercase tracking-wider">Value</p>
              <p className="text-lg font-bold text-white mt-1">{fmtFull(item.value)}</p>
            </div>
            <div>
              <p className="text-dim text-[10px] uppercase tracking-wider">ROI</p>
              <p className={`text-lg font-bold mt-1 ${roi !== null ? (roi >= 0 ? 'text-green-400' : 'text-red-400') : 'text-dim'}`}>
                {roi !== null ? `${roi >= 0 ? '+' : ''}${roi}%` : '--'}
              </p>
            </div>
          </div>
          {item.asking > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-dim text-[10px] uppercase tracking-wider">Asking Price</p>
              <p className="text-lg font-bold text-amber-brand mt-1">{fmtFull(item.asking)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="px-6 pb-4 space-y-3">
        {item.datePurchased && (
          <div className="flex justify-between py-2">
            <span className="text-dim text-sm">Date Purchased</span>
            <span className="text-white text-sm font-medium">{new Date(item.datePurchased).toLocaleDateString()}</span>
          </div>
        )}
        {item.dateSold && (
          <div className="flex justify-between py-2">
            <span className="text-dim text-sm">Date Sold</span>
            <span className="text-white text-sm font-medium">{new Date(item.dateSold).toLocaleDateString()}</span>
          </div>
        )}
        {item.soldPlatform && (
          <div className="flex justify-between py-2">
            <span className="text-dim text-sm">Sold On</span>
            <span className="text-white text-sm font-medium">{item.soldPlatform}</span>
          </div>
        )}
        {item.notes && (
          <div className="glass rounded-xl p-4 mt-3">
            <p className="text-dim text-[10px] uppercase tracking-wider mb-2">Notes</p>
            <p className="text-white text-sm leading-relaxed">{item.notes}</p>
          </div>
        )}
      </div>

      {/* My Comps (CRUD) */}
      <div className="px-6 pb-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-white">My Comps ({(item.comps || []).length})</h3>
          </div>

          {/* Existing comps */}
          {(item.comps || []).length > 0 && (
            <div className="space-y-2 mb-3">
              {item.comps.map((comp, i) => (
                <div key={comp.id || i} className="flex justify-between items-center bg-white/[0.04] rounded-xl p-3">
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
                    <button onClick={() => handleDeleteComp(comp.id || 0)}
                      className="text-red-400/60 hover:text-red-400 p-1">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add comp form */}
          {addingComp ? (
            <div className="space-y-2 mt-3">
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
                <select value={compForm.source} onChange={e => setCompForm(p => ({ ...p, source: e.target.value }))}
                  className="form-input flex-1">
                  {COMP_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={compForm.condition} onChange={e => setCompForm(p => ({ ...p, condition: e.target.value }))}
                  className="form-input flex-1">
                  {['New','Like New','Excellent','Very Good','Good','Fair'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveComp} className="flex-1 gradient-amber rounded-xl py-3 text-sm font-bold text-black">
                  Save Comp
                </button>
                <button onClick={() => { setAddingComp(false); setCompForm({ title: '', url: '', price: '', source: 'eBay', condition: 'Good' }) }}
                  className="flex-1 glass rounded-xl py-3 text-sm font-semibold text-white border border-white/10">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingComp(true)}
              className="w-full glass rounded-xl py-3.5 text-sm font-semibold text-amber-brand border border-white/10 flex items-center justify-center gap-2 hover:bg-white/[0.06] transition-colors mt-2">
              <Plus size={16} /> Add Comparable
            </button>
          )}
        </div>
      </div>

      {/* eBay Market Prices */}
      <div className="px-6 pb-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                eBay Market Prices
                {ebayComps.length > 0 && (
                  <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full tracking-wider">LIVE</span>
                )}
              </h3>
              <p className="text-dim text-[11px]">Real listings with real prices</p>
            </div>
            <button onClick={() => fetchEbayComps(item)} disabled={ebayLoading}
              className="bg-blue-500/15 border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs font-semibold text-blue-400 disabled:opacity-50">
              {ebayLoading ? 'Searching...' : ebayComps.length > 0 ? '↻ Refresh' : '🔍 Search eBay'}
            </button>
          </div>

          {ebayLoading && (
            <div className="py-6 text-center">
              <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto" />
              <p className="text-dim text-xs mt-2.5">Searching eBay for &quot;{item.name}&quot;...</p>
            </div>
          )}

          {ebayError && !ebayLoading && (
            <p className="text-red-400 text-xs text-center py-3">{ebayError}</p>
          )}

          {!ebayLoading && !ebayError && ebayComps.length === 0 && (
            <p className="text-dim text-xs text-center py-3">Tap &quot;Search eBay&quot; to find real listings for this item.</p>
          )}

          {!ebayLoading && ebayComps.length > 0 && (
            <>
              {/* Average price banner */}
              {(() => {
                const prices = ebayComps.map(c => c.price?.value).filter((p): p is number => !!p && p > 0)
                if (prices.length === 0) return null
                const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
                const diff = item.value ? avg - item.value : 0
                return (
                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-blue-500/[0.06] border border-blue-500/15 mb-3">
                    <span className="text-xs text-slate-400">Avg eBay Price ({prices.length})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-blue-400">{fmt(avg)}</span>
                      {item.value > 0 && (
                        <span className={`text-[11px] font-semibold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {diff >= 0 ? '+' : ''}{Math.round((diff / item.value) * 100)}% vs yours
                        </span>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Listing cards */}
              <div className="space-y-2">
                {ebayComps.map((listing, idx) => (
                  <div key={listing.id || idx} className="flex gap-3 p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-blue-500/30 transition-colors">
                    {listing.image && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.06]">
                        <img src={listing.image} alt="" loading="lazy" className="w-full h-full object-cover" onError={e => { (e.target as HTMLElement).parentElement!.style.display = 'none' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate leading-snug mb-1">{listing.title}</p>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-base font-bold text-amber-brand">${listing.price?.value?.toLocaleString() || '?'}</span>
                        {listing.shippingCost === 0 && (
                          <span className="text-[9px] text-green-400 font-bold bg-green-400/10 px-1.5 py-0.5 rounded">FREE SHIP</span>
                        )}
                        {listing.shippingCost && listing.shippingCost > 0 && (
                          <span className="text-dim text-[10px]">+${listing.shippingCost} ship</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] text-slate-400 bg-white/[0.06] px-1.5 py-0.5 rounded">{listing.condition || 'N/A'}</span>
                        {listing.seller?.feedbackPercent && (
                          <span className="text-dim text-[10px]">⭐ {listing.seller.feedbackPercent}%</span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {listing.itemUrl && (
                          <a href={listing.itemUrl} target="_blank" rel="noopener noreferrer"
                            className="bg-blue-500/15 border border-blue-500/30 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-blue-400 no-underline inline-flex items-center gap-1">
                            Buy on eBay ↗
                          </a>
                        )}
                        <button onClick={() => handleAddEbayAsComp(listing, idx)}
                          className="bg-amber-brand/10 border border-amber-brand/25 rounded-lg px-2.5 py-1 text-[11px] font-bold text-amber-brand">
                          + Comp
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-dim text-[9px] text-center mt-2.5 opacity-50">Prices from eBay · Tap &quot;Buy on eBay&quot; to purchase</p>
            </>
          )}
        </div>
      </div>

      {/* Community Comps */}
      <div className="px-6 pb-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-base font-bold text-white">Community Comps</h3>
              <p className="text-dim text-[11px]">From other PrÄperty users</p>
            </div>
            <button onClick={() => {
              clearCommunityComps()
              fetchCommunityComps(item.name, item.brand)
            }}
              className="bg-purple-500/15 border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs font-semibold text-purple-400">
              Load
            </button>
          </div>

          {communityComps.length === 0 ? (
            <p className="text-dim text-xs text-center py-2">Tap &quot;Load&quot; to find comps from the community.</p>
          ) : (
            <div className="space-y-2">
              {communityComps.slice(0, 8).map((c, ci) => (
                <div key={ci} className="flex justify-between items-center p-3 bg-purple-500/[0.06] border border-purple-500/15 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{c.title}</p>
                    <p className="text-dim text-[10px]">{c.source} · {c.condition}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-amber-brand">{fmt(c.price)}</span>
                    <button onClick={() => handleAddCommunityComp(c, ci)}
                      className="bg-amber-brand/20 border border-amber-brand/30 rounded-lg px-2.5 py-1 text-[11px] font-bold text-amber-brand whitespace-nowrap">
                      + Add
                    </button>
                  </div>
                </div>
              ))}
              {communityComps.length > 8 && (
                <p className="text-dim text-[11px] text-center">+ {communityComps.length - 8} more available</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-4 space-y-2">
        <div className="flex gap-2">
          <a href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchTerms)}&LH_Sold=1&LH_Complete=1`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 gradient-amber rounded-2xl py-4 text-sm font-bold text-black text-center no-underline">
            Search Market
          </a>
          <button onClick={handleResearch}
            className="flex-1 border border-amber-brand/40 rounded-2xl py-4 text-sm font-bold text-amber-brand bg-amber-brand/[0.08]">
            Deep Research →
          </button>
        </div>
        <button onClick={() => onNavigate('edit-item')}
          className="w-full glass rounded-2xl py-3.5 text-sm font-semibold text-white border border-white/10 flex items-center justify-center gap-2 hover:bg-white/[0.06] transition-colors">
          <Edit3 size={16} /> Edit Item
        </button>

        {/* Category-specific marketplace links */}
        {marketplaces.length > 0 && (
          <div className="glass rounded-2xl p-5 mt-2">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              🌐 Marketplaces for {item.category}
            </h3>
            <div className="flex flex-col gap-1.5">
              {marketplaces.slice(0, 8).map(m => (
                <a key={m.name} href={m.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl px-3 py-2 no-underline hover:scale-[1.01] transition-transform"
                  style={{ background: m.bg, border: `1px solid ${m.color}22` }}>
                  <div>
                    <span className="text-xs font-semibold" style={{ color: m.color }}>{m.name}</span>
                    <span className="text-[10px] text-dim ml-2">{m.desc}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: m.color }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
