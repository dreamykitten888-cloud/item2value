'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowLeft, Check, AlertCircle, Loader2 } from 'lucide-react'
import type { Screen } from '@/types'
import { CATEGORY_EMOJIS, uuid } from '@/lib/utils'

interface Props {
  onNavigate: (screen: Screen) => void
  onScanData?: (data: unknown) => void
}

interface SceneItemResponse {
  label: string
  estimatedValueUSD: number
  category: string
  confidence: number
  anchor: { x: number; y: number }
}

interface TrackedItem extends SceneItemResponse {
  id: string
  selected: boolean
}

const POLL_MS = 2200
const SMOOTH = 0.38
/** Max normalized distance to consider same object across frames */
const MATCH_DIST = 0.4
const MAX_VISIBLE = 8

function compressDataUrl(dataUrl: string, maxWidth = 1200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = dataUrl
  })
}

function grabVideoFrame(video: HTMLVideoElement): string {
  const w = video.videoWidth
  const h = video.videoHeight
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(video, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.85)
}

/** Map normalized coords in the video frame to overlay pixels when video uses object-fit: cover */
function normalizedToOverlay(
  nx: number,
  ny: number,
  video: HTMLVideoElement,
  cw: number,
  ch: number
): { x: number; y: number } {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh || !cw || !ch) return { x: cw * nx, y: ch * ny }
  const scale = Math.max(cw / vw, ch / vh)
  const dispW = vw * scale
  const dispH = vh * scale
  const offX = (cw - dispW) / 2
  const offY = (ch - dispH) / 2
  return {
    x: offX + nx * dispW,
    y: offY + ny * dispH,
  }
}

