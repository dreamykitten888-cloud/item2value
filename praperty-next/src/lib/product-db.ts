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

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE: Manufacturers
  // ═══════════════════════════════════════════════════════

  // JDM
  'Nissan': { category: 'Automotive', emoji: '🚗', aliases: ['nissan', 'datsun', 'nismo', 'skyline', 'silvia', '240sx', '350z', '370z', 'z', 'fairlady', 'cefiro', 'laurel', 'stagea'] },
  'Toyota': { category: 'Automotive', emoji: '🚗', aliases: ['toyota', 'trd', 'supra', 'ae86', 'corolla', 'celica', 'mr2', 'chaser', 'mark ii', 'soarer', 'aristo', 'altezza', 'crown'] },
  'Honda': { category: 'Automotive', emoji: '🚗', aliases: ['honda', 'acura', 'mugen', 'nsx', 's2000', 'civic', 'integra', 'prelude', 'crx', 'del sol', 'beat', 'type r'] },
  'Mazda': { category: 'Automotive', emoji: '🚗', aliases: ['mazda', 'mazdaspeed', 'rx-7', 'rx7', 'rx-8', 'rx8', 'miata', 'mx-5', 'cosmo', 'roadster', 'rotary'] },
  'Subaru': { category: 'Automotive', emoji: '🚗', aliases: ['subaru', 'sti', 'wrx', 'impreza', 'brz', 'legacy', 'forester'] },
  'Mitsubishi': { category: 'Automotive', emoji: '🚗', aliases: ['mitsubishi', 'evo', 'lancer', 'evolution', 'eclipse', 'gto', '3000gt', 'galant vr4'] },
  'Suzuki': { category: 'Automotive', emoji: '🚗', aliases: ['suzuki', 'swift', 'cappuccino', 'jimny'] },
  'Daihatsu': { category: 'Automotive', emoji: '🚗', aliases: ['daihatsu', 'copen'] },
  'Lexus': { category: 'Automotive', emoji: '🚗', aliases: ['lexus', 'is300', 'gs300', 'sc300', 'sc400', 'lfa'] },
  'Infiniti': { category: 'Automotive', emoji: '🚗', aliases: ['infiniti', 'g35', 'g37', 'q50', 'q60'] },

  // Euro
  'BMW': { category: 'Automotive', emoji: '🚗', aliases: ['bmw', 'e30', 'e36', 'e46', 'e90', 'e92', 'f80', 'g80', 'm3', 'm4', 'm5', 'm2'] },
  'Mercedes': { category: 'Automotive', emoji: '🚗', aliases: ['mercedes', 'mercedes-benz', 'amg', 'c63', 'e63', 's63', 'g63', 'g-wagon'] },
  'Porsche': { category: 'Automotive', emoji: '🚗', aliases: ['porsche', '911', '964', '993', '996', '997', 'gt3', 'gt2', 'turbo s', 'cayman', 'boxster', '944', '928'] },
  'Volkswagen': { category: 'Automotive', emoji: '🚗', aliases: ['volkswagen', 'vw', 'gti', 'golf', 'r32', 'mk4', 'mk5', 'mk6', 'mk7', 'mk8', 'corrado'] },
  'Audi': { category: 'Automotive', emoji: '🚗', aliases: ['audi', 'rs', 'rs3', 'rs4', 'rs6', 'rs7', 'ttrs', 's4', 's5', 'b5', 'b8', 'b9'] },
  'Volvo': { category: 'Automotive', emoji: '🚗', aliases: ['volvo', '240', '740', '850', 's60', 'v70', 'c30'] },
  'Alfa Romeo': { category: 'Automotive', emoji: '🚗', aliases: ['alfa romeo', 'alfa', 'giulia', '4c'] },
  'Fiat': { category: 'Automotive', emoji: '🚗', aliases: ['fiat', 'abarth', '500'] },
  'Lancia': { category: 'Automotive', emoji: '🚗', aliases: ['lancia', 'delta', 'integrale', 'stratos'] },

  // Domestic
  'Ford': { category: 'Automotive', emoji: '🚗', aliases: ['ford', 'mustang', 'gt', 'shelby', 'cobra', 'focus st', 'focus rs', 'raptor', 'bronco', 'f150', 'lightning'] },
  'Chevrolet': { category: 'Automotive', emoji: '🚗', aliases: ['chevrolet', 'chevy', 'corvette', 'camaro', 'c5', 'c6', 'c7', 'c8', 'z06', 'zr1', 'ss', 'ls'] },
  'Dodge': { category: 'Automotive', emoji: '🚗', aliases: ['dodge', 'challenger', 'charger', 'viper', 'srt', 'hellcat', 'demon'] },
  'Tesla': { category: 'Automotive', emoji: '🚗', aliases: ['tesla', 'model s', 'model 3', 'model y', 'model x', 'cybertruck'] },
  'Pontiac': { category: 'Automotive', emoji: '🚗', aliases: ['pontiac', 'gto', 'firebird', 'trans am'] },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE: Aftermarket Parts Brands
  // ═══════════════════════════════════════════════════════

  // Turbo & Engine
  'Garrett': { category: 'Automotive', emoji: '🔧', aliases: ['garrett', 'gtx', 'gt35', 'gt28', 'g25', 'g30', 'g35'] },
  'BorgWarner': { category: 'Automotive', emoji: '🔧', aliases: ['borgwarner', 'efr'] },
  'Precision Turbo': { category: 'Automotive', emoji: '🔧', aliases: ['precision turbo', 'pte', 'precision'] },
  'HKS': { category: 'Automotive', emoji: '🔧', aliases: ['hks'] },
  'Tomei': { category: 'Automotive', emoji: '🔧', aliases: ['tomei', 'tomei powered'] },
  'GReddy': { category: 'Automotive', emoji: '🔧', aliases: ['greddy', 'trust'] },
  'Mishimoto': { category: 'Automotive', emoji: '🔧', aliases: ['mishimoto'] },
  'Skunk2': { category: 'Automotive', emoji: '🔧', aliases: ['skunk2'] },
  'Brian Crower': { category: 'Automotive', emoji: '🔧', aliases: ['brian crower', 'bc'] },
  'AEM': { category: 'Automotive', emoji: '🔧', aliases: ['aem'] },
  'Haltech': { category: 'Automotive', emoji: '🔧', aliases: ['haltech'] },
  'Link ECU': { category: 'Automotive', emoji: '🔧', aliases: ['link ecu', 'link'] },
  'APC Turbo': { category: 'Automotive', emoji: '🔧', aliases: ['apexi', 'a\'pexi'] },
  'Turbonetics': { category: 'Automotive', emoji: '🔧', aliases: ['turbonetics'] },
  'Full-Race': { category: 'Automotive', emoji: '🔧', aliases: ['full-race', 'full race'] },
  'Vibrant Performance': { category: 'Automotive', emoji: '🔧', aliases: ['vibrant', 'vibrant performance'] },
  'Manley': { category: 'Automotive', emoji: '🔧', aliases: ['manley'] },
  'CP Pistons': { category: 'Automotive', emoji: '🔧', aliases: ['cp pistons', 'cp carrillo'] },
  'Eagle Rods': { category: 'Automotive', emoji: '🔧', aliases: ['eagle rods', 'eagle'] },
  'ACL Bearings': { category: 'Automotive', emoji: '🔧', aliases: ['acl', 'acl bearings'] },
  'Cometic': { category: 'Automotive', emoji: '🔧', aliases: ['cometic'] },

  // Exhaust
  'Invidia': { category: 'Automotive', emoji: '🔧', aliases: ['invidia'] },
  'Fujitsubo': { category: 'Automotive', emoji: '🔧', aliases: ['fujitsubo'] },
  'Borla': { category: 'Automotive', emoji: '🔧', aliases: ['borla'] },
  'MagnaFlow': { category: 'Automotive', emoji: '🔧', aliases: ['magnaflow'] },
  'Kakimoto': { category: 'Automotive', emoji: '🔧', aliases: ['kakimoto'] },
  'Amuse': { category: 'Automotive', emoji: '🔧', aliases: ['amuse'] },
  'Tomei Expreme': { category: 'Automotive', emoji: '🔧', aliases: ['tomei expreme'] },

  // Suspension
  'Tein': { category: 'Automotive', emoji: '🔧', aliases: ['tein'] },
  'KW': { category: 'Automotive', emoji: '🔧', aliases: ['kw', 'kw suspensions'] },
  'Ohlins': { category: 'Automotive', emoji: '🔧', aliases: ['ohlins', 'öhlins'] },
  'BC Racing': { category: 'Automotive', emoji: '🔧', aliases: ['bc racing'] },
  'Stance': { category: 'Automotive', emoji: '🔧', aliases: ['stance'] },
  'Cusco': { category: 'Automotive', emoji: '🔧', aliases: ['cusco'] },
  'Whiteline': { category: 'Automotive', emoji: '🔧', aliases: ['whiteline'] },
  'Hardrace': { category: 'Automotive', emoji: '🔧', aliases: ['hardrace'] },
  'Megan Racing': { category: 'Automotive', emoji: '🔧', aliases: ['megan racing'] },
  'Fortune Auto': { category: 'Automotive', emoji: '🔧', aliases: ['fortune auto'] },
  'ISC Suspension': { category: 'Automotive', emoji: '🔧', aliases: ['isc', 'isc suspension'] },
  'Eibach': { category: 'Automotive', emoji: '🔧', aliases: ['eibach'] },
  'H&R': { category: 'Automotive', emoji: '🔧', aliases: ['h&r', 'h and r'] },
  'Bilstein': { category: 'Automotive', emoji: '🔧', aliases: ['bilstein'] },

  // Brakes
  'Brembo': { category: 'Automotive', emoji: '🔧', aliases: ['brembo'] },
  'StopTech': { category: 'Automotive', emoji: '🔧', aliases: ['stoptech'] },
  'Wilwood': { category: 'Automotive', emoji: '🔧', aliases: ['wilwood'] },
  'AP Racing': { category: 'Automotive', emoji: '🔧', aliases: ['ap racing'] },
  'Project Mu': { category: 'Automotive', emoji: '🔧', aliases: ['project mu'] },
  'Endless': { category: 'Automotive', emoji: '🔧', aliases: ['endless'] },
  'DBA': { category: 'Automotive', emoji: '🔧', aliases: ['dba', 'disc brakes australia'] },
  'EBC': { category: 'Automotive', emoji: '🔧', aliases: ['ebc', 'ebc brakes'] },

  // Wheels
  'Volk Racing': { category: 'Automotive', emoji: '🔧', aliases: ['volk', 'volk racing', 'te37', 'ce28'] },
  'Work Wheels': { category: 'Automotive', emoji: '🔧', aliases: ['work', 'work wheels', 'meister', 'emotion'] },
  'Enkei': { category: 'Automotive', emoji: '🔧', aliases: ['enkei', 'rpf1'] },
  'BBS': { category: 'Automotive', emoji: '🔧', aliases: ['bbs', 'lm', 'rs', 'ri'] },
  'SSR': { category: 'Automotive', emoji: '🔧', aliases: ['ssr', 'ssr wheels'] },
  'Advan': { category: 'Automotive', emoji: '🔧', aliases: ['advan', 'yokohama advan'] },
  'Weds': { category: 'Automotive', emoji: '🔧', aliases: ['weds', 'kranze'] },
  'WedsSport': { category: 'Automotive', emoji: '🔧', aliases: ['wedssport', 'tc105'] },
  'Gram Lights': { category: 'Automotive', emoji: '🔧', aliases: ['gram lights', 'rays gram lights', '57dr'] },
  'Rotiform': { category: 'Automotive', emoji: '🔧', aliases: ['rotiform'] },
  'Fifteen52': { category: 'Automotive', emoji: '🔧', aliases: ['fifteen52', '1552'] },
  'Konig': { category: 'Automotive', emoji: '🔧', aliases: ['konig'] },
  'Cosmis': { category: 'Automotive', emoji: '🔧', aliases: ['cosmis', 'cosmis racing'] },

  // Drivetrain & Clutch
  'Exedy': { category: 'Automotive', emoji: '🔧', aliases: ['exedy'] },
  'ACT': { category: 'Automotive', emoji: '🔧', aliases: ['act', 'advanced clutch'] },
  'Competition Clutch': { category: 'Automotive', emoji: '🔧', aliases: ['competition clutch', 'comp clutch'] },
  'OS Giken': { category: 'Automotive', emoji: '🔧', aliases: ['os giken'] },
  'Kaaz': { category: 'Automotive', emoji: '🔧', aliases: ['kaaz'] },
  'Nismo': { category: 'Automotive', emoji: '🔧', aliases: ['nismo'] },
  'TRD': { category: 'Automotive', emoji: '🔧', aliases: ['trd', 'toyota racing development'] },
  'Mugen': { category: 'Automotive', emoji: '🔧', aliases: ['mugen'] },
  'STI': { category: 'Automotive', emoji: '🔧', aliases: ['sti parts'] },
  'Ralliart': { category: 'Automotive', emoji: '🔧', aliases: ['ralliart'] },

  // Body & Aero
  'Rocket Bunny': { category: 'Automotive', emoji: '🔧', aliases: ['rocket bunny', 'tra kyoto'] },
  'Pandem': { category: 'Automotive', emoji: '🔧', aliases: ['pandem'] },
  'Varis': { category: 'Automotive', emoji: '🔧', aliases: ['varis'] },
  'Origin Lab': { category: 'Automotive', emoji: '🔧', aliases: ['origin lab', 'origin'] },
  'Seibon': { category: 'Automotive', emoji: '🔧', aliases: ['seibon'] },
  'Voltex': { category: 'Automotive', emoji: '🔧', aliases: ['voltex'] },
  'APR Performance': { category: 'Automotive', emoji: '🔧', aliases: ['apr', 'apr performance'] },
  'VIS Racing': { category: 'Automotive', emoji: '🔧', aliases: ['vis racing', 'vis'] },
  'Duraflex': { category: 'Automotive', emoji: '🔧', aliases: ['duraflex'] },
  'C-West': { category: 'Automotive', emoji: '🔧', aliases: ['c-west'] },
  'RE Amemiya': { category: 'Automotive', emoji: '🔧', aliases: ['re amemiya', 'amemiya'] },

  // Interior & Seats
  'Bride': { category: 'Automotive', emoji: '🔧', aliases: ['bride'] },
  'Recaro': { category: 'Automotive', emoji: '🔧', aliases: ['recaro'] },
  'Sparco': { category: 'Automotive', emoji: '🔧', aliases: ['sparco'] },
  'NRG': { category: 'Automotive', emoji: '🔧', aliases: ['nrg', 'nrg innovations'] },
  'Momo': { category: 'Automotive', emoji: '🔧', aliases: ['momo'] },
  'Nardi': { category: 'Automotive', emoji: '🔧', aliases: ['nardi'] },
  'Takata': { category: 'Automotive', emoji: '🔧', aliases: ['takata'] },

  // Gauges & Electronics
  'Defi': { category: 'Automotive', emoji: '🔧', aliases: ['defi'] },
  'GlowShift': { category: 'Automotive', emoji: '🔧', aliases: ['glowshift'] },
  'Innovate': { category: 'Automotive', emoji: '🔧', aliases: ['innovate', 'innovate motorsports'] },
  'AEM Electronics': { category: 'Automotive', emoji: '🔧', aliases: ['aem electronics'] },
  'MoTeC': { category: 'Automotive', emoji: '🔧', aliases: ['motec'] },
  'Grams Performance': { category: 'Automotive', emoji: '🔧', aliases: ['grams', 'grams performance'] },
  'Walbro': { category: 'Automotive', emoji: '🔧', aliases: ['walbro'] },
  'DeatschWerks': { category: 'Automotive', emoji: '🔧', aliases: ['deatschwerks', 'dw'] },
  'Injector Dynamics': { category: 'Automotive', emoji: '🔧', aliases: ['injector dynamics', 'id'] },

  // Tires
  'Yokohama': { category: 'Automotive', emoji: '🔧', aliases: ['yokohama', 'advan neova'] },
  'Toyo': { category: 'Automotive', emoji: '🔧', aliases: ['toyo', 'toyo tires', 'proxes'] },
  'Nitto': { category: 'Automotive', emoji: '🔧', aliases: ['nitto', 'nt555', 'nt05'] },
  'Federal': { category: 'Automotive', emoji: '🔧', aliases: ['federal', 'federal tires', 'rs-rr'] },
  'Michelin': { category: 'Automotive', emoji: '🔧', aliases: ['michelin', 'pilot sport'] },

  // ═══════════════════════════════════════════════════════
  // FASHION & CLOTHING
  // ═══════════════════════════════════════════════════════

  // Athleisure & Contemporary
  'Alo Yoga': { category: 'Clothing', emoji: '👗', aliases: ['alo', 'alo yoga'] },
  'Aritzia': { category: 'Clothing', emoji: '👗', aliases: ['aritzia', 'tna', 'babaton', 'wilfred', 'sunday best'] },
  'Lululemon': { category: 'Clothing', emoji: '👗', aliases: ['lululemon', 'lulu'] },

  // Mall & Y2K Brands
  'Hollister': { category: 'Clothing', emoji: '👕', aliases: ['hollister', 'hco'] },
  'Abercrombie & Fitch': { category: 'Clothing', emoji: '👕', aliases: ['abercrombie', 'abercrombie & fitch', 'abercrombie and fitch', 'a&f'] },
  'Baby Phat': { category: 'Clothing', emoji: '👗', aliases: ['baby phat', 'babyphat'] },
  'JNCO': { category: 'Clothing', emoji: '👖', aliases: ['jnco', 'jinco', 'jnco jeans'] },
  'Jordache': { category: 'Clothing', emoji: '👖', aliases: ['jordache'] },
  'Topshop': { category: 'Clothing', emoji: '👗', aliases: ['topshop', 'topman'] },
  'Ed Hardy': { category: 'Clothing', emoji: '👕', aliases: ['ed hardy'] },
  'Von Dutch': { category: 'Clothing', emoji: '🧢', aliases: ['von dutch'] },
  'Juicy Couture': { category: 'Clothing', emoji: '👗', aliases: ['juicy couture', 'juicy'] },
  'True Religion': { category: 'Clothing', emoji: '👖', aliases: ['true religion'] },
  'Miss Me': { category: 'Clothing', emoji: '👖', aliases: ['miss me', 'miss me jeans'] },
  'Rock Revival': { category: 'Clothing', emoji: '👖', aliases: ['rock revival'] },

  // Designer Shoes & Heels
  'Christian Louboutin': { category: 'Shoes', emoji: '👠', aliases: ['louboutin', 'christian louboutin', 'louboutins', 'red bottoms', 'red bottom'] },
  'Manolo Blahnik': { category: 'Shoes', emoji: '👠', aliases: ['manolo blahnik', 'manolo', 'manolos'] },
  'Jimmy Choo': { category: 'Shoes', emoji: '👠', aliases: ['jimmy choo', 'jimmy choos', 'choo'] },
  'Stuart Weitzman': { category: 'Shoes', emoji: '👠', aliases: ['stuart weitzman'] },
  'Salvatore Ferragamo': { category: 'Shoes', emoji: '👞', aliases: ['ferragamo', 'salvatore ferragamo'] },
  'Valentino': { category: 'Shoes', emoji: '👠', aliases: ['valentino', 'valentino garavani', 'rockstud'] },

  // Japanese & Avant-Garde Designers
  'Issey Miyake': { category: 'Clothing', emoji: '👗', aliases: ['issey miyake', 'miyake', 'pleats please', 'bao bao', 'homme plisse'] },
  'Comme des Garcons': { category: 'Clothing', emoji: '👕', aliases: ['comme des garcons', 'cdg', 'comme des garçons', 'rei kawakubo'] },
  'Yohji Yamamoto': { category: 'Clothing', emoji: '👕', aliases: ['yohji yamamoto', 'yohji', 'y-3'] },
  'Kapital': { category: 'Clothing', emoji: '👕', aliases: ['kapital'] },
  'Undercover': { category: 'Clothing', emoji: '👕', aliases: ['undercover', 'jun takahashi'] },
  'Visvim': { category: 'Clothing', emoji: '👟', aliases: ['visvim'] },
  'Neighborhood': { category: 'Clothing', emoji: '👕', aliases: ['neighborhood', 'nbhd'] },
  'Human Made': { category: 'Clothing', emoji: '👕', aliases: ['human made', 'nigo'] },

  // Luxury Fashion Houses (more)
  'Versace': { category: 'Clothing', emoji: '👗', aliases: ['versace', 'gianni versace'] },
  'Dolce & Gabbana': { category: 'Clothing', emoji: '👗', aliases: ['dolce gabbana', 'dolce & gabbana', 'd&g'] },
  'Burberry': { category: 'Clothing', emoji: '👕', aliases: ['burberry'] },
  'Saint Laurent': { category: 'Clothing', emoji: '👗', aliases: ['saint laurent', 'ysl', 'yves saint laurent'] },
  'Alexander McQueen': { category: 'Clothing', emoji: '👟', aliases: ['alexander mcqueen', 'mcqueen'] },
  'Givenchy': { category: 'Clothing', emoji: '👕', aliases: ['givenchy'] },
  'Miu Miu': { category: 'Clothing', emoji: '👗', aliases: ['miu miu'] },
  'Maison Margiela': { category: 'Clothing', emoji: '👟', aliases: ['margiela', 'maison margiela', 'martin margiela', 'mmm'] },
  'Acne Studios': { category: 'Clothing', emoji: '👕', aliases: ['acne studios', 'acne'] },
  'Rick Owens': { category: 'Clothing', emoji: '👕', aliases: ['rick owens', 'drkshdw'] },

  // Denim & Heritage
  'Levis': { category: 'Clothing', emoji: '👖', aliases: ['levis', "levi's", 'levi'] },
  'Wrangler': { category: 'Clothing', emoji: '👖', aliases: ['wrangler'] },
  'Diesel': { category: 'Clothing', emoji: '👖', aliases: ['diesel'] },
  'Evisu': { category: 'Clothing', emoji: '👖', aliases: ['evisu'] },
  'Naked & Famous': { category: 'Clothing', emoji: '👖', aliases: ['naked and famous', 'naked & famous'] },

  // Vintage & Sportswear
  'Ralph Lauren': { category: 'Clothing', emoji: '👕', aliases: ['ralph lauren', 'polo', 'polo ralph lauren'] },
  'Tommy Hilfiger': { category: 'Clothing', emoji: '👕', aliases: ['tommy hilfiger', 'tommy'] },
  'Calvin Klein': { category: 'Clothing', emoji: '👕', aliases: ['calvin klein', 'ck'] },
  'Lacoste': { category: 'Clothing', emoji: '👕', aliases: ['lacoste'] },
  'Fred Perry': { category: 'Clothing', emoji: '👕', aliases: ['fred perry'] },
  'The North Face': { category: 'Clothing', emoji: '🧥', aliases: ['north face', 'the north face', 'tnf'] },
  'Patagonia': { category: 'Clothing', emoji: '🧥', aliases: ['patagonia'] },
  'Arc\'teryx': { category: 'Clothing', emoji: '🧥', aliases: ['arcteryx', "arc'teryx", 'arc teryx'] },

  // Contemporary Women's
  'Reformation': { category: 'Clothing', emoji: '👗', aliases: ['reformation'] },
  'Zimmermann': { category: 'Clothing', emoji: '👗', aliases: ['zimmermann'] },
  'Sandro': { category: 'Clothing', emoji: '👗', aliases: ['sandro'] },
  'Maje': { category: 'Clothing', emoji: '👗', aliases: ['maje'] },
  'Self-Portrait': { category: 'Clothing', emoji: '👗', aliases: ['self-portrait', 'self portrait'] },
  'Free People': { category: 'Clothing', emoji: '👗', aliases: ['free people'] },
  'Anthropologie': { category: 'Clothing', emoji: '👗', aliases: ['anthropologie'] },

  // Statement & Going-Out Dresses
  'Selkie': { category: 'Clothing', emoji: '👗', aliases: ['selkie', 'selkie dress', 'selkie puff'] },
  'Murci': { category: 'Clothing', emoji: '👗', aliases: ['murci', 'murci dress'] },
  'Oh Polly': { category: 'Clothing', emoji: '👗', aliases: ['oh polly', 'ohpolly'] },
  'Jaded London': { category: 'Clothing', emoji: '👗', aliases: ['jaded london', 'jaded'] },
  '12th Tribe': { category: 'Clothing', emoji: '👗', aliases: ['12th tribe', 'twelfth tribe'] },
  'Missguided': { category: 'Clothing', emoji: '👗', aliases: ['missguided'] },
  'Fashion Nova': { category: 'Clothing', emoji: '👗', aliases: ['fashion nova', 'fashionnova'] },
  'I.AM.GIA': { category: 'Clothing', emoji: '👗', aliases: ['i.am.gia', 'i am gia', 'iamgia'] },
  'Akira': { category: 'Clothing', emoji: '👗', aliases: ['akira', 'shopakira'] },
  'House of CB': { category: 'Clothing', emoji: '👗', aliases: ['house of cb', 'houseofcb'] },
  'Pretty Little Thing': { category: 'Clothing', emoji: '👗', aliases: ['pretty little thing', 'plt', 'prettylittlething'] },

  // Luxury Fashion (additional)
  'Tom Ford': { category: 'Clothing', emoji: '👔', aliases: ['tom ford'] },
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
  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE: JDM Cars (old school to modern)
  // ═══════════════════════════════════════════════════════

  // Nissan / Datsun
  { name: 'Datsun 240Z S30', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Datsun 280Z S30', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Datsun 510 Bluebird', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Skyline GT-R R32', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Skyline GT-R R33', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Skyline GT-R R34', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Skyline GT-R R34 V-Spec II', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Skyline GT-R R34 Nur', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Skyline R31 GTS-R', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Silvia S13', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Silvia S14', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Silvia S15', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan 240SX S13', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan 240SX S14', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan 180SX', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan 300ZX Z32 Twin Turbo', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan 350Z Z33', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan 370Z Z34', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Z RZ34', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Fairlady Z S30', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Cefiro A31', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Laurel C33', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Stagea 260RS', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan Pulsar GTI-R', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan GT-R R35', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },
  { name: 'Nissan GT-R R35 Nismo', brand: 'Nissan', category: 'Automotive', emoji: '🚗' },

  // Toyota
  { name: 'Toyota 2000GT', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota Celica TA22', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota Celica GT-Four ST205', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota AE86 Sprinter Trueno', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota AE86 Corolla Levin', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota Supra A70', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota Supra A80', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota Supra A80 Twin Turbo', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota Supra A90 GR', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota MR2 AW11', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota MR2 SW20 Turbo', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota MR2 Spyder ZZW30', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota Chaser JZX100', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota Chaser JZX90', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota Mark II JZX100', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota Soarer Z30', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota Aristo JZS161', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota Crown Athlete', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota GR86', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota GR Corolla', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Toyota GR Yaris', brand: 'Toyota', category: 'Automotive', emoji: '🚗' },
  { name: 'Lexus IS300 SXE10', brand: 'Lexus', category: 'Automotive', emoji: '🚗' },
  { name: 'Lexus GS300 JZS160', brand: 'Lexus', category: 'Automotive', emoji: '🚗' },
  { name: 'Lexus SC300 / Soarer', brand: 'Lexus', category: 'Automotive', emoji: '🚗' },
  { name: 'Lexus LFA', brand: 'Lexus', category: 'Automotive', emoji: '🚗' },
  { name: 'Lexus LC500', brand: 'Lexus', category: 'Automotive', emoji: '🚗' },
  { name: 'Lexus IS F', brand: 'Lexus', category: 'Automotive', emoji: '🚗' },

  // Honda / Acura
  { name: 'Honda NSX NA1', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda NSX NA2', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda NSX NC1', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda S2000 AP1', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda S2000 AP2', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda Civic Type R EK9', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda Civic Type R EP3', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda Civic Type R FD2', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda Civic Type R FK8', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda Civic Type R FL5', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda Civic Si', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda CRX Si', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda CRX Del Sol', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda Integra Type R DC2', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda Integra Type R DC5', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda Prelude SH', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Honda Beat PP1', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Acura RSX Type-S', brand: 'Honda', category: 'Automotive', emoji: '🚗' },
  { name: 'Acura Integra Type R', brand: 'Honda', category: 'Automotive', emoji: '🚗' },

  // Mazda
  { name: 'Mazda Cosmo Sport 110S', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },
  { name: 'Mazda RX-3 Savanna', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },
  { name: 'Mazda RX-7 SA22C (FB)', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },
  { name: 'Mazda RX-7 FC', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },
  { name: 'Mazda RX-7 FC Turbo II', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },
  { name: 'Mazda RX-7 FD Spirit R', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },
  { name: 'Mazda RX-7 FD', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },
  { name: 'Mazda RX-8', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },
  { name: 'Mazda Miata NA', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },
  { name: 'Mazda Miata NB', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },
  { name: 'Mazda Miata NC', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },
  { name: 'Mazda Miata ND', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },
  { name: 'Mazda MX-5 RF', brand: 'Mazda', category: 'Automotive', emoji: '🚗' },

  // Subaru
  { name: 'Subaru Impreza WRX STI GC8', brand: 'Subaru', category: 'Automotive', emoji: '🚗' },
  { name: 'Subaru Impreza WRX STI GDB', brand: 'Subaru', category: 'Automotive', emoji: '🚗' },
  { name: 'Subaru Impreza WRX STI GRB', brand: 'Subaru', category: 'Automotive', emoji: '🚗' },
  { name: 'Subaru WRX STI VAB', brand: 'Subaru', category: 'Automotive', emoji: '🚗' },
  { name: 'Subaru WRX VB', brand: 'Subaru', category: 'Automotive', emoji: '🚗' },
  { name: 'Subaru BRZ', brand: 'Subaru', category: 'Automotive', emoji: '🚗' },
  { name: 'Subaru Legacy GT', brand: 'Subaru', category: 'Automotive', emoji: '🚗' },
  { name: 'Subaru 22B STI', brand: 'Subaru', category: 'Automotive', emoji: '🚗' },

  // Mitsubishi
  { name: 'Mitsubishi Lancer Evolution I', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },
  { name: 'Mitsubishi Lancer Evolution III', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },
  { name: 'Mitsubishi Lancer Evolution V', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },
  { name: 'Mitsubishi Lancer Evolution VI TME', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },
  { name: 'Mitsubishi Lancer Evolution VII', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },
  { name: 'Mitsubishi Lancer Evolution VIII MR', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },
  { name: 'Mitsubishi Lancer Evolution IX', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },
  { name: 'Mitsubishi Lancer Evolution X', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },
  { name: 'Mitsubishi Eclipse GSX', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },
  { name: 'Mitsubishi 3000GT VR-4', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },
  { name: 'Mitsubishi GTO Twin Turbo', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },
  { name: 'Mitsubishi Starion', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },
  { name: 'Mitsubishi Galant VR-4', brand: 'Mitsubishi', category: 'Automotive', emoji: '🚗' },

  // Other JDM
  { name: 'Suzuki Cappuccino', brand: 'Suzuki', category: 'Automotive', emoji: '🚗' },
  { name: 'Suzuki Swift Sport', brand: 'Suzuki', category: 'Automotive', emoji: '🚗' },
  { name: 'Suzuki Jimny', brand: 'Suzuki', category: 'Automotive', emoji: '🚗' },
  { name: 'Daihatsu Copen', brand: 'Daihatsu', category: 'Automotive', emoji: '🚗' },
  { name: 'Infiniti G35 Coupe', brand: 'Infiniti', category: 'Automotive', emoji: '🚗' },
  { name: 'Infiniti G37 Coupe', brand: 'Infiniti', category: 'Automotive', emoji: '🚗' },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE: Euro Cars
  // ═══════════════════════════════════════════════════════

  // BMW
  { name: 'BMW 2002 Turbo', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW E30 M3', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW E36 M3', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW E46 M3', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW E46 M3 CSL', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW E90 M3', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW E92 M3', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW F80 M3', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW G80 M3', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW E39 M5', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW E60 M5', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW F90 M5', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW M2 Competition', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW 1M Coupe', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW Z3 M Coupe', brand: 'BMW', category: 'Automotive', emoji: '🚗' },
  { name: 'BMW Z4 M40i', brand: 'BMW', category: 'Automotive', emoji: '🚗' },

  // Mercedes
  { name: 'Mercedes 190E 2.5-16 Evo II', brand: 'Mercedes', category: 'Automotive', emoji: '🚗' },
  { name: 'Mercedes C63 AMG W204', brand: 'Mercedes', category: 'Automotive', emoji: '🚗' },
  { name: 'Mercedes C63 AMG S W205', brand: 'Mercedes', category: 'Automotive', emoji: '🚗' },
  { name: 'Mercedes E63 AMG S', brand: 'Mercedes', category: 'Automotive', emoji: '🚗' },
  { name: 'Mercedes AMG GT', brand: 'Mercedes', category: 'Automotive', emoji: '🚗' },
  { name: 'Mercedes AMG GT Black Series', brand: 'Mercedes', category: 'Automotive', emoji: '🚗' },
  { name: 'Mercedes G63 AMG', brand: 'Mercedes', category: 'Automotive', emoji: '🚗' },
  { name: 'Mercedes SL65 AMG Black Series', brand: 'Mercedes', category: 'Automotive', emoji: '🚗' },
  { name: 'Mercedes CLK63 AMG Black Series', brand: 'Mercedes', category: 'Automotive', emoji: '🚗' },

  // Porsche
  { name: 'Porsche 356 Speedster', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },
  { name: 'Porsche 911 964 Carrera', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },
  { name: 'Porsche 911 993 Carrera', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },
  { name: 'Porsche 911 996 GT3', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },
  { name: 'Porsche 911 997 GT3 RS', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },
  { name: 'Porsche 911 991 GT3', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },
  { name: 'Porsche 911 992 GT3', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },
  { name: 'Porsche 911 Turbo S', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },
  { name: 'Porsche 944 Turbo', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },
  { name: 'Porsche 928 GTS', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },
  { name: 'Porsche Cayman GT4', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },
  { name: 'Porsche Boxster Spyder', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },
  { name: 'Porsche 718 Cayman GTS', brand: 'Porsche', category: 'Automotive', emoji: '🚗' },

  // VW / Audi
  { name: 'Volkswagen Golf GTI Mk1', brand: 'Volkswagen', category: 'Automotive', emoji: '🚗' },
  { name: 'Volkswagen Golf GTI Mk4', brand: 'Volkswagen', category: 'Automotive', emoji: '🚗' },
  { name: 'Volkswagen Golf R Mk7', brand: 'Volkswagen', category: 'Automotive', emoji: '🚗' },
  { name: 'Volkswagen Golf R Mk8', brand: 'Volkswagen', category: 'Automotive', emoji: '🚗' },
  { name: 'Volkswagen Corrado VR6', brand: 'Volkswagen', category: 'Automotive', emoji: '🚗' },
  { name: 'Volkswagen R32 Mk4', brand: 'Volkswagen', category: 'Automotive', emoji: '🚗' },
  { name: 'Audi RS3', brand: 'Audi', category: 'Automotive', emoji: '🚗' },
  { name: 'Audi RS4 B5 Avant', brand: 'Audi', category: 'Automotive', emoji: '🚗' },
  { name: 'Audi RS6 C7 Avant', brand: 'Audi', category: 'Automotive', emoji: '🚗' },
  { name: 'Audi TTRS', brand: 'Audi', category: 'Automotive', emoji: '🚗' },
  { name: 'Audi R8 V10', brand: 'Audi', category: 'Automotive', emoji: '🚗' },
  { name: 'Audi S4 B5', brand: 'Audi', category: 'Automotive', emoji: '🚗' },

  // Other Euro
  { name: 'Volvo 240 Turbo', brand: 'Volvo', category: 'Automotive', emoji: '🚗' },
  { name: 'Volvo 850 T5-R', brand: 'Volvo', category: 'Automotive', emoji: '🚗' },
  { name: 'Alfa Romeo Giulia Quadrifoglio', brand: 'Alfa Romeo', category: 'Automotive', emoji: '🚗' },
  { name: 'Alfa Romeo 4C', brand: 'Alfa Romeo', category: 'Automotive', emoji: '🚗' },
  { name: 'Lancia Delta Integrale', brand: 'Lancia', category: 'Automotive', emoji: '🚗' },
  { name: 'Lancia Stratos', brand: 'Lancia', category: 'Automotive', emoji: '🚗' },
  { name: 'Fiat 500 Abarth', brand: 'Fiat', category: 'Automotive', emoji: '🚗' },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE: Domestic Cars
  // ═══════════════════════════════════════════════════════

  { name: 'Ford Mustang GT 5.0', brand: 'Ford', category: 'Automotive', emoji: '🚗' },
  { name: 'Ford Mustang Shelby GT500', brand: 'Ford', category: 'Automotive', emoji: '🚗' },
  { name: 'Ford Mustang Mach 1', brand: 'Ford', category: 'Automotive', emoji: '🚗' },
  { name: 'Ford Mustang Boss 302', brand: 'Ford', category: 'Automotive', emoji: '🚗' },
  { name: 'Ford GT40', brand: 'Ford', category: 'Automotive', emoji: '🚗' },
  { name: 'Ford GT 2005', brand: 'Ford', category: 'Automotive', emoji: '🚗' },
  { name: 'Ford Focus RS', brand: 'Ford', category: 'Automotive', emoji: '🚗' },
  { name: 'Ford Bronco Raptor', brand: 'Ford', category: 'Automotive', emoji: '🚗' },
  { name: 'Ford F-150 Raptor', brand: 'Ford', category: 'Automotive', emoji: '🚗' },
  { name: 'Chevrolet Corvette C5 Z06', brand: 'Chevrolet', category: 'Automotive', emoji: '🚗' },
  { name: 'Chevrolet Corvette C6 Z06', brand: 'Chevrolet', category: 'Automotive', emoji: '🚗' },
  { name: 'Chevrolet Corvette C7 Z06', brand: 'Chevrolet', category: 'Automotive', emoji: '🚗' },
  { name: 'Chevrolet Corvette C7 ZR1', brand: 'Chevrolet', category: 'Automotive', emoji: '🚗' },
  { name: 'Chevrolet Corvette C8 Stingray', brand: 'Chevrolet', category: 'Automotive', emoji: '🚗' },
  { name: 'Chevrolet Corvette C8 Z06', brand: 'Chevrolet', category: 'Automotive', emoji: '🚗' },
  { name: 'Chevrolet Camaro ZL1', brand: 'Chevrolet', category: 'Automotive', emoji: '🚗' },
  { name: 'Chevrolet Camaro SS 1LE', brand: 'Chevrolet', category: 'Automotive', emoji: '🚗' },
  { name: 'Chevrolet Camaro Z/28', brand: 'Chevrolet', category: 'Automotive', emoji: '🚗' },
  { name: 'Dodge Challenger SRT Hellcat', brand: 'Dodge', category: 'Automotive', emoji: '🚗' },
  { name: 'Dodge Challenger SRT Demon', brand: 'Dodge', category: 'Automotive', emoji: '🚗' },
  { name: 'Dodge Charger SRT Hellcat', brand: 'Dodge', category: 'Automotive', emoji: '🚗' },
  { name: 'Dodge Viper GTS', brand: 'Dodge', category: 'Automotive', emoji: '🚗' },
  { name: 'Dodge Viper ACR', brand: 'Dodge', category: 'Automotive', emoji: '🚗' },
  { name: 'Pontiac GTO', brand: 'Pontiac', category: 'Automotive', emoji: '🚗' },
  { name: 'Pontiac Firebird Trans Am', brand: 'Pontiac', category: 'Automotive', emoji: '🚗' },
  { name: 'Tesla Model S Plaid', brand: 'Tesla', category: 'Automotive', emoji: '🚗' },
  { name: 'Tesla Model 3 Performance', brand: 'Tesla', category: 'Automotive', emoji: '🚗' },
  { name: 'Tesla Cybertruck', brand: 'Tesla', category: 'Automotive', emoji: '🚗' },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE PARTS: Engine & Turbo
  // ═══════════════════════════════════════════════════════

  { name: 'Garrett GTX3576R Turbo', brand: 'Garrett', category: 'Automotive', emoji: '🔧' },
  { name: 'Garrett GTX3071R Turbo', brand: 'Garrett', category: 'Automotive', emoji: '🔧' },
  { name: 'Garrett G25-660 Turbo', brand: 'Garrett', category: 'Automotive', emoji: '🔧' },
  { name: 'Garrett G30-770 Turbo', brand: 'Garrett', category: 'Automotive', emoji: '🔧' },
  { name: 'Garrett G35-1050 Turbo', brand: 'Garrett', category: 'Automotive', emoji: '🔧' },
  { name: 'BorgWarner EFR 7670 Turbo', brand: 'BorgWarner', category: 'Automotive', emoji: '🔧' },
  { name: 'BorgWarner EFR 8374 Turbo', brand: 'BorgWarner', category: 'Automotive', emoji: '🔧' },
  { name: 'Precision Turbo 6266 Gen2', brand: 'Precision Turbo', category: 'Automotive', emoji: '🔧' },
  { name: 'HKS GT III RS Turbo Kit (RB26)', brand: 'HKS', category: 'Automotive', emoji: '🔧' },
  { name: 'HKS GT Supercharger', brand: 'HKS', category: 'Automotive', emoji: '🔧' },
  { name: 'HKS SSQV Blow Off Valve', brand: 'HKS', category: 'Automotive', emoji: '🔧' },
  { name: 'HKS Hi-Power Exhaust', brand: 'HKS', category: 'Automotive', emoji: '🔧' },
  { name: 'Tomei Poncam Camshafts (SR20)', brand: 'Tomei', category: 'Automotive', emoji: '🔧' },
  { name: 'Tomei Poncam Camshafts (RB26)', brand: 'Tomei', category: 'Automotive', emoji: '🔧' },
  { name: 'Tomei Poncam Camshafts (2JZ)', brand: 'Tomei', category: 'Automotive', emoji: '🔧' },
  { name: 'Tomei Expreme Ti Exhaust', brand: 'Tomei', category: 'Automotive', emoji: '🔧' },
  { name: 'Tomei Arms Turbo Kit', brand: 'Tomei', category: 'Automotive', emoji: '🔧' },
  { name: 'GReddy Turbo Kit (SR20DET)', brand: 'GReddy', category: 'Automotive', emoji: '🔧' },
  { name: 'GReddy Intercooler Kit', brand: 'GReddy', category: 'Automotive', emoji: '🔧' },
  { name: 'GReddy Profec Boost Controller', brand: 'GReddy', category: 'Automotive', emoji: '🔧' },
  { name: 'GReddy Oil Cooler Kit', brand: 'GReddy', category: 'Automotive', emoji: '🔧' },
  { name: 'Mishimoto Radiator (S13/S14)', brand: 'Mishimoto', category: 'Automotive', emoji: '🔧' },
  { name: 'Mishimoto Intercooler Universal', brand: 'Mishimoto', category: 'Automotive', emoji: '🔧' },
  { name: 'Mishimoto Oil Catch Can', brand: 'Mishimoto', category: 'Automotive', emoji: '🔧' },
  { name: 'Skunk2 Ultra Series Intake Manifold', brand: 'Skunk2', category: 'Automotive', emoji: '🔧' },
  { name: 'Skunk2 Pro Series Camshafts', brand: 'Skunk2', category: 'Automotive', emoji: '🔧' },
  { name: 'Skunk2 Alpha Header (B/K Series)', brand: 'Skunk2', category: 'Automotive', emoji: '🔧' },
  { name: 'Brian Crower Stage 3 Cams (B Series)', brand: 'Brian Crower', category: 'Automotive', emoji: '🔧' },
  { name: 'Brian Crower Stroker Kit (RB26)', brand: 'Brian Crower', category: 'Automotive', emoji: '🔧' },
  { name: 'Manley H-Beam Rods (2JZ)', brand: 'Manley', category: 'Automotive', emoji: '🔧' },
  { name: 'Manley Turbo Tuff Pistons (EJ257)', brand: 'Manley', category: 'Automotive', emoji: '🔧' },
  { name: 'CP Pistons Forged Set (SR20DET)', brand: 'CP Pistons', category: 'Automotive', emoji: '🔧' },
  { name: 'CP Pistons Forged Set (LS3)', brand: 'CP Pistons', category: 'Automotive', emoji: '🔧' },
  { name: 'Eagle H-Beam Rods (B18C)', brand: 'Eagle Rods', category: 'Automotive', emoji: '🔧' },
  { name: 'Cometic MLS Head Gasket (RB26)', brand: 'Cometic', category: 'Automotive', emoji: '🔧' },
  { name: 'Cometic MLS Head Gasket (2JZ)', brand: 'Cometic', category: 'Automotive', emoji: '🔧' },
  { name: 'Cometic MLS Head Gasket (SR20)', brand: 'Cometic', category: 'Automotive', emoji: '🔧' },

  // ECU & Engine Management
  { name: 'Haltech Elite 2500', brand: 'Haltech', category: 'Automotive', emoji: '🔧' },
  { name: 'Haltech Nexus R5', brand: 'Haltech', category: 'Automotive', emoji: '🔧' },
  { name: 'Link ECU G4X Xtreme', brand: 'Link ECU', category: 'Automotive', emoji: '🔧' },
  { name: 'Link ECU G4X Thunder', brand: 'Link ECU', category: 'Automotive', emoji: '🔧' },
  { name: 'AEM Infinity 508', brand: 'AEM', category: 'Automotive', emoji: '🔧' },
  { name: 'AEM Cold Air Intake', brand: 'AEM', category: 'Automotive', emoji: '🔧' },
  { name: 'MoTeC M150 ECU', brand: 'MoTeC', category: 'Automotive', emoji: '🔧' },
  { name: 'MoTeC C125 Dash', brand: 'MoTeC', category: 'Automotive', emoji: '🔧' },

  // Fuel System
  { name: 'Injector Dynamics ID1050X', brand: 'Injector Dynamics', category: 'Automotive', emoji: '🔧' },
  { name: 'Injector Dynamics ID1700X', brand: 'Injector Dynamics', category: 'Automotive', emoji: '🔧' },
  { name: 'Injector Dynamics ID2600-XDS', brand: 'Injector Dynamics', category: 'Automotive', emoji: '🔧' },
  { name: 'DeatschWerks DW300 Fuel Pump', brand: 'DeatschWerks', category: 'Automotive', emoji: '🔧' },
  { name: 'DeatschWerks DW400 Fuel Pump', brand: 'DeatschWerks', category: 'Automotive', emoji: '🔧' },
  { name: 'Walbro 450 LPH Fuel Pump', brand: 'Walbro', category: 'Automotive', emoji: '🔧' },
  { name: 'Walbro 255 LPH Fuel Pump', brand: 'Walbro', category: 'Automotive', emoji: '🔧' },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE PARTS: Exhaust
  // ═══════════════════════════════════════════════════════

  { name: 'Invidia Gemini Catback (350Z)', brand: 'Invidia', category: 'Automotive', emoji: '🔧' },
  { name: 'Invidia N1 Catback (Civic Si)', brand: 'Invidia', category: 'Automotive', emoji: '🔧' },
  { name: 'Invidia Q300 Catback (WRX/STI)', brand: 'Invidia', category: 'Automotive', emoji: '🔧' },
  { name: 'Fujitsubo Legalis R Exhaust', brand: 'Fujitsubo', category: 'Automotive', emoji: '🔧' },
  { name: 'Borla ATAK Catback (Mustang GT)', brand: 'Borla', category: 'Automotive', emoji: '🔧' },
  { name: 'Borla S-Type Catback (C8 Corvette)', brand: 'Borla', category: 'Automotive', emoji: '🔧' },
  { name: 'MagnaFlow Competition Catback', brand: 'MagnaFlow', category: 'Automotive', emoji: '🔧' },
  { name: 'Tomei Expreme Ti Catback (370Z)', brand: 'Tomei', category: 'Automotive', emoji: '🔧' },
  { name: 'HKS Hi-Power Spec-L (BRZ/86)', brand: 'HKS', category: 'Automotive', emoji: '🔧' },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE PARTS: Suspension
  // ═══════════════════════════════════════════════════════

  { name: 'Tein Flex Z Coilovers', brand: 'Tein', category: 'Automotive', emoji: '🔧' },
  { name: 'Tein Mono Sport Coilovers', brand: 'Tein', category: 'Automotive', emoji: '🔧' },
  { name: 'Tein Super Racing Coilovers', brand: 'Tein', category: 'Automotive', emoji: '🔧' },
  { name: 'KW V3 Coilovers', brand: 'KW', category: 'Automotive', emoji: '🔧' },
  { name: 'KW Clubsport Coilovers', brand: 'KW', category: 'Automotive', emoji: '🔧' },
  { name: 'Ohlins Road & Track Coilovers', brand: 'Ohlins', category: 'Automotive', emoji: '🔧' },
  { name: 'Ohlins DFV Coilovers', brand: 'Ohlins', category: 'Automotive', emoji: '🔧' },
  { name: 'BC Racing BR Coilovers', brand: 'BC Racing', category: 'Automotive', emoji: '🔧' },
  { name: 'BC Racing DR Coilovers', brand: 'BC Racing', category: 'Automotive', emoji: '🔧' },
  { name: 'Fortune Auto 500 Coilovers', brand: 'Fortune Auto', category: 'Automotive', emoji: '🔧' },
  { name: 'Bilstein B16 PSS10 Coilovers', brand: 'Bilstein', category: 'Automotive', emoji: '🔧' },
  { name: 'Eibach Pro-Kit Springs', brand: 'Eibach', category: 'Automotive', emoji: '🔧' },
  { name: 'Eibach Anti-Roll Bar Kit', brand: 'Eibach', category: 'Automotive', emoji: '🔧' },
  { name: 'Cusco Adjustable Sway Bars', brand: 'Cusco', category: 'Automotive', emoji: '🔧' },
  { name: 'Cusco Strut Tower Bar', brand: 'Cusco', category: 'Automotive', emoji: '🔧' },
  { name: 'Whiteline Sway Bar Kit', brand: 'Whiteline', category: 'Automotive', emoji: '🔧' },
  { name: 'Whiteline Rear Camber Arms', brand: 'Whiteline', category: 'Automotive', emoji: '🔧' },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE PARTS: Brakes
  // ═══════════════════════════════════════════════════════

  { name: 'Brembo GT Big Brake Kit', brand: 'Brembo', category: 'Automotive', emoji: '🔧' },
  { name: 'Brembo Gran Turismo 4-Piston', brand: 'Brembo', category: 'Automotive', emoji: '🔧' },
  { name: 'Brembo Gran Turismo 6-Piston', brand: 'Brembo', category: 'Automotive', emoji: '🔧' },
  { name: 'StopTech ST-60 Big Brake Kit', brand: 'StopTech', category: 'Automotive', emoji: '🔧' },
  { name: 'StopTech Slotted Rotors', brand: 'StopTech', category: 'Automotive', emoji: '🔧' },
  { name: 'Wilwood Superlite 6R Brake Kit', brand: 'Wilwood', category: 'Automotive', emoji: '🔧' },
  { name: 'AP Racing Radi-CAL Brake Kit', brand: 'AP Racing', category: 'Automotive', emoji: '🔧' },
  { name: 'Project Mu HC+ Brake Pads', brand: 'Project Mu', category: 'Automotive', emoji: '🔧' },
  { name: 'Project Mu Club Racer Pads', brand: 'Project Mu', category: 'Automotive', emoji: '🔧' },
  { name: 'Endless MX72 Brake Pads', brand: 'Endless', category: 'Automotive', emoji: '🔧' },
  { name: 'Endless SSM Brake Pads', brand: 'Endless', category: 'Automotive', emoji: '🔧' },
  { name: 'EBC Yellowstuff Pads', brand: 'EBC', category: 'Automotive', emoji: '🔧' },
  { name: 'EBC Bluestuff NDX Pads', brand: 'EBC', category: 'Automotive', emoji: '🔧' },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE PARTS: Wheels
  // ═══════════════════════════════════════════════════════

  { name: 'Volk Racing TE37 Saga', brand: 'Volk Racing', category: 'Automotive', emoji: '🔧' },
  { name: 'Volk Racing TE37 SL', brand: 'Volk Racing', category: 'Automotive', emoji: '🔧' },
  { name: 'Volk Racing CE28N', brand: 'Volk Racing', category: 'Automotive', emoji: '🔧' },
  { name: 'Volk Racing ZE40', brand: 'Volk Racing', category: 'Automotive', emoji: '🔧' },
  { name: 'Work Meister S1 3-Piece', brand: 'Work Wheels', category: 'Automotive', emoji: '🔧' },
  { name: 'Work Emotion D9R', brand: 'Work Wheels', category: 'Automotive', emoji: '🔧' },
  { name: 'Work Emotion CR Kiwami', brand: 'Work Wheels', category: 'Automotive', emoji: '🔧' },
  { name: 'Work VS-XX 3-Piece', brand: 'Work Wheels', category: 'Automotive', emoji: '🔧' },
  { name: 'Enkei RPF1', brand: 'Enkei', category: 'Automotive', emoji: '🔧' },
  { name: 'Enkei NT03+M', brand: 'Enkei', category: 'Automotive', emoji: '🔧' },
  { name: 'Enkei GTC02', brand: 'Enkei', category: 'Automotive', emoji: '🔧' },
  { name: 'BBS LM', brand: 'BBS', category: 'Automotive', emoji: '🔧' },
  { name: 'BBS RS-GT', brand: 'BBS', category: 'Automotive', emoji: '🔧' },
  { name: 'BBS RI-A', brand: 'BBS', category: 'Automotive', emoji: '🔧' },
  { name: 'BBS FI-R', brand: 'BBS', category: 'Automotive', emoji: '🔧' },
  { name: 'SSR Professor SP1', brand: 'SSR', category: 'Automotive', emoji: '🔧' },
  { name: 'SSR Type-C', brand: 'SSR', category: 'Automotive', emoji: '🔧' },
  { name: 'Advan Racing GT', brand: 'Advan', category: 'Automotive', emoji: '🔧' },
  { name: 'Advan Racing RGIII', brand: 'Advan', category: 'Automotive', emoji: '🔧' },
  { name: 'Advan Racing TC4', brand: 'Advan', category: 'Automotive', emoji: '🔧' },
  { name: 'WedsSport TC105X', brand: 'WedsSport', category: 'Automotive', emoji: '🔧' },
  { name: 'WedsSport SA-72R', brand: 'WedsSport', category: 'Automotive', emoji: '🔧' },
  { name: 'Gram Lights 57DR', brand: 'Gram Lights', category: 'Automotive', emoji: '🔧' },
  { name: 'Gram Lights 57CR', brand: 'Gram Lights', category: 'Automotive', emoji: '🔧' },
  { name: 'Gram Lights 57Xtreme', brand: 'Gram Lights', category: 'Automotive', emoji: '🔧' },
  { name: 'Rotiform LAS-R', brand: 'Rotiform', category: 'Automotive', emoji: '🔧' },
  { name: 'Cosmis Racing XT-206R', brand: 'Cosmis', category: 'Automotive', emoji: '🔧' },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE PARTS: Drivetrain & Clutch
  // ═══════════════════════════════════════════════════════

  { name: 'Exedy Stage 2 Clutch Kit', brand: 'Exedy', category: 'Automotive', emoji: '🔧' },
  { name: 'Exedy Hyper Single Clutch', brand: 'Exedy', category: 'Automotive', emoji: '🔧' },
  { name: 'Exedy Twin Plate Clutch', brand: 'Exedy', category: 'Automotive', emoji: '🔧' },
  { name: 'ACT HD Clutch Kit', brand: 'ACT', category: 'Automotive', emoji: '🔧' },
  { name: 'ACT Extreme Clutch Kit', brand: 'ACT', category: 'Automotive', emoji: '🔧' },
  { name: 'Competition Clutch Stage 4', brand: 'Competition Clutch', category: 'Automotive', emoji: '🔧' },
  { name: 'Competition Clutch Twin Disc', brand: 'Competition Clutch', category: 'Automotive', emoji: '🔧' },
  { name: 'OS Giken Twin Plate Clutch', brand: 'OS Giken', category: 'Automotive', emoji: '🔧' },
  { name: 'OS Giken LSD', brand: 'OS Giken', category: 'Automotive', emoji: '🔧' },
  { name: 'Kaaz LSD 1.5-Way', brand: 'Kaaz', category: 'Automotive', emoji: '🔧' },
  { name: 'Nismo GT LSD Pro', brand: 'Nismo', category: 'Automotive', emoji: '🔧' },
  { name: 'Nismo Engine Bearings', brand: 'Nismo', category: 'Automotive', emoji: '🔧' },
  { name: 'TRD Short Throw Shifter', brand: 'TRD', category: 'Automotive', emoji: '🔧' },
  { name: 'Mugen Type R Shift Knob', brand: 'Mugen', category: 'Automotive', emoji: '🔧' },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE PARTS: Body & Aero
  // ═══════════════════════════════════════════════════════

  { name: 'Rocket Bunny V2 Wide Body Kit (BRZ)', brand: 'Rocket Bunny', category: 'Automotive', emoji: '🔧' },
  { name: 'Rocket Bunny V1 Kit (S13)', brand: 'Rocket Bunny', category: 'Automotive', emoji: '🔧' },
  { name: 'Pandem Wide Body Kit (E46 M3)', brand: 'Pandem', category: 'Automotive', emoji: '🔧' },
  { name: 'Pandem Wide Body Kit (R35 GT-R)', brand: 'Pandem', category: 'Automotive', emoji: '🔧' },
  { name: 'Varis Arising II Body Kit (Evo X)', brand: 'Varis', category: 'Automotive', emoji: '🔧' },
  { name: 'Varis Body Kit (BRZ)', brand: 'Varis', category: 'Automotive', emoji: '🔧' },
  { name: 'Origin Lab Racing Line Kit (S13)', brand: 'Origin Lab', category: 'Automotive', emoji: '🔧' },
  { name: 'Origin Lab Stream Line Kit (S14)', brand: 'Origin Lab', category: 'Automotive', emoji: '🔧' },
  { name: 'Seibon Carbon Fiber Hood (Civic)', brand: 'Seibon', category: 'Automotive', emoji: '🔧' },
  { name: 'Seibon Carbon Fiber Trunk', brand: 'Seibon', category: 'Automotive', emoji: '🔧' },
  { name: 'Voltex Type 5 GT Wing', brand: 'Voltex', category: 'Automotive', emoji: '🔧' },
  { name: 'Voltex Type 7 Swan Neck Wing', brand: 'Voltex', category: 'Automotive', emoji: '🔧' },
  { name: 'APR GTC-300 Wing', brand: 'APR Performance', category: 'Automotive', emoji: '🔧' },
  { name: 'APR GTC-500 Wing', brand: 'APR Performance', category: 'Automotive', emoji: '🔧' },
  { name: 'RE Amemiya FD3S Body Kit', brand: 'RE Amemiya', category: 'Automotive', emoji: '🔧' },
  { name: 'C-West N1 Body Kit (S2000)', brand: 'C-West', category: 'Automotive', emoji: '🔧' },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE PARTS: Interior & Seats
  // ═══════════════════════════════════════════════════════

  { name: 'Bride ZETA III Bucket Seat', brand: 'Bride', category: 'Automotive', emoji: '🔧' },
  { name: 'Bride Stradia II Reclining Seat', brand: 'Bride', category: 'Automotive', emoji: '🔧' },
  { name: 'Bride Vios III Seat', brand: 'Bride', category: 'Automotive', emoji: '🔧' },
  { name: 'Recaro Sportster CS Seat', brand: 'Recaro', category: 'Automotive', emoji: '🔧' },
  { name: 'Recaro Pole Position ABE', brand: 'Recaro', category: 'Automotive', emoji: '🔧' },
  { name: 'Sparco EVO QRT Seat', brand: 'Sparco', category: 'Automotive', emoji: '🔧' },
  { name: 'Sparco Sprint V Seat', brand: 'Sparco', category: 'Automotive', emoji: '🔧' },
  { name: 'NRG Quick Release Hub Kit', brand: 'NRG', category: 'Automotive', emoji: '🔧' },
  { name: 'NRG Prisma Steering Wheel', brand: 'NRG', category: 'Automotive', emoji: '🔧' },
  { name: 'Momo Prototipo Steering Wheel', brand: 'Momo', category: 'Automotive', emoji: '🔧' },
  { name: 'Momo Mod. 78 Steering Wheel', brand: 'Momo', category: 'Automotive', emoji: '🔧' },
  { name: 'Nardi Classic Steering Wheel', brand: 'Nardi', category: 'Automotive', emoji: '🔧' },
  { name: 'Nardi Deep Corn Steering Wheel', brand: 'Nardi', category: 'Automotive', emoji: '🔧' },
  { name: 'Takata 4-Point Harness', brand: 'Takata', category: 'Automotive', emoji: '🔧' },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE PARTS: Gauges & Electronics
  // ═══════════════════════════════════════════════════════

  { name: 'Defi Advance BF Boost Gauge', brand: 'Defi', category: 'Automotive', emoji: '🔧' },
  { name: 'Defi Advance CR Oil Temp Gauge', brand: 'Defi', category: 'Automotive', emoji: '🔧' },
  { name: 'Defi Advance A1 Gauge Set', brand: 'Defi', category: 'Automotive', emoji: '🔧' },
  { name: 'GlowShift Elite 10 Color Boost Gauge', brand: 'GlowShift', category: 'Automotive', emoji: '🔧' },
  { name: 'Innovate MTX-L Wideband', brand: 'Innovate', category: 'Automotive', emoji: '🔧' },
  { name: 'AEM X-Series Wideband UEGO', brand: 'AEM', category: 'Automotive', emoji: '🔧' },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE PARTS: Tires
  // ═══════════════════════════════════════════════════════

  { name: 'Yokohama Advan Neova AD09', brand: 'Yokohama', category: 'Automotive', emoji: '🔧' },
  { name: 'Yokohama Advan A052', brand: 'Yokohama', category: 'Automotive', emoji: '🔧' },
  { name: 'Toyo Proxes R888R', brand: 'Toyo', category: 'Automotive', emoji: '🔧' },
  { name: 'Toyo Proxes Sport', brand: 'Toyo', category: 'Automotive', emoji: '🔧' },
  { name: 'Nitto NT555 G2', brand: 'Nitto', category: 'Automotive', emoji: '🔧' },
  { name: 'Nitto NT05', brand: 'Nitto', category: 'Automotive', emoji: '🔧' },
  { name: 'Federal 595RS-RR', brand: 'Federal', category: 'Automotive', emoji: '🔧' },
  { name: 'Michelin Pilot Sport 4S', brand: 'Michelin', category: 'Automotive', emoji: '🔧' },
  { name: 'Michelin Pilot Sport Cup 2', brand: 'Michelin', category: 'Automotive', emoji: '🔧' },

  // ═══════════════════════════════════════════════════════
  // AUTOMOTIVE PARTS: OEM Performance
  // ═══════════════════════════════════════════════════════

  { name: 'Nismo S-Tune Suspension Kit', brand: 'Nismo', category: 'Automotive', emoji: '🔧' },
  { name: 'Nismo Aero Body Kit', brand: 'Nismo', category: 'Automotive', emoji: '🔧' },
  { name: 'Nismo R-Tune Exhaust', brand: 'Nismo', category: 'Automotive', emoji: '🔧' },
  { name: 'TRD Performance Air Filter', brand: 'TRD', category: 'Automotive', emoji: '🔧' },
  { name: 'TRD Rear Sway Bar', brand: 'TRD', category: 'Automotive', emoji: '🔧' },
  { name: 'Mugen Intake Manifold', brand: 'Mugen', category: 'Automotive', emoji: '🔧' },
  { name: 'Mugen Twin Loop Exhaust', brand: 'Mugen', category: 'Automotive', emoji: '🔧' },
  { name: 'Mugen Hardtop (S2000)', brand: 'Mugen', category: 'Automotive', emoji: '🔧' },
  { name: 'STI Flexible Tower Bar', brand: 'STI', category: 'Automotive', emoji: '🔧' },
  { name: 'STI Short Throw Shifter', brand: 'STI', category: 'Automotive', emoji: '🔧' },
  { name: 'Ralliart Intake', brand: 'Ralliart', category: 'Automotive', emoji: '🔧' },
  // Instruments
  { name: 'Gibson Les Paul Standard', brand: 'Gibson', category: 'Instruments', emoji: '🎸' },
  { name: 'Fender Stratocaster', brand: 'Fender', category: 'Instruments', emoji: '🎸' },
  // Furniture
  { name: 'Herman Miller Aeron', brand: 'Herman Miller', category: 'Furniture', emoji: '🪑' },
  // Streetwear
  { name: 'Supreme Box Logo Hoodie', brand: 'Supreme', category: 'Clothing', emoji: '👕' },
  { name: 'Bape Shark Hoodie', brand: 'Bape', category: 'Clothing', emoji: '👕' },

  // ═══════════════════════════════════════════════════════
  // FASHION & CLOTHING
  // ═══════════════════════════════════════════════════════

  // Alo Yoga
  { name: 'Alo Airlift Leggings', brand: 'Alo Yoga', category: 'Clothing', emoji: '👗' },
  { name: 'Alo Accolade Hoodie', brand: 'Alo Yoga', category: 'Clothing', emoji: '👗' },
  { name: 'Alo Muse Sweatpant', brand: 'Alo Yoga', category: 'Clothing', emoji: '👗' },
  { name: 'Alo Airlift Sports Bra', brand: 'Alo Yoga', category: 'Clothing', emoji: '👗' },
  { name: 'Alo Cargo Jogger', brand: 'Alo Yoga', category: 'Clothing', emoji: '👗' },

  // Aritzia
  { name: 'Aritzia Super Puff Jacket', brand: 'Aritzia', category: 'Clothing', emoji: '👗' },
  { name: 'Aritzia TNA Butter Leggings', brand: 'Aritzia', category: 'Clothing', emoji: '👗' },
  { name: 'Aritzia Babaton Contour Bodysuit', brand: 'Aritzia', category: 'Clothing', emoji: '👗' },
  { name: 'Aritzia Wilfred Free Divinity Romper', brand: 'Aritzia', category: 'Clothing', emoji: '👗' },
  { name: 'Aritzia Effortless Pant', brand: 'Aritzia', category: 'Clothing', emoji: '👗' },
  { name: 'Aritzia Sunday Best Maxi Dress', brand: 'Aritzia', category: 'Clothing', emoji: '👗' },

  // Hollister
  { name: 'Hollister Graphic Tee', brand: 'Hollister', category: 'Clothing', emoji: '👕' },
  { name: 'Hollister Cargo Pants', brand: 'Hollister', category: 'Clothing', emoji: '👕' },
  { name: 'Hollister Vintage Logo Hoodie', brand: 'Hollister', category: 'Clothing', emoji: '👕' },
  { name: 'Hollister California Surf Tee (Vintage)', brand: 'Hollister', category: 'Clothing', emoji: '👕' },

  // Abercrombie & Fitch
  { name: 'Abercrombie Fierce Cologne', brand: 'Abercrombie & Fitch', category: 'Clothing', emoji: '👕' },
  { name: 'Abercrombie Curve Love Jeans', brand: 'Abercrombie & Fitch', category: 'Clothing', emoji: '👕' },
  { name: 'Abercrombie Sloane Tailored Pant', brand: 'Abercrombie & Fitch', category: 'Clothing', emoji: '👕' },
  { name: 'Abercrombie Vintage Logo Tee (Y2K)', brand: 'Abercrombie & Fitch', category: 'Clothing', emoji: '👕' },
  { name: 'Abercrombie Muscle Polo (Vintage 2000s)', brand: 'Abercrombie & Fitch', category: 'Clothing', emoji: '👕' },

  // Baby Phat
  { name: 'Baby Phat Logo Tee', brand: 'Baby Phat', category: 'Clothing', emoji: '👗' },
  { name: 'Baby Phat Puffer Jacket', brand: 'Baby Phat', category: 'Clothing', emoji: '👗' },
  { name: 'Baby Phat Velour Tracksuit (Vintage)', brand: 'Baby Phat', category: 'Clothing', emoji: '👗' },
  { name: 'Baby Phat Cat Logo Hoodie (Y2K)', brand: 'Baby Phat', category: 'Clothing', emoji: '👗' },
  { name: 'Baby Phat Denim Mini Skirt (Vintage)', brand: 'Baby Phat', category: 'Clothing', emoji: '👗' },

  // JNCO
  { name: 'JNCO Mammoth Wide Leg Jeans', brand: 'JNCO', category: 'Clothing', emoji: '👖' },
  { name: 'JNCO Flamehead Jeans', brand: 'JNCO', category: 'Clothing', emoji: '👖' },
  { name: 'JNCO Crown Jeans (Vintage 90s)', brand: 'JNCO', category: 'Clothing', emoji: '👖' },
  { name: 'JNCO Kangaroo Jeans (Vintage)', brand: 'JNCO', category: 'Clothing', emoji: '👖' },
  { name: 'JNCO Twin Cannon Jeans', brand: 'JNCO', category: 'Clothing', emoji: '👖' },

  // Jordache
  { name: 'Jordache High Rise Mom Jeans', brand: 'Jordache', category: 'Clothing', emoji: '👖' },
  { name: 'Jordache Horse Logo Jeans (Vintage 80s)', brand: 'Jordache', category: 'Clothing', emoji: '👖' },
  { name: 'Jordache Denim Jacket (Vintage)', brand: 'Jordache', category: 'Clothing', emoji: '👖' },
  { name: 'Jordache Skinny Jeans', brand: 'Jordache', category: 'Clothing', emoji: '👖' },

  // Christian Louboutin
  { name: 'Louboutin So Kate 120mm', brand: 'Christian Louboutin', category: 'Shoes', emoji: '👠' },
  { name: 'Louboutin Pigalle Follies', brand: 'Christian Louboutin', category: 'Shoes', emoji: '👠' },
  { name: 'Louboutin Kate 85mm', brand: 'Christian Louboutin', category: 'Shoes', emoji: '👠' },
  { name: 'Louboutin Hot Chick 100mm', brand: 'Christian Louboutin', category: 'Shoes', emoji: '👠' },
  { name: 'Louboutin Iriza Pumps', brand: 'Christian Louboutin', category: 'Shoes', emoji: '👠' },
  { name: 'Louboutin Louis Spikes Sneakers', brand: 'Christian Louboutin', category: 'Shoes', emoji: '👠' },
  { name: 'Louboutin Cabata Tote', brand: 'Christian Louboutin', category: 'Bags', emoji: '👜' },

  // Manolo Blahnik
  { name: 'Manolo Blahnik Hangisi Pumps', brand: 'Manolo Blahnik', category: 'Shoes', emoji: '👠' },
  { name: 'Manolo Blahnik BB Pumps', brand: 'Manolo Blahnik', category: 'Shoes', emoji: '👠' },
  { name: 'Manolo Blahnik Maysale Mules', brand: 'Manolo Blahnik', category: 'Shoes', emoji: '👠' },
  { name: 'Manolo Blahnik Lurum Slingback', brand: 'Manolo Blahnik', category: 'Shoes', emoji: '👠' },
  { name: 'Manolo Blahnik Chaos Sandals', brand: 'Manolo Blahnik', category: 'Shoes', emoji: '👠' },

  // Jimmy Choo
  { name: 'Jimmy Choo Romy 100 Pumps', brand: 'Jimmy Choo', category: 'Shoes', emoji: '👠' },
  { name: 'Jimmy Choo Anouk Pumps', brand: 'Jimmy Choo', category: 'Shoes', emoji: '👠' },
  { name: 'Jimmy Choo Love 100 Pumps', brand: 'Jimmy Choo', category: 'Shoes', emoji: '👠' },
  { name: 'Jimmy Choo Bon Bon Bag', brand: 'Jimmy Choo', category: 'Bags', emoji: '👜' },
  { name: 'Jimmy Choo Lance Sandals', brand: 'Jimmy Choo', category: 'Shoes', emoji: '👠' },
  { name: 'Jimmy Choo Diamond Sneakers', brand: 'Jimmy Choo', category: 'Shoes', emoji: '👠' },

  // Topshop
  { name: 'Topshop Jamie Jeans', brand: 'Topshop', category: 'Clothing', emoji: '👗' },
  { name: 'Topshop Joni Jeans', brand: 'Topshop', category: 'Clothing', emoji: '👗' },
  { name: 'Topshop Blazer Dress', brand: 'Topshop', category: 'Clothing', emoji: '👗' },
  { name: 'Topshop Unique (Vintage)', brand: 'Topshop', category: 'Clothing', emoji: '👗' },

  // Issey Miyake
  { name: 'Issey Miyake Pleats Please Top', brand: 'Issey Miyake', category: 'Clothing', emoji: '👗' },
  { name: 'Issey Miyake Pleats Please Pants', brand: 'Issey Miyake', category: 'Clothing', emoji: '👗' },
  { name: 'Issey Miyake Bao Bao Lucent Tote', brand: 'Issey Miyake', category: 'Bags', emoji: '👜' },
  { name: 'Issey Miyake Bao Bao Prism Bag', brand: 'Issey Miyake', category: 'Bags', emoji: '👜' },
  { name: 'Issey Miyake Homme Plisse Joggers', brand: 'Issey Miyake', category: 'Clothing', emoji: '👗' },
  { name: 'Issey Miyake L\'Eau d\'Issey Perfume', brand: 'Issey Miyake', category: 'Clothing', emoji: '👗' },
  { name: 'Issey Miyake Plantation (Vintage 80s)', brand: 'Issey Miyake', category: 'Clothing', emoji: '👗' },

  // Comme des Garcons
  { name: 'CDG Play Heart Logo Tee', brand: 'Comme des Garcons', category: 'Clothing', emoji: '👕' },
  { name: 'CDG Play Converse High Top', brand: 'Comme des Garcons', category: 'Sneakers', emoji: '👟' },
  { name: 'CDG Wallet SA0641', brand: 'Comme des Garcons', category: 'Clothing', emoji: '👕' },
  { name: 'CDG Homme Plus Blazer (Vintage)', brand: 'Comme des Garcons', category: 'Clothing', emoji: '👕' },

  // Valentino
  { name: 'Valentino Rockstud Heels', brand: 'Valentino', category: 'Shoes', emoji: '👠' },
  { name: 'Valentino Rockstud Flats', brand: 'Valentino', category: 'Shoes', emoji: '👠' },
  { name: 'Valentino Garavani Roman Stud Bag', brand: 'Valentino', category: 'Bags', emoji: '👜' },
  { name: 'Valentino Open Sneakers', brand: 'Valentino', category: 'Sneakers', emoji: '👟' },

  // Versace
  { name: 'Versace Medusa Head Tee', brand: 'Versace', category: 'Clothing', emoji: '👗' },
  { name: 'Versace Chain Reaction Sneakers', brand: 'Versace', category: 'Sneakers', emoji: '👟' },
  { name: 'Versace Baroque Print Shirt (Vintage)', brand: 'Versace', category: 'Clothing', emoji: '👗' },
  { name: 'Versace Medusa Belt', brand: 'Versace', category: 'Clothing', emoji: '👗' },

  // Saint Laurent / YSL
  { name: 'YSL Loulou Bag', brand: 'Saint Laurent', category: 'Bags', emoji: '👜' },
  { name: 'YSL Kate Bag', brand: 'Saint Laurent', category: 'Bags', emoji: '👜' },
  { name: 'Saint Laurent Wyatt Chelsea Boots', brand: 'Saint Laurent', category: 'Shoes', emoji: '👞' },
  { name: 'Saint Laurent Court Classic Sneakers', brand: 'Saint Laurent', category: 'Sneakers', emoji: '👟' },

  // Maison Margiela
  { name: 'Margiela Tabi Boots', brand: 'Maison Margiela', category: 'Shoes', emoji: '👟' },
  { name: 'Margiela Replica Sneakers', brand: 'Maison Margiela', category: 'Sneakers', emoji: '👟' },
  { name: 'Margiela Paint Splatter Tee', brand: 'Maison Margiela', category: 'Clothing', emoji: '👕' },

  // Rick Owens
  { name: 'Rick Owens DRKSHDW Ramones', brand: 'Rick Owens', category: 'Sneakers', emoji: '👟' },
  { name: 'Rick Owens Geobasket', brand: 'Rick Owens', category: 'Sneakers', emoji: '👟' },
  { name: 'Rick Owens Leather Jacket', brand: 'Rick Owens', category: 'Clothing', emoji: '👕' },

  // Burberry
  { name: 'Burberry Trench Coat', brand: 'Burberry', category: 'Clothing', emoji: '👕' },
  { name: 'Burberry Nova Check Scarf', brand: 'Burberry', category: 'Clothing', emoji: '👕' },
  { name: 'Burberry Vintage Check Bag', brand: 'Burberry', category: 'Bags', emoji: '👜' },

  // Ralph Lauren (vintage gold)
  { name: 'Polo Ralph Lauren Bear Sweater (Vintage)', brand: 'Ralph Lauren', category: 'Clothing', emoji: '👕' },
  { name: 'Ralph Lauren Polo Sport Jacket (Vintage 90s)', brand: 'Ralph Lauren', category: 'Clothing', emoji: '👕' },
  { name: 'Ralph Lauren Purple Label Blazer', brand: 'Ralph Lauren', category: 'Clothing', emoji: '👕' },

  // Heritage Denim
  { name: 'Levis 501 Original Fit', brand: 'Levis', category: 'Clothing', emoji: '👖' },
  { name: 'Levis 501 Vintage (80s/90s)', brand: 'Levis', category: 'Clothing', emoji: '👖' },
  { name: 'Levis Trucker Jacket', brand: 'Levis', category: 'Clothing', emoji: '👖' },
  { name: 'Evisu No.2 Painted Jeans', brand: 'Evisu', category: 'Clothing', emoji: '👖' },
  { name: 'True Religion Super T Jeans', brand: 'True Religion', category: 'Clothing', emoji: '👖' },

  // Y2K Revival
  { name: 'Juicy Couture Velour Tracksuit', brand: 'Juicy Couture', category: 'Clothing', emoji: '👗' },
  { name: 'Juicy Couture Daydreamer Bag', brand: 'Juicy Couture', category: 'Bags', emoji: '👜' },
  { name: 'Von Dutch Trucker Hat', brand: 'Von Dutch', category: 'Clothing', emoji: '🧢' },
  { name: 'Ed Hardy Tiger Tee', brand: 'Ed Hardy', category: 'Clothing', emoji: '👕' },
  { name: 'Ed Hardy Love Kills Slowly Hoodie', brand: 'Ed Hardy', category: 'Clothing', emoji: '👕' },

  // Outerwear
  { name: 'North Face Nuptse 1996 Puffer', brand: 'The North Face', category: 'Clothing', emoji: '🧥' },
  { name: 'North Face Denali Fleece', brand: 'The North Face', category: 'Clothing', emoji: '🧥' },
  { name: 'Patagonia Retro-X Fleece', brand: 'Patagonia', category: 'Clothing', emoji: '🧥' },
  { name: 'Arc\'teryx Alpha SV Jacket', brand: 'Arc\'teryx', category: 'Clothing', emoji: '🧥' },

  // Contemporary Women's
  { name: 'Reformation Gavin Dress', brand: 'Reformation', category: 'Clothing', emoji: '👗' },
  { name: 'Zimmermann Postcard Mini Dress', brand: 'Zimmermann', category: 'Clothing', emoji: '👗' },
  { name: 'Free People FP Movement Set', brand: 'Free People', category: 'Clothing', emoji: '👗' },
  { name: 'Miu Miu Ballet Flats', brand: 'Miu Miu', category: 'Shoes', emoji: '👠' },
  { name: 'Miu Miu Micro Mini Skirt', brand: 'Miu Miu', category: 'Clothing', emoji: '👗' },

  // ═══════════════════════════════════════════════════════
  // SELKIE
  // ═══════════════════════════════════════════════════════
  { name: 'Selkie Puff Dress', brand: 'Selkie', category: 'Clothing', emoji: '👗' },
  { name: 'Selkie French Puff Dress', brand: 'Selkie', category: 'Clothing', emoji: '👗' },
  { name: 'Selkie Princess Dress', brand: 'Selkie', category: 'Clothing', emoji: '👗' },
  { name: 'Selkie Marie Dress', brand: 'Selkie', category: 'Clothing', emoji: '👗' },
  { name: 'Selkie Birthday Puff Dress', brand: 'Selkie', category: 'Clothing', emoji: '👗' },
  { name: 'Selkie Blossom Puff Dress', brand: 'Selkie', category: 'Clothing', emoji: '👗' },

  // ═══════════════════════════════════════════════════════
  // MURCI
  // ═══════════════════════════════════════════════════════
  { name: 'Murci Jasmine Mini Dress', brand: 'Murci', category: 'Clothing', emoji: '👗' },
  { name: 'Murci Rose Corset Dress', brand: 'Murci', category: 'Clothing', emoji: '👗' },
  { name: 'Murci Luna Maxi Dress', brand: 'Murci', category: 'Clothing', emoji: '👗' },
  { name: 'Murci Dahlia Midi Dress', brand: 'Murci', category: 'Clothing', emoji: '👗' },
  { name: 'Murci Lace Mini Dress', brand: 'Murci', category: 'Clothing', emoji: '👗' },

  // ═══════════════════════════════════════════════════════
  // OH POLLY
  // ═══════════════════════════════════════════════════════
  { name: 'Oh Polly Corset Mini Dress', brand: 'Oh Polly', category: 'Clothing', emoji: '👗' },
  { name: 'Oh Polly Ruched Bodycon Dress', brand: 'Oh Polly', category: 'Clothing', emoji: '👗' },
  { name: 'Oh Polly Cut Out Maxi Dress', brand: 'Oh Polly', category: 'Clothing', emoji: '👗' },
  { name: 'Oh Polly Satin Slip Dress', brand: 'Oh Polly', category: 'Clothing', emoji: '👗' },
  { name: 'Oh Polly Mesh Bodysuit', brand: 'Oh Polly', category: 'Clothing', emoji: '👗' },

  // ═══════════════════════════════════════════════════════
  // JADED LONDON
  // ═══════════════════════════════════════════════════════
  { name: 'Jaded London Parachute Cargo Pants', brand: 'Jaded London', category: 'Clothing', emoji: '👗' },
  { name: 'Jaded London Colossus Jeans', brand: 'Jaded London', category: 'Clothing', emoji: '👗' },
  { name: 'Jaded London Mesh Top', brand: 'Jaded London', category: 'Clothing', emoji: '👗' },
  { name: 'Jaded London Patchwork Jacket', brand: 'Jaded London', category: 'Clothing', emoji: '👗' },
  { name: 'Jaded London Sequin Mini Dress', brand: 'Jaded London', category: 'Clothing', emoji: '👗' },
  { name: 'Jaded London Distressed Wide Leg Jeans', brand: 'Jaded London', category: 'Clothing', emoji: '👗' },

  // ═══════════════════════════════════════════════════════
  // 12TH TRIBE
  // ═══════════════════════════════════════════════════════
  { name: '12th Tribe Crochet Set', brand: '12th Tribe', category: 'Clothing', emoji: '👗' },
  { name: '12th Tribe Festival Bodysuit', brand: '12th Tribe', category: 'Clothing', emoji: '👗' },
  { name: '12th Tribe Fringe Mini Dress', brand: '12th Tribe', category: 'Clothing', emoji: '👗' },
  { name: '12th Tribe Cowgirl Boots', brand: '12th Tribe', category: 'Shoes', emoji: '👢' },
  { name: '12th Tribe Chain Bikini Set', brand: '12th Tribe', category: 'Clothing', emoji: '👗' },

  // ═══════════════════════════════════════════════════════
  // MISSGUIDED
  // ═══════════════════════════════════════════════════════
  { name: 'Missguided Satin Wrap Dress', brand: 'Missguided', category: 'Clothing', emoji: '👗' },
  { name: 'Missguided Cargo Trousers', brand: 'Missguided', category: 'Clothing', emoji: '👗' },
  { name: 'Missguided Corset Top', brand: 'Missguided', category: 'Clothing', emoji: '👗' },
  { name: 'Missguided Teddy Coat', brand: 'Missguided', category: 'Clothing', emoji: '👗' },

  // ═══════════════════════════════════════════════════════
  // FASHION NOVA
  // ═══════════════════════════════════════════════════════
  { name: 'Fashion Nova Bodycon Dress', brand: 'Fashion Nova', category: 'Clothing', emoji: '👗' },
  { name: 'Fashion Nova High Waist Jeans', brand: 'Fashion Nova', category: 'Clothing', emoji: '👗' },
  { name: 'Fashion Nova Ruched Mini Dress', brand: 'Fashion Nova', category: 'Clothing', emoji: '👗' },
  { name: 'Fashion Nova Two Piece Set', brand: 'Fashion Nova', category: 'Clothing', emoji: '👗' },
  { name: 'Fashion Nova Cut Out Jumpsuit', brand: 'Fashion Nova', category: 'Clothing', emoji: '👗' },

  // ═══════════════════════════════════════════════════════
  // I.AM.GIA
  // ═══════════════════════════════════════════════════════
  { name: 'I.AM.GIA Cobain Pants', brand: 'I.AM.GIA', category: 'Clothing', emoji: '👗' },
  { name: 'I.AM.GIA Pixie Coat', brand: 'I.AM.GIA', category: 'Clothing', emoji: '👗' },
  { name: 'I.AM.GIA Jupiter Corset', brand: 'I.AM.GIA', category: 'Clothing', emoji: '👗' },
  { name: 'I.AM.GIA Venus Pant', brand: 'I.AM.GIA', category: 'Clothing', emoji: '👗' },
  { name: 'I.AM.GIA Halo Mini Dress', brand: 'I.AM.GIA', category: 'Clothing', emoji: '👗' },

  // ═══════════════════════════════════════════════════════
  // AKIRA
  // ═══════════════════════════════════════════════════════
  { name: 'Akira Sequin Mini Dress', brand: 'Akira', category: 'Clothing', emoji: '👗' },
  { name: 'Akira Rhinestone Bodysuit', brand: 'Akira', category: 'Clothing', emoji: '👗' },
  { name: 'Akira Feather Trim Dress', brand: 'Akira', category: 'Clothing', emoji: '👗' },
  { name: 'Akira Cut Out Jumpsuit', brand: 'Akira', category: 'Clothing', emoji: '👗' },
  { name: 'Akira Mesh Maxi Dress', brand: 'Akira', category: 'Clothing', emoji: '👗' },

  // ═══════════════════════════════════════════════════════
  // GUCCI (expanded products)
  // ═══════════════════════════════════════════════════════
  { name: 'Gucci Ace Sneakers', brand: 'Gucci', category: 'Sneakers', emoji: '👟' },
  { name: 'Gucci Horsebit Loafers', brand: 'Gucci', category: 'Shoes', emoji: '👞' },
  { name: 'Gucci Dionysus Bag', brand: 'Gucci', category: 'Bags', emoji: '👜' },
  { name: 'Gucci Jackie 1961 Bag', brand: 'Gucci', category: 'Bags', emoji: '👜' },
  { name: 'Gucci Bamboo 1947 Bag', brand: 'Gucci', category: 'Bags', emoji: '👜' },
  { name: 'Gucci GG Belt', brand: 'Gucci', category: 'Clothing', emoji: '👜' },
  { name: 'Gucci Rhyton Sneakers', brand: 'Gucci', category: 'Sneakers', emoji: '👟' },
  { name: 'Gucci Screener Sneakers (Vintage)', brand: 'Gucci', category: 'Sneakers', emoji: '👟' },
  { name: 'Gucci Flora Silk Scarf (Vintage)', brand: 'Gucci', category: 'Clothing', emoji: '👗' },
  { name: 'Gucci Tom Ford Era Bamboo Bag (Vintage)', brand: 'Gucci', category: 'Bags', emoji: '👜' },
  { name: 'Gucci Ophidia GG Tote', brand: 'Gucci', category: 'Bags', emoji: '👜' },

  // ═══════════════════════════════════════════════════════
  // GIVENCHY
  // ═══════════════════════════════════════════════════════
  { name: 'Givenchy Antigona Bag', brand: 'Givenchy', category: 'Bags', emoji: '👜' },
  { name: 'Givenchy Shark Lock Boots', brand: 'Givenchy', category: 'Shoes', emoji: '👢' },
  { name: 'Givenchy Rottweiler Tee', brand: 'Givenchy', category: 'Clothing', emoji: '👕' },
  { name: 'Givenchy 4G Logo Sweater', brand: 'Givenchy', category: 'Clothing', emoji: '👕' },
  { name: 'Givenchy Kenny Bag', brand: 'Givenchy', category: 'Bags', emoji: '👜' },
  { name: 'Givenchy Pandora Bag', brand: 'Givenchy', category: 'Bags', emoji: '👜' },
  { name: 'Givenchy Nightingale Bag (Vintage)', brand: 'Givenchy', category: 'Bags', emoji: '👜' },

  // ═══════════════════════════════════════════════════════
  // TOM FORD
  // ═══════════════════════════════════════════════════════
  { name: 'Tom Ford Sunglasses', brand: 'Tom Ford', category: 'Clothing', emoji: '🕶️' },
  { name: 'Tom Ford Whitney Sunglasses', brand: 'Tom Ford', category: 'Clothing', emoji: '🕶️' },
  { name: 'Tom Ford Black Orchid Perfume', brand: 'Tom Ford', category: 'Clothing', emoji: '👔' },
  { name: 'Tom Ford Lost Cherry Perfume', brand: 'Tom Ford', category: 'Clothing', emoji: '👔' },
  { name: 'Tom Ford Tobacco Vanille', brand: 'Tom Ford', category: 'Clothing', emoji: '👔' },
  { name: 'Tom Ford Oud Wood', brand: 'Tom Ford', category: 'Clothing', emoji: '👔' },
  { name: 'Tom Ford Buckley Suit', brand: 'Tom Ford', category: 'Clothing', emoji: '👔' },
  { name: 'Tom Ford Slim Fit Dress Shirt', brand: 'Tom Ford', category: 'Clothing', emoji: '👔' },
  { name: 'Tom Ford Logo Belt', brand: 'Tom Ford', category: 'Clothing', emoji: '👔' },
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

/**
 * Async product search: hits Supabase full-text search API first,
 * falls back to local getSuggestions if the API fails or is slow.
 */
export async function searchProducts(
  query: string,
  limit = 8
): Promise<{ name: string; brand: string; model?: string; category: string; emoji: string }[]> {
  if (!query || query.trim().length < 2) {
    return getSuggestions(query, limit)
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const res = await fetch(
      `/api/product-search?q=${encodeURIComponent(query)}&limit=${limit}`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)

    if (!res.ok) throw new Error('API error')

    const { results } = await res.json()
    if (results && results.length > 0) {
      return results
    }

    // API returned empty: fall back to local
    return getSuggestions(query, limit)
  } catch {
    // Network error or timeout: fall back to local
    return getSuggestions(query, limit)
  }
}
