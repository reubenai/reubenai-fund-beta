// Enhanced Industry Mapping Service for better thesis alignment
// Fixes: "fintech" → "financial services" mapping and other semantic matches

interface IndustryMapping {
  canonical: string;
  aliases: string[];
  subcategories: string[];
  relatedTerms: string[];
}

interface SemanticMatch {
  match: string;
  confidence: number;
  reason: string;
}

class IndustryMappingService {
  private mappings: IndustryMapping[] = [
    {
      canonical: "Financial Services",
      aliases: ["finance", "financial", "banking", "investment"],
      subcategories: [
        "fintech", "payments", "lending", "insurance", "wealth management",
        "cryptocurrency", "blockchain", "trading", "neobank", "regtech",
        "insurtech", "wealthtech", "payment processing", "digital banking",
        "peer-to-peer lending", "robo-advisor", "credit scoring", "personal finance",
        "digital payments & processing", "lending & credit solutions", "digital banking & neobanks",
        "insurance technology (insurtech)", "wealth management & investment", "regulatory technology (regtech)",
        "cryptocurrency & blockchain", "personal finance management", "trade finance & b2b payments"
      ],
      relatedTerms: ["digital finance", "financial technology", "capital markets"]
    },
    {
      canonical: "Technology",
      aliases: ["tech", "software", "digital", "it"],
      subcategories: [
        "saas", "enterprise software", "developer tools", "cybersecurity",
        "artificial intelligence", "machine learning", "cloud computing",
        "mobile apps", "web platforms", "api services", "automation",
        "devops", "data analytics", "business intelligence", "crm",
        "erp", "productivity software", "collaboration tools",
        "saas & cloud software", "artificial intelligence & machine learning", "developer tools & infrastructure",
        "cybersecurity & data privacy", "enterprise software", "api & integration platforms",
        "low-code/no-code platforms", "database & analytics", "devops & automation"
      ],
      relatedTerms: ["information technology", "software development", "digital platforms"]
    },
    {
      canonical: "Healthcare & Life Sciences",
      aliases: ["health", "medical", "pharma", "pharmaceutical", "healthcare", "life sciences"],
      subcategories: [
        "healthtech", "digital health", "telemedicine", "medical devices",
        "biotechnology", "diagnostics", "therapeutics", "health records",
        "patient care", "medical imaging", "clinical trials", "precision medicine",
        "mental health", "wellness", "fitness", "nutrition", "eldercare",
        "digital health & telemedicine", "medical devices & diagnostics", "biotechnology & pharmaceuticals",
        "health records & data management", "mental health & wellness", "precision medicine & genomics",
        "medical imaging & ai diagnostics", "therapeutic development", "clinical trial technology"
      ],
      relatedTerms: ["life sciences", "medical technology", "health services"]
    },
    {
      canonical: "E-commerce",
      aliases: ["ecommerce", "retail", "commerce", "shopping"],
      subcategories: [
        "marketplace", "direct-to-consumer", "b2b commerce", "social commerce",
        "subscription commerce", "dropshipping", "fulfillment", "logistics",
        "payment processing", "inventory management", "customer service"
      ],
      relatedTerms: ["online retail", "digital commerce", "retail technology"]
    },
    {
      canonical: "Education",
      aliases: ["edtech", "learning", "training", "academic"],
      subcategories: [
        "online education", "e-learning", "corporate training", "skill development",
        "language learning", "coding bootcamps", "certification", "tutoring",
        "educational content", "learning management", "student services"
      ],
      relatedTerms: ["educational technology", "learning platforms", "knowledge management"]
    },
    {
      canonical: "Real Estate",
      aliases: ["property", "proptech", "construction", "housing"],
      subcategories: [
        "property management", "real estate platforms", "construction tech",
        "smart buildings", "facilities management", "rental platforms",
        "property investment", "mortgage", "property search", "real estate analytics"
      ],
      relatedTerms: ["property technology", "construction technology", "smart real estate"]
    },
    {
      canonical: "Transportation",
      aliases: ["mobility", "logistics", "automotive", "shipping"],
      subcategories: [
        "ride sharing", "delivery", "freight", "autonomous vehicles",
        "electric vehicles", "public transit", "micro-mobility", "fleet management",
        "supply chain", "last-mile delivery", "transportation planning"
      ],
      relatedTerms: ["smart mobility", "transportation technology", "logistics technology"]
    },
    {
      canonical: "Food & Agriculture",
      aliases: ["food", "agriculture", "farming", "agtech"],
      subcategories: [
        "food delivery", "restaurant tech", "precision agriculture", "farm management",
        "food production", "sustainable farming", "vertical farming", "food safety",
        "supply chain", "nutrition", "food waste", "agricultural robotics"
      ],
      relatedTerms: ["agricultural technology", "food technology", "sustainable agriculture"]
    },
    {
      canonical: "Media & Entertainment",
      aliases: ["media", "entertainment", "content", "gaming"],
      subcategories: [
        "streaming", "gaming", "social media", "content creation", "digital media",
        "advertising technology", "influencer platforms", "video platforms",
        "music streaming", "podcast platforms", "virtual events", "creator economy"
      ],
      relatedTerms: ["digital entertainment", "content technology", "media technology"]
    },
    {
      canonical: "Energy & Environment",
      aliases: ["energy", "environment", "sustainability", "climate"],
      subcategories: [
        "renewable energy", "solar", "wind", "battery storage", "energy efficiency",
        "carbon management", "waste management", "water technology", "clean tech",
        "environmental monitoring", "green technology", "circular economy"
      ],
      relatedTerms: ["clean technology", "environmental technology", "sustainable energy"]
    }
  ];

