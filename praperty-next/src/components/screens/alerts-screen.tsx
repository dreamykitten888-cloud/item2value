'use client'

import { useState, useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Screen, Alert, AlertCategory } from '@/types'
import { useItemsStore } from '@/stores/items-store'
import { generateAlerts, ALERT_COLORS, CATEGORY_META, CATEGORY_ORDER } from '@/lib/alerts-engine'

interface Props {
  onNavigate: (screen: Screen) => void
  onViewItem: (itemId: string) => void
}

const FILTER_TABS: ('all' | AlertCategory)[] = ['all', ...CATEGORY_ORDER]

export default function AlertsScreen({ onNavigate, onViewItem }: Props) {
  const { items } = useItemsStore()
  const alerts = useMemo(() => generateAlerts(items), [items])

  const [filterTab, setFilterTab] = useState<'all' | AlertCategory>('all')
  const [expandedCats, setExpandedCats] = useState<string[]>(['highlights', 'pricing', 'action'])

  const filtered = filterTab === 'all' ? alerts : alerts.filter(a => a.category === filterTab)

  // Group by category
  const grouped: Partial<Record<AlertCategory, Alert[]>> = {}
  filtered.forEach(a => {
    if (!grouped[a.category]) grouped[a.category] = []
    grouped[a.category]!.push(a)
  })

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  const countForCat = (cat: AlertCategory) => alerts.filter(a => a.category === cat).length

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          {alerts.length > 0 && (
            <span className="bg-amber-brand/20 text-amber-brand text-xs font-bold px-2.5 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="overflow-x-auto scroll-hide">
          <div className="flex gap-2 min-w-max pb-1">
            {FILTER_TABS.map(t => {
              const count = t === 'all' ? alerts.length : countForCat(t)
              const label = t === 'all' ? `All (${count})` : `${CATEGORY_META[t].emoji} ${CATEGORY_META[t].label} (${count})`
              return (
                <button
                  key={t}
                  onClick={() => setFilterTab(t)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterTab === t
                      ? 'bg-amber-brand/20 text-amber-brand'
                      : 'bg-white/5 text-slate-400 hover:bg-white/8'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Empty state */}
        {alerts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🔔</p>
            <p className="text-base font-bold text-white mb-2">No alerts yet</p>
            <p className="text-dim text-sm leading-relaxed max-w-xs mx-auto">
              Add items to your inventory and alerts will appear here based on your pricing, market values, and comparables.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dim text-sm">No alerts in this category right now.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {(filterTab === 'all' ? CATEGORY_ORDER : [filterTab]).map(cat => {
              const catAlerts = grouped[cat]
              if (!catAlerts || catAlerts.length === 0) return null
              const isExpanded = expandedCats.includes(cat)
              const meta = CATEGORY_META[cat]

              return (
                <div key={cat}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCat(cat)}
                    className="w-full flex items-center gap-2 mb-2 py-1"
                  >
                    <span className="text-sm">{meta.emoji}</span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{meta.label}</span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-white/6 px-2 py-0.5 rounded-lg">
                      {catAlerts.length}
                    </span>
                    <div className="flex-1 h-px bg-white/6" />
                    <span className={`text-xs text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {/* Alert Cards */}
                  {isExpanded && (
                    <div className="space-y-2">
                      {catAlerts.map((alert, i) => {
                        const color = ALERT_COLORS[alert.type] || '#d4a853'
                        return (
                          <div
                            key={alert.id}
                            onClick={() => alert.itemId && onViewItem(alert.itemId)}
                            className="glass rounded-xl p-3.5 cursor-pointer hover:bg-white/8 transition-all"
                            style={{
                              borderLeft: `3px solid ${color}`,
                              animationDelay: `${i * 0.04}s`,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {/* Item emoji */}
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                                style={{ background: `${color}18` }}
                              >
                                {alert.emoji || '📦'}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <span
                                  className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md mb-1"
                                  style={{ color, background: `${color}15` }}
                                >
                                  {alert.type}
                                </span>
                                <p className="text-[13px] font-medium text-slate-200 leading-snug">
                                  {alert.msg}
                                </p>
                              </div>

                              {/* Chevron */}
                              {alert.itemId && (
                                <ChevronRight size={16} style={{ color }} className="flex-shrink-0 mt-1" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
