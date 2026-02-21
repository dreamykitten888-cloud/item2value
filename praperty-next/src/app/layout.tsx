import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PrÄperty - Track What You Own',
  description: 'E-Trade for your stuff. Track, value, and manage your personal inventory.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a1a2e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          // Unregister all service workers to prevent stale caching
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
              for (var r of regs) { r.unregister(); }
            });
          }
          // Clear old caches
          if ('caches' in window) {
            caches.keys().then(function(names) {
              for (var n of names) { caches.delete(n); }
            });
          }
        `}} />
      </head>
      <body className="antialiased">
        <main className="mx-auto max-w-md h-screen-safe relative overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  )
}
