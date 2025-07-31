import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Target, 
  DollarSign, 
  Globe,
  Building,
  BarChart3,
  Users,
  CheckCircle,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { EnhancedStrategy } from '@/services/unifiedStrategyService';
import { useUnifiedStrategy } from '@/hooks/useUnifiedStrategy';

interface EnhancedThesisConfigurationProps {
  strategy: EnhancedStrategy;
  onSave: () => void;
  onCancel: () => void;
}

export function EnhancedThesisConfiguration({ 
  strategy, 
  onSave, 
  onCancel 
}: EnhancedThesisConfigurationProps) {
  const [editedStrategy, setEditedStrategy] = useState<Partial<EnhancedStrategy>>(strategy);
  const { updateStrategy, loading } = useUnifiedStrategy();

  const handleSave = async () => {
    if (strategy.id) {
      const result = await updateStrategy(editedStrategy);
      if (result) {
        onSave();
      }
    }
  };

  const updateField = (field: keyof EnhancedStrategy, value: any) => {
    setEditedStrategy(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Settings className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Advanced Strategy Configuration</h2>
            <p className="text-gray-600">Detailed customization of your investment strategy</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                Strategy Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Strategy Description
                </label>
                <Textarea
                  value={editedStrategy.strategy_notes || ''}
                  onChange={(e) => updateField('strategy_notes', e.target.value)}
                  placeholder="Describe your investment thesis and strategy..."
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Investment Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Minimum Investment ($)
                  </label>
                  <Input
                    type="number"
                    value={editedStrategy.min_investment_amount || 0}
                    onChange={(e) => updateField('min_investment_amount', parseInt(e.target.value))}
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Maximum Investment ($)
                  </label>
                  <Input
                    type="number"
                    value={editedStrategy.max_investment_amount || 0}
                    onChange={(e) => updateField('max_investment_amount', parseInt(e.target.value))}
                    placeholder="5000000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-600" />
                Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Target Industries
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editedStrategy.industries?.map((industry, i) => (
                    <Badge key={i} variant="outline" className="text-emerald-700 border-emerald-200">
                      {industry}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Industries will be configurable in the wizard</p>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Target Geographies
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editedStrategy.geography?.map((geo, i) => (
                    <Badge key={i} variant="outline" className="text-blue-700 border-blue-200">
                      {geo}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Geographies will be configurable in the wizard</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                AI Scoring Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Exciting Threshold
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editedStrategy.exciting_threshold || 85}
                    onChange={(e) => updateField('exciting_threshold', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Scores above this are "Exciting"</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Promising Threshold
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editedStrategy.promising_threshold || 70}
                    onChange={(e) => updateField('promising_threshold', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Scores above this are "Promising"</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Needs Development
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editedStrategy.needs_development_threshold || 50}
                    onChange={(e) => updateField('needs_development_threshold', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Scores below this need work</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Validation Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Validation Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-gray-600">Strategy description provided</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-gray-600">Investment range configured</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-gray-600">Scoring thresholds set</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-600" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Industries:</span>
                <Badge variant="outline">{editedStrategy.industries?.length || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Geographies:</span>
                <Badge variant="outline">{editedStrategy.geography?.length || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Key Signals:</span>
                <Badge variant="outline">{editedStrategy.key_signals?.length || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
            <strong>Tip:</strong> Use the Quick Setup Wizard for a guided experience to configure 
            all evaluation criteria and category weights.
          </div>
        </div>
      </div>
    </div>
  );
}