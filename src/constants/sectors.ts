import { MultiSelectOption } from "@/components/ui/multi-select"

export const STANDARDIZED_SECTORS: MultiSelectOption[] = [
  // Technology
  { label: "SaaS", value: "saas", category: "Technology" },
  { label: "AI/Machine Learning", value: "ai_ml", category: "Technology" },
  { label: "Fintech", value: "fintech", category: "Technology" },
  { label: "Edtech", value: "edtech", category: "Technology" },
  { label: "Healthtech", value: "healthtech", category: "Technology" },
  { label: "Proptech", value: "proptech", category: "Technology" },
  { label: "Insurtech", value: "insurtech", category: "Technology" },
  { label: "Regtech", value: "regtech", category: "Technology" },
  { label: "Cybersecurity", value: "cybersecurity", category: "Technology" },
  { label: "Enterprise Software", value: "enterprise_software", category: "Technology" },
  { label: "Developer Tools", value: "developer_tools", category: "Technology" },
  { label: "Data & Analytics", value: "data_analytics", category: "Technology" },
  { label: "Cloud Infrastructure", value: "cloud_infrastructure", category: "Technology" },
  { label: "DevOps", value: "devops", category: "Technology" },
  { label: "Blockchain", value: "blockchain", category: "Technology" },
  { label: "Web3", value: "web3", category: "Technology" },
  { label: "AR/VR", value: "ar_vr", category: "Technology" },
  { label: "Gaming", value: "gaming", category: "Technology" },
  { label: "IoT", value: "iot", category: "Technology" },
  { label: "Robotics", value: "robotics", category: "Technology" },

  // Healthcare & Life Sciences
  { label: "Biotech", value: "biotech", category: "Healthcare & Life Sciences" },
  { label: "Medtech", value: "medtech", category: "Healthcare & Life Sciences" },
  { label: "Digital Health", value: "digital_health", category: "Healthcare & Life Sciences" },
  { label: "Pharma", value: "pharma", category: "Healthcare & Life Sciences" },
  { label: "Medical Devices", value: "medical_devices", category: "Healthcare & Life Sciences" },
  { label: "Telehealth", value: "telehealth", category: "Healthcare & Life Sciences" },
  { label: "Mental Health", value: "mental_health", category: "Healthcare & Life Sciences" },
  { label: "Diagnostics", value: "diagnostics", category: "Healthcare & Life Sciences" },

  // Financial Services
  { label: "Payments", value: "payments", category: "Financial Services" },
  { label: "Lending", value: "lending", category: "Financial Services" },
  { label: "Banking", value: "banking", category: "Financial Services" },
  { label: "Insurance", value: "insurance", category: "Financial Services" },
  { label: "Investment Management", value: "investment_management", category: "Financial Services" },
  { label: "Personal Finance", value: "personal_finance", category: "Financial Services" },
  { label: "Wealth Management", value: "wealth_management", category: "Financial Services" },
  { label: "Trading", value: "trading", category: "Financial Services" },

  // Consumer
  { label: "E-commerce", value: "ecommerce", category: "Consumer" },
  { label: "Consumer Apps", value: "consumer_apps", category: "Consumer" },
  { label: "Social Media", value: "social_media", category: "Consumer" },
  { label: "Food & Beverage", value: "food_beverage", category: "Consumer" },
  { label: "Fashion", value: "fashion", category: "Consumer" },
  { label: "Beauty", value: "beauty", category: "Consumer" },
  { label: "Marketplace", value: "marketplace", category: "Consumer" },
  { label: "On-demand Services", value: "on_demand", category: "Consumer" },
  { label: "Travel & Hospitality", value: "travel_hospitality", category: "Consumer" },
  { label: "Entertainment", value: "entertainment", category: "Consumer" },
  { label: "Sports", value: "sports", category: "Consumer" },

  // Energy & Sustainability
  { label: "Clean Energy", value: "clean_energy", category: "Energy & Sustainability" },
  { label: "Energy Storage", value: "energy_storage", category: "Energy & Sustainability" },
  { label: "Solar", value: "solar", category: "Energy & Sustainability" },
  { label: "Wind", value: "wind", category: "Energy & Sustainability" },
  { label: "Electric Vehicles", value: "electric_vehicles", category: "Energy & Sustainability" },
  { label: "Battery Technology", value: "battery_tech", category: "Energy & Sustainability" },
  { label: "Carbon Capture", value: "carbon_capture", category: "Energy & Sustainability" },
  { label: "Sustainability", value: "sustainability", category: "Energy & Sustainability" },
  { label: "Circular Economy", value: "circular_economy", category: "Energy & Sustainability" },

  // Manufacturing & Industrial
  { label: "Manufacturing", value: "manufacturing", category: "Manufacturing & Industrial" },
  { label: "Industrial IoT", value: "industrial_iot", category: "Manufacturing & Industrial" },
  { label: "Supply Chain", value: "supply_chain", category: "Manufacturing & Industrial" },
  { label: "Logistics", value: "logistics", category: "Manufacturing & Industrial" },
  { label: "Transportation", value: "transportation", category: "Manufacturing & Industrial" },
  { label: "Automation", value: "automation", category: "Manufacturing & Industrial" },
  { label: "3D Printing", value: "3d_printing", category: "Manufacturing & Industrial" },

  // Agriculture & Food
  { label: "Agtech", value: "agtech", category: "Agriculture & Food" },
  { label: "Precision Agriculture", value: "precision_agriculture", category: "Agriculture & Food" },
  { label: "Food Security", value: "food_security", category: "Agriculture & Food" },
  { label: "Alternative Protein", value: "alternative_protein", category: "Agriculture & Food" },
  { label: "Vertical Farming", value: "vertical_farming", category: "Agriculture & Food" },

  // Real Estate & Construction
  { label: "Real Estate", value: "real_estate", category: "Real Estate & Construction" },
  { label: "Construction", value: "construction", category: "Real Estate & Construction" },
  { label: "Property Management", value: "property_management", category: "Real Estate & Construction" },
  { label: "Smart Buildings", value: "smart_buildings", category: "Real Estate & Construction" },

  // Education
  { label: "Online Learning", value: "online_learning", category: "Education" },
  { label: "Corporate Training", value: "corporate_training", category: "Education" },
  { label: "K-12 Education", value: "k12_education", category: "Education" },
  { label: "Higher Education", value: "higher_education", category: "Education" },
  { label: "Skill Development", value: "skill_development", category: "Education" },

  // Media & Content
  { label: "Content Creation", value: "content_creation", category: "Media & Content" },
  { label: "Digital Media", value: "digital_media", category: "Media & Content" },
  { label: "Publishing", value: "publishing", category: "Media & Content" },
  { label: "Streaming", value: "streaming", category: "Media & Content" },
  { label: "Podcasting", value: "podcasting", category: "Media & Content" },

  // Government & Defense
  { label: "GovTech", value: "govtech", category: "Government & Defense" },
  { label: "Defense Tech", value: "defense_tech", category: "Government & Defense" },
  { label: "Aerospace", value: "aerospace", category: "Government & Defense" },
  { label: "Space Tech", value: "space_tech", category: "Government & Defense" },

  // Marketplace & B2B Services
  { label: "B2B Marketplace", value: "b2b_marketplace", category: "B2B Services" },
  { label: "Professional Services", value: "professional_services", category: "B2B Services" },
  { label: "HR Tech", value: "hr_tech", category: "B2B Services" },
  { label: "Legal Tech", value: "legal_tech", category: "B2B Services" },
  { label: "Accounting Tech", value: "accounting_tech", category: "B2B Services" },
  { label: "Marketing Tech", value: "marketing_tech", category: "B2B Services" },
  { label: "Sales Tech", value: "sales_tech", category: "B2B Services" },

  // Other
  { label: "Other", value: "other", category: "Other" },
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
