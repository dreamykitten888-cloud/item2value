'use client'

import { useMemo } from 'react'
import type { ConvictionResult } from '@/lib/conviction'
import { getConvictionColor, getScoreColor } from '@/lib/conviction'

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
          <span className="text-dim text-xs font-medium">
            Score: {score}/100
          </span>
        </div>
        <div className="text-dim text-[10px] font-medium">
          {dataPoints > 0
            ? `Based on ${dataPoints} data point${dataPoints !== 1 ? 's' : ''}`
            : 'No data yet'
          }
          {confidence < 0.5 && dataPoints > 0 && (
            <span className="text-amber-brand/70 ml-1">(low confidence)</span>
          )}
        </div>
      </div>

      {/* Gauge bar */}
      <div className="mb-3">
        {/* Track + Needle wrapper */}
        <div className="relative h-3">
          {/* Track */}
          <div className="absolute inset-0 rounded-full overflow-hidden flex">
            <div className="flex-1 bg-gradient-to-r from-red-500/60 via-red-400/40 to-red-400/20" />
            <div className="flex-1 bg-gradient-to-r from-amber-500/20 via-amber-400/40 to-amber-500/20" />
            <div className="flex-1 bg-gradient-to-r from-green-400/20 via-green-400/40 to-green-500/60" />
          </div>

          {/* Needle */}
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

        {/* Labels */}
        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-semibold text-red-400/70">SELL</span>
          <span className="text-[10px] font-semibold text-amber-brand/70">HOLD</span>
          <span className="text-[10px] font-semibold text-green-400/70">BUY</span>
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
