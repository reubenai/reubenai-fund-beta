import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalysisRefreshOptions {
  dealId: string;
  onRefreshNeeded?: () => void;
  checkInterval?: number; // in milliseconds
  autoRefresh?: boolean;
}

export function useAnalysisRefresh({
  dealId,
  onRefreshNeeded,
  checkInterval = 30000, // 30 seconds
  autoRefresh = false
}: AnalysisRefreshOptions) {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedRef = useRef<Date>(new Date());

  const checkForUpdates = useCallback(async () => {
    try {
      // Get deal's last update time
      const { data: deal } = await supabase
        .from('deals')
        .select('updated_at')
        .eq('id', dealId)
        .single();

      if (!deal) return false;

      const dealUpdatedTime = new Date(deal.updated_at).getTime();
      const lastCheckedTime = lastCheckedRef.current.getTime();

      // Check if deal was updated since we last checked
      if (dealUpdatedTime > lastCheckedTime) {
        lastCheckedRef.current = new Date();
        
        if (autoRefresh) {
          await triggerAnalysisRefresh();
        } else {
          onRefreshNeeded?.();
        }
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking for deal updates:', error);
      return false;
    }
  }, [dealId, autoRefresh, onRefreshNeeded]);

  const triggerAnalysisRefresh = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-deal-analysis', {
        body: { 
          dealId,
          analysisType: 'refresh',
          incrementVersion: true
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Analysis Refreshed",
          description: "Deal analysis has been updated with the latest information.",
          variant: "default"
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing analysis:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh analysis. Please try again manually.",
        variant: "destructive"
      });
      return false;
    }
  }, [dealId, toast]);

  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(checkForUpdates, checkInterval);
  }, [checkForUpdates, checkInterval]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    checkForUpdates,
    triggerAnalysisRefresh,
    startMonitoring,
    stopMonitoring
  };
}