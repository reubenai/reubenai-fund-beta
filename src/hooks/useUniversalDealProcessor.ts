import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessingOptions {
  skipEnrichment?: boolean;
  skipAnalysis?: boolean;
  priority?: 'low' | 'normal' | 'high';
  metadata?: any;
}

interface ProcessingResult {
  dealId: string;
  enrichmentStatus: 'completed' | 'failed' | 'skipped';
  analysisStatus: 'queued' | 'failed' | 'skipped';
  fieldsCompleted: string[];
  confidence: number;
  source: string;
}

export function useUniversalDealProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const processDeal = useCallback(async (
    dealData: any,
    source: 'single_upload' | 'batch_csv' | 'ai_sourcing',
    fundId: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult | null> => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentStage('initializing');

    try {
      console.log(`🔄 Processing ${source} deal:`, dealData.company_name);
      
      setCurrentStage('processing');
      setProgress(25);

      const { data: response, error } = await supabase.functions.invoke('universal-deal-processor', {
        body: {
          dealData,
          source,
          fundId,
          options
        }
      });

      setProgress(75);

      if (error) {
        throw new Error(error.message || 'Processing failed');
      }

      setCurrentStage('completing');
      setProgress(100);

      const result = response.result as ProcessingResult;
      
      toast({
        title: 'Deal Processed Successfully',
        description: `${dealData.company_name} has been enriched and queued for analysis`,
      });

      return result;

    } catch (error) {
      console.error('Universal deal processing failed:', error);
      
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Failed to process deal',
        variant: 'destructive'
      });

      return null;
    } finally {
      setIsProcessing(false);
      setCurrentStage('');
      setProgress(0);
    }
  }, [toast]);

  const processExistingDeal = useCallback(async (
    dealId: string,
    source: 'single_upload' | 'batch_csv' | 'ai_sourcing',
    fundId: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult | null> => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentStage('enriching');

    try {
      console.log(`🔄 Re-processing existing deal: ${dealId}`);

      const { data: response, error } = await supabase.functions.invoke('universal-deal-processor', {
        body: {
          dealId,
          source,
          fundId,
          options
        }
      });

      setProgress(100);

      if (error) {
        throw new Error(error.message || 'Re-processing failed');
      }

      const result = response.result as ProcessingResult;
      
      toast({
        title: 'Deal Re-processed',
        description: `Deal has been enriched with additional data`,
      });

      return result;

    } catch (error) {
      console.error('Deal re-processing failed:', error);
      
      toast({
        title: 'Re-processing Failed',
        description: error instanceof Error ? error.message : 'Failed to re-process deal',
        variant: 'destructive'
      });

      return null;
    } finally {
      setIsProcessing(false);
      setCurrentStage('');
      setProgress(0);
    }
  }, [toast]);

  const batchProcessDeals = useCallback(async (
    deals: any[],
    source: 'batch_csv',
    fundId: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult[]> => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentStage('batch_processing');

    const results: ProcessingResult[] = [];

    try {
      for (const [index, dealData] of deals.entries()) {
        setProgress((index / deals.length) * 100);
        setCurrentStage(`Processing ${dealData.company_name || `deal ${index + 1}`}`);

        const result = await processDeal(dealData, source, fundId, {
          ...options,
          priority: 'normal' // Lower priority for batch
        });

        if (result) {
          results.push(result);
        }
      }

      toast({
        title: 'Batch Processing Complete',
        description: `Successfully processed ${results.length} of ${deals.length} deals`,
      });

    } catch (error) {
      console.error('Batch processing failed:', error);
      
      toast({
        title: 'Batch Processing Failed',
        description: 'Some deals may not have been processed correctly',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setCurrentStage('');
      setProgress(0);
    }

    return results;
  }, [processDeal, toast]);

  return {
    isProcessing,
    currentStage,
    progress,
    processDeal,
    processExistingDeal,
    batchProcessDeals
  };
}