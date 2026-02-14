'use client'

import React, { useRef, useState } from 'react'
import { Camera, X, ArrowLeft } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { CATEGORIES, CONDITIONS } from '@/lib/utils'
import type { Screen, Item } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  item: Item
}

const EMOJI_OPTIONS = ['📦', '👜', '👟', '🪑', '📷', '⌚', '🍲', '📱', '🎒', '🎮', '💻', '🖼️', '🎸', '💎', '🧥']

export default function EditItemScreen({ onNavigate, item }: Props) {
  const { updateItem } = useItemsStore()
  const [emoji, setEmoji] = useState(item.emoji)
  const [photos, setPhotos] = useState<string[]>(item.photos || [])
  const [category, setCategory] = useState(item.category)
  const [condition, setCondition] = useState(item.condition)

  const nameRef = useRef<HTMLInputElement>(null)
  const brandRef = useRef<HTMLInputElement>(null)
  const modelRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

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
    const name = nameRef.current?.value?.trim() || ''
    if (!name) {
      alert('Item name is required.')
      return
    }

    updateItem(item.id, {
      name,
      brand: brandRef.current?.value?.trim() || '',
      model: modelRef.current?.value?.trim() || '',
      category,
      condition,
      emoji,
      notes: notesRef.current?.value?.trim() || '',
      photos,
    })

    onNavigate('detail')
  }

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 px-6 py-5 flex items-center justify-between bg-gradient-to-b from-dark to-transparent border-b border-white/5">
        <button onClick={() => onNavigate('detail')} className="text-white hover:text-amber-brand">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-white">Edit Item</h1>
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

        {/* Item Name */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            ref={nameRef}
            type="text"
            placeholder="e.g. Louis Vuitton Neverfull MM"
            defaultValue={item.name}
            className="w-full px-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Brand & Model */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Brand</label>
            <input
              ref={brandRef}
              type="text"
              placeholder="e.g. Nike"
              defaultValue={item.brand}
              className="w-full px-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Model</label>
            <input
              ref={modelRef}
              type="text"
              placeholder="e.g. Dunk Low"
              defaultValue={item.model}
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

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Notes</label>
          <textarea
            ref={notesRef}
            placeholder="Any extra details, serial numbers, where you bought it..."
            rows={3}
            defaultValue={item.notes}
            className="w-full px-3.5 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-slate-500 focus:border-amber-brand/50 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Buttons */}
        <button
          onClick={handleSave}
          className="w-full gradient-amber rounded-xl py-4 font-semibold text-black text-[15px] hover:shadow-lg transition-shadow"
        >
          Save Changes
        </button>
        <button
          onClick={() => onNavigate('detail')}
          className="w-full bg-white/6 border border-white/10 rounded-xl py-3.5 font-semibold text-white text-sm hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
