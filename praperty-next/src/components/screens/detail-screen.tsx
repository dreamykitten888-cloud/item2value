'use client'

import { ArrowLeft, Edit3, Trash2 } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { fmtFull } from '@/lib/utils'
import type { Screen } from '@/types'

interface Props {
  itemId: string | null
  onBack: () => void
  onNavigate: (screen: Screen) => void
}

export default function DetailScreen({ itemId, onBack, onNavigate }: Props) {
  const { items, deleteItem } = useItemsStore()

  const item = items.find(i => i.id === itemId)

  if (!item) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-dim text-sm">Item not found</p>
          <button onClick={onBack} className="mt-4 text-amber-brand text-sm font-semibold">
            Go back
          </button>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (window.confirm(`Delete "${item.name}"? This cannot be undone.`)) {
      await deleteItem(item.id)
      onBack()
    }
  }

  const roi = item.cost > 0 && item.value > 0
    ? Math.round(((item.value - item.cost) / item.cost) * 100)
    : null

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-dim hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('edit-item')}
            className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
          >
            <Edit3 size={18} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 glass rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Item header */}
      <div className="px-6 pb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl flex-shrink-0">
            {item.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">{item.name}</h1>
            <p className="text-dim text-sm mt-0.5">
              {item.brand && `${item.brand} · `}{item.model && `${item.model} · `}{item.category}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-xs font-medium text-dim">
                {item.condition}
              </span>
              {item.dateSold && (
                <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 text-xs font-medium text-green-400">
                  Sold
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Value card */}
      <div className="px-6 pb-4">
        <div className="glass rounded-2xl p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-dim text-[10px] uppercase tracking-wider">Cost</p>
              <p className="text-lg font-bold text-white mt-1">{fmtFull(item.cost)}</p>
            </div>
            <div>
              <p className="text-dim text-[10px] uppercase tracking-wider">Value</p>
              <p className="text-lg font-bold text-white mt-1">{fmtFull(item.value)}</p>
            </div>
            <div>
              <p className="text-dim text-[10px] uppercase tracking-wider">ROI</p>
              <p className={`text-lg font-bold mt-1 ${
                roi !== null ? (roi >= 0 ? 'text-green-400' : 'text-red-400') : 'text-dim'
              }`}>
                {roi !== null ? `${roi >= 0 ? '+' : ''}${roi}%` : '--'}
              </p>
            </div>
          </div>
          {item.asking > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-dim text-[10px] uppercase tracking-wider">Asking Price</p>
              <p className="text-lg font-bold text-amber-brand mt-1">{fmtFull(item.asking)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="px-6 pb-4 space-y-3">
        {item.datePurchased && (
          <div className="flex justify-between py-2">
            <span className="text-dim text-sm">Date Purchased</span>
            <span className="text-white text-sm font-medium">{new Date(item.datePurchased).toLocaleDateString()}</span>
          </div>
        )}
        {item.dateSold && (
          <div className="flex justify-between py-2">
            <span className="text-dim text-sm">Date Sold</span>
            <span className="text-white text-sm font-medium">{new Date(item.dateSold).toLocaleDateString()}</span>
          </div>
        )}
        {item.soldPlatform && (
          <div className="flex justify-between py-2">
            <span className="text-dim text-sm">Sold On</span>
            <span className="text-white text-sm font-medium">{item.soldPlatform}</span>
          </div>
        )}
        {item.notes && (
          <div className="glass rounded-xl p-4 mt-3">
            <p className="text-dim text-[10px] uppercase tracking-wider mb-2">Notes</p>
            <p className="text-white text-sm leading-relaxed">{item.notes}</p>
          </div>
        )}
      </div>

      {/* Comps */}
      {item.comps.length > 0 && (
        <div className="px-6 pb-4">
          <h3 className="text-sm font-bold text-white mb-3">Market Comps ({item.comps.length})</h3>
          <div className="space-y-2">
            {item.comps.map((comp, i) => (
              <div key={i} className="glass rounded-xl p-3 flex justify-between items-center">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm text-white truncate">{comp.title}</p>
                  {comp.source && <p className="text-xs text-dim">{comp.source}</p>}
                </div>
                <p className="text-sm font-bold text-white flex-shrink-0">{fmtFull(comp.price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
