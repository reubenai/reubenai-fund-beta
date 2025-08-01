import { useState, useEffect } from 'react';
import { useUnifiedStrategy } from '@/hooks/useUnifiedStrategy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Wand2, 
  Target, 
  AlertCircle, 
  CheckCircle,
  Globe,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { EnhancedStrategyWizard } from './EnhancedStrategyWizard';
import { CleanThesisConfiguration } from './CleanThesisConfiguration';

interface StrategyConfigurationManagerProps {
  fundId: string;
  fundName: string;
  fundType: 'vc' | 'pe';
}

export function StrategyConfigurationManager({ fundId, fundName, fundType }: StrategyConfigurationManagerProps) {
  console.log('=== STRATEGY CONFIGURATION MANAGER ===');
  console.log('Fund ID:', fundId);
  console.log('Fund Name:', fundName);
  
  const { strategy, loading, error, refreshStrategy } = useUnifiedStrategy(fundId);
  const [showWizard, setShowWizard] = useState(false);

  const handleWizardComplete = () => {
    setShowWizard(false);
    // Force refresh the strategy after configuration
    if (refreshStrategy) {
      refreshStrategy();
    }
  };

  const handleStrategySave = () => {
    // Refresh strategy data when saved from configuration
    if (refreshStrategy) {
      refreshStrategy();
    }
  };

  if (loading) {
    return (
      <CardContent className="py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Loading strategy configuration...</span>
        </div>
      </CardContent>
    );
  }

  if (error) {
    return (
      <CardContent className="py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </CardContent>
    );
  }

  // Show wizard if requested
  if (showWizard) {
    return (
      <div className="h-full">
        <EnhancedStrategyWizard
          fundId={fundId}
          fundName={fundName}
          fundType={fundType}
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
          existingStrategy={strategy}
        />
      </div>
    );
  }

  // Always show the advanced configuration directly
  // Create a default strategy object if none exists
  const strategyToEdit = strategy || {
    fund_id: fundId,
    industries: [],
    geography: [],
    key_signals: [],
    exciting_threshold: 85,
    promising_threshold: 70,
    needs_development_threshold: 50,
    strategy_notes: ''
  };

  return (
    <CleanThesisConfiguration
      strategy={strategyToEdit}
      onSave={handleStrategySave}
      onCancel={() => {}} // No cancel needed since this is the main view
      onLaunchWizard={() => setShowWizard(true)}
    />
  );
}