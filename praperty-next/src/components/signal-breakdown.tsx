'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Info, Clock } from 'lucide-react'
import type { ConvictionResult, ConvictionSignal } from '@/lib/conviction'
import { getConvictionColor, getScoreColor } from '@/lib/conviction'

interface Props {
  result: ConvictionResult
  fetchedAt?: string
  compact?: boolean
}

function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 0.7) return { label: 'HIGH', color: '#4ade80' }
  if (confidence >= 0.4) return { label: 'MEDIUM', color: '#EB9C35' }
  return { label: 'LOW', color: '#f87171' }
}

function getSignalConfidence(signal: ConvictionSignal): { label: string; color: string; reason: string } {
  if (!signal.available) return { label: 'N/A', color: 'rgba(255,255,255,0.3)', reason: 'No data available' }

  // Determine confidence based on signal type and score characteristics
  switch (signal.key) {
    case 'priceVelocity':
      return { label: 'MEDIUM', color: '#EB9C35', reason: 'Based on tracked price history' }
    case 'marketDelta':
      if (signal.reason.includes('listing')) {
        const match = signal.reason.match(/(\d+) listing/)
        const count = match ? parseInt(match[1]) : 0
        if (count >= 10) return { label: 'HIGH', color: '#4ade80', reason: `${count} active listings analyzed` }
        if (count >= 5) return { label: 'MEDIUM', color: '#EB9C35', reason: `${count} listings (need 10+ for high)` }
        return { label: 'LOW', color: '#f87171', reason: `Only ${count} listing(s) found` }
      }
      if (signal.reason.includes('comp')) {
        const match = signal.reason.match(/(\d+) comp/)
        const count = match ? parseInt(match[1]) : 0
        if (count >= 8) return { label: 'HIGH', color: '#4ade80', reason: `${count} comps analyzed` }
        if (count >= 3) return { label: 'MEDIUM', color: '#EB9C35', reason: `${count} comps (need 8+ for high)` }
        return { label: 'LOW', color: '#f87171', reason: `Only ${count} comp(s)` }
      }
      return { label: 'MEDIUM', color: '#EB9C35', reason: 'Market data available' }
    case 'roiPosition':
      return { label: 'HIGH', color: '#4ade80', reason: 'Based on your actual cost data' }
    case 'holdDuration':
      return { label: 'HIGH', color: '#4ade80', reason: 'Based on purchase date + category curves' }
    case 'socialTrend':
      if (signal.reason.includes('Loading')) return { label: 'N/A', color: 'rgba(255,255,255,0.3)', reason: 'Loading...' }
      return { label: 'MEDIUM', color: '#EB9C35', reason: 'Google Trends search interest' }
    case 'dealQuality':
      if (signal.reason.includes('below avg')) return { label: 'HIGH', color: '#4ade80', reason: 'Price compared against active market listings' }
      if (signal.reason.includes('above avg')) return { label: 'HIGH', color: '#4ade80', reason: 'Price compared against active market listings' }
      return { label: 'MEDIUM', color: '#EB9C35', reason: 'Market price range available' }
    case 'flipSpeed':
      if (signal.score >= 75) return { label: 'HIGH', color: '#4ade80', reason: 'Strong market depth, demand, and pricing' }
      if (signal.score >= 50) return { label: 'MEDIUM', color: '#EB9C35', reason: 'Moderate market activity and demand' }
      return { label: 'LOW', color: '#f87171', reason: 'Thin market or low demand' }
    default:
      return { label: 'MEDIUM', color: '#EB9C35', reason: 'Data available' }
  }
}

function getDataSourceLabel(signal: ConvictionSignal): string {
  switch (signal.key) {
    case 'priceVelocity': return 'Price Snapshots DB'
    case 'marketDelta': return 'eBay Active Listings'
    case 'roiPosition': return 'Your Cost Records'
    case 'holdDuration': return 'Purchase Date + Category'
    case 'socialTrend': return 'Google Trends'
    case 'dealQuality': return 'eBay Active Listings'
    case 'flipSpeed': return 'eBay Listings + Google Trends'
    default: return 'Market Data'
  }
}

