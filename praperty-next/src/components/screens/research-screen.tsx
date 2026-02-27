'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { fmt, fmtFull, makeProductKey } from '@/lib/utils'
import { getMarketplacesForCategory, getSocialLinks, getTrendLinks } from '@/lib/marketplaces'
import { calculateConviction } from '@/lib/conviction'
import SignalBreakdown from '@/components/signal-breakdown'
import MarketIntel from '@/components/market-intel'
import TrendIndicator from '@/components/trend-indicator'
import PriceHistoryChart from '@/components/price-history-chart'
import type { Screen, ResearchData, Item, MarketSignalData } from '@/types'

interface PricePoint {
  avg_price: number
  low_price: number
  high_price: number
  sample_size: number
  snapshot_date: string
}

interface Props {
  onNavigate: (screen: Screen) => void
  query?: string
  initialData?: ResearchData | null
}

export default function ResearchScreen({ onNavigate, query = 'Item', initialData = null }: Props) {
  const {
    searchCommunityItems,
    ebayComps, ebayLoading, ebayError,
    fetchEbayComps, clearEbayComps,
  } = useItemsStore()

  const [data, setData] = useState<ResearchData>(initialData || {
    listings: 0, avgValue: 0, lowValue: 0, highValue: 0, avgCost: 0,
    soldCount: 0, avgSold: 0, totalComps: 0, avgCompPrice: 0, recentComps: [], categories: [],
  })
  const [loading, setLoading] = useState(!initialData)
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showComps, setShowComps] = useState(false)
  const [showEbayListings, setShowEbayListings] = useState(true)
  const [trendData, setTrendData] = useState<MarketSignalData | null>(null)
  const [trendLoading, setTrendLoading] = useState(false)

  // Clear eBay comps when query changes
  useEffect(() => {
    clearEbayComps()
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!initialData && query) {
      setLoading(true)
      searchCommunityItems(query, 'All').then(result => {
        setData(result)
        setLoading(false)
      })
    }
  }, [query, initialData, searchCommunityItems])

  // Fetch price history + trigger a snapshot for this product
  useEffect(() => {
    if (!query) return
    const productKey = makeProductKey(query)

    // Trigger a snapshot for this product (background)
    fetch('/api/price-snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: [{ name: query }] }),
    }).catch(() => {})

    // Fetch existing price history
    setHistoryLoading(true)
    fetch(`/api/price-history?key=${encodeURIComponent(productKey)}&days=365`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.history) setPriceHistory(data.history)
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [query])

  // Fetch Google Trends data for research query
  useEffect(() => {
    if (!query) return
    setTrendLoading(true)
    const category = data.categories?.[0] || ''
    fetch(`/api/market-signal?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`, {
      signal: AbortSignal.timeout(12000),
    })
      .then(r => r.ok ? r.json() : null)
      .then(result => {
        if (result) setTrendData(result)
      })
      .catch(() => {})
      .finally(() => setTrendLoading(false))
  }, [query, data.categories])

  // Build a synthetic Item + MarketSignalData from ResearchData so we can use the conviction engine
  const syntheticItem: Item = useMemo(() => ({
    id: 'research-' + query,
    name: query,
    brand: '',
    model: '',
    category: data.categories?.[0] || 'Other',
    condition: 'Used',
    cost: data.avgCost || 0,
    asking: 0,
    value: data.avgValue || 0,
    earnings: null,
    emoji: '',
    notes: '',
    datePurchased: null,
    dateSold: null,
    soldPlatform: null,
    photos: [],
    comps: data.recentComps.map(c => ({
      title: c.title,
      price: c.price,
      source: c.source,
      condition: c.condition,
    })),
    priceHistory: priceHistory.map(p => ({
      date: p.snapshot_date,
      value: p.avg_price,
    })),
    createdAt: new Date().toISOString(),
  }), [query, data, priceHistory])

  const marketSignalData: MarketSignalData = useMemo(() => ({
    ebayPrices: data.recentComps.filter(c => c.price > 0).map(c => c.price),
    ebayAvgSold: data.avgSold || undefined,
    ebaySoldCount: data.soldCount || undefined,
    trendScore: trendData?.trendScore ?? undefined,
    trendDirection: trendData?.trendDirection ?? undefined,
    fetchedAt: trendData?.fetchedAt || new Date().toISOString(),
  }), [data, trendData])

  const conviction = useMemo(
    () => calculateConviction(syntheticItem, marketSignalData, 'browse'),
    [syntheticItem, marketSignalData]
  )

  const category = data.categories?.[0] || 'All'
  const marketplaces = getMarketplacesForCategory(category, query)
  const socialLinks = getSocialLinks(query)
  const trendLinks = getTrendLinks(query)

  // eBay summary stats
  const ebayStats = useMemo(() => {
    const prices = ebayComps.map(c => c.price?.value).filter((p): p is number => !!p && p > 0)
    if (prices.length === 0) return null
    const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
    const low = Math.round(Math.min(...prices))
    const high = Math.round(Math.max(...prices))
    const diff = data.avgValue > 0 ? ((avg - data.avgValue) / data.avgValue) * 100 : 0
    return { avg, low, high, count: prices.length, diff }
  }, [ebayComps, data.avgValue])

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between sticky top-0 z-20 bg-gradient-to-b from-dark to-transparent">
        <button onClick={() => onNavigate('discover')} className="text-white hover:text-amber-brand">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-base font-bold text-white">Market Research</h1>
        <div className="w-6" />
      </div>

      {/* Hero */}
      <div className="px-6 pb-5">
        <div className="rounded-2xl p-6 text-center" style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.12))',
          border: '1px solid rgba(168,85,247,0.2)',
        }}>
          <div className="text-4xl mb-2">📊</div>
          <h2 className="text-xl font-bold text-white mb-1">{query}</h2>
          <p className="text-dim text-xs">
            {data.categories.length > 0 ? data.categories.join(', ') : 'Search any item to see market intelligence'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="w-6 h-6 border-2 border-amber-brand/20 border-t-amber-brand rounded-full animate-spin mx-auto mb-3" />
          <p className="text-dim text-sm">Analyzing market data...</p>
        </div>
      ) : (
        <div className="px-6 space-y-4">

          {/* Buy/Sell Signal with Full Transparency */}
          <SignalBreakdown result={conviction} fetchedAt={marketSignalData.fetchedAt} />

          {/* Price Intelligence */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-lg">💰</span>
              <h3 className="text-base font-bold text-white">Price Intelligence</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { l: 'Market Value', v: data.avgValue, c: '#EB9C35' },
                { l: 'Avg Cost', v: data.avgCost, c: '#3b82f6' },
                { l: 'Price Range', v: data.lowValue > 0 ? `${fmt(data.lowValue)} - ${fmt(data.highValue)}` : null, c: '#a855f7', raw: true },
                { l: 'Avg Sold Price', v: data.avgSold, c: '#22c55e' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/[0.04] rounded-xl p-3 text-center">
                  <p className="text-dim text-[10px] uppercase tracking-wider">{stat.l}</p>
                  <p className="text-base font-bold mt-1" style={{ color: stat.c }}>
                    {stat.raw ? (stat.v || '--') : (typeof stat.v === 'number' && stat.v > 0 ? fmt(stat.v) : '--')}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 bg-white/[0.06] px-2.5 py-1 rounded-lg">{data.listings || 0} community listings</span>
              <span className="text-[11px] text-slate-400 bg-white/[0.06] px-2.5 py-1 rounded-lg">{data.totalComps || 0} comps</span>
              <span className="text-[11px] text-slate-400 bg-white/[0.06] px-2.5 py-1 rounded-lg">{data.soldCount || 0} sold</span>
            </div>
          </div>

          {/* ─── Live eBay Market Intel ─── */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔍</span>
                <h3 className="text-base font-bold text-white">Live eBay Prices</h3>
              </div>
              <button
                onClick={() => fetchEbayComps(syntheticItem)}
                disabled={ebayLoading}
                className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg hover:bg-blue-500/20 transition-colors"
              >
                {ebayLoading ? 'Searching...' : ebayComps.length > 0 ? '↻ Refresh' : 'Search eBay'}
              </button>
            </div>

            {/* Loading state */}
            {ebayLoading && (
              <div className="py-6 text-center">
                <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto" />
                <p className="text-dim text-[10px] mt-2">Searching eBay for &quot;{query}&quot;...</p>
              </div>
            )}

            {/* Error state */}
            {ebayError && !ebayLoading && (
              <p className="text-red-400 text-xs text-center py-2">{ebayError}</p>
            )}

            {/* Empty state */}
            {!ebayLoading && !ebayError && ebayComps.length === 0 && (
              <div className="text-center py-4">
                <p className="text-dim text-xs">Tap &quot;Search eBay&quot; to see what this item is selling for right now.</p>
              </div>
            )}

            {/* eBay summary stats */}
            {!ebayLoading && ebayStats && (
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-dim text-xs">eBay avg ({ebayStats.count} listings)</span>
                  <span className="text-base font-bold text-blue-400">{fmtFull(ebayStats.avg)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dim text-xs">Range</span>
                  <span className="text-xs text-white/70">{fmtFull(ebayStats.low)} - {fmtFull(ebayStats.high)}</span>
                </div>
                {data.avgValue > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-dim text-xs">vs. community value</span>
                    <span className={`text-xs font-bold ${ebayStats.diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {ebayStats.diff >= 0 ? '+' : ''}{ebayStats.diff.toFixed(0)}% {ebayStats.diff >= 0 ? 'above' : 'below'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* eBay listings with images */}
            {!ebayLoading && ebayComps.length > 0 && (
              <>
                <button
                  onClick={() => setShowEbayListings(!showEbayListings)}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-blue-400 mb-2"
                >
                  {showEbayListings ? 'Hide' : 'Show'} {ebayComps.length} Listings
                  {showEbayListings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showEbayListings && (
                  <div className="space-y-2">
                    {ebayComps.map((listing, idx) => (
                      <div key={listing.id || idx} className="flex gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                        {listing.image && (
                          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                            <img
                              src={listing.image}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLElement).parentElement!.style.display = 'none' }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{listing.title}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-bold text-amber-brand">
                              ${listing.price?.value?.toLocaleString() || '?'}
                            </span>
                            {listing.condition && (
                              <span className="text-[10px] text-dim bg-white/5 px-1.5 py-0.5 rounded">
                                {listing.condition}
                              </span>
                            )}
                            {listing.shippingCost !== undefined && listing.shippingCost > 0 && (
                              <span className="text-[10px] text-dim bg-white/5 px-1.5 py-0.5 rounded">
                                +${listing.shippingCost} ship
                              </span>
                            )}
                          </div>
                          {listing.itemUrl && (
                            <a
                              href={listing.itemUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-blue-500/15 border border-blue-500/30 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-blue-400 no-underline mt-1.5 hover:bg-blue-500/25 transition-colors"
                            >
                              View on eBay <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* eBay sold items link */}
            <a
              href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-white/[0.06] text-[11px] font-semibold text-green-400 hover:text-green-300 transition-colors no-underline"
            >
              View eBay Sold History <ExternalLink size={10} />
            </a>
          </div>

          {/* Price History Chart */}
          {!historyLoading && (
            <PriceHistoryChart history={priceHistory} productName={query} />
          )}
          {historyLoading && (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📈</span>
                <h3 className="text-base font-bold text-white">Price History</h3>
              </div>
              <div className="flex items-center justify-center py-6 gap-2">
                <div className="w-4 h-4 border-2 border-amber-brand/20 border-t-amber-brand rounded-full animate-spin" />
                <span className="text-dim text-xs">Loading price data...</span>
              </div>
            </div>
          )}

          {/* ─── Market Intelligence (enriched eBay analytics) ─── */}
          <MarketIntel item={syntheticItem} />

          {/* ─── Search Trends (Google Trends) ─── */}
          <TrendIndicator signal={trendData} loading={trendLoading} />

          {/* ─── Comps (collapsible, matching detail screen) ─── */}
          {data.recentComps.length > 0 && (
            <div>
              <button
                onClick={() => setShowComps(!showComps)}
                className="w-full flex items-center justify-between glass rounded-2xl p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">💎</span>
                  <h3 className="text-sm font-bold text-white">Community Comps</h3>
                  <span className="text-dim text-[11px]">({data.recentComps.length})</span>
                </div>
                {showComps ? <ChevronUp size={16} className="text-dim" /> : <ChevronDown size={16} className="text-dim" />}
              </button>

              {showComps && (
                <div className="mt-2 space-y-2 animate-fade-up">
                  {data.recentComps.map((c, i) => (
                    <div key={i} className="flex justify-between items-center glass rounded-xl p-3">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm text-white truncate">{c.title}</p>
                        <p className="text-[10px] text-dim">
                          {c.source}{c.condition ? ` · ${c.condition}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-amber-brand">{fmt(c.price)}</span>
                        {c.url && (
                          <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Comp avg summary */}
                  {(() => {
                    const prices = data.recentComps.filter(c => c.price > 0).map(c => c.price)
                    if (prices.length < 2) return null
                    const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
                    return (
                      <div className="flex justify-between items-center bg-white/[0.04] rounded-xl p-3 border border-white/[0.08]">
                        <span className="text-dim text-xs">Comp average ({prices.length})</span>
                        <span className="text-sm font-bold text-amber-brand">{fmtFull(avg)}</span>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Live Market Prices (category-aware marketplaces) */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-lg">🌐</span>
              <h3 className="text-base font-bold text-white">More Marketplaces</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              {marketplaces.map(m => (
                <a key={m.name} href={m.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 no-underline transition-all hover:scale-[1.01]"
                  style={{ background: m.bg, border: `1px solid ${m.color}22` }}>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: m.color }}>{m.name}</span>
                    <span className="text-[11px] text-dim ml-2">{m.desc}</span>
                  </div>
                  <span className="text-xs" style={{ color: m.color }}>↗</span>
                </a>
              ))}
            </div>
          </div>

          {/* Social Buzz */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">📱</span>
              <h3 className="text-base font-bold text-white">Social Buzz</h3>
            </div>
            <p className="text-dim text-xs mb-3.5">See what people are saying, unboxing, reviewing, and hyping</p>
            <div className="grid grid-cols-2 gap-2">
              {socialLinks.map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl p-3 no-underline border border-white/[0.08] hover:border-white/20 transition-colors"
                  style={{ background: s.bg.startsWith('linear') ? undefined : s.bg, backgroundImage: s.bg.startsWith('linear') ? s.bg : undefined }}>
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-sm font-semibold text-white">{s.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">📈</span>
              <h3 className="text-base font-bold text-white">Trend Analysis</h3>
            </div>
            <p className="text-dim text-xs mb-3.5">Is this item trending up or fading? Check the data.</p>
            <div className="flex flex-col gap-1.5">
              {trendLinks.map(t => (
                <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 no-underline hover:border-white/20 transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-white">{t.name}</span>
                    <br />
                    <span className="text-[11px] text-dim">{t.desc}</span>
                  </div>
                  <span className="text-xs" style={{ color: t.color }}>↗</span>
                </a>
              ))}
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => onNavigate('add-item')}
            className="w-full gradient-amber rounded-xl py-4 font-bold text-black text-sm"
          >
            Add This to My Inventory
          </button>
          <button
            onClick={() => onNavigate('discover')}
            className="w-full glass rounded-xl py-3 font-semibold text-white text-sm border border-white/10 hover:bg-white/10 transition-colors mb-4"
          >
            Back to Discover
          </button>
        </div>
      )}
    </div>
  )
}
