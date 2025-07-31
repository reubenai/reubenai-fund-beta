import { supabase } from '@/integrations/supabase/client';
import { EnhancedCriteriaTemplate, getTemplateByFundType, validateCriteriaWeights } from '@/types/vc-pe-criteria';

// Enhanced interfaces for strategy management
export interface CategoryCustomization {
  weight: number;
  subcategories: {
    [name: string]: {
      weight: number;
      enabled: boolean;
      requirements?: string;
      aiPrompt?: string;
    };
  };
  positiveSignals: string[];
  negativeSignals: string[];
}

export interface EnhancedWizardData {
  // Foundation (Steps 1-3)
  fundName: string;
  strategyDescription: string;
  fundType: 'vc' | 'pe';
  sectors: string[];
  stages: string[];
  geographies: string[];
  checkSizeRange: { min: number; max: number };
  keySignals: string[];
  
  // Enhanced data for AI orchestrator
  investmentPhilosophy?: string;
  
  // Research and Due Diligence Approach
  researchApproach?: {
    dueDiligenceDepth: 'light' | 'standard' | 'deep';
    researchPriorities: string[];
    informationSources: string[];
    competitiveAnalysisFocus: string[];
  };
  
  // Deal Sourcing Strategy
  dealSourcingStrategy?: {
    sourcingChannels: string[];
    networkLeveraging: string;
    targetCompanyProfiles: string[];
    outreachStrategy: string;
  };
  
  // Decision Making Process
  decisionMakingProcess?: {
    timelinePreferences: string;
    stakeholderInvolvement: string;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  };
  
  // Category Configs (Steps 4-9)
  teamLeadershipConfig: CategoryCustomization;
  marketOpportunityConfig: CategoryCustomization;
  productTechnologyConfig: CategoryCustomization;
  businessTractionConfig: CategoryCustomization;
  financialHealthConfig: CategoryCustomization;
  strategicFitConfig: CategoryCustomization;
  
  // Deal Definition (Step 10)
  dealThresholds: {
    exciting: number;
    promising: number;
    needs_development: number;
  };
  
  // Generated Results
  enhancedCriteria?: any[];
}

export interface EnhancedStrategy {
  id?: string;
  fund_id: string;
  fund_type?: 'vc' | 'pe';
  name?: string;
  description?: string;
  industries?: string[];
  geography?: string[];
  min_investment_amount?: number;
  max_investment_amount?: number;
  key_signals?: string[];
  exciting_threshold?: number;
  promising_threshold?: number;
  needs_development_threshold?: number;
  strategy_notes?: string;
  enhanced_criteria?: any; // JSONB field in database
  created_at?: string;
  updated_at?: string;
}

// Default template configurations
export const VC_TEMPLATE: Partial<CategoryCustomization> = {
  weight: 100,
  subcategories: {
    'Team Experience': { weight: 40, enabled: true, requirements: 'Proven track record in relevant domain' },
    'Vision & Execution': { weight: 35, enabled: true, requirements: 'Clear product vision and execution capability' },
    'Domain Expertise': { weight: 25, enabled: true, requirements: 'Deep understanding of target market' }
  },
  positiveSignals: [
    'Serial entrepreneurs with successful exits',
    'Domain experts with deep industry knowledge',
    'Strong technical background in relevant field',
    'Previous experience at top-tier companies'
  ],
  negativeSignals: [
    'Inexperienced team with no relevant background',
    'Frequent founder conflicts or departures',
    'Lack of domain expertise',
    'Poor communication skills'
  ]
};

export const PE_TEMPLATE: Partial<CategoryCustomization> = {
  weight: 100,
  subcategories: {
    'Management Quality': { weight: 50, enabled: true, requirements: 'Strong operational leadership' },
    'Growth Strategy': { weight: 30, enabled: true, requirements: 'Clear path to value creation' },
    'Operational Excellence': { weight: 20, enabled: true, requirements: 'Efficient operations and processes' }
  },
  positiveSignals: [
    'Proven management team with operational experience',
    'Clear value creation plan',
    'Strong financial controls and reporting',
    'Market leadership position'
  ],
  negativeSignals: [
    'Weak management team',
    'Declining market position',
    'Poor financial controls',
    'Unclear growth strategy'
  ]
};

