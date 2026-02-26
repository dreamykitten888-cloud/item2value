'use client'

import { useState, useEffect } from 'react'
import { Home, Package, Search, Settings, Camera, Plus, Keyboard, Sparkles, X } from 'lucide-react'
import type { Screen } from '@/types'
import SetupScreen from '@/components/screens/setup-screen'
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

const LEFT_TABS = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'inventory' as const, label: 'Inventory', icon: Package },
]

const RIGHT_TABS = [
  { id: 'discover' as const, label: 'Discover', icon: Search },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
]

const ALL_TABS = [...LEFT_TABS, ...RIGHT_TABS]

export default function AppShell() {
  const { items } = useItemsStore()
  const [showSetup, setShowSetup] = useState(false)
  const [screen, setScreen] = useState<Screen>('home')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [researchQuery, setResearchQuery] = useState('')
  const [scanData, setScanData] = useState<any>(null)
  const [showAddSheet, setShowAddSheet] = useState(false)

  // Show tutorial for first-time users
  useEffect(() => {
    try {
      const done = localStorage.getItem('praperty_setup_done')
      if (!done) setShowSetup(true)
    } catch { /* SSR or storage unavailable */ }
  }, [])

  const completeSetup = () => {
    try { localStorage.setItem('praperty_setup_done', '1') } catch {}
    setShowSetup(false)
  }

  const selectedItem = selectedItemId ? items.find(i => i.id === selectedItemId) : null

  const navigateToDetail = (itemId: string) => {
    setSelectedItemId(itemId)
    setScreen('detail')
  }

  const handleResearch = (query: string) => {
    setResearchQuery(query)
    setScreen('research')
  }

  const handleScanData = (data: any) => {
    setScanData(data)
  }


  const renderScreen = () => {
    // Show tutorial/onboarding for first-time users
    if (showSetup) {
      return <SetupScreen onNavigate={setScreen} onComplete={completeSetup} />
    }

    switch (screen) {
      case 'home':
        return <HomeScreen onNavigate={setScreen} onViewItem={navigateToDetail} onResearch={handleResearch} />
      case 'inventory':
        return <InventoryScreen onNavigate={setScreen} onViewItem={navigateToDetail} />
      case 'detail':
        return selectedItem ? (
          <DetailScreen itemId={selectedItemId} onBack={() => setScreen('inventory')} onNavigate={setScreen} onResearch={handleResearch} />
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
        return <AlertsScreen onNavigate={setScreen} onViewItem={navigateToDetail} />
      case 'watchlist':
        return (
          <WatchlistScreen
            onNavigate={setScreen}
            onResearch={handleResearch}
          />
        )
      case 'settings':
        return <SettingsScreen onNavigate={setScreen} />
      default:
        return <HomeScreen onNavigate={setScreen} onViewItem={navigateToDetail} onResearch={handleResearch} />
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

  // Check if we should show tabs (hide for scan, add-item, edit-item, and setup)
  const showTabs = !showSetup && !['scan', 'add-item', 'edit-item'].includes(screen)

  return (
    <div className="h-full flex flex-col">
      {/* Screen content */}
      <div className="flex-1 overflow-hidden">
        {renderScreen()}
      </div>

      {/* Add Item Bottom Sheet */}
      {showAddSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddSheet(false)}
          />

          {/* Sheet */}
          <div
            className="relative rounded-t-3xl px-6 pt-5 pb-10 animate-fade-up"
            style={{ background: 'var(--bg-surface)', borderTop: '1px solid rgba(78, 113, 69, 0.15)' }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5" />

            <h3 className="text-lg font-bold text-white mb-4 font-heading">Add an item</h3>

            <div className="space-y-2">
              {/* Snap a photo (AI) - hero option */}
              <button
                onClick={() => { setShowAddSheet(false); setScreen('scan') }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl glass hover:bg-white/8 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-xl gradient-amber flex items-center justify-center flex-shrink-0">
                  <Sparkles size={22} className="text-black" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-semibold text-white">Snap a photo</p>
                  <p className="text-xs text-dim">AI identifies your item instantly</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-amber-brand bg-amber-brand/15 px-2 py-1 rounded-md">NEW</span>
              </button>

              {/* Scan barcode */}
              <button
                onClick={() => { setShowAddSheet(false); setScreen('scan') }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl glass hover:bg-white/8 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-xl bg-forest/80 flex items-center justify-center flex-shrink-0 border border-forest-mid/30">
                  <Camera size={22} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-semibold text-white">Scan barcode</p>
                  <p className="text-xs text-dim">Scan a barcode to auto-fill product info</p>
                </div>
              </button>

              {/* Type it in */}
              <button
                onClick={() => { setShowAddSheet(false); setScreen('add-item') }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl glass hover:bg-white/8 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-xl bg-white/6 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <Keyboard size={22} className="text-dim" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-semibold text-white">Type it in</p>
                  <p className="text-xs text-dim">Name your item, auto-fill does the rest</p>
                </div>
              </button>
            </div>

            {/* Cancel */}
            <button
              onClick={() => setShowAddSheet(false)}
              className="w-full mt-4 py-3 text-dim text-sm font-medium text-center hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bottom navigation with center Add button */}
      {showTabs && (
        <nav className="flex-shrink-0 glass border-t border-white/5 relative">
          <div className="flex justify-around items-end py-2 pb-safe">
            {/* Left tabs: Home, Inventory */}
            {LEFT_TABS.map(tab => {
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

            {/* Center: Add button (raised) */}
            <div className="flex flex-col items-center -mt-5">
              <button
                onClick={() => setShowAddSheet(true)}
                className="w-14 h-14 rounded-full gradient-amber flex items-center justify-center shadow-lg shadow-amber-brand/30 active:scale-95 transition-transform"
                aria-label="Add item"
              >
                <Plus size={28} strokeWidth={2.5} className="text-black" />
              </button>
              <span className="text-[10px] tracking-wide font-medium text-dim mt-1">Add</span>
            </div>

            {/* Right tabs: Watchlist, Settings */}
            {RIGHT_TABS.map(tab => {
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
