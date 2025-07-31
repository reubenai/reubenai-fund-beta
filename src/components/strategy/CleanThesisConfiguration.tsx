import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  DollarSign, 
  Globe,
  Settings,
  Save,
  BarChart3
} from 'lucide-react';
import { EnhancedStrategy } from '@/services/unifiedStrategyService';
import { useUnifiedStrategy } from '@/hooks/useUnifiedStrategy';

interface CleanThesisConfigurationProps {
  strategy: EnhancedStrategy;
  onSave: () => void;
  onCancel: () => void;
  onLaunchWizard?: () => void;
}

export function CleanThesisConfiguration({ 
  strategy, 
  onSave, 
  onCancel,
  onLaunchWizard
}: CleanThesisConfigurationProps) {
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Investment Strategy</h2>
          <p className="text-muted-foreground mt-1">Define your investment criteria and focus areas</p>
        </div>
        <div className="flex gap-3">
          {onLaunchWizard && (
            <Button 
              variant="outline" 
              onClick={onLaunchWizard}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Configure Thesis
            </Button>
          )}
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Strategy Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                Strategy Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="strategy-description" className="text-sm font-medium">
                  Investment Thesis
                </Label>
                <Textarea
                  id="strategy-description"
                  value={editedStrategy.strategy_notes || ''}
                  onChange={(e) => updateField('strategy_notes', e.target.value)}
                  placeholder="Describe your investment thesis and strategy focus..."
                  className="mt-2 min-h-[120px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Investment Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Investment Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="min-investment" className="text-sm font-medium">
                    Minimum Investment
                  </Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="min-investment"
                      type="number"
                      value={editedStrategy.min_investment_amount || 0}
                      onChange={(e) => updateField('min_investment_amount', parseInt(e.target.value))}
                      placeholder="500,000"
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="max-investment" className="text-sm font-medium">
                    Maximum Investment
                  </Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="max-investment"
                      type="number"
                      value={editedStrategy.max_investment_amount || 0}
                      onChange={(e) => updateField('max_investment_amount', parseInt(e.target.value))}
                      placeholder="5,000,000"
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Focus Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5" />
                Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">Target Industries</Label>
                {editedStrategy.industries && editedStrategy.industries.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {editedStrategy.industries.map((industry, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Use the Configure Thesis wizard to set industries</p>
                )}
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium mb-3 block">Target Geographies</Label>
                {editedStrategy.geography && editedStrategy.geography.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {editedStrategy.geography.map((geo, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1">
                        {geo}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Use the Configure Thesis wizard to set geographies</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Scoring Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                AI Scoring Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="exciting-threshold" className="text-sm font-medium">
                    Exciting
                  </Label>
                  <Input
                    id="exciting-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={editedStrategy.exciting_threshold || 85}
                    onChange={(e) => updateField('exciting_threshold', parseInt(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Score threshold for exciting deals</p>
                </div>
                <div>
                  <Label htmlFor="promising-threshold" className="text-sm font-medium">
                    Promising
                  </Label>
                  <Input
                    id="promising-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={editedStrategy.promising_threshold || 70}
                    onChange={(e) => updateField('promising_threshold', parseInt(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Score threshold for promising deals</p>
                </div>
                <div>
                  <Label htmlFor="needs-development-threshold" className="text-sm font-medium">
                    Needs Development
                  </Label>
                  <Input
                    id="needs-development-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={editedStrategy.needs_development_threshold || 50}
                    onChange={(e) => updateField('needs_development_threshold', parseInt(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Score threshold for deals needing work</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Strategy Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strategy Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Industries</span>
                <Badge variant="outline">{editedStrategy.industries?.length || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Geographies</span>
                <Badge variant="outline">{editedStrategy.geography?.length || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Key Signals</span>
                <Badge variant="outline">{editedStrategy.key_signals?.length || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Use the <strong>Configure Thesis</strong> wizard for a guided setup of all investment criteria and category weights.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}