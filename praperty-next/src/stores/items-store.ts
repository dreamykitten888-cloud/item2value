import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Item, WatchlistItem, EbayListing, Comp, ResearchData } from '@/types'
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

  // eBay comps state
  ebayComps: EbayListing[]
  ebayLoading: boolean
  ebayError: string | null

  // Community comps state
  communityComps: Comp[]

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

  // eBay + community comps
  fetchEbayComps: (item: Item) => Promise<void>
  fetchCommunityComps: (itemName: string, itemBrand: string) => Promise<void>
  searchCommunityItems: (query: string, category?: string) => Promise<ResearchData>
  addCompToItem: (itemId: string, comp: Comp) => void
  deleteCompFromItem: (itemId: string, compId: number) => void
  recalcMarketFromComps: (itemId: string) => void
  clearEbayComps: () => void
  clearCommunityComps: () => void
}

export const useItemsStore = create<ItemsState>((set, get) => ({
  items: [],
  watchlist: [],
  loading: false,
  ebayComps: [],
  ebayLoading: false,
  ebayError: null,
  communityComps: [],

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

  // eBay Live Prices via Supabase edge function
  fetchEbayComps: async (item) => {
    if (!item) return
    set({ ebayLoading: true, ebayError: null })
    try {
      const seen = new Set<string>()
      const query = [item.name, item.brand, item.model].filter(Boolean).join(' ')
        .split(/\s+/).filter(w => {
          const l = w.toLowerCase()
          if (seen.has(l)) return false
          seen.add(l)
          return true
        }).join(' ')
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ebay-proxy?q=${encodeURIComponent(query)}&limit=6`
      )
      if (!res.ok) throw new Error('eBay search failed')
      const data = await res.json()
      set({ ebayComps: data.items || [] })
    } catch (e) {
      console.error('eBay search error:', e)
      set({ ebayError: 'Could not load eBay prices. Try again.', ebayComps: [] })
    }
    set({ ebayLoading: false })
  },

  // Community comps from other users
  fetchCommunityComps: async (itemName, itemBrand) => {
    try {
      const terms = [itemName, itemBrand].filter(Boolean)
      if (terms.length === 0) { set({ communityComps: [] }); return }
      let q = supabase.from('items').select('name, brand, comps, value, earnings')
      q = q.or(terms.map(t => `name.ilike.%${t}%`).join(','))
      q = q.limit(50)
      // @ts-ignore
      const { data, error } = await q
      if (error) throw error
      const allComps: Comp[] = []
      ;(data || []).forEach((it: Record<string, unknown>) => {
        const comps = parseJson(it.comps) as Comp[]
        comps.forEach(c => {
          if (c.price > 0) allComps.push({ ...c, source: c.source || 'Community' })
        })
      })
      // Dedupe
      const seen = new Set<string>()
      const unique = allComps.filter(c => {
        const key = (c.title + c.price).toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      set({ communityComps: unique })
    } catch (e) {
      console.error('Community comps error:', e)
      set({ communityComps: [] })
    }
  },

  // Search community items for research screen
  searchCommunityItems: async (query, category = 'All') => {
    try {
      let q = supabase.from('items').select('name, brand, model, category, condition, cost, asking, value, earnings, emoji, comps, date_sold, created_at')
      if (query && query.trim()) {
        q = q.or(`name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%`)
      }
      if (category && category !== 'All') q = q.eq('category', category)
      q = q.order('created_at', { ascending: false }).limit(100)
      // @ts-ignore
      const { data, error } = await q
      if (error) throw error
      interface CommunityRow {
        name: string; brand: string; model: string; category: string; condition: string
        cost: number; asking: number; value: number; earnings: number | null
        emoji: string; comps: Comp[]; date_sold: string | null; created_at: string
      }
      const results: CommunityRow[] = (data || []).map((it: Record<string, unknown>) => ({
        name: it.name as string,
        brand: it.brand as string,
        model: it.model as string,
        category: it.category as string,
        condition: it.condition as string,
        cost: Number(it.cost) || 0,
        asking: Number(it.asking) || 0,
        value: Number(it.value) || 0,
        earnings: it.earnings ? Number(it.earnings) : null,
        emoji: it.emoji as string,
        comps: parseJson(it.comps) as Comp[],
        date_sold: it.date_sold as string | null,
        created_at: it.created_at as string,
      }))

      const allPrices = results.map(r => r.value).filter(v => v > 0)
      const allCosts = results.map(r => r.cost).filter(v => v > 0)
      const allEarnings = results.filter(r => r.earnings && r.earnings > 0)
      const allComps = results.flatMap(r => (r.comps || []).filter(c => c.price > 0))

      const categorySet = new Set<string>()
      results.forEach(r => { if (r.category) categorySet.add(r.category) })

      return {
        listings: results.length,
        avgValue: allPrices.length > 0 ? Math.round(allPrices.reduce((s,v) => s+v,0) / allPrices.length) : 0,
        lowValue: allPrices.length > 0 ? Math.min(...allPrices) : 0,
        highValue: allPrices.length > 0 ? Math.max(...allPrices) : 0,
        avgCost: allCosts.length > 0 ? Math.round(allCosts.reduce((s,v) => s+v,0) / allCosts.length) : 0,
        soldCount: allEarnings.length,
        avgSold: allEarnings.length > 0 ? Math.round(allEarnings.reduce((s,e) => s + Number(e.earnings), 0) / allEarnings.length) : 0,
        totalComps: allComps.length,
        avgCompPrice: allComps.length > 0 ? Math.round(allComps.reduce((s, c) => s + c.price, 0) / allComps.length) : 0,
        recentComps: allComps.slice(0, 10),
        categories: Array.from(categorySet),
      } as ResearchData
    } catch (e) {
      console.error('Community search error:', e)
      return { listings: 0, avgValue: 0, lowValue: 0, highValue: 0, avgCost: 0, soldCount: 0, avgSold: 0, totalComps: 0, avgCompPrice: 0, recentComps: [], categories: [] }
    }
  },

  // Comp CRUD
  addCompToItem: (itemId, comp) => {
    set({ items: get().items.map(it =>
      it.id === itemId ? { ...it, comps: [...(it.comps || []), comp] } : it
    )})
    // Auto-recalc market value
    setTimeout(() => get().recalcMarketFromComps(itemId), 50)
  },

  deleteCompFromItem: (itemId, compId) => {
    set({ items: get().items.map(it =>
      it.id === itemId ? { ...it, comps: (it.comps || []).filter(c => c.id !== compId) } : it
    )})
    setTimeout(() => get().recalcMarketFromComps(itemId), 50)
  },

  recalcMarketFromComps: (itemId) => {
    set({ items: get().items.map(it => {
      if (it.id !== itemId) return it
      const comps = it.comps || []
      const prices = comps.map(c => c.price).filter(p => p > 0)
      if (prices.length === 0) return it
      const avg = Math.round(prices.reduce((s,p) => s+p, 0) / prices.length)
      const today = new Date().toISOString().slice(0, 10)
      const history = it.priceHistory || []
      const existing = history.findIndex(h => h.date === today)
      let newHistory
      if (existing >= 0) {
        newHistory = [...history]
        newHistory[existing] = { ...newHistory[existing], value: avg }
      } else {
        newHistory = [...history, { date: today, value: avg }]
      }
      return { ...it, value: avg, priceHistory: newHistory }
    })})
  },

  clearEbayComps: () => set({ ebayComps: [], ebayError: null }),
  clearCommunityComps: () => set({ communityComps: [] }),
}))
