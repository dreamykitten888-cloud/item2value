/**
 * Conviction Scoring Engine v2
 *
 * Two modes:
 *   'owned'  — for items in your inventory (default). Uses ROI, hold duration, price history.
 *   'browse' — for watchlist, discover, research. Replaces ROI/hold with
 *              Market Liquidity and Deal Quality since you don't own these yet.
 *
 * Architecture: each signal returns 0-100, then we weight and combine.
 */

import type { Item, MarketSignalData } from '@/types'

export type ConvictionMode = 'owned' | 'browse'

// --- Category depreciation curves ---
const DEPRECIATION_RATES: Record<string, number> = {
  'Electronics': 12,
  'Gaming': 14,
  'Automotive': 24,
  'Tools': 36,
  'Furniture': 36,
  'Sneakers': 18,
  'Clothing': 18,
  'Bags': 48,
  'Watches': 60,
  'Jewelry': 60,
  'Art': 120,
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
  score: number      // 0-100 (0 = strong sell/skip, 50 = neutral, 100 = strong buy)
  weight: number     // 0-1
  reason: string
  available: boolean // false if no data for this signal
}

export interface ConvictionResult {
  score: number
  level: ConvictionLevel
  confidence: number       // 0-1
  headline: string
  signals: ConvictionSignal[]
  dataPoints: number
  mode: ConvictionMode
}

// =========================================================================
//  SHARED SIGNALS (used in both modes)
// =========================================================================

// --- Price Velocity (price history trend) ---
function calcPriceVelocity(item: Item, mode: ConvictionMode): ConvictionSignal {
  const history = item.priceHistory || []

  if (history.length < 2) {
    return {
      key: 'priceVelocity', label: 'Price Trend', emoji: '📈',
      score: 50, weight: mode === 'owned' ? 0.35 : 0.25,
      reason: mode === 'browse' ? 'No price history available' : 'Not enough history yet',
      available: false,
    }
  }

  const oldest = history[0].value
  const newest = history[history.length - 1].value

  if (oldest === 0) {
    return {
      key: 'priceVelocity', label: 'Price Trend', emoji: '📈',
      score: 50, weight: mode === 'owned' ? 0.35 : 0.25,
      reason: 'No baseline price',
      available: false,
    }
  }

  const changePct = ((newest - oldest) / oldest) * 100
  const prev = history[history.length - 2].value
  const recentChange = prev > 0 ? ((newest - prev) / prev) * 100 : 0

  let score = Math.max(0, Math.min(100, 50 + (changePct * 2.5)))
  if (recentChange > 5) score = Math.min(100, score + 10)
  if (recentChange < -5) score = Math.max(0, score - 10)

  const direction = changePct >= 0 ? 'up' : 'down'
  const reason = `${direction === 'up' ? '+' : ''}${changePct.toFixed(1)}% overall${
    history.length > 2 ? `, ${recentChange >= 0 ? '+' : ''}${recentChange.toFixed(1)}% recent` : ''
  }`

  return {
    key: 'priceVelocity', label: 'Price Trend', emoji: '📈',
    score: Math.round(score), weight: mode === 'owned' ? 0.35 : 0.25, reason,
    available: true,
  }
}

// --- Social Trend (Google Trends) ---
function calcSocialTrend(_item: Item, marketSignal?: MarketSignalData, mode: ConvictionMode = 'owned'): ConvictionSignal {
  if (!marketSignal?.trendScore && marketSignal?.trendScore !== 0) {
    return {
      key: 'socialTrend', label: 'Search Interest', emoji: '🔥',
      score: 50, weight: mode === 'owned' ? 0.10 : 0.20,
      reason: 'Trend data unavailable',
      available: false,
    }
  }

  const trendScore = marketSignal.trendScore
  const direction = marketSignal.trendDirection || 'stable'

  let score: number
  if (trendScore >= 75) {
    score = 80 + Math.min(20, (trendScore - 75))
  } else if (trendScore >= 50) {
    score = 55 + (trendScore - 50)
  } else if (trendScore >= 25) {
    score = 35 + (trendScore - 25) * 0.8
  } else {
    score = Math.max(10, 15 + trendScore * 0.8)
  }

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
    key: 'socialTrend', label: 'Search Interest', emoji,
    score: Math.round(score), weight: mode === 'owned' ? 0.10 : 0.20, reason,
    available: true,
  }
}

// =========================================================================
//  OWNED-ONLY SIGNALS
// =========================================================================

