// App-level types (what components actually use)

export interface Profile {
  name: string
  email: string
  createdAt: string
}

export interface Item {
  id: string
  name: string
  brand: string
  model: string
  category: string
  condition: string
  cost: number
  asking: number
  value: number
  earnings: number | null
  emoji: string
  notes: string
  datePurchased: string | null
  dateSold: string | null
  soldPlatform: string | null
  photos: string[]
  comps: Comp[]
  priceHistory: PriceSnapshot[]
  createdAt: string
}

export interface Comp {
  id?: number
  title: string
  price: number
  url?: string
  source?: string
  date?: string
  condition?: string
}

export interface EbayListing {
  id?: string
  title: string
  price: { value: number; currency?: string }
  image?: string
  itemUrl?: string
  condition?: string
  shippingCost?: number
  seller?: { feedbackPercent?: number }
}

export interface ResearchData {
  listings: number
  avgValue: number
  lowValue: number
  highValue: number
  avgCost: number
  soldCount: number
  avgSold: number
  totalComps: number
  avgCompPrice: number
  recentComps: Comp[]
  categories: string[]
}

export interface PriceSnapshot {
  date: string
  value: number
}

export interface WatchlistItem {
  id: string
  name: string
  category: string
  emoji: string
  brand: string
  model: string
  targetPrice: number
  lastKnownPrice: number
  priceHistory: PriceSnapshot[]
  addedAt: string
  linkedItemId: string | null
  notes: string
}

export type AlertType =
  | 'Top Gainer' | 'Fastest Flip' | 'Biggest Win'
  | 'Strong Performer' | 'Below Cost' | 'Priced High' | 'Underpriced'
  | 'Needs Comps' | 'Set Market Value' | 'Add Photo'
  | 'New Item Added'
  | 'High Concentration' | 'Stale Item' | 'Ready to Sell'
  | 'Price Surge' | 'Price Drop' | 'Sell Signal' | 'Buy Signal' | 'Market Hot'

export type AlertCategory = 'highlights' | 'pricing' | 'action' | 'activity' | 'insights'

export interface Alert {
  id: number
  type: AlertType
  category: AlertCategory
  msg: string
  emoji: string
  itemId?: string
  priority: number
}

export type Screen =
  | 'setup'
  | 'home'
  | 'inventory'
  | 'detail'
  | 'add-item'
  | 'edit-item'
  | 'scan'
  | 'discover'
  | 'research'
  | 'pricing'
  | 'sold-items'
  | 'alerts'
  | 'settings'
  | 'watchlist'

// Live market signal data from APIs (fed into conviction engine)
export interface MarketSignalData {
  // eBay active listing prices (sample, capped by API limit)
  ebayPrices?: number[]
  // Total active listings on eBay (real count from API, not capped)
  ebayTotalListings?: number
  // Google Trends interest score (0-100)
  trendScore?: number
  trendDirection?: 'rising' | 'stable' | 'declining'
  // Timestamp of when this data was fetched
  fetchedAt?: string
}

// eBay market intelligence (from /api/ebay-intelligence)
export interface MarketIntelData {
  market: {
    totalListings: number
    depth: { label: string; level: 'saturated' | 'healthy' | 'limited' | 'rare'; score: number }
    avgPrice: number | null
    medianPrice: number | null
    sampleSize: number
  }
  priceRange: {
    floor: number | null
    ceiling: number | null
    floorItems: EbayListing[]
    ceilingItems: EbayListing[]
  }
  conditionPricing: {
    userCondition: string
    ebayCondition: string
    conditionAvg: number | null
    conditionMedian: number | null
    conditionCount: number
    allConditionAvg: number | null
    premium: number | null
    breakdown: { condition: string; count: number; percent: number }[]
  }
  aspects: {
    topBrands: { value: string; count: number }[]
    all: { name: string; values: { value: string; count: number }[] }[]
  }
  categories: { name: string; id: string; count: number }[]
  /** Same sample of listings used for avg/median/range — so UI count and stats match. */
  liveListings: EbayListing[]
  fetchedAt: string
}

export type AuthMode = 'signin' | 'signup' | 'forgot'
