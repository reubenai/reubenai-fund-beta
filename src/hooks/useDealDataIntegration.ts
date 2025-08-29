/**
 * Hook for managing deal data integration into centralized datapoints tables
 */

import { useState, useCallback } from 'react';
import { DealDataIntegrationService, DataIntegrationRequest, DataIntegrationResult } from '@/services/dealDataIntegrationService';
import { useToast } from '@/hooks/use-toast';
import { AnyFundType } from '@/utils/fundTypeConversion';

export function useDealDataIntegration() {
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, DataIntegrationResult>>({});
  const { toast } = useToast();

  /**
   * Trigger data integration for a specific deal
   */
  const integrateDealData = useCallback(async (
    dealId: string,
    fundId: string,
    organizationId: string,
    fundType: AnyFundType,
    options: {
      triggerReason?: 'new_deal' | 'enrichment_update' | 'manual_refresh';
      showToast?: boolean;
    } = {}
  ): Promise<DataIntegrationResult> => {
    const { triggerReason = 'manual_refresh', showToast = true } = options;

    try {
      setIsIntegrating(true);

      const request: DataIntegrationRequest = {
        dealId,
        fundId,
        organizationId,
        fundType,
        triggerReason
      };

      const result = await DealDataIntegrationService.integrateDealData(request);

      // Update status tracking
      setIntegrationStatus(prev => ({
        ...prev,
        [dealId]: result
      }));

      if (showToast) {
        if (result.success) {
          toast({
            title: "Data Integration Complete",
            description: `Successfully integrated ${result.sourceEnginesProcessed.length} data sources (${result.dataCompleteness}% complete)`,
            variant: "default"
          });
        } else {
          toast({
            title: "Data Integration Failed",
            description: result.error || "Failed to integrate deal data",
            variant: "destructive"
          });
        }
      }

      return result;

    } catch (error) {
      console.error('Deal data integration error:', error);
      
      const errorResult: DataIntegrationResult = {
        success: false,
        dataCompleteness: 0,
        sourceEnginesProcessed: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      setIntegrationStatus(prev => ({
        ...prev,
        [dealId]: errorResult
      }));

      if (showToast) {
        toast({
          title: "Integration Error",
          description: "Failed to integrate deal data sources",
          variant: "destructive"
        });
      }

      return errorResult;

    } finally {
      setIsIntegrating(false);
    }
  }, [toast]);

  /**
   * Get integration status for a deal
   */
  const getIntegrationStatus = useCallback(async (dealId: string, fundType: AnyFundType) => {
    try {
      const status = await DealDataIntegrationService.getIntegrationStatus(dealId, fundType);
      
      if (status) {
        const result: DataIntegrationResult = {
          success: true,
          dataCompleteness: status.data_completeness_score,
          sourceEnginesProcessed: status.source_engines,
          vcDataPointsCreated: fundType === 'venture_capital' || fundType === 'vc',
          peDataPointsCreated: fundType === 'private_equity' || fundType === 'pe'
        };

        setIntegrationStatus(prev => ({
          ...prev,
          [dealId]: result
        }));

        return result;
      }

      return null;
    } catch (error) {
      console.error('Error fetching integration status:', error);
      return null;
    }
  }, []);

  /**
   * Batch integrate multiple deals
   */
  const batchIntegrateDeals = useCallback(async (
    deals: Array<{
      dealId: string;
      fundId: string;
      organizationId: string;
      fundType: AnyFundType;
    }>
  ): Promise<Record<string, DataIntegrationResult>> => {
    setIsIntegrating(true);
    const results: Record<string, DataIntegrationResult> = {};

    try {
      // Process deals in parallel (limited concurrency)
      const batchSize = 3;
      for (let i = 0; i < deals.length; i += batchSize) {
        const batch = deals.slice(i, i + batchSize);
        
        const batchPromises = batch.map(deal => 
          integrateDealData(
            deal.dealId, 
            deal.fundId, 
            deal.organizationId, 
            deal.fundType, 
            { showToast: false }
          ).then(result => ({ dealId: deal.dealId, result }))
        );

        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(({ dealId, result }) => {
          results[dealId] = result;
        });
      }

      const successCount = Object.values(results).filter(r => r.success).length;
      const totalCount = deals.length;

      toast({
        title: "Batch Integration Complete",
        description: `Successfully integrated ${successCount}/${totalCount} deals`,
        variant: successCount === totalCount ? "default" : "destructive"
      });

      return results;

    } catch (error) {
      console.error('Batch integration error:', error);
      toast({
        title: "Batch Integration Failed",
        description: "Failed to complete batch integration",
        variant: "destructive"
      });
      return results;
    } finally {
      setIsIntegrating(false);
    }
  }, [integrateDealData, toast]);

  /**
   * Clear integration status for a deal
   */
  const clearIntegrationStatus = useCallback((dealId: string) => {
    setIntegrationStatus(prev => {
      const { [dealId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    // State
    isIntegrating,
    integrationStatus,
    
    // Actions
    integrateDealData,
    getIntegrationStatus,
    batchIntegrateDeals,
    clearIntegrationStatus
  };
}