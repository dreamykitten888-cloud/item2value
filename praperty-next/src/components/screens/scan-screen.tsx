'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowLeft, Camera, Upload } from 'lucide-react'
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

// Category mapping from product database categories
const CAT_MAP: Record<string, string> = {
  apparel: 'Fashion', clothing: 'Fashion', shoes: 'Fashion', fashion: 'Fashion',
  electronics: 'Electronics', computers: 'Electronics', phone: 'Electronics', phones: 'Electronics',
  home: 'Home', kitchen: 'Home', garden: 'Home', furniture: 'Home',
  sports: 'Sports', outdoors: 'Sports', fitness: 'Sports',
  toys: 'Toys', games: 'Toys',
  books: 'Books', media: 'Books',
  automotive: 'Automotive', car: 'Automotive',
  tools: 'Tools', hardware: 'Tools',
  jewelry: 'Jewelry', watches: 'Jewelry',
  music: 'Music', instruments: 'Music',
  art: 'Art', collectibles: 'Art',
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
  const hasScannedRef = useRef(false)

  // Reset scanned flag when switching modes or starting new scan
  useEffect(() => {
    if (!barcodeScanning) hasScannedRef.current = false
  }, [barcodeScanning])

  // Barcode product lookup via UPCitemdb (free, no key needed)
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
    if (hasScannedRef.current) return // prevent duplicate scans
    const text = typeof result === 'string' ? result : result?.[0]?.rawValue || result?.text || ''
    if (!text) return

    hasScannedRef.current = true
    setBarcodeScanning(false)
    setScanStatus(`Barcode found: ${text}`)
    lookupBarcode(text)
  }, [lookupBarcode])

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanStatus('Processing photo...')

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      const newScanData = {
        name: '',
        brand: '',
        model: '',
        category: 'Other',
        cost: 0,
        value: 0,
        photos: [dataUrl],
        source: 'photo',
      }
      setScanData(newScanData)
      setScanStatus('Photo captured! Add details and save.')
      if (onScanData) onScanData(newScanData)
    }

    reader.readAsDataURL(file)
    e.target.value = ''
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

  return (
    <div className="h-full bg-dark flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between flex-shrink-0 border-b border-white/5">
        <button onClick={() => onNavigate('home')} className="text-white hover:text-amber-brand">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-white">Scan Item</h1>
        <div className="w-6" />
      </div>

      {/* Mode Toggle */}
      <div className="px-6 py-4 flex gap-2 flex-shrink-0">
        {[
          { id: 'photo' as const, label: 'Take Photo', icon: '📸' },
          { id: 'barcode' as const, label: 'Scan Barcode', icon: '📊' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => {
              if (barcodeScanning) stopScanning()
              setScanMode(m.id)
              setScanStatus('')
              setScanData(null)
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              scanMode === m.id
                ? 'bg-amber-brand/20 border-2 border-amber-brand text-amber-brand'
                : 'bg-white/4 border border-white/10 text-slate-400 hover:bg-white/8'
            }`}
          >
            <span className="text-lg">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        {scanMode === 'barcode' ? (
          <div className="w-full max-w-80">
            {/* Live scanner view */}
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
                {/* Scan line animation overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-3/4 h-0.5 bg-amber-brand/60 animate-pulse rounded-full" />
                </div>
              </div>
            )}

            {/* Placeholder when not scanning */}
            {!barcodeScanning && !scanData && !lookingUp && (
              <>
                <div className="w-full rounded-2xl overflow-hidden bg-black mb-4 flex items-center justify-center" style={{ minHeight: 260 }}>
                  <div className="text-center">
                    <p className="text-4xl mb-2">📊</p>
                    <p className="text-slate-500 text-sm">Scan UPC, EAN, QR codes</p>
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

            {/* Loading during lookup */}
            {lookingUp && (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-3 border-amber-brand/30 border-t-amber-brand rounded-full animate-spin mx-auto mb-4" />
                <p className="text-amber-brand text-sm font-semibold">Looking up product...</p>
              </div>
            )}

            {/* Scanning indicator */}
            {barcodeScanning && !lookingUp && (
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-3">Searching for barcode...</p>
                <button
                  onClick={stopScanning}
                  className="bg-white/8 border border-white/15 rounded-lg px-5 py-2 text-slate-400 text-xs font-semibold hover:bg-white/12"
                >
                  Stop Scanning
                </button>
              </div>
            )}

            {/* Product found from barcode */}
            {scanData && scanData.source === 'barcode' && (
              <div className="glass rounded-2xl p-4 mt-2">
                {scanData.photos?.[0] && (
                  <img src={scanData.photos[0]} alt={scanData.name} className="w-20 h-20 rounded-xl object-cover mx-auto mb-3" />
                )}
                <p className="text-white font-bold text-sm text-center mb-1">{scanData.name || 'Unknown Product'}</p>
                {scanData.brand && <p className="text-slate-400 text-xs text-center mb-2">{scanData.brand}</p>}
                <div className="flex gap-3 justify-center text-xs">
                  {scanData.cost > 0 && (
                    <span className="text-slate-400">Low: <span className="text-white font-semibold">${scanData.cost}</span></span>
                  )}
                  {scanData.value > 0 && (
                    <span className="text-slate-400">High: <span className="text-green-400 font-semibold">${scanData.value}</span></span>
                  )}
                </div>
                {scanData.category !== 'Other' && (
                  <p className="text-amber-brand text-xs text-center mt-2">{scanData.category}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-80 text-center">
            {!scanData ? (
              <>
                <div className="w-52 h-52 rounded-3xl border-3 border-dashed border-white/15 flex flex-col items-center justify-center mx-auto mb-6 bg-white/3">
                  <Camera size={48} className="text-slate-600 mb-2" />
                  <p className="text-slate-600 text-xs">Take a photo of your item</p>
                </div>

                <label className="block w-full gradient-amber rounded-xl py-4 font-bold text-black text-[15px] cursor-pointer hover:shadow-lg transition-shadow mb-2">
                  Open Camera
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </label>

                <label className="block w-full bg-white/6 border border-white/10 rounded-xl py-3.5 font-semibold text-white text-sm cursor-pointer hover:bg-white/10 transition-colors">
                  <span className="flex items-center justify-center gap-2">
                    <Upload size={16} />
                    Choose from Gallery
                  </span>
                  <input type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" />
                </label>
              </>
            ) : scanData.source === 'photo' && (
              <div>
                <img
                  src={scanData.photos[0]}
                  alt="Captured"
                  className="w-52 h-52 rounded-2xl object-cover border-2 border-amber-brand mx-auto mb-4 block"
                />
                <p className="text-green-400 font-semibold mb-1">Photo captured!</p>
                <p className="text-slate-400 text-xs">Your photo will be the cover image. Add details on the next screen.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Message */}
      {scanStatus && !lookingUp && (
        <div className="px-6 flex-shrink-0 mb-3">
          <div className="bg-white/6 rounded-xl p-3.5 text-center">
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
              className="w-full gradient-amber rounded-xl py-4 font-bold text-black text-[15px]"
            >
              Review & Save →
            </button>
            <button
              onClick={() => {
                setScanData(null)
                setScanStatus('')
                hasScannedRef.current = false
              }}
              className="w-full bg-white/6 border border-white/10 rounded-xl py-3.5 font-semibold text-white text-sm hover:bg-white/10 transition-colors"
            >
              Scan Again
            </button>
          </>
        ) : (
          <button
            onClick={() => onNavigate('add-item')}
            className="w-full bg-white/6 border border-white/10 rounded-xl py-3.5 font-semibold text-white text-sm hover:bg-white/10 transition-colors"
          >
            Skip, Add Manually
          </button>
        )}
      </div>
    </div>
  )
}
