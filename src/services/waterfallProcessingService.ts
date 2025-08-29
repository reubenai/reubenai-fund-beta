import { supabase } from "@/integrations/supabase/client";
import { DealDataIntegrationService } from "./dealDataIntegrationService";

export interface WaterfallProcessingOptions {
  enableAIEnhancement?: boolean;
  timeoutMinutes?: number;
  checkIntervalSeconds?: number;
}

export interface EngineCompletionStatus {
  documents_status: string;
  crunchbase_status: string;
  linkedin_profile_status: string;
  linkedin_export_status: string;
  perplexity_company_status: string;
  perplexity_founder_status: string;
  perplexity_market_status: string;
  overall_status: string;
  completed_engines: string[];
  failed_engines: string[];
  last_check_at: string;
  timeout_at: string;
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
      
      // Get or create engine tracking record
      let trackingRecord = await this.getOrCreateEngineTracking(dealId, fundId, fundType);
      
      // Start monitoring engines with database-only approach
      const completionResult = await this.monitorEnginesWithTimeout(
        dealId,
        options.timeoutMinutes || 5,
        options.checkIntervalSeconds || 60
      );
      
      console.log(`🔍 Engine monitoring completed:`, completionResult);
      
      // Process available data regardless of completion status
      const integrationResult = await DealDataIntegrationService.integrateDealData({
        dealId,
        fundId,
        fundType,
        organizationId: trackingRecord.organization_id,
        triggerReason: 'waterfall_processing'
      });
      
      // Optional AI enhancement
      if (options.enableAIEnhancement && integrationResult.success) {
        await this.enhanceWithAI(dealId, fundType);
      }
      
      // Update final tracking status
      await this.updateTrackingCompletion(dealId, completionResult.status);
      
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
      await this.updateTrackingCompletion(dealId, 'failed');
      
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
      
      console.log(`🔍 Check #${checkCount} - Overall status: ${status.overall_status}`);
      console.log(`✅ Completed: [${status.completed_engines.join(', ')}]`);
      console.log(`❌ Failed: [${status.failed_engines.join(', ')}]`);
      
      // Update last check time
      await this.updateLastCheckTime(dealId);
      
      if (status.overall_status === 'completed') {
        console.log(`🎉 All engines completed after ${checkCount} checks`);
        return {
          status: 'completed',
          completedEngines: status.completed_engines,
          failedEngines: status.failed_engines,
          checkCount
        };
      }
      
      if (status.overall_status === 'failed') {
        console.log(`💥 Engine monitoring failed after ${checkCount} checks`);
        return {
          status: 'failed',
          completedEngines: status.completed_engines,
          failedEngines: status.failed_engines,
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
      completedEngines: finalStatus.completed_engines,
      failedEngines: finalStatus.failed_engines,
      checkCount
    };
  }
  
