import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  DollarSign, 
  Globe,
  Save,
  BarChart3,
  Settings
} from 'lucide-react';
import { EnhancedStrategy } from '@/services/unifiedStrategyService';
import { useUnifiedStrategy } from '@/hooks/useUnifiedStrategy';
import { EnhancedCriteriaEditor } from './EnhancedCriteriaEditor';
import { getTemplateByFundType } from '@/types/vc-pe-criteria';

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
  const [criteriaEditing, setCriteriaEditing] = useState(false);
  const { updateStrategy, loading } = useUnifiedStrategy();

  // Get enhanced criteria or default template
  const enhancedCriteria = strategy.enhanced_criteria || 
    getTemplateByFundType(strategy.fund_type || 'vc');
  
  // Enhanced criteria display data from wizard
  const wizardCriteriaConfig = strategy.enhanced_criteria?.categories ? 
    strategy.enhanced_criteria.categories.filter((cat: any) => cat.enabled) : [];
  
  const hasDetailedCriteria = wizardCriteriaConfig.length > 0;

  const handleSave = async () => {
    console.log('=== HANDLING SAVE ===');
    console.log('Strategy object:', strategy);
    console.log('Strategy ID:', strategy.id);
    console.log('Edited strategy:', editedStrategy);
    
    if (strategy.id) {
      console.log('Updating existing strategy...');
      const result = await updateStrategy(editedStrategy);
      if (result) {
        onSave(); // Use the parent callback instead of forcing page reload
      }
    } else {
      console.log('No strategy ID found - strategy needs to be created first');
      // Strategy doesn't exist, inform user to use the wizard
      alert('No investment strategy found. Please use the "Configure Thesis" wizard to create your strategy first.');
    }
  };

  const updateField = (field: keyof EnhancedStrategy, value: any) => {
    setEditedStrategy(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview" className="gap-2">
          <Target className="h-4 w-4" />
          Strategy Overview
        </TabsTrigger>
        <TabsTrigger value="criteria" className="gap-2">
          <Settings className="h-4 w-4" />
          Investment Criteria
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-foreground">Investment Strategy</h2>
          <p className="text-sm text-muted-foreground mt-1">Define your investment criteria and focus areas</p>
        </div>
        <div className="flex gap-3">
          {onLaunchWizard && (
            <Button 
              onClick={onLaunchWizard}
              className="h-9 px-4 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Configure Thesis
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={handleSave}
            disabled={loading}
            className="h-9 px-4 text-sm gap-2"
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
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Target className="h-4 w-4 text-muted-foreground" />
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
                  className="mt-2 min-h-[120px] resize-none border-0 bg-muted/30"
                />
              </div>
            </CardContent>
          </Card>

          {/* Investment Parameters */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
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
                      className="pl-8 border-0 bg-muted/30"
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
                      className="pl-8 border-0 bg-muted/30"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Focus Areas */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">Target Industries</Label>
                {editedStrategy.industries && editedStrategy.industries.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {editedStrategy.industries.map((industry, i) => (
                      <Badge key={i} variant="outline" className="px-3 py-1 text-xs border-muted-foreground/20">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Use the Configure Thesis wizard to set industries</p>
                )}
              </div>
              
              <div className="border-t border-muted-foreground/10 pt-6">
                <Label className="text-sm font-medium mb-3 block">Target Geographies</Label>
                {editedStrategy.geography && editedStrategy.geography.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {editedStrategy.geography.map((geo, i) => (
                      <Badge key={i} variant="outline" className="px-3 py-1 text-xs border-muted-foreground/20">
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

          {/* Scoring Configuration */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Scoring Thresholds
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
                    className="mt-2 border-0 bg-muted/30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Deals scoring above this threshold are categorized as "Exciting"</p>
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
                    className="mt-2 border-0 bg-muted/30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Deals scoring above this threshold are categorized as "Promising"</p>
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
                    className="mt-2 border-0 bg-muted/30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Deals scoring above this threshold are categorized as "Needs Development"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Strategy Summary */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium">Strategy Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Industries</span>
                <Badge variant="outline" className="border-muted-foreground/20">{editedStrategy.industries?.length || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Geographies</span>
                <Badge variant="outline" className="border-muted-foreground/20">{editedStrategy.geography?.length || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Key Signals</span>
                <Badge variant="outline" className="border-muted-foreground/20">{editedStrategy.key_signals?.length || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Use the <strong>Configure Thesis</strong> wizard for a guided setup of all investment criteria and category weights.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </TabsContent>

      <TabsContent value="criteria" className="space-y-6">
        {hasDetailedCriteria ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Investment Criteria Configuration</h3>
                <p className="text-muted-foreground">
                  {strategy.fund_type?.toUpperCase() || 'VC'} criteria with detailed subcategory weights
                </p>
              </div>
              <Button variant="outline" onClick={onLaunchWizard}>
                <Settings className="h-4 w-4 mr-2" />
                Reconfigure
              </Button>
            </div>
            
            <div className="grid gap-4">
              {wizardCriteriaConfig.map((criterion: any, index: number) => (
                <Card key={index} className="overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <div>
                          <h4 className="font-medium">{criterion.name}</h4>
                          <p className="text-sm text-muted-foreground">{criterion.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="px-3 py-1">
                        {criterion.weight}%
                      </Badge>
                    </div>
                    
                    {/* Subcategories */}
                    {criterion.subcategories && criterion.subcategories.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-muted-foreground">Subcategories</Label>
                        <div className="grid gap-2">
                          {criterion.subcategories
                            .filter((sub: any) => sub.enabled)
                            .map((subcategory: any, subIndex: number) => (
                            <div key={subIndex} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div>
                                <h5 className="text-sm font-medium">{subcategory.name}</h5>
                                <p className="text-xs text-muted-foreground">{subcategory.requirements}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {subcategory.weight}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total Weight:</span>
                <span className={`font-semibold ${
                  wizardCriteriaConfig.reduce((sum: number, c: any) => sum + c.weight, 0) === 100 
                    ? 'text-success' : 'text-warning'
                }`}>
                  {wizardCriteriaConfig.reduce((sum: number, c: any) => sum + c.weight, 0)}%
                </span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Fund Type: <span className="font-medium">{strategy.fund_type?.toUpperCase() || 'VC'}</span> • 
                Categories: <span className="font-medium">{wizardCriteriaConfig.length}</span> • 
                Subcategories: <span className="font-medium">
                  {wizardCriteriaConfig.reduce((sum: number, c: any) => 
                    sum + (c.subcategories?.filter((sub: any) => sub.enabled)?.length || 0), 0
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Investment Criteria Configured</h3>
            <p className="text-muted-foreground mb-6">
              Use the strategy wizard to configure detailed investment criteria with subcategory weights
            </p>
            <Button onClick={onLaunchWizard}>
              <Settings className="h-4 w-4 mr-2" />
              Configure Investment Criteria
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}