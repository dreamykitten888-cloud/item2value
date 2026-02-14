import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Item, WatchlistItem } from '@/types'
import type { Database } from '@/types/database'

// Helpers to parse JSON fields from DB
const parseJson = (val: unknown): any[] => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val)
    } catch {
      return []
    }
  }
  return Array.isArray(val) ? val : []
}

const mapRowToItem = (row: Record<string, unknown>): Item => ({
  id: row.id as string,
  name: row.name as string,
  brand: (row.brand as string) || '',
  model: (row.model as string) || '',
  category: (row.category as string) || 'Other',
  condition: (row.condition as string) || 'Good',
  cost: Number(row.cost) || 0,
  asking: Number(row.asking) || 0,
  value: Number(row.value) || 0,
  earnings: row.earnings ? Number(row.earnings) : null,
  emoji: (row.emoji as string) || '📦',
  notes: (row.notes as string) || '',
  datePurchased: (row.date_purchased as string) || null,
  dateSold: (row.date_sold as string) || null,
  soldPlatform: (row.sold_platform as string) || null,
  photos: parseJson(row.photos) as string[],
  comps: parseJson(row.comps) as Item['comps'],
  priceHistory: parseJson(row.price_history) as Item['priceHistory'],
  createdAt: row.created_at as string,
})

const mapRowToWatchlist = (row: Record<string, unknown>): WatchlistItem => ({
  id: row.id as string,
  name: row.name as string,
  category: (row.category as string) || '',
  emoji: (row.emoji as string) || '👀',
  brand: (row.brand as string) || '',
  model: (row.model as string) || '',
  targetPrice: Number(row.target_price) || 0,
  lastKnownPrice: Number(row.last_known_price) || 0,
  priceHistory: parseJson(row.price_history) as WatchlistItem['priceHistory'],
  addedAt: (row.added_at as string) || '',
  linkedItemId: (row.linked_item_id as string) || null,
})

interface ItemsState {
  items: Item[]
  watchlist: WatchlistItem[]
  loading: boolean

  // Actions
  loadAll: (profileId: string) => Promise<void>
  syncItem: (item: Item, profileId: string) => Promise<void>
  syncAllItems: (items: Item[], profileId: string) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  syncWatchlistItem: (item: WatchlistItem, profileId: string) => Promise<void>
  deleteWatchlistItem: (itemId: string) => Promise<void>
  setItems: (items: Item[]) => void
  setWatchlist: (watchlist: WatchlistItem[]) => void
  addItem: (item: Item) => void
  updateItem: (id: string, updates: Partial<Item>) => void
  removeItem: (id: string) => void
}

export const useItemsStore = create<ItemsState>((set, get) => ({
  items: [],
  watchlist: [],
  loading: false,

  loadAll: async (profileId) => {
    set({ loading: true })
    try {
      const [itemsRes, watchlistRes] = await Promise.all([
        supabase.from('items').select('*').eq('user_id', profileId).order('created_at', { ascending: false }),
        supabase.from('watchlist').select('*').eq('user_id', profileId).order('created_at', { ascending: false }),
      ])
      const items = (itemsRes.data || []).map(mapRowToItem)
      const watchlist = (watchlistRes.data || []).map(mapRowToWatchlist)
      set({ items, watchlist })
    } catch (e) {
      console.error('Load data error:', e)
    }
    set({ loading: false })
  },

  syncItem: async (item, profileId) => {
    if (!profileId) return
    try {
      const row: Database['public']['Tables']['items']['Insert'] = {
        id: item.id,
        user_id: profileId,
        name: item.name,
        brand: item.brand || '',
        model: item.model || '',
        category: item.category || 'Other',
        condition: item.condition || 'Good',
        cost: item.cost || 0,
        asking: item.asking || 0,
        value: item.value || 0,
        earnings: item.earnings || null,
        emoji: item.emoji || '📦',
        notes: item.notes || '',
        date_purchased: item.datePurchased || null,
        date_sold: item.dateSold || null,
        sold_platform: item.soldPlatform || null,
        photos: JSON.stringify(item.photos || []),
        comps: JSON.stringify(item.comps || []),
        price_history: JSON.stringify(item.priceHistory || []),
      }
      // @ts-ignore - Supabase type inference issue
      await supabase.from('items').upsert(row, { onConflict: 'id' })
    } catch (e) {
      console.error('Sync item error:', e)
    }
  },

  syncAllItems: async (items, profileId) => {
    if (!profileId || items.length === 0) return
    try {
      const rows: Database['public']['Tables']['items']['Insert'][] = items.map(item => ({
        id: item.id,
        user_id: profileId,
        name: item.name,
        brand: item.brand || '',
        model: item.model || '',
        category: item.category || 'Other',
        condition: item.condition || 'Good',
        cost: item.cost || 0,
        asking: item.asking || 0,
        value: item.value || 0,
        earnings: item.earnings || null,
        emoji: item.emoji || '📦',
        notes: item.notes || '',
        date_purchased: item.datePurchased || null,
        date_sold: item.dateSold || null,
        sold_platform: item.soldPlatform || null,
        photos: JSON.stringify(item.photos || []),
        comps: JSON.stringify(item.comps || []),
        price_history: JSON.stringify(item.priceHistory || []),
      }))
      // @ts-ignore - Supabase type inference issue
      await supabase.from('items').upsert(rows, { onConflict: 'id' })
    } catch (e) {
      console.error('Bulk sync error:', e)
    }
  },

  deleteItem: async (itemId) => {
    try {
      await supabase.from('items').delete().eq('id', itemId)
      set({ items: get().items.filter(i => i.id !== itemId) })
    } catch (e) {
      console.error('Delete item error:', e)
    }
  },

  syncWatchlistItem: async (item, profileId) => {
    if (!profileId) return
    try {
      const row: Database['public']['Tables']['watchlist']['Insert'] = {
        id: item.id,
        user_id: profileId,
        name: item.name,
        category: item.category || '',
        emoji: item.emoji || '👀',
        brand: item.brand || '',
        model: item.model || '',
        target_price: item.targetPrice || 0,
        last_known_price: item.lastKnownPrice || 0,
        price_history: JSON.stringify(item.priceHistory || []),
        added_at: item.addedAt || new Date().toISOString(),
        linked_item_id: item.linkedItemId || null,
      }
      // @ts-ignore - Supabase type inference issue
      await supabase.from('watchlist').upsert(row, { onConflict: 'id' })
    } catch (e) {
      console.error('Sync watchlist error:', e)
    }
  },

  deleteWatchlistItem: async (itemId) => {
    try {
      await supabase.from('watchlist').delete().eq('id', itemId)
      set({ watchlist: get().watchlist.filter(w => w.id !== itemId) })
    } catch (e) {
      console.error('Delete watchlist error:', e)
    }
  },

  setItems: (items) => set({ items }),
  setWatchlist: (watchlist) => set({ watchlist }),
  addItem: (item) => set({ items: [item, ...get().items] }),
  updateItem: (id, updates) =>
    set({ items: get().items.map(i => (i.id === id ? { ...i, ...updates } : i)) }),
  removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),
}))
