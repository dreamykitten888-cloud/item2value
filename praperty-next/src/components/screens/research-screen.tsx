'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { fmt } from '@/lib/utils'
import { getMarketplacesForCategory, getSocialLinks, getTrendLinks } from '@/lib/marketplaces'
import type { Screen, ResearchData } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  query?: string
  initialData?: ResearchData | null
}

export default function ResearchScreen({ onNavigate, query = 'Item', initialData = null }: Props) {
  const { searchCommunityItems } = useItemsStore()
  const [data, setData] = useState<ResearchData>(initialData || {
    listings: 0, avgValue: 0, lowValue: 0, highValue: 0, avgCost: 0,
    soldCount: 0, avgSold: 0, totalComps: 0, avgCompPrice: 0, recentComps: [], categories: [],
  })
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (!initialData && query) {
      setLoading(true)
      searchCommunityItems(query, 'All').then(result => {
        setData(result)
        setLoading(false)
      })
    }
  }, [query, initialData, searchCommunityItems])

  // Buy/Sell Signal calculation (exact port from original)
  const signal = (() => {
    let score = 50
    const reasons: string[] = []
    const d = data

    if (d.avgValue > 0 && d.avgCost > 0) {
      const margin = ((d.avgValue - d.avgCost) / d.avgCost) * 100
      if (margin > 30) { score += 20; reasons.push(`High profit margin (${Math.round(margin)}%)`) }
      else if (margin > 10) { score += 10; reasons.push(`Decent margin (${Math.round(margin)}%)`) }
      else if (margin < 0) { score -= 15; reasons.push('Selling below cost') }
    }
    if (d.soldCount > 3) { score += 10; reasons.push('Active resale market') }
    else if (d.soldCount > 0) { score += 5; reasons.push('Some resale activity') }
    if (d.totalComps > 5) { score += 10; reasons.push(`Strong comp data (${d.totalComps} comps)`) }
    else if (d.totalComps > 0) { score += 5; reasons.push(`${d.totalComps} comp(s) available`) }
    if (d.avgSold > d.avgValue && d.avgSold > 0) { score += 10; reasons.push('Selling above market value') }
    if (d.listings > 5) { score -= 5; reasons.push(`High supply (${d.listings} listings)`) }
    if (d.listings === 0) { reasons.push('No community data yet'); score = 50 }
    score = Math.max(0, Math.min(100, score))
    const label = score >= 70 ? 'BUY' : score >= 45 ? 'HOLD' : 'SELL'
    const color = score >= 70 ? '#22c55e' : score >= 45 ? '#d4a853' : '#ef4444'
    return { score, label, color, reasons }
  })()

  const category = data.categories?.[0] || 'All'
  const marketplaces = getMarketplacesForCategory(category, query)
  const socialLinks = getSocialLinks(query)
  const trendLinks = getTrendLinks(query)

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between sticky top-0 z-20 bg-gradient-to-b from-dark to-transparent">
        <button onClick={() => onNavigate('discover')} className="text-white hover:text-amber-brand">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-base font-bold text-white">Market Research</h1>
        <div className="w-6" />
      </div>

      {/* Hero */}
      <div className="px-6 pb-5">
        <div className="rounded-2xl p-6 text-center" style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.12))',
          border: '1px solid rgba(168,85,247,0.2)',
        }}>
          <div className="text-4xl mb-2">📊</div>
          <h2 className="text-xl font-bold text-white mb-1">{query}</h2>
          <p className="text-dim text-xs">
            {data.categories.length > 0 ? data.categories.join(', ') : 'Search any item to see market intelligence'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="w-6 h-6 border-2 border-amber-brand/20 border-t-amber-brand rounded-full animate-spin mx-auto mb-3" />
          <p className="text-dim text-sm">Analyzing market data...</p>
        </div>
      ) : (
        <div className="px-6 space-y-4">

          {/* Buy/Sell Signal */}
          <div className="glass rounded-2xl p-5" style={{ border: `1px solid ${signal.color}33` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-dim text-[11px] uppercase tracking-widest">Market Signal</p>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span className="text-3xl font-extrabold font-heading" style={{ color: signal.color }}>{signal.label}</span>
                  <span className="text-slate-500 text-sm">{signal.score}/100</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ border: `3px solid ${signal.color}` }}>
                <span className="text-lg font-bold" style={{ color: signal.color }}>{signal.score}</span>
              </div>
            </div>
            {/* Signal meter */}
            <div className="h-2 rounded-full mb-3 relative" style={{
              background: 'linear-gradient(90deg, #ef4444, #f59e0b, #d4a853, #22c55e)',
            }}>
              <div className="absolute -top-1 w-4 h-4 rounded-full bg-white" style={{
                left: `${signal.score}%`, transform: 'translateX(-50%)',
                border: `3px solid ${signal.color}`,
                boxShadow: `0 0 12px ${signal.color}66`,
              }} />
            </div>
            <div className="space-y-1">
              {signal.reasons.map((r, i) => (
                <p key={i} className="text-slate-400 text-xs">• {r}</p>
              ))}
              {signal.reasons.length === 0 && <p className="text-dim text-xs">Search for an item to see buy/sell signals</p>}
            </div>
          </div>

          {/* Price Intelligence */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-lg">💰</span>
              <h3 className="text-base font-bold text-white">Price Intelligence</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { l: 'Market Value', v: data.avgValue, c: '#d4a853' },
                { l: 'Avg Cost', v: data.avgCost, c: '#3b82f6' },
                { l: 'Price Range', v: data.lowValue > 0 ? `${fmt(data.lowValue)} - ${fmt(data.highValue)}` : null, c: '#a855f7', raw: true },
                { l: 'Avg Sold Price', v: data.avgSold, c: '#22c55e' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/[0.04] rounded-xl p-3 text-center">
                  <p className="text-dim text-[10px] uppercase tracking-wider">{stat.l}</p>
                  <p className="text-base font-bold mt-1" style={{ color: stat.c }}>
                    {stat.raw ? (stat.v || '--') : (typeof stat.v === 'number' && stat.v > 0 ? fmt(stat.v) : '--')}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 bg-white/[0.06] px-2.5 py-1 rounded-lg">{data.listings || 0} community listings</span>
              <span className="text-[11px] text-slate-400 bg-white/[0.06] px-2.5 py-1 rounded-lg">{data.totalComps || 0} comps</span>
              <span className="text-[11px] text-slate-400 bg-white/[0.06] px-2.5 py-1 rounded-lg">{data.soldCount || 0} sold</span>
            </div>
          </div>

          {/* Live Market Prices (category-aware marketplaces) */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-lg">🌐</span>
              <h3 className="text-base font-bold text-white">Live Market Prices</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              {marketplaces.map(m => (
                <a key={m.name} href={m.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 no-underline transition-all hover:scale-[1.01]"
                  style={{ background: m.bg, border: `1px solid ${m.color}22` }}>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: m.color }}>{m.name}</span>
                    <span className="text-[11px] text-dim ml-2">{m.desc}</span>
                  </div>
                  <span className="text-xs" style={{ color: m.color }}>↗</span>
                </a>
              ))}
            </div>
          </div>

          {/* Social Buzz */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">📱</span>
              <h3 className="text-base font-bold text-white">Social Buzz</h3>
            </div>
            <p className="text-dim text-xs mb-3.5">See what people are saying, unboxing, reviewing, and hyping</p>
            <div className="grid grid-cols-2 gap-2">
              {socialLinks.map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl p-3 no-underline border border-white/[0.08] hover:border-white/20 transition-colors"
                  style={{ background: s.bg.startsWith('linear') ? undefined : s.bg, backgroundImage: s.bg.startsWith('linear') ? s.bg : undefined }}>
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-sm font-semibold text-white">{s.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">📈</span>
              <h3 className="text-base font-bold text-white">Trend Analysis</h3>
            </div>
            <p className="text-dim text-xs mb-3.5">Is this item trending up or fading? Check the data.</p>
            <div className="flex flex-col gap-1.5">
              {trendLinks.map(t => (
                <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 no-underline hover:border-white/20 transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-white">{t.name}</span>
                    <br />
                    <span className="text-[11px] text-dim">{t.desc}</span>
                  </div>
                  <span className="text-xs" style={{ color: t.color }}>↗</span>
                </a>
              ))}
            </div>
          </div>

          {/* Recent Comps */}
          {data.recentComps.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💎</span>
                <h3 className="text-base font-bold text-white">Recent Comps</h3>
              </div>
              <div className="space-y-2">
                {data.recentComps.map((c, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/[0.04] rounded-xl p-3">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm text-white truncate">{c.title}</p>
                      <p className="text-[10px] text-dim">{c.source}{c.condition ? ` · ${c.condition}` : ''}</p>
                    </div>
                    <span className="text-sm font-bold text-amber-brand flex-shrink-0">{fmt(c.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <button
            onClick={() => onNavigate('add-item')}
            className="w-full gradient-amber rounded-xl py-4 font-bold text-black text-sm"
          >
            Add This to My Inventory
          </button>
          <button
            onClick={() => onNavigate('discover')}
            className="w-full glass rounded-xl py-3 font-semibold text-white text-sm border border-white/10 hover:bg-white/10 transition-colors mb-4"
          >
            Back to Discover
          </button>
        </div>
      )}
    </div>
  )
}
