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
  title: string
  price: number
  url?: string
  source?: string
  date?: string
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

export interface Alert {
  id: string
  type: 'price_drop' | 'price_spike' | 'no_comps' | 'stale_price' | 'watchlist_target'
  title: string
  message: string
  itemId?: string
  severity: 'info' | 'warning' | 'success'
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
