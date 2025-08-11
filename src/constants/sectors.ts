import { MultiSelectOption } from "@/components/ui/multi-select"

export const STANDARDIZED_SECTORS: MultiSelectOption[] = [
  { label: "Technology", value: "technology" },
  { label: "Healthcare", value: "healthcare" },
  { label: "FinTech", value: "fintech" },
  { label: "AI/ML", value: "ai_ml" },
  { label: "SaaS", value: "saas" },
  { label: "E-commerce", value: "ecommerce" },
  { label: "Biotech", value: "biotech" },
  { label: "CleanTech", value: "cleantech" },
  { label: "EdTech", value: "edtech" },
  { label: "Food & Beverage", value: "food_beverage" },
  { label: "Real Estate", value: "real_estate" },
  { label: "Manufacturing", value: "manufacturing" },
  { label: "Consumer Goods", value: "consumer_goods" },
  { label: "Energy", value: "energy" },
  { label: "Transportation", value: "transportation" },
]

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
