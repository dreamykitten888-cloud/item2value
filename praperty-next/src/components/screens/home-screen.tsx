'use client'

import { Package, DollarSign, BarChart3, Bell, Camera, Plus, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useItemsStore } from '@/stores/items-store'
import { fmt, getGreeting } from '@/lib/utils'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onViewItem: (id: string) => void
}

export default function HomeScreen({ onNavigate, onViewItem }: Props) {
  const { profile } = useAuthStore()
  const { items } = useItemsStore()

  const userName = profile?.name || 'there'
  const userInitial = userName.charAt(0).toUpperCase()

  const activeItems = items.filter(i => !i.dateSold)
  const soldItems = items.filter(i => !!i.dateSold)
  const totalValue = activeItems.reduce((sum, i) => sum + (i.value || 0), 0)
  const totalEarnings = soldItems.reduce((sum, i) => sum + (i.earnings || i.value || 0), 0)

  // Simple alerts count (items with no value or stale data)
  const alertCount = activeItems.filter(i => !i.value || i.value === 0).length

  const stats = [
    {
      label: 'Total Items',
      value: String(items.length),
      icon: Package,
      gradient: 'bg-gradient-blue',
    },
    {
      label: 'Total Value',
      value: fmt(totalValue),
      icon: DollarSign,
      gradient: 'bg-gradient-amber',
    },
    {
      label: 'Total Earnings',
      value: totalEarnings > 0 ? fmt(totalEarnings) : '--',
      icon: BarChart3,
      gradient: 'bg-gradient-purple',
      onClick: () => onNavigate('sold-items'),
    },
    {
      label: 'Alerts',
      value: alertCount > 0 ? String(alertCount) : '--',
      icon: Bell,
      gradient: 'from-amber-500 to-amber-600 bg-gradient-to-br',
      onClick: () => onNavigate('alerts'),
    },
  ]

  // Recent items (last 5)
  const recentItems = items.slice(0, 5)

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-2">
        <div className="flex justify-between items-center mb-7">
          <div>
            <p className="text-dim text-xs uppercase tracking-widest">{getGreeting()}</p>
            <h1 className="text-[28px] font-bold text-white mt-1">{userName}</h1>
          </div>
          <div className="w-11 h-11 rounded-full gradient-amber flex items-center justify-center text-lg font-bold text-black">
            {userInitial}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="glass rounded-2xl p-4 animate-fade-up cursor-default"
                style={{ animationDelay: `${i * 0.08}s` }}
                onClick={stat.onClick}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-dim text-[11px] uppercase tracking-wider">{stat.label}</p>
                    <p className="text-[22px] font-bold text-white mt-1.5">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-[10px] ${stat.gradient} flex items-center justify-center`}>
                    <Icon size={20} color="#fff" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-5 flex gap-3">
        <button
          onClick={() => onNavigate('scan')}
          className="flex-1 gradient-amber rounded-xl py-4 text-[15px] font-semibold text-black flex items-center justify-center gap-2"
        >
          <Camera size={20} />
          Scan Item
        </button>
        <button
          onClick={() => onNavigate('add-item')}
          className="flex-1 glass glass-hover rounded-xl py-4 text-[15px] font-semibold text-white flex items-center justify-center gap-2 border border-white/10"
        >
          <Plus size={20} />
          Add Manually
        </button>
      </div>

      {/* Discover CTA */}
      <div className="px-6 pb-3">
        <button
          onClick={() => onNavigate('discover')}
          className="w-full glass glass-hover rounded-xl p-4 border border-purple-500/20 flex items-center gap-3.5 text-left"
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.08))' }}
        >
          <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a855f7, #3b82f6)' }}>
            <Search size={22} color="#fff" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Discover Market Prices</p>
            <p className="text-dim text-xs mt-0.5">Search what any item is buying and selling for</p>
          </div>
        </button>
      </div>

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <div className="px-6 pt-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-white">Recent Items</h2>
            <button onClick={() => onNavigate('inventory')} className="text-amber-brand text-xs font-semibold">
              View All
            </button>
          </div>
          <div className="space-y-2">
            {recentItems.map(item => (
              <button
                key={item.id}
                onClick={() => onViewItem(item.id)}
                className="w-full glass glass-hover rounded-xl p-3.5 flex items-center gap-3 text-left transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                  <p className="text-xs text-dim">{item.category}</p>
                </div>
                <p className="text-sm font-bold text-white">{fmt(item.value || item.cost)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
