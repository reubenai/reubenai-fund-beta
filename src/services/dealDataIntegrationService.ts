/**
 * Deal Data Integration Service
 * Consolidates data from various enrichment tables into centralized datapoints tables
 */

import { supabase } from '@/integrations/supabase/client';
import { toTemplateFundType, toDatabaseFundType, AnyFundType } from '@/utils/fundTypeConversion';

export interface DataIntegrationRequest {
  dealId: string;
  fundId: string;
  organizationId: string;
  fundType: AnyFundType;
  triggerReason?: 'new_deal' | 'enrichment_update' | 'manual_refresh';
}

export interface DataIntegrationResult {
  success: boolean;
  vcDataPointsCreated?: boolean;
  peDataPointsCreated?: boolean;
  dataCompleteness: number;
  sourceEnginesProcessed: string[];
  error?: string;
}

export class DealDataIntegrationService {
  
  /**
   * Main integration method - consolidates all data sources into centralized tables
   */
  static async integrateDealData(request: DataIntegrationRequest): Promise<DataIntegrationResult> {
    try {
      console.log('🔄 Starting deal data integration for:', request.dealId);
      
      const templateFundType = toTemplateFundType(request.fundType);
      
      if (templateFundType === 'vc') {
        return await this.integrateVCData(request);
      } else {
        return await this.integratePEData(request);
      }
      
    } catch (error) {
      console.error('❌ Deal data integration failed:', error);
      return {
        success: false,
        dataCompleteness: 0,
        sourceEnginesProcessed: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Integrates VC-specific data from various enrichment tables
   */
  private static async integrateVCData(request: DataIntegrationRequest): Promise<DataIntegrationResult> {
    const sourceEngines: string[] = [];
    
    // Fetch data from all VC enrichment sources
    const [
      crunchbaseData,
      linkedinData,
      linkedinProfileData,
      perplexityCompanyData,
      perplexityFounderData,
      perplexityMarketData
    ] = await Promise.all([
      this.fetchCrunchbaseData(request.dealId),
      this.fetchLinkedInData(request.dealId),
      this.fetchLinkedInProfileData(request.dealId),
      this.fetchPerplexityCompanyData(request.dealId),
      this.fetchPerplexityFounderData(request.dealId),
      this.fetchPerplexityMarketData(request.dealId)
    ]);
    
    // Build consolidated VC datapoints
    const consolidatedData = this.buildVCDataPoints(
      request,
      { crunchbaseData, linkedinData, linkedinProfileData, perplexityCompanyData, perplexityFounderData, perplexityMarketData }
    );
    
    if (crunchbaseData) sourceEngines.push('crunchbase-export');
    if (linkedinData) sourceEngines.push('linkedin-export');
    if (linkedinProfileData) sourceEngines.push('linkedin-profile-export');
    if (perplexityCompanyData) sourceEngines.push('perplexity-company-vc');
    if (perplexityFounderData) sourceEngines.push('perplexity-founder-vc');
    if (perplexityMarketData) sourceEngines.push('perplexity-market-vc');
    
    // Upsert into VC datapoints table
    const { error } = await supabase
      .from('deal_analysis_datapoints_vc')
      .upsert(consolidatedData, { onConflict: 'deal_id' });
    
    if (error) {
      throw new Error(`Failed to upsert VC datapoints: ${error.message}`);
    }
    
    const dataCompleteness = this.calculateDataCompleteness(sourceEngines, 'vc');
    
    console.log('✅ VC data integration completed:', {
      dealId: request.dealId,
      sourceEngines,
      dataCompleteness
    });
    
    return {
      success: true,
      vcDataPointsCreated: true,
      dataCompleteness,
      sourceEnginesProcessed: sourceEngines
    };
  }
  
  /**
   * Integrates PE-specific data (currently uses available sources, can be extended for PE-specific tables)
   */
  private static async integratePEData(request: DataIntegrationRequest): Promise<DataIntegrationResult> {
    const sourceEngines: string[] = [];
    
    // For now, use available sources (can be extended when PE-specific tables are added)
    const [
      crunchbaseData,
      linkedinData,
      linkedinProfileData
    ] = await Promise.all([
      this.fetchCrunchbaseData(request.dealId),
      this.fetchLinkedInData(request.dealId),
      this.fetchLinkedInProfileData(request.dealId)
    ]);
    
    // Build consolidated PE datapoints
    const consolidatedData = this.buildPEDataPoints(
      request,
      { crunchbaseData, linkedinData, linkedinProfileData }
    );
    
    if (crunchbaseData) sourceEngines.push('crunchbase-export');
    if (linkedinData) sourceEngines.push('linkedin-export');
    if (linkedinProfileData) sourceEngines.push('linkedin-profile-export');
    
    // Upsert into PE datapoints table
    const { error } = await supabase
      .from('deal_analysis_datapoints_pe')
      .upsert(consolidatedData, { onConflict: 'deal_id' });
    
    if (error) {
      throw new Error(`Failed to upsert PE datapoints: ${error.message}`);
    }
    
    const dataCompleteness = this.calculateDataCompleteness(sourceEngines, 'pe');
    
    console.log('✅ PE data integration completed:', {
      dealId: request.dealId,
      sourceEngines,
      dataCompleteness
    });
    
    return {
      success: true,
      peDataPointsCreated: true,
      dataCompleteness,
      sourceEnginesProcessed: sourceEngines
    };
  }
  
  /**
   * Fetch methods for each enrichment source
   */
  private static async fetchCrunchbaseData(dealId: string) {
    const { data } = await supabase
      .from('deal_enrichment_crunchbase_export')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data || null;
  }
  
  private static async fetchLinkedInData(dealId: string) {
    const { data } = await supabase
      .from('deal_enrichment_linkedin_export')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data || null;
  }
  
  private static async fetchLinkedInProfileData(dealId: string) {
    const { data } = await supabase
      .from('deal_enrichment_linkedin_profile_export')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data || null;
  }
  
  private static async fetchPerplexityCompanyData(dealId: string) {
    const { data } = await supabase
      .from('deal_enrichment_perplexity_company_export_vc')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data || null;
  }
  
  private static async fetchPerplexityFounderData(dealId: string) {
    const { data } = await supabase
      .from('deal_enrichment_perplexity_founder_export_vc')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data || null;
  }
  
  private static async fetchPerplexityMarketData(dealId: string) {
    const { data } = await supabase
      .from('deal_enrichment_perplexity_market_export_vc')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data || null;
  }
  
  /**
   * Builds consolidated VC datapoints from various sources
   */
  private static buildVCDataPoints(request: DataIntegrationRequest, sources: any) {
    const { 
      crunchbaseData, 
      linkedinData, 
      linkedinProfileData, 
      perplexityCompanyData, 
      perplexityFounderData, 
      perplexityMarketData 
    } = sources;
    
    return {
      deal_id: request.dealId,
      fund_id: request.fundId,
      organization_id: request.organizationId,
      
      // Market Opportunity Data Points
      geography: crunchbaseData?.location || null,
      industry_focus: crunchbaseData?.industries || perplexityCompanyData?.industry || null,
      tam: perplexityMarketData?.total_addressable_market || null,
      sam: perplexityMarketData?.serviceable_addressable_market || null,
      som: perplexityMarketData?.serviceable_obtainable_market || null,
      cagr: perplexityMarketData?.market_growth_rate || null,
      growth_drivers: perplexityMarketData?.growth_drivers || [],
      market_share_distribution: perplexityMarketData?.competitive_landscape || {},
      key_market_players: perplexityMarketData?.key_competitors || [],
      addressable_customers: crunchbaseData?.monthly_visits || null,
      
      // Team & Leadership Data Points (from LinkedIn and Perplexity)
      previous_roles: perplexityFounderData?.founder_background || {},
      leadership_experience: perplexityFounderData?.leadership_history || [],
      technical_skills: perplexityFounderData?.technical_expertise || [],
      market_knowledge: perplexityFounderData?.domain_expertise || [],
      innovation_record: perplexityFounderData?.innovation_track_record || [],
      academic_background: perplexityFounderData?.education || [],
      
      // Financial Data Points
      revenue_statements: perplexityCompanyData?.financial_metrics || {},
      unit_economics_breakdown: perplexityCompanyData?.business_model || {},
      customer_acquisition_metrics: perplexityCompanyData?.customer_metrics || {},
      growth_rate_analysis: perplexityCompanyData?.growth_metrics || {},
      
      // Product & Technology Data Points
      patent_portfolio_analysis: perplexityCompanyData?.intellectual_property || {},
      competitive_positioning_studies: perplexityCompanyData?.competitive_analysis || {},
      technology_readiness_level: perplexityCompanyData?.technology_maturity || null,
      
      // Metadata
      data_completeness_score: this.calculateRowCompleteness(sources),
      source_engines: this.getActiveSourceEngines(sources),
      last_updated_by: null, // Service integration
      updated_at: new Date().toISOString()
    };
  }
  
  /**
   * Builds consolidated PE datapoints from available sources
   */
  private static buildPEDataPoints(request: DataIntegrationRequest, sources: any) {
    const { crunchbaseData, linkedinData, linkedinProfileData } = sources;
    
    return {
      deal_id: request.dealId,
      fund_id: request.fundId,
      organization_id: request.organizationId,
      
      // Market & Strategic Data Points
      geography: crunchbaseData?.location || null,
      industry_focus: crunchbaseData?.industries || null,
      market_position: crunchbaseData?.company_type || null,
      brand_strength: crunchbaseData?.heat_trend ? 75 : 50, // Estimated from trend data
      
      // Financial Performance Data Points (estimated from available data)
      revenue_growth_rate: crunchbaseData?.monthly_visits_growth || null,
      cash_flow_generation: {},
      historical_financial_performance: {},
      
      // Operational Excellence Data Points
      operational_efficiency_metrics: {},
      technology_infrastructure: crunchbaseData?.builtwith_tech || {},
      
      // Management & Governance Data Points
      management_quality_assessment: {},
      leadership_track_record: {},
      
      // Value Creation Data Points
      organic_growth_potential: {},
      expansion_markets: [],
      
      // ESG & Regulatory Data Points
      esg_score: null,
      regulatory_compliance: {},
      
      // Metadata
      data_completeness_score: this.calculateRowCompleteness(sources),
      source_engines: this.getActiveSourceEngines(sources),
      last_updated_by: null, // Service integration
      updated_at: new Date().toISOString()
    };
  }
  
  /**
   * Calculate data completeness percentage
   */
  private static calculateRowCompleteness(sources: any): number {
    const totalSources = Object.keys(sources).length;
    const activeSources = Object.values(sources).filter(source => source !== null).length;
    return Math.round((activeSources / totalSources) * 100);
  }
  
  /**
   * Get list of active source engines
   */
  private static getActiveSourceEngines(sources: any): string[] {
    return Object.entries(sources)
      .filter(([_, data]) => data !== null)
      .map(([sourceName, _]) => sourceName.replace('Data', ''));
  }
  
  /**
   * Calculate overall data completeness for fund type
   */
  private static calculateDataCompleteness(sourceEngines: string[], fundType: 'vc' | 'pe'): number {
    const expectedSources = fundType === 'vc' ? 6 : 3; // VC has more specialized sources
    return Math.round((sourceEngines.length / expectedSources) * 100);
  }
  
  /**
   * Get integration status for a deal
   */
  static async getIntegrationStatus(dealId: string, fundType: AnyFundType) {
    const templateFundType = toTemplateFundType(fundType);
    const tableName = templateFundType === 'vc' ? 'deal_analysis_datapoints_vc' : 'deal_analysis_datapoints_pe';
    
    const { data } = await supabase
      .from(tableName)
      .select('data_completeness_score, source_engines, updated_at')
      .eq('deal_id', dealId)
      .single();
    
    return data || null;
  }
}