function SignalRow({ signal, expanded }: { signal: ConvictionSignal; expanded: boolean }) {
  const confidence = getSignalConfidence(signal)
  const dataSource = getDataSourceLabel(signal)
  const weightPct = Math.round(signal.weight * 100)

  const barColor = !signal.available
    ? 'rgba(255,255,255,0.08)'
    : signal.score >= 65
      ? 'rgba(74,222,128,0.4)'
      : signal.score <= 35
        ? 'rgba(248,113,113,0.4)'
        : 'rgba(212,165,116,0.4)'

  const textColor = !signal.available
    ? 'rgba(255,255,255,0.3)'
    : signal.score >= 65
      ? '#4ade80'
      : signal.score <= 35
        ? '#f87171'
        : '#d4a574'

  return (
    <div className="bg-white/[0.03] rounded-xl p-3 transition-all">
      {/* Main row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{signal.emoji}</span>
          <span className="text-sm font-semibold text-white">{signal.label}</span>
          <span className="text-[10px] text-dim">({weightPct}% weight)</span>
        </div>
        <div className="flex items-center gap-2">
          {signal.available && (
            <span className="text-sm font-bold" style={{ color: textColor }}>
              {signal.score}/100
            </span>
          )}
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{
              color: confidence.color,
              background: `${confidence.color}15`,
              border: `1px solid ${confidence.color}30`,
            }}
          >
            {confidence.label}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: signal.available ? `${signal.score}%` : '0%',
            background: barColor,
          }}
        />
      </div>

      {/* Reason */}
      <p className="text-[11px] text-slate-400">{signal.reason}</p>

      {/* Expanded details */}
      {expanded && signal.available && (
        <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-1">
          <div className="flex items-center gap-1.5">
            <Info size={10} className="text-dim" />
            <span className="text-[10px] text-dim">Data source: {dataSource}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Info size={10} className="text-dim" />
            <span className="text-[10px] text-dim">Confidence: {confidence.reason}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Info size={10} className="text-dim" />
            <span className="text-[10px] text-dim">
              Impact: {signal.score > 50 ? '+' : ''}{Math.round((signal.score - 50) * signal.weight)} pts to final score
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SignalBreakdown({ result, fetchedAt, compact = false }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { score, level, confidence, headline, signals, dataPoints, mode } = result
  const color = getConvictionColor(level)
  const confLabel = getConfidenceLabel(confidence)
  const needlePercent = Math.max(2, Math.min(98, score))
  const isBrowse = mode === 'browse'

  // Sort: available first, then by weight descending
  const sortedSignals = [...signals].sort((a, b) => {
    if (a.available !== b.available) return b.available ? 1 : -1
    return b.weight - a.weight
  })

  const availableCount = signals.filter(s => s.available).length

  return (
    <div className="glass rounded-2xl p-5" style={{ border: `1px solid ${color}33` }}>
      {/* Header: Score + Label */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-dim text-[11px] uppercase tracking-widest">{isBrowse ? 'Buy Signal' : 'Market Signal'}</p>
          <div className="flex items-center gap-2.5 mt-1">
            <span className="text-3xl font-extrabold font-heading" style={{ color }}>
              {isBrowse ? (level === 'SELL' ? 'SKIP' : level === 'HOLD' ? 'MAYBE' : 'BUY') : level}
            </span>
            <span className="text-slate-500 text-sm">{score}/100</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ border: `3px solid ${color}` }}>
            <span className="text-lg font-bold" style={{ color }}>{score}</span>
          </div>
        </div>
      </div>

      {/* Gauge bar: neutral (pass) → consider → opportunity (amber). No red/green = good/bad. */}
      <div className="h-2 rounded-full mb-2 relative" style={{
        background: 'linear-gradient(90deg, #475569, #64748b, #94a3b8, #d4a574, #EB9C35)',
      }}>
        <div className="absolute -top-1 w-4 h-4 rounded-full bg-white transition-all duration-700" style={{
          left: `${needlePercent}%`, transform: 'translateX(-50%)',
          border: `3px solid ${color}`,
          boxShadow: `0 0 12px ${color}66`,
        }} />
      </div>

      {/* Labels: neutral for pass/hold, amber only for BUY */}
      <div className="flex justify-between mb-3">
        <span className="text-[9px] font-semibold text-slate-400">{isBrowse ? 'SKIP' : 'SELL'}</span>
        <span className="text-[9px] font-semibold text-slate-300">{isBrowse ? 'MAYBE' : 'HOLD'}</span>
        <span className="text-[9px] font-semibold text-amber-brand/90">BUY</span>
      </div>

      {/* Headline */}
      <p className="text-sm text-white/80 mb-3 leading-snug">{headline}</p>

      {/* Meta row: confidence + data points + freshness */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
          style={{
            color: confLabel.color,
            background: `${confLabel.color}12`,
            border: `1px solid ${confLabel.color}25`,
          }}
        >
          {confLabel.label} confidence
        </span>
        <span className="text-[10px] text-dim bg-white/[0.06] px-2 py-0.5 rounded-lg">
          {availableCount}/{signals.length} signals active
        </span>
        <span className="text-[10px] text-dim bg-white/[0.06] px-2 py-0.5 rounded-lg">
          {dataPoints} data point{dataPoints !== 1 ? 's' : ''}
        </span>
        {fetchedAt && (
          <span className="text-[10px] text-dim bg-white/[0.06] px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Clock size={9} />
            {(() => {
              const mins = Math.round((Date.now() - new Date(fetchedAt).getTime()) / 60000)
              if (mins < 1) return 'Just now'
              if (mins < 60) return `${mins}m ago`
              const hrs = Math.round(mins / 60)
              if (hrs < 24) return `${hrs}h ago`
              return `${Math.round(hrs / 24)}d ago`
            })()}
          </span>
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
        style={{ color: color }}
      >
        {expanded ? 'Hide' : 'Show'} Signal Breakdown
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Expanded signal details */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {sortedSignals.map(signal => (
            <SignalRow key={signal.key} signal={signal} expanded={expanded} />
          ))}

          {/* Data transparency note */}
          <div className="mt-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <div className="flex items-start gap-2">
              <Info size={12} className="text-dim mt-0.5 flex-shrink-0" />
              <div className="text-[10px] text-dim leading-relaxed">
                <p className="font-semibold text-white/50 mb-1">How this score works</p>
                <p>
                  Each factor is scored 0-100 independently, then combined using the weights shown above.
                  Unavailable signals are excluded and their weight is redistributed proportionally.
                  Market prices are based on active eBay listings (not verified sales).
                  Confidence reflects how much data we have, not prediction accuracy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