  /**
   * Check completion status of all engines (database queries only)
   */
  private static async checkAllEnginesCompletion(dealId: string): Promise<EngineCompletionStatus> {
    // Get current tracking status
    const { data: tracking, error: trackingError } = await supabase
      .from('engine_completion_tracking')
      .select('*')
      .eq('deal_id', dealId)
      .single();
    
    if (trackingError || !tracking) {
      throw new Error(`Failed to get engine tracking: ${trackingError?.message}`);
    }
    
    const fundType = tracking.fund_type;
    
    // Check each engine completion by querying enrichment tables directly
    const engineChecks = await Promise.allSettled([
      this.checkDocumentsCompletion(dealId),
      this.checkCrunchbaseCompletion(dealId),
      this.checkLinkedInProfileCompletion(dealId),
      this.checkLinkedInExportCompletion(dealId),
      this.checkPerplexityCompanyCompletion(dealId, fundType),
      this.checkPerplexityFounderCompletion(dealId, fundType),
      this.checkPerplexityMarketCompletion(dealId, fundType)
    ]);
    
    // Process results
    const engineStatuses = {
      documents_status: this.getEngineStatus(engineChecks[0]),
      crunchbase_status: this.getEngineStatus(engineChecks[1]),
      linkedin_profile_status: this.getEngineStatus(engineChecks[2]),
      linkedin_export_status: this.getEngineStatus(engineChecks[3]),
      perplexity_company_status: this.getEngineStatus(engineChecks[4]),
      perplexity_founder_status: this.getEngineStatus(engineChecks[5]),
      perplexity_market_status: this.getEngineStatus(engineChecks[6])
    };
    
    const completedEngines: string[] = [];
    const failedEngines: string[] = [];
    
    Object.entries(engineStatuses).forEach(([engine, status]) => {
      const engineName = engine.replace('_status', '');
      if (status === 'complete') {
        completedEngines.push(engineName);
      } else if (status === 'error' || status === 'failed') {
        failedEngines.push(engineName);
      }
    });
    
    // Determine overall status
    const totalEngines = Object.keys(engineStatuses).length;
    const completedCount = completedEngines.length;
    const failedCount = failedEngines.length;
    
    let overallStatus = 'monitoring';
    if (completedCount === totalEngines) {
      overallStatus = 'completed';
    } else if (failedCount >= totalEngines / 2) { // More than half failed
      overallStatus = 'failed';
    }
    
    // Update tracking record with latest status
    await supabase
      .from('engine_completion_tracking')
      .update({
        ...engineStatuses,
        completed_engines: completedEngines,
        failed_engines: failedEngines,
        overall_status: overallStatus,
        updated_at: new Date().toISOString()
      })
      .eq('deal_id', dealId);
    
    return {
      ...engineStatuses,
      overall_status: overallStatus,
      completed_engines: completedEngines,
      failed_engines: failedEngines,
      last_check_at: new Date().toISOString(),
      timeout_at: tracking.timeout_at
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
  
  /**
   * Get or create engine tracking record
   */
  private static async getOrCreateEngineTracking(dealId: string, fundId: string, fundType: string) {
    // Try to get existing record
    const { data: existing, error } = await supabase
      .from('engine_completion_tracking')
      .select('*')
      .eq('deal_id', dealId)
      .single();
    
    if (existing && !error) {
      return existing;
    }
    
    // Get organization_id from deal
    const { data: deal } = await supabase
      .from('deals')
      .select('organization_id')
      .eq('id', dealId)
      .single();
    
    if (!deal) {
      throw new Error('Deal not found');
    }
    
    // Create new tracking record
    const { data: newTracking, error: createError } = await supabase
      .from('engine_completion_tracking')
      .insert({
        deal_id: dealId,
        fund_id: fundId,
        organization_id: deal.organization_id,
        fund_type: fundType,
        active_engines: ['documents', 'crunchbase', 'linkedin_profile', 'linkedin_export', 'perplexity_company', 'perplexity_founder', 'perplexity_market'],
        timeout_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
      })
      .select()
      .single();
    
    if (createError || !newTracking) {
      throw new Error(`Failed to create engine tracking: ${createError?.message}`);
    }
    
    return newTracking;
  }
  
  /**
   * Update last check time
   */
  private static async updateLastCheckTime(dealId: string): Promise<void> {
    await supabase
      .from('engine_completion_tracking')
      .update({
        last_check_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('deal_id', dealId);
  }
  
  /**
   * Update tracking completion status
   */
  private static async updateTrackingCompletion(dealId: string, status: string): Promise<void> {
    await supabase
      .from('engine_completion_tracking')
      .update({
        overall_status: status,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('deal_id', dealId);
  }
  
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
   * Get current waterfall processing status for a deal
   */
  static async getWaterfallStatus(dealId: string): Promise<EngineCompletionStatus | null> {
    const { data, error } = await supabase
      .from('engine_completion_tracking')
      .select('*')
      .eq('deal_id', dealId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      documents_status: data.documents_status,
      crunchbase_status: data.crunchbase_status,
      linkedin_profile_status: data.linkedin_profile_status,
      linkedin_export_status: data.linkedin_export_status,
      perplexity_company_status: data.perplexity_company_status,
      perplexity_founder_status: data.perplexity_founder_status,
      perplexity_market_status: data.perplexity_market_status,
      overall_status: data.overall_status,
      completed_engines: data.completed_engines || [],
      failed_engines: data.failed_engines || [],
      last_check_at: data.last_check_at,
      timeout_at: data.timeout_at
    };
  }
}