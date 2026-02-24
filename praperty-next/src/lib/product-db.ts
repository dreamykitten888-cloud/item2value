/**
 * Product knowledge base for smart auto-fill.
 * When a user types an item name, we parse it against known brands/products
 * to auto-populate brand, model, category, and emoji.
 */

export interface ProductMatch {
  brand: string
  model: string
  category: string
  emoji: string
  confidence: number // 0-1
}

// Brand → category + emoji mapping
const BRAND_DB: Record<string, { category: string; emoji: string; aliases?: string[] }> = {
  // Sneakers & Shoes
  'Nike': { category: 'Sneakers', emoji: '👟', aliases: ['nike'] },
  'Jordan': { category: 'Sneakers', emoji: '👟', aliases: ['jordan', 'air jordan'] },
  'Adidas': { category: 'Sneakers', emoji: '👟', aliases: ['adidas', 'yeezy'] },
  'New Balance': { category: 'Sneakers', emoji: '👟', aliases: ['new balance', 'nb'] },
  'Asics': { category: 'Sneakers', emoji: '👟', aliases: ['asics'] },
  'Onitsuka Tiger': { category: 'Sneakers', emoji: '👟', aliases: ['onitsuka', 'onitsuka tiger'] },
  'Puma': { category: 'Sneakers', emoji: '👟', aliases: ['puma'] },
  'Reebok': { category: 'Sneakers', emoji: '👟', aliases: ['reebok'] },
  'Converse': { category: 'Sneakers', emoji: '👟', aliases: ['converse', 'chuck taylor'] },
  'Vans': { category: 'Sneakers', emoji: '👟', aliases: ['vans'] },
  'Salomon': { category: 'Sneakers', emoji: '👟', aliases: ['salomon'] },
  'Hoka': { category: 'Sneakers', emoji: '👟', aliases: ['hoka'] },

  // Luxury Fashion
  'Louis Vuitton': { category: 'Bags', emoji: '👜', aliases: ['louis vuitton', 'lv'] },
  'Gucci': { category: 'Bags', emoji: '👜', aliases: ['gucci'] },
  'Chanel': { category: 'Bags', emoji: '👜', aliases: ['chanel'] },
  'Hermes': { category: 'Bags', emoji: '👜', aliases: ['hermes', 'hermès', 'birkin', 'kelly'] },
  'Prada': { category: 'Bags', emoji: '👜', aliases: ['prada'] },
  'Dior': { category: 'Bags', emoji: '👜', aliases: ['dior', 'christian dior'] },
  'Balenciaga': { category: 'Clothing', emoji: '👕', aliases: ['balenciaga'] },
  'Bottega Veneta': { category: 'Bags', emoji: '👜', aliases: ['bottega', 'bottega veneta'] },
  'Celine': { category: 'Bags', emoji: '👜', aliases: ['celine', 'céline'] },
  'Fendi': { category: 'Bags', emoji: '👜', aliases: ['fendi'] },
  'Goyard': { category: 'Bags', emoji: '👜', aliases: ['goyard'] },
  'Coach': { category: 'Bags', emoji: '👜', aliases: ['coach'] },
  'Michael Kors': { category: 'Bags', emoji: '👜', aliases: ['michael kors', 'mk'] },
  'Kate Spade': { category: 'Bags', emoji: '👜', aliases: ['kate spade'] },
  'Tory Burch': { category: 'Bags', emoji: '👜', aliases: ['tory burch'] },

  // Streetwear
  'Supreme': { category: 'Clothing', emoji: '👕', aliases: ['supreme'] },
  'Bape': { category: 'Clothing', emoji: '👕', aliases: ['bape', 'a bathing ape'] },
  'Off-White': { category: 'Clothing', emoji: '👕', aliases: ['off-white', 'off white'] },
  'Stussy': { category: 'Clothing', emoji: '👕', aliases: ['stussy', 'stüssy'] },
  'Fear of God': { category: 'Clothing', emoji: '👕', aliases: ['fear of god', 'fog', 'essentials'] },
  'Palace': { category: 'Clothing', emoji: '👕', aliases: ['palace'] },
  'Kith': { category: 'Clothing', emoji: '👕', aliases: ['kith'] },

  // Watches
  'Rolex': { category: 'Watches', emoji: '⌚', aliases: ['rolex', 'submariner', 'daytona', 'datejust', 'gmt-master'] },
  'Omega': { category: 'Watches', emoji: '⌚', aliases: ['omega', 'speedmaster', 'seamaster'] },
  'Patek Philippe': { category: 'Watches', emoji: '⌚', aliases: ['patek', 'patek philippe'] },
  'Audemars Piguet': { category: 'Watches', emoji: '⌚', aliases: ['audemars piguet', 'ap', 'royal oak'] },
  'Cartier': { category: 'Watches', emoji: '⌚', aliases: ['cartier', 'tank', 'santos'] },
  'Tag Heuer': { category: 'Watches', emoji: '⌚', aliases: ['tag heuer', 'tag'] },
  'Seiko': { category: 'Watches', emoji: '⌚', aliases: ['seiko'] },
  'Casio': { category: 'Watches', emoji: '⌚', aliases: ['casio', 'g-shock', 'gshock'] },
  'Tudor': { category: 'Watches', emoji: '⌚', aliases: ['tudor', 'black bay'] },
  'IWC': { category: 'Watches', emoji: '⌚', aliases: ['iwc'] },
  'Breitling': { category: 'Watches', emoji: '⌚', aliases: ['breitling'] },
  'Garmin': { category: 'Watches', emoji: '⌚', aliases: ['garmin'] },

  // Electronics
  'Apple': { category: 'Electronics', emoji: '📱', aliases: ['apple', 'iphone', 'ipad', 'macbook', 'airpods', 'imac', 'mac mini', 'mac pro', 'apple watch'] },
  'Samsung': { category: 'Electronics', emoji: '📱', aliases: ['samsung', 'galaxy'] },
  'Sony': { category: 'Electronics', emoji: '📱', aliases: ['sony', 'playstation', 'ps5', 'ps4'] },
  'Microsoft': { category: 'Electronics', emoji: '📱', aliases: ['microsoft', 'xbox', 'surface'] },
  'Nintendo': { category: 'Gaming', emoji: '🎮', aliases: ['nintendo', 'switch'] },
  'Dyson': { category: 'Electronics', emoji: '📱', aliases: ['dyson'] },
  'Bose': { category: 'Electronics', emoji: '📱', aliases: ['bose'] },
  'Canon': { category: 'Electronics', emoji: '📷', aliases: ['canon'] },
  'Nikon': { category: 'Electronics', emoji: '📷', aliases: ['nikon'] },
  'Fujifilm': { category: 'Electronics', emoji: '📷', aliases: ['fujifilm', 'fuji'] },
  'Leica': { category: 'Electronics', emoji: '📷', aliases: ['leica'] },
  'DJI': { category: 'Electronics', emoji: '📱', aliases: ['dji', 'mavic'] },
  'Nvidia': { category: 'Electronics', emoji: '📱', aliases: ['nvidia', 'rtx', 'geforce'] },
  'Valve': { category: 'Gaming', emoji: '🎮', aliases: ['valve', 'steam deck'] },
  'Meta': { category: 'Electronics', emoji: '📱', aliases: ['meta', 'oculus', 'quest'] },

  // Jewelry
  'Tiffany': { category: 'Jewelry', emoji: '💍', aliases: ['tiffany', 'tiffany & co'] },
  'David Yurman': { category: 'Jewelry', emoji: '💍', aliases: ['david yurman'] },
  'Van Cleef': { category: 'Jewelry', emoji: '💍', aliases: ['van cleef', 'van cleef & arpels'] },
  'Pandora': { category: 'Jewelry', emoji: '💍', aliases: ['pandora'] },
  'Chrome Hearts': { category: 'Jewelry', emoji: '💍', aliases: ['chrome hearts'] },

  // Collectibles
  'Pokemon': { category: 'Trading Cards', emoji: '🃏', aliases: ['pokemon', 'pokémon'] },
  'Yu-Gi-Oh': { category: 'Trading Cards', emoji: '🃏', aliases: ['yugioh', 'yu-gi-oh'] },
  'Magic': { category: 'Trading Cards', emoji: '🃏', aliases: ['magic the gathering', 'mtg'] },
  'Topps': { category: 'Trading Cards', emoji: '🃏', aliases: ['topps'] },
  'Panini': { category: 'Trading Cards', emoji: '🃏', aliases: ['panini', 'prizm'] },
  'LEGO': { category: 'Collectibles', emoji: '🧸', aliases: ['lego'] },
  'Funko': { category: 'Collectibles', emoji: '🧸', aliases: ['funko', 'funko pop'] },
  'Hot Toys': { category: 'Collectibles', emoji: '🧸', aliases: ['hot toys'] },
  'Bearbrick': { category: 'Collectibles', emoji: '🧸', aliases: ['bearbrick', 'be@rbrick'] },
  'Kaws': { category: 'Art', emoji: '🎨', aliases: ['kaws'] },

  // Instruments
  'Gibson': { category: 'Instruments', emoji: '🎸', aliases: ['gibson', 'les paul'] },
  'Fender': { category: 'Instruments', emoji: '🎸', aliases: ['fender', 'stratocaster', 'telecaster'] },
  'Martin': { category: 'Instruments', emoji: '🎸', aliases: ['martin'] },
  'Taylor': { category: 'Instruments', emoji: '🎸', aliases: ['taylor'] },
  'Yamaha': { category: 'Instruments', emoji: '🎸', aliases: ['yamaha'] },
  'Roland': { category: 'Instruments', emoji: '🎸', aliases: ['roland'] },

  // Furniture
  'Herman Miller': { category: 'Furniture', emoji: '🪑', aliases: ['herman miller', 'aeron', 'eames'] },
  'Steelcase': { category: 'Furniture', emoji: '🪑', aliases: ['steelcase'] },

  // Automotive
  'Tesla': { category: 'Automotive', emoji: '🚗', aliases: ['tesla'] },
  'BMW': { category: 'Automotive', emoji: '🚗', aliases: ['bmw'] },
  'Mercedes': { category: 'Automotive', emoji: '🚗', aliases: ['mercedes', 'mercedes-benz'] },
  'Porsche': { category: 'Automotive', emoji: '🚗', aliases: ['porsche'] },
}

