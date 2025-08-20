import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useDealEditConflictPrevention() {
  const { toast } = useToast();

  const checkDealEditSafety = useCallback(async (dealId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('is_deal_safe_to_edit', { deal_id_param: dealId });

      if (error) throw error;
      
      return { isSafe: data, error: null };
    } catch (error) {
      console.error('Error checking deal edit safety:', error);
      return { isSafe: false, error: error.message };
    }
  }, []);

  const temporarilyDisableAutoAnalysis = useCallback(async (dealId: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ auto_analysis_enabled: false })
        .eq('id', dealId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn('Could not disable auto-analysis:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const restoreAutoAnalysis = useCallback(async (dealId: string, originalState: boolean = true) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ auto_analysis_enabled: originalState })
        .eq('id', dealId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn('Could not restore auto-analysis:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const performSafeUpdate = useCallback(async (
    dealId: string, 
    updateData: Record<string, any>,
    maxRetries: number = 3
  ) => {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const { error } = await supabase
          .from('deals')
          .update(updateData)
          .eq('id', dealId);

        if (error) {
          // Check for specific conflict errors
          if (error.code === '42P10' || error.message.includes('conflict')) {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Retry attempt ${retryCount} due to conflict`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
          }
          throw error;
        }

        return { success: true, attempts: retryCount + 1 };

      } catch (error) {
        console.error(`Error updating deal (attempt ${retryCount + 1}):`, error);
        
        if (retryCount === maxRetries - 1) {
          let errorMessage = "Failed to update deal";
          
          if (error.message?.includes('constraint')) {
            errorMessage = "Data validation failed. Please check your inputs.";
          } else if (error.code === '42P10') {
            errorMessage = "Conflict detected. Another process may be updating this deal.";
          }
          
          return { 
            success: false, 
            error: errorMessage, 
            attempts: retryCount + 1 
          };
        }
        
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    return { success: false, error: "Max retries exceeded", attempts: retryCount };
  }, []);

  return {
    checkDealEditSafety,
    temporarilyDisableAutoAnalysis,
    restoreAutoAnalysis,
    performSafeUpdate
  };
}