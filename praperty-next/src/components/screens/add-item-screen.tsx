'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, X, ArrowLeft, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { useAuthStore } from '@/stores/auth-store'
import { fmt, uuid, CATEGORIES, CONDITIONS, CATEGORY_EMOJIS } from '@/lib/utils'
import { matchProduct, getSuggestions, searchProducts } from '@/lib/product-db'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  scanData?: any
}

export default function AddItemScreen({ onNavigate, scanData }: Props) {
  const { addItem, syncItem } = useItemsStore()
  const profileId = useAuthStore(s => s.profileId)

  // Core fields (always visible)
  const [itemName, setItemName] = useState(scanData?.name || '')
  const [cost, setCost] = useState(scanData?.cost?.toString() || '')
  const [emoji, setEmoji] = useState(scanData?.emoji || '📦')
  const [category, setCategory] = useState(scanData?.category || 'Other')
  const [condition, setCondition] = useState(scanData?.condition || 'New')
  const [brand, setBrand] = useState(scanData?.brand || '')
  const [model, setModel] = useState(scanData?.model || '')
  const [photos, setPhotos] = useState<string[]>(scanData?.photos || [])

  // UI state
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [autoFilled, setAutoFilled] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [saving, setSaving] = useState(false)

  // Optional fields
  const [asking, setAsking] = useState(scanData?.asking?.toString() || '')
  const [marketValue, setMarketValue] = useState(scanData?.value?.toString() || '')
  const [datePurchased, setDatePurchased] = useState('')
  const [notes, setNotes] = useState('')

  const nameRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-focus name on mount
  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 200)
  }, [])

  // Smart auto-fill when user types item name
  const handleNameChange = useCallback((value: string) => {
    setItemName(value)

    // Instant local suggestions while typing
    const localSuggs = getSuggestions(value).map(s => s.name)
    setSuggestions(localSuggs)

    // Auto-fill from local match immediately
    const match = matchProduct(value)
    if (match && match.confidence > 0.15) {
      setBrand(match.brand)
      setModel(match.model)
      setCategory(match.category)
      setEmoji(match.emoji)
      setAutoFilled(true)
      setTimeout(() => setAutoFilled(false), 2000)
    }

    // Debounced Supabase search for richer results
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (value.trim().length >= 2) {
      searchTimer.current = setTimeout(async () => {
        const results = await searchProducts(value)
        if (results.length > 0) {
          setSuggestions(results.map(r => r.name))
          // If Supabase returned a strong match, auto-fill from it
          const top = results[0]
          if (top.brand && top.category) {
            setBrand(top.brand)
            setModel(top.model || '')
            setCategory(top.category)
            setEmoji(top.emoji)
            setAutoFilled(true)
            setTimeout(() => setAutoFilled(false), 2000)
          }
        }
      }, 250)
    }
  }, [])

  const applySuggestion = (brandName: string) => {
    const lower = itemName.toLowerCase()
    if (!lower.includes(brandName.toLowerCase())) {
      const newName = `${brandName} ${itemName}`.trim()
      setItemName(newName)
      handleNameChange(newName)
    } else {
      handleNameChange(itemName)
    }
    setSuggestions([])
  }

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - photos.length)
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        setPhotos(prev => [...prev, dataUrl].slice(0, 5))
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const handleRemovePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    const name = itemName.trim()
    if (!name) {
      alert('Give your item a name')
      return
    }

    const costNum = parseFloat(cost) || 0
    const askNum = parseFloat(asking) || 0
    const mktNum = parseFloat(marketValue) || askNum || costNum || 0

    setSaving(true)

    const newItem = {
      id: uuid(),
      name,
      brand: brand.trim(),
      model: model.trim(),
      category,
      condition,
      cost: costNum,
      asking: askNum,
      value: mktNum,
      earnings: null,
      emoji,
      notes: notes.trim(),
      datePurchased: datePurchased || null,
      dateSold: null,
      soldPlatform: null,
      photos,
      comps: [],
      priceHistory: [{ date: new Date().toISOString().slice(0, 10), value: mktNum }],
      createdAt: new Date().toISOString(),
    }

    addItem(newItem)
    if (profileId) {
      syncItem(newItem, profileId).catch(e => console.error('Failed to save item:', e))
    }

    // Fire-and-forget: contribute this product to the catalog
    if (name && brand.trim()) {
      fetch('/api/product-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, brand: brand.trim(), model: model.trim(), category, emoji }),
      }).catch(() => {}) // silently ignore errors
    }

    onNavigate('inventory')
  }

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(to bottom, var(--bg-primary) 60%, transparent)' }}>
        <button onClick={() => onNavigate('home')} className="text-white hover:text-amber-brand transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-white font-heading">Add Item</h1>
        <button
          onClick={handleSave}
          disabled={!itemName.trim() || saving}
          className={`text-sm font-bold transition-colors ${itemName.trim() ? 'text-amber-brand' : 'text-dim'}`}
        >
          {saving ? '...' : 'Save'}
        </button>
      </div>

      <div className="px-6 space-y-5">

        {/* ─── HERO: Item Name ─── */}
        <div className="relative">
          <div className="relative mb-2">
            <input
              ref={nameRef}
              type="text"
              placeholder='What are you adding?'
              value={itemName}
              onChange={e => handleNameChange(e.target.value)}
              className="form-input text-lg font-semibold py-3.5"
              autoComplete="off"
            />
            {autoFilled && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-400">
                <Sparkles size={14} />
                <span className="text-[10px] font-semibold">Auto-filled</span>
              </div>
            )}
          </div>

          {/* Suggestion dropdown */}
          {suggestions.length > 0 && itemName.length >= 2 && (
            <div className="absolute z-30 left-0 right-0 mt-1 glass rounded-xl overflow-hidden shadow-2xl border border-white/10">
              {suggestions.map(s => {
                const info = matchProduct(s)
                return (
                  <button
                    key={s}
                    onClick={() => applySuggestion(s)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/8 active:bg-white/12 text-left transition-colors border-b border-white/5 last:border-0"
                  >
                    <span className="text-lg">{info?.emoji || '📦'}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{s}</p>
                      <p className="text-[10px] text-dim">{info?.category || 'Other'}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ─── Quick Fields: Cost + Category ─── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-dim mb-1.5 uppercase tracking-wider">What I Paid</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim font-semibold text-sm">$</span>
              <input
                type="number"
                placeholder="0"
                value={cost}
                onChange={e => setCost(e.target.value)}
                className="form-input !pl-8"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dim mb-1.5 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={e => {
                setCategory(e.target.value)
                setEmoji(CATEGORY_EMOJIS[e.target.value] || '📦')
              }}
              className="form-input"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── Photo Strip ─── */}
        <div>
          <label className="block text-xs font-semibold text-dim mb-2 uppercase tracking-wider">
            Photos {photos.length > 0 && `(${photos.length}/5)`}
          </label>
          <div className="flex gap-2 overflow-x-auto scroll-hide pb-1">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img src={photo} alt="" className="w-full h-full object-cover" />
                {idx === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-amber-brand/90 text-center">
                    <span className="text-[7px] font-bold text-black uppercase">Cover</span>
                  </div>
                )}
                <button
                  onClick={() => handleRemovePhoto(idx)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px]"
                >
                  <X size={10} />
                </button>
              </div>
            ))}

            {photos.length < 5 && (
              <label className="w-16 h-16 rounded-xl border border-dashed border-white/15 flex flex-col items-center justify-center cursor-pointer bg-white/3 hover:bg-white/6 transition-all flex-shrink-0 gap-0.5">
                <Camera size={16} className="text-dim" />
                <span className="text-[8px] text-dim font-semibold">Add</span>
                <input type="file" accept="image/*" multiple onChange={handleAddPhotos} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* ─── More Details (Collapsible) ─── */}
        <button
          onClick={() => setShowMore(!showMore)}
          className="w-full flex items-center justify-center gap-1.5 text-sm text-dim font-medium py-2 hover:text-white transition-colors"
        >
          {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showMore ? 'Less details' : 'More details'}
        </button>

        {showMore && (
          <div className="space-y-4 animate-fade-up">
            {/* Brand & Model */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-dim mb-1.5 uppercase tracking-wider">Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Nike"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dim mb-1.5 uppercase tracking-wider">Model</label>
                <input
                  type="text"
                  placeholder="e.g. Dunk Low"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-semibold text-dim mb-1.5 uppercase tracking-wider">Condition</label>
              <div className="flex flex-wrap gap-1.5">
                {CONDITIONS.map(c => (
                  <button
                    key={c}
                    onClick={() => setCondition(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      condition === c
                        ? 'bg-amber-brand/20 text-amber-brand border border-amber-brand/40'
                        : 'glass text-white/60 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-dim mb-1.5 uppercase tracking-wider">Asking Price</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim font-semibold text-sm">$</span>
                  <input type="number" placeholder="Optional" value={asking} onChange={e => setAsking(e.target.value)} className="form-input !pl-8" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dim mb-1.5 uppercase tracking-wider">Market Value</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim font-semibold text-sm">$</span>
                  <input type="number" placeholder="Optional" value={marketValue} onChange={e => setMarketValue(e.target.value)} className="form-input !pl-8" />
                </div>
              </div>
            </div>

            {/* Date + Notes */}
            <div>
              <label className="block text-xs font-semibold text-dim mb-1.5 uppercase tracking-wider">Date Purchased</label>
              <input type="date" value={datePurchased} onChange={e => setDatePurchased(e.target.value)} className="form-input min-w-0 max-w-full" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dim mb-1.5 uppercase tracking-wider">Notes</label>
              <textarea
                placeholder="Serial numbers, where you bought it..."
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="form-input resize-none"
              />
            </div>
          </div>
        )}

        {/* ─── Save Button ─── */}
        <button
          onClick={handleSave}
          disabled={!itemName.trim() || saving}
          className={`w-full gradient-amber rounded-xl py-4 font-bold text-black text-[15px] flex items-center justify-center gap-2 transition-all ${
            !itemName.trim() || saving ? 'opacity-40' : 'hover:shadow-lg'
          }`}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>Add to Portfolio</>
          )}
        </button>

        <button
          onClick={() => onNavigate('home')}
          className="w-full text-dim text-sm font-medium text-center py-2 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
