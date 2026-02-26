import type { Item, Alert, AlertType, AlertCategory } from '@/types'
import type { StoredSignal } from '@/stores/items-store'

// --- Colors per alert type ---
export const ALERT_COLORS: Record<AlertType, string> = {
  'Top Gainer': '#22c55e',
  'Fastest Flip': '#3b82f6',
  'Biggest Win': '#4ade80',
  'Below Cost': '#f87171',
  'Underpriced': '#fbbf24',
  'Priced High': '#f97316',
  'Strong Performer': '#4ade80',
  'Needs Comps': '#3b82f6',
  'Set Market Value': '#8b5cf6',
  'Add Photo': '#a78bfa',
  'New Item Added': '#EB9C35',
  'High Concentration': '#f59e0b',
  'Stale Item': '#94a3b8',
  'Ready to Sell': '#22d3ee',
  'Price Surge': '#22c55e',
  'Price Drop': '#ef4444',
  'Sell Signal': '#f97316',
  'Buy Signal': '#10b981',
  'Market Hot': '#f59e0b',
}

export const CATEGORY_META: Record<AlertCategory, { label: string; emoji: string }> = {
  highlights: { label: 'Highlights', emoji: '🏆' },
  pricing: { label: 'Pricing', emoji: '💰' },
  action: { label: 'Action Needed', emoji: '⚡' },
  activity: { label: 'Activity', emoji: '🔔' },
  insights: { label: 'Insights', emoji: '💡' },
}

export const CATEGORY_ORDER: AlertCategory[] = ['highlights', 'pricing', 'action', 'insights', 'activity']

const fmt = (n: number) => `$${n.toLocaleString()}`

const getGain = (item: Item): number => {
  if (item.cost === 0) return 0
  return Math.round(((item.value - item.cost) / item.cost) * 100)
}

/**
 * Generate alerts from items + optional stored market signals.
 * When signals are provided, we fire real market-driven alerts:
 * price surges, price drops, sell signals, buy signals, etc.
 */