// Flatten for fast lookup: lowercase alias → brand name
const ALIAS_MAP = new Map<string, string>()
for (const [brand, info] of Object.entries(BRAND_DB)) {
  ALIAS_MAP.set(brand.toLowerCase(), brand)
  if (info.aliases) {
    for (const alias of info.aliases) {
      ALIAS_MAP.set(alias.toLowerCase(), brand)
    }
  }
}

// Sort aliases by length descending so longer matches win (e.g. "onitsuka tiger" before "tiger")
const SORTED_ALIASES = Array.from(ALIAS_MAP.entries()).sort((a, b) => b[0].length - a[0].length)

/**
 * Parse a product name and return the best brand/model/category match.
 * Example: "Onitsuka 66 Kill Bill" → { brand: "Onitsuka Tiger", model: "66 Kill Bill", category: "Sneakers", emoji: "👟" }
 */
export function matchProduct(input: string): ProductMatch | null {
  if (!input || input.trim().length < 2) return null

  const lower = input.toLowerCase().trim()

  // Try to find the longest matching alias in the input
  for (const [alias, brandName] of SORTED_ALIASES) {
    const idx = lower.indexOf(alias)
    if (idx !== -1) {
      const info = BRAND_DB[brandName]
      if (!info) continue

      // Extract the model: everything that's NOT the matched brand alias
      const before = input.slice(0, idx).trim()
      const after = input.slice(idx + alias.length).trim()
      const model = [before, after].filter(Boolean).join(' ').trim()

      return {
        brand: brandName,
        model: model || '',
        category: info.category,
        emoji: info.emoji,
        confidence: alias.length / lower.length, // longer match = higher confidence
      }
    }
  }

  return null
}

