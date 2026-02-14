'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useItemsStore } from '@/stores/items-store'
import { supabase } from '@/lib/supabase'
import AuthScreen from '@/components/auth-screen'
import AppShell from '@/components/app-shell'

export default function Home() {
  const { user, loading, profile, profileId, initialize, loadProfile } = useAuthStore()
  const { loadAll } = useItemsStore()

  // Initialize auth on mount
  useEffect(() => {
    initialize()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await loadProfile(session.user.id)
          const pid = useAuthStore.getState().profileId
          if (pid) await loadAll(pid)
        } catch (e) {
          console.error('Auth change error:', e)
        }
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, session: null, profile: null, profileId: null })
        useItemsStore.setState({ items: [], watchlist: [] })
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  // Load items when profileId is set
  useEffect(() => {
    if (profileId) loadAll(profileId)
  }, [profileId])

  // Loading spinner
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full gradient-amber mx-auto mb-4 animate-pulse" />
          <p className="text-dim text-sm">Loading PrÄperty...</p>
        </div>
      </div>
    )
  }

  // Not authenticated: show auth screen
  if (!user || !profile) {
    return <AuthScreen />
  }

  // Authenticated: show main app
  return <AppShell />
}
