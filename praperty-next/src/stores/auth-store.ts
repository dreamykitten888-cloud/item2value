import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import type { Database } from '@/types/database'

// Top-level log: fires on module load, proves this version is running
console.log('[auth-store] v2.5.0 MODULE LOADED at', new Date().toISOString())

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  profileId: string | null
  loading: boolean
  initialized: boolean
  error: string | null

  // Actions
  initialize: () => void
  signUp: (email: string, password: string, name: string) => Promise<{ hasSession: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  setError: (error: string | null) => void
  loadProfile: (authUserId: string) => Promise<void>
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

  initialize: () => {
    // Prevent double-init
    if (get().initialized) return
    set({ initialized: true })

    console.log('[auth] v2.2: initialize, window=', typeof window !== 'undefined')

    // Register auth state change listener
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('[auth] v2.3 event:', event, 'user:', session?.user?.email || 'none')

      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          console.log('[auth] INITIAL_SESSION: restoring', session.user.email)
          set({
            user: session.user,
            session,
            profile: fallbackProfile(session.user),
            loading: false,
          })
          get().loadProfile(session.user.id).catch(() => {})
        } else {
          console.log('[auth] INITIAL_SESSION: no session')
          set({ loading: false })
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        const current = get().user
        if (current?.id === session.user.id) return
        console.log('[auth] SIGNED_IN:', session.user.email)
        set({
          user: session.user,
          session,
          profile: get().profile || fallbackProfile(session.user),
          loading: false,
        })
        get().loadProfile(session.user.id).catch(() => {})
      } else if (event === 'SIGNED_OUT') {
        console.log('[auth] SIGNED_OUT')
        set({ user: null, session: null, profile: null, profileId: null, loading: false })
      } else if (event === 'TOKEN_REFRESHED' && session) {
        set({ session })
      }
    })

    // Backup: if onAuthStateChange hasn't resolved in 2s, try getSession directly
    setTimeout(async () => {
      if (!get().loading) return // Already resolved
      console.warn('[auth] v2.3 backup: onAuthStateChange slow, trying getSession')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (get().loading) { // Still not resolved
          if (session?.user) {
            console.log('[auth] backup: found session for', session.user.email)
            set({ user: session.user, session, profile: fallbackProfile(session.user), loading: false })
            get().loadProfile(session.user.id).catch(() => {})
          } else {
            console.log('[auth] backup: no session')
            set({ loading: false })
          }
        }
      } catch (e) {
        console.error('[auth] backup getSession failed:', e)
        if (get().loading) set({ loading: false })
      }
    }, 2000)
  },

  loadProfile: async (authUserId: string) => {
    console.log('[auth] loadProfile:', authUserId)
    try {
      const result = await supabase
        .from('profiles')
        .select('id, name, email, created_at, last_login_at')
        .eq('auth_user_id', authUserId)
        .single()

      const data = result.data as { id: string; name: string; email: string; created_at: string; last_login_at: string } | null
      const error = result.error

      if (error && error.code === 'PGRST116') {
        // No profile row exists yet: auto-create one
        console.log('[auth] No profile found, auto-creating for', authUserId)
        const user = get().user
        const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
        const userEmail = user?.email || ''

        const { data: newProfile, error: insertErr } = await supabase
          .from('profiles')
          .insert({
            auth_user_id: authUserId,
            name: userName,
            email: userEmail,
          } as never)
          .select('id, name, email, created_at')
          .single()

        if (insertErr) {
          console.error('[auth] Auto-create profile failed:', insertErr.message)
          set({ profileId: authUserId })
          return
        }
        if (newProfile) {
          const np = newProfile as { id: string; name: string; email: string; created_at: string }
          console.log('[auth] Auto-created profile, id:', np.id)
          set({
            profile: { name: np.name, email: np.email, createdAt: np.created_at },
            profileId: np.id,
          })
        } else {
          set({ profileId: authUserId })
        }
        return
      }

      if (error) {
        console.error('[auth] loadProfile error:', error.message)
        set({ profileId: authUserId })
        return
      }
      if (data) {
        console.log('[auth] loadProfile ok, id:', data.id)
        set({
          profile: { name: data.name, email: data.email, createdAt: data.created_at },
          profileId: data.id,
        })
        // Update last login (fire and forget)
        supabase.from('profiles')
          .update({ last_login_at: new Date().toISOString() } as never)
          .eq('id', data.id as never)
          .then(() => {})
      } else {
        set({ profileId: authUserId })
      }
    } catch (e) {
      console.error('[auth] loadProfile failed:', e)
      set({ profileId: authUserId })
    }
  },

  signUp: async (email, password, name) => {
    set({ error: null })
    console.log('[auth] signUp starting for', email)
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email, password, options: { data: { name } },
    })
    if (authErr) throw authErr

    // Check if Supabase returned an existing user with no identities (fake signup)
    // This happens when someone tries to sign up with an email that already exists
    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      throw new Error('An account with this email already exists. Try signing in instead.')
    }

    const hasSession = !!authData.session
    console.log('[auth] signUp result: hasSession=', hasSession, 'user=', authData.user?.email)

    if (hasSession && authData.user) {
      await new Promise(r => setTimeout(r, 500))
      set({
        user: authData.user,
        session: authData.session,
        profile: { name, email, createdAt: '' },
        loading: false,
      })
      // loadProfile will auto-create the profile row
      get().loadProfile(authData.user.id).catch(() => {})
    }
    return { hasSession }
  },

  signIn: async (email, password) => {
    set({ error: null })
    console.log('[auth] signIn starting')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    console.log('[auth] signIn ok:', data.user.email)
    set({
      user: data.user,
      session: data.session,
      profile: fallbackProfile(data.user),
      loading: false,
    })
    get().loadProfile(data.user.id).catch(() => {})
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null, session: null, profile: null, profileId: null })
  },

  sendMagicLink: async (email) => {
    set({ error: null })
    const { error } = await supabase.auth.signInWithOtp({
      email, options: { emailRedirectTo: window.location.origin },
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
