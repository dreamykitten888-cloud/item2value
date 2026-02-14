'use client'

import { ArrowLeft, Bell } from 'lucide-react'
import { fmt } from '@/lib/utils'
import type { Screen, Item } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  item?: Item
}

export default function PricingScreen({ onNavigate, item }: Props) {
  // Mock comps data - merge item comps with defaults
  const mockComps = [
    {
      title: 'Similar item on eBay',
      price: Math.round((item?.value || 500) * 0.95),
      source: 'eBay' as const,
      url: undefined,
      date: '2 days ago',
    },
    {
      title: 'Recent sale on StockX',
      price: Math.round((item?.value || 500) * 1.05),
      source: 'StockX' as const,
      url: undefined,
      date: '1 week ago',
    },
    {
      title: 'Amazon listing',
      price: Math.round((item?.value || 500) * 1.1),
      source: 'Amazon' as const,
      url: undefined,
      date: '3 days ago',
    },
  ]
  const comps = (item?.comps && item.comps.length > 0) ? item.comps : mockComps

  const prices = comps.map(c => c.price).filter(p => p > 0)
  const low = prices.length > 0 ? Math.min(...prices) : (item?.value || 0) * 0.85
  const high = prices.length > 0 ? Math.max(...prices) : (item?.value || 0) * 1.15
  const avg = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b) / prices.length) : item?.value || 0
  const confidence = Math.min(95, prices.length * 20 + (prices.length >= 3 ? 15 : 0))

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between sticky top-0 z-20 bg-gradient-to-b from-dark to-transparent border-b border-white/5">
        <button
          onClick={() => onNavigate(item ? 'detail' : 'home')}
          className="text-white hover:text-amber-brand"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-white">Market Analysis</h1>
        <div className="w-6" />
      </div>

      <div className="px-6 space-y-4">
        {/* Item Summary */}
        {item && (
          <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-white/8">
            <div className="w-12 h-12 rounded-lg bg-white/6 flex items-center justify-center text-2xl flex-shrink-0">
              {item.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{item.name}</p>
              <p className="text-dim text-xs mt-0.5">{item.condition}</p>
            </div>
          </div>
        )}

        {/* Market Range */}
        <div className="glass rounded-2xl p-5 border border-white/8">
          <h3 className="text-base font-bold text-white mb-4">Estimated Market Range</h3>

          {/* Range bar */}
          <div className="h-2 rounded-full mb-4" style={{
            background: 'linear-gradient(90deg, #f87171, #d4a853, #4ade80)',
          }}>
            <div
              className="h-full rounded-full bg-white"
              style={{
                width: `${((avg - low) / (high - low || 1)) * 100}%`,
              }}
            />
          </div>

          {/* Price grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Low', price: Math.round(low), color: '#f87171' },
              { label: 'Average', price: avg, color: '#d4a853' },
              { label: 'High', price: Math.round(high), color: '#4ade80' },
            ].map((r, i) => (
              <div key={i} className="glass rounded-xl p-3 text-center border border-white/8">
                <p className="text-dim text-[10px] uppercase tracking-wider font-semibold">{r.label}</p>
                <p className="text-lg font-bold mt-1" style={{ color: r.color }}>
                  {fmt(r.price)}
                </p>
              </div>
            ))}
          </div>

          {/* Confidence */}
          <div className="pt-4 border-t border-white/8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Confidence Score</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full bg-gradient-amber rounded-full"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className="text-amber-brand font-bold text-xs">{confidence}%</span>
              </div>
            </div>
            <p className="text-dim text-[11px]">
              {comps.length > 0 ? `Based on ${comps.length} comp${comps.length > 1 ? 's' : ''}` : 'Add comparables to improve accuracy'}
            </p>
          </div>
        </div>

        {/* Research Links */}
        {item && (
          <div className="glass rounded-2xl p-5 border border-white/8">
            <h3 className="text-base font-bold text-white mb-4">Research Prices</h3>
            <p className="text-dim text-xs mb-3">Find similar listings to add as comparables</p>
            <div className="flex flex-wrap gap-2">
              {['eBay', 'Amazon', 'StockX', 'Mercari'].map(m => (
                <a
                  key={m}
                  href={`https://www.${m.toLowerCase()}.com/search?q=${encodeURIComponent(item.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-brand text-xs font-semibold bg-amber-brand/10 px-3 py-1.5 rounded-full hover:bg-amber-brand/20 transition-colors"
                >
                  {m} ↗
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Comps */}
        <div className="glass rounded-2xl p-5 border border-white/8">
          <h3 className="text-base font-bold text-white mb-4">Comparable Listings</h3>
          <div className="space-y-2.5">
            {comps.map((c, i) => (
              <div key={i} className="glass rounded-xl p-3 border border-white/8 hover:bg-white/8 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white text-xs font-semibold">{c.source || 'Unknown'}</span>
                  <span className="text-amber-brand font-bold text-sm">{fmt(c.price)}</span>
                </div>
                <p className="text-slate-400 text-xs truncate mb-1.5">{c.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-dim text-[10px]">Good</span>
                  <span className="text-dim text-[10px]">{c.date || 'Recently'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Alert */}
        <button className="w-full border border-amber-brand/30 rounded-xl py-4 text-amber-brand text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/3 transition-colors">
          <Bell size={16} />
          Set Price Alert <span className="text-[10px] bg-amber-brand/15 px-2 py-1 rounded text-amber-brand font-bold ml-1">SOON</span>
        </button>
      </div>
    </div>
  )
}
