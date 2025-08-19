import { MultiSelectOption } from "@/components/ui/multi-select";

// Enhanced Industry Taxonomy with Tier 1 (Primary) and Tier 2 (Specialized Sectors)
export interface IndustryHierarchy {
  canonical: string;
  description: string;
  tier1: boolean; // Primary industry
  sectors: string[]; // Tier 2 specializations
  keywords: string[]; // For semantic matching
  vcRelevance: number; // 1-10 scale for VC relevance
  peRelevance: number; // 1-10 scale for PE relevance
}

export const ENHANCED_INDUSTRIES: IndustryHierarchy[] = [
  {
    canonical: "Technology",
    description: "Software, AI/ML, Developer Tools, and Core Technology",
    tier1: true,
    sectors: [
      "SaaS & Cloud Software", "Artificial Intelligence & Machine Learning", "Developer Tools & Infrastructure",
      "Cybersecurity & Data Privacy", "Enterprise Software", "API & Integration Platforms",
      "Low-Code/No-Code Platforms", "Database & Analytics", "DevOps & Automation"
    ],
    keywords: ["software", "tech", "saas", "ai", "ml", "cloud", "api", "devops", "automation"],
    vcRelevance: 10,
    peRelevance: 8
  },
  {
    canonical: "Healthcare & Life Sciences",
    description: "HealthTech, Biotech, MedTech, and Digital Health Solutions",
    tier1: true,
    sectors: [
      "Digital Health & Telemedicine", "Medical Devices & Diagnostics", "Biotechnology & Pharmaceuticals",
      "Health Records & Data Management", "Mental Health & Wellness", "Precision Medicine & Genomics",
      "Medical Imaging & AI Diagnostics", "Therapeutic Development", "Clinical Trial Technology"
    ],
    keywords: ["health", "medical", "biotech", "pharma", "diagnostics", "telemedicine", "wellness"],
    vcRelevance: 9,
    peRelevance: 9
  },
  {
    canonical: "Financial Services",
    description: "FinTech, Payments, Banking, Insurance, and Financial Infrastructure",
    tier1: true,
    sectors: [
      "Digital Payments & Processing", "Lending & Credit Solutions", "Digital Banking & Neobanks",
      "Insurance Technology (InsurTech)", "Wealth Management & Investment", "Regulatory Technology (RegTech)",
      "Cryptocurrency & Blockchain", "Personal Finance Management", "Trade Finance & B2B Payments"
    ],
    keywords: ["fintech", "payments", "banking", "insurance", "lending", "crypto", "blockchain", "finance"],
    vcRelevance: 9,
    peRelevance: 8
  },
  {
    canonical: "Consumer & Retail",
    description: "E-commerce, D2C Brands, Marketplaces, and Consumer Products",
    tier1: true,
    sectors: [
      "E-commerce Platforms & Marketplaces", "Direct-to-Consumer (D2C) Brands", "Social Commerce & Creator Economy",
      "Subscription & Recurring Revenue", "Consumer Electronics & Smart Devices", "Fashion & Beauty Technology",
      "Home & Lifestyle Products", "Pet Care & Services", "Luxury & Premium Goods"
    ],
    keywords: ["ecommerce", "d2c", "retail", "marketplace", "consumer", "fashion", "beauty", "luxury"],
    vcRelevance: 8,
    peRelevance: 9
  },
  {
    canonical: "Enterprise Solutions",
    description: "B2B Software, Productivity Tools, and Business Infrastructure",
    tier1: true,
    sectors: [
      "CRM & Sales Enablement", "HR Technology & Talent Management", "Project Management & Collaboration",
      "Business Intelligence & Analytics", "ERP & Operations Management", "Marketing Technology (MarTech)",
      "Customer Support & Success", "Procurement & Supply Chain", "Legal Technology (LegalTech)"
    ],
    keywords: ["enterprise", "b2b", "crm", "hr", "analytics", "erp", "martech", "legaltech"],
    vcRelevance: 8,
    peRelevance: 9
  },
  {
    canonical: "Energy & Environment",
    description: "CleanTech, Renewable Energy, Climate Solutions, and Sustainability",
    tier1: true,
    sectors: [
      "Solar & Renewable Energy", "Energy Storage & Battery Technology", "Electric Vehicle Infrastructure",
      "Carbon Management & Capture", "Waste Management & Circular Economy", "Water Technology & Treatment",
      "Smart Grid & Energy Management", "Green Building & Construction", "Environmental Monitoring"
    ],
    keywords: ["cleantech", "renewable", "solar", "battery", "carbon", "sustainability", "green", "climate"],
    vcRelevance: 8,
    peRelevance: 7
  },
  {
    canonical: "Real Estate & PropTech",
    description: "Property Technology, Construction, and Real Estate Services",
    tier1: true,
    sectors: [
      "Property Management Software", "Real Estate Marketplaces & Platforms", "Construction Technology & Tools",
      "Smart Buildings & IoT", "Facilities Management", "Property Investment & Analytics",
      "Mortgage & Lending Technology", "Commercial Real Estate Tech", "Short-term Rental Management"
    ],
    keywords: ["proptech", "real estate", "property", "construction", "smart buildings", "facilities"],
    vcRelevance: 7,
    peRelevance: 8
  },
  {
    canonical: "Transportation & Mobility",
    description: "Logistics, Autonomous Vehicles, Mobility Services, and Supply Chain",
    tier1: true,
    sectors: [
      "Last-Mile Delivery & Logistics", "Autonomous Vehicles & Self-Driving", "Ride-Sharing & Mobility Services",
      "Fleet Management & Telematics", "Freight & Shipping Technology", "Micro-Mobility (Bikes, Scooters)",
      "Public Transportation Technology", "Supply Chain Optimization", "Warehousing & Fulfillment"
    ],
    keywords: ["logistics", "autonomous", "mobility", "transportation", "delivery", "fleet", "supply chain"],
    vcRelevance: 8,
    peRelevance: 8
  },
  {
    canonical: "Food & Agriculture",
    description: "AgTech, Food Production, Restaurant Technology, and Food Services",
    tier1: true,
    sectors: [
      "Precision Agriculture & Farm Technology", "Food Delivery & Restaurant Tech", "Alternative Proteins & Food Innovation",
      "Vertical Farming & Indoor Agriculture", "Food Safety & Traceability", "Agricultural Robotics & Automation",
      "Nutrition & Dietary Technology", "Food Waste Reduction", "Agricultural Finance & Insurance"
    ],
    keywords: ["agtech", "food", "agriculture", "farming", "restaurant", "delivery", "nutrition"],
    vcRelevance: 7,
    peRelevance: 7
  },
  {
    canonical: "Media & Entertainment",
    description: "Creator Economy, Gaming, Streaming, and Digital Content",
    tier1: true,
    sectors: [
      "Creator Tools & Platforms", "Gaming & Interactive Entertainment", "Streaming & Video Technology",
      "Social Media & Community Platforms", "Digital Advertising & AdTech", "Music & Audio Technology",
      "Virtual & Augmented Reality", "Sports Technology & Analytics", "News & Publishing Technology"
    ],
    keywords: ["media", "entertainment", "gaming", "streaming", "creator", "social", "adtech", "vr", "ar"],
    vcRelevance: 8,
    peRelevance: 6
  },
  {
    canonical: "Education & Training",
    description: "EdTech, Online Learning, Corporate Training, and Skill Development",
    tier1: true,
    sectors: [
      "K-12 Education Technology", "Higher Education & University Tech", "Corporate Training & L&D",
      "Professional Certification & Skills", "Language Learning & Communication", "Educational Content & Curriculum",
      "Student Information Systems", "Learning Analytics & Assessment", "Educational Gaming & Simulation"
    ],
    keywords: ["edtech", "education", "learning", "training", "certification", "curriculum", "assessment"],
    vcRelevance: 7,
    peRelevance: 6
  },
  {
    canonical: "Manufacturing & Industrial",
    description: "Industry 4.0, Robotics, IoT, and Industrial Technology",
    tier1: true,
    sectors: [
      "Industrial IoT & Sensors", "Robotics & Automation", "3D Printing & Additive Manufacturing",
      "Quality Control & Inspection", "Predictive Maintenance", "Smart Factory & Industry 4.0",
      "Materials Science & Engineering", "Industrial Design & CAD", "Manufacturing Execution Systems"
    ],
    keywords: ["manufacturing", "industrial", "iot", "robotics", "automation", "3d printing", "industry 4.0"],
    vcRelevance: 6,
    peRelevance: 9
  }
];

