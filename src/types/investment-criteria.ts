// Investment Criteria Types for Enhanced Strategy Configuration

export interface InvestmentCriteria {
  id: string;
  name: string;
  description?: string;
  weight: number;
  enabled: boolean;
  icon: string;
  subcategories: Subcategory[];
  positiveSignals?: string[];
  negativeSignals?: string[];
}

export interface Subcategory {
  id: string;
  name: string;
  weight: number;
  enabled: boolean;
  requirements?: string;
  isCustom?: boolean;
}

export interface TargetParameter {
  id: string;
  name: string;
  type: 'sector' | 'stage' | 'geography';
  weight: number;
  enabled: boolean;
}

export interface InvestmentCriteriaState {
  criteria: InvestmentCriteria[];
  targetParameters: TargetParameter[];
  totalWeight: number;
  isValid: boolean;
  validationErrors: string[];
}

export interface EnhancedInvestmentCriteriaProps {
  criteria: InvestmentCriteria[];
  targetParameters?: TargetParameter[];
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onUpdateCriteria: (criteria: InvestmentCriteria[]) => void;
  onUpdateTargetParameters?: (parameters: TargetParameter[]) => void;
  isSaving: boolean;
}

// Default Investment Criteria Configuration
export const DEFAULT_INVESTMENT_CRITERIA: InvestmentCriteria[] = [
  {
    id: 'team-leadership',
    name: 'Team & Leadership',
    weight: 25,
    enabled: true,
    icon: 'Users',
    subcategories: [
      { id: 'founder-market-fit', name: 'Founder-Market Fit', weight: 30, enabled: true, requirements: 'Strong alignment between founder background and target market' },
      { id: 'previous-experience', name: 'Previous Experience', weight: 25, enabled: true, requirements: 'Relevant startup or industry experience' },
      { id: 'technical-expertise', name: 'Technical Expertise', weight: 25, enabled: true, requirements: 'Deep technical knowledge in relevant domain' },
      { id: 'execution-track-record', name: 'Execution Track Record', weight: 20, enabled: true, requirements: 'Proven ability to execute and deliver results' }
    ]
  },
  {
    id: 'market-opportunity',
    name: 'Market Opportunity',
    weight: 20,
    enabled: true,
    icon: 'Building2',
    subcategories: [
      { id: 'market-size-tam', name: 'Market Size (TAM)', weight: 35, enabled: true, requirements: 'Large total addressable market with growth potential' },
      { id: 'market-growth-rate', name: 'Market Growth Rate', weight: 25, enabled: true, requirements: 'Strong market growth trends and momentum' },
      { id: 'market-timing', name: 'Market Timing', weight: 20, enabled: true, requirements: 'Favorable timing for market entry and adoption' },
      { id: 'competitive-landscape', name: 'Competitive Landscape', weight: 20, enabled: true, requirements: 'Defensible position in competitive environment' }
    ]
  },
  {
    id: 'product-technology',
    name: 'Product & Technology',
    weight: 20,
    enabled: true,
    icon: 'Cpu',
    subcategories: [
      { id: 'product-market-fit', name: 'Product-Market Fit', weight: 40, enabled: true, requirements: 'Strong evidence of product-market fit' },
      { id: 'technology-moat', name: 'Technology Moat', weight: 30, enabled: true, requirements: 'Sustainable technology advantage or IP protection' },
      { id: 'scalability', name: 'Scalability', weight: 30, enabled: true, requirements: 'Technical and business model scalability' }
    ]
  },
  {
    id: 'business-traction',
    name: 'Business Model & Traction',
    weight: 15,
    enabled: true,
    icon: 'BarChart3',
    subcategories: [
      { id: 'revenue-model', name: 'Revenue Model', weight: 30, enabled: true, requirements: 'Clear and scalable revenue model' },
      { id: 'customer-acquisition', name: 'Customer Acquisition', weight: 25, enabled: true, requirements: 'Efficient customer acquisition strategy and metrics' },
      { id: 'revenue-growth', name: 'Revenue Growth', weight: 25, enabled: true, requirements: 'Strong revenue growth and momentum' },
      { id: 'unit-economics', name: 'Unit Economics', weight: 20, enabled: true, requirements: 'Positive unit economics and clear path to profitability' }
    ]
  },
  {
    id: 'financial-health',
    name: 'Financial Health',
    weight: 10,
    enabled: true,
    icon: 'CreditCard',
    subcategories: [
      { id: 'burn-rate-runway', name: 'Burn Rate & Runway', weight: 40, enabled: true, requirements: 'Sustainable burn rate and adequate runway' },
      { id: 'capital-efficiency', name: 'Capital Efficiency', weight: 35, enabled: true, requirements: 'Efficient use of capital and resources' },
      { id: 'financial-controls', name: 'Financial Controls', weight: 25, enabled: true, requirements: 'Strong financial planning and controls' }
    ]
  },
  {
    id: 'strategic-fit',
    name: 'Strategic Fit',
    weight: 10,
    enabled: true,
    icon: 'Crosshair',
    subcategories: [
      { id: 'thesis-alignment', name: 'Thesis Alignment', weight: 40, enabled: true, requirements: 'Strong alignment with fund investment thesis' },
      { id: 'portfolio-synergies', name: 'Portfolio Synergies', weight: 30, enabled: true, requirements: 'Potential synergies with existing portfolio companies' },
      { id: 'value-add-opportunity', name: 'Value-Add Opportunity', weight: 30, enabled: true, requirements: 'Clear opportunities for fund to add value' }
    ]
  }
];

