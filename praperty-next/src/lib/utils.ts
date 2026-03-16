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

/** Export inventory items to a CSV file (Excel-compatible). Triggers browser download. */
export function exportInventoryToCsv(
  items: { name?: string; brand?: string; model?: string; category?: string; condition?: string; cost?: number; asking?: number; value?: number; earnings?: number | null; datePurchased?: string | null; dateSold?: string | null; soldPlatform?: string | null; notes?: string }[]
): void {
  if (!items.length) return
  const header = ['Name', 'Brand', 'Model', 'Category', 'Condition', 'Cost', 'Asking', 'Value', 'Earnings', 'Date Purchased', 'Date Sold', 'Sold Platform', 'Notes']
  const toCsvLine = (cols: unknown[]) =>
    cols.map(col => `"${String(col === null || col === undefined ? '' : col).replace(/"/g, '""')}"`).join(',')
  const rows = items.map(i => [
    i.name ?? '', i.brand ?? '', i.model ?? '', i.category ?? '', i.condition ?? '',
    i.cost ?? '', i.asking ?? '', i.value ?? '', i.earnings ?? '',
    i.datePurchased ?? '', i.dateSold ?? '', i.soldPlatform ?? '', i.notes ?? '',
  ])
  const csv = [toCsvLine(header), ...rows.map(toCsvLine)].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'praperty-inventory.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Generate a stable product key for price snapshots
export function makeProductKey(name: string, brand?: string): string {
  const key = (brand ? `${brand} ${name}` : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return key
}
