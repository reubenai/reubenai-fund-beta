// Updated strategy service with explicit SELECT-UPDATE/INSERT pattern 
import { supabase } from '@/integrations/supabase/client';
import { EnhancedCriteriaTemplate, getTemplateByFundType, validateCriteriaWeights } from '@/types/vc-pe-criteria';
import { DataTransformationUtils } from './dataTransformationUtils';
import { strategyVersioningService } from './strategyVersioningService';
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
      console.log('🎯 FETCHING STRATEGY FOR FUND:', fundId);
      
      // Check authentication context first
      const { data: user } = await supabase.auth.getUser();
      console.log('🔐 Current user:', user?.user?.email);
      
      const { data, error } = await supabase
        .from('investment_strategies')
        .select('*')
        .eq('fund_id', fundId)
        .maybeSingle();

      console.log('📊 Strategy query result:', { data, error });

      if (error) {
        console.error('❌ Database error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Check for RLS policy errors
        if (error.code === '42501' || error.message?.includes('permission')) {
          console.error('🚫 RLS POLICY ERROR: User cannot access investment strategies');
          throw new Error('Access denied: You do not have permission to view strategies for this fund. Please check your organization membership.');
        }
        
        // For other errors, throw with context
        throw new Error(`Failed to fetch strategy: ${error.message}`);
      }

      if (data) {
        console.log('✅ Strategy found and loaded:', data.id);
      } else {
        console.log('ℹ️ No strategy found for fund (this is OK for new funds)');
      }
      
      return data as EnhancedStrategy;
    } catch (error) {
      console.error('💥 Unexpected error in getFundStrategy:', error);
      
      // Re-throw known errors
      if (error instanceof Error && error.message.includes('Access denied')) {
        throw error;
      }
      
      // Log and handle unknown errors
      console.error('Unknown error type:', typeof error, error);
      throw new Error(`Unexpected error loading strategy: ${error}`);
    }
  }

  // Robust save strategy with upsert capability
  async saveStrategy(fundId: string, updates: any): Promise<EnhancedStrategy | null> {
    console.log('💾 === ROBUST SAVE STRATEGY SERVICE (UPSERT) ===');
    console.log('Fund ID:', fundId);
    console.log('Updates received:', JSON.stringify(updates, null, 2));
    
    try {
      // Transform wizard data to database format first
      const transformedData = DataTransformationUtils.transformWizardToDatabase(updates);
      console.log('🔄 Transformed data:', JSON.stringify(transformedData, null, 2));
      
      // Validate the transformed data
      const validation = DataTransformationUtils.validateStrategyData(transformedData, false);
      if (!validation.isValid) {
        console.error('❌ Validation errors:', validation.errors);
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
      }
      
      console.log('🔍 Checking for existing strategy...');
      const existingStrategy = await this.getFundStrategy(fundId);
      
      if (existingStrategy) {
        console.log('✅ Found existing strategy, performing UPDATE');
        return await this.updateFundStrategy(existingStrategy.id!, transformedData);
      } else {
        console.log('🆕 No existing strategy, performing INSERT');
        return await this.createFundStrategy(fundId, transformedData);
      }
    } catch (error) {
      console.error('💥 Error in robust saveStrategy:', error);
      throw error;
    }
  }
  
  // Create new strategy for fund
  private async createFundStrategy(fundId: string, strategyData: any): Promise<EnhancedStrategy | null> {
    console.log('🆕 Creating new strategy for fund:', fundId);
    
    const insertData = {
      fund_id: fundId,
      fund_type: strategyData.fund_type || 'vc',
      ...strategyData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('investment_strategies')
      .insert(insertData)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Error creating strategy:', error);
      throw new Error(`Failed to create strategy: ${error.message}`);
    }
    
    console.log('✅ Successfully created strategy:', data.id);
    return data as EnhancedStrategy;
  }

  // Phase 2: Enhanced strategy updates with comprehensive error logging
  async updateFundStrategy(strategyId: string, updates: any): Promise<EnhancedStrategy | null> {
    console.log('🔧 === UPDATE FUND STRATEGY SERVICE (ENHANCED v2) ===');
    console.log('Strategy ID:', strategyId);
    console.log('Updates received:', JSON.stringify(updates, null, 2));
    
    try {
      console.log('🔍 Transforming update data...');
      
      // Transform UI data to database format
      const transformedData = DataTransformationUtils.transformUIToDatabase(updates);
      
      console.log('📝 Transformed update data:', JSON.stringify(transformedData, null, 2));
      
      // Validate data before update (partial update - skip fund_id/fund_type requirements)
      const validation = DataTransformationUtils.validateStrategyData(transformedData, true);
      if (!validation.isValid) {
        console.error('❌ Validation errors:', validation.errors);
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Build update object with all possible fields
      const updateObject: any = {
        updated_at: new Date().toISOString()
      };
      
      // Only include fields that are provided in the update
      if (transformedData.fund_type !== undefined) updateObject.fund_type = transformedData.fund_type;
      if (transformedData.industries !== undefined) updateObject.industries = transformedData.industries;
      if (transformedData.geography !== undefined) updateObject.geography = transformedData.geography;
      if (transformedData.key_signals !== undefined) updateObject.key_signals = transformedData.key_signals;
      if (transformedData.exciting_threshold !== undefined) updateObject.exciting_threshold = transformedData.exciting_threshold;
      if (transformedData.promising_threshold !== undefined) updateObject.promising_threshold = transformedData.promising_threshold;
      if (transformedData.needs_development_threshold !== undefined) updateObject.needs_development_threshold = transformedData.needs_development_threshold;
      if (transformedData.strategy_notes !== undefined) updateObject.strategy_notes = transformedData.strategy_notes;
      if (transformedData.enhanced_criteria !== undefined) updateObject.enhanced_criteria = transformedData.enhanced_criteria;
      
      // New fields from database expansion
      if (transformedData.investment_philosophy !== undefined) updateObject.investment_philosophy = transformedData.investment_philosophy;
      if (transformedData.philosophy_config !== undefined) updateObject.philosophy_config = transformedData.philosophy_config;
      if (transformedData.research_approach !== undefined) updateObject.research_approach = transformedData.research_approach;
      if (transformedData.deal_sourcing_strategy !== undefined) updateObject.deal_sourcing_strategy = transformedData.deal_sourcing_strategy;
      if (transformedData.decision_making_process !== undefined) updateObject.decision_making_process = transformedData.decision_making_process;
      if (transformedData.investment_stages !== undefined) updateObject.investment_stages = transformedData.investment_stages;
      if (transformedData.specialized_sectors !== undefined) updateObject.specialized_sectors = transformedData.specialized_sectors;
      if (transformedData.min_investment_amount !== undefined) updateObject.min_investment_amount = transformedData.min_investment_amount;
      if (transformedData.max_investment_amount !== undefined) updateObject.max_investment_amount = transformedData.max_investment_amount;
      
      console.log('🎯 Final update object:', JSON.stringify(updateObject, null, 2));
      console.log('🚀 CODE VERSION: 2025-08-20-v3 - ENHANCED ERROR HANDLING');
      
      // Perform the UPDATE operation
      console.log('🚀 Updating strategy with ID:', strategyId);
      const { data, error } = await supabase
        .from('investment_strategies')
        .update(updateObject)
        .eq('id', strategyId)
        .select()
        .single();
        
      console.log('📊 Update result:', { data, error });

      if (error) {
        console.error('❌ Supabase error updating strategy:', error);
        // Phase 4: Enhanced error messages
        let errorMessage = 'Database update failed';
        if (error.message.includes('foreign key')) {
          errorMessage = 'Invalid fund reference - the fund may not exist';
        } else if (error.message.includes('unique')) {
          errorMessage = 'Strategy already exists for this fund';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Permission denied - you may not have access to modify this strategy';
        } else if (error.message.includes('column')) {
          errorMessage = 'Invalid data format - some fields may be incorrectly formatted';
        }
        throw new Error(`${errorMessage}: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No data returned from update');
        throw new Error('Update succeeded but no data returned');
      }

      console.log('✅ Successfully updated strategy:', data);
      return data as EnhancedStrategy;
    } catch (error: any) {
      console.error('❌ Unexpected error in updateFundStrategy:', error);
      // Preserve the original error message for better debugging
      throw new Error(error.message || 'Unknown error occurred during strategy update');
    }
  }

  // Upsert strategy for fund (create if doesn't exist, update if it does)
  async upsertFundStrategy(fundId: string, updates: any): Promise<EnhancedStrategy | null> {
    try {
      console.log('=== UPSERT FUND STRATEGY SERVICE (SELECT THEN UPDATE/INSERT) ===');
      console.log('Fund ID:', fundId);
      console.log('Updates:', updates);
      
      // Remove the id from updates to avoid conflicts
      const { id, ...updateData } = updates;
      
      // First, check if a strategy already exists for this fund
      const { data: existingStrategy, error: selectError } = await supabase
        .from('investment_strategies')
        .select('*')
        .eq('fund_id', fundId)
        .maybeSingle();

      console.log('Existing strategy check:', { existingStrategy, selectError });

      if (selectError) {
        console.error('Error checking existing strategy:', selectError);
        throw new Error(`Failed to check existing strategy: ${selectError.message}`);
      }

      let result;
      
      if (existingStrategy) {
        // Strategy exists, perform UPDATE
        console.log('Strategy exists, performing UPDATE');
        
        const { data: updatedData, error: updateError } = await supabase
          .from('investment_strategies')
          .update(updateData)
          .eq('fund_id', fundId)
          .select()
          .single();

        console.log('Update result:', { updatedData, updateError });

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error(`Failed to update strategy: ${updateError.message}`);
        }

        result = updatedData;
      } else {
        // Strategy doesn't exist, perform INSERT
        console.log('Strategy does not exist, performing INSERT');
        
        const insertData = {
          fund_id: fundId,
          ...updateData
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('investment_strategies')
          .insert(insertData)
          .select()
          .single();

        console.log('Insert result:', { insertedData, insertError });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(`Failed to insert strategy: ${insertError.message}`);
        }

        result = insertedData;
      }

      if (!result) {
        console.error('No data returned from operation');
        throw new Error('Operation succeeded but no data returned');
      }

      console.log('Successfully saved strategy:', result);
      return result as EnhancedStrategy;
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

    // Category weight validation with more lenient precision
    const categories = [
      wizardData.teamLeadershipConfig,
      wizardData.marketOpportunityConfig,
      wizardData.productTechnologyConfig,
      wizardData.businessTractionConfig,
      wizardData.financialHealthConfig,
      wizardData.strategicFitConfig
    ];

    const totalWeight = categories.reduce((sum, cat) => sum + (cat?.weight || 0), 0);
    
    console.log('🔍 Service validation debug:');
    console.log('Total weight:', totalWeight);
    console.log('Categories:', categories.map((cat, i) => ({ 
      name: ['Team & Leadership', 'Market Opportunity', 'Product & Technology', 'Business Traction', 'Financial Health', 'Strategic Fit'][i], 
      weight: cat?.weight || 0 
    })));
    
    // More lenient precision check - allow up to 1% difference
    if (Math.abs(totalWeight - 100) > 1.0) {
      errors.push(`Category weights must sum to 100% (currently ${totalWeight.toFixed(1)}%)`);
    }

    // Subcategory weight validation with more lenient precision
    categories.forEach((category, index) => {
      if (category?.subcategories) {
        const subcategoryWeights = Object.values(category.subcategories)
          .filter(sub => sub.enabled)
          .reduce((sum, sub) => sum + (sub.weight || 0), 0);
        
        console.log(`Subcategory weights for category ${index}:`, subcategoryWeights);
        
        // More lenient precision check for subcategories
        if (Math.abs(subcategoryWeights - 100) > 1.0) {
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