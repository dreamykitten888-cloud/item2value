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
}

export type AlertType =
  | 'Top Gainer' | 'Fastest Flip' | 'Biggest Win'
  | 'Strong Performer' | 'Below Cost' | 'Priced High' | 'Underpriced'
  | 'Needs Comps' | 'Set Market Value' | 'Add Photo'
  | 'New Item Added'
  | 'High Concentration' | 'Stale Item' | 'Ready to Sell'

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

export type AuthMode = 'signin' | 'signup' | 'forgot'
