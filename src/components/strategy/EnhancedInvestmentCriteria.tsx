import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Brain,
  Users,
  Building2,
  Cpu,
  BarChart3,
  CreditCard,
  Crosshair,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { 
  InvestmentCriteria, 
  Subcategory, 
  TargetParameter,
  EnhancedInvestmentCriteriaProps,
  validateCriteriaWeights,
  validateTargetParameters,
  DEFAULT_INVESTMENT_CRITERIA,
  DEFAULT_TARGET_PARAMETERS
} from '@/types/investment-criteria';
import { toast } from 'sonner';
import { formatPercentage } from '@/lib/utils';

const ICON_MAP = {
  Users,
  Building2,
  Cpu,
  BarChart3,
  CreditCard,
  Crosshair
} as const;

export function EnhancedInvestmentCriteria({
  criteria: initialCriteria,
  targetParameters: initialTargetParameters = DEFAULT_TARGET_PARAMETERS,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onUpdateCriteria,
  onUpdateTargetParameters,
  isSaving
}: EnhancedInvestmentCriteriaProps) {
  const [criteria, setCriteria] = useState<InvestmentCriteria[]>(
    initialCriteria.length > 0 ? initialCriteria : DEFAULT_INVESTMENT_CRITERIA
  );
  const [targetParameters, setTargetParameters] = useState<TargetParameter[]>(initialTargetParameters);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [customSubcategoryModal, setCustomSubcategoryModal] = useState<{
    isOpen: boolean;
    categoryId: string;
    subcategory?: Subcategory;
  }>({ isOpen: false, categoryId: '' });
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryRequirements, setNewSubcategoryRequirements] = useState('');

  // Validation
  const criteriaValidation = useMemo(() => validateCriteriaWeights(criteria), [criteria]);
  const targetValidation = useMemo(() => validateTargetParameters(targetParameters), [targetParameters]);
  const totalWeight = useMemo(() => {
    const total = criteria.filter(c => c.enabled).reduce((sum, c) => sum + c.weight, 0);
    return Math.round(total * 10) / 10; // Round to 1 decimal place
  }, [criteria]);

  const handleCategoryWeightChange = (categoryId: string, weight: number) => {
    setCriteria(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, weight } : cat
    ));
  };

  const handleCategoryToggle = (categoryId: string, enabled: boolean) => {
    setCriteria(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, enabled } : cat
    ));
  };

  const handleSubcategoryWeightChange = (categoryId: string, subcategoryId: string, weight: number) => {
    setCriteria(prev => prev.map(cat => 
      cat.id === categoryId 
        ? {
            ...cat,
            subcategories: cat.subcategories.map(sub =>
              sub.id === subcategoryId ? { ...sub, weight } : sub
            )
          }
        : cat
    ));
  };

  const handleSubcategoryToggle = (categoryId: string, subcategoryId: string, enabled: boolean) => {
    setCriteria(prev => prev.map(cat => 
      cat.id === categoryId 
        ? {
            ...cat,
            subcategories: cat.subcategories.map(sub =>
              sub.id === subcategoryId ? { ...sub, enabled } : sub
            )
          }
        : cat
    ));
  };

  const handleTargetParameterWeightChange = (parameterId: string, weight: number) => {
    setTargetParameters(prev => prev.map(param =>
      param.id === parameterId ? { ...param, weight } : param
    ));
  };

  const handleTargetParameterToggle = (parameterId: string, enabled: boolean) => {
    setTargetParameters(prev => prev.map(param =>
      param.id === parameterId ? { ...param, enabled } : param
    ));
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleAddCustomSubcategory = () => {
    if (!newSubcategoryName.trim()) return;
    
    const newSubcategory: Subcategory = {
      id: `custom-${Date.now()}`,
      name: newSubcategoryName.trim(),
      weight: 25,
      enabled: true,
      requirements: newSubcategoryRequirements.trim(),
      isCustom: true
    };

    setCriteria(prev => prev.map(cat =>
      cat.id === customSubcategoryModal.categoryId
        ? { ...cat, subcategories: [...cat.subcategories, newSubcategory] }
        : cat
    ));

    setCustomSubcategoryModal({ isOpen: false, categoryId: '' });
    setNewSubcategoryName('');
    setNewSubcategoryRequirements('');
    toast.success('Custom subcategory added');
  };

  const handleDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    setCriteria(prev => prev.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId)
          }
        : cat
    ));
    toast.success('Subcategory removed');
  };

  const handleSave = () => {
    if (!criteriaValidation.isValid || !targetValidation.isValid) {
      toast.error('Please fix validation errors before saving');
      return;
    }
    
    onUpdateCriteria(criteria);
    if (onUpdateTargetParameters) {
      onUpdateTargetParameters(targetParameters);
    }
    onSave();
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP];
    return IconComponent || Brain;
  };

  const renderCategoryCard = (category: InvestmentCriteria) => {
    const isExpanded = expandedCategories.has(category.id);
    const IconComponent = getIconComponent(category.icon);
    const enabledSubcategories = category.subcategories.filter(s => s.enabled);
    const subcategoryTotal = Math.round(enabledSubcategories.reduce((sum, s) => sum + s.weight, 0) * 10) / 10;
    const subcategoryValid = enabledSubcategories.length === 0 || Math.abs(subcategoryTotal - 100) < 0.01;

    return (
      <Card key={category.id} className={`border transition-colors ${
        category.enabled ? 'border-primary/20 bg-primary/5' : 'border-muted bg-muted/50'
      }`}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleCategoryExpanded(category.id)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                    <IconComponent className={`h-5 w-5 ${category.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {category.name}
                      {category.enabled && (
                        <Badge variant="outline" className="text-xs">
                          {formatPercentage(category.weight, 0)}
                        </Badge>
                      )}
                      {!subcategoryValid && category.enabled && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {enabledSubcategories.length} subcategories • 
                      {subcategoryValid ? (
                        <span className="text-green-600 ml-1">Valid</span>
                      ) : (
                        <span className="text-destructive ml-1">Invalid ({formatPercentage(subcategoryTotal, 1)})</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <Switch
                      checked={category.enabled}
                      onCheckedChange={(enabled) => handleCategoryToggle(category.id, enabled)}
                    />
                  )}
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Weight Slider */}
              {isEditing && category.enabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Category Weight</Label>
                    <Badge variant="outline">{formatPercentage(category.weight, 0)}</Badge>
                  </div>
                  <Slider
                    value={[category.weight]}
                    onValueChange={([value]) => handleCategoryWeightChange(category.id, value)}
                    max={50}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5%</span>
                    <span>50%</span>
                  </div>
                </div>
              )}

              {/* Subcategories */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Subcategories</Label>
                  {isEditing && category.enabled && (
                    <Dialog 
                      open={customSubcategoryModal.isOpen && customSubcategoryModal.categoryId === category.id}
                      onOpenChange={(open) => setCustomSubcategoryModal(open ? { isOpen: true, categoryId: category.id } : { isOpen: false, categoryId: '' })}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Custom
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Custom Subcategory</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="subcategory-name">Subcategory Name</Label>
                            <Input
                              id="subcategory-name"
                              value={newSubcategoryName}
                              onChange={(e) => setNewSubcategoryName(e.target.value)}
                              placeholder="Enter subcategory name..."
                            />
                          </div>
                          <div>
                            <Label htmlFor="subcategory-requirements">Requirements</Label>
                            <Textarea
                              id="subcategory-requirements"
                              value={newSubcategoryRequirements}
                              onChange={(e) => setNewSubcategoryRequirements(e.target.value)}
                              placeholder="Describe the requirements for this subcategory..."
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleAddCustomSubcategory} disabled={!newSubcategoryName.trim()}>
                              Add Subcategory
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setCustomSubcategoryModal({ isOpen: false, categoryId: '' })}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.subcategories.map((subcategory) => (
                    <div 
                      key={subcategory.id}
                      className={`p-3 border rounded-lg transition-colors ${
                        subcategory.enabled ? 'border-primary/20 bg-background' : 'border-muted bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isEditing && category.enabled && (
                          <Switch
                            checked={subcategory.enabled}
                            onCheckedChange={(enabled) => handleSubcategoryToggle(category.id, subcategory.id, enabled)}
                          />
                          )}
                          <span className={`text-sm font-medium ${subcategory.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {subcategory.name}
                          </span>
                          {subcategory.isCustom && isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubcategory(category.id, subcategory.id)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {subcategory.enabled && (
                          <Badge variant="outline" className="text-xs">
                            {formatPercentage(subcategory.weight, 1)}
                          </Badge>
                        )}
                      </div>

                      {isEditing && subcategory.enabled && category.enabled && (
                        <div className="space-y-2">
                          <Slider
                            value={[subcategory.weight]}
                            onValueChange={([value]) => handleSubcategoryWeightChange(category.id, subcategory.id, value)}
                            max={50}
                            min={10}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>10%</span>
                            <span>50%</span>
                          </div>
                        </div>
                      )}

                      {subcategory.requirements && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {subcategory.requirements}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  const renderTargetParametersTab = () => {
    const sectorParams = targetParameters.filter(p => p.type === 'sector');
    const stageParams = targetParameters.filter(p => p.type === 'stage');
    const geographyParams = targetParameters.filter(p => p.type === 'geography');

    const renderParameterGroup = (params: TargetParameter[], title: string, type: string) => {
      const enabledParams = params.filter(p => p.enabled);
      const totalWeight = Math.round(enabledParams.reduce((sum, p) => sum + p.weight, 0) * 10) / 10;
      const isValid = enabledParams.length === 0 || Math.abs(totalWeight - 100) < 0.01;

      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              {title}
              <div className="flex items-center gap-2">
                {isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                <Badge variant={isValid ? "default" : "destructive"}>
                  {formatPercentage(totalWeight, 1)}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {params.map((param) => (
              <div key={param.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <Switch
                      checked={param.enabled}
                      onCheckedChange={(enabled) => handleTargetParameterToggle(param.id, enabled)}
                    />
                  )}
                  <span className={`text-sm ${param.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {param.name}
                  </span>
                </div>
                {param.enabled && (
                  <div className="flex items-center gap-2 min-w-[120px]">
                    {isEditing && (
                      <Slider
                        value={[param.weight]}
                        onValueChange={([value]) => handleTargetParameterWeightChange(param.id, value)}
                        max={60}
                        min={5}
                        step={5}
                        className="w-16"
                      />
                    )}
                    <Badge variant="outline" className="text-xs min-w-[40px]">
                      {formatPercentage(param.weight, 1)}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      );
    };

    return (
      <div className="space-y-6">
        {renderParameterGroup(sectorParams, 'Sectors', 'sector')}
        {renderParameterGroup(stageParams, 'Stages', 'stage')}
        {renderParameterGroup(geographyParams, 'Geographies', 'geography')}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Investment Criteria Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure weighted investment criteria and target parameters for deal evaluation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Weight Validation Badge */}
            <div className="flex items-center gap-2">
              <Badge variant={criteriaValidation.isValid ? "default" : "destructive"}>
                Total: {formatPercentage(totalWeight, 1)}
              </Badge>
              {criteriaValidation.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
            </div>
            
            {/* Action Buttons */}
            {isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={!criteriaValidation.isValid || !targetValidation.isValid || isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            ) : (
              <Button onClick={onEdit}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Criteria
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Category Weight Distribution</span>
            <span className={Math.abs(totalWeight - 100) < 0.01 ? 'text-green-600' : 'text-destructive'}>
              {formatPercentage(totalWeight, 1)}/100%
            </span>
          </div>
          <Progress value={totalWeight} className="h-2" />
        </div>

        {/* Validation Errors */}
        {(!criteriaValidation.isValid || !targetValidation.isValid) && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Validation Errors</span>
            </div>
            <ul className="text-sm text-destructive space-y-1">
              {criteriaValidation.errors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
              {targetValidation.errors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="criteria" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="criteria">Investment Criteria</TabsTrigger>
            <TabsTrigger value="parameters">Target Parameters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="criteria" className="space-y-4 mt-6">
            {criteria.map(renderCategoryCard)}
          </TabsContent>
          
          <TabsContent value="parameters" className="mt-6">
            {renderTargetParametersTab()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}