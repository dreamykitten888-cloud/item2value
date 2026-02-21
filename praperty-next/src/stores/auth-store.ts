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

    console.log('[auth] initialize: starting, window?', typeof window !== 'undefined')

    // Set up auth state change listener FIRST.
    // INITIAL_SESSION fires synchronously when the listener is registered,
    // which is more reliable than getSession() for restoring persisted sessions.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[auth] onAuthStateChange:', event, 'user:', session?.user?.email || 'none', 'loading:', get().loading)

      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          console.log('[auth] INITIAL_SESSION: restoring user', session.user.email)
          set({
            user: session.user,
            session,
            profile: fallbackProfile(session.user),
            loading: false,
          })
          get().loadProfile(session.user.id).catch(() => {})
        } else {
          console.log('[auth] INITIAL_SESSION: no session, showing auth screen')
          set({ loading: false })
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Only update if this is a NEW sign-in (not duplicate from signIn method)
        const current = get().user
        if (current?.id === session.user.id) {
          console.log('[auth] SIGNED_IN: same user, skipping duplicate')
          return
        }
        console.log('[auth] SIGNED_IN: new user', session.user.email)
        set({
          user: session.user,
          session,
          profile: get().profile || fallbackProfile(session.user),
          loading: false,
        })
        get().loadProfile(session.user.id).catch(() => {})
      } else if (event === 'SIGNED_OUT') {
        console.log('[auth] SIGNED_OUT: clearing state')
        set({ user: null, session: null, profile: null, profileId: null, loading: false })
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[auth] TOKEN_REFRESHED')
        set({ session })
      }
    })

    // Fallback: if onAuthStateChange hasn't resolved loading after 4s,
    // try getSession() directly as a safety net
    setTimeout(async () => {
      if (get().loading) {
        console.warn('[auth] Fallback: onAuthStateChange did not fire in 4s, trying getSession()')
        try {
          const { data: { session } } = await supabase.auth.getSession()
          console.log('[auth] Fallback getSession:', session?.user?.email || 'no session')
          if (session?.user && !get().user) {
            set({
              user: session.user,
              session,
              profile: fallbackProfile(session.user),
              loading: false,
            })
            get().loadProfile(session.user.id).catch(() => {})
          } else if (!get().user) {
            set({ loading: false })
          }
        } catch (e) {
          console.error('[auth] Fallback getSession failed:', e)
          set({ loading: false })
        }
      }
    }, 4000)
  },

  loadProfile: async (authUserId: string) => {
    console.log('[auth] loadProfile: fetching for auth_user_id:', authUserId)
    try {
      const { data, error } = await withTimeout(
        Promise.resolve(
          supabase
            .from('profiles')
            .select('id, name, email, created_at, last_login_at')
            .eq('auth_user_id', authUserId)
            .single()
        ),
        5000,
        'Load profile'
      ) as { data: Record<string, unknown> | null; error: { message: string } | null }

      if (error) {
        console.error('[auth] loadProfile error:', error.message)
        // Fallback: use auth_user_id as profileId so items can still load
        console.log('[auth] loadProfile: using auth_user_id as fallback profileId')
        set({ profileId: authUserId })
        return
      }
      if (data) {
        const profileData = data as Database['public']['Tables']['profiles']['Row']
        console.log('[auth] loadProfile: success, profileId:', profileData.id)
        set({
          profile: { name: profileData.name, email: profileData.email, createdAt: profileData.created_at },
          profileId: profileData.id,
        })
        // Update last login (fire and forget)
        const update: Database['public']['Tables']['profiles']['Update'] = { last_login_at: new Date().toISOString() }
        // @ts-ignore - Supabase type inference issue
        supabase.from('profiles').update(update).eq('id', profileData.id).then(() => {})
      } else {
        // No profile found, use auth_user_id as fallback
        console.log('[auth] loadProfile: no data, using auth_user_id as fallback profileId')
        set({ profileId: authUserId })
      }
    } catch (e) {
      console.error('[auth] loadProfile failed:', e)
      // Fallback: use auth_user_id as profileId so items can still load
      set({ profileId: authUserId })
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
    console.log('[auth] signIn: starting...')
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      8000,
      'Sign in'
    )
    console.log('[auth] signIn: got response, error:', error?.message || 'none', 'user:', data?.user?.email || 'null')
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
    console.log('[auth] signIn: state set, user should be visible to page.tsx now')

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
