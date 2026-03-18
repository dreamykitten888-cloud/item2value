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
  ],

  Gucci: [
    { label: 'Bags', searchTerm: 'bag' },
    { label: 'Handbags', searchTerm: 'handbag' },
    { label: 'Purse', searchTerm: 'purse' },
    { label: 'Wallets', searchTerm: 'wallet' },
  ],

  Chanel: [
    { label: 'Classic Bags', searchTerm: 'bag' },
    { label: 'Handbags', searchTerm: 'handbag' },
    { label: 'Wallets', searchTerm: 'wallet' },
    { label: 'Sunglasses', searchTerm: 'sunglasses' },
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
}

