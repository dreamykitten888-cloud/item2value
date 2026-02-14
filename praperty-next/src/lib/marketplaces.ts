// All marketplace definitions with category-aware filtering

interface MarketplaceDef {
  color: string
  bg: string
  urlFn: (q: string) => string
  desc: string
  categories: string[] | 'all'
}

const ALL_MARKETPLACES: Record<string, MarketplaceDef> = {
  'eBay Sold':       { color:'#e53238', bg:'rgba(229,50,56,0.08)', urlFn: q => `https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1`, desc:'Actual sold prices', categories:'all' },
  'eBay Active':     { color:'#e53238', bg:'rgba(229,50,56,0.08)', urlFn: q => `https://www.ebay.com/sch/i.html?_nkw=${q}`, desc:'Current listings', categories:'all' },
  'Amazon':          { color:'#FF9900', bg:'rgba(255,153,0,0.08)', urlFn: q => `https://www.amazon.com/s?k=${q}`, desc:'New & used prices', categories:'all' },
  'Google Shopping':  { color:'#4285f4', bg:'rgba(66,133,244,0.08)', urlFn: q => `https://www.google.com/search?q=${q}+price&tbm=shop`, desc:'Compare across stores', categories:'all' },
  'Facebook':        { color:'#1877f2', bg:'rgba(24,119,242,0.08)', urlFn: q => `https://www.facebook.com/marketplace/search/?query=${q}`, desc:'Local deals', categories:'all' },
  'Mercari':         { color:'#4dc9f6', bg:'rgba(77,201,246,0.08)', urlFn: q => `https://www.mercari.com/search/?keyword=${q}`, desc:'General marketplace', categories:['Fashion','Electronics','Home','Toys','Sports','Collectibles','Other'] },
  'Poshmark':        { color:'#7f0353', bg:'rgba(127,3,83,0.08)', urlFn: q => `https://poshmark.com/search?query=${q}&type=listings&src=dir`, desc:'Fashion & accessories', categories:['Fashion','Watches'] },
  'StockX':          { color:'#0d9e4f', bg:'rgba(13,158,79,0.08)', urlFn: q => `https://stockx.com/search?s=${q}`, desc:'Sneakers, streetwear & collectibles', categories:['Fashion','Collectibles','Trading Cards','Electronics','Toys'] },
  'The RealReal':    { color:'#000000', bg:'rgba(255,255,255,0.06)', urlFn: q => `https://www.therealreal.com/search?q=${q}`, desc:'Luxury consignment', categories:['Fashion','Watches','Art'] },
  'Grailed':         { color:'#000000', bg:'rgba(255,255,255,0.06)', urlFn: q => `https://www.grailed.com/shop?query=${q}`, desc:"Men's fashion & streetwear", categories:['Fashion'] },
  'Vestiaire':       { color:'#1a1a1a', bg:'rgba(255,255,255,0.06)', urlFn: q => `https://www.vestiairecollective.com/search/?q=${q}`, desc:'Designer resale', categories:['Fashion','Watches'] },
  'Chrono24':        { color:'#C8A951', bg:'rgba(200,169,81,0.08)', urlFn: q => `https://www.chrono24.com/search/index.htm?query=${q}`, desc:'Luxury watch marketplace', categories:['Watches'] },
  'TCGPlayer':       { color:'#F5A623', bg:'rgba(245,166,35,0.08)', urlFn: q => `https://www.tcgplayer.com/search/all/product?q=${q}`, desc:'Trading card marketplace', categories:['Trading Cards','Collectibles','Toys'] },
  'COMC':            { color:'#1a5276', bg:'rgba(26,82,118,0.08)', urlFn: q => `https://www.comc.com/Cards/Baseball,sp,${q}`, desc:'Sports cards & comics', categories:['Trading Cards','Collectibles','Sports'] },
  'Card Kingdom':    { color:'#2c3e50', bg:'rgba(44,62,80,0.08)', urlFn: q => `https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=${q}`, desc:'Magic: The Gathering', categories:['Trading Cards'] },
  'Discogs':         { color:'#333333', bg:'rgba(51,51,51,0.08)', urlFn: q => `https://www.discogs.com/search/?q=${q}&type=all`, desc:'Vinyl & music marketplace', categories:['Vinyl & Music','Vinyl','Collectibles'] },
  'BrickLink':       { color:'#D01012', bg:'rgba(208,16,18,0.08)', urlFn: q => `https://www.bricklink.com/v2/search.page?q=${q}`, desc:'LEGO parts & sets', categories:['LEGO','Toys','Collectibles'] },
  'AbeBooks':        { color:'#D4AF37', bg:'rgba(212,175,55,0.08)', urlFn: q => `https://www.abebooks.com/servlet/SearchResults?kn=${q}`, desc:'Rare & first edition books', categories:['Books','Collectibles'] },
  'Heritage Auctions':{ color:'#8B4513', bg:'rgba(139,69,19,0.08)', urlFn: q => `https://www.ha.com/search/searchresults.s?N=0&Ntt=${q}`, desc:'Coins, stamps & fine art', categories:['Coins & Stamps','Art','Collectibles'] },
  'Whatnot':         { color:'#7C3AED', bg:'rgba(124,58,237,0.08)', urlFn: q => `https://www.whatnot.com/search?q=${q}`, desc:'Live auction collectibles', categories:['Collectibles','Trading Cards','Toys','Fashion','Coins & Stamps','Vinyl & Music','Vinyl'] },
  'GoCollect':       { color:'#2196F3', bg:'rgba(33,150,243,0.08)', urlFn: q => `https://gocollect.com/search?q=${q}`, desc:'Comic book values', categories:['Collectibles','Books'] },
  'HobbyDB':         { color:'#FF6B35', bg:'rgba(255,107,53,0.08)', urlFn: q => `https://www.hobbydb.com/marketplaces/hobbydb/catalog_items?q=${q}`, desc:'Funko, toys & collectibles', categories:['Collectibles','Toys'] },
  'Catawiki':        { color:'#F7941D', bg:'rgba(247,148,29,0.08)', urlFn: q => `https://www.catawiki.com/en/s/?q=${q}`, desc:'Curated auctions', categories:['Collectibles','Art','Watches','Coins & Stamps'] },
  'TikTok Shop':     { color:'#FE2C55', bg:'rgba(254,44,85,0.08)', urlFn: q => `https://www.tiktok.com/search?q=${q}+shop`, desc:'Trending products', categories:['Fashion','Electronics','Collectibles','Toys'] },
  'Craigslist':      { color:'#5a0e8f', bg:'rgba(90,14,143,0.08)', urlFn: q => `https://www.craigslist.org/search/sss?query=${q}`, desc:'Local classifieds', categories:['Home','Automotive','Electronics','Tools'] },
}

