/**
 * Conviction Scoring Engine
 *
 * Calculates a Buy/Hold/Sell recommendation (0-100) from weighted signals.
 * Architecture: each signal returns 0-100, then we weight and combine.
 * New data sources plug in by adding to the signals array.
 */

import type { Item, Comp, MarketSignalData } from '@/types'

// --- Category depreciation curves ---
// How fast items typically lose value (months until 50% depreciation)
const DEPRECIATION_RATES: Record<string, number> = {
  'Electronics': 12,    // fast depreciation
  'Gaming': 14,
  'Automotive': 24,
  'Tools': 36,
  'Furniture': 36,
  'Sneakers': 18,       // depends on hype
  'Clothing': 18,
  'Bags': 48,           // luxury holds value
  'Watches': 60,        // appreciating asset class
  'Jewelry': 60,
  'Art': 120,           // long hold
  'Collectibles': 60,
  'Trading Cards': 36,
  'Vinyl': 48,
  'LEGO': 36,
  'Books': 48,
  'Toys': 24,
  'Sports': 24,
  'Vintage': 120,
  'Instruments': 48,
  'Other': 24,
}

export type ConvictionLevel = 'SELL' | 'HOLD' | 'BUY'

export interface ConvictionSignal {
  key: string
  label: string
  emoji: string
  score: number      // 0-100 (0 = strong sell, 50 = neutral, 100 = strong buy)
  weight: number     // 0-1
  reason: string
  available: boolean // false if no data for this signal
}

export interface ConvictionResult {
  score: number            // 0-100 weighted composite
  level: ConvictionLevel   // SELL / HOLD / BUY
  confidence: number       // 0-1 based on data availability
  headline: string         // one-liner explanation
  signals: ConvictionSignal[]
  dataPoints: number       // total data points used
}

// --- Signal: Price Velocity ---
function calcPriceVelocity(item: Item): ConvictionSignal {
  const history = item.priceHistory || []

  if (history.length < 2) {
    return {
      key: 'priceVelocity', label: 'Price Trend', emoji: '📈',
      score: 50, weight: 0.35, reason: 'Not enough history yet',
      available: false,
    }
  }

  // Calculate percentage change over available history
  const oldest = history[0].value
  const newest = history[history.length - 1].value

  if (oldest === 0) {
    return {
      key: 'priceVelocity', label: 'Price Trend', emoji: '📈',
      score: 50, weight: 0.35, reason: 'No baseline price',
      available: false,
    }
  }

  const changePct = ((newest - oldest) / oldest) * 100

  // Also check recent momentum (last 2 entries)
  const prev = history[history.length - 2].value
  const recentChange = prev > 0 ? ((newest - prev) / prev) * 100 : 0

  // Map to 0-100 score
  // -20% or worse = 0 (strong sell), 0% = 50 (neutral), +20% or better = 100 (strong buy)
  let score = Math.max(0, Math.min(100, 50 + (changePct * 2.5)))

  // Boost/penalize based on recent momentum
  if (recentChange > 5) score = Math.min(100, score + 10)
  if (recentChange < -5) score = Math.max(0, score - 10)

  const direction = changePct >= 0 ? 'up' : 'down'
  const reason = `${direction === 'up' ? '+' : ''}${changePct.toFixed(1)}% overall${
    history.length > 2 ? `, ${recentChange >= 0 ? '+' : ''}${recentChange.toFixed(1)}% recent` : ''
  }`

  return {
    key: 'priceVelocity', label: 'Price Trend', emoji: '📈',
    score: Math.round(score), weight: 0.35, reason,
    available: true,
  }
}

// --- Signal: Market Delta ---
// Now accepts optional live eBay prices for real market data
function calcMarketDelta(item: Item, marketSignal?: MarketSignalData): ConvictionSignal {
  const comps = item.comps || []
  const baseValue = item.value || item.cost

  if (baseValue <= 0) {
    return {
      key: 'marketDelta', label: 'Market Price', emoji: '🏪',
      score: 50, weight: 0.30, reason: 'Set a value first',
      available: false,
    }
  }

  // Merge all available price data: live eBay prices + user comps
  const allPrices: number[] = []

  // Live eBay prices (highest priority, real market data)
  if (marketSignal?.ebayPrices && marketSignal.ebayPrices.length > 0) {
    allPrices.push(...marketSignal.ebayPrices)
  }

  // User-added comps
  const compPrices = comps.filter(c => c.price > 0).map(c => c.price)
  allPrices.push(...compPrices)

  if (allPrices.length === 0) {
    return {
      key: 'marketDelta', label: 'Market Price', emoji: '🏪',
      score: 50, weight: 0.30, reason: 'No market data yet',
      available: false,
    }
  }

  const avgMarket = allPrices.reduce((s, p) => s + p, 0) / allPrices.length
  const delta = ((avgMarket - baseValue) / baseValue) * 100

  // If market avg is ABOVE your value, that's bullish (hold/buy more)
  // If market avg is BELOW your value, that's bearish (sell before it drops)
  let score = Math.max(0, Math.min(100, 50 + (delta * 2)))

  const direction = delta >= 0 ? 'above' : 'below'
  const source = marketSignal?.ebayPrices?.length
    ? `${allPrices.length} listings`
    : `${compPrices.length} comps`
  const reason = `Avg $${Math.round(avgMarket).toLocaleString()} (${
    delta >= 0 ? '+' : ''}${delta.toFixed(0)}% ${direction}) from ${source}`

  return {
    key: 'marketDelta', label: 'Market Price', emoji: '🏪',
    score: Math.round(score), weight: 0.30,
    reason,
    available: true,
  }
}