  /**
   * Find the best industry match for a given term
   */
  findBestMatch(searchTerm: string): SemanticMatch | null {
    if (!searchTerm) return null;
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    // 1. Exact canonical match
    for (const mapping of this.mappings) {
      if (mapping.canonical.toLowerCase() === normalizedSearch) {
        return {
          match: mapping.canonical,
          confidence: 100,
          reason: "Exact canonical match"
        };
      }
    }
    
    // 2. Exact alias match
    for (const mapping of this.mappings) {
      for (const alias of mapping.aliases) {
        if (alias.toLowerCase() === normalizedSearch) {
          return {
            match: mapping.canonical,
            confidence: 95,
            reason: `Alias match: "${alias}" → "${mapping.canonical}"`
          };
        }
      }
    }
    
    // 3. Exact subcategory match (e.g., "fintech" → "Financial Services")
    for (const mapping of this.mappings) {
      for (const subcategory of mapping.subcategories) {
        if (subcategory.toLowerCase() === normalizedSearch) {
          return {
            match: mapping.canonical,
            confidence: 90,
            reason: `Subcategory match: "${subcategory}" → "${mapping.canonical}"`
          };
        }
      }
    }
    
    // 4. Partial matches in subcategories
    for (const mapping of this.mappings) {
      for (const subcategory of mapping.subcategories) {
        if (subcategory.toLowerCase().includes(normalizedSearch) || 
            normalizedSearch.includes(subcategory.toLowerCase())) {
          return {
            match: mapping.canonical,
            confidence: 75,
            reason: `Partial subcategory match: "${subcategory}" ↔ "${searchTerm}"`
          };
        }
      }
    }
    
    // 5. Related terms match
    for (const mapping of this.mappings) {
      for (const term of mapping.relatedTerms) {
        if (term.toLowerCase().includes(normalizedSearch) || 
            normalizedSearch.includes(term.toLowerCase())) {
          return {
            match: mapping.canonical,
            confidence: 70,
            reason: `Related term match: "${term}" ↔ "${searchTerm}"`
          };
        }
      }
    }
    
    // 6. Partial canonical match
    for (const mapping of this.mappings) {
      if (mapping.canonical.toLowerCase().includes(normalizedSearch) || 
          normalizedSearch.includes(mapping.canonical.toLowerCase())) {
        return {
          match: mapping.canonical,
          confidence: 65,
          reason: `Partial canonical match: "${mapping.canonical}" ↔ "${searchTerm}"`
        };
      }
    }
    
    return null;
  }

