'use client'

import { ArrowLeft } from 'lucide-react'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  query?: string
}

export default function ResearchScreen({ onNavigate, query = 'Item' }: Props) {
  // Calculate buy/sell signal (simplified version)
  const signal = {
    label: 'HOLD',
    score: 50,
    color: '#d4a853',
    reasons: [
      'Search for an item to see buy/sell signals',
    ],
  }

  const data = {
    avgValue: 0,
    avgCost: 0,
    listings: 0,
    totalComps: 0,
    soldCount: 0,
  }

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between sticky top-0 z-20 bg-gradient-to-b from-dark to-transparent border-b border-white/5">
        <button onClick={() => onNavigate('discover')} className="text-white hover:text-amber-brand">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-base font-bold text-white">Market Research</h1>
        <div className="w-6" />
      </div>

      <div className="px-6 space-y-4">
        {/* Hero */}
        <div
          className="rounded-2xl p-6 text-center mt-4"
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.12))',
            border: '1px solid rgba(168,85,247,0.2)',
          }}
        >
          <div className="text-4xl mb-2">📊</div>
          <h2 className="text-2xl font-bold text-white mb-1">{query}</h2>
          <p className="text-dim text-xs">Search any item to see market intelligence</p>
        </div>

        {/* Buy/Sell Signal */}
        <div className="glass rounded-2xl p-5 border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-dim text-[11px] uppercase tracking-widest font-semibold">Market Signal</p>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span className="text-3xl font-black" style={{ color: signal.color }}>
                  {signal.label}
                </span>
                <span className="text-slate-500 text-sm">{signal.score}/100</span>
              </div>
            </div>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center border-4"
              style={{ borderColor: signal.color }}
            >
              <span style={{ color: signal.color }} className="text-lg font-bold">
                {signal.score}
              </span>
            </div>
          </div>

          <div className="h-2 rounded-full mb-3" style={{
            background: 'linear-gradient(90deg, #ef4444, #f59e0b, #d4a853, #22c55e)',
          }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${signal.score}%`,
                background: signal.color,
              }}
            />
          </div>

          <div className="space-y-1">
            {signal.reasons.map((r, i) => (
              <p key={i} className="text-slate-400 text-xs">
                • {r}
              </p>
            ))}
          </div>
        </div>

        {/* Price Intelligence */}
        <div className="glass rounded-2xl p-5 border border-white/8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💰</span>
            <h3 className="text-base font-bold text-white">Price Intelligence</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Market Value', value: '--', color: '#d4a853' },
              { label: 'Avg Cost', value: '--', color: '#3b82f6' },
              { label: 'Price Range', value: '--', color: '#a855f7' },
              { label: 'Avg Sold', value: '--', color: '#22c55e' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/4 rounded-lg p-3 text-center">
                <p className="text-dim text-[10px] uppercase tracking-wider font-semibold">{stat.label}</p>
                <p className="text-base font-bold mt-1" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="text-[11px] text-slate-400 bg-white/6 px-2.5 py-1 rounded-lg">
              {data.listings} community listings
            </span>
            <span className="text-[11px] text-slate-400 bg-white/6 px-2.5 py-1 rounded-lg">
              {data.totalComps} comps
            </span>
            <span className="text-[11px] text-slate-400 bg-white/6 px-2.5 py-1 rounded-lg">
              {data.soldCount} sold
            </span>
          </div>
        </div>

        {/* Social Buzz */}
        <div className="glass rounded-2xl p-5 border border-white/8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📱</span>
            <h3 className="text-base font-bold text-white">Social Buzz</h3>
          </div>
          <p className="text-dim text-xs mb-3">See what people are saying and reviewing</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'TikTok', icon: '🎵' },
              { name: 'Instagram', icon: '📸' },
              { name: 'YouTube', icon: '🎬' },
              { name: 'Reddit', icon: '💬' },
            ].map(s => (
              <a
                key={s.name}
                href={`https://www.${s.name.toLowerCase()}.com/search?q=${encodeURIComponent(query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-lg p-3 flex items-center gap-2 hover:bg-white/10 transition-colors"
              >
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs font-semibold text-white">{s.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={() => onNavigate('add-item')}
          className="w-full gradient-amber rounded-xl py-4 font-bold text-black text-sm"
        >
          Add This to My Inventory
        </button>
        <button
          onClick={() => onNavigate('discover')}
          className="w-full glass rounded-xl py-3 font-semibold text-white text-sm border border-white/10 hover:bg-white/10 transition-colors"
        >
          Back to Discover
        </button>
      </div>
    </div>
  )
}
