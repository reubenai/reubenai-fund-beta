import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Heart, 
  Medal, 
  Rainbow,
  Globe,
  UserCheck,
  Plus,
  Minus
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FounderDiversityCriteria {
  enabled: boolean;
  weight: number;
  criteria: {
    women_led_companies: { enabled: boolean; weight: number; bonus_points: number };
    minority_led_companies: { enabled: boolean; weight: number; bonus_points: number };
    veteran_led_companies: { enabled: boolean; weight: number; bonus_points: number };
    lgbtq_led_companies: { enabled: boolean; weight: number; bonus_points: number };
    immigrant_entrepreneur_led: { enabled: boolean; weight: number; bonus_points: number };
    underrepresented_founders: { enabled: boolean; weight: number; bonus_points: number };
  };
  scoring_method: 'bonus' | 'weighted' | 'required';
  detection_keywords: Record<string, string[]>;
}

interface FounderDiversityConfigProps {
  criteria: FounderDiversityCriteria;
  onUpdate: (criteria: FounderDiversityCriteria) => void;
  isEditing: boolean;
}

const DIVERSITY_CATEGORIES = [
  {
    key: 'women_led_companies' as const,
    name: 'Women-Led Companies',
    icon: Heart,
    description: 'Companies with female founders or female CEOs',
    defaultWeight: 20,
    defaultBonus: 5
  },
  {
    key: 'minority_led_companies' as const,
    name: 'Minority-Led Companies',
    icon: Users,
    description: 'Companies led by ethnic or racial minority founders',
    defaultWeight: 20,
    defaultBonus: 5
  },
  {
    key: 'veteran_led_companies' as const,
    name: 'Veteran-Led Companies',
    icon: Medal,
    description: 'Companies founded or led by military veterans',
    defaultWeight: 15,
    defaultBonus: 3
  },
  {
    key: 'lgbtq_led_companies' as const,
    name: 'LGBTQ+-Led Companies',
    icon: Rainbow,
    description: 'Companies founded or led by LGBTQ+ entrepreneurs',
    defaultWeight: 15,
    defaultBonus: 3
  },
  {
    key: 'immigrant_entrepreneur_led' as const,
    name: 'Immigrant Entrepreneur-Led',
    icon: Globe,
    description: 'Companies founded by immigrant entrepreneurs',
    defaultWeight: 15,
    defaultBonus: 3
  },
  {
    key: 'underrepresented_founders' as const,
    name: 'Other Underrepresented Founders',
    icon: UserCheck,
    description: 'Companies with founders from other underrepresented groups',
    defaultWeight: 15,
    defaultBonus: 3
  }
];

