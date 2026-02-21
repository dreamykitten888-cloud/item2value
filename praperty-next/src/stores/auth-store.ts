import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import type { Database } from '@/types/database'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  profileId: string | null
  loading: boolean
  initialized: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<{ hasSession: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  setError: (error: string | null) => void
  loadProfile: (authUserId: string) => Promise<void>
}

// Helper: wrap any promise with a timeout
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    promise
      .then(val => { clearTimeout(timer); resolve(val) })
      .catch(err => { clearTimeout(timer); reject(err) })
  })
}

function fallbackProfile(user: User): Profile {
  return {
    name: user.email?.split('@')[0] || 'User',
    email: user.email || '',
    createdAt: '',
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  profileId: null,
  loading: true,
  initialized: false,
  error: null,

  initialize: async () => {
    // Prevent double-init
    if (get().initialized) return
    set({ initialized: true })

    try {
      const { data: { session } } = await withTimeout(
        supabase.auth.getSession(),
        5000,
        'Session check'
      )
      if (session?.user) {
        set({
          user: session.user,
          session,
          profile: fallbackProfile(session.user),
          loading: false,
        })
        // Load real profile in background (non-blocking)
        get().loadProfile(session.user.id).catch(() => {})
      } else {
        set({ loading: false })
      }
    } catch (e) {
      console.error('Auth init error:', e)
      set({ loading: false })
    }

    // Set up auth state change listener ONCE, inside the store
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Only update if we don't already have this user set
        // (avoids double-fire during signIn)
        const current = get().user
        if (current?.id === session.user.id) return

        set({
          user: session.user,
          session,
          profile: get().profile || fallbackProfile(session.user),
          loading: false,
        })
        get().loadProfile(session.user.id).catch(() => {})
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, session: null, profile: null, profileId: null, loading: false })
      } else if (event === 'TOKEN_REFRESHED' && session) {
        set({ session })
      }
    })
  },

  loadProfile: async (authUserId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, created_at, last_login_at')
      .eq('auth_user_id', authUserId)
      .single()

    if (error) throw error
    if (data) {
      const profileData = data as Database['public']['Tables']['profiles']['Row']
      set({
        profile: { name: profileData.name, email: profileData.email, createdAt: profileData.created_at },
        profileId: profileData.id,
      })
      // Update last login (fire and forget)
      const update: Database['public']['Tables']['profiles']['Update'] = { last_login_at: new Date().toISOString() }
      // @ts-ignore - Supabase type inference issue
      supabase.from('profiles').update(update).eq('id', profileData.id).then(() => {})
    }
  },

  signUp: async (email, password, name) => {
    set({ error: null })
    const { data: authData, error: authErr } = await withTimeout(
      supabase.auth.signUp({ email, password, options: { data: { name } } }),
      15000,
      'Sign up'
    )
    if (authErr) throw authErr

    const hasSession = !!authData.session
    if (hasSession && authData.user) {
      await new Promise(r => setTimeout(r, 500)) // Let DB trigger create profile
      set({
        user: authData.user,
        session: authData.session,
        profile: fallbackProfile(authData.user),
        loading: false,
      })
      // Load real profile in background
      get().loadProfile(authData.user.id).catch(() => {})
    }
    return { hasSession }
  },

  signIn: async (email, password) => {
    set({ error: null })
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      8000,
      'Sign in'
    )
    if (error) throw error

    // Set EVERYTHING in one atomic call. This is the key fix.
    // page.tsx checks `user` to decide what to render, so setting user
    // here guarantees React re-renders to AppShell immediately.
    set({
      user: data.user,
      session: data.session,
      profile: fallbackProfile(data.user),
      loading: false,
    })

    // Load real profile in background (non-blocking, non-critical)
    get().loadProfile(data.user.id).catch(() => {})
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null, session: null, profile: null, profileId: null })
  },

  sendMagicLink: async (email) => {
    set({ error: null })
    const { error } = await withTimeout(
      supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } }),
      15000,
      'Magic link'
    )
    if (error) throw error
  },

  resetPassword: async (email) => {
    set({ error: null })
    const { error } = await withTimeout(
      supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }),
      15000,
      'Password reset'
    )
    if (error) throw error
  },

  setError: (error) => set({ error }),
}))
