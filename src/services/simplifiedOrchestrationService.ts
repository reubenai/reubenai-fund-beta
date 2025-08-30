/**
 * Simplified Deal Analysis Orchestration Service
 * Manages the end-to-end analysis pipeline without complex type dependencies
 */

import { DealDataIntegrationService } from './dealDataIntegrationService';
import { AnyFundType } from '@/utils/fundTypeConversion';

export interface SimpleOrchestrationRequest {
  dealId: string;
  fundId: string;
  organizationId: string;
  fundType: AnyFundType;
  triggerReason: 'new_deal' | 'document_upload' | 'manual_trigger';
  priority?: 'high' | 'normal' | 'low';
}

export interface SimpleOrchestrationResult {
  success: boolean;
  orchestrationId?: string;
  message?: string;
  dataCompleteness?: number;
  error?: string;
}

export class SimplifiedOrchestrationService {
  
  /**
   * Start the simplified analysis orchestration for a deal
   */
  static async orchestrateAnalysis(request: SimpleOrchestrationRequest): Promise<SimpleOrchestrationResult> {
    try {
      console.log('🎯 Starting simplified analysis orchestration for deal:', request.dealId);
      
      // Step 1: Trigger data integration directly
      const integrationResult = await DealDataIntegrationService.integrateDealData({
        dealId: request.dealId,
        fundId: request.fundId,
        organizationId: request.organizationId,
        fundType: request.fundType,
        triggerReason: 'manual_refresh'
      });
      
      if (integrationResult.success) {
        console.log('✅ Data integration completed successfully');
        
        // For now, we'll focus on data integration as the core orchestration
        // Additional stages can be added as the system evolves
        
        return {
          success: true,
          orchestrationId: `orch_${request.dealId}_${Date.now()}`,
          message: 'Data integration completed successfully',
          dataCompleteness: integrationResult.dataCompleteness
        };
      } else {
        return {
          success: false,
          error: integrationResult.error || 'Data integration failed',
          dataCompleteness: 0
        };
      }
      
    } catch (error) {
      console.error('❌ Simplified orchestration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        dataCompleteness: 0
      };
    }
  }
  
  /**
   * Get orchestration status for a deal (simplified version)
   */
  static async getOrchestrationStatus(dealId: string, fundType: AnyFundType) {
    try {
      // Check data integration status
      const integrationStatus = await DealDataIntegrationService.getIntegrationStatus(dealId, fundType);
      
      if (integrationStatus) {
        return {
          dealId,
          overallStatus: 'complete',
          progress: integrationStatus.completenessScore || 0,
          dataCompleteness: integrationStatus.dataCompleteness || 0,
          sourceEngines: integrationStatus.sourceEnginesProcessed || [],
          lastUpdated: integrationStatus.lastUpdated || new Date().toISOString()
        };
      }
      
      return {
        dealId,
        overallStatus: 'pending',
        progress: 0,
        dataCompleteness: 0,
        sourceEngines: [],
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error getting orchestration status:', error);
      return null;
    }
  }
}