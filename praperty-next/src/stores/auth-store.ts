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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  profileId: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        set({ user: session.user, session })
        // Set fallback profile immediately so we don't get stuck
        set({
          profile: { name: session.user.email?.split('@')[0] || 'User', email: session.user.email || '', createdAt: '' },
        })
        // Then try to load the real profile in the background
        get().loadProfile(session.user.id).catch((err) => {
          console.error('Profile load error:', err)
        })
      }
    } catch (e) {
      console.error('Auth init error:', e)
    }
    set({ loading: false })
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
      // Update last login (fire and forget, don't block)
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
      set({ user: authData.user, session: authData.session })
      await withTimeout(get().loadProfile(authData.user.id), 8000, 'Profile load')
    }
    return { hasSession }
  },

  signIn: async (email, password) => {
    set({ error: null })
    // No artificial timeout, just let Supabase do its thing
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    set({ user: data.user, session: data.session })
    // Load profile but don't block sign-in on it
    get().loadProfile(data.user.id).catch((profileErr) => {
      console.error('Profile load failed:', profileErr)
      set({
        profile: { name: data.user.email?.split('@')[0] || 'User', email: data.user.email || '', createdAt: '' },
      })
    })
    // Set fallback profile immediately so user isn't stuck
    if (!get().profile) {
      set({
        profile: { name: data.user.email?.split('@')[0] || 'User', email: data.user.email || '', createdAt: '' },
      })
    }
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
