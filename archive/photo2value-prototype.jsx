import React, { useState, useEffect } from 'react';
import {
  Camera,
  Search,
  Home,
  Bell,
  User,
  ArrowLeft,
  Grid,
  List,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
  Upload,
  Filter,
  Settings,
  Shield,
  Download,
  HelpCircle,
  LogOut,
  Star,
  Eye,
  Share2,
  RefreshCw,
  Edit3,
  Check,
  X,
  Zap,
  Package,
  DollarSign,
  BarChart3,
  Clock,
  Heart,
  AlertTriangle,
  Zap as Lightning,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const Photo2ValueApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [inventoryView, setInventoryView] = useState('grid');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [sortBy, setSortBy] = useState('value-high');
  const [showCameraAnimation, setShowCameraAnimation] = useState(false);
  const [showAnalyzing, setShowAnalyzing] = useState(false);
  const [aiComplete, setAiComplete] = useState(false);

  const inventoryItems = [
    {
      id: 1,
      name: 'Louis Vuitton Neverfull MM',
      category: 'Fashion',
      originalPrice: 1270,
      currentPrice: 1420,
      gain: 12,
      image: '👜',
      condition: 'Excellent',
      details: {
        brand: 'Louis Vuitton',
        model: 'Neverfull MM',
        color: 'Monogram',
        material: 'Canvas & Leather',
      },
    },
    {
      id: 2,
      name: 'Nike Dunk Low Panda',
      category: 'Fashion',
      originalPrice: 147,
      currentPrice: 135,
      gain: -8,
      image: '👟',
      condition: 'Good',
      details: { brand: 'Nike', model: 'Dunk Low', color: 'White/Black' },
    },
    {
      id: 3,
      name: 'Herman Miller Aeron Chair',
      category: 'Home',
      originalPrice: 850,
      currentPrice: 890,
      gain: 5,
      image: '🪑',
      condition: 'Like New',
      details: { brand: 'Herman Miller', model: 'Aeron', size: 'B' },
    },
    {
      id: 4,
      name: 'Sony A7III Camera',
      category: 'Electronics',
      originalPrice: 1185,
      currentPrice: 1150,
      gain: -3,
      image: '📷',
      condition: 'Excellent',
      details: { brand: 'Sony', model: 'A7III', year: '2018' },
    },
    {
      id: 5,
      name: 'Vintage Rolex Datejust',
      category: 'Watches',
      originalPrice: 4600,
      currentPrice: 6200,
      gain: 34,
      image: '⌚',
      condition: 'Very Good',
      details: {
        brand: 'Rolex',
        model: 'Datejust',
        year: '1985',
        metal: 'Stainless Steel',
      },
    },
    {
      id: 6,
      name: 'Le Creuset Dutch Oven',
      category: 'Home',
      originalPrice: 275,
      currentPrice: 280,
      gain: 2,
      image: '🍲',
      condition: 'Excellent',
      details: { brand: 'Le Creuset', size: '5.5L', color: 'Flame Orange' },
    },
    {
      id: 7,
      name: 'iPad Pro 12.9" M2',
      category: 'Electronics',
      originalPrice: 880,
      currentPrice: 750,
      gain: -15,
      image: '📱',
      condition: 'Good',
      details: { brand: 'Apple', model: 'iPad Pro M2', storage: '256GB' },
    },
    {
      id: 8,
      name: 'MCM Stark Backpack',
      category: 'Fashion',
      originalPrice: 453,
      currentPrice: 485,
      gain: 7,
      image: '🎒',
      condition: 'Excellent',
      details: { brand: 'MCM', model: 'Stark', color: 'Black Cognac' },
    },
  ];

  const recentItems = inventoryItems.slice(0, 4);
  const totalValue = inventoryItems.reduce((sum, item) => sum + item.currentPrice, 0);
  const avgValue = Math.round(totalValue / inventoryItems.length);
  const topGainer = inventoryItems.reduce((max, item) => (item.gain > max.gain ? item : max));

  const alerts = [
    {
      id: 1,
      itemId: 5,
      type: 'Price Spike',
      message: 'Vintage Rolex value up 8%',
      timestamp: '2 hours ago',
      icon: Lightning,
    },
    {
      id: 2,
      itemId: 1,
      type: 'New Comp Found',
      message: 'Louis Vuitton Neverfull MM',
      timestamp: '5 hours ago',
      icon: Zap,
    },
    {
      id: 3,
      itemId: 3,
      type: 'Market Alert',
      message: 'Herman Miller Aeron trending',
      timestamp: '1 day ago',
      icon: TrendingUp,
    },
  ];

  const priceHistoryData = [
    { date: 'Jan', value: 1270 },
    { date: 'Feb', value: 1285 },
    { date: 'Mar', value: 1310 },
    { date: 'Apr', value: 1350 },
    { date: 'May', value: 1385 },
    { date: 'Jun', value: 1420 },
  ];

  const comparables = [
    {
      id: 1,
      source: 'Vestiaire Collective',
      title: 'Louis Vuitton Neverfull MM Damier',
      price: 1410,
      condition: 'Excellent',
      date: '2 days ago',
    },
    {
      id: 2,
      source: 'Rebag',
      title: 'LV Neverfull MM Monogram',
      price: 1520,
      condition: 'Like New',
      date: '1 week ago',
    },
    {
      id: 3,
      source: 'Tradesy',
      title: 'Louis Vuitton Neverfull',
      price: 1310,
      condition: 'Good',
      date: '3 days ago',
    },
  ];

  const handleTakePhoto = () => {
    setShowCameraAnimation(true);
    setTimeout(() => {
      setShowCameraAnimation(false);
      setShowAnalyzing(true);
      setTimeout(() => {
        setShowAnalyzing(false);
        setAiComplete(true);
      }, 2000);
    }, 800);
  };

  const handleSaveItem = () => {
    setCurrentScreen('inventory');
    setShowAnalyzing(false);
    setAiComplete(false);
  };

  const handleSelectItem = (itemId) => {
    setSelectedItemId(itemId);
    setCurrentScreen('item-detail');
  };

  const handleNavigateComps = () => {
    setCurrentScreen('pricing');
  };

  const selectedItem = inventoryItems.find((item) => item.id === selectedItemId);

  const filteredItems = inventoryItems.filter((item) => {
    const matchesFilter =
      activeFilter === 'All' || item.category === activeFilter;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'value-high') return b.currentPrice - a.currentPrice;
    if (sortBy === 'value-low') return a.currentPrice - b.currentPrice;
    if (sortBy === 'gain') return b.gain - a.gain;
    return 0;
  });

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-sm text-slate-400 tracking-wide">Good Evening</p>
            <h1 className="text-3xl font-bold tracking-tight mt-1">Kitty</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-lg font-bold">
            K
          </div>
        </div>

        {/* Summary Cards */}
        <div className="space-y-3">
          {[
            {
              label: 'Total Items',
              value: '47',
              icon: Package,
              color: 'from-blue-500 to-blue-600',
            },
            {
              label: 'Total Value',
              value: `$${totalValue.toLocaleString()}`,
              icon: DollarSign,
              color: 'from-amber-500 to-amber-600',
            },
            {
              label: 'Average Value',
              value: `$${avgValue.toLocaleString()}`,
              icon: BarChart3,
              color: 'from-purple-500 to-purple-600',
            },
            {
              label: 'Top Gainer',
              value: `+${topGainer.gain}%`,
              icon: TrendingUp,
              color: 'from-green-500 to-green-600',
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-all duration-300 transform hover:scale-105"
              style={{
                animation: `slideInUp 0.6s ease-out ${idx * 0.1}s both`,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold mt-1 text-white">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}
                >
                  <card.icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-6 flex gap-3">
        <button
          onClick={() => setCurrentScreen('scan')}
          className="flex-1 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <Camera size={20} />
          Scan Item
        </button>
        <button
          onClick={() => {}}
          className="flex-1 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
        >
          <Plus size={20} />
          Add Manual
        </button>
      </div>

      {/* Recent Items */}
      <div className="px-6 py-4">
        <h2 className="text-lg font-bold mb-4">Recent Items</h2>
        <div className="space-y-3">
          {recentItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => handleSelectItem(item.id)}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 cursor-pointer transition-all duration-300 transform hover:scale-105"
              style={{
                animation: `slideInRight 0.6s ease-out ${idx * 0.1}s both`,
              }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center text-3xl">
                {item.image}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{item.name}</p>
                <p className="text-xs text-slate-400 mt-1">{item.condition}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-400">
                  ${item.currentPrice.toLocaleString()}
                </p>
                <div
                  className={`text-xs font-semibold flex items-center gap-1 justify-end mt-1 ${
                    item.gain >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {item.gain >= 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {item.gain >= 0 ? '+' : ''}{item.gain}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );

  const renderScan = () => (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
      {/* Camera Viewfinder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-64 h-80 border-4 border-white/30 rounded-3xl overflow-hidden bg-gradient-to-b from-black to-slate-900">
          {/* Scanning Animation */}
          {showCameraAnimation && (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-400/20 to-transparent animate-pulse" />
              <div
                className="absolute left-0 right-0 h-1 bg-gradient-to-b from-amber-300 via-amber-400 to-transparent"
                style={{
                  top: '50%',
                  animation: 'scan 2s ease-in-out infinite',
                }}
              />
            </>
          )}

          {/* Corner Brackets */}
          {[
            'top-0 left-0',
            'top-0 right-0',
            'bottom-0 left-0',
            'bottom-0 right-0',
          ].map((pos, i) => (
            <div key={i} className={`absolute w-8 h-8 border-2 border-white/50 ${pos}`} />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-6 z-10">
        <button
          onClick={() => setCurrentScreen('home')}
          className="text-white hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white font-bold text-lg">Scan Item</h1>
        <div className="w-6" />
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-4 px-6 pb-12 z-10">
        <button
          onClick={handleTakePhoto}
          disabled={showCameraAnimation}
          className="w-20 h-20 mx-auto bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 disabled:opacity-50 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110"
        >
          <Camera size={32} className="text-black" />
        </button>

        <button
          onClick={() => {}}
          className="backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
        >
          <Upload size={18} />
          Upload from Gallery
        </button>
      </div>

      <style jsx>{`
        @keyframes scan {
          0%,
          100% {
            top: 0;
          }
          50% {
            top: 100%;
          }
        }
      `}</style>
    </div>
  );

  const renderAI = () => (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <button
          onClick={() => {
            setCurrentScreen('scan');
            setShowAnalyzing(false);
            setAiComplete(false);
          }}
          className="text-white hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Item Analysis</h1>
        <div className="w-6" />
      </div>

      {/* Item Image */}
      <div className="px-6 py-6">
        <div className="w-full h-64 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center text-8xl relative overflow-hidden">
          👜
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
        </div>
      </div>

      {/* Content */}
      {showAnalyzing ? (
        <div className="px-6 py-8 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-2 border-transparent border-t-amber-400 rounded-full animate-spin" />
              <div className="absolute inset-2 border-2 border-transparent border-r-amber-300 rounded-full animate-spin" />
            </div>
            <p className="text-xl font-semibold">Analyzing...</p>
            <p className="text-slate-400 text-sm">AI is identifying your item</p>
          </div>
        </div>
      ) : aiComplete ? (
        <div className="px-6 py-6 space-y-6">
          {/* Prediction */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-lg">Louis Vuitton Neverfull MM</h3>
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1">
                <p className="text-xs font-semibold text-green-400">94% Match</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">Damier Ebene Pattern</p>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {[
              { label: 'Category', value: 'Handbags & Purses' },
              { label: 'Brand', value: 'Louis Vuitton' },
              { label: 'Model', value: 'Neverfull MM' },
              { label: 'Condition Estimate', value: 'Excellent' },
            ].map((detail, idx) => (
              <div
                key={idx}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center"
              >
                <p className="text-sm text-slate-400">{detail.label}</p>
                <p className="font-semibold text-white">{detail.value}</p>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={handleNavigateComps}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Search Comps
            </button>
            <button
              onClick={handleSaveItem}
              className="w-full backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-4 rounded-xl transition-all duration-300"
            >
              Save to Inventory
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderInventory = () => (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 sticky top-0 bg-gradient-to-b from-slate-950 to-slate-950/80 backdrop-blur-xl border-b border-white/10 z-20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Inventory</h1>
          <button
            onClick={() => setInventoryView(inventoryView === 'grid' ? 'list' : 'grid')}
            className="text-white hover:text-amber-400 transition-colors"
          >
            {inventoryView === 'grid' ? <List size={24} /> : <Grid size={24} />}
          </button>
        </div>

        {/* Search */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-white placeholder-slate-500 flex-1"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
          {['All', 'Fashion', 'Electronics', 'Home', 'Watches'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-black'
                  : 'backdrop-blur-xl bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="mt-3 flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 backdrop-blur-xl outline-none"
          >
            <option value="value-high">Value: High to Low</option>
            <option value="value-low">Value: Low to High</option>
            <option value="gain">Biggest Gains</option>
          </select>
        </div>
      </div>

      {/* Items */}
      <div className="px-6 py-6">
        {inventoryView === 'grid' ? (
          <div className="grid grid-cols-2 gap-4">
            {sortedItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item.id)}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 cursor-pointer transition-all duration-300 transform hover:scale-105"
                style={{
                  animation: `slideInUp 0.6s ease-out ${idx * 0.1}s both`,
                }}
              >
                <div className="w-full h-32 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-5xl relative">
                  {item.image}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-white truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{item.condition}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-bold text-amber-400">
                      ${item.currentPrice.toLocaleString()}
                    </p>
                    <div
                      className={`text-xs font-semibold flex items-center gap-0.5 ${
                        item.gain >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {item.gain >= 0 ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      {item.gain >= 0 ? '+' : ''}{item.gain}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item.id)}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 cursor-pointer transition-all duration-300"
                style={{
                  animation: `slideInRight 0.6s ease-out ${idx * 0.05}s both`,
                }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                  {item.image}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{item.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.condition}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-amber-400">
                    ${item.currentPrice.toLocaleString()}
                  </p>
                  <div
                    className={`text-xs font-semibold flex items-center gap-1 justify-end mt-1 ${
                      item.gain >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {item.gain >= 0 ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {item.gain >= 0 ? '+' : ''}{item.gain}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );

  const renderItemDetail = () => {
    if (!selectedItem) return null;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-20">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0 bg-gradient-to-b from-slate-950 to-slate-950/80 backdrop-blur-xl border-b border-white/10 z-20">
          <button
            onClick={() => setCurrentScreen('inventory')}
            className="text-white hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold">Details</h1>
          <button className="text-white hover:text-slate-300 transition-colors">
            <Share2 size={24} />
          </button>
        </div>

        {/* Item Image */}
        <div className="px-6 py-6">
          <div className="w-full h-72 bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl flex items-center justify-center text-8xl relative overflow-hidden">
            {selectedItem.image}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />

            {/* Photo Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === 0
                      ? 'bg-white w-8'
                      : 'bg-white/40 hover:bg-white/60 cursor-pointer transition-all'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Item Info */}
        <div className="px-6 py-6 space-y-6">
          {/* Name & Category */}
          <div>
            <h2 className="text-2xl font-bold mb-2">{selectedItem.name}</h2>
            <p className="text-sm text-slate-400">{selectedItem.category}</p>
          </div>

          {/* Price Section */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg">Valuation</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  Your Cost
                </p>
                <p className="text-2xl font-bold mt-2 text-white">
                  ${selectedItem.originalPrice.toLocaleString()}
                </p>
              </div>
              <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  Market Value
                </p>
                <p className="text-2xl font-bold mt-2 text-amber-400">
                  ${selectedItem.currentPrice.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Gain/Loss</p>
                <div
                  className={`flex items-center gap-2 text-lg font-bold ${
                    selectedItem.gain >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {selectedItem.gain >= 0 ? (
                    <TrendingUp size={20} />
                  ) : (
                    <TrendingDown size={20} />
                  )}
                  {selectedItem.gain >= 0 ? '+' : ''}{selectedItem.gain}% (
                  {selectedItem.gain >= 0 ? '+' : ''}$
                  {Math.abs(selectedItem.currentPrice - selectedItem.originalPrice).toLocaleString()}
                  )
                </div>
              </div>
            </div>
          </div>

          {/* Price History Chart */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4">Price History</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={priceHistoryData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A853" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4A853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`$${value}`, 'Value']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#D4A853"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Comparables */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4">Comparable Listings</h3>
            <div className="space-y-3">
              {comparables.map((comp, idx) => (
                <div
                  key={comp.id}
                  className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">
                      {comp.source}
                    </p>
                    <p className="font-bold text-amber-400">
                      ${comp.price.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-white truncate mb-2">{comp.title}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{comp.condition}</span>
                    <span>{comp.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={handleNavigateComps}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Refresh Price
            </button>
            <button className="w-full backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2">
              <Edit3 size={18} />
              Edit Item
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPricing = () => (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0 bg-gradient-to-b from-slate-950 to-slate-950/80 backdrop-blur-xl border-b border-white/10 z-20">
        <button
          onClick={() => setCurrentScreen('item-detail')}
          className="text-white hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Market Analysis</h1>
        <div className="w-6" />
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Item Summary */}
        {selectedItem && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center text-2xl">
                {selectedItem.image}
              </div>
              <div>
                <p className="font-semibold text-white">{selectedItem.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedItem.condition}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Price Range */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4">Estimated Market Range</h3>

          {/* Range Visualization */}
          <div className="space-y-4">
            <div className="relative h-2 bg-gradient-to-r from-red-500 via-amber-400 to-green-500 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-white/30 border-l-2 border-white rounded-full w-1"
                style={{ left: '45%' }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Low', price: 1180, color: 'text-red-400' },
                { label: 'Typical', price: 1420, color: 'text-amber-400' },
                { label: 'High', price: 1780, color: 'text-green-400' },
              ].map((range, idx) => (
                <div key={idx} className="backdrop-blur-xl bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    {range.label}
                  </p>
                  <p className={`font-bold text-lg mt-2 ${range.color}`}>
                    ${range.price.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Confidence Score</p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[87%] h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" />
                </div>
                <p className="font-bold text-amber-400 text-sm">87%</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Based on 23 recent comps</p>
          </div>
        </div>

        {/* Comparable Listings */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4">Comparable Listings</h3>
          <div className="space-y-3">
            {comparables.map((comp) => (
              <div
                key={comp.id}
                className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-white">
                    {comp.source}
                  </p>
                  <p className="font-bold text-amber-400">
                    ${comp.price.toLocaleString()}
                  </p>
                </div>
                <p className="text-xs text-slate-400 mb-2 line-clamp-2">
                  {comp.title}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{comp.condition}</span>
                  <span>{comp.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Alert */}
        <button className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
          <Bell size={18} />
          Set Price Alert
        </button>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 sticky top-0 bg-gradient-to-b from-slate-950 to-slate-950/80 backdrop-blur-xl border-b border-white/10 z-20">
        <h1 className="text-2xl font-bold">Alerts</h1>
      </div>

      <div className="px-6 py-6 space-y-3">
        {alerts.length > 0 ? (
          alerts.map((alert, idx) => {
            const AlertIcon = alert.icon;
            return (
              <div
                key={alert.id}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
                style={{
                  animation: `slideInRight 0.6s ease-out ${idx * 0.1}s both`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertIcon size={18} className="text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{alert.type}</p>
                    <p className="text-sm text-slate-400 mt-1">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-2">{alert.timestamp}</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="w-4 h-4 cursor-pointer flex-shrink-0 mt-1"
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">No alerts yet</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );

  const renderProfile = () => (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 sticky top-0 bg-gradient-to-b from-slate-950 to-slate-950/80 backdrop-blur-xl border-b border-white/10 z-20">
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* User Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
            K
          </div>
          <h2 className="text-2xl font-bold">Kitty</h2>
          <p className="text-sm text-slate-400 mt-2">kittyisrando@gmail.com</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Member Since', value: 'Jan 2026' },
            { label: 'Items Tracked', value: '47' },
            { label: 'Total Value', value: `$${totalValue.toLocaleString()}` },
            { label: 'Avg Item Value', value: `$${avgValue.toLocaleString()}` },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-center"
            >
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="text-xl font-bold mt-2 text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="space-y-2">
          {[
            { icon: Bell, label: 'Notification Preferences' },
            { icon: DollarSign, label: 'Default Currency' },
            { icon: Download, label: 'Data Export' },
            { icon: Shield, label: 'Privacy & Security' },
            { icon: HelpCircle, label: 'Help & Support' },
          ].map((item, idx) => (
            <button
              key={idx}
              className="w-full backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className="text-amber-400" />
                <span className="text-white font-semibold">{item.label}</span>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <button className="w-full backdrop-blur-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-semibold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  // Main render with tab bar
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return renderHome();
      case 'scan':
        return renderScan();
      case 'ai':
        return renderAI();
      case 'inventory':
        return renderInventory();
      case 'item-detail':
        return renderItemDetail();
      case 'pricing':
        return renderPricing();
      case 'alerts':
        return renderAlerts();
      case 'profile':
        return renderProfile();
      default:
        return renderHome();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Container for mobile viewport */}
      <div className="max-w-[390px] mx-auto h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative">
        {/* Main Content */}
        {currentScreen === 'scan'
          ? renderScreen()
          : currentScreen === 'ai'
            ? renderScreen()
            : currentScreen === 'ai' && showAnalyzing
              ? renderScreen()
              : currentScreen === 'ai' && aiComplete
                ? renderScreen()
                : renderScreen()}

        {/* Bottom Tab Bar */}
        {currentScreen !== 'scan' && (
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[390px] bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-950/0 backdrop-blur-xl border-t border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'inventory', icon: Package, label: 'Inventory' },
                { id: 'scan', icon: Camera, label: 'Scan', isPrimary: true },
                { id: 'alerts', icon: Bell, label: 'Alerts' },
                { id: 'profile', icon: User, label: 'Profile' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'scan') {
                      setCurrentScreen('scan');
                    } else {
                      setCurrentScreen(tab.id);
                    }
                  }}
                  className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-300 ${
                    currentScreen === tab.id
                      ? 'text-amber-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg transition-all ${
                      currentScreen === tab.id
                        ? 'bg-amber-400/20'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <tab.icon size={20} />
                  </div>
                  <span className="text-xs font-semibold">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scanner overlay when needed */}
        {currentScreen === 'scan' && showCameraAnimation && (
          <div className="fixed inset-0 bg-white/10 backdrop-blur-sm z-50" />
        )}
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        body {
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 0;
        }

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          font-family: 'Sora', system-ui, -apple-system, sans-serif;
        }

        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>
    </div>
  );
};

export default Photo2ValueApp;
