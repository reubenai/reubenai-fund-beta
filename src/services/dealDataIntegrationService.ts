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
  triggerReason?: 'new_deal' | 'enrichment_update' | 'manual_refresh' | 'waterfall_processing';
}

export interface DataIntegrationResult {
  success: boolean;
  vcDataPointsCreated?: boolean;
  peDataPointsCreated?: boolean;
  dataPointsCreated: number;
  completenessScore: number;
  dataCompleteness: number;
  sourceEnginesProcessed: string[];
  processedSources: string[];
  errors: string[];
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
        dataPointsCreated: 0,
        completenessScore: 0,
        dataCompleteness: 0,
        sourceEnginesProcessed: [],
        processedSources: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Integrates VC-specific data from various enrichment tables
   */
  private static async integrateVCData(request: DataIntegrationRequest): Promise<DataIntegrationResult> {
    const sourceEngines: string[] = [];
    
    // Fetch data from all VC enrichment sources including documents
    const [
      documentData,
      crunchbaseData,
      linkedinData,
      linkedinProfileData,
      perplexityCompanyData,
      perplexityFounderData,
      perplexityMarketData
    ] = await Promise.all([
      this.fetchDocumentData(request.dealId),
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
      { documentData, crunchbaseData, linkedinData, linkedinProfileData, perplexityCompanyData, perplexityFounderData, perplexityMarketData }
    );
    
    if (documentData) sourceEngines.push('documents');
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
      dataPointsCreated: 1,
      completenessScore: dataCompleteness,
      dataCompleteness,
      sourceEnginesProcessed: sourceEngines,
      processedSources: sourceEngines,
      errors: []
    };
  }
  
