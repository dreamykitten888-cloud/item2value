import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Item, WatchlistItem, EbayListing, Comp, ResearchData, MarketSignalData, MarketIntelData } from '@/types'
import type { Database } from '@/types/database'

// Helpers to parse JSON fields from DB
// Build a smart eBay search query: dedupe words, cap at 6 words max
// Overly specific queries return zero results on eBay
function buildSmartQuery(item: { name?: string; brand?: string; model?: string }): string {
  const seen = new Set<string>()
  const words = [item.name, item.brand, item.model]
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter(w => {
      const l = w.toLowerCase()
      if (seen.has(l) || l.length < 2) return false
      seen.add(l)
      return true
    })
  // Cap at 6 words: eBay search works best with concise queries
  return words.slice(0, 6).join(' ')
}

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
  notes: (row.notes as string) || '',
})

// Stored market signal from Supabase (background-refreshed)
export interface StoredSignal {
  itemId: string
  ebayAvgPrice: number
  ebayListingCount: number
  trendScore: number
  trendDirection: string
  convictionScore: number
  convictionLevel: string
  convictionHeadline: string
  priceChangePct: number
  priceChangeAbs: number
  fetchedAt: string
}

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

  // Market signal state (live eBay + Trends for conviction engine)
  marketSignal: MarketSignalData | null
  marketSignalLoading: boolean

  // Market intelligence (enriched eBay data)
  marketIntel: MarketIntelData | null
  marketIntelLoading: boolean

  // Stored signals (background-refreshed, for home screen + alerts)
  storedSignals: Map<string, StoredSignal>
  signalsLoading: boolean
  signalsLastRefresh: string | null

  // Actions
  loadAll: (profileId: string) => Promise<void>
  syncItem: (item: Item, profileId: string) => Promise<void>
  syncAllItems: (items: Item[], profileId: string) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  syncWatchlistItem: (item: WatchlistItem, profileId: string) => Promise<void>
  updateWatchlistItem: (id: string, updates: Partial<WatchlistItem>) => void
  deleteWatchlistItem: (itemId: string) => Promise<void>
  setItems: (items: Item[]) => void
  setWatchlist: (watchlist: WatchlistItem[]) => void
  addItem: (item: Item) => void
  updateItem: (id: string, updates: Partial<Item>) => void
  removeItem: (id: string) => void

  // Market signal (conviction engine data)
  fetchMarketSignal: (item: Item) => Promise<void>
  clearMarketSignal: () => void

  // Market intelligence (enriched eBay analytics)
  fetchMarketIntel: (item: Item) => Promise<void>
  clearMarketIntel: () => void

  // Stored signals (background batch)
  loadStoredSignals: (profileId: string) => Promise<void>
  refreshAllSignals: (profileId: string) => Promise<void>

  // Watchlist price refresh (client-side)
  refreshWatchlistPrices: (profileId: string) => Promise<void>

  // eBay + community comps
  fetchEbayComps: (item: Item) => Promise<void>
  fetchCommunityComps: (itemName: string, itemBrand: string) => Promise<void>
  searchCommunityItems: (query: string, category?: string) => Promise<ResearchData>
  addCompToItem: (itemId: string, comp: Comp) => Item | undefined
  deleteCompFromItem: (itemId: string, compId: number) => Item | undefined
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
  marketSignal: null,
  marketSignalLoading: false,
  marketIntel: null,
  marketIntelLoading: false,
  storedSignals: new Map(),
  signalsLoading: false,
  signalsLastRefresh: null,

  loadAll: async (profileId) => {
    console.log('[items] loadAll: starting with profileId:', profileId)
    set({ loading: true })
    try {
      const [itemsRes, watchlistRes] = await Promise.all([
        supabase.from('items').select('*').eq('user_id', profileId).order('created_at', { ascending: false }),
        supabase.from('watchlist').select('*').eq('user_id', profileId).order('created_at', { ascending: false }),
      ])
      console.log('[items] loadAll: items result:', itemsRes.data?.length || 0, 'items, error:', itemsRes.error?.message || 'none')
      console.log('[items] loadAll: watchlist result:', watchlistRes.data?.length || 0, 'items, error:', watchlistRes.error?.message || 'none')
      // CRITICAL: Don't wipe local state if Supabase returns an error
      // Only update items if we got a successful response (data is not null)
      if (itemsRes.data) {
        const items = itemsRes.data.map(mapRowToItem)
        set({ items })
      } else if (itemsRes.error) {
        console.error('[items] loadAll: Supabase items error, keeping local state:', itemsRes.error.message)
      }
      if (watchlistRes.data) {
        const watchlist = watchlistRes.data.map(mapRowToWatchlist)
        set({ watchlist })
      } else if (watchlistRes.error) {
        console.error('[items] loadAll: Supabase watchlist error, keeping local state:', watchlistRes.error.message)
      }
    } catch (e) {
      console.error('[items] loadAll error:', e)
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
        notes: item.notes || '',
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

  updateWatchlistItem: (id, updates) =>
    set({ watchlist: get().watchlist.map(w => (w.id === id ? { ...w, ...updates } : w)) }),

  setItems: (items) => set({ items }),
  setWatchlist: (watchlist) => set({ watchlist }),
  addItem: (item) => set({ items: [item, ...get().items] }),
  updateItem: (id, updates) =>
    set({ items: get().items.map(i => (i.id === id ? { ...i, ...updates } : i)) }),
  removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),

  // Market signal for conviction engine (eBay prices + Google Trends)
  fetchMarketSignal: async (item) => {
    if (!item) return
    set({ marketSignalLoading: true })
    try {
      const query = buildSmartQuery(item)
      const res = await fetch(
        `/api/market-signal?q=${encodeURIComponent(query)}&category=${encodeURIComponent(item.category || '')}`
      )
      if (!res.ok) throw new Error(`Market signal error: ${res.status}`)
      const data: MarketSignalData = await res.json()

      // If eBay returned no prices, retry with a shorter query (just item name)
      if ((data.ebayPrices?.length || 0) === 0 && item.name) {
        const shortQuery = item.name.split(/\s+/).slice(0, 4).join(' ')
        if (shortQuery !== query) {
          console.log('[market-signal] Retrying with shorter query:', shortQuery)
          const retry = await fetch(
            `/api/market-signal?q=${encodeURIComponent(shortQuery)}&category=${encodeURIComponent(item.category || '')}`
          )
          if (retry.ok) {
            const retryData: MarketSignalData = await retry.json()
            if ((retryData.ebayPrices?.length || 0) > 0) {
              set({ marketSignal: retryData })
              set({ marketSignalLoading: false })
              return
            }
          }
        }
      }

      set({ marketSignal: data })
    } catch (e) {
      console.error('[market-signal] fetch error:', e)
      set({ marketSignal: null })
    }
    set({ marketSignalLoading: false })
  },

  clearMarketSignal: () => set({ marketSignal: null, marketSignalLoading: false }),

  // Market intelligence (enriched eBay analytics)
  fetchMarketIntel: async (item) => {
    if (!item) return
    set({ marketIntelLoading: true })
    try {
      const query = buildSmartQuery(item)
      const params = new URLSearchParams({ q: query })
      if (item.condition) params.set('condition', item.condition)
      const res = await fetch(`/api/ebay-intelligence?${params}`, { signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`Intel fetch failed: ${res.status}`)
      const data = await res.json()

      // If we got zero results, retry with shorter query
      if ((!data.market || data.market.totalListings === 0) && item.name) {
        const shortQuery = item.name.split(/\s+/).slice(0, 4).join(' ')
        if (shortQuery !== query) {
          console.log('[market-intel] Retrying with shorter query:', shortQuery)
          const retryParams = new URLSearchParams({ q: shortQuery })
          if (item.condition) retryParams.set('condition', item.condition)
          const retry = await fetch(`/api/ebay-intelligence?${retryParams}`, { signal: AbortSignal.timeout(20000) })
          if (retry.ok) {
            const retryData = await retry.json()
            if (retryData.market?.totalListings > 0) {
              set({ marketIntel: retryData })
              set({ marketIntelLoading: false })
              return
            }
          }
        }
      }

      set({ marketIntel: data })
    } catch (e) {
      console.error('[market-intel] Error:', e)
      set({ marketIntel: null })
    }
    set({ marketIntelLoading: false })
  },

  clearMarketIntel: () => set({ marketIntel: null, marketIntelLoading: false }),

  // Load stored signals from Supabase (fast, cached data)
  loadStoredSignals: async (profileId) => {
    try {
      const { data, error } = await supabase
        .from('market_signals')
        .select('*')
        .eq('user_id', profileId)

      if (error) { console.error('[signals] load error:', error.message); return }

      const signalMap = new Map<string, StoredSignal>()
      ;(data || []).forEach((row: Record<string, unknown>) => {
        signalMap.set(String(row.item_id), {
          itemId: String(row.item_id),
          ebayAvgPrice: Number(row.ebay_avg_price) || 0,
          ebayListingCount: Number(row.ebay_listing_count) || 0,
          trendScore: Number(row.trend_score) || 0,
          trendDirection: (row.trend_direction as string) || 'stable',
          convictionScore: Number(row.conviction_score) || 50,
          convictionLevel: (row.conviction_level as string) || 'HOLD',
          convictionHeadline: (row.conviction_headline as string) || '',
          priceChangePct: Number(row.price_change_pct) || 0,
          priceChangeAbs: Number(row.price_change_abs) || 0,
          fetchedAt: (row.fetched_at as string) || '',
        })
      })

      set({ storedSignals: signalMap })
      console.log('[signals] loaded', signalMap.size, 'stored signals')
    } catch (e) {
      console.error('[signals] load error:', e)
    }
  },

  // Trigger background refresh of all signals (fire-and-forget)
  refreshAllSignals: async (profileId) => {
    set({ signalsLoading: true })
    try {
      const res = await fetch('/api/refresh-signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profileId }),
      })
      const result = await res.json()
      console.log('[signals] refresh complete:', result)
      set({ signalsLastRefresh: new Date().toISOString() })

      // Reload stored signals only — do NOT call loadAll here or we overwrite local items
      // when user just added something and the server isn't updated yet
      await get().loadStoredSignals(profileId)
    } catch (e) {
      console.error('[signals] refresh error:', e)
    }
    set({ signalsLoading: false })
  },

  // Client-side watchlist price refresh: same Market Value pipeline as Market Research
  // (community data first, then eBay market-signal fallback) so numbers match when you tap into Research
  refreshWatchlistPrices: async (profileId) => {
    const watchlist = get().watchlist
    const searchCommunityItems = get().searchCommunityItems
    if (!watchlist.length) return

    console.log('[watchlist] refreshing prices for', watchlist.length, 'items (community first, then eBay)')
    const BATCH_SIZE = 3
    let updated = 0

    for (let i = 0; i < watchlist.length; i += BATCH_SIZE) {
      const batch = watchlist.slice(i, i + BATCH_SIZE)
      await Promise.allSettled(
        batch.map(async (w) => {
          try {
            const query = [w.name, w.brand].filter(Boolean).join(' ').trim()
            if (!query) return

            // Same pipeline as Research Price Intelligence: community first, then eBay
            // Use 'All' so we match Research screen (it also uses category 'All' for initial load)
            let marketValue = 0
            const community = await searchCommunityItems(query, 'All')
            if (community.avgValue > 0) {
              marketValue = community.avgValue
            }
            if (marketValue === 0) {
              const res = await fetch(
                `/api/market-signal?q=${encodeURIComponent(query)}&category=${encodeURIComponent(w.category || '')}`
              )
              if (!res.ok) return
              const signal = await res.json()
              marketValue = signal.ebayAvgPrice || 0
            }
            if (marketValue === 0) return

            const today = new Date().toISOString().split('T')[0]
            const existing = Array.isArray(w.priceHistory) ? w.priceHistory : []
            const alreadyHasToday = existing.some((p: { date: string }) => p.date === today)

            const updatedHistory = alreadyHasToday
              ? existing
              : [...existing, { date: today, value: marketValue }].slice(-90)

            const watchTable = supabase.from('watchlist') as any
            await watchTable
              .update({
                last_known_price: marketValue,
                price_history: JSON.stringify(updatedHistory),
                updated_at: new Date().toISOString(),
              })
              .eq('id', w.id)

            updated++
          } catch (e) {
            // Skip failed items
          }
        })
      )

      if (i + BATCH_SIZE < watchlist.length) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    console.log('[watchlist] refreshed prices for', updated, 'items')
    if (updated > 0) {
      const { data } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
      if (data) set({ watchlist: data.map((row: Record<string, unknown>) => mapRowToWatchlist(row)) })
    }
  },

  // eBay Live Prices via Supabase edge function
  fetchEbayComps: async (item) => {
    if (!item) return
    set({ ebayLoading: true, ebayError: null })
    try {
      const seen = new Set<string>()
      const baseQuery = [item.name, item.brand, item.model].filter(Boolean).join(' ')
        .split(/\s+/).filter(w => {
          const l = w.toLowerCase()
          if (seen.has(l)) return false
          seen.add(l)
          return true
        }).join(' ')
      // Exclude common accessories/junk via negative keywords
      const query = `${baseQuery} -case -cover -protector -adapter -charger -cable -mount -holder -skin -film -sticker`
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ebay-proxy?q=${encodeURIComponent(query)}&limit=12`
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

  // Comp CRUD — returns the updated item so callers can sync in the same tick (no setTimeout race)
  addCompToItem: (itemId, comp) => {
    set({ items: get().items.map(it =>
      it.id === itemId ? { ...it, comps: [...(it.comps || []), comp] } : it
    )})
    get().recalcMarketFromComps(itemId)
    return get().items.find(it => it.id === itemId)
  },

  deleteCompFromItem: (itemId, compId) => {
    set({ items: get().items.map(it =>
      it.id === itemId ? { ...it, comps: (it.comps || []).filter(c => c.id !== compId) } : it
    )})
    get().recalcMarketFromComps(itemId)
    return get().items.find(it => it.id === itemId)
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
