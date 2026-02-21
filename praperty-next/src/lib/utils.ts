// Format currency
export const fmt = (n: number): string =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`

export const fmtFull = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)

// Get greeting based on time of day
export const getGreeting = (): string => {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// Generate numeric ID (bigint-compatible for Supabase items table)
export const uuid = (): string =>
  String(Date.now()) + String(Math.floor(Math.random() * 10000)).padStart(4, '0')

// Category emoji map
export const CATEGORY_EMOJIS: Record<string, string> = {
  'Sneakers': '👟', 'Electronics': '📱', 'Clothing': '👕', 'Bags': '👜',
  'Watches': '⌚', 'Jewelry': '💍', 'Art': '🎨', 'Collectibles': '🏆',
  'Trading Cards': '🃏', 'Vinyl': '🎵', 'Furniture': '🪑', 'Tools': '🔧',
  'Sports': '⚽', 'Toys': '🧸', 'Books': '📚', 'Vintage': '🕰️',
  'Automotive': '🚗', 'Instruments': '🎸', 'Gaming': '🎮', 'Other': '📦',
}

export const CATEGORIES = Object.keys(CATEGORY_EMOJIS)

export const CONDITIONS = ['New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor']