// --- Market Delta (your value vs market avg) ---
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

  const allPrices: number[] = []
  if (marketSignal?.ebayPrices && marketSignal.ebayPrices.length > 0) {
    allPrices.push(...marketSignal.ebayPrices)
  }
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
  let score = Math.max(0, Math.min(100, 50 + (delta * 2)))

  const direction = delta >= 0 ? 'above' : 'below'
  const source = marketSignal?.ebayPrices?.length
    ? `${allPrices.length} listings`
    : `${compPrices.length} comps`
  const reason = `Avg $${Math.round(avgMarket).toLocaleString()} (${
    delta >= 0 ? '+' : ''}${delta.toFixed(0)}% ${direction}) from ${source}`

  return {
    key: 'marketDelta', label: 'Market Price', emoji: '🏪',
    score: Math.round(score), weight: 0.30, reason,
    available: true,
  }
}

// --- ROI Position ---
function calcROIPosition(item: Item): ConvictionSignal {
  if (item.cost <= 0) {
    return {
      key: 'roiPosition', label: 'ROI', emoji: '💰',
      score: 50, weight: 0.15, reason: 'No cost recorded',
      available: false,
    }
  }

  const roi = ((item.value - item.cost) / item.cost) * 100

  let score: number
  if (roi > 100) {
    score = 40 + Math.max(0, (200 - roi) / 5)
  } else if (roi > 0) {
    score = 55 + Math.min(30, roi / 3)
  } else {
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

// --- Hold Duration ---
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
  const halfLife = DEPRECIATION_RATES[item.category] || 24
  const isAppreciating = halfLife >= 48

  let score: number
  if (isAppreciating) {
    score = Math.min(80, 50 + monthsHeld * 1.5)
  } else {
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

// =========================================================================
//  BROWSE-ONLY SIGNALS (replace ROI + Hold Duration)
// =========================================================================

// --- Flip Speed: how easy is this to flip? ---
// Combines: market depth (supply), search demand (Google Trends), price consistency
// More listings + high demand + tight pricing = easy flip
function calcFlipSpeed(item: Item, marketSignal?: MarketSignalData): ConvictionSignal {
  const ebayPrices = marketSignal?.ebayPrices || []
  const compCount = (item.comps || []).filter(c => c.price > 0).length
  const listingCount = ebayPrices.length + compCount

  if (listingCount === 0) {
    return {
      key: 'flipSpeed', label: 'Flip Speed', emoji: '⚡',
      score: 50, weight: 0.25, reason: 'No market data to assess',
      available: false,
    }
  }

  // --- Signal 1: Market Depth (40% of score) ---
  // More active listings = more buyers + sellers = faster turnover
  let depthScore: number
  if (listingCount >= 10) depthScore = 90       // Deep market
  else if (listingCount >= 6) depthScore = 70    // Healthy market
  else if (listingCount >= 3) depthScore = 50    // Moderate
  else depthScore = 25                           // Thin, may sit

  // --- Signal 2: Search Demand via Google Trends (35% of score) ---
  const trendScore = marketSignal?.trendScore ?? 50  // 0-100 from Google
  const trendDirection = marketSignal?.trendDirection
  let demandScore = trendScore  // Direct mapping: higher trend = more buyers
  if (trendDirection === 'rising') demandScore = Math.min(100, demandScore + 10)
  if (trendDirection === 'declining') demandScore = Math.max(0, demandScore - 10)

  // --- Signal 3: Price Consistency (25% of score) ---
  // Tight price spread = competitive market = predictable sale price = easier to flip
  // Wide spread = uncertain market = harder to price = may sit
  let consistencyScore = 50
  if (ebayPrices.length >= 3) {
    const sorted = [...ebayPrices].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    if (median > 0) {
      // Coefficient of variation: std dev / mean (lower = tighter prices)
      const mean = sorted.reduce((s, p) => s + p, 0) / sorted.length
      const variance = sorted.reduce((s, p) => s + (p - mean) ** 2, 0) / sorted.length
      const cv = Math.sqrt(variance) / mean  // 0 = identical prices, 1+ = wild spread
      if (cv < 0.15) consistencyScore = 90       // Very tight: <15% variation
      else if (cv < 0.3) consistencyScore = 70    // Reasonable: 15-30%
      else if (cv < 0.5) consistencyScore = 50    // Moderate: 30-50%
      else consistencyScore = 25                   // Wild spread: >50% variation
    }
  }

  // Weighted combination
  const score = Math.max(10, Math.min(95, Math.round(
    depthScore * 0.4 + demandScore * 0.35 + consistencyScore * 0.25
  )))

  const label =
    score >= 80 ? 'Easy flip' :
    score >= 65 ? 'Solid flip' :
    score >= 45 ? 'Doable' :
    score >= 30 ? 'Slow flip' :
    'Hard to move'

  // Build transparent reason
  const parts: string[] = []
  parts.push(`${listingCount} listings`)
  if (marketSignal?.trendScore != null) {
    parts.push(`${Math.round(demandScore)}% search interest`)
  }
  if (ebayPrices.length >= 3) {
    parts.push(consistencyScore >= 70 ? 'tight pricing' : consistencyScore >= 50 ? 'moderate spread' : 'wide price spread')
  }

  return {
    key: 'flipSpeed', label: 'Flip Speed', emoji: '⚡',
    score, weight: 0.25, reason: parts.join(', '),
    available: true,
  }
}

// --- Deal Quality: is the current price a good buy? ---
function calcDealQuality(item: Item, marketSignal?: MarketSignalData): ConvictionSignal {
  const ebayPrices = marketSignal?.ebayPrices || []
  const compPrices = (item.comps || []).filter(c => c.price > 0).map(c => c.price)
  const allPrices = [...ebayPrices, ...compPrices]

  const askingPrice = item.value || item.cost || item.asking || 0

  if (allPrices.length === 0) {
    // No market data, but we can still assess based on category
    return {
      key: 'dealQuality', label: 'Deal Quality', emoji: '🎯',
      score: 50, weight: 0.30,
      reason: 'Need market prices to assess',
      available: false,
    }
  }

  const avgMarket = allPrices.reduce((s, p) => s + p, 0) / allPrices.length
  const sorted = [...allPrices].sort((a, b) => a - b)
  const lowestPrice = sorted[0]
  const medianPrice = sorted[Math.floor(sorted.length / 2)]

  // If we have an asking price, compare it to market
  if (askingPrice > 0) {
    const vsAvg = ((avgMarket - askingPrice) / askingPrice) * 100

    let score: number
    if (vsAvg > 30) {
      score = 90 // Way below market, great deal
    } else if (vsAvg > 15) {
      score = 75 // Good deal
    } else if (vsAvg > 0) {
      score = 60 // Slight discount
    } else if (vsAvg > -15) {
      score = 45 // Slightly overpriced
    } else {
      score = 25 // Overpriced
    }

    const reason = vsAvg >= 0
      ? `$${Math.round(askingPrice)} is ${Math.abs(Math.round(vsAvg))}% below avg ($${Math.round(avgMarket)})`
      : `$${Math.round(askingPrice)} is ${Math.abs(Math.round(vsAvg))}% above avg ($${Math.round(avgMarket)})`

    return {
      key: 'dealQuality', label: 'Deal Quality', emoji: '🎯',
      score: Math.round(score), weight: 0.30, reason,
      available: true,
    }
  }

  // No asking price: just show the market range as context
  const spread = allPrices.length >= 3
    ? Math.round(((sorted[sorted.length - 1] - sorted[0]) / avgMarket) * 100)
    : null

  const reason = `Avg $${Math.round(avgMarket)}, low $${Math.round(lowestPrice)}${
    spread !== null ? `, ${spread}% spread` : ''}`

  // Tighter spread = more predictable pricing = slightly bullish
  let score = 55
  if (spread !== null && spread < 20) score = 65
  if (spread !== null && spread > 60) score = 40

  return {
    key: 'dealQuality', label: 'Market Range', emoji: '🎯',
    score: Math.round(score), weight: 0.30, reason,
    available: true,
  }
}

// =========================================================================
//  MAIN ENTRY POINT
// =========================================================================

export function calculateConviction(
  item: Item,
  marketSignal?: MarketSignalData,
  mode: ConvictionMode = 'owned'
): ConvictionResult {

  let signals: ConvictionSignal[]

  if (mode === 'browse') {
    // Browse mode: signals that make sense when evaluating a potential purchase
    // Weights: Deal Quality 30%, Liquidity 25%, Price Trend 25%, Search Interest 20%
    signals = [
      calcDealQuality(item, marketSignal),
      calcFlipSpeed(item, marketSignal),
      calcPriceVelocity(item, mode),
      calcSocialTrend(item, marketSignal, mode),
    ]
  } else {
    // Owned mode: signals for items you already have
    // Weights: Price Trend 35%, Market Delta 30%, ROI 15%, Hold Duration 10%, Trending 10%
    signals = [
      calcPriceVelocity(item, mode),
      calcMarketDelta(item, marketSignal),
      calcROIPosition(item),
      calcHoldDuration(item),
      calcSocialTrend(item, marketSignal, mode),
    ]
  }

  // Calculate weighted score (only from available signals)
  const availableSignals = signals.filter(s => s.available)

  let weightedScore: number
  if (availableSignals.length === 0) {
    weightedScore = 50
  } else {
    const totalAvailableWeight = availableSignals.reduce((s, sig) => s + sig.weight, 0)
    weightedScore = availableSignals.reduce((s, sig) => {
      const adjustedWeight = sig.weight / totalAvailableWeight
      return s + sig.score * adjustedWeight
    }, 0)
  }

  // Confidence based on data availability
  const totalWeight = signals.reduce((s, sig) => s + sig.weight, 0)
  const availableWeight = availableSignals.reduce((s, sig) => s + sig.weight, 0)
  const confidence = availableWeight / totalWeight

  const dataPoints = (item.priceHistory?.length || 0) +
    (item.comps?.length || 0) +
    (marketSignal?.ebayPrices?.length || 0) +
    (item.cost > 0 ? 1 : 0)

  // In browse mode: BUY means "worth buying", SELL means "skip this"
  const level: ConvictionLevel = weightedScore <= 35 ? 'SELL' : weightedScore >= 65 ? 'BUY' : 'HOLD'

  const headline = mode === 'browse'
    ? generateBrowseHeadline(level, signals, weightedScore)
    : generateOwnedHeadline(level, signals, item, weightedScore)

  return {
    score: Math.round(weightedScore),
    level,
    confidence: Math.round(confidence * 100) / 100,
    headline,
    signals,
    dataPoints,
    mode,
  }
}

// --- Headlines ---

function generateBrowseHeadline(
  level: ConvictionLevel,
  signals: ConvictionSignal[],
  score: number
): string {
  const deal = signals.find(s => s.key === 'dealQuality')
  const liquidity = signals.find(s => s.key === 'liquidity')
  const trend = signals.find(s => s.key === 'socialTrend')

  if (level === 'BUY') {
    if (deal?.available && deal.score >= 75) return 'Good deal. Market prices support this buy.'
    if (trend?.available && trend.score >= 75) return 'Trending up. High demand right now.'
    if (liquidity?.available && liquidity.score >= 75) return 'Easy flip. Lots of buyers in this market.'
    return 'Signals look good for buying.'
  }

  if (level === 'SELL') {
    if (deal?.available && deal.score < 35) return 'Overpriced vs market. Wait for a better deal.'
    if (liquidity?.available && liquidity.score < 35) return 'Thin market. Could be hard to resell.'
    return 'Not a great buy at current prices.'
  }

  // HOLD
  if (signals.every(s => !s.available)) return 'Need more market data to assess.'
  if (score >= 55) return 'Decent opportunity. Do your research.'
  if (score <= 45) return 'Proceed with caution.'
  return 'Fair price. Not a steal, not a rip-off.'
}

function generateOwnedHeadline(
  level: ConvictionLevel,
  signals: ConvictionSignal[],
  item: Item,
  score: number
): string {
  const priceSignal = signals.find(s => s.key === 'priceVelocity')
  const marketSignal = signals.find(s => s.key === 'marketDelta')
  const roiSignal = signals.find(s => s.key === 'roiPosition')

  if (level === 'SELL') {
    if (priceSignal?.available && priceSignal.score < 30) return 'Price trending down. Consider selling soon.'
    if (roiSignal?.available && roiSignal.score < 35 && item.value < item.cost) return 'Underwater on this one. Cut losses or wait for recovery.'
    return 'Multiple signals suggest selling.'
  }

  if (level === 'BUY') {
    if (priceSignal?.available && priceSignal.score > 70) return 'Strong upward trend. Good time to hold or buy more.'
    if (marketSignal?.available && marketSignal.score > 70) return 'Market prices are above your value. Room to grow.'
    return 'Signals are bullish. Hold or accumulate.'
  }

  if (signals.every(s => !s.available)) return 'Add comps and track prices for a recommendation.'
  if (score >= 55) return 'Leaning positive. Hold and monitor.'
  if (score <= 45) return 'Mixed signals. Keep watching.'
  return 'Stable position. No strong move either way.'
}

// --- Color helpers ---
export function getConvictionColor(level: ConvictionLevel): string {
  switch (level) {
    case 'SELL': return '#f87171'
    case 'HOLD': return '#d4a574'
    case 'BUY': return '#4ade80'
  }
}

export function getScoreColor(score: number): string {
  if (score <= 35) return '#f87171'
  if (score >= 65) return '#4ade80'
  return '#d4a574'
}