  /**
   * Integrates PE-specific data including new PE Perplexity sources and documents
   */
  private static async integratePEData(request: DataIntegrationRequest): Promise<DataIntegrationResult> {
    const sourceEngines: string[] = [];
    
    // Fetch data from all PE enrichment sources including PE-specific Perplexity and documents
    const [
      documentData,
      crunchbaseData,
      linkedinData,
      linkedinProfileData,
      perplexityCompanyDataPE,
      perplexityFounderDataPE,
      perplexityMarketDataPE
    ] = await Promise.all([
      this.fetchDocumentData(request.dealId),
      this.fetchCrunchbaseData(request.dealId),
      this.fetchLinkedInData(request.dealId),
      this.fetchLinkedInProfileData(request.dealId),
      this.fetchPerplexityCompanyDataPE(request.dealId),
      this.fetchPerplexityFounderDataPE(request.dealId),
      this.fetchPerplexityMarketDataPE(request.dealId)
    ]);
    
    // Build consolidated PE datapoints
    const consolidatedData = this.buildPEDataPoints(
      request,
      { documentData, crunchbaseData, linkedinData, linkedinProfileData, perplexityCompanyDataPE, perplexityFounderDataPE, perplexityMarketDataPE }
    );
    
    if (documentData) sourceEngines.push('documents');
    if (crunchbaseData) sourceEngines.push('crunchbase-export');
    if (linkedinData) sourceEngines.push('linkedin-export');
    if (linkedinProfileData) sourceEngines.push('linkedin-profile-export');
    if (perplexityCompanyDataPE) sourceEngines.push('perplexity-company-pe');
    if (perplexityFounderDataPE) sourceEngines.push('perplexity-founder-pe');
    if (perplexityMarketDataPE) sourceEngines.push('perplexity-market-pe');
    
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
      dataPointsCreated: 1,
      completenessScore: dataCompleteness,
      dataCompleteness,
      sourceEnginesProcessed: sourceEngines,
      processedSources: sourceEngines,
      errors: []
    };
  }
  
  /**
   * Fetch methods for each enrichment source
   */
  
  private static async fetchDocumentData(dealId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('deal_documents')
        .select('extracted_text, parsed_data, document_summary, data_points_vc, data_points_pe, document_type')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching document data:', error);
        return null;
      }
      
      return data && data.length > 0 ? data : null;
    } catch (error) {
      console.error('Document fetch error:', error);
      return null;
    }
  }
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
  
  // PE-specific Perplexity fetch methods
  private static async fetchPerplexityCompanyDataPE(dealId: string) {
    const { data } = await supabase
      .from('deal_enrichment_perplexity_company_export_pe')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data || null;
  }
  
  private static async fetchPerplexityFounderDataPE(dealId: string) {
    const { data } = await supabase
      .from('deal_enrichment_perplexity_founder_export_pe')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data || null;
  }
  
  private static async fetchPerplexityMarketDataPE(dealId: string) {
    const { data } = await supabase
      .from('deal_enrichment_perplexity_market_export_pe')
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
      documentData,
      crunchbaseData, 
      linkedinData, 
      linkedinProfileData, 
      perplexityCompanyData, 
      perplexityFounderData, 
      perplexityMarketData 
    } = sources;
    
    // Extract document insights - use new structure
    const documentInsights = documentData ? documentData.map((doc: any) => ({
      type: doc.document_type,
      summary: doc.document_summary?.narrative || doc.document_summary,
      vcDataPoints: doc.data_points_vc,
      keyData: doc.parsed_data
    })) : [];
    
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
      
      // Document-derived data points
      document_insights: documentInsights,
      document_derived_metrics: this.extractDocumentMetrics(documentData),
      
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
   * Builds consolidated PE datapoints from available sources including PE Perplexity and documents
   */
  private static buildPEDataPoints(request: DataIntegrationRequest, sources: any) {
    const { 
      documentData, 
      crunchbaseData, 
      linkedinData, 
      linkedinProfileData, 
      perplexityCompanyDataPE, 
      perplexityFounderDataPE, 
      perplexityMarketDataPE 
    } = sources;
    
    // Extract document insights - use new structure  
    const documentInsights = documentData ? documentData.map((doc: any) => ({
      type: doc.document_type,
      summary: doc.document_summary?.narrative || doc.document_summary,
      peDataPoints: doc.data_points_pe,
      keyData: doc.parsed_data
    })) : [];
    
    return {
      deal_id: request.dealId,
      fund_id: request.fundId,
      organization_id: request.organizationId,
      
      // Market & Strategic Data Points (enhanced with PE Perplexity data)
      geography: crunchbaseData?.location || null,
      industry_focus: crunchbaseData?.industries || perplexityCompanyDataPE?.industry_trends?.[0] || null,
      market_position: crunchbaseData?.company_type || perplexityCompanyDataPE?.market_position || null,
      brand_strength: crunchbaseData?.heat_trend ? 75 : 50,
      market_share: perplexityMarketDataPE?.market_share || null,
      
      // Financial Performance Data Points (enhanced with PE data)
      revenue_growth_rate: perplexityCompanyDataPE?.growth_metrics?.revenue_growth || crunchbaseData?.monthly_visits_growth || null,
      ebitda_margin: perplexityCompanyDataPE?.financial_highlights?.ebitda_margin || null,
      ebitda_growth_rate: perplexityCompanyDataPE?.financial_highlights?.ebitda_growth || null,
      cash_flow_generation: perplexityCompanyDataPE?.financial_highlights?.cash_flow || {},
      historical_financial_performance: perplexityCompanyDataPE?.financial_highlights || {},
      
      // Operational Excellence Data Points (PE-specific)
      operational_efficiency_metrics: perplexityCompanyDataPE?.operational_metrics || {},
      technology_infrastructure: crunchbaseData?.builtwith_tech || perplexityCompanyDataPE?.technology_infrastructure || {},
      process_optimization_potential: perplexityCompanyDataPE?.key_success_factors || [],
      cost_structure_analysis: perplexityCompanyDataPE?.operational_metrics?.cost_structure || {},
      
      // Management & Governance Data Points (enhanced with founder data)
      management_quality_assessment: perplexityFounderDataPE?.leadership_experience || {},
      leadership_track_record: perplexityFounderDataPE?.track_record || [],
      succession_planning: perplexityFounderDataPE?.succession_planning || {},
      governance_structure: perplexityFounderDataPE?.governance_best_practices || {},
      
      // Value Creation Data Points (PE-specific enhancements)
      organic_growth_potential: perplexityMarketDataPE?.growth_drivers || {},
      expansion_markets: perplexityMarketDataPE?.target_market || [],
      acquisition_opportunities: perplexityMarketDataPE?.consolidation_opportunities || [],
      cost_reduction_opportunities: perplexityCompanyDataPE?.operational_metrics?.cost_optimization || {},
      margin_improvement_opportunities: perplexityCompanyDataPE?.operational_metrics?.margin_improvement || [],
      
      // Market Intelligence (from PE Perplexity data)
      competitive_advantages: perplexityCompanyDataPE?.key_success_factors || [],
      competitive_landscape: perplexityMarketDataPE?.competitive_analysis || {},
      market_size_analysis: perplexityMarketDataPE?.market_size_analysis || {},
      customer_concentration: perplexityMarketDataPE?.customer_segments || {},
      
      // Document-derived insights
      document_insights: documentInsights,
      document_derived_metrics: this.extractDocumentMetrics(documentData),
      
      // ESG & Regulatory Data Points
      esg_score: perplexityCompanyDataPE?.esg_score || null,
      regulatory_compliance: perplexityMarketDataPE?.regulatory_environment || {},
      environmental_impact_assessment: perplexityCompanyDataPE?.environmental_impact || {},
      
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
   * Extract metrics from document analysis
   */
  private static extractDocumentMetrics(documents: any): any {
    if (!documents || documents.length === 0) return {};
    
    const metrics: any = {
      document_count: documents.length,
      document_types: documents.map((doc: any) => doc.document_type).filter(Boolean),
      total_content_length: documents.reduce((sum: number, doc: any) => sum + (doc.extracted_text?.length || 0), 0),
      key_financial_data: [],
      business_metrics: []
    };
    
    // Extract financial data from parsed documents
    documents.forEach((doc: any) => {
      if (doc.parsed_data && typeof doc.parsed_data === 'object') {
        // Look for financial metrics in parsed data
        Object.entries(doc.parsed_data).forEach(([key, value]) => {
          if (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('financial')) {
            metrics.key_financial_data.push({ metric: key, value, source: doc.document_type });
          }
        });
      }
    });
    
    return metrics;
  }

  /**
   * Calculate overall data completeness for fund type
   */
  private static calculateDataCompleteness(sourceEngines: string[], fundType: 'vc' | 'pe'): number {
    const expectedSources = fundType === 'vc' ? 7 : 7; // Both now have same number of sources (documents + 6 enrichment engines)
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