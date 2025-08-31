import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestResult {
  success: boolean;
  test_results?: {
    deal_id: string;
    deal_info: any;
    enrichment_response: any;
    database_saved: boolean;
    saved_record: any;
  };
  error?: string;
}

interface BatchResult {
  success: boolean;
  dry_run: boolean;
  deals_found?: number;
  deals_preview?: any[];
  batch_results?: {
    total_processed: number;
    successful: number;
    failed: number;
    details: any[];
  };
  error?: string;
}

export const usePerplexityMarketTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);

  // Manual test function
  const runManualTest = async (dealId?: string): Promise<TestResult | null> => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      console.log('🧪 Running manual Perplexity market enrichment test...');
      
      const { data, error } = await supabase.functions.invoke('perplexity-market-test', {
        body: { dealId, testMode: !dealId }
      });

      if (error) {
        console.error('❌ Test function error:', error);
        toast.error(`Test failed: ${error.message}`);
        const errorResult = { success: false, error: error.message };
        setTestResult(errorResult);
        return errorResult;
      }

      console.log('✅ Test completed:', data);
      
      if (data.success) {
        toast.success('Market enrichment test completed successfully!');
      } else {
        toast.error(`Test failed: ${data.error}`);
      }
      
      setTestResult(data);
      return data;

    } catch (error) {
      console.error('❌ Unexpected test error:', error);
      toast.error('An unexpected error occurred during testing');
      const errorResult = { success: false, error: 'Unexpected error occurred' };
      setTestResult(errorResult);
      return errorResult;
    } finally {
      setIsTesting(false);
    }
  };

  // Batch processing function
  const runBatchProcessing = async (
    batchSize: number = 10, 
    dryRun: boolean = true
  ): Promise<BatchResult | null> => {
    setIsProcessing(true);
    setBatchResult(null);
    
    try {
      console.log('🔄 Running batch market enrichment...', { batchSize, dryRun });
      
      const { data, error } = await supabase.functions.invoke('perplexity-market-batch-processor', {
        body: { batchSize, dryRun }
      });

      if (error) {
        console.error('❌ Batch processing error:', error);
        toast.error(`Batch processing failed: ${error.message}`);
        const errorResult = { success: false, dry_run: dryRun, error: error.message };
        setBatchResult(errorResult);
        return errorResult;
      }

      console.log('✅ Batch processing completed:', data);
      
      if (data.success) {
        if (dryRun) {
          toast.success(`Found ${data.deals_found} deals needing market enrichment`);
        } else {
          toast.success(
            `Batch processing complete: ${data.batch_results.successful} successful, ${data.batch_results.failed} failed`
          );
        }
      } else {
        toast.error(`Batch processing failed: ${data.error}`);
      }
      
      setBatchResult(data);
      return data;

    } catch (error) {
      console.error('❌ Unexpected batch processing error:', error);
      toast.error('An unexpected error occurred during batch processing');
      const errorResult = { success: false, dry_run: dryRun, error: 'Unexpected error occurred' };
      setBatchResult(errorResult);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isTesting,
    isProcessing,
    testResult,
    batchResult,
    runManualTest,
    runBatchProcessing
  };
};