// --- Signal: ROI Position ---
function calcROIPosition(item: Item): ConvictionSignal {
  if (item.cost <= 0) {
    return {
      key: 'roiPosition', label: 'ROI', emoji: '💰',
      score: 50, weight: 0.15, reason: 'No cost recorded',
      available: false,
    }
  }

  const roi = ((item.value - item.cost) / item.cost) * 100

  // High ROI = consider taking profits (slightly bearish at extremes)
  // Negative ROI = hold unless trend is down
  // Moderate positive ROI = bullish
  let score: number
  if (roi > 100) {
    // Very high gains: take-profits territory, slightly bearish
    score = 40 + Math.max(0, (200 - roi) / 5) // peaks at 40, declines with extreme gains
  } else if (roi > 0) {
    // Positive ROI: bullish, but more so at moderate levels
    score = 55 + Math.min(30, roi / 3)
  } else {
    // Underwater: neutral to slightly bearish
    score = Math.max(20, 50 + roi / 2)
  }

  const reason = roi >= 0
    ? `+${roi.toFixed(0)}% gain${roi > 80 ? ' (consider taking profits)' : ''}`
    : `${roi.toFixed(0)}% loss`

  return {
    key: 'roiPosition', label: 'ROI', emoji: '💰',
    score: Math.round(score), weight: 0.15, reason,
    available: true,
  }
}

// --- Signal: Hold Duration ---
function calcHoldDuration(item: Item): ConvictionSignal {
  const purchaseDate = item.datePurchased || item.createdAt
  if (!purchaseDate) {
    return {
      key: 'holdDuration', label: 'Time Held', emoji: '⏱️',
      score: 50, weight: 0.10, reason: 'No date info',
      available: false,
    }
  }

  const daysHeld = Math.round(
    (Date.now() - new Date(purchaseDate).getTime()) / 86400000
  )
  const monthsHeld = daysHeld / 30

  // Category-specific depreciation curve
  const halfLife = DEPRECIATION_RATES[item.category] || 24

  // If item is approaching or past half-life in a depreciating category, bearish
  // Appreciating categories (watches, art) get more bullish over time
  const isAppreciating = halfLife >= 48

  let score: number
  if (isAppreciating) {
    // Longer hold = more likely to appreciate. Bullish.
    score = Math.min(80, 50 + monthsHeld * 1.5)
  } else {
    // Depreciating: sell pressure increases over time
    const depreciationRatio = monthsHeld / halfLife
    score = Math.max(15, 65 - depreciationRatio * 50)
  }

  const reason = daysHeld < 30
    ? `${daysHeld}d held (recently acquired)`
    : `${Math.round(monthsHeld)}mo held${isAppreciating ? ' (appreciating category)' : ''}`

  return {
    key: 'holdDuration', label: 'Time Held', emoji: '⏱️',
    score: Math.round(score), weight: 0.10, reason,
    available: true,
  }
}

// --- Signal: Social Trend (powered by Google Trends) ---
function calcSocialTrend(_item: Item, marketSignal?: MarketSignalData): ConvictionSignal {
  if (!marketSignal?.trendScore && marketSignal?.trendScore !== 0) {
    return {
      key: 'socialTrend', label: 'Trending', emoji: '🔥',
      score: 50, weight: 0.10, reason: 'Loading trend data...',
      available: false,
    }
  }

  const trendScore = marketSignal.trendScore
  const direction = marketSignal.trendDirection || 'stable'

  // Map Google Trends interest (0-100) to conviction score
  // High interest = more demand = bullish
  // Low interest = fading = bearish
  let score: number
  if (trendScore >= 75) {
    score = 80 + Math.min(20, (trendScore - 75))  // 80-100, very hot
  } else if (trendScore >= 50) {
    score = 55 + (trendScore - 50)                  // 55-80, solid interest
  } else if (trendScore >= 25) {
    score = 35 + (trendScore - 25) * 0.8            // 35-55, moderate
  } else {
    score = Math.max(10, 15 + trendScore * 0.8)     // 10-35, low interest
  }

  // Direction modifier
  if (direction === 'rising') score = Math.min(100, score + 8)
  if (direction === 'declining') score = Math.max(0, score - 8)

  const emoji = trendScore >= 60 ? '🔥' : trendScore >= 30 ? '📊' : '📉'
  const dirLabel = direction === 'rising' ? '↑' : direction === 'declining' ? '↓' : '→'
  const reason = `${trendScore}/100 interest ${dirLabel} ${
    trendScore >= 70 ? '(hot right now)' :
    trendScore >= 40 ? '(steady demand)' :
    '(low search volume)'
  }`

  return {
    key: 'socialTrend', label: 'Trending', emoji,
    score: Math.round(score), weight: 0.10, reason,
    available: true,
  }
}

