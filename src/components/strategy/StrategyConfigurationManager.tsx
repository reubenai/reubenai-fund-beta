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
import { EnhancedThesisConfiguration } from './EnhancedThesisConfiguration';

interface StrategyConfigurationManagerProps {
  fundId: string;
  fundName: string;
}

export function StrategyConfigurationManager({ fundId, fundName }: StrategyConfigurationManagerProps) {
  const { strategy, loading, error } = useUnifiedStrategy(fundId);
  const [showWizard, setShowWizard] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleWizardComplete = () => {
    setShowWizard(false);
    // Strategy will be reloaded by the hook
  };

  const handleAdvancedEdit = () => {
    setShowAdvanced(true);
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

  // Show advanced configuration if requested
  if (showAdvanced && strategy) {
    return (
      <EnhancedThesisConfiguration
        strategy={strategy}
        onSave={() => setShowAdvanced(false)}
        onCancel={() => setShowAdvanced(false)}
      />
    );
  }

  // No strategy exists - show creation options
  if (!strategy) {
    return (
      <CardContent className="py-12">
        <div className="text-center max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <Target className="h-16 w-16 mx-auto text-emerald-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Define Your Investment Strategy</h2>
            <p className="text-gray-600 text-lg">
              Set up your investment criteria, focus areas, and evaluation parameters for <span className="font-medium text-emerald-600">{fundName}</span>
            </p>
          </div>

          {/* Feature Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
            <div className="p-6 border border-slate-200 rounded-lg bg-gradient-to-br from-emerald-50 to-white">
              <Globe className="h-8 w-8 text-emerald-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Investment Focus</h3>
              <p className="text-sm text-gray-600">Define target sectors, stages, and geographies for your investment strategy</p>
            </div>
            <div className="p-6 border border-slate-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
              <BarChart3 className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Evaluation Criteria</h3>
              <p className="text-sm text-gray-600">Configure scoring parameters and category weights for deal analysis</p>
            </div>
            <div className="p-6 border border-slate-200 rounded-lg bg-gradient-to-br from-purple-50 to-white">
              <Wand2 className="h-8 w-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">AI Integration</h3>
              <p className="text-sm text-gray-600">Enable automated deal scoring and intelligent analysis workflows</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => setShowWizard(true)}
              size="lg" 
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-3 gap-3"
            >
              <Wand2 className="h-5 w-5" />
              Quick Setup Wizard
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-8 py-3 gap-3"
              onClick={handleAdvancedEdit}
            >
              <Settings className="h-5 w-5" />
              Advanced Configuration
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
            <strong>Recommendation:</strong> Use the Quick Setup Wizard for a guided experience that configures your strategy in 11 simple steps, 
            or choose Advanced Configuration for detailed manual setup.
          </div>
        </div>
      </CardContent>
    );
  }

  // Strategy exists - show overview and management options
  return (
    <CardContent className="p-6">
      <div className="space-y-6">
        {/* Header with status */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Active Investment Strategy
            </h2>
            <p className="text-gray-600 mt-1">{strategy.description || 'No description provided'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAdvancedEdit}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Edit Strategy
            </Button>
          </div>
        </div>

        {/* Strategy Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Investment Focus */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-600" />
                Investment Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Sectors</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {strategy.industries?.slice(0, 2).map((sector, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{sector}</Badge>
                  ))}
                  {(strategy.industries?.length || 0) > 2 && (
                    <Badge variant="outline" className="text-xs">+{(strategy.industries?.length || 0) - 2} more</Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Geographies</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {strategy.geography?.slice(0, 2).map((geo, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{geo}</Badge>
                  ))}
                  {(strategy.geography?.length || 0) > 2 && (
                    <Badge variant="outline" className="text-xs">+{(strategy.geography?.length || 0) - 2} more</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Size */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                Check Size
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg font-semibold text-gray-900">
                ${strategy.min_investment_amount ? (strategy.min_investment_amount / 1000000).toFixed(1) : '0'}M - 
                ${strategy.max_investment_amount ? (strategy.max_investment_amount / 1000000).toFixed(1) : '∞'}M
              </div>
              <p className="text-xs text-gray-500 mt-1">Investment range</p>
            </CardContent>
          </Card>

          {/* AI Scoring Thresholds */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                Scoring Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Exciting</span>
                <Badge className="bg-emerald-100 text-emerald-800 text-xs">{strategy.exciting_threshold || 85}+</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Promising</span>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">{strategy.promising_threshold || 70}+</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Needs Work</span>
                <Badge className="bg-red-100 text-red-800 text-xs">{'<'}{strategy.needs_development_threshold || 50}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Key Signals */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" />
                Key Signals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-gray-600">
                {strategy.key_signals?.length ? (
                  <div>
                    <span className="font-medium">{strategy.key_signals.length}</span> configured signals
                  </div>
                ) : (
                  <span className="text-gray-400">No signals configured</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button 
            onClick={() => setShowWizard(true)}
            variant="outline"
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Reconfigure with Wizard
          </Button>
          <Button 
            onClick={handleAdvancedEdit}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <Settings className="h-4 w-4" />
            Advanced Settings
          </Button>
        </div>
      </div>
    </CardContent>
  );
}