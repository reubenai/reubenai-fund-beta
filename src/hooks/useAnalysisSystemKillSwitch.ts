import { useState, useEffect } from 'react';
import { useEmergencyDealChecker } from './useEmergencyDealChecker';

// Master kill switch for the entire analysis system + emergency deal blocking
export function useAnalysisSystemKillSwitch() {
  const [isAnalysisDisabled, setIsAnalysisDisabled] = useState(true); // Default to disabled
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

  // Initialize as disabled
  useEffect(() => {
    disableAnalysisSystem();
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