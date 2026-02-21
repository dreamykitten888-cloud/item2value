import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use @supabase/ssr's createBrowserClient which is designed for Next.js.
// It correctly handles localStorage persistence in browser and avoids
// SSR issues where window/localStorage don't exist.
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