// Convert to MultiSelect options for backward compatibility
export const ENHANCED_INDUSTRY_OPTIONS: MultiSelectOption[] = ENHANCED_INDUSTRIES.map(industry => ({
  label: industry.canonical,
  value: industry.canonical.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
  category: "Primary Industries"
}));

// Sector-level options for granular selection
export const SECTOR_OPTIONS: MultiSelectOption[] = ENHANCED_INDUSTRIES.flatMap(industry =>
  industry.sectors.map(sector => ({
    label: sector,
    value: sector.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
    category: industry.canonical
  }))
);

// Combined options for comprehensive selection
export const COMPREHENSIVE_INDUSTRY_OPTIONS: MultiSelectOption[] = [
  ...ENHANCED_INDUSTRY_OPTIONS,
  ...SECTOR_OPTIONS
];

// Helper functions for industry management
export const getIndustryByName = (name: string): IndustryHierarchy | undefined => {
  return ENHANCED_INDUSTRIES.find(industry => 
    industry.canonical.toLowerCase() === name.toLowerCase()
  );
};

export const getIndustryBySector = (sectorName: string): IndustryHierarchy | undefined => {
  return ENHANCED_INDUSTRIES.find(industry =>
    industry.sectors.some(sector => 
      sector.toLowerCase() === sectorName.toLowerCase()
    )
  );
};

export const findIndustryByKeyword = (keyword: string): IndustryHierarchy[] => {
  const normalizedKeyword = keyword.toLowerCase();
  return ENHANCED_INDUSTRIES.filter(industry =>
    industry.keywords.some(kw => kw.includes(normalizedKeyword)) ||
    industry.canonical.toLowerCase().includes(normalizedKeyword) ||
    industry.sectors.some(sector => sector.toLowerCase().includes(normalizedKeyword))
  );
};

// Relevance scoring for fund type alignment
export const getIndustryRelevance = (industryName: string, fundType: 'vc' | 'pe'): number => {
  const industry = getIndustryByName(industryName);
  if (!industry) return 5; // Default neutral score
  
  return fundType === 'vc' ? industry.vcRelevance : industry.peRelevance;
};

// Backward compatibility with existing sectors
export const STANDARDIZED_SECTORS = ENHANCED_INDUSTRY_OPTIONS;