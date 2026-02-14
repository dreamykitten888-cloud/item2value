'use client'

import { useState } from 'react'
import { Home, Package, Search, Settings } from 'lucide-react'
import type { Screen } from '@/types'
import HomeScreen from '@/components/screens/home-screen'
import InventoryScreen from '@/components/screens/inventory-screen'
import DetailScreen from '@/components/screens/detail-screen'
import SettingsScreen from '@/components/screens/settings-screen'

const TABS = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'inventory' as const, label: 'Inventory', icon: Package },
  { id: 'discover' as const, label: 'Discover', icon: Search },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
]

export default function AppShell() {
  const [screen, setScreen] = useState<Screen>('home')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const navigateToDetail = (itemId: string) => {
    setSelectedItemId(itemId)
    setScreen('detail')
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomeScreen onNavigate={setScreen} onViewItem={navigateToDetail} />
      case 'inventory':
        return <InventoryScreen onNavigate={setScreen} onViewItem={navigateToDetail} />
      case 'detail':
        return <DetailScreen itemId={selectedItemId} onBack={() => setScreen('inventory')} onNavigate={setScreen} />
      case 'settings':
        return <SettingsScreen onNavigate={setScreen} />
      default:
        return <HomeScreen onNavigate={setScreen} onViewItem={navigateToDetail} />
    }
  }

  // Determine which tab is active
  const activeTab = (() => {
    if (['home', 'sold-items', 'alerts'].includes(screen)) return 'home'
    if (['inventory', 'detail', 'edit-item', 'add-item', 'pricing'].includes(screen)) return 'inventory'
    if (['discover', 'research'].includes(screen)) return 'discover'
    if (screen === 'settings') return 'settings'
    return 'home'
  })()

  return (
    <div className="h-full flex flex-col">
      {/* Screen content */}
      <div className="flex-1 overflow-hidden">
        {renderScreen()}
      </div>

      {/* Bottom navigation */}
      <nav className="flex-shrink-0 glass border-t border-white/5">
        <div className="flex justify-around py-2 pb-safe">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setScreen(tab.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                  isActive ? 'text-amber-brand' : 'text-dim hover:text-white'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-[10px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
