import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PrÄperty - Track What You Own',
  description: 'E-Trade for your stuff. Track, value, and manage your personal inventory.',
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
      <head />
      <body className="antialiased">
        <main className="mx-auto max-w-md h-screen-safe relative overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  )
}