// Category keyword hints for query inference
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Fashion': ['shirt','dress','jacket','jeans','sneaker','shoe','boots','bag','purse','handbag','wallet','belt','hat','sunglasses','coat','hoodie','sweater','nike','adidas','jordan','yeezy','supreme','gucci','louis vuitton','chanel','prada','balenciaga','poshmark','grailed','streetwear','vintage clothing','designer','lululemon','hermes','birkin'],
  'Electronics': ['phone','laptop','tablet','camera','headphones','speaker','monitor','gpu','cpu','console','playstation','xbox','nintendo','switch','iphone','ipad','macbook','samsung','sony','apple','airpods','tv','drone','gopro','kindle','oculus','quest','steam deck'],
  'Home': ['furniture','lamp','rug','plant','vase','chair','table','desk','shelf','mirror','clock','decor','candle','kitchen','cookware','appliance','blender','pottery','roomba','dyson','vitamix','le creuset','instant pot','air fryer','espresso'],
  'Watches': ['watch','rolex','omega','seiko','casio','cartier','patek','audemars','breitling','tudor','tag heuer','chronograph','timepiece','wristwatch','g-shock','tissot','hamilton','citizen'],
  'Art': ['painting','sculpture','print','lithograph','canvas','artwork','drawing','photograph','signed art','limited print','fine art','abstract','oil painting','watercolor','banksy','warhol','kaws'],
  'Sports': ['baseball','football','basketball','soccer','tennis','golf','hockey','bat','glove','jersey','helmet','racket','athletic','fitness','weights','bike'],
  'Collectibles': ['antique','vintage','memorabilia','figurine','statue','prop','funko','pop vinyl','bobblehead','pin','badge','medal','action figure','collectible','signed','autograph','limited edition','marvel','dc comics','star wars','disney','hot toys'],
  'Trading Cards': ['pokemon','magic the gathering','mtg','yugioh','baseball card','football card','sports card','tcg','charizard','psa','bgs','graded card','booster','topps','panini','prizm','rookie card'],
  'Vinyl & Music': ['vinyl','record','album','lp','turntable','cassette','cd','pressing','first press','discogs','beatles','pink floyd'],
  'LEGO': ['lego','brick','minifig','minifigure','technic','modular','bricklink','bionicle','ninjago'],
  'Books': ['book','novel','first edition','signed copy','hardcover','paperback','comic','comic book','manga','graphic novel','textbook','rare book'],
  'Coins & Stamps': ['coin','penny','quarter','dollar','stamp','bullion','silver','gold coin','numismatic','mint','proof','currency','banknote','morgan dollar'],
  'Toys': ['toy','doll','barbie','hot wheels','transformer','nerf','board game','puzzle','plush','stuffed animal','rc car','model kit','gi joe','power rangers','beanie baby','squishmallow'],
  'Automotive': ['car','truck','motorcycle','wheel','tire','bumper','engine','exhaust','headlight','auto part','classic car','vintage car','mustang','corvette','porsche','ferrari'],
  'Tools': ['drill','saw','wrench','hammer','screwdriver','tool set','power tool','dewalt','milwaukee','makita','craftsman','welder','compressor','snap-on'],
}

