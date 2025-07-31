import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Target, 
  Globe, 
  Sparkles, 
  Users, 
  Building, 
  Cpu, 
  BarChart3, 
  CreditCard, 
  Crosshair, 
  FileText, 
  PlayCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Plus,
  X
} from 'lucide-react';
import { useUnifiedStrategy } from '@/hooks/useUnifiedStrategy';
import { EnhancedWizardData, EnhancedStrategy } from '@/services/unifiedStrategyService';
import { DEFAULT_INVESTMENT_CRITERIA, InvestmentCriteria, validateCriteriaWeights } from '@/types/investment-criteria';
import { SECTOR_OPTIONS, STAGE_OPTIONS, GEOGRAPHY_OPTIONS } from '@/types/enhanced-strategy';
import { toast } from 'sonner';

interface StrategyQuickWizardProps {
  fundId: string;
  fundName: string;
  onComplete: () => void;
  onCancel: () => void;
  existingStrategy?: EnhancedStrategy | null;
}

const WIZARD_STEPS = [
  { id: 'basics', title: 'Fund Basics', icon: Target, description: 'Name, description, fund type' },
  { id: 'focus', title: 'Investment Focus', icon: Globe, description: 'Sectors, stages, geographies' },
  { id: 'signals', title: 'General Signals', icon: Sparkles, description: 'Positive signals and red flags' },
  { id: 'team', title: 'Team & Leadership', icon: Users, description: 'Category weight and criteria' },
  { id: 'market', title: 'Market Opportunity', icon: Building, description: 'Market-focused evaluation' },
  { id: 'product', title: 'Product & Technology', icon: Cpu, description: 'Technical assessment' },
  { id: 'traction', title: 'Business Traction', icon: BarChart3, description: 'Growth and performance' },
  { id: 'financial', title: 'Financial Health', icon: CreditCard, description: 'Financial evaluation' },
  { id: 'fit', title: 'Strategic Fit', icon: Crosshair, description: 'Fund alignment assessment' },
  { id: 'config', title: 'Deal Definition', icon: FileText, description: 'Scoring thresholds' },
  { id: 'review', title: 'Review & Activate', icon: PlayCircle, description: 'Final review and activation' }
];

