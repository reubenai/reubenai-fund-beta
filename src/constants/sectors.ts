import { MultiSelectOption } from "@/components/ui/multi-select";

// Import enhanced industries for backward compatibility
import { ENHANCED_INDUSTRY_OPTIONS, COMPREHENSIVE_INDUSTRY_OPTIONS } from './enhancedIndustries';

// Legacy sectors list - maintained for backward compatibility
export const STANDARDIZED_SECTORS: MultiSelectOption[] = [
  { label: "Technology", value: "technology" },
  { label: "Healthcare & Life Sciences", value: "healthcare" },
  { label: "Financial Services", value: "fintech" },
  { label: "AI/ML", value: "ai_ml" },
  { label: "SaaS", value: "saas" },
  { label: "E-commerce", value: "ecommerce" },
  { label: "Biotech", value: "biotech" },
  { label: "CleanTech", value: "cleantech" },
  { label: "EdTech", value: "edtech" },
  { label: "Food & Beverage", value: "food_beverage" },
  { label: "Real Estate & PropTech", value: "real_estate" },
  { label: "Manufacturing & Industrial", value: "manufacturing" },
  { label: "Consumer & Retail", value: "consumer_goods" },
  { label: "Energy & Environment", value: "energy" },
  { label: "Transportation & Mobility", value: "transportation" },
];

// Enhanced options for new implementations
export const ENHANCED_SECTORS = ENHANCED_INDUSTRY_OPTIONS;
export const COMPREHENSIVE_SECTORS = COMPREHENSIVE_INDUSTRY_OPTIONS;

// Helper function to convert array to semicolon-separated string for backward compatibility
export const sectorsToString = (sectors: string[]): string => {
  return sectors.join(";")
}

// Helper function to convert semicolon-separated string to array
export const sectorsFromString = (sectorsString: string): string[] => {
  if (!sectorsString || sectorsString.trim() === "") return []
  return sectorsString.split(";").map(s => s.trim()).filter(s => s.length > 0)
}

// Helper function to get sector labels from values
export const getSectorLabels = (sectorValues: string[]): string[] => {
  return sectorValues.map(value => {
    const sector = STANDARDIZED_SECTORS.find(s => s.value === value)
    return sector ? sector.label : value
  })
}
