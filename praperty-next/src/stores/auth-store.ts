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
        await get().loadProfile(session.user.id)
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
      // Update last login
      const update: Database['public']['Tables']['profiles']['Update'] = { last_login_at: new Date().toISOString() }
      // @ts-ignore - Supabase type inference issue
      await supabase.from('profiles').update(update).eq('id', profileData.id)
    }
  },

  signUp: async (email, password, name) => {
    set({ error: null })
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (authErr) throw authErr

    const hasSession = !!authData.session
    if (hasSession && authData.user) {
      // Email confirmation disabled: user is authenticated
      await new Promise(r => setTimeout(r, 500)) // Let DB trigger create profile
      set({ user: authData.user, session: authData.session })
      await get().loadProfile(authData.user.id)
    }
    return { hasSession }
  },

  signIn: async (email, password) => {
    set({ error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    set({ user: data.user, session: data.session })
    await get().loadProfile(data.user.id)
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null, session: null, profile: null, profileId: null })
  },

  sendMagicLink: async (email) => {
    set({ error: null })
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  },

  resetPassword: async (email) => {
    set({ error: null })
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) throw error
  },

  setError: (error) => set({ error }),
}))
