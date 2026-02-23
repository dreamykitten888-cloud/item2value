'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowLeft, Camera, Upload, Sparkles, RefreshCw } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { Screen } from '@/types'

// Dynamically import the scanner so it only loads client-side
const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner),
  { ssr: false, loading: () => <div className="w-full h-64 bg-black rounded-2xl animate-pulse" /> }
)

interface Props {
  onNavigate: (screen: Screen) => void
  onScanData?: (data: any) => void
}

interface AIResult {
  name: string
  brand: string
  model: string
  category: string
  condition: string
  emoji: string
  estimatedValue: number
  confidence: number
  description: string
}

// Category mapping from product database categories
const CAT_MAP: Record<string, string> = {
  apparel: 'Clothing', clothing: 'Clothing', shoes: 'Sneakers', fashion: 'Clothing',
  electronics: 'Electronics', computers: 'Electronics', phone: 'Electronics', phones: 'Electronics',
  home: 'Home', kitchen: 'Home', garden: 'Home', furniture: 'Furniture',
  sports: 'Sports', outdoors: 'Sports', fitness: 'Sports',
  toys: 'Collectibles', games: 'Gaming',
  books: 'Books', media: 'Books',
  automotive: 'Automotive', car: 'Automotive',
  tools: 'Tools', hardware: 'Tools',
  jewelry: 'Jewelry', watches: 'Watches',
  music: 'Music', instruments: 'Instruments',
  art: 'Art', collectibles: 'Collectibles',
}

function inferCategory(category: string): string {
  if (!category) return 'Other'
  const lower = category.toLowerCase()
  for (const [keyword, mapped] of Object.entries(CAT_MAP)) {
    if (lower.includes(keyword)) return mapped
  }
  return 'Other'
}