export const DEFAULT_CATEGORIES: Record<string, CategoryCustomization> = {
  'Team & Leadership': { 
    weight: 20, 
    subcategories: VC_TEMPLATE.subcategories || {},
    positiveSignals: VC_TEMPLATE.positiveSignals || [],
    negativeSignals: VC_TEMPLATE.negativeSignals || []
  },
  'Market Opportunity': { 
    weight: 18, 
    subcategories: VC_TEMPLATE.subcategories || {},
    positiveSignals: VC_TEMPLATE.positiveSignals || [],
    negativeSignals: VC_TEMPLATE.negativeSignals || []
  },
  'Product & Technology': { 
    weight: 17, 
    subcategories: VC_TEMPLATE.subcategories || {},
    positiveSignals: VC_TEMPLATE.positiveSignals || [],
    negativeSignals: VC_TEMPLATE.negativeSignals || []
  },
  'Business Traction': { 
    weight: 16, 
    subcategories: VC_TEMPLATE.subcategories || {},
    positiveSignals: VC_TEMPLATE.positiveSignals || [],
    negativeSignals: VC_TEMPLATE.negativeSignals || []
  },
  'Financial Health': { 
    weight: 15, 
    subcategories: VC_TEMPLATE.subcategories || {},
    positiveSignals: VC_TEMPLATE.positiveSignals || [],
    negativeSignals: VC_TEMPLATE.negativeSignals || []
  },
  'Strategic Fit': { 
    weight: 14, 
    subcategories: VC_TEMPLATE.subcategories || {},
    positiveSignals: VC_TEMPLATE.positiveSignals || [],
    negativeSignals: VC_TEMPLATE.negativeSignals || []
  }
};

class UnifiedStrategyService {
  // Strategy retrieval with template fallback
  async getFundStrategy(fundId: string): Promise<EnhancedStrategy | null> {
    try {
      console.log('=== FETCHING STRATEGY ===');
      console.log('Fund ID:', fundId);
      
      const { data, error } = await supabase
        .from('investment_strategies')
        .select('*')
        .eq('fund_id', fundId)
        .maybeSingle();

      console.log('Strategy query result:', { data, error });

      if (error) {
        console.error('Error fetching strategy:', error);
        return null;
      }

      console.log('Returning strategy data:', data);
      return data as EnhancedStrategy;
    } catch (error) {
      console.error('Unexpected error in getFundStrategy:', error);
      return null;
    }
  }

  // Create initial strategy with fund type templates
  async createFundStrategy(fundId: string, fundType: 'vc' | 'pe', wizardData: EnhancedWizardData): Promise<EnhancedStrategy | null> {
    try {
      const enhancedCriteria = getTemplateByFundType(fundType);
      
      const strategyData = {
        fund_id: fundId,
        fund_type: fundType,
        industries: wizardData.sectors,
        geography: wizardData.geographies,
        min_investment_amount: wizardData.checkSizeRange.min,
        max_investment_amount: wizardData.checkSizeRange.max,
        key_signals: wizardData.keySignals,
        exciting_threshold: wizardData.dealThresholds.exciting,
        promising_threshold: wizardData.dealThresholds.promising,
        needs_development_threshold: wizardData.dealThresholds.needs_development,
        strategy_notes: wizardData.strategyDescription,
        enhanced_criteria: JSON.parse(JSON.stringify(enhancedCriteria))
      };

      const { data, error } = await supabase
        .from('investment_strategies')
        .insert(strategyData)
        .select()
        .single();

      if (error) {
        console.error('Error creating strategy:', error);
        return null;
      }

      return data as EnhancedStrategy;
    } catch (error) {
      console.error('Unexpected error in createFundStrategy:', error);
      return null;
    }
  }

  // Comprehensive strategy updates
  async updateFundStrategy(strategyId: string, updates: any): Promise<EnhancedStrategy | null> {
    try {
      const { data, error } = await supabase
        .from('investment_strategies')
        .update(updates)
        .eq('id', strategyId)
        .select()
        .single();

      if (error) {
        console.error('Error updating strategy:', error);
        return null;
      }

      return data as EnhancedStrategy;
    } catch (error) {
      console.error('Unexpected error in updateFundStrategy:', error);
      return null;
    }
  }