// --- Main: Calculate Conviction ---
// marketSignal is optional: when provided, lights up eBay + Trends signals with real data
export function calculateConviction(item: Item, marketSignal?: MarketSignalData): ConvictionResult {
  const signals = [
    calcPriceVelocity(item),
    calcMarketDelta(item, marketSignal),
    calcROIPosition(item),
    calcHoldDuration(item),
    calcSocialTrend(item, marketSignal),
  ]

  // Calculate weighted score (only from available signals)
  const availableSignals = signals.filter(s => s.available)
  const unavailableWeight = signals.filter(s => !s.available).reduce((s, sig) => s + sig.weight, 0)

  let weightedScore: number
  if (availableSignals.length === 0) {
    weightedScore = 50 // pure neutral when no data
  } else {
    // Redistribute unavailable weight proportionally
    const totalAvailableWeight = availableSignals.reduce((s, sig) => s + sig.weight, 0)
    weightedScore = availableSignals.reduce((s, sig) => {
      const adjustedWeight = sig.weight / totalAvailableWeight
      return s + sig.score * adjustedWeight
    }, 0)
  }

  // Confidence based on data availability (0-1)
  const totalWeight = signals.reduce((s, sig) => s + sig.weight, 0)
  const availableWeight = availableSignals.reduce((s, sig) => s + sig.weight, 0)
  const confidence = availableWeight / totalWeight

  // Data points count
  const dataPoints = (item.priceHistory?.length || 0) + (item.comps?.length || 0) + (item.cost > 0 ? 1 : 0)

  // Map score to level
  const level: ConvictionLevel = weightedScore <= 35 ? 'SELL' : weightedScore >= 65 ? 'BUY' : 'HOLD'

  // Generate headline
  const headline = generateHeadline(level, signals, item, weightedScore)

  return {
    score: Math.round(weightedScore),
    level,
    confidence: Math.round(confidence * 100) / 100,
    headline,
    signals,
    dataPoints,
  }
}

function generateHeadline(
  level: ConvictionLevel,
  signals: ConvictionSignal[],
  item: Item,
  score: number
): string {
  const priceSignal = signals.find(s => s.key === 'priceVelocity')
  const marketSignal = signals.find(s => s.key === 'marketDelta')
  const roiSignal = signals.find(s => s.key === 'roiPosition')

  if (level === 'SELL') {
    if (priceSignal?.available && priceSignal.score < 30) {
      return 'Price trending down. Consider selling soon.'
    }
    if (roiSignal?.available && roiSignal.score < 35 && item.value < item.cost) {
      return 'Underwater on this one. Cut losses or wait for recovery.'
    }
    return 'Multiple signals suggest selling.'
  }

  if (level === 'BUY') {
    if (priceSignal?.available && priceSignal.score > 70) {
      return 'Strong upward trend. Good time to hold or buy more.'
    }
    if (marketSignal?.available && marketSignal.score > 70) {
      return 'Market prices are above your value. Room to grow.'
    }
    return 'Signals are bullish. Hold or accumulate.'
  }

  // HOLD
  if (signals.every(s => !s.available)) {
    return 'Add comps and track prices for a recommendation.'
  }
  if (score >= 55) {
    return 'Leaning positive. Hold and monitor.'
  }
  if (score <= 45) {
    return 'Mixed signals. Keep watching.'
  }
  return 'Stable position. No strong move either way.'
}

// --- Color helpers ---
export function getConvictionColor(level: ConvictionLevel): string {
  switch (level) {
    case 'SELL': return '#f87171'   // red-400
    case 'HOLD': return '#d4a574'   // amber-brand
    case 'BUY': return '#4ade80'    // green-400
  }
}

export function getScoreColor(score: number): string {
  if (score <= 35) return '#f87171'
  if (score >= 65) return '#4ade80'
  return '#d4a574'
}
