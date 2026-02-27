'use client'

import { TrendingUp, TrendingDown, Minus, Search, Activity } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import type { MarketSignalData } from '@/types'

interface Props {
  /** Pre-fetched signal data (research screen passes this directly) */
  signal?: MarketSignalData | null
  loading?: boolean
}

export default function TrendIndicator({ signal, loading }: Props) {
  // If no signal passed, pull from store (detail screen)
  const storeSignal = useItemsStore((s) => s.marketSignal)
  const storeLoading = useItemsStore((s) => s.marketSignalLoading)

  const data = signal !== undefined ? signal : storeSignal
  const isLoading = loading !== undefined ? loading : storeLoading

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <Activity className="w-4 h-4 animate-pulse" />
          Fetching Google Trends data...
        </div>
      </div>
    )
  }

  if (!data || data.trendScore === null || data.trendScore === undefined) return null

  const score = data.trendScore
  const direction = data.trendDirection || 'stable'

  const dirConfig = {
    rising: {
      icon: TrendingUp,
      label: 'Rising',
      color: 'text-green-400',
      bg: 'bg-green-500/15 border-green-500/20',
      barColor: 'bg-green-400',
      desc: 'Search interest is climbing',
    },
    stable: {
      icon: Minus,
      label: 'Stable',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/15',
      barColor: 'bg-amber-400',
      desc: 'Steady search interest',
    },
    declining: {
      icon: TrendingDown,
      label: 'Declining',
      color: 'text-red-400',
      bg: 'bg-red-500/15 border-red-500/20',
      barColor: 'bg-red-400',
      desc: 'Search interest is dropping',
    },
  }

  const cfg = dirConfig[direction]
  const Icon = cfg.icon

  // Score bucket label
  const scoreLabel =
    score >= 75 ? 'Very High' :
    score >= 50 ? 'Moderate' :
    score >= 25 ? 'Low' :
    'Very Low'

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-[#EB9C35]" />
        <span className="text-sm font-semibold text-white/90">Search Trends</span>
        <span className="text-[10px] text-white/30 ml-auto">via Google Trends</span>
      </div>

      <div className={`rounded-lg border p-3 ${cfg.bg}`}>
        <div className="flex items-center justify-between mb-2">
          {/* Direction badge */}
          <div className="flex items-center gap-1.5">
            <Icon className={`w-4 h-4 ${cfg.color}`} />
            <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
            <span className="text-[10px] text-white/40 ml-1">{cfg.desc}</span>
          </div>
          {/* Score number */}
          <div className="text-right">
            <span className="text-lg font-bold text-white/90">{score}</span>
            <span className="text-[10px] text-white/40 ml-0.5">/100</span>
          </div>
        </div>

        {/* Score bar */}
        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${cfg.barColor} transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
          {/* 50 midline marker */}
          <div className="absolute top-0 left-1/2 w-px h-2 bg-white/20" />
        </div>

        {/* Labels under bar */}
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-white/25">Low interest</span>
          <span className="text-[9px] text-white/40 font-medium">{scoreLabel}</span>
          <span className="text-[9px] text-white/25">High interest</span>
        </div>

        {/* What this means */}
        <div className="mt-2 pt-2 border-t border-white/5">
          <p className="text-[10px] text-white/40">
            {direction === 'rising'
              ? 'Demand is growing. Good time to list at or above market average.'
              : direction === 'declining'
              ? 'Interest is cooling. Consider pricing competitively to move faster.'
              : 'Demand is steady. Price based on condition and comparable sales.'}
          </p>
        </div>
      </div>
    </div>
  )
}
