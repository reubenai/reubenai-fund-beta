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
import { StrategyQuickWizard } from './StrategyQuickWizard';
import { CleanThesisConfiguration } from './CleanThesisConfiguration';

interface StrategyConfigurationManagerProps {
  fundId: string;
  fundName: string;
}

export function StrategyConfigurationManager({ fundId, fundName }: StrategyConfigurationManagerProps) {
  console.log('=== STRATEGY CONFIGURATION MANAGER ===');
  console.log('Fund ID:', fundId);
  console.log('Fund Name:', fundName);
  
  const { strategy, loading, error } = useUnifiedStrategy(fundId);
  const [showWizard, setShowWizard] = useState(false);

  const handleWizardComplete = () => {
    setShowWizard(false);
    // Strategy will be reloaded by the hook
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
      <StrategyQuickWizard
        fundId={fundId}
        fundName={fundName}
        onComplete={handleWizardComplete}
        onCancel={() => setShowWizard(false)}
        existingStrategy={strategy}
      />
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
      onSave={() => {}} // Handle save within the component
      onCancel={() => {}} // No cancel needed since this is the main view
      onLaunchWizard={() => setShowWizard(true)}
    />
  );
}