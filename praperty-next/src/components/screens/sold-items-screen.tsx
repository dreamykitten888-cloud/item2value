'use client'

import { useState } from 'react'
import { ArrowLeft, Search, Filter } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { fmt, CATEGORIES } from '@/lib/utils'
import type { Screen, Item } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onViewItem?: (id: string) => void
}

export default function SoldItemsScreen({ onNavigate, onViewItem }: Props) {
  const { items } = useItemsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('recent')

  const soldItems = items.filter(i => i.dateSold)

  let filtered = soldItems.filter(
    i => (selectedCategory === 'All' || i.category === selectedCategory) &&
      i.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  filtered = filtered.sort((a, b) => {
    const getDaysToSell = (item: Item) => {
      if (!item.dateSold || !item.datePurchased) return 0
      return Math.round((new Date(item.dateSold).getTime() - new Date(item.datePurchased).getTime()) / (1000 * 60 * 60 * 24))
    }

    if (sortBy === 'recent') return new Date(b.dateSold!).getTime() - new Date(a.dateSold!).getTime()
    if (sortBy === 'profit') return ((b.earnings || 0) - b.cost) - ((a.earnings || 0) - a.cost)
    if (sortBy === 'fastest') return getDaysToSell(a) - getDaysToSell(b)
    if (sortBy === 'slowest') return getDaysToSell(b) - getDaysToSell(a)
    if (sortBy === 'biggest-gain') {
      const gainA = a.cost > 0 ? ((a.earnings || 0) - a.cost) / a.cost * 100 : 0
      const gainB = b.cost > 0 ? ((b.earnings || 0) - b.cost) / b.cost * 100 : 0
      return gainB - gainA
    }
    return 0
  })

  const totalEarnings = soldItems.reduce((sum, i) => sum + (i.earnings || 0), 0)
  const totalProfit = soldItems.reduce((sum, i) => sum + ((i.earnings || 0) - i.cost), 0)
  const avgDays = (() => {
    const withDates = soldItems.filter(i => i.dateSold && i.datePurchased)
    if (withDates.length === 0) return '--'
    const total = withDates.reduce((sum, i) => sum + Math.round((new Date(i.dateSold!).getTime() - new Date(i.datePurchased!).getTime()) / (1000 * 60 * 60 * 24)), 0)
    return Math.round(total / withDates.length)
  })()

  const getDaysToSell = (item: Item) => {
    if (!item.dateSold || !item.datePurchased) return '--'
    return Math.round((new Date(item.dateSold).getTime() - new Date(item.datePurchased).getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 px-6 py-5 flex items-center justify-between bg-gradient-to-b from-dark to-transparent border-b border-white/5">
        <button onClick={() => onNavigate('home')} className="text-white hover:text-amber-brand">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-white">Sold Items</h1>
        <div className="w-6" />
      </div>

      <div className="px-6 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <div className="glass rounded-xl p-3 text-center border border-white/8">
            <p className="text-dim text-[9px] uppercase tracking-wider font-semibold">Earnings</p>
            <p className="text-base font-bold text-green-400 mt-2">{totalEarnings > 0 ? fmt(totalEarnings) : '--'}</p>
          </div>
          <div className="glass rounded-xl p-3 text-center border border-white/8">
            <p className="text-dim text-[9px] uppercase tracking-wider font-semibold">Items Sold</p>
            <p className="text-base font-bold text-white mt-2">{soldItems.length}</p>
          </div>
          <div className="glass rounded-xl p-3 text-center border border-white/8">
            <p className="text-dim text-[9px] uppercase tracking-wider font-semibold">Avg Days</p>
            <p className="text-base font-bold text-amber-brand mt-2">
              {avgDays}{avgDays !== '--' ? 'd' : ''}
            </p>
          </div>
        </div>

        {/* Net Profit Banner */}
        <div className="glass rounded-xl p-3.5 flex items-center justify-between border border-white/8">
          <span className="text-slate-400 text-sm">Net Profit (all sold)</span>
          <span className={`font-bold text-sm ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}${Math.abs(totalProfit).toLocaleString()}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search sold items..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none text-sm"
          />
        </div>

        {/* Filters */}
        <div className="space-y-2.5">
          <div className="overflow-x-auto scroll-hide">
            <div className="flex gap-2 min-w-max">
              {['All', ...CATEGORIES.filter(c => soldItems.some(i => i.category === c))].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'gradient-amber text-black'
                      : 'bg-white/4 border border-white/10 text-white hover:bg-white/8'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/6 border border-white/10 text-white text-xs focus:outline-none"
            >
              <option value="recent">Most Recent Sale</option>
              <option value="profit">Highest Profit</option>
              <option value="fastest">Fastest Sale</option>
              <option value="slowest">Slowest Sale</option>
              <option value="biggest-gain">Biggest Gain %</option>
            </select>
          </div>
        </div>

        {/* Sold Items List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💰</p>
            <p className="text-base font-bold text-white mb-1">
              {soldItems.length === 0 ? 'No sold items yet' : 'No matches found'}
            </p>
            <p className="text-dim text-xs">
              {soldItems.length === 0
                ? 'Enter earnings on any item to mark it as sold and track your velocity.'
                : 'Try a different search or filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, i) => {
              const profit = (item.earnings || 0) - item.cost
              const days = getDaysToSell(item)
              return (
                <button
                  key={item.id}
                  onClick={() => onViewItem?.(item.id)}
                  className="w-full glass rounded-xl p-4 border border-white/8 hover:bg-white/8 transition-colors text-left animate-fade-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-white/6 flex items-center justify-center text-xl flex-shrink-0">
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-dim text-xs">Cost: {fmt(item.cost)}</span>
                        <span className="text-slate-600 text-xs">→</span>
                        <span className="text-green-400 text-xs font-semibold">Sold: {fmt(item.earnings || 0)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-sm ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {profit >= 0 ? '+' : ''}${Math.abs(profit).toLocaleString()}
                      </p>
                      <p className="text-dim text-xs mt-0.5">{days !== '--' ? `${days}d` : '--'}</p>
                    </div>
                  </div>
                  {item.soldPlatform && (
                    <div className="flex gap-2 text-[10px] mt-2">
                      <span className="text-amber-brand bg-amber-brand/10 px-2 py-0.5 rounded-md">via {item.soldPlatform}</span>
                      {item.dateSold && (
                        <span className="text-dim">
                          Sold {new Date(item.dateSold).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
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
