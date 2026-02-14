'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, SlidersHorizontal } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { fmt, CATEGORIES } from '@/lib/utils'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onViewItem: (id: string) => void
}

type SortOption = 'newest' | 'value-high' | 'value-low' | 'name'

export default function InventoryScreen({ onNavigate, onViewItem }: Props) {
  const { items } = useItemsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showFilters, setShowFilters] = useState(false)

  const activeItems = items.filter(i => !i.dateSold)

  const filteredItems = useMemo(() => {
    let result = [...activeItems]

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        i.model.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      )
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(i => i.category === selectedCategory)
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'value-high':
        result.sort((a, b) => (b.value || 0) - (a.value || 0))
        break
      case 'value-low':
        result.sort((a, b) => (a.value || 0) - (b.value || 0))
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return result
  }, [activeItems, searchQuery, selectedCategory, sortBy])

  // Get categories that have items
  const usedCategories = useMemo(() => {
    const cats = new Set(activeItems.map(i => i.category))
    return CATEGORIES.filter(c => cats.has(c))
  }, [activeItems])

  const totalValue = activeItems.reduce((sum, i) => sum + (i.value || 0), 0)

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Inventory</h1>
            <p className="text-dim text-sm mt-0.5">
              {activeItems.length} item{activeItems.length !== 1 ? 's' : ''} &middot; {fmt(totalValue)} total
            </p>
          </div>
          <button
            onClick={() => onNavigate('add-item')}
            className="w-10 h-10 rounded-full gradient-amber flex items-center justify-center"
          >
            <Plus size={20} color="#000" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input pl-10 pr-12"
            placeholder="Search items..."
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${showFilters ? 'text-amber-brand' : 'text-dim'}`}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 animate-fade-up">
            {/* Sort options */}
            <div className="flex gap-2 flex-wrap">
              {([
                ['newest', 'Newest'],
                ['value-high', 'Value ↓'],
                ['value-low', 'Value ↑'],
                ['name', 'A-Z'],
              ] as [SortOption, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    sortBy === key
                      ? 'gradient-amber text-black'
                      : 'glass text-dim hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Category chips */}
            {usedCategories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    !selectedCategory ? 'gradient-amber text-black' : 'glass text-dim hover:text-white'
                  }`}
                >
                  All
                </button>
                {usedCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selectedCategory === cat ? 'gradient-amber text-black' : 'glass text-dim hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="px-6 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">{searchQuery ? '🔍' : '📦'}</p>
            <p className="text-dim text-sm">
              {searchQuery ? 'No items match your search' : 'No items yet. Add your first item!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => onNavigate('add-item')}
                className="mt-4 gradient-amber rounded-xl px-6 py-3 text-sm font-bold text-black"
              >
                Add Item
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => onViewItem(item.id)}
              className="w-full glass glass-hover rounded-xl p-4 flex items-center gap-3 text-left animate-fade-up transition-all"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                <p className="text-xs text-dim mt-0.5">
                  {item.brand && `${item.brand} · `}{item.category} · {item.condition}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-white">{fmt(item.value || item.cost)}</p>
                {item.cost > 0 && item.value > 0 && (
                  <p className={`text-[10px] font-semibold ${
                    item.value >= item.cost ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {item.value >= item.cost ? '+' : ''}{Math.round(((item.value - item.cost) / item.cost) * 100)}%
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
