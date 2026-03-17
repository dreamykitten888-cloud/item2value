'use client'

import { useMemo } from 'react'
import type { ConvictionResult } from '@/lib/conviction'
import { getConvictionColor, getScoreColor } from '@/lib/conviction'
import InfoTooltip from '@/components/info-tooltip'

interface Props {
  result: ConvictionResult
}

export default function ConvictionGauge({ result }: Props) {
  const { score, level, confidence, headline, signals, dataPoints } = result
  const color = getConvictionColor(level)

  // Needle position: 0 = far left (SELL), 100 = far right (BUY)
  const needlePercent = Math.max(2, Math.min(98, score))

  // Signal chips (available ones first, then unavailable)
  const sortedSignals = useMemo(() =>
    [...signals].sort((a, b) => (b.available ? 1 : 0) - (a.available ? 1 : 0)),
    [signals]
  )

  return (
    <div className="glass rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight" style={{ color }}>
            {level}
          </span>
          <span className="text-dim text-xs font-medium flex items-center gap-1">
            Score: {score}/100
            <InfoTooltip size="sm" content="Combined signal score. SELL/HOLD/BUY indicate where this item sits; use with price and trend data to decide." ariaLabel="What is the score?" />
          </span>
        </div>
        <div className="text-dim text-[10px] font-medium flex items-center gap-1">
          {dataPoints > 0
            ? `Based on ${dataPoints} data point${dataPoints !== 1 ? 's' : ''}`
            : 'No data yet'
          }
          {dataPoints > 0 && <InfoTooltip size="sm" content="Number of underlying data points (listings, comps, snapshots) used to compute this signal." ariaLabel="What are data points?" />}
          {confidence < 0.5 && dataPoints > 0 && (
            <span className="text-amber-brand/70 ml-1">(low confidence)</span>
          )}
        </div>
      </div>

      {/* Gauge bar: neutral (pass) → consider → opportunity (amber). No red/green = good/bad. */}
      <div className="mb-3">
        <div className="relative h-3">
          <div className="absolute inset-0 rounded-full overflow-hidden" style={{
            background: 'linear-gradient(90deg, #475569, #64748b, #94a3b8, #d4a574, #EB9C35)',
          }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700 ease-out"
            style={{ left: `${needlePercent}%` }}
          >
            <div
              className="w-5 h-5 rounded-full border-[3px] shadow-lg"
              style={{
                borderColor: getScoreColor(score),
                background: 'var(--bg-primary)',
                boxShadow: `0 0 12px ${getScoreColor(score)}40`,
              }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-semibold text-slate-400">SELL</span>
          <span className="text-[10px] font-semibold text-slate-300">HOLD</span>
          <span className="text-[10px] font-semibold text-amber-brand/90">BUY</span>
        </div>
      </div>

      {/* Headline */}
      <p className="text-sm text-white/80 mb-4 leading-snug">{headline}</p>

      {/* Signal chips */}
      <div className="flex flex-wrap gap-1.5">
        {sortedSignals.map(signal => {
          const chipColor = !signal.available
            ? 'rgba(255,255,255,0.06)'
            : signal.score >= 65
              ? 'rgba(74,222,128,0.12)'
              : signal.score <= 35
                ? 'rgba(248,113,113,0.12)'
                : 'rgba(212,165,116,0.12)'

          const textColor = !signal.available
            ? 'rgba(255,255,255,0.3)'
            : signal.score >= 65
              ? '#4ade80'
              : signal.score <= 35
                ? '#f87171'
                : '#d4a574'

          return (
            <div
              key={signal.key}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium"
              style={{ background: chipColor, color: textColor }}
              title={signal.reason}
            >
              <span>{signal.emoji}</span>
              <span>{signal.label}</span>
              {signal.available ? (
                <span className="font-bold ml-0.5">
                  {signal.score >= 65 ? '↑' : signal.score <= 35 ? '↓' : '→'}
                </span>
              ) : (
                <span className="opacity-50">···</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
