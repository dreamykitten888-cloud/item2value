export interface BrandFacetOption {
  /** Label shown on the facet chip (e.g. "iPhone"). */
  label: string
  /**
   * Keyword(s) appended to the topic query when selected.
   * Keep this as a reasonably eBay-friendly search phrase.
   */
  searchTerm: string
}

/**
 * Curated "sub-category"/facet options per brand/topic.
 *
 * These facets are intentionally narrow so we don't show irrelevant categories
 * (e.g. "Perfume" on "Apple").
 */
export const BRAND_FACETS: Record<string, BrandFacetOption[]> = {
  Apple: [
    { label: 'iPhone', searchTerm: 'iPhone' },
    { label: 'iPad', searchTerm: 'iPad' },
    { label: 'MacBook', searchTerm: 'MacBook' },
    { label: 'AirPods', searchTerm: 'AirPods' },
    { label: 'Apple Watch', searchTerm: 'Apple Watch' },
    { label: 'Apple Accessories', searchTerm: 'watch bands' }, // broad-but-useful
  ],

  Samsung: [
    { label: 'Galaxy Phones', searchTerm: 'Galaxy' },
    { label: 'Galaxy Tab', searchTerm: 'Galaxy Tab' },
    { label: 'Galaxy Watches', searchTerm: 'Galaxy Watch' },
    { label: 'Galaxy Buds', searchTerm: 'Galaxy Buds' },
  ],

  Rolex: [
    { label: 'Rolex Watch', searchTerm: 'watch' },
    { label: 'Submariner', searchTerm: 'Submariner' },
    { label: 'Daytona', searchTerm: 'Daytona' },
    { label: 'Datejust', searchTerm: 'Datejust' },
  ],

  Nike: [
    { label: 'Sneakers', searchTerm: 'sneakers' },
    { label: 'Air Jordan', searchTerm: 'Air Jordan' },
    { label: 'Dunk', searchTerm: 'Dunk' },
    { label: 'Running Shoes', searchTerm: 'running shoes' },
    { label: 'Basketball Shoes', searchTerm: 'basketball shoes' },
    { label: 'Boots', searchTerm: 'boots' },
    { label: 'Slides', searchTerm: 'slides' },
    { label: 'Hoodies', searchTerm: 'hoodie' },
    { label: 'Jackets', searchTerm: 'jacket' },
    { label: 'T-Shirts', searchTerm: 't-shirt' },
    { label: 'Shorts', searchTerm: 'shorts' },
    { label: 'Windbreakers', searchTerm: 'windbreaker' },
    { label: 'Socks', searchTerm: 'socks' },
    { label: 'Hats / Caps', searchTerm: 'cap' },
    { label: 'Backpacks', searchTerm: 'backpack' },
    { label: 'Bags', searchTerm: 'bag' },
    { label: 'Sunglasses', searchTerm: 'sunglasses' },
  ],

  Gucci: [
    { label: 'Bags', searchTerm: 'bag' },
    { label: 'Handbags', searchTerm: 'handbag' },
    { label: 'Purse', searchTerm: 'purse' },
    { label: 'Wallets', searchTerm: 'wallet' },
    { label: 'Shoes (Sneakers)', searchTerm: 'sneakers' },
    { label: 'Loafers', searchTerm: 'loafers' },
    { label: 'Heels', searchTerm: 'heels' },
    { label: 'Jackets', searchTerm: 'jacket' },
    { label: 'Dresses', searchTerm: 'dress' },
    { label: 'Shirts', searchTerm: 'shirt' },
    { label: 'Jeans', searchTerm: 'jeans' },
    { label: 'Belts', searchTerm: 'belt' },
    { label: 'Scarves', searchTerm: 'scarf' },
    { label: 'Sunglasses', searchTerm: 'sunglasses' },
  ],

  Chanel: [
    { label: 'Classic Bags', searchTerm: 'bag' },
    { label: 'Handbags', searchTerm: 'handbag' },
    { label: 'Wallets', searchTerm: 'wallet' },
    { label: 'Sunglasses', searchTerm: 'sunglasses' },
    { label: 'Jackets', searchTerm: 'jacket' },
    { label: 'Coats', searchTerm: 'coat' },
    { label: 'Dresses', searchTerm: 'dress' },
    { label: 'Sweaters', searchTerm: 'sweater' },
    { label: 'Heels', searchTerm: 'heels' },
    { label: 'Sneakers', searchTerm: 'sneakers' },
    { label: 'Flats', searchTerm: 'flats' },
    { label: 'Belts', searchTerm: 'belt' },
    { label: 'Scarves', searchTerm: 'scarf' },
    { label: 'Earrings', searchTerm: 'earrings' },
  ],

  // Jewelry (rings/necklaces/bracelets/earrings + a few signatures)
  Cartier: [
    { label: 'Rings', searchTerm: 'ring' },
    { label: 'Necklaces', searchTerm: 'necklace' },
    { label: 'Bracelets', searchTerm: 'bracelet' },
    { label: 'Earrings', searchTerm: 'earrings' },
    { label: 'Pendants', searchTerm: 'pendant' },
    { label: 'Tank Watches', searchTerm: 'Tank watch' },
  ],

  'Van Cleef': [
    { label: 'Alhambra', searchTerm: 'Alhambra' },
    { label: 'Rings', searchTerm: 'ring' },
    { label: 'Necklaces', searchTerm: 'necklace' },
    { label: 'Bracelets', searchTerm: 'bracelet' },
    { label: 'Earrings', searchTerm: 'earrings' },
  ],
  'Van Cleef & Arpels': [
    { label: 'Alhambra', searchTerm: 'Alhambra' },
    { label: 'Rings', searchTerm: 'ring' },
    { label: 'Necklaces', searchTerm: 'necklace' },
    { label: 'Bracelets', searchTerm: 'bracelet' },
    { label: 'Earrings', searchTerm: 'earrings' },
  ],
  'Van Cleef and Arpels': [
    { label: 'Alhambra', searchTerm: 'Alhambra' },
    { label: 'Rings', searchTerm: 'ring' },
    { label: 'Necklaces', searchTerm: 'necklace' },
    { label: 'Bracelets', searchTerm: 'bracelet' },
    { label: 'Earrings', searchTerm: 'earrings' },
  ],

  Tiffany: [
    { label: 'Rings', searchTerm: 'ring' },
    { label: 'Engagement Rings', searchTerm: 'engagement ring' },
    { label: 'Necklaces', searchTerm: 'necklace' },
    { label: 'Bracelets', searchTerm: 'bracelet' },
    { label: 'Earrings', searchTerm: 'earrings' },
    { label: 'Sterling Silver', searchTerm: 'sterling silver' },
  ],
  'Tiffany & Co.': [
    { label: 'Rings', searchTerm: 'ring' },
    { label: 'Engagement Rings', searchTerm: 'engagement ring' },
    { label: 'Necklaces', searchTerm: 'necklace' },
    { label: 'Bracelets', searchTerm: 'bracelet' },
    { label: 'Earrings', searchTerm: 'earrings' },
    { label: 'Sterling Silver', searchTerm: 'sterling silver' },
  ],

  Bvlgari: [
    { label: 'Serpenti', searchTerm: 'Serpenti' },
    { label: 'Rings', searchTerm: 'ring' },
    { label: 'Necklaces', searchTerm: 'necklace' },
    { label: 'Bracelets', searchTerm: 'bracelet' },
    { label: 'Earrings', searchTerm: 'earrings' },
    { label: 'B.Zero1', searchTerm: 'B.Zero1' },
  ],
  Bulgari: [
    { label: 'Serpenti', searchTerm: 'Serpenti' },
    { label: 'Rings', searchTerm: 'ring' },
    { label: 'Necklaces', searchTerm: 'necklace' },
    { label: 'Bracelets', searchTerm: 'bracelet' },
    { label: 'Earrings', searchTerm: 'earrings' },
    { label: 'B.Zero1', searchTerm: 'B.Zero1' },
  ],

  'Harry Winston': [
    { label: 'Diamond Jewelry', searchTerm: 'diamond' },
    { label: 'Rings', searchTerm: 'ring' },
    { label: 'Necklaces', searchTerm: 'necklace' },
    { label: 'Bracelets', searchTerm: 'bracelet' },
    { label: 'Earrings', searchTerm: 'earrings' },
    { label: 'Engagement Rings', searchTerm: 'engagement ring' },
  ],

  // Luxury fashion: broaden facets so chips map to clothing/shoes/accessories
  Celine: [
    { label: 'Bags', searchTerm: 'bag' },
    { label: 'Wallets', searchTerm: 'wallet' },
    { label: 'Sunglasses', searchTerm: 'sunglasses' },
    { label: 'Belts', searchTerm: 'belt' },
    { label: 'Scarves', searchTerm: 'scarf' },
    { label: 'Shoes (Sneakers)', searchTerm: 'sneakers' },
    { label: 'Loafers', searchTerm: 'loafers' },
    { label: 'Heels', searchTerm: 'heels' },
    { label: 'Jackets', searchTerm: 'jacket' },
    { label: 'Coats', searchTerm: 'coat' },
    { label: 'Dresses', searchTerm: 'dress' },
    { label: 'Sweaters', searchTerm: 'sweater' },
  ],
  'Céline': [
    { label: 'Bags', searchTerm: 'bag' },
    { label: 'Wallets', searchTerm: 'wallet' },
    { label: 'Sunglasses', searchTerm: 'sunglasses' },
    { label: 'Belts', searchTerm: 'belt' },
    { label: 'Scarves', searchTerm: 'scarf' },
    { label: 'Shoes (Sneakers)', searchTerm: 'sneakers' },
    { label: 'Loafers', searchTerm: 'loafers' },
    { label: 'Heels', searchTerm: 'heels' },
    { label: 'Jackets', searchTerm: 'jacket' },
    { label: 'Coats', searchTerm: 'coat' },
    { label: 'Dresses', searchTerm: 'dress' },
    { label: 'Sweaters', searchTerm: 'sweater' },
  ],
  Dior: [
    { label: 'Bags', searchTerm: 'bag' },
    { label: 'Wallets', searchTerm: 'wallet' },
    { label: 'Sunglasses', searchTerm: 'sunglasses' },
    { label: 'Belts', searchTerm: 'belt' },
    { label: 'Scarves', searchTerm: 'scarf' },
    { label: 'Shoes (Sneakers)', searchTerm: 'sneakers' },
    { label: 'Loafers', searchTerm: 'loafers' },
    { label: 'Heels', searchTerm: 'heels' },
    { label: 'Jackets', searchTerm: 'jacket' },
    { label: 'Coats', searchTerm: 'coat' },
    { label: 'Dresses', searchTerm: 'dress' },
    { label: 'Sweaters', searchTerm: 'sweater' },
  ],
  'Louis Vuitton': [
    { label: 'Bags', searchTerm: 'bag' },
    { label: 'Wallets', searchTerm: 'wallet' },
    { label: 'Sunglasses', searchTerm: 'sunglasses' },
    { label: 'Belts', searchTerm: 'belt' },
    { label: 'Scarves', searchTerm: 'scarf' },
    { label: 'Shoes (Sneakers)', searchTerm: 'sneakers' },
    { label: 'Loafers', searchTerm: 'loafers' },
    { label: 'Heels', searchTerm: 'heels' },
    { label: 'Jackets', searchTerm: 'jacket' },
    { label: 'Coats', searchTerm: 'coat' },
    { label: 'Dresses', searchTerm: 'dress' },
    { label: 'Sweaters', searchTerm: 'sweater' },
  ],

  // Cameras & lenses
  Leica: [
    { label: 'Cameras', searchTerm: 'camera' },
    { label: 'Lenses', searchTerm: 'lens' },
    { label: 'Rangefinders', searchTerm: 'rangefinder' },
  ],
  Canon: [
    { label: 'Cameras', searchTerm: 'camera' },
    { label: 'Lenses', searchTerm: 'lens' },
    { label: 'EOS', searchTerm: 'EOS' },
  ],
  Fujifilm: [
    { label: 'Cameras', searchTerm: 'camera' },
    { label: 'Lenses', searchTerm: 'lens' },
    { label: 'X Series', searchTerm: 'X' },
  ],
  Nikon: [
    { label: 'Cameras', searchTerm: 'camera' },
    { label: 'Lenses', searchTerm: 'lens' },
    { label: 'Z Series', searchTerm: 'Z' },
  ],
  Sony: [
    { label: 'Cameras', searchTerm: 'camera' },
    { label: 'Lenses', searchTerm: 'lens' },
    { label: 'Alpha', searchTerm: 'Alpha' },
  ],

  Panasonic: [
    { label: 'Cameras', searchTerm: 'Lumix' },
    { label: 'Lenses', searchTerm: 'lens' },
    { label: 'G Series', searchTerm: 'G' },
  ],

  Olympus: [
    { label: 'Cameras', searchTerm: 'OM-D' },
    { label: 'Cameras (PEN)', searchTerm: 'PEN' },
    { label: 'Lenses', searchTerm: 'lens' },
  ],

  DJI: [
    { label: 'Drones', searchTerm: 'drone' },
    { label: 'Gimbals', searchTerm: 'gimbal' },
    { label: 'Mavic', searchTerm: 'Mavic' },
  ],

  // Furniture (office chairs)
  'Herman Miller': [
    { label: 'Office Chairs', searchTerm: 'office chair' },
    { label: 'Aeron', searchTerm: 'Aeron' },
    { label: 'Eames', searchTerm: 'Eames' },
  ],
  Steelcase: [
    { label: 'Office Chairs', searchTerm: 'office chair' },
    { label: 'Chairs', searchTerm: 'chair' },
  ],

  // Furniture (higher-end / retail brands)
  'Restoration Hardware': [
    { label: 'Sofas', searchTerm: 'sofa' },
    { label: 'Sectionals', searchTerm: 'sectional' },
    { label: 'Dining Tables', searchTerm: 'dining table' },
    { label: 'Beds', searchTerm: 'bed' },
    { label: 'Lighting', searchTerm: 'lamp' },
  ],
  RH: [
    { label: 'Sofas', searchTerm: 'sofa' },
    { label: 'Sectionals', searchTerm: 'sectional' },
    { label: 'Dining Tables', searchTerm: 'dining table' },
    { label: 'Beds', searchTerm: 'bed' },
    { label: 'Lighting', searchTerm: 'lamp' },
  ],
  Arhaus: [
    { label: 'Sofas', searchTerm: 'sofa' },
    { label: 'Sectionals', searchTerm: 'sectional' },
    { label: 'Chairs', searchTerm: 'chair' },
    { label: 'Dining Tables', searchTerm: 'dining table' },
    { label: 'Lighting', searchTerm: 'lamp' },
  ],
  'Baker Furniture': [
    { label: 'Sofas', searchTerm: 'sofa' },
    { label: 'Chairs', searchTerm: 'chair' },
    { label: 'Tables', searchTerm: 'table' },
    { label: 'Beds', searchTerm: 'bed' },
    { label: 'Cabinets', searchTerm: 'cabinet' },
  ],
  'Hickory Chair': [
    { label: 'Sofas', searchTerm: 'sofa' },
    { label: 'Chairs', searchTerm: 'chair' },
    { label: 'Tables', searchTerm: 'table' },
    { label: 'Beds', searchTerm: 'bed' },
    { label: 'Lighting', searchTerm: 'lamp' },
  ],
  Bernhardt: [
    { label: 'Sofas', searchTerm: 'sofa' },
    { label: 'Sectionals', searchTerm: 'sectional' },
    { label: 'Chairs', searchTerm: 'chair' },
    { label: 'Dining Tables', searchTerm: 'dining table' },
    { label: 'Lighting', searchTerm: 'lamp' },
  ],

  Minotti: [
    { label: 'Sofas', searchTerm: 'sofa' },
    { label: 'Sectionals', searchTerm: 'sectional' },
    { label: 'Chairs', searchTerm: 'chair' },
    { label: 'Dining Tables', searchTerm: 'dining table' },
    { label: 'Lighting', searchTerm: 'lamp' },
  ],
  Cassina: [
    { label: 'Sofas', searchTerm: 'sofa' },
    { label: 'Chairs', searchTerm: 'chair' },
    { label: 'Tables', searchTerm: 'table' },
    { label: 'Beds', searchTerm: 'bed' },
    { label: 'Lighting', searchTerm: 'lamp' },
  ],
  'Poltrona Frau': [
    { label: 'Sofas', searchTerm: 'sofa' },
    { label: 'Leather', searchTerm: 'leather' },
    { label: 'Chairs', searchTerm: 'chair' },
    { label: 'Dining Tables', searchTerm: 'dining table' },
    { label: 'Lighting', searchTerm: 'lamp' },
  ],
  'Roche Bobois': [
    { label: 'Sofas', searchTerm: 'sofa' },
    { label: 'Sectionals', searchTerm: 'sectional' },
    { label: 'Chairs', searchTerm: 'chair' },
    { label: 'Tables', searchTerm: 'table' },
    { label: 'Lighting', searchTerm: 'lamp' },
  ],
  'Boca do Lobo': [
    { label: 'Sofas', searchTerm: 'sofa' },
    { label: 'Chairs', searchTerm: 'chair' },
    { label: 'Dining Tables', searchTerm: 'dining table' },
    { label: 'Lighting', searchTerm: 'lamp' },
  ],
  'B&B Italia': [
    { label: 'Sofas', searchTerm: 'sofa' },
    { label: 'Chairs', searchTerm: 'chair' },
    { label: 'Tables', searchTerm: 'table' },
    { label: 'Beds', searchTerm: 'bed' },
    { label: 'Lighting', searchTerm: 'lamp' },
  ],

  // Anime figurines / characters
  'Good Smile Company': [
    { label: 'Nendoroid', searchTerm: 'nendoroid' },
    { label: 'Pop Up Parade', searchTerm: 'pop up parade' },
    { label: 'Scale Figures', searchTerm: 'scale figure' },
    { label: 'Action Figures', searchTerm: 'action figure' },
  ],
  'Good Smile Company (GSC)': [
    { label: 'Nendoroid', searchTerm: 'nendoroid' },
    { label: 'Pop Up Parade', searchTerm: 'pop up parade' },
    { label: 'Scale Figures', searchTerm: 'scale figure' },
    { label: 'Action Figures', searchTerm: 'action figure' },
  ],
  GSC: [
    { label: 'Nendoroid', searchTerm: 'nendoroid' },
    { label: 'Pop Up Parade', searchTerm: 'pop up parade' },
    { label: 'Scale Figures', searchTerm: 'scale figure' },
    { label: 'Action Figures', searchTerm: 'action figure' },
  ],

  Alter: [
    { label: 'Scale Figures', searchTerm: 'scale figure' },
    { label: 'Statues', searchTerm: 'statue' },
    { label: 'Resin Statues', searchTerm: 'resin statue' },
  ],

  'Max Factory': [
    { label: 'figma', searchTerm: 'figma' },
    { label: 'Model Kits', searchTerm: 'model kit' },
    { label: 'Scale Figures', searchTerm: 'scale figure' },
  ],

  'Aniplex+': [
    { label: 'Anime Figures', searchTerm: 'anime figure' },
    { label: 'Scale Figures', searchTerm: 'scale figure' },
    { label: 'Fate', searchTerm: 'Fate' },
  ],

  MegaHous: [
    { label: 'G.E.M.', searchTerm: 'G.E.M.' },
    { label: 'Scale Figures', searchTerm: 'scale figure' },
    { label: 'Statues', searchTerm: 'statue' },
  ],
  'MegaHouse': [
    { label: 'G.E.M.', searchTerm: 'G.E.M.' },
    { label: 'Scale Figures', searchTerm: 'scale figure' },
    { label: 'Statues', searchTerm: 'statue' },
  ],
}

