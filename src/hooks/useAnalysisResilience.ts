import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResilienceOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeoutMs?: number;
  qualityThreshold?: number;
}

interface AnalysisResult {
  success: boolean;
  data?: any;
  error?: string;
  quality_score?: number;
  retry_count?: number;
}

export function useAnalysisResilience() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastQualityCheck, setLastQualityCheck] = useState<any>(null);

  const analyzeWithResilience = useCallback(async (
    dealId: string,
    analysisType: string = 'market_opportunity',
    options: ResilienceOptions = {}
  ): Promise<AnalysisResult> => {
    const {
      maxRetries = 3,
      retryDelay = 2000,
      timeoutMs = 30000,
      qualityThreshold = 50
    } = options;

    setIsProcessing(true);
    let retryCount = 0;

    const performAnalysis = async (): Promise<AnalysisResult> => {
      try {
        // First check if we have recent quality data
        const qualityCheck = await supabase.rpc('monitor_analysis_quality', {
          p_deal_id: dealId,
          p_analysis_type: analysisType
        });

        const qualityData = qualityCheck.data as any;
        
        if (qualityData?.quality_score >= qualityThreshold) {
          console.log('✅ [Resilience] Quality threshold met, using existing data');
          return {
            success: true,
            quality_score: qualityData.quality_score,
            data: qualityData
          };
        }

        // Trigger analysis with timeout
        const analysisPromise = supabase.functions.invoke('enhanced-deal-analysis', {
          body: { dealId, analysisType }
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Analysis timeout')), timeoutMs)
        );

        const result = await Promise.race([analysisPromise, timeoutPromise]) as any;

        if (result.error) {
          throw new Error(result.error.message || 'Analysis failed');
        }

        // Check quality again after analysis
        const postAnalysisQuality = await supabase.rpc('monitor_analysis_quality', {
          p_deal_id: dealId,
          p_analysis_type: analysisType
        });

        const postQualityData = postAnalysisQuality.data as any;
        setLastQualityCheck(postQualityData);

        if (postQualityData?.quality_score < qualityThreshold) {
          throw new Error(`Quality score ${postQualityData?.quality_score} below threshold ${qualityThreshold}`);
        }

        return {
          success: true,
          data: result.data,
          quality_score: postQualityData?.quality_score,
          retry_count: retryCount
        };

      } catch (error: any) {
        console.error(`❌ [Resilience] Analysis attempt ${retryCount + 1} failed:`, error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 [Resilience] Retrying in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return performAnalysis();
        }

        return {
          success: false,
          error: error.message,
          retry_count: retryCount
        };
      }
    };

    try {
      const result = await performAnalysis();
      
      if (result.success) {
        toast({
          title: "Analysis Complete",
          description: `Quality score: ${result.quality_score || 'N/A'}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: `Failed after ${result.retry_count} retries: ${result.error}`,
          variant: "destructive"
        });
      }

      return result;

    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const getQualityStatus = useCallback(async (dealId: string, analysisType: string = 'market_opportunity') => {
    try {
      const { data } = await supabase.rpc('monitor_analysis_quality', {
        p_deal_id: dealId,
        p_analysis_type: analysisType
      });

      return {
        success: true,
        quality_data: data as any
      };
    } catch (error: any) {
      console.error('Quality check failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }, []);

  const forceQualityRefresh = useCallback(async (dealId: string) => {
    try {
      // Clear any cached analysis data to force fresh analysis
      await supabase
        .from('deal_analysis_sources')
        .delete()
        .eq('deal_id', dealId)
        .lt('retrieved_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Older than 5 minutes

      toast({
        title: "Cache Cleared",
        description: "Forced refresh of analysis data",
        variant: "default"
      });

      return { success: true };
    } catch (error: any) {
      console.error('Force refresh failed:', error);
      return { success: false, error: error.message };
    }
  }, [toast]);

  return {
    analyzeWithResilience,
    getQualityStatus,
    forceQualityRefresh,
    isProcessing,
    lastQualityCheck
  };
}