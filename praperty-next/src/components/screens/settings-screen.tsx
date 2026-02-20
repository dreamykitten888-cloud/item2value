'use client'

import { LogOut, User, Mail, Calendar, BookOpen } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useItemsStore } from '@/stores/items-store'
import { fmt } from '@/lib/utils'
import type { Screen } from '@/types'

interface Props {
  onNavigate: (screen: Screen) => void
}

export default function SettingsScreen({ onNavigate }: Props) {
  const { profile, signOut } = useAuthStore()
  const { items, watchlist } = useItemsStore()

  const userName = profile?.name || 'User'
  const userInitial = userName.charAt(0).toUpperCase()
  const activeItems = items.filter(i => !i.dateSold)
  const soldItems = items.filter(i => !!i.dateSold)
  const totalValue = activeItems.reduce((sum, i) => sum + (i.value || 0), 0)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (e) {
      console.error('Sign out error:', e)
    }
  }

  return (
    <div className="h-full overflow-y-auto scroll-hide pb-24">
      <div className="px-6 pt-8">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

        {/* Profile card */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-[72px] h-[72px] rounded-full gradient-amber flex items-center justify-center text-[28px] font-bold text-black mb-3.5">
              {userInitial}
            </div>
            <h2 className="text-[22px] font-bold text-white">{userName}</h2>
            {profile?.email && (
              <p className="text-dim text-sm mt-1 flex items-center gap-1.5">
                <Mail size={14} />
                {profile.email}
              </p>
            )}
            {profile?.createdAt && (
              <p className="text-dim text-xs mt-2 flex items-center gap-1.5">
                <Calendar size={12} />
                Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Portfolio summary */}
        <div className="glass rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-white mb-4">Portfolio Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dim text-sm">Active Items</span>
              <span className="text-white text-sm font-semibold">{activeItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dim text-sm">Sold Items</span>
              <span className="text-white text-sm font-semibold">{soldItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dim text-sm">Watchlist</span>
              <span className="text-white text-sm font-semibold">{watchlist.length}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-white/5">
              <span className="text-dim text-sm">Total Portfolio Value</span>
              <span className="text-amber-brand text-sm font-bold">{fmt(totalValue)}</span>
            </div>
          </div>
        </div>

        {/* Replay tutorial */}
        <button
          onClick={() => {
            try { localStorage.removeItem('praperty_setup_done') } catch {}
            window.location.reload()
          }}
          className="w-full glass glass-hover rounded-xl p-4 flex items-center justify-center gap-2 text-amber-brand font-semibold transition-all mb-3"
        >
          <BookOpen size={18} />
          Replay Tutorial
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full glass glass-hover rounded-xl p-4 flex items-center justify-center gap-2 text-red-400 font-semibold transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>

        {/* Version */}
        <p className="text-center text-dim text-[10px] mt-6">PrÄperty v0.2.0 (Next.js)</p>
      </div>
    </div>
  )
}
