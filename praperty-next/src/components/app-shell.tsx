'use client'

import { useState } from 'react'
import { Home, Package, Search, Settings, Star, Camera } from 'lucide-react'
import type { Screen, Alert, WatchlistItem } from '@/types'
import HomeScreen from '@/components/screens/home-screen'
import InventoryScreen from '@/components/screens/inventory-screen'
import DetailScreen from '@/components/screens/detail-screen'
import SettingsScreen from '@/components/screens/settings-screen'
import AddItemScreen from '@/components/screens/add-item-screen'
import EditItemScreen from '@/components/screens/edit-item-screen'
import ScanScreen from '@/components/screens/scan-screen'
import DiscoverScreen from '@/components/screens/discover-screen'
import ResearchScreen from '@/components/screens/research-screen'
import PricingScreen from '@/components/screens/pricing-screen'
import SoldItemsScreen from '@/components/screens/sold-items-screen'
import AlertsScreen from '@/components/screens/alerts-screen'
import WatchlistScreen from '@/components/screens/watchlist-screen'
import { useItemsStore } from '@/stores/items-store'

const TABS = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'inventory' as const, label: 'Inventory', icon: Package },
  { id: 'discover' as const, label: 'Discover', icon: Search },
  { id: 'watchlist' as const, label: 'Watchlist', icon: Star },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
]

export default function AppShell() {
  const { items } = useItemsStore()
  const [screen, setScreen] = useState<Screen>('home')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [researchQuery, setResearchQuery] = useState('')
  const [scanData, setScanData] = useState<any>(null)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])

  const selectedItem = selectedItemId ? items.find(i => i.id === selectedItemId) : null

  const navigateToDetail = (itemId: string) => {
    setSelectedItemId(itemId)
    setScreen('detail')
  }

  const handleResearch = (query: string) => {
    setResearchQuery(query)
  }

  const handleScanData = (data: any) => {
    setScanData(data)
  }

  const handleAddToWatchlist = (item: WatchlistItem) => {
    setWatchlist(prev => [...prev, item])
  }

  const handleRemoveFromWatchlist = (id: string) => {
    setWatchlist(prev => prev.filter(w => w.id !== id))
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomeScreen onNavigate={setScreen} onViewItem={navigateToDetail} />
      case 'inventory':
        return <InventoryScreen onNavigate={setScreen} onViewItem={navigateToDetail} />
      case 'detail':
        return selectedItem ? (
          <DetailScreen itemId={selectedItemId} onBack={() => setScreen('inventory')} onNavigate={setScreen} />
        ) : null
      case 'add-item':
        return <AddItemScreen onNavigate={setScreen} scanData={scanData} />
      case 'edit-item':
        return selectedItem ? (
          <EditItemScreen onNavigate={setScreen} item={selectedItem} />
        ) : null
      case 'scan':
        return <ScanScreen onNavigate={setScreen} onScanData={handleScanData} />
      case 'discover':
        return <DiscoverScreen onNavigate={setScreen} onResearch={handleResearch} />
      case 'research':
        return <ResearchScreen onNavigate={setScreen} query={researchQuery} />
      case 'pricing':
        return <PricingScreen onNavigate={setScreen} item={selectedItem || undefined} />
      case 'sold-items':
        return <SoldItemsScreen onNavigate={setScreen} onViewItem={navigateToDetail} />
      case 'alerts':
        return <AlertsScreen onNavigate={setScreen} alerts={alerts} />
      case 'watchlist':
        return (
          <WatchlistScreen
            onNavigate={setScreen}
            watchlist={watchlist}
            onAddToWatchlist={handleAddToWatchlist}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
          />
        )
      case 'settings':
        return <SettingsScreen onNavigate={setScreen} />
      default:
        return <HomeScreen onNavigate={setScreen} onViewItem={navigateToDetail} />
    }
  }

  // Determine which tab is active
  const activeTab = (() => {
    if (['home', 'sold-items', 'alerts'].includes(screen)) return 'home'
    if (['inventory', 'detail', 'edit-item', 'add-item', 'pricing', 'scan'].includes(screen)) return 'inventory'
    if (['discover', 'research'].includes(screen)) return 'discover'
    if (screen === 'watchlist') return 'watchlist'
    if (screen === 'settings') return 'settings'
    return 'home'
  })()

  // Check if we should show tabs (hide for scan, add-item, edit-item)
  const showTabs = !['scan', 'add-item', 'edit-item'].includes(screen)

  return (
    <div className="h-full flex flex-col">
      {/* Screen content */}
      <div className="flex-1 overflow-hidden">
        {renderScreen()}
      </div>

      {/* Bottom navigation */}
      {showTabs && (
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
      )}
    </div>
  )
}