export function StrategyQuickWizard({ 
  fundId, 
  fundName, 
  onComplete, 
  onCancel, 
  existingStrategy 
}: StrategyQuickWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [criteria, setCriteria] = useState<InvestmentCriteria[]>(DEFAULT_INVESTMENT_CRITERIA);
  const [wizardData, setWizardData] = useState<Partial<EnhancedWizardData>>({
    fundName: fundName,
    fundType: 'vc',
    strategyDescription: '',
    sectors: [],
    stages: [],
    geographies: [],
    checkSizeRange: { min: 500000, max: 5000000 },
    keySignals: [],
    dealThresholds: { exciting: 85, promising: 70, needs_development: 50 }
  });
  
  const { createStrategy, loading, getDefaultTemplate } = useUnifiedStrategy(fundId);

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 0 && !wizardData.fundName?.trim()) {
      toast.error('Please enter a fund name');
      return;
    }
    if (currentStep === 1 && (!wizardData.sectors?.length || !wizardData.stages?.length || !wizardData.geographies?.length)) {
      toast.error('Please select at least one option for sectors, stages, and geographies');
      return;
    }
    
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!wizardData.fundType) return;
    
    // Validate criteria weights
    const validation = validateCriteriaWeights(criteria);
    if (!validation.isValid) {
      toast.error('Please fix criteria weight validation errors before completing');
      return;
    }
    
    // Apply defaults from template and include criteria
    const template = getDefaultTemplate(wizardData.fundType);
    const completeData: EnhancedWizardData = {
      ...template,
      ...wizardData,
      fundName: wizardData.fundName || fundName,
      strategyDescription: wizardData.strategyDescription || `Investment strategy for ${fundName}`,
      // Convert criteria to the expected format
      teamLeadershipConfig: convertCriteriaToConfig(criteria.find(c => c.id === 'team-leadership')),
      marketOpportunityConfig: convertCriteriaToConfig(criteria.find(c => c.id === 'market-opportunity')),
      productTechnologyConfig: convertCriteriaToConfig(criteria.find(c => c.id === 'product-technology')),
      businessTractionConfig: convertCriteriaToConfig(criteria.find(c => c.id === 'business-traction')),
      financialHealthConfig: convertCriteriaToConfig(criteria.find(c => c.id === 'financial-health')),
      strategicFitConfig: convertCriteriaToConfig(criteria.find(c => c.id === 'strategic-fit'))
    } as EnhancedWizardData;

    const result = await createStrategy(wizardData.fundType, completeData);
    if (result) {
      onComplete();
    }
  };

  // Helper function to convert criteria to wizard format
  const convertCriteriaToConfig = (criteria?: InvestmentCriteria) => {
    if (!criteria) return { weight: 0, subcategories: {}, positiveSignals: [], negativeSignals: [] };
    
    const subcategories: Record<string, any> = {};
    criteria.subcategories.forEach(sub => {
      subcategories[sub.name] = {
        weight: sub.weight,
        enabled: sub.enabled,
        requirements: sub.requirements || ''
      };
    });
    
    return {
      weight: criteria.weight,
      subcategories,
      positiveSignals: criteria.positiveSignals || [],
      negativeSignals: criteria.negativeSignals || []
    };
  };

  const updateWizardData = (updates: Partial<EnhancedWizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const updateCriteria = (newCriteria: InvestmentCriteria[]) => {
    setCriteria(newCriteria);
  };

  const addItem = (field: 'sectors' | 'stages' | 'geographies', value: string) => {
    if (!value.trim()) return;
    const currentItems = wizardData[field] || [];
    if (!currentItems.includes(value)) {
      updateWizardData({ [field]: [...currentItems, value] });
    }
  };

  const removeItem = (field: 'sectors' | 'stages' | 'geographies', value: string) => {
    const currentItems = wizardData[field] || [];
    updateWizardData({ [field]: currentItems.filter(item => item !== value) });
  };

  const handleCategoryWeightChange = (categoryId: string, weight: number) => {
    setCriteria(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, weight } : cat
    ));
  };

  const step = WIZARD_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <StepIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Strategy Setup Wizard</h2>
            <p className="text-gray-600">Step {currentStep + 1} of {WIZARD_STEPS.length}: {step.title}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div 
          className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {WIZARD_STEPS.map((stepItem, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const StepIconItem = stepItem.icon;
          
          return (
            <button
              key={stepItem.id}
              onClick={() => setCurrentStep(index)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isCurrent 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                  : isCompleted
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              ) : (
                <StepIconItem className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{stepItem.title}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StepIcon className="h-5 w-5 text-emerald-600" />
            {step.title}
          </CardTitle>
          <p className="text-gray-600">{step.description}</p>
        </CardHeader>
        <CardContent>
          {/* Step Content */}
          {currentStep === 0 && (
            // Fund Basics
            <div className="space-y-6">
              <div>
                <Label htmlFor="fundName">Fund Name</Label>
                <Input
                  id="fundName"
                  value={wizardData.fundName || ''}
                  onChange={(e) => updateWizardData({ fundName: e.target.value })}
                  placeholder="Enter fund name..."
                />
              </div>
              <div>
                <Label htmlFor="description">Strategy Description</Label>
                <Textarea
                  id="description"
                  value={wizardData.strategyDescription || ''}
                  onChange={(e) => updateWizardData({ strategyDescription: e.target.value })}
                  placeholder="Describe your investment strategy and focus..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="checkSize">Check Size Range ($)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Minimum</Label>
                    <Input
                      type="number"
                      value={wizardData.checkSizeRange?.min || 0}
                      onChange={(e) => updateWizardData({ 
                        checkSizeRange: { 
                          ...wizardData.checkSizeRange, 
                          min: parseInt(e.target.value) || 0 
                        } 
                      })}
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Maximum</Label>
                    <Input
                      type="number"
                      value={wizardData.checkSizeRange?.max || 0}
                      onChange={(e) => updateWizardData({ 
                        checkSizeRange: { 
                          ...wizardData.checkSizeRange, 
                          max: parseInt(e.target.value) || 0 
                        } 
                      })}
                      placeholder="5000000"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            // Investment Focus
            <div className="space-y-6">
              {/* Sectors */}
              <div>
                <Label>Target Sectors</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {SECTOR_OPTIONS.map(sector => (
                    <Button
                      key={sector}
                      variant={wizardData.sectors?.includes(sector) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (wizardData.sectors?.includes(sector)) {
                          removeItem('sectors', sector);
                        } else {
                          addItem('sectors', sector);
                        }
                      }}
                    >
                      {sector}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {wizardData.sectors?.map(sector => (
                    <Badge key={sector} variant="secondary" className="gap-1">
                      {sector}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeItem('sectors', sector)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Stages */}
              <div>
                <Label>Investment Stages</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {STAGE_OPTIONS.map(stage => (
                    <Button
                      key={stage}
                      variant={wizardData.stages?.includes(stage) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (wizardData.stages?.includes(stage)) {
                          removeItem('stages', stage);
                        } else {
                          addItem('stages', stage);
                        }
                      }}
                    >
                      {stage}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {wizardData.stages?.map(stage => (
                    <Badge key={stage} variant="secondary" className="gap-1">
                      {stage}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeItem('stages', stage)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Geographies */}
              <div>
                <Label>Target Geographies</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {GEOGRAPHY_OPTIONS.map(geography => (
                    <Button
                      key={geography}
                      variant={wizardData.geographies?.includes(geography) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (wizardData.geographies?.includes(geography)) {
                          removeItem('geographies', geography);
                        } else {
                          addItem('geographies', geography);
                        }
                      }}
                    >
                      {geography}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {wizardData.geographies?.map(geography => (
                    <Badge key={geography} variant="secondary" className="gap-1">
                      {geography}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeItem('geographies', geography)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep >= 3 && currentStep <= 8 && (
            // Category Configuration Steps (Team, Market, Product, Traction, Financial, Strategic Fit)
            (() => {
              const categoryIndex = currentStep - 3;
              const category = criteria[categoryIndex];
              if (!category) return null;

              return (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                    <p className="text-muted-foreground">Configure the weight and importance of this category in your investment evaluation.</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label>Category Weight</Label>
                      <Badge variant="outline">{category.weight}%</Badge>
                    </div>
                    <Slider
                      value={[category.weight]}
                      onValueChange={([value]) => handleCategoryWeightChange(category.id, value)}
                      max={50}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>5%</span>
                      <span>50%</span>
                    </div>
                  </div>

                  <div>
                    <Label>Subcategories</Label>
                    <div className="grid grid-cols-1 gap-3 mt-2">
                      {category.subcategories.map((sub, index) => (
                        <div key={sub.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={sub.enabled}
                                onCheckedChange={(enabled) => {
                                  const newCriteria = [...criteria];
                                  newCriteria[categoryIndex].subcategories[index].enabled = enabled;
                                  setCriteria(newCriteria);
                                }}
                              />
                              <span className="font-medium">{sub.name}</span>
                            </div>
                            <Badge variant="outline">{sub.weight}%</Badge>
                          </div>
                          
                          {sub.enabled && (
                            <div className="space-y-2">
                              <Slider
                                value={[sub.weight]}
                                onValueChange={([value]) => {
                                  const newCriteria = [...criteria];
                                  newCriteria[categoryIndex].subcategories[index].weight = value;
                                  setCriteria(newCriteria);
                                }}
                                max={50}
                                min={10}
                                step={5}
                                className="w-full"
                              />
                              {sub.requirements && (
                                <p className="text-xs text-muted-foreground">{sub.requirements}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {currentStep === 9 && (
            // Deal Definition
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Deal Scoring Thresholds</h3>
                <p className="text-muted-foreground">Set the score thresholds that determine how deals are classified.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <Label className="text-green-800 font-medium">Exciting Deals</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={wizardData.dealThresholds?.exciting || 85}
                    onChange={(e) => updateWizardData({
                      dealThresholds: {
                        ...wizardData.dealThresholds,
                        exciting: parseInt(e.target.value) || 85
                      }
                    })}
                    className="mt-2"
                  />
                  <p className="text-xs text-green-700 mt-1">Scores above this threshold</p>
                </div>

                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <Label className="text-yellow-800 font-medium">Promising Deals</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={wizardData.dealThresholds?.promising || 70}
                    onChange={(e) => updateWizardData({
                      dealThresholds: {
                        ...wizardData.dealThresholds,
                        promising: parseInt(e.target.value) || 70
                      }
                    })}
                    className="mt-2"
                  />
                  <p className="text-xs text-yellow-700 mt-1">Scores above this threshold</p>
                </div>

                <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
                  <Label className="text-gray-800 font-medium">Needs Development</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={wizardData.dealThresholds?.needs_development || 50}
                    onChange={(e) => updateWizardData({
                      dealThresholds: {
                        ...wizardData.dealThresholds,
                        needs_development: parseInt(e.target.value) || 50
                      }
                    })}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-700 mt-1">Scores below this threshold</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 10 && (
            // Review & Activate
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-lg text-center">
                <PlayCircle className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Review Your Strategy</h3>
                <p className="text-gray-600">Your investment strategy is ready to be activated. Review the summary below.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Fund Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div><strong>Name:</strong> {wizardData.fundName}</div>
                      <div><strong>Type:</strong> {wizardData.fundType?.toUpperCase()}</div>
                      <div><strong>Check Size:</strong> ${(wizardData.checkSizeRange?.min || 0).toLocaleString()} - ${(wizardData.checkSizeRange?.max || 0).toLocaleString()}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Investment Focus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div><strong>Sectors:</strong> {wizardData.sectors?.length || 0} selected</div>
                      <div><strong>Stages:</strong> {wizardData.stages?.length || 0} selected</div>
                      <div><strong>Geographies:</strong> {wizardData.geographies?.length || 0} selected</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Category Weights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      {criteria.map(cat => (
                        <div key={cat.id} className="flex justify-between">
                          <span>{cat.name}</span>
                          <span>{cat.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Deal Thresholds</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Exciting:</span>
                        <span>{wizardData.dealThresholds?.exciting}+</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Promising:</span>
                        <span>{wizardData.dealThresholds?.promising}+</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Needs Development:</span>
                        <span>{'<'}{wizardData.dealThresholds?.needs_development}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Validation Summary */}
              {(() => {
                const validation = validateCriteriaWeights(criteria);
                const totalWeight = criteria.reduce((sum, cat) => sum + cat.weight, 0);
                
                return (
                  <div className={`p-4 rounded-lg border ${validation.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {validation.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
                        Validation Status: {validation.isValid ? 'Ready to Deploy' : 'Needs Attention'}
                      </span>
                    </div>
                    <div className={`text-sm ${validation.isValid ? 'text-green-700' : 'text-red-700'}`}>
                      Total Weight: {totalWeight}% (Target: 100%)
                    </div>
                    {!validation.isValid && (
                      <ul className="text-sm text-red-700 mt-2 space-y-1">
                        {validation.errors.map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Default placeholder for other steps */}
          {currentStep === 2 && (
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 mx-auto text-emerald-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">General Investment Signals</h3>
              <p className="text-gray-600 mb-4">This step will help you define positive and negative signals for deal evaluation.</p>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Coming Soon
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <div className="text-sm text-gray-500">
          Step {currentStep + 1} of {WIZARD_STEPS.length}
        </div>
        
        {currentStep === WIZARD_STEPS.length - 1 ? (
          <Button 
            onClick={handleComplete}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            {loading ? 'Creating...' : 'Complete Setup'}
            <PlayCircle className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleNext}
            className="gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}