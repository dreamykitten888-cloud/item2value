'use client'

import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

interface Props {
  /** Short explanation shown on hover or click */
  content: string
  /** Optional label for screen readers */
  ariaLabel?: string
  /** Smaller variant for tight layouts */
  size?: 'sm' | 'md'
}

export default function InfoTooltip({ content, ariaLabel = 'More info', size = 'md' }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  const iconSize = size === 'sm' ? 10 : 12
  const ringSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex align-middle"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={`${ringSize} rounded-full border border-white/25 bg-white/10 flex items-center justify-center flex-shrink-0 hover:bg-white/20 hover:border-white/40 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-brand/50`}
        aria-expanded={open}
      >
        <Info size={iconSize} className="text-white/70" strokeWidth={2.5} />
      </button>
      {open && (
        <span
          role="tooltip"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2.5 py-2 max-w-[240px] text-[11px] leading-relaxed text-white/90 bg-slate-800 border border-white/10 rounded-lg shadow-xl whitespace-normal"
          style={{ minWidth: 140 }}
        >
          {content}
          {/* small arrow */}
          <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  )
}