function distNorm(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function mergeTracks(prev: TrackedItem[], incoming: SceneItemResponse[]): TrackedItem[] {
  const used = new Set<number>()
  const next: TrackedItem[] = []

  for (const inc of incoming) {
    let best = -1
    let bestDist = Infinity
    prev.forEach((p, i) => {
      if (used.has(i)) return
      const d = distNorm(p.anchor, inc.anchor)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })

    if (best >= 0 && bestDist < MATCH_DIST) {
      used.add(best)
      const p = prev[best]
      next.push({
        id: p.id,
        label: inc.label,
        estimatedValueUSD: inc.estimatedValueUSD,
        category: inc.category,
        confidence: inc.confidence,
        anchor: {
          x: p.anchor.x * (1 - SMOOTH) + inc.anchor.x * SMOOTH,
          y: p.anchor.y * (1 - SMOOTH) + inc.anchor.y * SMOOTH,
        },
        selected: p.selected,
      })
    } else {
      next.push({
        id: uuid(),
        ...inc,
        selected: false,
      })
    }
  }
  return next
}

function fmtPrice(n: number): string {
  if (n <= 0) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default function LiveScanScreen({ onNavigate, onScanData }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inFlightRef = useRef(false)

  const [size, setSize] = useState({ w: 0, h: 0 })
  const [camReady, setCamReady] = useState(false)
  const [tracks, setTracks] = useState<TrackedItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [lastFrame, setLastFrame] = useState<string | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    const r = el.getBoundingClientRect()
    setSize({ w: r.width, h: r.height })
    return () => ro.disconnect()
  }, [])

  const stopCamera = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    const v = videoRef.current
    if (v) v.srcObject = null
    setCamReady(false)
  }, [])

  const runScene = useCallback(async () => {
    const video = videoRef.current
    if (!video || video.readyState < 2 || inFlightRef.current) return
    inFlightRef.current = true
    setScanning(true)
    try {
      const raw = grabVideoFrame(video)
      const image = await compressDataUrl(raw)
      setLastFrame(image)

      const resp = await fetch('/api/identify-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setError(data.error || 'Scene scan failed')
        return
      }
      const items: SceneItemResponse[] = Array.isArray(data.items) ? data.items : []
      setTracks(prev => mergeTracks(prev, items))
      setError(null)
    } catch (e) {
      console.error('[live-scan]', e)
      setError('Network error')
    } finally {
      inFlightRef.current = false
      setScanning(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera not supported in this browser.')
          return
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        const v = videoRef.current
        if (!v) return
        v.srcObject = stream
        await v.play().catch(() => {})

        const startPolling = () => {
          if (cancelled) return
          setCamReady(true)
          runScene()
          pollRef.current = setInterval(runScene, POLL_MS)
        }
        if (v.readyState >= 2) startPolling()
        else v.addEventListener('loadeddata', startPolling, { once: true })
      } catch (e) {
        console.error('[live-scan] camera', e)
        setError('Could not access the camera. Check permissions.')
      }
    })()
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [runScene, stopCamera])

  const toggleSelect = (id: string) => {
    setTracks(prev =>
      prev.map(t => ({
        ...t,
        selected: t.id === id ? !t.selected : false,
      }))
    )
  }

  const staged = tracks.find(t => t.selected)

  const addToInventory = () => {
    if (!staged || !lastFrame) return
    const emoji = CATEGORY_EMOJIS[staged.category] ?? CATEGORY_EMOJIS['Other']
    const sd = {
      name: staged.label,
      brand: '',
      model: '',
      category: staged.category,
      condition: 'Good',
      emoji,
      cost: 0,
      value: staged.estimatedValueUSD,
      asking: 0,
      photos: [lastFrame],
      source: 'ai-live-scan',
    }
    if (onScanData) onScanData(sd)
    onNavigate('add-item')
  }

  const video = videoRef.current
  const chipW = 148
  const railRight = 12
  const lineStartX = size.w - railRight - chipW
  const visibleTracks = tracks.slice(0, MAX_VISIBLE)

  return (
    <div className="flex flex-col h-full bg-black">
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 z-20 bg-black/50 backdrop-blur-md border-b border-white/10">
        <button
          type="button"
          onClick={() => {
            stopCamera()
            onNavigate('home')
          }}
          className="text-white hover:text-amber-brand transition-colors p-1"
          aria-label="Back"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-white font-heading">Live scan</p>
          <p className="text-[10px] text-dim">Estimates are approximate</p>
        </div>
        <div className="w-8 flex justify-end">
          {scanning ? <Loader2 size={20} className="text-amber-brand animate-spin" /> : <span className="w-5" />}
        </div>
      </header>

      <div ref={containerRef} className="relative flex-1 min-h-0">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {size.w > 0 && camReady && video && video.videoWidth > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
            aria-hidden
          >
            {visibleTracks.map((t, i) => {
              const anchor = normalizedToOverlay(t.anchor.x, t.anchor.y, video, size.w, size.h)
              const chipTop = 56 + i * 76
              const clampedTop = Math.min(chipTop, Math.max(48, size.h - 120))
              const startY = clampedTop + 26
              const startX = lineStartX
              return (
                <line
                  key={t.id}
                  x1={anchor.x}
                  y1={anchor.y}
                  x2={startX}
                  y2={startY}
                  stroke="rgba(212, 175, 55, 0.65)"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
              )
            })}
          </svg>
        )}

        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
          <div className="pointer-events-auto self-end mr-3 mt-2 flex flex-col gap-2 w-[156px]">
            {visibleTracks.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  style={{ order: i }}
                  onClick={() => toggleSelect(t.id)}
                  className={`pointer-events-auto text-left rounded-xl px-3 py-2.5 border transition-all active:scale-[0.98] ${
                    t.selected
                      ? 'bg-emerald-500/25 border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                      : 'bg-black/55 border-white/15 backdrop-blur-sm hover:bg-black/70'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-semibold text-white leading-tight line-clamp-2 flex-1">
                      {t.label}
                    </span>
                    {t.selected && (
                      <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={3} />
                    )}
                  </div>
                  <p className="text-xs font-bold text-amber-brand mt-1">{fmtPrice(t.estimatedValueUSD)}</p>
                  <p className="text-[9px] text-dim truncate">{t.category}</p>
                </button>
              ))}
          </div>

          <div className="pointer-events-auto px-4 pb-safe pb-6 space-y-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-8">
            <p className="text-[11px] text-dim text-center flex items-center justify-center gap-1.5">
              <AlertCircle size={12} className="flex-shrink-0 opacity-70" />
              Prices are guesses. Respect others&apos; privacy when scanning outside your home.
            </p>
            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}
            {staged && (
              <button
                type="button"
                onClick={addToInventory}
                className="w-full gradient-amber rounded-xl py-3.5 text-sm font-bold text-black shadow-lg shadow-amber-brand/25"
              >
                Add &quot;{staged.label.slice(0, 36)}
                {staged.label.length > 36 ? '…' : ''}&quot; to inventory
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
