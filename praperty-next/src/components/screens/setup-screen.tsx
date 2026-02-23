'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, ChevronRight, Sparkles, ArrowRight, Check } from 'lucide-react'
import { useItemsStore } from '@/stores/items-store'
import { useAuthStore } from '@/stores/auth-store'
import { uuid, CATEGORY_EMOJIS } from '@/lib/utils'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onComplete: () => void
}

// Quick-start categories for the "What do you collect?" step
const ONBOARD_CATS = [
  { emoji: '👟', label: 'Sneakers' },
  { emoji: '⌚', label: 'Watches' },
  { emoji: '👕', label: 'Clothing' },
  { emoji: '📱', label: 'Electronics' },
  { emoji: '🃏', label: 'Trading Cards' },
  { emoji: '🧸', label: 'Toys' },
  { emoji: '💍', label: 'Jewelry' },
  { emoji: '🎸', label: 'Instruments' },
  { emoji: '🏆', label: 'Collectibles' },
  { emoji: '📦', label: 'Other' },
]

export default function SetupScreen({ onNavigate, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [itemName, setItemName] = useState('')
  const [adding, setAdding] = useState(false)
  const [addedItem, setAddedItem] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { addItem, syncItem } = useItemsStore()
  const profileId = useAuthStore(s => s.profileId)

  // Auto-focus the input when step 1 mounts
  useEffect(() => {
    if (step === 1) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [step])

  const toggleCategory = (label: string) => {
    setSelectedCats(prev =>
      prev.includes(label)
        ? prev.filter(c => c !== label)
        : [...prev, label]
    )
  }

  const handleQuickAdd = async () => {
    if (!itemName.trim()) return
    setAdding(true)

    try {
      const category = selectedCats[0] || 'Other'
      const emoji = CATEGORY_EMOJIS[category] || '📦'
      const now = new Date().toISOString()

      const newItem = {
        id: uuid(),
        name: itemName.trim(),
        brand: '',
        model: '',
        category,
        condition: 'Good',
        cost: 0,
        asking: 0,
        value: 0,
        earnings: null,
        emoji,
        notes: '',
        datePurchased: null,
        dateSold: null,
        soldPlatform: null,
        photos: [] as string[],
        comps: [],
        priceHistory: [{ date: now.slice(0, 10), value: 0 }],
        createdAt: now,
      }

      addItem(newItem)
      if (profileId) {
        syncItem(newItem, profileId).catch(e => console.error('[setup] sync failed:', e))
      }

      setAddedItem(true)
      setTimeout(() => {
        onComplete()
      }, 1200)
    } catch (err) {
      console.error('[setup] Failed to add item:', err)
      setAdding(false)
    }
  }

  const handleSkipToApp = () => {
    onComplete()
  }

  // ─── STEP 0: Welcome + Category Selection ─────────
  if (step === 0) {
    return (
      <div className="h-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        {/* Skip */}
        <div className="px-6 pt-6 flex justify-end flex-shrink-0">
          <button onClick={handleSkipToApp} className="text-dim text-sm font-medium hover:text-white transition-colors">
            Skip
          </button>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 animate-fade-up"
            style={{ background: 'linear-gradient(135deg, rgba(235,156,53,0.15), rgba(78,113,69,0.15))', border: '1px solid rgba(235,156,53,0.2)' }}
          >
            <Sparkles size={36} className="text-amber-brand" />
          </div>

          <h1 className="text-[28px] font-bold text-white text-center mb-2 animate-fade-up font-heading" style={{ animationDelay: '0.05s' }}>
            Welcome to PrÄperty
          </h1>
          <p className="text-dim text-[15px] text-center leading-relaxed max-w-[280px] mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Track what you own, what it&apos;s worth, and when to sell. Let&apos;s get your first item added.
          </p>

          {/* Category chips */}
          <div className="animate-fade-up w-full max-w-sm" style={{ animationDelay: '0.15s' }}>
            <p className="text-white text-sm font-semibold text-center mb-3">What do you collect?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {ONBOARD_CATS.map(cat => {
                const selected = selectedCats.includes(cat.label)
                return (
                  <button
                    key={cat.label}
                    onClick={() => toggleCategory(cat.label)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selected
                        ? 'bg-amber-brand/20 text-amber-brand border border-amber-brand/40'
                        : 'glass text-white/70 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                    {selected && <Check size={14} className="ml-0.5" />}
                  </button>
                )
              })}
            </div>
            <p className="text-dim text-xs text-center mt-3">Pick any that apply, or skip ahead</p>
          </div>
        </div>

        {/* Bottom */}
        <div className="px-8 pb-10 flex-shrink-0">
          <div className="flex justify-center gap-2 mb-5">
            <div className="h-2 w-8 rounded-full bg-amber-brand" />
            <div className="h-2 w-2 rounded-full bg-white/15" />
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full gradient-amber rounded-xl py-4 font-bold text-black text-[15px] flex items-center justify-center gap-2"
          >
            Add Your First Item
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    )
  }

  // ─── STEP 1: Quick Add First Item ─────────
  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Back / Skip */}
      <div className="px-6 pt-6 flex justify-between items-center flex-shrink-0">
        <button onClick={() => setStep(0)} className="text-dim text-sm font-medium hover:text-white transition-colors">
          Back
        </button>
        <button onClick={handleSkipToApp} className="text-dim text-sm font-medium hover:text-white transition-colors">
          Skip for now
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {addedItem ? (
          // Success state
          <div className="text-center animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check size={40} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-heading">You&apos;re all set!</h2>
            <p className="text-dim text-sm">Taking you to your portfolio...</p>
          </div>
        ) : (
          // Add item form
          <>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 animate-fade-up"
              style={{ background: 'linear-gradient(135deg, rgba(78,113,69,0.15), rgba(235,156,53,0.1))', border: '1px solid rgba(78,113,69,0.2)' }}
            >
              <Plus size={28} className="text-amber-brand" />
            </div>

            <h2
              className="text-2xl font-bold text-white text-center mb-2 animate-fade-up font-heading"
              style={{ animationDelay: '0.05s' }}
            >
              What&apos;s your first item?
            </h2>
            <p
              className="text-dim text-sm text-center mb-8 animate-fade-up"
              style={{ animationDelay: '0.1s' }}
            >
              Type any item you own. We&apos;ll handle the rest.
            </p>

            {/* Input */}
            <div className="w-full max-w-sm animate-fade-up" style={{ animationDelay: '0.15s' }}>
              <input
                ref={inputRef}
                type="text"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
                placeholder='e.g. "Jordan 4 Bred" or "PS5"'
                className="form-input w-full text-center text-base py-4 rounded-2xl"
                autoComplete="off"
              />

              {/* Smart suggestions based on selected categories */}
              {selectedCats.length > 0 && !itemName && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  {selectedCats.slice(0, 3).map(cat => {
                    const suggestions: Record<string, string[]> = {
                      Sneakers: ['Jordan 4 Bred', 'Yeezy 350', 'Nike Dunk Low'],
                      Watches: ['Rolex Submariner', 'Omega Speedmaster', 'Casio G-Shock'],
                      Clothing: ['Supreme Box Logo', 'Burberry Scarf', 'Vintage Levi\'s'],
                      Electronics: ['PS5', 'MacBook Pro', 'Nintendo Switch'],
                      'Trading Cards': ['Charizard Holo', 'PSA 10 Pikachu', 'Topps Chrome'],
                      Toys: ['LEGO Millennium Falcon', 'Hot Wheels Set', 'Funko Pop'],
                      Jewelry: ['Gold Chain 14k', 'Diamond Ring', 'Cartier Bracelet'],
                      Instruments: ['Fender Strat', 'Gibson Les Paul', 'Roland Piano'],
                      Collectibles: ['Signed Jersey', 'Vintage Poster', 'First Edition Book'],
                      Other: ['Camera', 'Vintage Lamp', 'Rare Book'],
                    }
                    return (suggestions[cat] || []).slice(0, 2).map(s => (
                      <button
                        key={s}
                        onClick={() => setItemName(s)}
                        className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white/80 transition-all"
                      >
                        {s}
                      </button>
                    ))
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom */}
      {!addedItem && (
        <div className="px-8 pb-10 flex-shrink-0">
          <div className="flex justify-center gap-2 mb-5">
            <div className="h-2 w-2 rounded-full bg-amber-brand/40" />
            <div className="h-2 w-8 rounded-full bg-amber-brand" />
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={!itemName.trim() || adding}
            className={`w-full gradient-amber rounded-xl py-4 font-bold text-black text-[15px] flex items-center justify-center gap-2 transition-opacity ${
              !itemName.trim() || adding ? 'opacity-40' : ''
            }`}
          >
            {adding ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                Add to Portfolio
                <ChevronRight size={18} strokeWidth={2.5} />
              </>
            )}
          </button>

          <p className="text-center text-dim text-xs mt-3">
            You can always edit details and add photos later
          </p>
        </div>
      )}
    </div>
  )
}
