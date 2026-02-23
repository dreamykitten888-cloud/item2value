import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use createClient with localStorage persistence.
// This keeps auth sessions alive across deploys and page reloads.
// @supabase/ssr's createBrowserClient uses cookies which can be
// unreliable for SPA-style apps and cause session loss on redeploy.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'praperty-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