function inferCategoriesFromQuery(query: string): string[] {
  if (!query || !query.trim()) return []
  const q = query.toLowerCase().trim()
  const matched = new Set<string>()

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (q.includes(kw)) {
        matched.add(category)
        break
      }
    }
  }
  return Array.from(matched)
}

export interface MarketplaceLink {
  name: string
  color: string
  bg: string
  url: string
  desc: string
}

export function getMarketplacesForCategory(category: string | null, query: string): MarketplaceLink[] {
  const q = encodeURIComponent(query)

  let effectiveCategories: string[] | null = null
  if (category && category !== 'All') {
    effectiveCategories = [category]
  } else if (query && query.trim()) {
    effectiveCategories = inferCategoriesFromQuery(query)
  }

  return Object.entries(ALL_MARKETPLACES)
    .filter(([, mp]) => {
      if (mp.categories === 'all') return true
      if (effectiveCategories && effectiveCategories.length > 0) {
        return Array.isArray(mp.categories) && mp.categories.some(c => effectiveCategories!.includes(c))
      }
      return false
    })
    .map(([name, mp]) => ({ name, color: mp.color, bg: mp.bg, url: mp.urlFn(q), desc: mp.desc }))
}

// Social media links for research
export function getSocialLinks(query: string) {
  const webQ = encodeURIComponent(dedupeQuery(query))
  return [
    { name:'TikTok', color:'#000', bg:'linear-gradient(135deg,#25F4EE,#FE2C55)', url:`https://www.tiktok.com/search?q=${webQ}`, icon:'🎵' },
    { name:'Instagram', color:'#E1306C', bg:'linear-gradient(135deg,#833AB4,#E1306C,#F77737)', url:`https://www.instagram.com/explore/tags/${webQ.replace(/%20/g,'')}/`, icon:'📸' },
    { name:'YouTube', color:'#FF0000', bg:'rgba(255,0,0,0.15)', url:`https://www.youtube.com/results?search_query=${webQ}+review`, icon:'🎬' },
    { name:'X / Twitter', color:'#e7e9ea', bg:'rgba(255,255,255,0.1)', url:`https://x.com/search?q=${webQ}&f=live`, icon:'𝕏' },
    { name:'Reddit', color:'#FF4500', bg:'rgba(255,69,0,0.12)', url:`https://www.reddit.com/search/?q=${webQ}&sort=new`, icon:'💬' },
    { name:'Pinterest', color:'#E60023', bg:'rgba(230,0,35,0.12)', url:`https://www.pinterest.com/search/pins/?q=${webQ}`, icon:'📌' },
    { name:'Xiaohongshu', color:'#FE2C55', bg:'rgba(254,44,85,0.12)', url:`https://www.xiaohongshu.com/search_result?keyword=${webQ}`, icon:'📕' },
    { name:'Google Trends', color:'#4285f4', bg:'rgba(66,133,244,0.12)', url:`https://trends.google.com/trends/explore?q=${webQ}`, icon:'📈' },
  ]
}

// Trend analysis links
export function getTrendLinks(query: string) {
  const webQ = encodeURIComponent(dedupeQuery(query))
  return [
    { name:'Google Trends', color:'#4285f4', url:`https://trends.google.com/trends/explore?q=${webQ}`, desc:'Search interest over 12 months' },
    { name:'Google News', color:'#4285f4', url:`https://news.google.com/search?q=${webQ}`, desc:'Latest news and articles' },
    { name:'eBay Trending', color:'#e53238', url:`https://www.ebay.com/sch/i.html?_nkw=${webQ}&_sop=1`, desc:'Most watched listings' },
    { name:'Lyst (Fashion)', color:'#e7e9ea', url:`https://www.lyst.com/search/?q=${webQ}`, desc:'Fashion trend data' },
  ]
}

// Comp source options
export const COMP_SOURCES = ['eBay','Amazon','Poshmark','Mercari','StockX','Facebook Marketplace','Craigslist','The RealReal','Vestiaire','Grailed','Chrono24','TCGPlayer','COMC','Discogs','BrickLink','AbeBooks','Heritage Auctions','Whatnot','GoCollect','HobbyDB','Catawiki','TikTok Shop','Card Kingdom','Other']

// Deduplicate words in a query
export function dedupeQuery(q: string): string {
  const seen = new Set<string>()
  return q.split(/\s+/).filter(w => {
    const l = w.toLowerCase()
    if (seen.has(l)) return false
    seen.add(l)
    return true
  }).join(' ')
}

// Build search terms from an item
export function buildSearchTerms(name: string, brand?: string, model?: string): string {
  return dedupeQuery([name, brand, model].filter(Boolean).join(' '))
}
