import { supabase } from "@/integrations/supabase/client";
import { DealDataIntegrationService } from "./dealDataIntegrationService";

export interface WaterfallProcessingOptions {
  enableAIEnhancement?: boolean;
  timeoutMinutes?: number;
  checkIntervalSeconds?: number;
}

export interface EngineCompletionStatus {
  dealId: string;
  documents_status: string;
  crunchbase_status: string;
  linkedin_profile_status: string;
  linkedin_export_status: string;
  perplexity_company_status: string;
  perplexity_founder_status: string;
  perplexity_market_status: string;
  overallStatus: string;
  engines: Record<string, string>;
  completedEngines: number;
  totalEngines: number;
  lastChecked: Date;
}

export interface WaterfallProcessingResult {
  success: boolean;
  completionStatus: 'completed' | 'timeout' | 'failed';
  enginesProcessed: string[];
  enginesFailed: string[];
  dataPointsCreated: number;
  completenessScore: number;
  processingTimeMs: number;
  error?: string;
}

export class WaterfallProcessingService {
  /**
   * Start waterfall processing for a deal
   */
  static async startWaterfallProcessing(
    dealId: string,
    fundId: string,
    fundType: 'vc' | 'pe',
    options: WaterfallProcessingOptions = {}
  ): Promise<WaterfallProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🌊 Starting waterfall processing for deal ${dealId}`);
      
      // With new trigger system, datapoints are automatically created
      console.log('🔄 Using trigger-based datapoint system for deal:', dealId);
      
      // Start monitoring engines with database-only approach
      const completionResult = await this.monitorEnginesWithTimeout(
        dealId,
        options.timeoutMinutes || 5,
        options.checkIntervalSeconds || 60
      );
      
      console.log(`🔍 Engine monitoring completed:`, completionResult);
      
      // Get deal organization info for integration
      const { data: deal } = await supabase
        .from('deals')
        .select('organization_id')
        .eq('id', dealId)
        .single();
      
      if (!deal) {
        throw new Error('Deal not found');
      }
      
      // Process available data regardless of completion status
      const integrationResult = await DealDataIntegrationService.integrateDealData({
        dealId,
        fundId,
        fundType,
        organizationId: deal.organization_id,
        triggerReason: 'waterfall_processing'
      });
      
      // Optional AI enhancement
      if (options.enableAIEnhancement && integrationResult.success) {
        await this.enhanceWithAI(dealId, fundType);
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        completionStatus: completionResult.status,
        enginesProcessed: completionResult.completedEngines,
        enginesFailed: completionResult.failedEngines,
        dataPointsCreated: integrationResult.dataPointsCreated,
        completenessScore: integrationResult.completenessScore,
        processingTimeMs: processingTime
      };
      
    } catch (error) {
      console.error('❌ Waterfall processing failed:', error);
      
      return {
        success: false,
        completionStatus: 'failed',
        enginesProcessed: [],
        enginesFailed: [],
        dataPointsCreated: 0,
        completenessScore: 0,
        processingTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Monitor engines with database-only polling (60-second intervals)
   */
  private static async monitorEnginesWithTimeout(
    dealId: string,
    timeoutMinutes: number,
    checkIntervalSeconds: number
  ): Promise<{
    status: 'completed' | 'timeout' | 'failed';
    completedEngines: string[];
    failedEngines: string[];
    checkCount: number;
  }> {
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const intervalMs = checkIntervalSeconds * 1000;
    const startTime = Date.now();
    let checkCount = 0;
    
    console.log(`⏱️ Starting engine monitoring: ${timeoutMinutes}min timeout, ${checkIntervalSeconds}s intervals`);
    
    while (Date.now() - startTime < timeoutMs) {
      checkCount++;
      const status = await this.checkAllEnginesCompletion(dealId);
      
      console.log(`🔍 Check #${checkCount} - Overall status: ${status.overallStatus}`);
      console.log(`✅ Completed: ${status.completedEngines}/${status.totalEngines} engines`);
      
      // Check if completed or timed out
      if (status.overallStatus === 'completed') {
        console.log('✅ All engines completed successfully');
        return {
          status: 'completed',
          completedEngines: Object.keys(status.engines).filter(key => status.engines[key] === 'completed'),
          failedEngines: Object.keys(status.engines).filter(key => status.engines[key] === 'failed'),
          checkCount
        };
      }
      
