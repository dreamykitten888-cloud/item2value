'use client'

import { useState, useRef } from 'react'
import { Search, ArrowLeft } from 'lucide-react'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onResearch?: (query: string) => void
}

const CATEGORIES = [
  'All',
  'Fashion',
  'Electronics',
  'Home',
  'Watches',
  'Sports',
  'Collectibles',
  'Trading Cards',
  'Vinyl & Music',
  'Musical Instruments',
  'LEGO',
  'Coins & Stamps',
  'Art',
  'Automotive',
  'Books',
  'Toys',
  'Tools',
  'Other',
]

export default function DiscoverScreen({ onNavigate, onResearch }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = () => {
    if (searchQuery.trim()) {
      if (onResearch) onResearch(searchQuery)
      onNavigate('research')
    }
  }

  const handleDeepResearch = () => {
    if (searchQuery.trim()) {
      if (onResearch) onResearch(searchQuery)
      onNavigate('research')
    }
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
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
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
          <button
            onClick={handleSearch}
            className="flex-1 gradient-amber rounded-lg py-3 font-bold text-black text-sm"
          >
            Search Market
          </button>
          {searchQuery.trim() && (
            <button
              onClick={handleDeepResearch}
              className="flex-1 bg-white/6 border border-amber-brand/40 rounded-lg py-3 font-bold text-amber-brand text-sm hover:bg-white/10"
            >
              Deep Research →
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-6 py-3 overflow-x-auto scroll-hide">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-brand/20 border-2 border-amber-brand text-amber-brand'
                  : 'bg-white/4 border border-white/10 text-slate-500 hover:bg-white/8'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Browse Content */}
      <div className="px-6 py-4">
        {!searchQuery.trim() ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-lg font-bold text-white mb-2">Start Exploring</h2>
            <p className="text-dim text-sm leading-relaxed">
              Search for any item to discover market prices, trends, and community data
            </p>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">👆</div>
            <h2 className="text-lg font-bold text-white mb-2">Ready to search</h2>
            <p className="text-dim text-sm">
              Hit "Search Market" to see prices for "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      {/* Helpful Links */}
      <div className="px-6 pb-4 space-y-3">
        <div className="glass rounded-2xl p-4 border border-white/8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-amber flex items-center justify-center text-sm">
              🌐
            </div>
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
              <a
                key={m.name}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-amber-brand text-xs font-semibold hover:text-amber-brand/80"
              >
                {m.name} ↗
              </a>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-4 border border-white/8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-purple flex items-center justify-center text-sm">
              👥
            </div>
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