// Popular actual products people search for (not just brands)
const POPULAR_PRODUCTS: { name: string; brand: string; category: string; emoji: string }[] = [
  // Sneakers
  { name: 'Air Jordan 1 Retro High OG', brand: 'Nike', category: 'Sneakers', emoji: '👟' },
  { name: 'Air Jordan 4 Retro', brand: 'Nike', category: 'Sneakers', emoji: '👟' },
  { name: 'Nike Dunk Low', brand: 'Nike', category: 'Sneakers', emoji: '👟' },
  { name: 'Nike Air Force 1', brand: 'Nike', category: 'Sneakers', emoji: '👟' },
  { name: 'Yeezy Boost 350 V2', brand: 'Adidas', category: 'Sneakers', emoji: '👟' },
  { name: 'New Balance 550', brand: 'New Balance', category: 'Sneakers', emoji: '👟' },
  { name: 'New Balance 2002R', brand: 'New Balance', category: 'Sneakers', emoji: '👟' },
  { name: 'Adidas Samba OG', brand: 'Adidas', category: 'Sneakers', emoji: '👟' },
  // Bags
  { name: 'Louis Vuitton Neverfull MM', brand: 'Louis Vuitton', category: 'Bags', emoji: '👜' },
  { name: 'Louis Vuitton Speedy 25', brand: 'Louis Vuitton', category: 'Bags', emoji: '👜' },
  { name: 'Louis Vuitton Keepall 55', brand: 'Louis Vuitton', category: 'Bags', emoji: '👜' },
  { name: 'Chanel Classic Flap', brand: 'Chanel', category: 'Bags', emoji: '👜' },
  { name: 'Hermes Birkin 30', brand: 'Hermes', category: 'Bags', emoji: '👜' },
  { name: 'Gucci GG Marmont', brand: 'Gucci', category: 'Bags', emoji: '👜' },
  { name: 'Goyard St Louis PM', brand: 'Goyard', category: 'Bags', emoji: '👜' },
  // Watches
  { name: 'Rolex Submariner', brand: 'Rolex', category: 'Watches', emoji: '⌚' },
  { name: 'Rolex Daytona', brand: 'Rolex', category: 'Watches', emoji: '⌚' },
  { name: 'Rolex Datejust 41', brand: 'Rolex', category: 'Watches', emoji: '⌚' },
  { name: 'Omega Speedmaster Professional', brand: 'Omega', category: 'Watches', emoji: '⌚' },
  { name: 'Audemars Piguet Royal Oak', brand: 'Audemars Piguet', category: 'Watches', emoji: '⌚' },
  { name: 'Casio G-Shock DW-5600', brand: 'Casio', category: 'Watches', emoji: '⌚' },
  { name: 'Seiko Presage Cocktail Time', brand: 'Seiko', category: 'Watches', emoji: '⌚' },
  // Electronics
  { name: 'iPhone 16 Pro Max', brand: 'Apple', category: 'Electronics', emoji: '📱' },
  { name: 'MacBook Pro M4', brand: 'Apple', category: 'Electronics', emoji: '💻' },
  { name: 'AirPods Pro 2', brand: 'Apple', category: 'Electronics', emoji: '🎧' },
  { name: 'iPad Pro M4', brand: 'Apple', category: 'Electronics', emoji: '📱' },
  { name: 'PlayStation 5', brand: 'Sony', category: 'Gaming', emoji: '🎮' },
  { name: 'Nintendo Switch OLED', brand: 'Nintendo', category: 'Gaming', emoji: '🎮' },
  { name: 'Steam Deck OLED', brand: 'Valve', category: 'Gaming', emoji: '🎮' },
  { name: 'Sony A7 IV', brand: 'Sony', category: 'Electronics', emoji: '📷' },
  { name: 'Canon EOS R6 Mark II', brand: 'Canon', category: 'Electronics', emoji: '📷' },
  { name: 'Nvidia RTX 4090', brand: 'Nvidia', category: 'Electronics', emoji: '🖥️' },
  { name: 'Dyson V15 Detect', brand: 'Dyson', category: 'Electronics', emoji: '🏠' },
  // Collectibles
  { name: 'Pokemon Charizard VMAX', brand: 'Pokemon', category: 'Trading Cards', emoji: '🃏' },
  { name: 'LEGO Star Wars Millennium Falcon', brand: 'LEGO', category: 'Collectibles', emoji: '🧸' },
  { name: 'Funko Pop Marvel', brand: 'Funko', category: 'Collectibles', emoji: '🧸' },
  { name: 'Bearbrick 1000%', brand: 'Bearbrick', category: 'Collectibles', emoji: '🧸' },
  // Automotive
  { name: 'Nissan Skyline GT-R R34', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota Supra A80', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Mazda RX-7 FD', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda NSX NA1', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Silvia S15', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Mitsubishi Lancer Evolution IX', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },
  { name: 'Subaru Impreza WRX STI', brand: 'Subaru', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda S2000 AP1', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Porsche 911 GT3', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW M3 E46', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  // Instruments
  { name: 'Gibson Les Paul Standard', brand: 'Gibson', category: 'Instruments', emoji: '🎸' },
  { name: 'Fender Stratocaster', brand: 'Fender', category: 'Instruments', emoji: '🎸' },
  // Furniture
  { name: 'Herman Miller Aeron', brand: 'Herman Miller', category: 'Furniture', emoji: '🪑' },
  // Streetwear
  { name: 'Supreme Box Logo Hoodie', brand: 'Supreme', category: 'Clothing', emoji: '👕' },
  { name: 'Bape Shark Hoodie', brand: 'Bape', category: 'Clothing', emoji: '👕' },
]

/**
 * Get search suggestions as the user types.
 * Returns actual product names (not just brands) that match the query.
 * Also includes a "custom add" option so users can watch anything.
 */
export function getSuggestions(query: string, limit = 6): { name: string; brand: string; category: string; emoji: string }[] {
  if (!query || query.trim().length < 1) return []
  const lower = query.toLowerCase().trim()

  const results: { name: string; brand: string; category: string; emoji: string }[] = []
  const seen = new Set<string>()

  // First: match actual products
  for (const product of POPULAR_PRODUCTS) {
    if (results.length >= limit) break
    const pLower = product.name.toLowerCase()
    const bLower = product.brand.toLowerCase()
    if (pLower.includes(lower) || bLower.includes(lower) || lower.includes(bLower)) {
      const key = product.name.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        results.push(product)
      }
    }
  }

  // Second: if fewer than limit, add brand-level matches as generic entries
  if (results.length < limit) {
    for (const [alias, brandName] of SORTED_ALIASES) {
      if (results.length >= limit) break
      if (alias.includes(lower) || lower.includes(alias)) {
        // Only add the brand if we don't already have a product from it
        const hasBrand = results.some(r => r.brand === brandName)
        if (!hasBrand) {
          const info = BRAND_DB[brandName]
          if (info) {
            const key = brandName.toLowerCase()
            if (!seen.has(key)) {
              seen.add(key)
              results.push({ name: brandName, brand: brandName, category: info.category, emoji: info.emoji })
            }
          }
        }
      }
    }
  }

  return results
}