      if (status.overallStatus === 'failed') {
        console.log(`💥 Engine monitoring failed after ${checkCount} checks`);
        return {
          status: 'failed',
          completedEngines: Object.keys(status.engines).filter(key => status.engines[key] === 'completed'),
          failedEngines: Object.keys(status.engines).filter(key => status.engines[key] === 'failed'),
          checkCount
        };
      }
      
      // Wait before next check (database-only, no edge function calls)
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    // Timeout reached
    const finalStatus = await this.checkAllEnginesCompletion(dealId);
    console.log(`⏰ Timeout reached after ${checkCount} checks, proceeding with available data`);
    
    return {
      status: 'timeout',
      completedEngines: Object.keys(finalStatus.engines).filter(key => finalStatus.engines[key] === 'completed'),
      failedEngines: Object.keys(finalStatus.engines).filter(key => finalStatus.engines[key] === 'failed'),
      checkCount
    };
  }
  
  /**
   * Check completion status of all engines using new datapoints tables
   */
  private static async checkAllEnginesCompletion(dealId: string): Promise<EngineCompletionStatus> {
    // Get fund type to determine which datapoints table to query
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        fund_id,
        funds!inner(fund_type)
      `)
      .eq('id', dealId)
      .single();
    
    if (dealError || !deal) {
      throw new Error(`Failed to get deal info: ${dealError?.message}`);
    }
    
    const fundType = (deal.funds as any)?.fund_type || 'venture_capital';
    const tableName = fundType === 'private_equity' ? 'deal_analysis_datapoints_pe' : 'deal_analysis_datapoints_vc';
    
    // Check if datapoints exist (created by triggers)
    const { data: datapoints, error: datapointsError } = await supabase
      .from(tableName)
      .select('source_engines, data_completeness_score')
      .eq('deal_id', dealId)
      .single();
    
    if (datapointsError || !datapoints) {
      // No datapoints yet, check individual enrichment tables
      const documentsStatus = await this.checkDocumentsCompletion(dealId);
      const crunchbaseStatus = await this.checkCrunchbaseCompletion(dealId);
      const linkedInProfileStatus = await this.checkLinkedInProfileCompletion(dealId);
      const linkedInExportStatus = await this.checkLinkedInExportCompletion(dealId);
      const perplexityCompanyStatus = await this.checkPerplexityCompanyCompletion(dealId, fundType);
      const perplexityFounderStatus = await this.checkPerplexityFounderCompletion(dealId, fundType);
      const perplexityMarketStatus = await this.checkPerplexityMarketCompletion(dealId, fundType);
      
      const engineStatuses = {
        documents_status: documentsStatus ? 'completed' : 'pending',
        crunchbase_status: crunchbaseStatus ? 'completed' : 'pending',
        linkedin_profile_status: linkedInProfileStatus ? 'completed' : 'pending',
        linkedin_export_status: linkedInExportStatus ? 'completed' : 'pending',
        perplexity_company_status: perplexityCompanyStatus ? 'completed' : 'pending',
        perplexity_founder_status: perplexityFounderStatus ? 'completed' : 'pending',
        perplexity_market_status: perplexityMarketStatus ? 'completed' : 'pending'
      };
      
      const statusValues = Object.values(engineStatuses);
      const completedCount = statusValues.filter(status => status === 'completed').length;
      const totalEngines = statusValues.length;
      
      return {
        dealId,
        overallStatus: 'processing',
        engines: engineStatuses,
        completedEngines: completedCount,
        totalEngines,
        lastChecked: new Date(),
        ...engineStatuses
      };
    }
    
    // Use source_engines from datapoints to determine completion
    const sourceEngines = datapoints.source_engines || [];
    const expectedEngines = ['documents', 'crunchbase', 'linkedin_profile', 'linkedin_export', 'perplexity_company', 'perplexity_founder', 'perplexity_market'];
    
    const engineStatuses = {
      documents_status: sourceEngines.includes('documents') ? 'completed' : 'pending',
      crunchbase_status: sourceEngines.includes('crunchbase') ? 'completed' : 'pending',
      linkedin_profile_status: sourceEngines.includes('linkedin_profile') ? 'completed' : 'pending',
      linkedin_export_status: sourceEngines.includes('linkedin_export') ? 'completed' : 'pending',
      perplexity_company_status: sourceEngines.includes('perplexity_company') ? 'completed' : 'pending',
      perplexity_founder_status: sourceEngines.includes('perplexity_founder') ? 'completed' : 'pending',
      perplexity_market_status: sourceEngines.includes('perplexity_market') ? 'completed' : 'pending'
    };
    
    const completedCount = sourceEngines.length;
    const totalEngines = expectedEngines.length;
    const overallStatus = completedCount === totalEngines ? 'completed' : 'processing';
    
    return {
      dealId,
      overallStatus,
      engines: engineStatuses,
      completedEngines: completedCount,
      totalEngines,
      lastChecked: new Date(),
      ...engineStatuses
    };
  }
  
  /**
   * Individual engine completion checks (database queries only)
   */
  private static async checkDocumentsCompletion(dealId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('deal_documents')
      .select('id')
      .eq('deal_id', dealId)
      .or('processing_status.eq.processed,processing_status.eq.completed')
      .limit(1);
    
    return !error && data && data.length > 0;
  }
  
  private static async checkCrunchbaseCompletion(dealId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('deal_enrichment_crunchbase_export')
      .select('id')
      .eq('deal_id', dealId)
      .or('processing_status.eq.processed,processing_status.eq.completed')
      .limit(1);
    
    return !error && data && data.length > 0;
  }
  
  private static async checkLinkedInProfileCompletion(dealId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('deal_enrichment_linkedin_profile_export')
      .select('id')
      .eq('deal_id', dealId)
      .or('processing_status.eq.processed,processing_status.eq.completed')
      .limit(1);
    
    return !error && data && data.length > 0;
  }
  
  private static async checkLinkedInExportCompletion(dealId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('deal_enrichment_linkedin_export')
      .select('id')
      .eq('deal_id', dealId)
      .or('processing_status.eq.processed,processing_status.eq.completed')
      .limit(1);
    
    return !error && data && data.length > 0;
  }
  
  private static async checkPerplexityCompanyCompletion(dealId: string, fundType: string): Promise<boolean> {
    const tableName = fundType === 'vc' 
      ? 'deal_enrichment_perplexity_company_export_vc'
      : 'deal_enrichment_perplexity_company_export_pe';
    
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('deal_id', dealId)
      .or('processing_status.eq.processed,processing_status.eq.completed')
      .limit(1);
    
    return !error && data && data.length > 0;
  }
  
  private static async checkPerplexityFounderCompletion(dealId: string, fundType: string): Promise<boolean> {
    const tableName = fundType === 'vc' 
      ? 'deal_enrichment_perplexity_founder_export_vc'
      : 'deal_enrichment_perplexity_founder_export_pe';
    
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('deal_id', dealId)
      .or('processing_status.eq.processed,processing_status.eq.completed')
      .limit(1);
    
    return !error && data && data.length > 0;
  }
  
  private static async checkPerplexityMarketCompletion(dealId: string, fundType: string): Promise<boolean> {
    const tableName = fundType === 'vc' 
      ? 'deal_enrichment_perplexity_market_export_vc'
      : 'deal_enrichment_perplexity_market_export_pe';
    
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('deal_id', dealId)
      .or('processing_status.eq.processed,processing_status.eq.completed')
      .limit(1);
    
    return !error && data && data.length > 0;
  }
  
  /**
   * Helper to get engine status from Promise result
   */
  private static getEngineStatus(result: PromiseSettledResult<boolean>): string {
    if (result.status === 'rejected') {
      return 'error';
    }
    return result.value ? 'complete' : 'pending';
  }
  
  // Removed old tracking functions - no longer needed with trigger-based system

  /**
   * Enhance data with AI using GPT-4o-mini
   */
  private static async enhanceWithAI(dealId: string, fundType: string): Promise<void> {
    try {
      console.log(`🤖 Starting AI enhancement for deal ${dealId}`);
      
      const { data, error } = await supabase.functions.invoke('gpt4o-mini-data-enhancer', {
        body: {
          dealId,
          fundType,
          enhancementType: 'waterfall_processing'
        }
      });
      
      if (error) {
        console.error('AI enhancement failed:', error);
      } else {
        console.log('✨ AI enhancement completed:', data);
      }
    } catch (error) {
      console.error('AI enhancement error:', error);
    }
  }

  /**
   * Get current waterfall processing status for a deal using new trigger system
   */
  static async getWaterfallStatus(dealId: string): Promise<EngineCompletionStatus | null> {
    try {
      return await this.checkAllEnginesCompletion(dealId);
    } catch (error) {
      console.error('Error getting waterfall status:', error);
      return null;
    }
  }
}