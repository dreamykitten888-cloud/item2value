'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useItemsStore } from '@/stores/items-store'
import AuthScreen from '@/components/auth-screen'
import AppShell from '@/components/app-shell'

export default function Home() {
  const user = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)
  const profileId = useAuthStore(s => s.profileId)

  // Initialize auth ONCE via the store (single source of truth)
  useEffect(() => {
    useAuthStore.getState().initialize()

    // Safety net: if loading is still true after 10s, force it off
    const safety = setTimeout(() => {
      if (useAuthStore.getState().loading) {
        console.warn('[page] Safety timeout: forcing loading=false after 10s')
        useAuthStore.setState({ loading: false })
      }
    }, 10000)

    return () => clearTimeout(safety)
  }, [])

  // Load items when profileId becomes available
  useEffect(() => {
    if (profileId) {
      useItemsStore.getState().loadAll(profileId).catch(() => {})
    }
  }, [profileId])

  // Still initializing
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full gradient-amber mx-auto mb-4 animate-pulse" />
          <p className="text-dim text-sm">Loading PrÄperty...</p>
          <p className="text-[10px] text-zinc-700 mt-4">v2.5.0-feb21</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return <AuthScreen />
  }

  // Authenticated
  return <AppShell />
}
