'use client'

import { useState, useRef } from 'react'
import { ArrowLeft, Camera, Upload } from 'lucide-react'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onScanData?: (data: any) => void
}

export default function ScanScreen({ onNavigate, onScanData }: Props) {
  const [scanMode, setScanMode] = useState<'photo' | 'barcode'>('photo')
  const [scanData, setScanData] = useState<any>(null)
  const [barcodeScanning, setBarcodeScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState('')
  const scannerRef = useRef(null)

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

  const handleBarcodeScan = () => {
    setBarcodeScanning(true)
    setScanStatus('Starting camera...')
    // Note: For html5-qrcode integration, you'll need to:
    // 1. Add the script to layout.tsx
    // 2. Initialize Html5Qrcode here
    // For now, we'll show the UI but note that setup is needed
    setScanStatus('Camera scanning ready (html5-qrcode needs layout.tsx setup)')
  }

  const handleStopScanning = () => {
    setBarcodeScanning(false)
    setScanStatus('Scanning stopped.')
  }

  const handleSkip = () => {
    if (scanData) {
      onNavigate('add-item')
    } else {
      onNavigate('add-item')
    }
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
          { id: 'photo', label: 'Take Photo', icon: '📸' },
          { id: 'barcode', label: 'Scan Barcode', icon: '📊' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => {
              setScanMode(m.id as 'photo' | 'barcode')
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
            <div
              id="barcode-reader"
              className="w-full rounded-2xl overflow-hidden bg-black min-h-64 relative mb-4"
            />

            {!barcodeScanning && !scanData && (
              <button
                onClick={handleBarcodeScan}
                className="w-full gradient-amber rounded-xl py-4 font-bold text-black text-[15px]"
              >
                Start Scanning
              </button>
            )}

            {barcodeScanning && (
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-amber-brand/30 border-t-amber-brand rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-3">Searching for barcode...</p>
                <button
                  onClick={handleStopScanning}
                  className="bg-white/8 border border-white/15 rounded-lg px-5 py-2 text-slate-400 text-xs font-semibold hover:bg-white/12"
                >
                  Stop Scanning
                </button>
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
      {scanStatus && (
        <div className="px-6 flex-shrink-0 mb-3">
          <div className="bg-white/6 rounded-xl p-3.5 text-center">
            <p
              className={`text-sm ${
                scanStatus.includes('captured') || scanStatus.includes('found')
                  ? 'text-green-400'
                  : scanStatus.includes('denied') || scanStatus.includes('failed')
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
              }}
              className="w-full bg-white/6 border border-white/10 rounded-xl py-3.5 font-semibold text-white text-sm hover:bg-white/10 transition-colors"
            >
              Scan Again
            </button>
          </>
        ) : (
          <button
            onClick={handleSkip}
            className="w-full bg-white/6 border border-white/10 rounded-xl py-3.5 font-semibold text-white text-sm hover:bg-white/10 transition-colors"
          >
            Skip, Add Manually
          </button>
        )}
      </div>
    </div>
  )
}
