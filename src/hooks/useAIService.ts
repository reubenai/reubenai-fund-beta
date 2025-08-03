import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useToast } from '@/hooks/use-toast';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { NetworkHandler } from '@/utils/edgeCaseHandler';

interface AIServiceOptions {
  timeout?: number;
  retries?: number;
  onProgress?: (stage: string, progress?: number) => void;
  fallbackMessage?: string;
}

interface AIServiceResponse<T = any> {
  data: T | null;
  error: string | null;
  fromCache?: boolean;
}

export function useAIService() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const { handleAsyncError, withRetry } = useErrorHandler();
  const { toast } = useToast();

  const callAIService = useCallback(async <T>(
    functionName: string,
    payload: any,
    options: AIServiceOptions = {}
  ): Promise<AIServiceResponse<T>> => {
    const {
      timeout = 30000, // 30 seconds default
      retries = 2,
      onProgress,
      fallbackMessage = 'AI analysis is temporarily unavailable. Please try again later.'
    } = options;

    const startTime = performance.now();
    setIsLoading(true);
    setCurrentStage('starting');
    setProgress(0);
    
    // Report progress to caller
    const reportProgress = (stage: string, progressValue?: number) => {
      setCurrentStage(stage);
      if (progressValue !== undefined) {
        setProgress(progressValue);
      }
      onProgress?.(stage, progressValue);
    };

    try {
      reportProgress('initializing', 10);

      // Check network connectivity first
      const isConnected = await NetworkHandler.checkConnectivity();
      if (!isConnected) {
        throw new Error('No network connection available');
      }

      const result = await NetworkHandler.withRetry(
        async () => {
          reportProgress('analyzing', 30);
          
          // Create timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`AI service timeout after ${timeout}ms`));
            }, timeout);
          });

          // Create actual service call
          const servicePromise = supabase.functions.invoke(functionName, {
            body: payload
          });

          reportProgress('processing', 60);

          // Race between timeout and actual call
          const response = await Promise.race([servicePromise, timeoutPromise]) as any;
          
          reportProgress('finalizing', 90);

          if (response.error) {
            throw new Error(response.error.message || 'AI service error');
          }

          reportProgress('complete', 100);
          return response.data;
        },
        retries,
        1000 // 1 second delay between retries
      );

      // Track API performance
      const endTime = performance.now();
      const duration = endTime - startTime;
      performanceMonitor.trackAPICall(functionName, duration, result !== null);

      if (result === null) {
        // Show fallback message on total failure
        toast({
          title: 'Analysis Unavailable',
          description: fallbackMessage,
          variant: 'default'
        });
        
        return { data: null, error: fallbackMessage };
      }

      return { data: result, error: null };

    } catch (error) {
      // Track failed API call
      const endTime = performance.now();
      const duration = endTime - startTime;
      performanceMonitor.trackAPICall(functionName, duration, false);
      console.error(`AI Service ${functionName} failed:`, error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          return { 
            data: null, 
            error: 'Analysis is taking longer than expected. Please try again or contact support if this persists.' 
          };
        }
        if (error.message.includes('network')) {
          return { 
            data: null, 
            error: 'Unable to connect to AI services. Please check your connection and try again.' 
          };
        }
      }

      return { data: null, error: fallbackMessage };
    } finally {
      setIsLoading(false);
      setCurrentStage('');
      setProgress(0);
    }
  }, [toast]);

  // Specific AI service methods with proper error handling
  const analyzeCompany = useCallback(async (dealId: string) => {
    return callAIService('enhanced-deal-analysis', {
      dealId,
      analysisType: 'comprehensive'
    }, {
      onProgress: (stage, progress) => console.log(`Company analysis: ${stage} (${progress}%)`),
      fallbackMessage: 'Company analysis is currently unavailable. You can still view and edit deal information manually.'
    });
  }, [callAIService]);

  const generateMemo = useCallback(async (dealId: string, templateId?: string) => {
    return callAIService('ai-memo-generator', {
      dealId,
      templateId
    }, {
      timeout: 45000, // Longer timeout for memo generation
      onProgress: (stage, progress) => console.log(`Memo generation: ${stage} (${progress}%)`),
      fallbackMessage: 'Memo generation is currently unavailable. You can create memos manually using the template editor.'
    });
  }, [callAIService]);

  const processDocument = useCallback(async (documentId: string, dealId: string) => {
    return callAIService('document-processor', {
      documentId,
      dealId,
      analysisType: 'comprehensive'
    }, {
      onProgress: (stage, progress) => console.log(`Document processing: ${stage} (${progress}%)`),
      fallbackMessage: 'Document analysis is currently unavailable. The document has been uploaded and can be reviewed manually.'
    });
  }, [callAIService]);

  const runOrchestrator = useCallback(async (dealId: string) => {
    return callAIService('reuben-orchestrator', {
      dealId
    }, {
      timeout: 60000, // Longer timeout for comprehensive analysis
      retries: 1, // Fewer retries for complex operations
      onProgress: (stage, progress) => console.log(`Orchestrator: ${stage} (${progress}%)`),
      fallbackMessage: 'Comprehensive analysis is currently unavailable. Basic deal information is still accessible.'
    });
  }, [callAIService]);

  return {
    isLoading,
    currentStage,
    progress,
    callAIService,
    analyzeCompany,
    generateMemo,
    processDocument,
    runOrchestrator
  };
}