import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EmergencyCheckResult {
  blocked: boolean;
  reason?: string;
  message?: string;
  blockedAt?: string;
  blockedUntil?: string;
  autoAnalysisEnabled?: boolean;
  queueStatus?: string;
}

export function useEmergencyDealChecker() {
  const [isChecking, setIsChecking] = useState(false);

  const checkDealStatus = useCallback(async (dealId: string): Promise<EmergencyCheckResult> => {
    setIsChecking(true);
    
    try {
      // EMERGENCY HARD-CODED CHECK for the problematic deal
      const criticalBlacklistedDealId = '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d';
      
      if (dealId === criticalBlacklistedDealId) {
        console.log(`🚨 EMERGENCY CIRCUIT BREAKER: Deal ${dealId} is HARD BLOCKED`);
        return {
          blocked: true,
          reason: 'EMERGENCY_SHUTDOWN_EXCESSIVE_ACTIVITY',
          message: 'This deal has been emergency blocked due to excessive engine activity'
        };
      }

      // Call emergency checker function
      const { data, error } = await supabase.functions.invoke('emergency-deal-checker', {
        body: { dealId }
      });

      if (error) {
        console.error('Emergency check failed:', error);
        // Fail safe - if check fails, don't block
        return { blocked: false };
      }

      return data as EmergencyCheckResult;
    } catch (error) {
      console.error('Emergency check error:', error);
      // Fail safe - if check fails, don't block
      return { blocked: false };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const isBlacklisted = useCallback((dealId: string): boolean => {
    // EMERGENCY HARD-CODED CHECK - no async needed
    const criticalBlacklistedDealId = '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d';
    return dealId === criticalBlacklistedDealId;
  }, []);

  return {
    checkDealStatus,
    isBlacklisted,
    isChecking
  };
}