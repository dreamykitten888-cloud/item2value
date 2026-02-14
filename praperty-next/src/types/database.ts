// Auto-generated types for Supabase schema
// Regenerate with: npx supabase gen types typescript --project-id tzasuddushojjurbzqfe > src/types/database.ts

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          auth_user_id: string | null
          name: string
          email: string
          created_at: string
          updated_at: string | null
          last_login_at: string | null
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          name: string
          email: string
          created_at?: string
          updated_at?: string | null
          last_login_at?: string | null
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          name?: string
          email?: string
          updated_at?: string | null
          last_login_at?: string | null
        }
      }
      items: {
        Row: {
          id: string
          user_id: string
          name: string
          brand: string
          model: string
          category: string
          condition: string
          cost: number
          asking: number
          value: number
          earnings: number | null
          emoji: string
          notes: string
          date_purchased: string | null
          date_sold: string | null
          sold_platform: string | null
          photos: string // JSON string
          comps: string // JSON string
          price_history: string // JSON string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          brand?: string
          model?: string
          category?: string
          condition?: string
          cost?: number
          asking?: number
          value?: number
          earnings?: number | null
          emoji?: string
          notes?: string
          date_purchased?: string | null
          date_sold?: string | null
          sold_platform?: string | null
          photos?: string
          comps?: string
          price_history?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['items']['Insert']>
      }
      watchlist: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          emoji: string
          brand: string
          model: string
          target_price: number
          last_known_price: number
          price_history: string // JSON string
          added_at: string
          linked_item_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category?: string
          emoji?: string
          brand?: string
          model?: string
          target_price?: number
          last_known_price?: number
          price_history?: string
          added_at?: string
          linked_item_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['watchlist']['Insert']>
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          event_data: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          event_data?: Record<string, unknown> | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['analytics_events']['Insert']>
      }
    }
  }
}
