'use client'

import { useState, useMemo, useRef, useCallback } from 'react'

interface PricePoint {
  avg_price: number
  low_price: number
  high_price: number
  sample_size: number
  snapshot_date: string
}

interface Props {
  history: PricePoint[]
  productName?: string
  accentColor?: string
}

const RANGE_OPTIONS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
]

export default function PriceHistoryChart({ history, productName, accentColor = '#EB9C35' }: Props) {
  const [range, setRange] = useState(365)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Filter data by selected range
  const filteredData = useMemo(() => {
    if (!history || history.length === 0) return []
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - range)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    return history.filter(p => p.snapshot_date >= cutoffStr)
  }, [history, range])

  // Chart dimensions
  const W = 320
  const H = 160
  const PAD = { top: 20, right: 15, bottom: 30, left: 50 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  // Scales
  const { points, yLabels, minPrice, maxPrice } = useMemo(() => {
    if (filteredData.length === 0) return { points: [], yLabels: [], minPrice: 0, maxPrice: 0 }

    const prices = filteredData.map(d => d.avg_price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const padding = (max - min) * 0.1 || max * 0.1 || 10
    const yMin = Math.max(0, min - padding)
    const yMax = max + padding

    const pts = filteredData.map((d, i) => ({
      x: PAD.left + (filteredData.length === 1 ? chartW / 2 : (i / (filteredData.length - 1)) * chartW),
      y: PAD.top + chartH - ((d.avg_price - yMin) / (yMax - yMin)) * chartH,
      data: d,
    }))

    // Y-axis labels (4 ticks)
    const labels = Array.from({ length: 4 }, (_, i) => {
      const val = yMin + ((yMax - yMin) * i) / 3
      return {
        value: val,
        y: PAD.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH,
      }
    })

    return { points: pts, yLabels: labels, minPrice: yMin, maxPrice: yMax }
  }, [filteredData, chartW, chartH])

  // Line path
  const linePath = useMemo(() => {
    if (points.length === 0) return ''
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }, [points])

  // Area path (for gradient fill)
  const areaPath = useMemo(() => {
    if (points.length === 0) return ''
    const bottomY = PAD.top + chartH
    return `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`
  }, [linePath, points, chartH])

  // Handle hover
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * W

    // Find nearest point
    let closest = 0
    let closestDist = Infinity
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i].x - mouseX)
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    }
    setHoveredIndex(closest)
  }, [points])

  const handleMouseLeave = useCallback(() => setHoveredIndex(null), [])

  // Daily change calc
  const dailyChange = useMemo(() => {
    if (filteredData.length < 2) return null
    const latest = filteredData[filteredData.length - 1].avg_price
    const prev = filteredData[filteredData.length - 2].avg_price
    const change = latest - prev
    const pct = prev > 0 ? (change / prev) * 100 : 0
    return { change, pct }
  }, [filteredData])

  // Overall change for the selected range
  const overallChange = useMemo(() => {
    if (filteredData.length < 2) return null
    const first = filteredData[0].avg_price
    const last = filteredData[filteredData.length - 1].avg_price
    const change = last - first
    const pct = first > 0 ? (change / first) * 100 : 0
    return { change, pct }
  }, [filteredData])

  const fmt = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
    return `$${n.toFixed(0)}`
  }

  const fmtFull = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const fmtDate = (d: string) => {
    const date = new Date(d + 'T12:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!history || history.length === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📈</span>
          <h3 className="text-base font-bold text-white">Price History</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-dim text-xs">No price history available yet.</p>
          <p className="text-dim text-[11px] mt-1">Data builds up as products are tracked daily.</p>
        </div>
      </div>
    )
  }

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h3 className="text-base font-bold text-white">Price History</h3>
        </div>
        {overallChange && (
          <span className={`text-[12px] font-bold ${overallChange.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {overallChange.change >= 0 ? '+' : ''}{overallChange.pct.toFixed(1)}%
          </span>
        )}
      </div>

      {productName && <p className="text-dim text-[11px] mb-3">{productName}</p>}

      {/* Range selector */}
      <div className="flex gap-1 mb-3">
        {RANGE_OPTIONS.map(opt => (
          <button
            key={opt.days}
            onClick={() => setRange(opt.days)}
            className="px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
            style={{
              background: range === opt.days ? `${accentColor}22` : 'rgba(255,255,255,0.04)',
              color: range === opt.days ? accentColor : '#94a3b8',
              border: range === opt.days ? `1px solid ${accentColor}44` : '1px solid transparent',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {filteredData.length > 0 ? (
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ touchAction: 'none' }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {yLabels.map((label, i) => (
              <g key={i}>
                <line
                  x1={PAD.left}
                  y1={label.y}
                  x2={PAD.left + chartW}
                  y2={label.y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3,3"
                />
                <text
                  x={PAD.left - 6}
                  y={label.y + 3}
                  textAnchor="end"
                  className="text-[9px]"
                  fill="#64748b"
                >
                  {fmt(label.value)}
                </text>
              </g>
            ))}

            {/* Area fill */}
            <path d={areaPath} fill="url(#priceGradient)" />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={accentColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points (show all if < 30, otherwise just endpoints) */}
            {filteredData.length <= 30 && points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 4 : 2}
                fill={hoveredIndex === i ? '#fff' : accentColor}
                stroke={hoveredIndex === i ? accentColor : 'none'}
                strokeWidth={2}
              />
            ))}

            {/* Hover crosshair */}
            {hoveredPoint && (
              <>
                <line
                  x1={hoveredPoint.x}
                  y1={PAD.top}
                  x2={hoveredPoint.x}
                  y2={PAD.top + chartH}
                  stroke="rgba(255,255,255,0.2)"
                  strokeDasharray="3,3"
                />
                {filteredData.length > 30 && (
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r={4}
                    fill="#fff"
                    stroke={accentColor}
                    strokeWidth={2}
                  />
                )}
              </>
            )}

            {/* X-axis dates */}
            {filteredData.length > 1 && (
              <>
                <text x={PAD.left} y={H - 5} className="text-[8px]" fill="#64748b">
                  {fmtDate(filteredData[0].snapshot_date)}
                </text>
                <text x={PAD.left + chartW} y={H - 5} textAnchor="end" className="text-[8px]" fill="#64748b">
                  {fmtDate(filteredData[filteredData.length - 1].snapshot_date)}
                </text>
              </>
            )}
          </svg>

          {/* Hover tooltip */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none px-2.5 py-1.5 rounded-lg"
              style={{
                left: `${(hoveredPoint.x / W) * 100}%`,
                top: `${((hoveredPoint.y - 30) / H) * 100}%`,
                transform: 'translateX(-50%)',
                background: '#1e1e2e',
                border: `1px solid ${accentColor}44`,
                zIndex: 10,
              }}
            >
              <p className="text-[11px] font-bold text-white">{fmtFull(hoveredPoint.data.avg_price)}</p>
              <p className="text-dim text-[9px]">{fmtDate(hoveredPoint.data.snapshot_date)}</p>
              {hoveredPoint.data.sample_size > 0 && (
                <p className="text-dim text-[9px]">{hoveredPoint.data.sample_size} listings</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-dim text-[11px]">No data for this time range</p>
        </div>
      )}

      {/* Stats row */}
      {filteredData.length > 0 && (
        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
            <p className="text-dim text-[9px] uppercase">Latest</p>
            <p className="text-white text-[13px] font-bold">
              {fmtFull(filteredData[filteredData.length - 1].avg_price)}
            </p>
          </div>
          {dailyChange && (
            <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
              <p className="text-dim text-[9px] uppercase">Daily</p>
              <p className={`text-[13px] font-bold ${dailyChange.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {dailyChange.change >= 0 ? '+' : ''}{dailyChange.pct.toFixed(1)}%
              </p>
            </div>
          )}
          <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
            <p className="text-dim text-[9px] uppercase">Points</p>
            <p className="text-white text-[13px] font-bold">{filteredData.length}</p>
          </div>
        </div>
      )}
    </div>
  )
}
