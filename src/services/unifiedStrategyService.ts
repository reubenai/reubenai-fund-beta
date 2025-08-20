import { supabase } from '@/integrations/supabase/client';
import { EnhancedCriteriaTemplate, getTemplateByFundType, validateCriteriaWeights } from '@/types/vc-pe-criteria';
import { 
  applySpecializations, 
  getStageSpecialization, 
  getIndustryOverlay, 
  getGeographicRiskProfile, 
  getSizeSpecialization,
  INDUSTRY_OVERLAYS,
  GEOGRAPHIC_RISK_PROFILES,
  SIZE_SPECIALIZATIONS
} from '@/types/enhanced-fund-specialization';

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
  
  // Structured Philosophy Configuration
  philosophyConfig?: {
    investmentDrivers: string[];
    riskTolerance: string;
    investmentHorizon: string;
    valueCreationApproach: string[];
    diversityPreference?: string[];
  };
  
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

  // Create initial strategy with comprehensive enhanced criteria
  async createFundStrategy(fundId: string, fundType: 'vc' | 'pe', wizardData: EnhancedWizardData): Promise<EnhancedStrategy | null> {
    try {
      console.log('🚀 Creating fund strategy:', { fundId, fundType, wizardData });
      
      // Get the appropriate template and apply specializations
      let baseTemplate = getTemplateByFundType(fundType);
      
      // Apply fund-specific specializations
      const enhancedCriteria = this.applyFundSpecializations(baseTemplate, wizardData);
      
      const strategyData = {
        fund_id: fundId,
        fund_type: fundType,
        industries: wizardData.sectors,
        geography: wizardData.geographies,
        min_investment_amount: wizardData.checkSizeRange?.min,
        max_investment_amount: wizardData.checkSizeRange?.max,
        key_signals: wizardData.keySignals,
        exciting_threshold: wizardData.dealThresholds?.exciting,
        promising_threshold: wizardData.dealThresholds?.promising,
        needs_development_threshold: wizardData.dealThresholds?.needs_development,
        strategy_notes: wizardData.strategyDescription,
        enhanced_criteria: JSON.parse(JSON.stringify(enhancedCriteria)) as any
      };

      console.log('💾 Creating strategy with data:', strategyData);

      const { data, error } = await supabase
        .from('investment_strategies')
        .insert(strategyData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating strategy:', error);
        throw error;
      }

      console.log('✅ Successfully created strategy:', data);
      
      // Dispatch strategy creation event
      window.dispatchEvent(new CustomEvent('strategyCreated', { 
        detail: { fundId, strategy: data } 
      }));
      
      return data as EnhancedStrategy;
    } catch (error) {
      console.error('💥 Unexpected error in createFundStrategy:', error);
      throw error;
    }
  }

  // Comprehensive strategy updates
  async updateFundStrategy(strategyId: string, updates: any): Promise<EnhancedStrategy | null> {
    try {
      console.log('=== UPDATE FUND STRATEGY SERVICE ===');
      console.log('Strategy ID:', strategyId);
      console.log('Updates:', updates);
      
      // Remove the id from updates to avoid conflicts
      const { id, ...updateData } = updates;
      
      console.log('Clean update data:', updateData);
      
      const { data, error } = await supabase
        .from('investment_strategies')
        .update(updateData)
        .eq('id', strategyId)
        .select()
        .single();

      console.log('Supabase update result:', { data, error });

      console.log('Supabase update result:', { data, error });

      if (error) {
        console.error('Supabase error updating strategy:', error);
        throw new Error(`Database update failed: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from update');
        throw new Error('Update succeeded but no data returned');
      }

      console.log('Successfully updated strategy:', data);
      return data as EnhancedStrategy;
    } catch (error) {
      console.error('Unexpected error in updateFundStrategy:', error);
      throw error; // Re-throw to preserve error handling in hook
    }
  }

  // Upsert strategy for fund (create if doesn't exist, update if it does)
  async upsertFundStrategy(fundId: string, updates: any): Promise<EnhancedStrategy | null> {
    try {
      console.log('=== UPSERT FUND STRATEGY SERVICE ===');
      console.log('Fund ID:', fundId);
      console.log('Updates:', updates);
      
      // Remove the id from updates to avoid conflicts in upsert
      const { id, ...updateData } = updates;
      
      const upsertData = {
        fund_id: fundId,
        ...updateData
      };
      
      console.log('Upsert data:', upsertData);
      
      // Use the unique constraint that we just created
      const { data, error } = await supabase
        .from('investment_strategies')
        .upsert(upsertData, { 
          onConflict: 'fund_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      console.log('Supabase upsert result:', { data, error });

      if (error) {
        console.error('Supabase error upserting strategy:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Database upsert failed: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from upsert');
        throw new Error('Upsert succeeded but no data returned');
      }

      console.log('Successfully upserted strategy:', data);
      return data as EnhancedStrategy;
    } catch (error) {
      console.error('Unexpected error in upsertFundStrategy:', error);
      throw error; // Re-throw to preserve error handling in hook
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

  // Apply fund-specific specializations to criteria
  private applyFundSpecializations(template: EnhancedCriteriaTemplate, wizardData: EnhancedWizardData): EnhancedCriteriaTemplate {
    // Determine primary stage for VC/PE specialization
    const primaryStage = wizardData.stages?.[0];
    
    // Determine primary industry
    const primaryIndustry = wizardData.sectors?.[0];
    
    // Determine primary geography
    const primaryGeography = wizardData.geographies?.[0];
    
    // Calculate average investment size for size specialization
    const avgInvestmentSize = wizardData.checkSizeRange ? 
      (wizardData.checkSizeRange.min + wizardData.checkSizeRange.max) / 2 : undefined;

    return applySpecializations(
      template,
      primaryStage,
      wizardData.sectors,
      wizardData.geographies,
      avgInvestmentSize
    );
  }

  // Get specialized template for fund type with options
  getSpecializedTemplate(
    fundType: 'vc' | 'pe', 
    stage?: string, 
    industries?: string[], 
    geographies?: string[], 
    investmentSize?: number
  ): EnhancedCriteriaTemplate {
    const baseTemplate = getTemplateByFundType(fundType);
    return applySpecializations(baseTemplate, stage, industries, geographies, investmentSize);
  }

  // Get available specialization options
  getSpecializationOptions() {
    return {
      industries: INDUSTRY_OVERLAYS.map(overlay => ({
        name: overlay.industry,
        fundType: overlay.fundType,
        description: `Specialized criteria for ${overlay.industry} investments`
      })),
      geographies: GEOGRAPHIC_RISK_PROFILES.map(profile => ({
        name: profile.region,
        riskLevel: profile.adjustments.riskWeightModifier,
        description: `Risk assessment and adjustments for ${profile.region}`
      })),
      sizeRanges: SIZE_SPECIALIZATIONS.map(spec => ({
        range: spec.sizeRange,
        fundType: spec.fundType,
        dueDiligenceDepth: spec.adjustments.dueDiligenceDepth,
        description: `Optimized criteria for ${spec.sizeRange.min.toLocaleString()} - ${spec.sizeRange.max.toLocaleString()} investments`
      }))
    };
  }

  // Get default template for fund type
  getDefaultTemplate(fundType: 'vc' | 'pe'): Partial<EnhancedWizardData> {
    const template = getTemplateByFundType(fundType);
    
    return {
      fundType,
      sectors: fundType === 'vc' ? ['SaaS/Software', 'Healthcare/Biotech', 'FinTech'] : ['Manufacturing', 'Services', 'Technology'],
      stages: fundType === 'vc' ? ['Seed', 'Series A', 'Series B'] : ['Growth Equity', 'Buyout'],
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