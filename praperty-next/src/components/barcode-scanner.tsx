'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  onScan: (text: string) => void
  onError: (err: string) => void
  active: boolean
}

/**
 * Barcode scanner using html5-qrcode.
 * Renders a camera viewfinder and fires onScan with the decoded text.
 * Supports UPC-A, UPC-E, EAN-13, EAN-8, Code 128, Code 39, ITF, QR.
 */
export default function BarcodeScanner({ onScan, onError, active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<any>(null)
  const [ready, setReady] = useState(false)

  // Use refs for callbacks so useEffect doesn't re-fire on every render
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)
  onScanRef.current = onScan
  onErrorRef.current = onError

  useEffect(() => {
    if (!active) return

    // Small delay to ensure the DOM element is mounted
    const timer = setTimeout(() => {
      const el = document.getElementById('barcode-reader')
      if (!el) {
        console.error('[BarcodeScanner] container element not found')
        return
      }
      startScanner()
    }, 100)

    let cancelled = false

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')

        if (cancelled) return

        // Make sure we don't double-init
        if (scannerRef.current) {
          try { await scannerRef.current.stop() } catch {}
          try { scannerRef.current.clear() } catch {}
          scannerRef.current = null
        }

        const scanner = new Html5Qrcode('barcode-reader', { verbose: false })
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.5,
            disableFlip: false,
          },
          (decodedText: string) => {
            // Use ref so we always call the latest callback
            onScanRef.current(decodedText)
          },
          () => {
            // Intentionally empty: ignore per-frame "not found" errors
          }
        )

        if (!cancelled) setReady(true)
      } catch (err: any) {
        if (cancelled) return
        const msg = String(err)
        console.error('[BarcodeScanner] init error:', msg)
        if (msg.includes('NotAllowed') || msg.includes('Permission')) {
          onErrorRef.current('Camera blocked. Allow camera access in your browser settings.')
        } else if (msg.includes('NotFound') || msg.includes('Requested device not found')) {
          onErrorRef.current('No camera found on this device.')
        } else {
          onErrorRef.current('Camera error. Try refreshing or use photo mode.')
        }
      }
    }

    return () => {
      cancelled = true
      clearTimeout(timer)
      const s = scannerRef.current
      if (s) {
        s.stop()
          .then(() => { try { s.clear() } catch {} })
          .catch(() => { try { s.clear() } catch {} })
        scannerRef.current = null
      }
      setReady(false)
    }
  }, [active]) // Only depend on active, NOT on callbacks

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-black relative" style={{ minHeight: 260 }}>
      <div
        id="barcode-reader"
        ref={containerRef}
        className="w-full"
        style={{ minHeight: 260 }}
      />
      {/* Scan line overlay */}
      {ready && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-3/4 h-0.5 bg-amber-brand/60 animate-pulse rounded-full" />
        </div>
      )}
      {/* Hide html5-qrcode's default UI chrome */}
      <style jsx global>{`
        #barcode-reader video {
          border-radius: 1rem !important;
          object-fit: cover !important;
        }
        #barcode-reader {
          border: none !important;
          padding: 0 !important;
        }
        #barcode-reader__scan_region {
          min-height: 260px;
        }
        #barcode-reader__scan_region > img,
        #barcode-reader__dashboard,
        #barcode-reader__dashboard_section,
        #barcode-reader__dashboard_section_csr,
        #barcode-reader__dashboard_section_fsr,
        #barcode-reader__status_span,
        #barcode-reader__header_message {
          display: none !important;
        }
      `}</style>
    </div>
  )
}
