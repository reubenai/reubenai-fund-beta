import { supabase } from '@/integrations/supabase/client';
import { EnhancedWizardData } from './unifiedStrategyService';

export interface StrategyV2 {
  id?: string;
  fund_id: string;
  fund_name: string;
  strategy_description?: string;
  fund_type: 'venture_capital' | 'private_equity';
  sectors: string[];
  stages: string[];
  geographies: string[];
  check_size_min?: number;
  check_size_max?: number;
  key_signals: string[];
  investment_philosophy?: string;
  philosophy_config: any;
  research_approach: any;
  deal_sourcing_strategy: any;
  decision_making_process: any;
  team_leadership_config: any;
  market_opportunity_config: any;
  product_technology_config: any;
  business_traction_config: any;
  financial_health_config: any;
  strategic_fit_config: any;
  exciting_threshold: number;
  promising_threshold: number;
  needs_development_threshold: number;
  enhanced_criteria: any[];
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

class StrategyServiceV2 {
  async getFundStrategy(fundId: string): Promise<StrategyV2 | null> {
    console.log('🎯 [V2] Fetching strategy for fund:', fundId);
    
    const { data, error } = await supabase
      .from('investment_strategies_v2')
      .select('*')
      .eq('fund_id', fundId)
      .maybeSingle();

    if (error) {
      console.error('❌ [V2] Database error:', error);
      throw new Error(`Failed to fetch strategy: ${error.message}`);
    }

    console.log('✅ [V2] Strategy loaded:', data ? 'Found' : 'Not found');
    return data as StrategyV2;
  }