export default function ScanScreen({ onNavigate, onScanData }: Props) {
  const [scanMode, setScanMode] = useState<'photo' | 'barcode'>('photo')
  const [scanData, setScanData] = useState<any>(null)
  const [barcodeScanning, setBarcodeScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [identifying, setIdentifying] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const hasScannedRef = useRef(false)

  // Reset scanned flag when switching modes or starting new scan
  useEffect(() => {
    if (!barcodeScanning) hasScannedRef.current = false
  }, [barcodeScanning])

  // ─── AI Photo Identification ─────────────────
  const identifyPhoto = useCallback(async (dataUrl: string) => {
    setIdentifying(true)
    setAiError(null)
    setAiResult(null)
    setScanStatus('AI is analyzing your item...')

    try {
      const resp = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })

      const data = await resp.json()

      if (!resp.ok) {
        setAiError(data.error || 'Identification failed')
        setScanStatus('')
        setIdentifying(false)
        return
      }

      const result: AIResult = data
      setAiResult(result)
      setScanStatus('')

      // Build scan data for the add-item screen
      const sd = {
        name: result.name,
        brand: result.brand,
        model: result.model,
        category: result.category,
        condition: result.condition,
        emoji: result.emoji,
        cost: 0,
        value: result.estimatedValue,
        asking: 0,
        photos: [dataUrl],
        source: 'ai-photo',
      }
      setScanData(sd)
      if (onScanData) onScanData(sd)
    } catch (e) {
      console.error('[scan] AI identify error:', e)
      setAiError('Failed to connect to AI. Check your connection.')
      setScanStatus('')
    }
    setIdentifying(false)
  }, [onScanData])

  // ─── Barcode Lookup ─────────────────
  const lookupBarcode = useCallback(async (code: string) => {
    setScanStatus('Looking up product...')
    setLookingUp(true)
    try {
      const resp = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`)
      const data = await resp.json()

      if (data.items && data.items.length > 0) {
        const product = data.items[0]
        const sd = {
          name: product.title || '',
          brand: product.brand || '',
          model: product.model || '',
          category: inferCategory(product.category || ''),
          cost: product.lowest_recorded_price ? parseFloat(product.lowest_recorded_price) : 0,
          value: product.highest_recorded_price ? parseFloat(product.highest_recorded_price) : 0,
          photos: (product.images || []).slice(0, 1),
          barcode: code,
          source: 'barcode',
        }
        setScanData(sd)
        setScanStatus('Product found! Review details below.')
        if (onScanData) onScanData(sd)
      } else {
        setScanStatus(`Barcode ${code} not found in database. Try photo mode or add manually.`)
      }
    } catch (e) {
      console.error('Barcode lookup error:', e)
      setScanStatus('Lookup failed. Check your connection and try again.')
    }
    setLookingUp(false)
  }, [onScanData])

  // Handle successful barcode scan
  const onScanSuccess = useCallback((result: any) => {
    if (hasScannedRef.current) return
    const text = typeof result === 'string' ? result : result?.[0]?.rawValue || result?.text || ''
    if (!text) return

    hasScannedRef.current = true
    setBarcodeScanning(false)
    setScanStatus(`Barcode found: ${text}`)
    lookupBarcode(text)
  }, [lookupBarcode])

  // ─── Photo Capture ─────────────────
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setCapturedPhoto(dataUrl)
      // Immediately send to AI for identification
      identifyPhoto(dataUrl)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleRetry = () => {
    if (capturedPhoto) {
      identifyPhoto(capturedPhoto)
    }
  }

  const handleReset = () => {
    setCapturedPhoto(null)
    setScanData(null)
    setAiResult(null)
    setAiError(null)
    setScanStatus('')
    hasScannedRef.current = false
  }

  const startScanning = () => {
    hasScannedRef.current = false
    setBarcodeScanning(true)
    setScanStatus('Point camera at barcode. Hold steady, about 6 inches away.')
    setScanData(null)
  }

  const stopScanning = () => {
    setBarcodeScanning(false)
    setScanStatus('Scanning stopped.')
  }

  const handleReview = () => {
    onNavigate('add-item')
  }

  // Confidence to label
  const confidenceLabel = (c: number) => {
    if (c >= 0.85) return { text: 'Very confident', color: 'text-green-400' }
    if (c >= 0.6) return { text: 'Pretty sure', color: 'text-amber-brand' }
    if (c >= 0.3) return { text: 'Best guess', color: 'text-orange-400' }
    return { text: 'Not sure', color: 'text-red-400' }
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between flex-shrink-0">
        <button onClick={() => onNavigate('home')} className="text-white hover:text-amber-brand transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-white font-heading">Scan Item</h1>
        <div className="w-6" />
      </div>

      {/* Mode Toggle */}
      <div className="px-6 py-3 flex gap-2 flex-shrink-0">
        {[
          { id: 'photo' as const, label: 'AI Photo', icon: Sparkles },
          { id: 'barcode' as const, label: 'Barcode', icon: Camera },
        ].map(m => {
          const Icon = m.icon
          return (
            <button
              key={m.id}
              onClick={() => {
                if (barcodeScanning) stopScanning()
                setScanMode(m.id)
                handleReset()
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                scanMode === m.id
                  ? 'bg-amber-brand/20 border border-amber-brand/40 text-amber-brand'
                  : 'glass text-white/60 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {m.label}
            </button>
          )
        })}
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        {scanMode === 'barcode' ? (
          /* ─── BARCODE MODE ─── */
          <div className="w-full max-w-80">
            {barcodeScanning && (
              <div className="w-full rounded-2xl overflow-hidden bg-black mb-4 relative" style={{ minHeight: 260 }}>
                <Scanner
                  onScan={onScanSuccess}
                  onError={(err: any) => {
                    console.error('Scanner error:', err)
                    const errStr = String(err)
                    if (errStr.includes('NotAllowed') || errStr.includes('Permission')) {
                      setScanStatus('Camera blocked. Allow camera access in your browser settings.')
                    } else if (errStr.includes('NotFound')) {
                      setScanStatus('No camera found on this device.')
                    } else {
                      setScanStatus('Camera error. Try refreshing or use photo mode.')
                    }
                    setBarcodeScanning(false)
                  }}
                  formats={['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf']}
                  components={{ torch: true }}
                  styles={{ container: { width: '100%', height: '260px' } }}
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-3/4 h-0.5 bg-amber-brand/60 animate-pulse rounded-full" />
                </div>
              </div>
            )}

            {!barcodeScanning && !scanData && !lookingUp && (
              <>
                <div className="w-full rounded-2xl overflow-hidden bg-black/40 mb-4 flex items-center justify-center border border-white/5" style={{ minHeight: 260 }}>
                  <div className="text-center">
                    <p className="text-4xl mb-2">📊</p>
                    <p className="text-dim text-sm">Scan UPC, EAN, QR codes</p>
                  </div>
                </div>
                <button
                  onClick={startScanning}
                  className="w-full gradient-amber rounded-xl py-4 font-bold text-black text-[15px]"
                >
                  Start Scanning
                </button>
              </>
            )}

            {lookingUp && (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-3 border-amber-brand/30 border-t-amber-brand rounded-full animate-spin mx-auto mb-4" />
                <p className="text-amber-brand text-sm font-semibold">Looking up product...</p>
              </div>
            )}

            {barcodeScanning && !lookingUp && (
              <div className="text-center">
                <p className="text-dim text-sm mb-3">Searching for barcode...</p>
                <button
                  onClick={stopScanning}
                  className="glass rounded-lg px-5 py-2 text-dim text-xs font-semibold hover:text-white transition-colors"
                >
                  Stop Scanning
                </button>
              </div>
            )}

            {scanData && scanData.source === 'barcode' && (
              <div className="glass rounded-2xl p-4 mt-2">
                {scanData.photos?.[0] && (
                  <img src={scanData.photos[0]} alt={scanData.name} className="w-20 h-20 rounded-xl object-cover mx-auto mb-3" />
                )}
                <p className="text-white font-bold text-sm text-center mb-1">{scanData.name || 'Unknown Product'}</p>
                {scanData.brand && <p className="text-dim text-xs text-center mb-2">{scanData.brand}</p>}
                <div className="flex gap-3 justify-center text-xs">
                  {scanData.cost > 0 && (
                    <span className="text-dim">Low: <span className="text-white font-semibold">${scanData.cost}</span></span>
                  )}
                  {scanData.value > 0 && (
                    <span className="text-dim">High: <span className="text-green-400 font-semibold">${scanData.value}</span></span>
                  )}
                </div>
                {scanData.category !== 'Other' && (
                  <p className="text-amber-brand text-xs text-center mt-2">{scanData.category}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ─── AI PHOTO MODE ─── */
          <div className="w-full max-w-80 text-center">
            {/* Initial state: no photo yet */}
            {!capturedPhoto && (
              <>
                <div className="w-52 h-52 rounded-3xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center mx-auto mb-6 bg-white/3">
                  <Sparkles size={40} className="text-amber-brand/60 mb-2" />
                  <p className="text-dim text-xs px-4">Snap a photo and AI identifies your item instantly</p>
                </div>

                <label className="block w-full gradient-amber rounded-xl py-4 font-bold text-black text-[15px] cursor-pointer hover:shadow-lg transition-shadow mb-2">
                  <span className="flex items-center justify-center gap-2">
                    <Camera size={18} />
                    Open Camera
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </label>

                <label className="block w-full glass rounded-xl py-3.5 font-semibold text-white text-sm cursor-pointer hover:bg-white/8 transition-colors">
                  <span className="flex items-center justify-center gap-2">
                    <Upload size={16} />
                    Choose from Gallery
                  </span>
                  <input type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" />
                </label>
              </>
            )}

            {/* Identifying: show photo + spinner */}
            {capturedPhoto && identifying && (
              <div>
                <div className="relative w-52 h-52 mx-auto mb-4">
                  <img
                    src={capturedPhoto}
                    alt="Captured"
                    className="w-full h-full rounded-2xl object-cover border border-white/10"
                  />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-black/40 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-amber-brand/30 border-t-amber-brand rounded-full animate-spin mb-2" />
                    <p className="text-amber-brand text-xs font-semibold">Identifying...</p>
                  </div>
                  {/* Scan line animation */}
                  <div className="absolute inset-x-4 top-0 h-full overflow-hidden rounded-2xl">
                    <div className="w-full h-0.5 bg-amber-brand/50 animate-pulse" style={{ animation: 'scanLine 2s ease-in-out infinite' }} />
                  </div>
                </div>
                <p className="text-dim text-xs">AI is analyzing your item...</p>
              </div>
            )}

            {/* AI Error */}
            {capturedPhoto && aiError && !identifying && (
              <div>
                <img
                  src={capturedPhoto}
                  alt="Captured"
                  className="w-44 h-44 rounded-2xl object-cover border border-white/10 mx-auto mb-4"
                />
                <div className="glass rounded-xl p-4 mb-4">
                  <p className="text-red-400 text-sm font-semibold mb-1">Couldn&apos;t identify</p>
                  <p className="text-dim text-xs">{aiError}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRetry}
                    className="flex-1 glass rounded-xl py-3 font-semibold text-white text-sm flex items-center justify-center gap-2 hover:bg-white/8 transition-colors"
                  >
                    <RefreshCw size={14} />
                    Retry
                  </button>
                  <button
                    onClick={() => {
                      // Still let them add manually with the photo
                      const sd = {
                        name: '',
                        brand: '',
                        model: '',
                        category: 'Other',
                        cost: 0,
                        value: 0,
                        photos: [capturedPhoto],
                        source: 'photo',
                      }
                      setScanData(sd)
                      if (onScanData) onScanData(sd)
                      onNavigate('add-item')
                    }}
                    className="flex-1 gradient-amber rounded-xl py-3 font-bold text-black text-sm"
                  >
                    Add Manually
                  </button>
                </div>
              </div>
            )}

            {/* AI Result: show identified product */}
            {capturedPhoto && aiResult && !identifying && !aiError && (
              <div>
                <div className="relative w-40 h-40 mx-auto mb-3">
                  <img
                    src={capturedPhoto}
                    alt="Captured"
                    className="w-full h-full rounded-2xl object-cover border-2 border-amber-brand/40"
                  />
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-brand flex items-center justify-center">
                    <Sparkles size={14} className="text-black" />
                  </div>
                </div>

                {/* Product card */}
                <div className="glass rounded-2xl p-4 text-left mb-3">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">{aiResult.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-[15px] leading-tight">{aiResult.name}</p>
                      {aiResult.brand && (
                        <p className="text-dim text-xs mt-0.5">{aiResult.brand}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-brand/15 text-amber-brand">
                      {aiResult.category}
                    </span>
                    <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white/8 text-white/70">
                      {aiResult.condition}
                    </span>
                    {aiResult.estimatedValue > 0 && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-green-500/15 text-green-400">
                        ~${aiResult.estimatedValue.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {aiResult.description && (
                    <p className="text-dim text-xs leading-relaxed">{aiResult.description}</p>
                  )}

                  {/* Confidence bar */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-brand transition-all"
                        style={{ width: `${Math.round(aiResult.confidence * 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold ${confidenceLabel(aiResult.confidence).color}`}>
                      {confidenceLabel(aiResult.confidence).text}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Message */}
      {scanStatus && !lookingUp && !identifying && (
        <div className="px-6 flex-shrink-0 mb-3">
          <div className="glass rounded-xl p-3.5 text-center">
            <p
              className={`text-sm ${
                scanStatus.includes('captured') || scanStatus.includes('found')
                  ? 'text-green-400'
                  : scanStatus.includes('blocked') || scanStatus.includes('failed') || scanStatus.includes('error')
                  ? 'text-red-400'
                  : 'text-amber-brand'
              }`}
            >
              {scanStatus}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="px-6 pb-8 flex-shrink-0 space-y-2">
        {scanData ? (
          <>
            <button
              onClick={handleReview}
              className="w-full gradient-amber rounded-xl py-4 font-bold text-black text-[15px] flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              Review & Save
            </button>
            <button
              onClick={handleReset}
              className="w-full glass rounded-xl py-3.5 font-semibold text-white text-sm hover:bg-white/8 transition-colors"
            >
              Scan Again
            </button>
          </>
        ) : !capturedPhoto && !identifying ? (
          <button
            onClick={() => onNavigate('add-item')}
            className="w-full glass rounded-xl py-3.5 font-semibold text-white text-sm hover:bg-white/8 transition-colors"
          >
            Skip, Add Manually
          </button>
        ) : null}
      </div>
    </div>
  )
}
