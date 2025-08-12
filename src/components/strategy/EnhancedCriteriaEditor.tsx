import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users,
  Building2,
  Cpu,
  BarChart3,
  CreditCard,
  Crosshair,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { 
  EnhancedCriteriaTemplate, 
  EnhancedCriteriaCategory, 
  EnhancedSubcategory,
  validateCriteriaWeights
} from '@/types/vc-pe-criteria';
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

interface EnhancedCriteriaEditorProps {
  criteria: EnhancedCriteriaTemplate;
  isEditing: boolean;
  onSave: (criteria: EnhancedCriteriaTemplate) => void;
  onCancel: () => void;
  onEdit: () => void;
  isSaving?: boolean;
}

export function EnhancedCriteriaEditor({
  criteria: initialCriteria,
  isEditing,
  onSave,
  onCancel,
  onEdit,
  isSaving = false
}: EnhancedCriteriaEditorProps) {
  const [criteria, setCriteria] = useState<EnhancedCriteriaTemplate>(initialCriteria);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Validation
  const validation = useMemo(() => validateCriteriaWeights(criteria), [criteria]);
  const totalWeight = useMemo(() => {
    const total = criteria.categories.filter(c => c.enabled).reduce((sum, c) => sum + c.weight, 0);
    return Math.round(total * 10) / 10; // Round to 1 decimal place
  }, [criteria.categories]);

  const handleCategoryWeightChange = (categoryName: string, weight: number) => {
    setCriteria(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.name === categoryName ? { ...cat, weight } : cat
      )
    }));
  };

  const handleCategoryToggle = (categoryName: string, enabled: boolean) => {
    setCriteria(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.name === categoryName ? { ...cat, enabled } : cat
      )
    }));
  };

  const handleSubcategoryWeightChange = (categoryName: string, subcategoryName: string, weight: number) => {
    setCriteria(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.name === categoryName 
          ? {
              ...cat,
              subcategories: cat.subcategories.map(sub =>
                sub.name === subcategoryName ? { ...sub, weight } : sub
              )
            }
          : cat
      )
    }));
  };

  const handleSubcategoryToggle = (categoryName: string, subcategoryName: string, enabled: boolean) => {
    setCriteria(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.name === categoryName 
          ? {
              ...cat,
              subcategories: cat.subcategories.map(sub =>
                sub.name === subcategoryName ? { ...sub, enabled } : sub
              )
            }
          : cat
      )
    }));
  };

  const toggleCategoryExpanded = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    if (!validation.isValid) {
      toast.error('Please fix validation errors before saving');
      return;
    }
    
    onSave(criteria);
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP];
    return IconComponent || Users;
  };

  const renderCategoryCard = (category: EnhancedCriteriaCategory) => {
    const isExpanded = expandedCategories.has(category.name);
    const IconComponent = getIconComponent(category.icon);
    const enabledSubcategories = category.subcategories.filter(s => s.enabled);
    const subcategoryTotal = enabledSubcategories.reduce((sum, s) => sum + s.weight, 0);
    const subcategoryValid = enabledSubcategories.length === 0 || Math.abs(subcategoryTotal - 100) < 0.1;

    return (
      <Card key={category.name} className={`border transition-colors ${
        category.enabled ? 'border-primary/20 bg-primary/5' : 'border-muted bg-muted/50'
      }`}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleCategoryExpanded(category.name)}>
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
                        <span className="text-destructive ml-1">Invalid ({subcategoryTotal}%)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <Switch
                      checked={category.enabled}
                      onCheckedChange={(enabled) => handleCategoryToggle(category.name, enabled)}
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
                    onValueChange={([value]) => handleCategoryWeightChange(category.name, value)}
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

              {/* Category Description */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>

              {/* Subcategories */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Subcategories</Label>
                
                <div className="grid grid-cols-1 gap-3">
                  {category.subcategories.map((subcategory) => (
                    <div 
                      key={subcategory.name}
                      className={`p-3 border rounded-lg transition-colors ${
                        subcategory.enabled ? 'border-primary/20 bg-background' : 'border-muted bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isEditing && category.enabled && (
                            <Switch
                              checked={subcategory.enabled}
                              onCheckedChange={(enabled) => handleSubcategoryToggle(category.name, subcategory.name, enabled)}
                            />
                          )}
                          <span className={`text-sm font-medium ${subcategory.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {subcategory.name}
                          </span>
                        </div>
                        {subcategory.enabled && (
                          <Badge variant="outline" className="text-xs">
                            {formatPercentage(subcategory.weight, 0)}
                          </Badge>
                        )}
                      </div>

                      {isEditing && subcategory.enabled && category.enabled && (
                        <div className="space-y-2 mb-2">
                          <Slider
                            value={[subcategory.weight]}
                            onValueChange={([value]) => handleSubcategoryWeightChange(category.name, subcategory.name, value)}
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
                        <p className="text-xs text-muted-foreground">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Investment Criteria</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure category weights and subcategory settings for {criteria.fundType.toUpperCase()} investments
          </p>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="h-9 px-4 text-sm gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving || !validation.isValid}
                className="h-9 px-4 text-sm gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button 
              onClick={onEdit}
              className="h-9 px-4 text-sm"
            >
              Edit Weights
            </Button>
          )}
        </div>
      </div>

      {/* Validation Status */}
      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
        <div className="flex items-center gap-2">
          {validation.isValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
          <span className="text-sm font-medium">
            Total Weight: {formatPercentage(totalWeight, 0)}
          </span>
        </div>
        <Progress value={totalWeight} className="w-32" />
      </div>

      {/* Validation Errors */}
      {!validation.isValid && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="space-y-2">
              {validation.errors.map((error, index) => (
                <p key={index} className="text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  {error}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Cards */}
      <div className="space-y-4">
        {criteria.categories.map(renderCategoryCard)}
      </div>
    </div>
  );
}