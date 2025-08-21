import { supabase } from '@/integrations/supabase/client';
import { EnhancedWizardData } from './unifiedStrategyService';

export interface StrategyV2 {
  id?: string;
  fund_id: string;
  fund_name: string;
  strategy_description?: string;
  fund_type: 'vc' | 'pe';
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
    console.log('💾 [V2] Saving strategy with retry logic...');
    console.log('Fund ID:', fundId);
    console.log('Wizard Data Keys:', Object.keys(wizardData));

    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      try {
        console.log(`🔄 [V2] Save attempt ${attempt + 1}/${maxAttempts}`);
        
        // Direct 1:1 mapping from wizard to database - no transformations!
        const strategyData: any = {
          fund_id: fundId,
          fund_name: wizardData.fundName,
          strategy_description: wizardData.strategyDescription,
          fund_type: wizardData.fundType,
          sectors: wizardData.sectors || [],
          stages: wizardData.stages || [],
          geographies: wizardData.geographies || [],
          check_size_min: wizardData.checkSizeRange?.min,
          check_size_max: wizardData.checkSizeRange?.max,
          key_signals: wizardData.keySignals || [],
          investment_philosophy: wizardData.investmentPhilosophy,
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

        console.log('🚀 [V2] Direct mapped data:', strategyData);

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
            throw error;
          }
          
          result = data;
        }
        
        console.log('✅ [V2] Strategy saved successfully');
        return result as StrategyV2;
        
      } catch (error: any) {
        attempt++;
        console.error(`❌ [V2] Save attempt ${attempt} failed:`, error);
        
        // Check if it's a retryable error (network/connectivity issues)
        const isRetryableError = (
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError') ||
          error.message?.includes('timeout') ||
          error.message?.includes('violates row-level security') ||
          error.code === 'PGRST301' ||
          error.status === 0 ||
          error.status === 500 ||
          error.status === 502 ||
          error.status === 503 ||
          error.status === 504
        );
        
        if (attempt < maxAttempts && isRetryableError) {
          const delay = 1000 * attempt; // Increasing delay: 1s, 2s, 3s
          console.log(`🔄 [V2] Retryable error detected, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If not retryable or out of attempts, throw the error
        console.error(`💥 [V2] ${isRetryableError ? 'All retry attempts exhausted' : 'Non-retryable error'}`);
        throw new Error(`Failed to save strategy: ${error.message}`);
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
    return {
      id: strategyV2.id,
      fund_id: strategyV2.fund_id,
      fund_type: strategyV2.fund_type,
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

    // Basic field mappings
    if (legacyUpdates.fund_type) v2Updates.fund_type = legacyUpdates.fund_type;
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