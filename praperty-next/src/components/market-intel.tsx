'use client'

import { useEffect, useRef } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Minus, Layers, Tag, Activity } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { fmtFull } from '@/lib/utils'
import type { Item, MarketIntelData } from '@/types'

interface Props {
  item: Item
}

// Color helpers matching Copper Forest theme
const depthColors: Record<string, string> = {
  saturated: 'text-red-400',
  healthy: 'text-green-400',
  limited: 'text-amber-400',
  rare: 'text-purple-400',
}

const depthBgs: Record<string, string> = {
  saturated: 'bg-red-500/15 border-red-500/20',
  healthy: 'bg-green-500/15 border-green-500/20',
  limited: 'bg-amber-500/15 border-amber-500/20',
  rare: 'bg-purple-500/15 border-purple-500/20',
}

export default function MarketIntel({ item }: Props) {
  const { marketIntel, marketIntelLoading, fetchMarketIntel, clearMarketIntel } = useItemsStore()
  const lastFetchedId = useRef<string | null>(null)

  useEffect(() => {
    if (item && item.id !== lastFetchedId.current) {
      lastFetchedId.current = item.id
      clearMarketIntel()
      fetchMarketIntel(item)
    }
  }, [item, fetchMarketIntel, clearMarketIntel])

  if (marketIntelLoading) {
    return (
      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <Activity className="w-4 h-4 animate-pulse" />
          Analyzing eBay market data...
        </div>
      </div>
    )
  }

  if (!marketIntel) return null

  const { market, priceRange, conditionPricing, aspects, categories } = marketIntel

  return (
    <div className="mt-4 space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-[#EB9C35]" />
        <span className="text-sm font-semibold text-white/90">Market Intelligence</span>
        <span className="text-[10px] text-white/30 ml-auto">via eBay Browse API</span>
      </div>

      {/* Row 1: Market Depth + Price Range */}
      <div className="grid grid-cols-2 gap-2">
        {/* Market Depth */}
        <div className={`rounded-lg border p-3 ${depthBgs[market.depth.level]}`}>
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Market Depth</div>
          <div className={`text-sm font-bold ${depthColors[market.depth.level]}`}>
            {market.depth.label}
          </div>
          <div className="text-xs text-white/50 mt-0.5">
            {market.totalListings.toLocaleString()} active listings
          </div>
        </div>

        {/* Price Range */}
        <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Price Range</div>
          {priceRange.floor !== null && priceRange.ceiling !== null ? (
            <>
              <div className="text-sm font-bold text-white/90">
                {fmtFull(priceRange.floor)} - {fmtFull(priceRange.ceiling)}
              </div>
              <PriceBar
                floor={priceRange.floor}
                ceiling={priceRange.ceiling}
                userPrice={item.asking || item.value}
                avg={market.avgPrice}
              />
            </>
          ) : (
            <div className="text-xs text-white/40">Not enough data</div>
          )}
        </div>
      </div>

      {/* Row 2: Condition Pricing */}
      {conditionPricing.breakdown.length > 0 && (
        <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">
            Pricing by Condition
          </div>

          {/* Your condition highlight */}
          {conditionPricing.conditionAvg !== null && (
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
              <div>
                <span className="text-xs text-white/50">Your condition: </span>
                <span className="text-xs font-semibold text-[#EB9C35]">{conditionPricing.userCondition}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-white/90">
                  {fmtFull(conditionPricing.conditionAvg)}
                </span>
                <span className="text-[10px] text-white/40 ml-1">avg</span>
                {conditionPricing.premium !== null && conditionPricing.premium !== 0 && (
                  <span className={`text-[10px] ml-2 ${conditionPricing.premium > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {conditionPricing.premium > 0 ? '+' : ''}{conditionPricing.premium}% vs all
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Condition distribution bars */}
          <div className="space-y-1">
            {conditionPricing.breakdown.slice(0, 4).map((c) => (
              <div key={c.condition} className="flex items-center gap-2">
                <span className="text-[10px] text-white/50 w-24 truncate">{c.condition}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#EB9C35]/60"
                    style={{ width: `${Math.max(c.percent, 2)}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/40 w-8 text-right">{c.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 3: Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="Avg Price"
          value={market.avgPrice !== null ? fmtFull(market.avgPrice) : '--'}
          sub={`${market.sampleSize} sampled`}
        />
        <StatCard
          label="Median"
          value={market.medianPrice !== null ? fmtFull(market.medianPrice) : '--'}
          sub="middle price"
        />
        <StatCard
          label="Your Price"
          value={item.asking || item.value ? fmtFull(item.asking || item.value) : '--'}
          sub={getPricePosition(item.asking || item.value, market.avgPrice)}
          subColor={getPricePositionColor(item.asking || item.value, market.avgPrice)}
        />
      </div>

      {/* Row 4: Top categories */}
      {categories.length > 1 && (
        <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Top Categories
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <span key={c.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                {c.name} <span className="text-white/30">({c.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Row 5: Top brands from aspects */}
      {aspects.topBrands.length > 0 && (
        <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Competing Brands
          </div>
          <div className="flex flex-wrap gap-1.5">
            {aspects.topBrands.map((b) => (
              <span key={b.value} className="text-[10px] px-2 py-0.5 rounded-full bg-[#EB9C35]/10 text-[#EB9C35]/80 border border-[#EB9C35]/15">
                {b.value} <span className="text-[#EB9C35]/40">({b.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Subcomponents ---

function StatCard({ label, value, sub, subColor }: { label: string; value: string; sub: string; subColor?: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center">
      <div className="text-[10px] text-white/40 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-bold text-white/90 mt-0.5">{value}</div>
      <div className={`text-[10px] ${subColor || 'text-white/30'} mt-0.5`}>{sub}</div>
    </div>
  )
}

function PriceBar({ floor, ceiling, userPrice, avg }: { floor: number; ceiling: number; userPrice: number; avg: number | null }) {
  const range = ceiling - floor
  if (range <= 0) return null

  const userPos = Math.max(0, Math.min(100, ((userPrice - floor) / range) * 100))
  const avgPos = avg ? Math.max(0, Math.min(100, ((avg - floor) / range) * 100)) : null

  return (
    <div className="relative mt-1.5 h-2 bg-white/5 rounded-full overflow-visible">
      {/* Gradient bar */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/40 via-amber-500/40 to-red-500/40" />
      {/* Average marker */}
      {avgPos !== null && (
        <div
          className="absolute top-0 w-0.5 h-2 bg-white/30"
          style={{ left: `${avgPos}%` }}
        />
      )}
      {/* User price marker */}
      {userPrice > 0 && (
        <div
          className="absolute -top-0.5 w-3 h-3 rounded-full bg-[#EB9C35] border border-[#0a0b08]"
          style={{ left: `${userPos}%`, transform: 'translateX(-50%)' }}
        />
      )}
    </div>
  )
}

// --- Helpers ---

function getPricePosition(price: number, avg: number | null): string {
  if (!price || !avg) return ''
  const diff = ((price - avg) / avg) * 100
  if (diff > 15) return `${Math.round(diff)}% above avg`
  if (diff < -15) return `${Math.round(Math.abs(diff))}% below avg`
  return 'Near average'
}

function getPricePositionColor(price: number, avg: number | null): string {
  if (!price || !avg) return 'text-white/30'
  const diff = ((price - avg) / avg) * 100
  if (diff > 15) return 'text-red-400'
  if (diff < -15) return 'text-green-400'
  return 'text-amber-400'
}