export function FounderDiversityConfig({ criteria, onUpdate, isEditing }: FounderDiversityConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleEnabled = (enabled: boolean) => {
    onUpdate({
      ...criteria,
      enabled
    });
  };

  const handleWeightChange = (weight: number) => {
    onUpdate({
      ...criteria,
      weight: Math.max(0, Math.min(100, weight))
    });
  };

  const handleCriteriaToggle = (key: keyof typeof criteria.criteria, enabled: boolean) => {
    onUpdate({
      ...criteria,
      criteria: {
        ...criteria.criteria,
        [key]: {
          ...criteria.criteria[key],
          enabled
        }
      }
    });
  };

  const handleCriteriaWeightChange = (key: keyof typeof criteria.criteria, weight: number) => {
    onUpdate({
      ...criteria,
      criteria: {
        ...criteria.criteria,
        [key]: {
          ...criteria.criteria[key],
          weight: Math.max(0, Math.min(100, weight))
        }
      }
    });
  };

  const handleBonusPointsChange = (key: keyof typeof criteria.criteria, bonus_points: number) => {
    onUpdate({
      ...criteria,
      criteria: {
        ...criteria.criteria,
        [key]: {
          ...criteria.criteria[key],
          bonus_points: Math.max(0, Math.min(20, bonus_points))
        }
      }
    });
  };

  const handleScoringMethodChange = (method: 'bonus' | 'weighted' | 'required') => {
    onUpdate({
      ...criteria,
      scoring_method: method
    });
  };

  const enabledCriteriaCount = Object.values(criteria.criteria).filter(c => c.enabled).length;
  const totalWeight = Object.values(criteria.criteria)
    .filter(c => c.enabled)
    .reduce((sum, c) => sum + c.weight, 0);

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Founder Diversity Criteria</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure diversity-focused investment preferences and bonus scoring
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {criteria.enabled && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {enabledCriteriaCount} criteria enabled
                </Badge>
                <Badge variant="secondary">
                  {criteria.weight}% weight
                </Badge>
              </div>
            )}
            {isEditing && (
              <Switch
                checked={criteria.enabled}
                onCheckedChange={handleToggleEnabled}
              />
            )}
          </div>
        </div>
      </CardHeader>

      {criteria.enabled && (
        <CardContent className="space-y-6">
          {/* Overall Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Overall Weight (%)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={criteria.weight}
                  onChange={(e) => handleWeightChange(parseInt(e.target.value) || 0)}
                  className="w-full"
                />
              ) : (
                <div className="p-2 bg-muted rounded text-sm">{criteria.weight}%</div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Scoring Method</Label>
              {isEditing ? (
                <select
                  value={criteria.scoring_method}
                  onChange={(e) => handleScoringMethodChange(e.target.value as any)}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="bonus">Bonus Points</option>
                  <option value="weighted">Weighted Scoring</option>
                  <option value="required">Required Criteria</option>
                </select>
              ) : (
                <div className="p-2 bg-muted rounded text-sm capitalize">
                  {criteria.scoring_method.replace('_', ' ')}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Criteria Weights</Label>
              <div className="p-2 bg-muted rounded text-sm">
                {totalWeight}% total
                {totalWeight !== 100 && (
                  <span className="text-warning ml-1">
                    (should be 100%)
                  </span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Diversity Criteria */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Diversity Categories</h4>
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    {isExpanded ? 'Collapse' : 'Expand'} Details
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>

            <div className="grid gap-4">
              {DIVERSITY_CATEGORIES.map((category) => {
                const categoryData = criteria.criteria[category.key];
                const IconComponent = category.icon;

                return (
                  <Card key={category.key} className={`${categoryData.enabled ? 'ring-1 ring-primary/20' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-4 w-4 text-primary" />
                          <div>
                            <h5 className="font-medium">{category.name}</h5>
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                          </div>
                        </div>
                        {isEditing && (
                          <Switch
                            checked={categoryData.enabled}
                            onCheckedChange={(enabled) => handleCriteriaToggle(category.key, enabled)}
                          />
                        )}
                      </div>

                      {categoryData.enabled && (
                        <Collapsible open={isExpanded}>
                          <CollapsibleContent>
                            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                              <div className="space-y-2">
                                <Label className="text-xs">Weight (%)</Label>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={categoryData.weight}
                                    onChange={(e) => handleCriteriaWeightChange(category.key, parseInt(e.target.value) || 0)}
                                    className="h-8 text-sm"
                                  />
                                ) : (
                                  <div className="h-8 px-2 bg-muted rounded text-sm flex items-center">
                                    {categoryData.weight}%
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Bonus Points</Label>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={categoryData.bonus_points}
                                    onChange={(e) => handleBonusPointsChange(category.key, parseInt(e.target.value) || 0)}
                                    className="h-8 text-sm"
                                  />
                                ) : (
                                  <div className="h-8 px-2 bg-muted rounded text-sm flex items-center">
                                    +{categoryData.bonus_points} pts
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Validation Messages */}
          {enabledCriteriaCount > 0 && totalWeight !== 100 && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning-foreground">
                ⚠️ Criteria weights should total 100%. Currently: {totalWeight}%
              </p>
            </div>
          )}

          {criteria.scoring_method === 'required' && enabledCriteriaCount === 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive-foreground">
                ⚠️ Required scoring method needs at least one enabled criteria
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}