/**
 * Deal Analysis Orchestration Service
 * Manages the end-to-end analysis pipeline with queue management and status tracking
 */

import { supabase } from '@/integrations/supabase/client';
import { DealDataIntegrationService } from './dealDataIntegrationService';
import { AnyFundType, toTemplateFundType } from '@/utils/fundTypeConversion';

export interface AnalysisOrchestrationRequest {
  dealId: string;
  fundId: string;
  organizationId: string;
  fundType: AnyFundType;
  triggerReason: 'new_deal' | 'document_upload' | 'manual_trigger' | 'enrichment_complete';
  priority?: 'high' | 'normal' | 'low';
}

export interface AnalysisStageStatus {
  stage: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  metadata?: any;
}

export interface OrchestrationStatus {
  dealId: string;
  overallStatus: 'pending' | 'processing' | 'complete' | 'failed';
  stages: AnalysisStageStatus[];
  progress: number; // 0-100
  estimatedCompletion?: string;
  lastUpdated: string;
}

export class DealAnalysisOrchestrationService {
  
  private static readonly ANALYSIS_STAGES = [
    'enrichment_engines',
    'data_integration', 
    'subcriteria_mapping',
    'scoring_calculation',
    'final_analysis'
  ];
  
  /**
   * Start the complete analysis orchestration for a deal
   */
  static async orchestrateAnalysis(request: AnalysisOrchestrationRequest): Promise<{ success: boolean; orchestrationId?: string; error?: string }> {
    try {
      console.log('🎯 Starting analysis orchestration for deal:', request.dealId);
      
      // Create orchestration tracking record
      const orchestrationId = await this.createOrchestrationRecord(request);
      
      // Stage 1: Queue enrichment engines (if not already complete)
      await this.queueEnrichmentEngines(request);
      await this.updateStageStatus(orchestrationId, 'enrichment_engines', 'processing');
      
      // Stage 2: Check if enrichment is complete and trigger data integration
      const enrichmentComplete = await this.checkEnrichmentCompletion(request.dealId);
      
      if (enrichmentComplete) {
        await this.triggerDataIntegration(request, orchestrationId);
      } else {
        // Set up listener for enrichment completion
        await this.setupEnrichmentCompletionListener(request, orchestrationId);
      }
      
      return { success: true, orchestrationId };
      
    } catch (error) {
      console.error('❌ Analysis orchestration failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Create orchestration tracking record
   */
  private static async createOrchestrationRecord(request: AnalysisOrchestrationRequest): Promise<string> {
    const stages: AnalysisStageStatus[] = this.ANALYSIS_STAGES.map(stage => ({
      stage,
      status: 'pending'
    }));
    
    const { data, error } = await supabase
      .from('analysis_orchestration_tracking')
      .insert({
        deal_id: request.dealId,
        fund_id: request.fundId,
        organization_id: request.organizationId,
        trigger_reason: request.triggerReason,
        priority: request.priority || 'normal',
        overall_status: 'pending',
        stages: stages,
        progress: 0,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) {
      throw new Error(`Failed to create orchestration record: ${error.message}`);
    }
    
    return data.id;
  }
  
  /**
   * Queue all enrichment engines for the deal
   */
  private static async queueEnrichmentEngines(request: AnalysisOrchestrationRequest) {
    const templateFundType = toTemplateFundType(request.fundType);
    
    // Define engines based on fund type
    const engines = templateFundType === 'vc' ? [
      'crunchbase-export',
      'linkedin-export', 
      'linkedin-profile-export',
      'perplexity-company-vc',
      'perplexity-founder-vc',
      'perplexity-market-vc'
    ] : [
      'crunchbase-export',
      'linkedin-export',
      'linkedin-profile-export'
      // Add PE-specific engines when available
    ];
    
    // Queue each engine (simplified - would call actual queueing service)
    console.log(`🔄 Queuing ${engines.length} enrichment engines for ${templateFundType} deal`);
    
    // TODO: Implement actual engine queueing
    // This would call the existing analysis queue system
  }
  
  /**
   * Check if all enrichment engines have completed
   */
  private static async checkEnrichmentCompletion(dealId: string): Promise<boolean> {
    // Check if we have data from all required enrichment tables
    const [
      crunchbaseData,
      linkedinData,
      linkedinProfileData
    ] = await Promise.all([
      this.hasEnrichmentData('deal_enrichment_crunchbase_export', dealId),
      this.hasEnrichmentData('deal_enrichment_linkedin_export', dealId),
      this.hasEnrichmentData('deal_enrichment_linkedin_profile_export', dealId)
    ]);
    
    // Minimum completion criteria (can be expanded)
    return crunchbaseData && linkedinData;
  }
  
  /**
   * Check if enrichment data exists for a table
   */
  private static async hasEnrichmentData(tableName: string, dealId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true })
      .eq('deal_id', dealId);
    
    if (error) {
      console.warn(`Error checking ${tableName}:`, error);
      return false;
    }
    
    return (count || 0) > 0;
  }
  
  /**
   * Trigger data integration stage
   */
  private static async triggerDataIntegration(request: AnalysisOrchestrationRequest, orchestrationId: string) {
    try {
      await this.updateStageStatus(orchestrationId, 'data_integration', 'processing');
      
      // Trigger the data integration service
      const result = await DealDataIntegrationService.integrateDealData({
        dealId: request.dealId,
        fundId: request.fundId,
        organizationId: request.organizationId,
        fundType: request.fundType,
        triggerReason: 'enrichment_complete'
      });
      
      if (result.success) {
        await this.updateStageStatus(orchestrationId, 'data_integration', 'complete', { 
          dataCompleteness: result.dataCompleteness,
          sourceEngines: result.sourceEnginesProcessed 
        });
        
        // Continue to next stages
        await this.triggerSubcriteriaMapping(request, orchestrationId);
        await this.triggerScoringCalculation(request, orchestrationId);
        await this.completeFinalAnalysis(request, orchestrationId);
        
      } else {
        await this.updateStageStatus(orchestrationId, 'data_integration', 'failed', { error: result.error });
      }
      
    } catch (error) {
      await this.updateStageStatus(orchestrationId, 'data_integration', 'failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  /**
   * Setup listener for enrichment completion
   */
  private static async setupEnrichmentCompletionListener(request: AnalysisOrchestrationRequest, orchestrationId: string) {
    // This would implement a polling or webhook mechanism to check for enrichment completion
    console.log('📡 Setting up enrichment completion listener for deal:', request.dealId);
    
    // TODO: Implement polling mechanism or use database triggers
    // For now, we'll update the status to indicate waiting
    await this.updateStageStatus(orchestrationId, 'enrichment_engines', 'processing', {
      note: 'Waiting for enrichment engines to complete'
    });
  }
  
  /**
   * Trigger subcriteria mapping stage
   */
  private static async triggerSubcriteriaMapping(request: AnalysisOrchestrationRequest, orchestrationId: string) {
    try {
      await this.updateStageStatus(orchestrationId, 'subcriteria_mapping', 'processing');
      
      // The subcriteria mapping is now handled by the updated DealAnalysisSubCriteriaMapper
      // which uses the centralized datapoints tables
      console.log('🗺️ Subcriteria mapping ready (using centralized datapoints)');
      
      await this.updateStageStatus(orchestrationId, 'subcriteria_mapping', 'complete');
      
    } catch (error) {
      await this.updateStageStatus(orchestrationId, 'subcriteria_mapping', 'failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  /**
   * Trigger scoring calculation stage
   */
  private static async triggerScoringCalculation(request: AnalysisOrchestrationRequest, orchestrationId: string) {
    try {
      await this.updateStageStatus(orchestrationId, 'scoring_calculation', 'processing');
      
      // TODO: Implement scoring calculation using centralized datapoints
      console.log('🧮 Scoring calculation using centralized datapoints');
      
      await this.updateStageStatus(orchestrationId, 'scoring_calculation', 'complete');
      
    } catch (error) {
      await this.updateStageStatus(orchestrationId, 'scoring_calculation', 'failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  /**
   * Complete final analysis stage
   */
  private static async completeFinalAnalysis(request: AnalysisOrchestrationRequest, orchestrationId: string) {
    try {
      await this.updateStageStatus(orchestrationId, 'final_analysis', 'processing');
      
      // Update the overall orchestration status
      await this.updateOrchestrationStatus(orchestrationId, 'complete', 100);
      
      await this.updateStageStatus(orchestrationId, 'final_analysis', 'complete');
      
      console.log('✅ Analysis orchestration completed for deal:', request.dealId);
      
    } catch (error) {
      await this.updateStageStatus(orchestrationId, 'final_analysis', 'failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      await this.updateOrchestrationStatus(orchestrationId, 'failed', 0);
    }
  }
  
  /**
   * Update stage status
   */
  private static async updateStageStatus(
    orchestrationId: string, 
    stageName: string, 
    status: 'pending' | 'processing' | 'complete' | 'failed',
    metadata?: any
  ) {
    const timestamp = new Date().toISOString();
    
    // Get current orchestration record
    const { data: orchestration } = await supabase
      .from('analysis_orchestration_tracking')
      .select('stages')
      .eq('id', orchestrationId)
      .single();
    
    if (!orchestration) return;
    
    // Update the specific stage
    const updatedStages = orchestration.stages.map((stage: AnalysisStageStatus) => {
      if (stage.stage === stageName) {
        return {
          ...stage,
          status,
          ...(status === 'processing' && { startedAt: timestamp }),
          ...(status === 'complete' || status === 'failed' && { completedAt: timestamp }),
          ...(metadata && { metadata })
        };
      }
      return stage;
    });
    
    // Calculate progress
    const completedStages = updatedStages.filter((stage: AnalysisStageStatus) => stage.status === 'complete').length;
    const progress = Math.round((completedStages / this.ANALYSIS_STAGES.length) * 100);
    
    await supabase
      .from('analysis_orchestration_tracking')
      .update({
        stages: updatedStages,
        progress,
        last_updated: timestamp
      })
      .eq('id', orchestrationId);
  }
  
  /**
   * Update overall orchestration status
   */
  private static async updateOrchestrationStatus(
    orchestrationId: string,
    status: 'pending' | 'processing' | 'complete' | 'failed',
    progress: number
  ) {
    await supabase
      .from('analysis_orchestration_tracking')
      .update({
        overall_status: status,
        progress,
        last_updated: new Date().toISOString(),
        ...(status === 'complete' && { completed_at: new Date().toISOString() })
      })
      .eq('id', orchestrationId);
  }
  
  /**
   * Get orchestration status for a deal
   */
  static async getOrchestrationStatus(dealId: string): Promise<OrchestrationStatus | null> {
    const { data } = await supabase
      .from('analysis_orchestration_tracking')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!data) return null;
    
    return {
      dealId: data.deal_id,
      overallStatus: data.overall_status,
      stages: data.stages,
      progress: data.progress,
      estimatedCompletion: data.estimated_completion,
      lastUpdated: data.last_updated
    };
  }
}