  /**
   * Check if two industry terms are semantically related
   */
  areIndustriesAligned(dealIndustry: string, fundIndustries: string[], minConfidence: number = 60): {
    aligned: boolean;
    match?: SemanticMatch;
    explanation: string;
  } {
    if (!dealIndustry || !fundIndustries?.length) {
      return {
        aligned: false,
        explanation: "Missing industry data for comparison"
      };
    }

    // First, find the canonical form of the deal industry
    const dealMatch = this.findBestMatch(dealIndustry);
    const dealCanonical = dealMatch?.match || dealIndustry;

    // Check each fund industry for matches
    for (const fundIndustry of fundIndustries) {
      // Direct string match (existing logic)
      if (dealIndustry.toLowerCase().includes(fundIndustry.toLowerCase()) ||
          fundIndustry.toLowerCase().includes(dealIndustry.toLowerCase())) {
        return {
          aligned: true,
          match: {
            match: fundIndustry,
            confidence: 85,
            reason: "Direct string match"
          },
          explanation: `"${dealIndustry}" directly matches fund focus "${fundIndustry}"`
        };
      }

      // Semantic match through canonical forms
      const fundMatch = this.findBestMatch(fundIndustry);
      const fundCanonical = fundMatch?.match || fundIndustry;

      if (dealCanonical.toLowerCase() === fundCanonical.toLowerCase()) {
        return {
          aligned: true,
          match: dealMatch || {
            match: dealCanonical,
            confidence: 80,
            reason: "Canonical form match"
          },
          explanation: `"${dealIndustry}" maps to "${dealCanonical}" which aligns with fund focus "${fundIndustry}"`
        };
      }

      // Check subcategory relationships
      const fundMapping = this.mappings.find(m => m.canonical.toLowerCase() === fundCanonical.toLowerCase());
      if (fundMapping && dealMatch && dealMatch.confidence >= minConfidence) {
        return {
          aligned: true,
          match: dealMatch,
          explanation: `"${dealIndustry}" ${dealMatch.reason} and aligns with fund focus "${fundIndustry}"`
        };
      }
    }

    return {
      aligned: false,
      explanation: `"${dealIndustry}" does not align with fund industries: ${fundIndustries.join(', ')}`
    };
  }

  /**
   * Get all possible matches for a term (for debugging/analysis)
   */
  getAllMatches(searchTerm: string): SemanticMatch[] {
    const matches: SemanticMatch[] = [];
    const normalizedSearch = searchTerm.toLowerCase().trim();

    for (const mapping of this.mappings) {
      // Check canonical
      if (mapping.canonical.toLowerCase().includes(normalizedSearch)) {
        matches.push({
          match: mapping.canonical,
          confidence: 80,
          reason: "Canonical match"
        });
      }

      // Check aliases
      for (const alias of mapping.aliases) {
        if (alias.toLowerCase().includes(normalizedSearch)) {
          matches.push({
            match: mapping.canonical,
            confidence: 75,
            reason: `Alias: ${alias}`
          });
        }
      }

      // Check subcategories
      for (const subcategory of mapping.subcategories) {
        if (subcategory.toLowerCase().includes(normalizedSearch)) {
          matches.push({
            match: mapping.canonical,
            confidence: 70,
            reason: `Subcategory: ${subcategory}`
          });
        }
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get industry hierarchy for a canonical industry
   */
  getIndustryDetails(canonicalName: string) {
    return this.mappings.find(m => m.canonical.toLowerCase() === canonicalName.toLowerCase());
  }
}

// Export singleton instance
export const industryMappingService = new IndustryMappingService();
export type { SemanticMatch, IndustryMapping };