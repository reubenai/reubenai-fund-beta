import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmergencyDealChecker } from './useEmergencyDealChecker';

// Master kill switch for the entire analysis system + emergency deal blocking
export function useAnalysisSystemKillSwitch() {
  const [isAnalysisDisabled, setIsAnalysisDisabled] = useState(false); // Default to enabled
  const { isBlacklisted } = useEmergencyDealChecker();

  // Hard disable all analysis operations
  const disableAnalysisSystem = () => {
    setIsAnalysisDisabled(true);
    console.log('🚫 Analysis system HARD DISABLED');
  };

  const enableAnalysisSystem = () => {
    setIsAnalysisDisabled(false);
    console.log('✅ Analysis system enabled');
  };

  // Check database switch on initialization (simplified for now)
  useEffect(() => {
    // For now, keep system enabled by default
    // TODO: Add proper database-backed switch when needed
    console.log('📊 Analysis system enabled by default');
  }, []);

  // Emergency check for specific deals
  const isDealBlocked = (dealId?: string) => {
    if (!dealId) return false;
    return isBlacklisted(dealId);
  };

  return {
    isAnalysisDisabled,
    disableAnalysisSystem,
    enableAnalysisSystem,
    isDealBlocked
  };
}