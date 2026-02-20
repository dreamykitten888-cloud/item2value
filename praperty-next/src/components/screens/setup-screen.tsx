'use client'

import { useState } from 'react'
import { Camera, Package, TrendingUp, Bell, Search, ChevronRight, Sparkles } from 'lucide-react'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onComplete: () => void
}

const STEPS = [
  {
    icon: Sparkles,
    emoji: '👋',
    title: 'Welcome to PrÄperty',
    subtitle: 'Your personal portfolio tracker for everything you own',
    description: 'Track what you have, what it\'s worth, and when to sell. Think E-Trade, but for your stuff.',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'rgba(245,158,11,0.06)',
  },
  {
    icon: Camera,
    emoji: '📸',
    title: 'Scan & Add Items',
    subtitle: 'Barcode scanning or snap a photo',
    description: 'Scan barcodes to auto-fill product details, or take a photo and add info manually. Building your inventory takes seconds.',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'rgba(59,130,246,0.06)',
  },
  {
    icon: Search,
    emoji: '🔍',
    title: 'Discover Market Prices',
    subtitle: 'Real-time eBay comps at your fingertips',
    description: 'Search what anything is selling for right now. See sold listings, active prices, and market trends to know your item\'s true value.',
    gradient: 'from-purple-500 to-pink-500',
    bg: 'rgba(168,85,247,0.06)',
  },
  {
    icon: TrendingUp,
    emoji: '📈',
    title: 'Track Your Portfolio',
    subtitle: 'Watch your collection grow',
    description: 'See total value, top gainers, items ready to flip, and your earnings history. Every item is an investment.',
    gradient: 'from-green-500 to-emerald-500',
    bg: 'rgba(34,197,94,0.06)',
  },
  {
    icon: Bell,
    emoji: '🔔',
    title: 'Smart Alerts',
    subtitle: 'Never miss an opportunity',
    description: 'Get notified about price changes, items that need attention, and the best times to buy or sell. PrÄperty watches so you don\'t have to.',
    gradient: 'from-amber-500 to-red-500',
    bg: 'rgba(239,68,68,0.06)',
  },
]

export default function SetupScreen({ onNavigate, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const Icon = current.icon

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <div className="h-full bg-dark flex flex-col">
      {/* Skip button */}
      <div className="px-6 pt-6 flex justify-end flex-shrink-0">
        {!isLast && (
          <button
            onClick={handleSkip}
            className="text-dim text-sm font-medium hover:text-white transition-colors"
          >
            Skip
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Animated icon */}
        <div
          className="w-28 h-28 rounded-3xl flex items-center justify-center mb-8 animate-fade-up"
          style={{ background: `linear-gradient(135deg, ${current.bg}, transparent)`, border: '1px solid rgba(255,255,255,0.06)' }}
          key={step}
        >
          <span className="text-5xl">{current.emoji}</span>
        </div>

        {/* Title */}
        <h1
          className="text-[26px] font-bold text-white text-center mb-2 animate-fade-up"
          style={{ animationDelay: '0.05s' }}
          key={`title-${step}`}
        >
          {current.title}
        </h1>

        {/* Subtitle */}
        <p
          className="text-amber-brand text-sm font-semibold text-center mb-4 animate-fade-up"
          style={{ animationDelay: '0.1s' }}
          key={`sub-${step}`}
        >
          {current.subtitle}
        </p>

        {/* Description */}
        <p
          className="text-dim text-[15px] text-center leading-relaxed max-w-xs animate-fade-up"
          style={{ animationDelay: '0.15s' }}
          key={`desc-${step}`}
        >
          {current.description}
        </p>
      </div>

      {/* Bottom section */}
      <div className="px-8 pb-10 flex-shrink-0">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-8 bg-amber-brand'
                  : i < step
                  ? 'w-2 bg-amber-brand/40'
                  : 'w-2 bg-white/15'
              }`}
            />
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleNext}
          className="w-full gradient-amber rounded-xl py-4 font-bold text-black text-[15px] flex items-center justify-center gap-2 mb-3"
        >
          {isLast ? 'Get Started' : 'Next'}
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>

        {/* Step counter */}
        <p className="text-center text-dim text-xs">
          {step + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  )
}
