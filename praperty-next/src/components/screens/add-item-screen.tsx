'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, X, ArrowLeft, Sparkles } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { useAuthStore } from '@/stores/auth-store'
import { fmt, uuid, CATEGORIES, CONDITIONS, CATEGORY_EMOJIS } from '@/lib/utils'
import { matchProduct, getSuggestions } from '@/lib/product-db'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  scanData?: any
}

const EMOJI_OPTIONS = ['📦', '👜', '👟', '🪑', '📷', '⌚', '🍲', '📱', '🎒', '🎮', '💻', '🖼️', '🎸', '💎', '🧥']

export default function AddItemScreen({ onNavigate, scanData }: Props) {
  const { addItem, syncItem } = useItemsStore()
  const profileId = useAuthStore(s => s.profileId)
  const [emoji, setEmoji] = useState(scanData?.emoji || '📦')
  const [photos, setPhotos] = useState<string[]>(scanData?.photos || [])
  const [category, setCategory] = useState(scanData?.category || 'Other')
  const [condition, setCondition] = useState(scanData?.condition || 'New')

  // Controlled fields for auto-fill
  const [itemName, setItemName] = useState(scanData?.name || '')
  const [brand, setBrand] = useState(scanData?.brand || '')
  const [model, setModel] = useState(scanData?.model || '')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [autoFilled, setAutoFilled] = useState(false)

  const costRef = useRef<HTMLInputElement>(null)
  const askingRef = useRef<HTMLInputElement>(null)
  const marketRef = useRef<HTMLInputElement>(null)
  const datePurchasedRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  // Smart auto-fill when user types item name
  const handleNameChange = useCallback((value: string) => {
    setItemName(value)

    // Get brand suggestions for dropdown
    const suggs = getSuggestions(value)
    setSuggestions(suggs)

    // Try to auto-match and fill
    const match = matchProduct(value)
    if (match && match.confidence > 0.15) {
      setBrand(match.brand)
      setModel(match.model)
      setCategory(match.category)
      setEmoji(match.emoji)
      setAutoFilled(true)

      // Clear auto-fill indicator after a moment
      setTimeout(() => setAutoFilled(false), 2000)
    }
  }, [])

  // Apply suggestion from dropdown
  const applySuggestion = (brandName: string) => {
    // If the current name doesn't contain the brand, prepend it
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

  const handleSetCoverPhoto = (idx: number) => {
    if (idx !== 0) {
      setPhotos(prev => {
        const p = [...prev]
        const [moved] = p.splice(idx, 1)
        p.unshift(moved)
        return p
      })
    }
  }

  const handleSave = () => {
    const name = itemName.trim()
    const cost = parseFloat(costRef.current?.value || '0') || 0

    if (!name || !cost) {
      alert('Please enter an item name and what you paid.')
      return
    }

    const asking = parseFloat(askingRef.current?.value || '0') || 0
    const market = parseFloat(String(marketRef.current?.value || asking || cost || '0')) || 0

    const newItem = {
      id: uuid(),
      name,
      brand: brand.trim(),
      model: model.trim(),
      category,
      condition,
      cost,
      asking,
      value: market,
      earnings: null,
      emoji,
      notes: notesRef.current?.value?.trim() || '',
      datePurchased: datePurchasedRef.current?.value || null,
      dateSold: null,
      soldPlatform: null,
      photos,
      comps: [],
      priceHistory: [
        {
          date: new Date().toISOString().slice(0, 10),
          value: market,
        },
      ],
      createdAt: new Date().toISOString(),
    }

    addItem(newItem)
    if (profileId) {
      syncItem(newItem, profileId).catch(e => console.error('Failed to save item:', e))
    }
    onNavigate('inventory')
  }

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 px-6 py-5 flex items-center justify-between bg-gradient-to-b from-dark to-transparent border-b border-white/5">
        <button onClick={() => onNavigate('home')} className="text-white hover:text-amber-brand">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-white">Add Item</h1>
        <div className="w-6" />
      </div>

      <div className="px-6 space-y-6">
        {/* Emoji Picker */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">Icon</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-11 h-11 rounded-lg flex items-center justify-center text-lg transition-all ${
                  emoji === e
                    ? 'bg-amber-brand/20 border-2 border-amber-brand'
                    : 'bg-white/4 border border-white/10 hover:bg-white/8'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">
            Photos ({photos.length}/5)
          </label>
          <div className="flex flex-wrap gap-2.5">
            {photos.map((photo, idx) => (
              <div
                key={idx}
                className="relative w-[72px] h-[72px] rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => handleSetCoverPhoto(idx)}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
                {idx === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-amber-brand/90 text-center py-0.5">
                    <span className="text-[8px] font-bold text-black uppercase tracking-0.5">Cover</span>
                  </div>
                )}
                {idx !== 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center py-0.5">
                    <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-0.5">Tap</span>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemovePhoto(idx)
                  }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center text-sm hover:bg-black/90"
                >
                  ×
                </button>
              </div>
            ))}

            {photos.length < 5 && (
              <label className="w-[72px] h-[72px] rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center cursor-pointer bg-white/3 hover:bg-white/5 transition-all gap-1">
                <Camera size={20} className="text-slate-500" />
                <span className="text-[9px] text-slate-500 font-semibold">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddPhotos}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Item Name with Smart Auto-fill */}
        <div className="relative">
          <label className="block text-sm font-semibold text-white mb-2">
            Item Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Onitsuka Tiger Mexico 66, Rolex Submariner"
              value={itemName}
              onChange={e => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none transition-colors"
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
            <div className="absolute z-30 left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
              {suggestions.map(s => {
                const info = matchProduct(s)
                return (
                  <button
                    key={s}
                    onClick={() => applySuggestion(s)}
                    className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-white/8 active:bg-white/12 text-left transition-colors border-b border-white/5 last:border-0"
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

        {/* Brand & Model (auto-filled) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Brand</label>
            <input
              type="text"
              placeholder="e.g. Nike"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Model</label>
            <input
              type="text"
              placeholder="e.g. Dunk Low"
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Category & Condition */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white focus:border-amber-brand/50 focus:outline-none transition-colors"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Condition</label>
            <select
              value={condition}
              onChange={e => setCondition(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white focus:border-amber-brand/50 focus:outline-none transition-colors"
            >
              {CONDITIONS.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/8 pt-4">
          <h3 className="text-sm font-bold text-white">Pricing</h3>
        </div>

        {/* What I Paid */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            What I Paid <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">$</span>
            <input
              ref={costRef}
              type="number"
              placeholder="0.00"
              defaultValue={scanData?.cost || ''}
              className="w-full pl-7 pr-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Date Purchased */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Date Purchased</label>
          <input
            ref={datePurchasedRef}
            type="date"
            className="w-full px-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white focus:border-amber-brand/50 focus:outline-none transition-colors"
          />
        </div>

        {/* My Asking Price */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">My Asking Price</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">$</span>
            <input
              ref={askingRef}
              type="number"
              placeholder="Optional"
              defaultValue={scanData?.asking || ''}
              className="w-full pl-7 pr-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Estimated Market Value */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Estimated Market Value</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">$</span>
            <input
              ref={marketRef}
              type="number"
              placeholder="Optional"
              defaultValue={scanData?.value || ''}
              className="w-full pl-7 pr-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Notes</label>
          <textarea
            ref={notesRef}
            placeholder="Any extra details, serial numbers, where you bought it..."
            rows={3}
            className="w-full px-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Buttons */}
        <button
          onClick={handleSave}
          className="w-full gradient-amber rounded-xl py-4 font-semibold text-black text-[15px] flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
        >
          <span>💾</span> Save Item
        </button>
        <button
          onClick={() => onNavigate('home')}
          className="w-full bg-white/6 border border-white/10 rounded-xl py-3.5 font-semibold text-white text-sm hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