// Default Target Parameters
export const DEFAULT_TARGET_PARAMETERS: TargetParameter[] = [
  // Sectors
  { id: 'fintech', name: 'FinTech', type: 'sector', weight: 25, enabled: true },
  { id: 'healthtech', name: 'HealthTech', type: 'sector', weight: 20, enabled: true },
  { id: 'enterprise-saas', name: 'Enterprise SaaS', type: 'sector', weight: 20, enabled: true },
  { id: 'ai-ml', name: 'AI/ML', type: 'sector', weight: 15, enabled: true },
  { id: 'climate-tech', name: 'Climate Tech', type: 'sector', weight: 10, enabled: false },
  { id: 'consumer-tech', name: 'Consumer Tech', type: 'sector', weight: 10, enabled: false },
  
  // Stages
  { id: 'seed', name: 'Seed', type: 'stage', weight: 40, enabled: true },
  { id: 'series-a', name: 'Series A', type: 'stage', weight: 35, enabled: true },
  { id: 'series-b', name: 'Series B', type: 'stage', weight: 20, enabled: true },
  { id: 'growth', name: 'Growth', type: 'stage', weight: 5, enabled: false },
  
  // Geographies
  { id: 'north-america', name: 'North America', type: 'geography', weight: 50, enabled: true },
  { id: 'europe', name: 'Europe', type: 'geography', weight: 30, enabled: true },
  { id: 'asia-pacific', name: 'Asia Pacific', type: 'geography', weight: 15, enabled: true },
  { id: 'latin-america', name: 'Latin America', type: 'geography', weight: 5, enabled: false }
];

// Validation utilities
export const validateCriteriaWeights = (criteria: InvestmentCriteria[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const enabledCriteria = criteria.filter(c => c.enabled);
  
  // Check total weight
  const totalWeight = enabledCriteria.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) { // Use tolerance for floating point comparison
    errors.push(`Total criteria weight must equal 100% (currently ${Math.round(totalWeight * 10) / 10}%)`);
  }
  
  // Check individual category weights
  enabledCriteria.forEach(category => {
    if (category.weight < 5 || category.weight > 50) {
      errors.push(`${category.name} weight must be between 5% and 50%`);
    }
    
    // Check subcategory weights
    const enabledSubcategories = category.subcategories.filter(s => s.enabled);
    if (enabledSubcategories.length > 0) {
      const subcategoryTotal = enabledSubcategories.reduce((sum, s) => sum + s.weight, 0);
      if (Math.abs(subcategoryTotal - 100) > 0.01) { // Use tolerance for floating point comparison
        errors.push(`${category.name} subcategory weights must equal 100% (currently ${Math.round(subcategoryTotal * 10) / 10}%)`);
      }
      
      enabledSubcategories.forEach(sub => {
        if (sub.weight < 10 || sub.weight > 50) {
          errors.push(`${category.name} - ${sub.name} weight must be between 10% and 50%`);
        }
      });
    }
  });
  
  return { isValid: errors.length === 0, errors };
};

export const validateTargetParameters = (parameters: TargetParameter[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const parameterTypes = ['sector', 'stage', 'geography'] as const;
  
  parameterTypes.forEach(type => {
    const typeParams = parameters.filter(p => p.type === type && p.enabled);
    if (typeParams.length > 0) {
      const totalWeight = typeParams.reduce((sum, p) => sum + p.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) { // Use tolerance for floating point comparison
        errors.push(`${type} parameters must total 100% (currently ${Math.round(totalWeight * 10) / 10}%)`);
      }
      
      typeParams.forEach(param => {
        if (param.weight < 5 || param.weight > 60) {
          errors.push(`${param.name} weight must be between 5% and 60%`);
        }
      });
    }
  });
  
  return { isValid: errors.length === 0, errors };
};