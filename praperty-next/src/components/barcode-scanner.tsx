'use client'

import { useEffect, useRef, useState } from 'react'

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
  const scannerRef = useRef<any>(null)
  const [ready, setReady] = useState(false)
  // Unique ID per mount to avoid stale DOM element references
  const idRef = useRef(`barcode-reader-${Math.random().toString(36).slice(2, 8)}`)

  // Keep latest callbacks in refs so useEffect doesn't re-fire
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)
  onScanRef.current = onScan
  onErrorRef.current = onError

  useEffect(() => {
    if (!active) return

    let cancelled = false
    let mounted = true
    const elementId = idRef.current

    // Give DOM one tick to mount the container
    const timer = setTimeout(async () => {
      if (cancelled) return

      const el = document.getElementById(elementId)
      if (!el) {
        console.error('[BarcodeScanner] container not found:', elementId)
        onErrorRef.current('Scanner failed to initialize. Try refreshing.')
        return
      }

      try {
        // Verify camera exists before initializing scanner
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          onErrorRef.current('Camera not supported on this device/browser.')
          return
        }

        // Dynamically import (client-side only)
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        // Clean up any previous scanner
        if (scannerRef.current) {
          try { await scannerRef.current.stop() } catch {}
          try { scannerRef.current.clear() } catch {}
          scannerRef.current = null
        }

        const scanner = new Html5Qrcode(elementId, { verbose: false })
        scannerRef.current = scanner

        console.log('[BarcodeScanner] Starting camera...')

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              // Responsive scan box: 80% width, 45% height
              return {
                width: Math.floor(viewfinderWidth * 0.8),
                height: Math.floor(viewfinderHeight * 0.45),
              }
            },
            aspectRatio: 1.333,
            disableFlip: false,
          },
          (decodedText: string) => {
            console.log('[BarcodeScanner] Scanned:', decodedText)
            onScanRef.current(decodedText)
          },
          () => {
            // Per-frame "not found" - intentionally ignored
          }
        )

        console.log('[BarcodeScanner] Camera started successfully')
        if (mounted) setReady(true)
      } catch (err: any) {
        if (cancelled) return
        const msg = String(err?.message || err)
        console.error('[BarcodeScanner] Error:', msg)

        if (msg.includes('NotAllowed') || msg.includes('Permission')) {
          onErrorRef.current('Camera blocked. Allow camera access in your browser settings.')
        } else if (msg.includes('NotFound') || msg.includes('Requested device not found')) {
          onErrorRef.current('No camera found on this device.')
        } else if (msg.includes('NotReadableError') || msg.includes('in use')) {
          onErrorRef.current('Camera is in use by another app. Close it and try again.')
        } else {
          onErrorRef.current(`Camera error: ${msg.slice(0, 80)}`)
        }
      }
    }, 200) // 200ms for safer DOM mount timing

    return () => {
      cancelled = true
      mounted = false
      clearTimeout(timer)

      const s = scannerRef.current
      if (s) {
        scannerRef.current = null
        // Stop is async; fire and forget on cleanup
        s.stop()
          .then(() => { try { s.clear() } catch {} })
          .catch(() => { try { s.clear() } catch {} })
      }
      setReady(false)
    }
  }, [active])

  return (
    <div className="w-full rounded-2xl bg-black relative" style={{ minHeight: 260 }}>
      {/* Scanner target element - html5-qrcode injects video here */}
      <div
        id={idRef.current}
        className="w-full"
        style={{ minHeight: 260 }}
      />

      {/* Scan line overlay when camera is active */}
      {ready && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-3/4 h-0.5 bg-amber-brand/60 animate-pulse rounded-full" />
        </div>
      )}

      {/* Loading state before camera starts */}
      {!ready && active && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-amber-brand/30 border-t-amber-brand rounded-full animate-spin mx-auto mb-2" />
            <p className="text-white/50 text-xs">Opening camera...</p>
          </div>
        </div>
      )}

      {/*
        Override html5-qrcode default styles.
        Using a regular style tag (not styled-jsx) for reliability with dynamic imports.
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        #${idRef.current} {
          border: none !important;
          padding: 0 !important;
          overflow: hidden;
          border-radius: 1rem;
        }
        #${idRef.current} video {
          border-radius: 1rem !important;
          object-fit: cover !important;
        }
        #${idRef.current} img[alt="Info"] {
          display: none !important;
        }
        #${idRef.current}__dashboard,
        #${idRef.current}__dashboard_section,
        #${idRef.current}__dashboard_section_csr,
        #${idRef.current}__dashboard_section_fsr,
        #${idRef.current}__status_span,
        #${idRef.current}__header_message {
          display: none !important;
        }
      `}} />
    </div>
  )
}
