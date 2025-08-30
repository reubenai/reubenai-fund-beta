import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PostProcessResult {
  id: string;
  company_name: string;
  success: boolean;
  error?: string;
}

interface PostProcessResponse {
  success: boolean;
  processed_count: number;
  results: PostProcessResult[];
}

export const useCrunchbasePostProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);

  const processRawRecords = async (dealId?: string, crunchbaseExportId?: string) => {
    setIsProcessing(true);
    
    try {
      console.log('🔄 Triggering Crunchbase post-processor...', { dealId, crunchbaseExportId });
      
      const { data, error } = await supabase.functions.invoke('crunchbase-export-post-processor', {
        body: {
          dealId,
          crunchbaseExportId,
          forceReprocess: false
        }
      });

      if (error) {
        console.error('❌ Post-processor error:', error);
        toast.error(`Failed to process Crunchbase data: ${error.message}`);
        return null;
      }

      const result = data as PostProcessResponse;
      
      if (result.success && result.processed_count > 0) {
        const successCount = result.results.filter(r => r.success).length;
        const failCount = result.results.filter(r => !r.success).length;
        
        if (successCount > 0) {
          toast.success(`Successfully processed ${successCount} Crunchbase record(s)`);
        }
        
        if (failCount > 0) {
          toast.warning(`${failCount} record(s) failed to process`);
        }
        
        console.log('✅ Post-processor completed:', result);
        return result;
      } else {
        toast.info('No raw Crunchbase records found to process');
        return result;
      }

    } catch (error) {
      console.error('❌ Error calling post-processor:', error);
      toast.error('Failed to process Crunchbase data');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const processAllRawRecords = async () => {
    return processRawRecords(); // Process all records without filters
  };

  const processDealRecords = async (dealId: string) => {
    return processRawRecords(dealId); // Process records for specific deal
  };

  const backfillAllRawRecords = async (): Promise<PostProcessResponse | null> => {
    setIsBackfilling(true);
    try {
      console.log('🔄 Starting Crunchbase backfill for all raw records...');
      
      // Call without any filters to process all raw records
      const { data, error } = await supabase.functions.invoke('crunchbase-export-post-processor', {
        body: { forceReprocess: false } // Process only raw records
      });

      if (error) {
        console.error('❌ Backfill error:', error);
        toast.error('Failed to backfill raw records: ' + error.message);
        return null;
      }

      const result = data as PostProcessResponse;
      console.log('✅ Backfill completed:', result);
      toast.success(`Successfully backfilled ${result.processed_count || 0} raw Crunchbase records`);
      return result;
    } catch (error: any) {
      console.error('❌ Backfill failed:', error);
      toast.error('Backfill failed: ' + error.message);
      return null;
    } finally {
      setIsBackfilling(false);
    }
  };

  return {
    isProcessing,
    isBackfilling,
    processRawRecords,
    processAllRawRecords,
    processDealRecords,
    backfillAllRawRecords,
  };
};