  // Multi-level validation (weights, completeness)
  validateStrategy(wizardData: EnhancedWizardData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validation
    if (!wizardData.fundName?.trim()) {
      errors.push('Fund name is required');
    }
    if (!wizardData.strategyDescription?.trim()) {
      errors.push('Strategy description is required');
    }
    if (!wizardData.sectors?.length) {
      errors.push('At least one sector must be selected');
    }
    if (!wizardData.stages?.length) {
      errors.push('At least one stage must be selected');
    }
    if (!wizardData.geographies?.length) {
      errors.push('At least one geography must be selected');
    }

    // Check size validation
    if (wizardData.checkSizeRange.max <= wizardData.checkSizeRange.min) {
      errors.push('Maximum check size must be greater than minimum');
    }

    // Category weight validation
    const categories = [
      wizardData.teamLeadershipConfig,
      wizardData.marketOpportunityConfig,
      wizardData.productTechnologyConfig,
      wizardData.businessTractionConfig,
      wizardData.financialHealthConfig,
      wizardData.strategicFitConfig
    ];

    const totalWeight = categories.reduce((sum, cat) => sum + (cat?.weight || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
      errors.push(`Category weights must sum to 100% (currently ${totalWeight.toFixed(1)}%)`);
    }

    // Subcategory weight validation
    categories.forEach((category, index) => {
      if (category?.subcategories) {
        const subcategoryWeights = Object.values(category.subcategories)
          .filter(sub => sub.enabled)
          .reduce((sum, sub) => sum + (sub.weight || 0), 0);
        
        if (Math.abs(subcategoryWeights - 100) > 0.1) {
          const categoryNames = ['Team & Leadership', 'Market Opportunity', 'Product & Technology', 'Business Traction', 'Financial Health', 'Strategic Fit'];
          errors.push(`${categoryNames[index]} subcategory weights must sum to 100% (currently ${subcategoryWeights.toFixed(1)}%)`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate enhanced criteria based on fund type and wizard data
  private generateEnhancedCriteria(fundType: 'vc' | 'pe', wizardData: EnhancedWizardData): any {
    const template = fundType === 'vc' ? VC_TEMPLATE : PE_TEMPLATE;
    
    return {
      fundType,
      categories: {
        'Team & Leadership': { ...wizardData.teamLeadershipConfig },
        'Market Opportunity': { ...wizardData.marketOpportunityConfig },
        'Product & Technology': { ...wizardData.productTechnologyConfig },
        'Business Traction': { ...wizardData.businessTractionConfig },
        'Financial Health': { ...wizardData.financialHealthConfig },
        'Strategic Fit': { ...wizardData.strategicFitConfig }
      },
      dealThresholds: wizardData.dealThresholds,
      generatedAt: new Date().toISOString()
    };
  }

  // AI scoring integration with fund-specific weights
  async calculateDealScore(dealData: any, strategy: EnhancedStrategy): Promise<number> {
    // This would integrate with your AI scoring system
    // For now, return a placeholder score
    return Math.floor(Math.random() * 100);
  }

  // Get default template for fund type
  getDefaultTemplate(fundType: 'vc' | 'pe'): Partial<EnhancedWizardData> {
    const template = getTemplateByFundType(fundType);
    
    return {
      fundType,
      sectors: fundType === 'vc' ? ['Technology', 'Healthcare', 'Fintech'] : ['Manufacturing', 'Services', 'Technology'],
      stages: fundType === 'vc' ? ['Seed', 'Series A', 'Series B'] : ['Growth', 'Buyout'],
      geographies: ['North America', 'Europe'],
      checkSizeRange: { 
        min: fundType === 'vc' ? 500000 : 5000000, 
        max: fundType === 'vc' ? 5000000 : 50000000 
      },
      dealThresholds: {
        exciting: 85,
        promising: 70,
        needs_development: 50
      },
      teamLeadershipConfig: DEFAULT_CATEGORIES['Team & Leadership'],
      marketOpportunityConfig: DEFAULT_CATEGORIES['Market Opportunity'],
      productTechnologyConfig: DEFAULT_CATEGORIES['Product & Technology'],
      businessTractionConfig: DEFAULT_CATEGORIES['Business Traction'],
      financialHealthConfig: DEFAULT_CATEGORIES['Financial Health'],
      strategicFitConfig: DEFAULT_CATEGORIES['Strategic Fit']
    };
  }

  // Get enhanced criteria template for fund
  getEnhancedCriteriaTemplate(fundType: 'vc' | 'pe'): EnhancedCriteriaTemplate {
    return getTemplateByFundType(fundType);
  }

  // Validate enhanced criteria
  validateEnhancedCriteria(criteria: EnhancedCriteriaTemplate): { isValid: boolean; errors: string[] } {
    return validateCriteriaWeights(criteria);
  }
}

export const unifiedStrategyService = new UnifiedStrategyService();