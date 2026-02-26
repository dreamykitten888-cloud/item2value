'use client'

import { useState } from 'react'
import { ArrowLeft, Search, Plus, X, TrendingUp, TrendingDown } from 'lucide-react'
import { fmt } from '@/lib/utils'
import { useItemsStore } from '@/stores/items-store'
import type { Screen, WatchlistItem } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onResearch?: (query: string) => void
}

export default function WatchlistScreen({
  onNavigate,
  onResearch,
}: Props) {
  const { watchlist, syncWatchlistItem, deleteWatchlistItem } = useItemsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [newItemName, setNewItemName] = useState('')

  const filtered = watchlist.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddItem = () => {
    if (newItemName.trim()) {
      const newItem: WatchlistItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: newItemName.trim(),
        category: 'Other',
        emoji: '⭐',
        brand: '',
        model: '',
        targetPrice: 0,
        lastKnownPrice: 0,
        priceHistory: [],
        addedAt: new Date().toISOString(),
        linkedItemId: null,
      }
      const profileId = localStorage.getItem('praperty_profile_id')
      if (profileId) {
        syncWatchlistItem(newItem, profileId)
      }
      setNewItemName('')
    }
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
      <div className="sticky top-0 z-20 px-6 py-5 flex items-center justify-between bg-gradient-to-b from-dark to-transparent border-b border-white/5">
        <button onClick={() => onNavigate('home')} className="text-white hover:text-amber-brand">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-white">Watchlist</h1>
        <div className="w-6" />
      </div>

      <div className="px-6 space-y-4">
        {/* Search */}
        <div className="mt-4 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search watchlist..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none text-sm"
          />
        </div>

        {/* Add New Item */}
        <div className="glass rounded-xl p-4 border border-white/8 space-y-3">
          <p className="text-white text-xs font-bold uppercase tracking-wider">Add to Watchlist</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Item name (e.g. Nike Air Max 90)"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddItem()}
              className="flex-1 px-3 py-2 rounded-lg bg-white/4 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none text-sm"
            />
            <button
              onClick={handleAddItem}
              className="gradient-amber rounded-lg px-4 py-2 font-semibold text-black text-sm flex items-center gap-1.5"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        {/* Watchlist Items */}
        {watchlist.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-base font-bold text-white mb-2">Build your watchlist</p>
            <p className="text-dim text-xs leading-relaxed">
              Track items you want to buy and monitor their market prices
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dim text-sm">No items match your search.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, i) => {
              const hasRealHistory = item.priceHistory.length >= 2 && item.priceHistory[item.priceHistory.length - 2].value > 0
              const priceChange = hasRealHistory
                ? item.lastKnownPrice - item.priceHistory[item.priceHistory.length - 2].value
                : null
              const pricePct = priceChange !== null && item.lastKnownPrice > 0
                ? (priceChange / item.lastKnownPrice) * 100
                : null
              const isUp = pricePct !== null ? pricePct >= 0 : true

              return (
                <button
                  key={item.id}
                  onClick={() => handleTapItem(item)}
                  className="w-full glass rounded-xl p-4 border border-white/8 hover:bg-white/8 active:bg-white/12 transition-colors text-left animate-fade-up group"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-white/6 flex items-center justify-center text-lg flex-shrink-0">
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-dim text-xs">
                          {item.brand}{item.brand && item.model ? ' · ' : ''}{item.model}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-white text-sm">
                        {item.lastKnownPrice > 0 ? fmt(item.lastKnownPrice) : '--'}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {pricePct !== null ? (
                          <>
                            {isUp ? <TrendingUp size={12} className="text-green-400" /> : <TrendingDown size={12} className="text-red-400" />}
                            <p className={`text-xs font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                              {isUp ? '+' : ''}{pricePct.toFixed(1)}%
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-dim">--</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        deleteWatchlistItem(item.id)
                      }}
                      className="ml-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {item.targetPrice > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/8 flex items-center justify-between text-xs">
                      <span className="text-dim">Target: {fmt(item.targetPrice)}</span>
                      {item.lastKnownPrice > 0 && item.lastKnownPrice <= item.targetPrice && (
                        <span className="text-green-400 font-semibold">✓ At target!</span>
                      )}
                    </div>
                  )}
                  {item.lastKnownPrice > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/8">
                      <p className="text-[10px] text-dim">Tap for eBay price intel &amp; market research</p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