  async saveStrategy(fundId: string, wizardData: EnhancedWizardData): Promise<StrategyV2> {
    console.log('💾 [V2] ENHANCED SAVE with Data Integrity Fixes...');
    console.log('Fund ID:', fundId);
    console.log('Wizard Data Keys:', Object.keys(wizardData));

    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      try {
        console.log(`🔄 [V2] Save attempt ${attempt + 1}/${maxAttempts}`);
        
        // PHASE 1: Get actual fund data and validate requirements
        console.log('🔍 [V2] Phase 1: Fetching fund data and validating...');
        
        const { data: fundData, error: fundError } = await supabase
          .from('funds')
          .select('name, organization_id')
          .eq('id', fundId)
          .single();
          
        if (fundError) {
          console.error('❌ [V2] Fund lookup error:', fundError);
          throw new Error(`Fund lookup failed: ${fundError.message}`);
        }
        
        if (!fundData) {
          throw new Error(`Fund ${fundId} not found`);
        }
        
        console.log('✅ [V2] Fund data retrieved:', fundData);
        
        // PHASE 1: Data type conversion and validation
        const checkSizeMin = wizardData.checkSizeRange?.min ? 
          BigInt(Math.round(wizardData.checkSizeRange.min)) : null;
        const checkSizeMax = wizardData.checkSizeRange?.max ? 
          BigInt(Math.round(wizardData.checkSizeRange.max)) : null;
          
        // PHASE 1: Fix fund type conversion - CRITICAL FIX
        const convertFundType = (type: 'vc' | 'pe' | 'venture_capital' | 'private_equity'): 'venture_capital' | 'private_equity' => {
          if (type === 'vc') return 'venture_capital';
          if (type === 'pe') return 'private_equity';
          if (type === 'venture_capital' || type === 'private_equity') return type;
          console.warn('⚠️ [V2] Unknown fund type, defaulting to venture_capital:', type);
          return 'venture_capital';
        };
        
        // PHASE 1: Comprehensive data mapping with all required fields
        const strategyData: any = {
          fund_id: fundId,
          fund_name: fundData.name || `Fund ${fundId}`, // Use actual fund name
          organization_id: fundData.organization_id, // CRITICAL: NOT NULL field
          strategy_description: wizardData.strategyDescription || '',
          fund_type: convertFundType(wizardData.fundType), // FIXED: Convert to DB enum values
          sectors: wizardData.sectors || [],
          stages: wizardData.stages || ['Series A'], // Default stage if missing
          geographies: wizardData.geographies || [],
          check_size_min: checkSizeMin, // Converted to bigint
          check_size_max: checkSizeMax, // Converted to bigint
          key_signals: wizardData.keySignals || [],
          investment_philosophy: wizardData.investmentPhilosophy || '',
          philosophy_config: wizardData.philosophyConfig || {},
          research_approach: wizardData.researchApproach || {},
          deal_sourcing_strategy: wizardData.dealSourcingStrategy || {},
          decision_making_process: wizardData.decisionMakingProcess || {},
          team_leadership_config: wizardData.teamLeadershipConfig || {},
          market_opportunity_config: wizardData.marketOpportunityConfig || {},
          product_technology_config: wizardData.productTechnologyConfig || {},
          business_traction_config: wizardData.businessTractionConfig || {},
          financial_health_config: wizardData.financialHealthConfig || {},
          strategic_fit_config: wizardData.strategicFitConfig || {},
          exciting_threshold: wizardData.dealThresholds?.exciting || 85,
          promising_threshold: wizardData.dealThresholds?.promising || 70,
          needs_development_threshold: wizardData.dealThresholds?.needs_development || 50,
          enhanced_criteria: wizardData.enhancedCriteria || [],
        };
        
        // PHASE 1: Pre-flight validation of critical NOT NULL fields
        if (!strategyData.fund_id) throw new Error('fund_id is required');
        if (!strategyData.fund_name) throw new Error('fund_name is required'); 
        if (!strategyData.fund_type) throw new Error('fund_type is required');
        if (!strategyData.organization_id) throw new Error('organization_id is required');
        
        console.log('✅ [V2] Pre-flight validation passed');
        console.log('🚀 [V2] FIXED: Enhanced mapped data with fund type conversion:', {
          fund_id: strategyData.fund_id,
          fund_name: strategyData.fund_name,
          organization_id: strategyData.organization_id,
          fund_type: `${wizardData.fundType} → ${strategyData.fund_type}`, // Show conversion
          check_sizes: { min: checkSizeMin?.toString(), max: checkSizeMax?.toString() }
        });

        // PHASE 2: Connection health check before database operation
        console.log('🧪 [V2] Phase 2: Testing database connectivity...');
        try {
          const { error: healthError } = await supabase
            .from('investment_strategies_v2')
            .select('id')
            .limit(1);
            
          if (healthError && !healthError.message.includes('Results contain 0 rows')) {
            console.warn('⚠️ [V2] Database connectivity issue detected:', healthError);
            throw new Error(`Database connectivity issue: ${healthError.message}`);
          }
          console.log('✅ [V2] Database connectivity confirmed');
        } catch (connError) {
          console.warn('⚠️ [V2] Connection health check failed:', connError);
          // Continue with operation but log the issue
        }

        // Check if strategy exists
        const existing = await this.getFundStrategy(fundId);
        
        let result;
        if (existing) {
          // Update existing
          console.log('🔄 [V2] Updating existing strategy:', existing.id);
          const { data, error } = await supabase
            .from('investment_strategies_v2')
            .update(strategyData)
            .eq('fund_id', fundId)
            .select()
            .single();
            
          if (error) {
            console.error('❌ [V2] Update operation failed:', error);
            throw error;
          }
          
          result = data;
        } else {
          // Insert new
          console.log('➕ [V2] Creating new strategy');
          const { data, error } = await supabase
            .from('investment_strategies_v2')
            .insert(strategyData)
            .select()
            .single();
            
          if (error) {
            console.error('❌ [V2] Insert operation failed:', error);
            throw error;
          }
          
          result = data;
        }
        
        console.log('✅ [V2] Strategy saved successfully with data integrity');
        return result as StrategyV2;
        
      } catch (error: any) {
        attempt++;
        console.error(`❌ [V2] Save attempt ${attempt} failed:`, error);
        
        // PHASE 2: Enhanced error classification and retry logic
        const isNetworkError = (
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError') ||
          error.message?.includes('timeout') ||
          error.message?.includes('ERR_NETWORK') ||
          error.code === 'NETWORK_ERROR' ||
          error.status === 0
        );
        
        const isServerError = (
          error.status === 500 ||
          error.status === 502 ||
          error.status === 503 ||
          error.status === 504 ||
          error.code === 'PGRST301'
        );
        
        const isAuthError = (
          error.message?.includes('violates row-level security') ||
          error.message?.includes('JWT') ||
          error.status === 401 ||
          error.status === 403
        );
        
        const isDataIntegrityError = (
          error.message?.includes('violates not-null constraint') ||
          error.message?.includes('violates foreign key constraint') ||
          error.message?.includes('duplicate key') ||
          error.code === '23502' || // not-null violation
          error.code === '23503' || // foreign key violation
          error.code === '23505'    // unique violation
        );
        
        console.log('🔍 [V2] Error classification:', {
          isNetworkError,
          isServerError, 
          isAuthError,
          isDataIntegrityError,
          errorCode: error.code,
          errorStatus: error.status
        });
        
        const isRetryableError = isNetworkError || isServerError || (isAuthError && attempt === 1);
        
        if (attempt < maxAttempts && isRetryableError) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff: 1s, 2s, 4s max
          console.log(`🔄 [V2] Retryable error detected, waiting ${delay}ms before retry...`);
          console.log(`🔧 [V2] Error type: ${isNetworkError ? 'Network' : isServerError ? 'Server' : 'Auth'}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Enhanced error message for debugging
        let errorContext = `Attempt ${attempt}/${maxAttempts}`;
        if (isDataIntegrityError) {
          errorContext += ' - Data integrity violation (check required fields)';
        } else if (isNetworkError) {
          errorContext += ' - Network connectivity issue';
        } else if (isAuthError) {
          errorContext += ' - Authentication/authorization issue';
        }
        
        console.error(`💥 [V2] ${isRetryableError ? 'All retry attempts exhausted' : 'Non-retryable error'}`);
        console.error(`🔍 [V2] Error context: ${errorContext}`);
        throw new Error(`Failed to save strategy: ${error.message} (${errorContext})`);
      }
    }
    
    throw new Error('Failed to save strategy after all retry attempts');
  }

  async updateStrategy(strategyId: string, updates: Partial<StrategyV2>): Promise<StrategyV2> {
    console.log('🔧 [V2] Updating strategy:', strategyId);
    console.log('🔧 [V2] Updates:', Object.keys(updates));

    const { data, error } = await supabase
      .from('investment_strategies_v2')
      .update(updates as any)
      .eq('id', strategyId)
      .select()
      .single();
      
    if (error) {
      console.error('❌ [V2] Update error:', error);
      throw new Error(`Failed to update strategy: ${error.message}`);
    }

    console.log('✅ [V2] Strategy updated via ID');
    return data as StrategyV2;
  }

  // Convert V2 strategy back to legacy format for compatibility
  convertToLegacyFormat(strategyV2: StrategyV2): any {
    // Convert fund type back to short form for legacy compatibility
    const convertToLegacyFundType = (type: 'venture_capital' | 'private_equity'): 'vc' | 'pe' => {
      if (type === 'venture_capital') return 'vc';
      if (type === 'private_equity') return 'pe';
      console.warn('⚠️ [V2] Unknown V2 fund type, defaulting to vc:', type);
      return 'vc';
    };
    
    return {
      id: strategyV2.id,
      fund_id: strategyV2.fund_id,
      fund_type: convertToLegacyFundType(strategyV2.fund_type),
      industries: strategyV2.sectors,
      geography: strategyV2.geographies,
      min_investment_amount: strategyV2.check_size_min,
      max_investment_amount: strategyV2.check_size_max,
      key_signals: strategyV2.key_signals,
      exciting_threshold: strategyV2.exciting_threshold,
      promising_threshold: strategyV2.promising_threshold,
      needs_development_threshold: strategyV2.needs_development_threshold,
      strategy_notes: strategyV2.strategy_description,
      enhanced_criteria: {
        categories: strategyV2.enhanced_criteria
      },
      created_at: strategyV2.created_at,
      updated_at: strategyV2.updated_at
    };
  }

  // Convert legacy updates to V2 format
  convertLegacyUpdates(legacyUpdates: any): Partial<StrategyV2> {
    const v2Updates: Partial<StrategyV2> = {};

    // Convert fund type to V2 format
    const convertToV2FundType = (type: 'vc' | 'pe' | 'venture_capital' | 'private_equity'): 'venture_capital' | 'private_equity' | undefined => {
      if (type === 'vc') return 'venture_capital';
      if (type === 'pe') return 'private_equity';  
      if (type === 'venture_capital' || type === 'private_equity') return type;
      if (type) console.warn('⚠️ [V2] Unknown legacy fund type:', type);
      return undefined;
    };

    // Basic field mappings with fund type conversion
    if (legacyUpdates.fund_type) v2Updates.fund_type = convertToV2FundType(legacyUpdates.fund_type);
    if (legacyUpdates.fund_name) v2Updates.fund_name = legacyUpdates.fund_name;
    if (legacyUpdates.industries) v2Updates.sectors = legacyUpdates.industries;
    if (legacyUpdates.geography) v2Updates.geographies = legacyUpdates.geography;
    if (legacyUpdates.stages) v2Updates.stages = legacyUpdates.stages;
    if (legacyUpdates.min_investment_amount) v2Updates.check_size_min = legacyUpdates.min_investment_amount;
    if (legacyUpdates.max_investment_amount) v2Updates.check_size_max = legacyUpdates.max_investment_amount;
    if (legacyUpdates.key_signals) v2Updates.key_signals = legacyUpdates.key_signals;
    if (legacyUpdates.strategy_notes) v2Updates.strategy_description = legacyUpdates.strategy_notes;
    if (legacyUpdates.investment_philosophy) v2Updates.investment_philosophy = legacyUpdates.investment_philosophy;

    // Threshold mappings
    if (legacyUpdates.exciting_threshold) v2Updates.exciting_threshold = legacyUpdates.exciting_threshold;
    if (legacyUpdates.promising_threshold) v2Updates.promising_threshold = legacyUpdates.promising_threshold;
    if (legacyUpdates.needs_development_threshold) v2Updates.needs_development_threshold = legacyUpdates.needs_development_threshold;

    // Enhanced criteria mapping - handle both formats
    if (legacyUpdates.enhanced_criteria?.categories) {
      v2Updates.enhanced_criteria = legacyUpdates.enhanced_criteria.categories;
    } else if (legacyUpdates.enhanced_criteria && Array.isArray(legacyUpdates.enhanced_criteria)) {
      v2Updates.enhanced_criteria = legacyUpdates.enhanced_criteria;
    }

    // Category config mappings
    if (legacyUpdates.team_leadership_config) v2Updates.team_leadership_config = legacyUpdates.team_leadership_config;
    if (legacyUpdates.market_opportunity_config) v2Updates.market_opportunity_config = legacyUpdates.market_opportunity_config;
    if (legacyUpdates.product_technology_config) v2Updates.product_technology_config = legacyUpdates.product_technology_config;
    if (legacyUpdates.business_traction_config) v2Updates.business_traction_config = legacyUpdates.business_traction_config;
    if (legacyUpdates.financial_health_config) v2Updates.financial_health_config = legacyUpdates.financial_health_config;
    if (legacyUpdates.strategic_fit_config) v2Updates.strategic_fit_config = legacyUpdates.strategic_fit_config;
    if (legacyUpdates.philosophy_config) v2Updates.philosophy_config = legacyUpdates.philosophy_config;
    if (legacyUpdates.research_approach) v2Updates.research_approach = legacyUpdates.research_approach;
    if (legacyUpdates.deal_sourcing_strategy) v2Updates.deal_sourcing_strategy = legacyUpdates.deal_sourcing_strategy;
    if (legacyUpdates.decision_making_process) v2Updates.decision_making_process = legacyUpdates.decision_making_process;

    console.log('🔄 [V2] Legacy updates converted:', { legacyUpdates, v2Updates });
    return v2Updates;
  }
}

export const strategyServiceV2 = new StrategyServiceV2();