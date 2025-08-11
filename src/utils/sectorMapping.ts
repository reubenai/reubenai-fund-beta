// Sector mapping utilities for backward compatibility and thesis alignment

import { STANDARDIZED_SECTORS } from '@/constants/sectors';

// Legacy basic sectors for backward compatibility
export const LEGACY_BASIC_SECTORS = [
  'Technology', 'Healthcare', 'FinTech', 'AI/ML', 'SaaS', 'E-commerce',
  'Biotech', 'CleanTech', 'EdTech', 'Food & Beverage', 'Real Estate',
  'Manufacturing', 'Consumer Goods', 'Energy', 'Transportation'
];

// Mapping from detailed sectors to high-level categories
export const SECTOR_CATEGORY_MAPPING: Record<string, string[]> = {
  'Technology': [
    'artificial-intelligence',
    'software-development-tools', 
    'data-analytics',
    'blockchain-cryptocurrency',
    'cybersecurity',
    'cloud-computing-infrastructure',
    'saas-platforms',
    'mobile-applications',
    'web-development',
    'gaming-entertainment',
    'vr-ar',
    'iot-devices',
    'consumer-electronics'
  ],
  'Healthcare': [
    'healthcare-services',
    'medical-devices-equipment',
    'pharmaceuticals-biotech',
    'digital-health-telemedicine',
    'health-insurance',
    'mental-health-wellness'
  ],
  'FinTech': [
    'fintech-financial-services',
    'payments-processing',
    'lending-credit',
    'investment-wealth-management',
    'insurance-insurtech',
    'cryptocurrency-blockchain'
  ],
  'E-commerce': [
    'e-commerce-platforms',
    'marketplace-platforms',
    'retail-consumer-goods',
    'fashion-apparel',
    'beauty-personal-care'
  ],
  'Food & Beverage': [
    'food-beverage',
    'agriculture-farming',
    'restaurants-food-service'
  ],
  'Real Estate': [
    'real-estate-proptech',
    'construction-materials'
  ],
  'Manufacturing': [
    'manufacturing-industrial',
    'automotive-transportation',
    'aerospace-defense',
    'chemicals-materials'
  ],
  'Energy': [
    'energy-utilities',
    'renewable-energy-cleantech',
    'oil-gas'
  ],
  'Transportation': [
    'transportation-logistics',
    'automotive-transportation'
  ],
  'Consumer Goods': [
    'consumer-products-services',
    'retail-consumer-goods',
    'fashion-apparel',
    'beauty-personal-care',
    'sports-fitness'
  ],
  'AI/ML': [
    'artificial-intelligence',
    'data-analytics',
    'machine-learning-ai'
  ],
  'SaaS': [
    'saas-platforms',
    'software-development-tools',
    'productivity-tools'
  ],
  'Biotech': [
    'pharmaceuticals-biotech',
    'biotechnology-life-sciences'
  ],
  'CleanTech': [
    'renewable-energy-cleantech',
    'environmental-sustainability'
  ],
  'EdTech': [
    'education-training',
    'online-learning-platforms'
  ]
};

// Reverse mapping: detailed sector to high-level category
export const DETAILED_TO_CATEGORY_MAPPING: Record<string, string> = {};
Object.entries(SECTOR_CATEGORY_MAPPING).forEach(([category, sectors]) => {
  sectors.forEach(sector => {
    DETAILED_TO_CATEGORY_MAPPING[sector] = category;
  });
});

/**
 * Convert legacy basic sectors to detailed sectors
 */
export function convertLegacyToDetailedSectors(legacySectors: string[]): string[] {
  const detailedSectors: string[] = [];
  
  legacySectors.forEach(legacySector => {
    const mappedSectors = SECTOR_CATEGORY_MAPPING[legacySector];
    if (mappedSectors) {
      detailedSectors.push(...mappedSectors);
    }
  });
  
  return [...new Set(detailedSectors)]; // Remove duplicates
}

/**
 * Convert detailed sectors to high-level categories
 */
export function convertDetailedToLegacySectors(detailedSectors: string[]): string[] {
  const categories: string[] = [];
  
  detailedSectors.forEach(detailedSector => {
    const category = DETAILED_TO_CATEGORY_MAPPING[detailedSector];
    if (category && !categories.includes(category)) {
      categories.push(category);
    }
  });
  
  return categories;
}

/**
 * Calculate sector alignment score between deal and strategy sectors
 */
export function calculateSectorAlignment(
  dealSectors: string[], 
  strategySectors: string[]
): { score: number; matches: string[]; reasoning: string } {
  if (!dealSectors?.length || !strategySectors?.length) {
    return { score: 0, matches: [], reasoning: 'Missing sector information' };
  }

  // Direct matches first
  const directMatches = dealSectors.filter(sector => strategySectors.includes(sector));
  
  // Category-level matches
  const dealCategories = convertDetailedToLegacySectors(dealSectors);
  const strategyCategories = convertDetailedToLegacySectors(strategySectors);
  const categoryMatches = dealCategories.filter(cat => strategyCategories.includes(cat));
  
  // Calculate score
  let score = 0;
  const matches: string[] = [];
  
  if (directMatches.length > 0) {
    // Direct matches get full score
    score = Math.min(100, (directMatches.length / strategySectors.length) * 100);
    matches.push(...directMatches);
  } else if (categoryMatches.length > 0) {
    // Category matches get partial score
    score = Math.min(75, (categoryMatches.length / strategyCategories.length) * 75);
    matches.push(...categoryMatches);
  }
  
  const reasoning = directMatches.length > 0 
    ? `Direct sector match: ${directMatches.join(', ')}`
    : categoryMatches.length > 0
    ? `Category alignment: ${categoryMatches.join(', ')}`
    : 'No sector alignment found';
    
  return { score, matches, reasoning };
}

/**
 * Get sector suggestions based on a category
 */
export function getSectorSuggestions(category: string): string[] {
  return SECTOR_CATEGORY_MAPPING[category] || [];
}

/**
 * Get all available sector labels for display
 */
export function getAllSectorLabels(): { value: string; label: string; category: string }[] {
  return STANDARDIZED_SECTORS.map(sector => ({
    value: sector.value,
    label: sector.label,
    category: sector.category || 'Other'
  }));
}