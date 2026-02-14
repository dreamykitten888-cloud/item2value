'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import type { Screen, Alert } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  alerts?: Alert[]
}

const ALERT_CATEGORIES = {
  highlights: { label: 'Highlights', emoji: '🏆' },
  pricing: { label: 'Pricing', emoji: '💰' },
  action: { label: 'Action Needed', emoji: '⚡' },
  insights: { label: 'Insights', emoji: '💡' },
  activity: { label: 'Activity', emoji: '🔔' },
}

const ALERT_COLORS: Record<string, string> = {
  'price_drop': '#22c55e',
  'price_spike': '#ef4444',
  'no_comps': '#3b82f6',
  'stale_price': '#f59e0b',
  'watchlist_target': '#8b5cf6',
}

export default function AlertsScreen({ onNavigate, alerts = [] }: Props) {
  const [filterTab, setFilterTab] = useState<'all' | 'highlights' | 'pricing' | 'action' | 'insights' | 'activity'>('all')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['highlights', 'pricing', 'action', 'insights', 'activity'])

  const categoryOrder = ['highlights', 'pricing', 'action', 'insights', 'activity']

  // Map alert types to categories
  const getAlertCategory = (alertType: string): string => {
    if (['price_drop', 'price_spike', 'stale_price'].includes(alertType)) return 'pricing'
    if (alertType === 'no_comps') return 'action'
    if (alertType === 'watchlist_target') return 'highlights'
    return 'activity'
  }

  const filtered = filterTab === 'all' ? alerts : alerts.filter(a => {
    const alertCategory = getAlertCategory(a.type)
    return alertCategory === filterTab
  })

  // Group by category
  const grouped: Record<string, Alert[]> = {}
  filtered.forEach(a => {
    const category = getAlertCategory(a.type)
    if (!grouped[category]) grouped[category] = []
    grouped[category].push(a)
  })

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

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
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setFilterTab('all')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filterTab === 'all'
                  ? 'bg-amber-brand/20 border border-amber-brand text-amber-brand'
                  : 'bg-white/4 border border-white/10 text-slate-400 hover:bg-white/8'
              }`}
            >
              All ({alerts.length})
            </button>
            {(['highlights', 'pricing', 'action', 'insights', 'activity'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterTab(t)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filterTab === t
                    ? 'bg-amber-brand/20 border border-amber-brand text-amber-brand'
                    : 'bg-white/4 border border-white/10 text-slate-400 hover:bg-white/8'
                }`}
              >
                {`${ALERT_CATEGORIES[t]?.emoji || ''} ${ALERT_CATEGORIES[t]?.label} (${alerts.filter(a => getAlertCategory(a.type) === t).length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {alerts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-base font-bold text-white mb-2">No alerts yet</p>
            <p className="text-dim text-sm leading-relaxed">
              Add items to your inventory and alerts will appear here based on your pricing, market values, and comparables.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dim text-sm">No alerts in this category right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(filterTab === 'all' ? categoryOrder : categoryOrder.filter(c => c === filterTab)).map(cat => {
              const catAlerts = grouped[cat]
              if (!catAlerts || catAlerts.length === 0) return null

              const isExpanded = expandedCategories.includes(cat)
              const catInfo = ALERT_CATEGORIES[cat as keyof typeof ALERT_CATEGORIES]

              return (
                <div key={cat}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center gap-3 mb-3 p-1.5 hover:bg-white/3 rounded-lg transition-colors"
                  >
                    <span className="text-lg">{catInfo?.emoji}</span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{catInfo?.label}</p>
                    <span className="text-xs font-semibold text-slate-600 bg-white/6 px-2 py-0.5 rounded-lg ml-auto">
                      {catAlerts.length}
                    </span>
                    <span className={`text-sm text-slate-600 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {/* Category Content */}
                  {isExpanded && (
                    <div className="space-y-2">
                      {catAlerts.map((alert, i) => {
                        const color = ALERT_COLORS[alert.type] || '#d4a853'
                        return (
                          <div
                            key={alert.id}
                            className="glass rounded-xl p-3.5 border border-white/8 hover:bg-white/8 transition-colors animate-fade-up"
                            style={{ animationDelay: `${i * 0.04}s`, borderLeftColor: `${color}44`, borderLeftWidth: '3px' }}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                style={{ background: color }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-sm">{alert.title}</p>
                                <p className="text-dim text-xs mt-1">{alert.message}</p>
                                {alert.itemId && (
                                  <button
                                    onClick={() => onNavigate('detail')}
                                    className="text-amber-brand text-xs font-semibold mt-2 hover:text-amber-brand/80"
                                  >
                                    View Item →
                                  </button>
                                )}
                              </div>
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
