import { useState, useEffect } from 'react';

// Master kill switch for the entire analysis system
export function useAnalysisSystemKillSwitch() {
  const [isAnalysisDisabled, setIsAnalysisDisabled] = useState(true); // Default to disabled

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

  return {
    isAnalysisDisabled,
    disableAnalysisSystem,
    enableAnalysisSystem
  };
}