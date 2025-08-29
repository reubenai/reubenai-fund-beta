import { useState, useCallback } from 'react';
import { WaterfallProcessingService, WaterfallProcessingResult, EngineCompletionStatus } from '@/services/waterfallProcessingService';
import { toast } from 'sonner';

interface UseWaterfallProcessingReturn {
  isProcessing: boolean;
  currentStatus: EngineCompletionStatus | null;
  processingResult: WaterfallProcessingResult | null;
  startWaterfallProcessing: (dealId: string, fundId: string, fundType: 'vc' | 'pe', options?: any) => Promise<WaterfallProcessingResult>;
  getWaterfallStatus: (dealId: string) => Promise<EngineCompletionStatus | null>;
  clearStatus: () => void;
}

export function useWaterfallProcessing(): UseWaterfallProcessingReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<EngineCompletionStatus | null>(null);
  const [processingResult, setProcessingResult] = useState<WaterfallProcessingResult | null>(null);

  const startWaterfallProcessing = useCallback(async (
    dealId: string,
    fundId: string,
    fundType: 'vc' | 'pe',
    options = {}
  ): Promise<WaterfallProcessingResult> => {
    if (isProcessing) {
      throw new Error('Waterfall processing already in progress');
    }

    setIsProcessing(true);
    setProcessingResult(null);
    
    try {
      toast.info('🌊 Starting waterfall processing...', {
        description: 'Monitoring enrichment engines and consolidating data',
      });

      const result = await WaterfallProcessingService.startWaterfallProcessing(
        dealId,
        fundId,
        fundType,
        {
          enableAIEnhancement: true,
          timeoutMinutes: 5,
          checkIntervalSeconds: 60,
          ...options
        }
      );

      setProcessingResult(result);

      if (result.success) {
        const statusEmoji = result.completionStatus === 'completed' ? '🎉' : 
                           result.completionStatus === 'timeout' ? '⏰' : '🔧';
        
        toast.success(`${statusEmoji} Waterfall processing ${result.completionStatus}`, {
          description: `Processed ${result.enginesProcessed.length} engines, created ${result.dataPointsCreated} data points (${result.completenessScore}% complete)`,
          duration: 5000,
        });
      } else {
        toast.error('❌ Waterfall processing failed', {
          description: result.error || 'Unknown error occurred',
        });
      }

      return result;

    } catch (error) {
      console.error('Waterfall processing error:', error);
      
      const errorResult: WaterfallProcessingResult = {
        success: false,
        completionStatus: 'failed',
        enginesProcessed: [],
        enginesFailed: [],
        dataPointsCreated: 0,
        completenessScore: 0,
        processingTimeMs: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setProcessingResult(errorResult);
      
      toast.error('❌ Waterfall processing failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });

      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const getWaterfallStatus = useCallback(async (dealId: string): Promise<EngineCompletionStatus | null> => {
    try {
      const status = await WaterfallProcessingService.getWaterfallStatus(dealId);
      setCurrentStatus(status);
      return status;
    } catch (error) {
      console.error('Error getting waterfall status:', error);
      return null;
    }
  }, []);

  const clearStatus = useCallback(() => {
    setCurrentStatus(null);
    setProcessingResult(null);
  }, []);

  return {
    isProcessing,
    currentStatus,
    processingResult,
    startWaterfallProcessing,
    getWaterfallStatus,
    clearStatus,
  };
}