export function generateAlerts(
  items: Item[],
  signals?: Map<string, StoredSignal>
): Alert[] {
  const a: Alert[] = []
  let id = 1
  const now = new Date()

  const activeItems = items.filter(i => !i.earnings || i.earnings <= 0)
  const soldItems = items.filter(i => i.earnings && i.earnings > 0)
  const totalValue = activeItems.reduce((s, i) => s + (i.value || 0), 0)

  // Find top gainer among active items
  const topGainer = activeItems.length > 0
    ? activeItems.reduce((m, i) => getGain(i) > getGain(m) ? i : m)
    : null

  // ==================== MARKET SIGNAL ALERTS ====================
  // These fire first because they're the most actionable, real-time alerts

  if (signals && signals.size > 0) {
    activeItems.forEach(item => {
      const signal = signals.get(item.id)
      if (!signal || signal.ebayAvgPrice === 0) return

      // SELL SIGNAL: conviction >= 70 with real market data
      if (signal.convictionLevel === 'SELL' && signal.convictionScore >= 70) {
        a.push({
          id: id++, type: 'Sell Signal', category: 'highlights', priority: -2,
          emoji: item.emoji, itemId: item.id,
          msg: `${item.name} has a strong sell signal (${signal.convictionScore}/100). eBay avg ${fmt(signal.ebayAvgPrice)}.`,
        })
      }

      // BUY SIGNAL: price dropped >10% and conviction says BUY
      if (signal.convictionLevel === 'BUY' && signal.priceChangePct < -10) {
        a.push({
          id: id++, type: 'Buy Signal', category: 'highlights', priority: -1,
          emoji: item.emoji, itemId: item.id,
          msg: `${item.name} price dropped ${Math.abs(signal.priceChangePct).toFixed(1)}%. Good time to buy more.`,
        })
      }

      // PRICE SURGE: market avg went up >5% since last check
      if (signal.priceChangePct > 5) {
        a.push({
          id: id++, type: 'Price Surge', category: 'pricing', priority: 3,
          emoji: item.emoji, itemId: item.id,
          msg: `${item.name} market price is up ${signal.priceChangePct.toFixed(1)}% to ${fmt(signal.ebayAvgPrice)}.`,
        })
      }

      // PRICE DROP: market avg went down >5% since last check
      if (signal.priceChangePct < -5) {
        a.push({
          id: id++, type: 'Price Drop', category: 'pricing', priority: 4,
          emoji: item.emoji, itemId: item.id,
          msg: `${item.name} market price dropped ${Math.abs(signal.priceChangePct).toFixed(1)}% to ${fmt(signal.ebayAvgPrice)}.`,
        })
      }

      // MARKET HOT: trend is rising + high listing count
      if (signal.trendDirection === 'rising' && signal.trendScore >= 70) {
        a.push({
          id: id++, type: 'Market Hot', category: 'insights', priority: 8,
          emoji: item.emoji, itemId: item.id,
          msg: `${item.name} is trending up with high search interest. Market is hot.`,
        })
      }
    })
  }

  // ==================== HIGHLIGHTS ====================

  // Top Gainer
  if (topGainer && getGain(topGainer) > 0) {
    a.push({
      id: id++, type: 'Top Gainer', category: 'highlights', priority: 0,
      emoji: topGainer.emoji,
      itemId: topGainer.id,
      msg: `${topGainer.name} is your best performer at +${getGain(topGainer)}% gain.`,
    })
  }

  // Fastest Flip
  const withDates = soldItems.filter(i => i.dateSold && (i.datePurchased || i.createdAt))
  if (withDates.length > 0) {
    const fastestFlip = withDates.reduce((best, i) => {
      const days = Math.round((new Date(i.dateSold!).getTime() - new Date(i.datePurchased || i.createdAt).getTime()) / 86400000)
      const bestDays = Math.round((new Date(best.dateSold!).getTime() - new Date(best.datePurchased || best.createdAt).getTime()) / 86400000)
      return days < bestDays ? i : best
    })
    const fastestDays = Math.max(0, Math.round((new Date(fastestFlip.dateSold!).getTime() - new Date(fastestFlip.datePurchased || fastestFlip.createdAt).getTime()) / 86400000))
    const flipProfit = (fastestFlip.earnings || 0) - fastestFlip.cost
    a.push({
      id: id++, type: 'Fastest Flip', category: 'highlights', priority: 1,
      emoji: fastestFlip.emoji,
      itemId: fastestFlip.id,
      msg: `${fastestFlip.name} sold in ${fastestDays} day${fastestDays === 1 ? '' : 's'} for ${fmt(flipProfit)} profit.`,
    })
  }

  // Biggest Win
  if (soldItems.length > 0) {
    const biggestGain = soldItems.reduce((best, i) =>
      ((i.earnings || 0) - i.cost) > ((best.earnings || 0) - best.cost) ? i : best
    )
    const biggestAmt = (biggestGain.earnings || 0) - biggestGain.cost
    if (biggestAmt > 0) {
      a.push({
        id: id++, type: 'Biggest Win', category: 'highlights', priority: 2,
        emoji: biggestGain.emoji,
        itemId: biggestGain.id,
        msg: `${biggestGain.name} earned you +${fmt(biggestAmt)} (cost ${fmt(biggestGain.cost)}, sold ${fmt(biggestGain.earnings || 0)}).`,
      })
    }
  }

  // ==================== PRICING ====================

  activeItems.forEach(item => {
    const gain = getGain(item)
    const signal = signals?.get(item.id)

    // Strong Performer (>15% gain)
    if (gain > 15) {
      a.push({
        id: id++, type: 'Strong Performer', category: 'pricing', priority: 10,
        emoji: item.emoji, itemId: item.id,
        msg: `${item.name} is up ${gain}% from what you paid.`,
      })
    }

    // Below Cost (use eBay avg if available, otherwise item.value)
    const marketVal = signal?.ebayAvgPrice || item.value
    if (marketVal < item.cost && item.cost > 0) {
      const loss = Math.round(((item.cost - marketVal) / item.cost) * 100)
      a.push({
        id: id++, type: 'Below Cost', category: 'pricing', priority: 5,
        emoji: item.emoji, itemId: item.id,
        msg: `${item.name} market value is ${loss}% below what you paid${signal?.ebayAvgPrice ? ' (eBay avg)' : ''}.`,
      })
    }

    // Priced High (asking >20% above market)
    if (item.asking > 0 && marketVal > 0 && item.asking > marketVal * 1.2) {
      const pct = Math.round(((item.asking - marketVal) / marketVal) * 100)
      a.push({
        id: id++, type: 'Priced High', category: 'pricing', priority: 7,
        emoji: item.emoji, itemId: item.id,
        msg: `${item.name} asking is ${pct}% above market${signal?.ebayAvgPrice ? ' (eBay avg)' : ''}. May be hard to sell.`,
      })
    }

    // Underpriced (asking <90% of market)
    if (item.asking > 0 && marketVal > 0 && item.asking < marketVal * 0.9) {
      a.push({
        id: id++, type: 'Underpriced', category: 'pricing', priority: 6,
        emoji: item.emoji, itemId: item.id,
        msg: `${item.name} is listed below market value. You could ask for more.`,
      })
    }
  })

  // ==================== ACTION NEEDED ====================

  activeItems.forEach(item => {
    // Needs Comps
    if (!item.comps || item.comps.length === 0) {
      a.push({
        id: id++, type: 'Needs Comps', category: 'action', priority: 12,
        emoji: item.emoji, itemId: item.id,
        msg: `${item.name} has no comparable listings. Add comps for better valuation.`,
      })
    }

    // Set Market Value (value still equals cost)
    if (item.value === item.cost && item.asking !== item.cost) {
      a.push({
        id: id++, type: 'Set Market Value', category: 'action', priority: 13,
        emoji: item.emoji, itemId: item.id,
        msg: `${item.name} market value may need updating. It's still set to your cost.`,
      })
    }

    // Add Photo
    if (!item.photos || item.photos.length === 0) {
      a.push({
        id: id++, type: 'Add Photo', category: 'action', priority: 14,
        emoji: item.emoji, itemId: item.id,
        msg: `${item.name} has no photo. Items with photos get better valuations.`,
      })
    }
  })

  // ==================== ACTIVITY ====================

  activeItems.forEach(item => {
    if (item.createdAt) {
      const hoursSince = (now.getTime() - new Date(item.createdAt).getTime()) / 3600000
      if (hoursSince < 24) {
        a.push({
          id: id++, type: 'New Item Added', category: 'activity', priority: 20,
          emoji: item.emoji, itemId: item.id,
          msg: `${item.name} was added to your inventory.`,
        })
      }
    }
  })

  // ==================== INSIGHTS ====================

  // High concentration: one item >50% of portfolio
  if (activeItems.length >= 3 && totalValue > 0) {
    const highVal = activeItems.reduce((m, i) => (i.value || 0) > (m.value || 0) ? i : m)
    if (highVal.value / totalValue > 0.5) {
      a.push({
        id: id++, type: 'High Concentration', category: 'insights', priority: 15,
        emoji: highVal.emoji, itemId: highVal.id,
        msg: `${highVal.name} is ${Math.round(highVal.value / totalValue * 100)}% of your portfolio. Consider diversifying.`,
      })
    }
  }

  // Stale: not updated in 30+ days
  activeItems.forEach(item => {
    const updated = item.createdAt ? new Date(item.createdAt) : null
    if (updated) {
      const daysSince = Math.round((now.getTime() - updated.getTime()) / 86400000)
      if (daysSince > 30) {
        a.push({
          id: id++, type: 'Stale Item', category: 'insights', priority: 16,
          emoji: item.emoji, itemId: item.id,
          msg: `${item.name} hasn't been updated in ${daysSince} days. Refresh your valuation.`,
        })
      }
    }
  })

  // Ready to Sell: profitable, priced near market
  activeItems.forEach(item => {
    if (item.asking > 0 && item.value > item.cost && item.cost > 0 && item.value > 0) {
      if (Math.abs(item.asking - item.value) / item.value < 0.1) {
        a.push({
          id: id++, type: 'Ready to Sell', category: 'insights', priority: 11,
          emoji: item.emoji, itemId: item.id,
          msg: `${item.name} is priced near market value and profitable. Good time to list.`,
        })
      }
    }
  })

  // Sort by priority (lower = higher priority, negative = market signal urgency)
  a.sort((x, y) => x.priority - y.priority)
  return a
}
