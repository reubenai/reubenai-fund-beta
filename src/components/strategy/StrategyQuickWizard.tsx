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
import { STANDARDIZED_SECTORS } from '@/constants/sectors';
import { STAGE_OPTIONS, GEOGRAPHY_OPTIONS } from '@/types/enhanced-strategy';
import { MultiSelect } from '@/components/ui/multi-select';
import { toast } from 'sonner';

interface StrategyQuickWizardProps {
  fundId: string;
  fundName: string;
  onComplete: () => void;
  onCancel: () => void;
  existingStrategy?: EnhancedStrategy | null;
}

const WIZARD_STEPS = [
  { id: 'basics', title: 'Fund Basics', icon: Target, description: 'Name, description, fund type', required: true },
  { id: 'focus', title: 'Investment Focus', icon: Globe, description: 'Sectors, stages, geographies', required: true },
  { id: 'signals', title: 'Investment Philosophy', icon: Sparkles, description: 'Core investment beliefs and approach', required: true },
  { id: 'team', title: 'Team & Leadership', icon: Users, description: 'Founder and team evaluation criteria', required: true },
  { id: 'market', title: 'Market Opportunity', icon: Building, description: 'Market analysis and timing factors', required: true },
  { id: 'product', title: 'Product & Technology', icon: Cpu, description: 'Technical assessment and innovation', required: true },
  { id: 'traction', title: 'Business Traction', icon: BarChart3, description: 'Growth metrics and performance', required: true },
  { id: 'financial', title: 'Financial Health', icon: CreditCard, description: 'Financial evaluation and sustainability', required: true },
  { id: 'fit', title: 'Strategic Fit', icon: Crosshair, description: 'Portfolio alignment and value creation', required: true },
  { id: 'research', title: 'Research Preferences', icon: FileText, description: 'Due diligence and research approach', required: false },
  { id: 'sourcing', title: 'Deal Sourcing', icon: Target, description: 'Deal flow and sourcing strategy', required: false },
  { id: 'config', title: 'Scoring & Thresholds', icon: BarChart3, description: 'AI scoring configuration', required: true },
  { id: 'review', title: 'Review & Activate', icon: PlayCircle, description: 'Final review and activation', required: false }
];

export function StrategyQuickWizard({ 
  fundId, 
  fundName, 
  onComplete, 
  onCancel, 
  existingStrategy 
}: StrategyQuickWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [criteria, setCriteria] = useState<InvestmentCriteria[]>(DEFAULT_INVESTMENT_CRITERIA);
  const [wizardData, setWizardData] = useState<Partial<EnhancedWizardData>>({
    fundName: fundName,
    fundType: 'vc',
    strategyDescription: '',
    investmentPhilosophy: '',
    sectors: [],
    stages: [],
    geographies: [],
    checkSizeRange: { min: 500000, max: 5000000 },
    keySignals: [],
    dealThresholds: { exciting: 85, promising: 70, needs_development: 50 },
    // Enhanced data for AI orchestrator
    researchApproach: {
      dueDiligenceDepth: 'standard',
      researchPriorities: [],
      informationSources: [],
      competitiveAnalysisFocus: []
    },
    dealSourcingStrategy: {
      sourcingChannels: [],
      networkLeveraging: '',
      targetCompanyProfiles: [],
      outreachStrategy: ''
    },
    decisionMakingProcess: {
      timelinePreferences: '',
      stakeholderInvolvement: '',
      riskTolerance: 'moderate'
    }
  });
  
  const { createStrategy, loading, getDefaultTemplate } = useUnifiedStrategy(fundId);

  const validateStep = (stepIndex: number): boolean => {
    const step = WIZARD_STEPS[stepIndex];
    if (!step.required) return true;

    switch (stepIndex) {
      case 0: // Fund Basics
        return !!(wizardData.fundName?.trim() && wizardData.strategyDescription?.trim());
      case 1: // Investment Focus
        return !!(wizardData.sectors?.length && wizardData.stages?.length && wizardData.geographies?.length);
      case 2: // Investment Philosophy
        return !!(wizardData.investmentPhilosophy?.trim());
      case 3: case 4: case 5: case 6: case 7: case 8: // Categories
        const categoryIndex = stepIndex - 3;
        const category = criteria[categoryIndex];
        return category?.weight > 0;
      case 11: // Scoring & Thresholds
        return !!(wizardData.dealThresholds?.exciting && wizardData.dealThresholds?.promising);
      default:
        return true;
    }
  };

  const handleNext = () => {
    // Validate current step before proceeding
    if (!validateStep(currentStep)) {
      const step = WIZARD_STEPS[currentStep];
      toast.error(`Please complete all required fields in ${step.title}`);
      return;
    }

    // Mark step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
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

      {/* Enhanced Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress: {completedSteps.size + (validateStep(currentStep) ? 1 : 0)} of {WIZARD_STEPS.filter(s => s.required).length} required steps</span>
          <span>{Math.round(((completedSteps.size + (validateStep(currentStep) ? 1 : 0)) / WIZARD_STEPS.length) * 100)}% complete</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500 relative overflow-hidden"
               style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
        
        {/* Progress indicators */}
        <div className="flex justify-between">
          {WIZARD_STEPS.map((_, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            const isValid = validateStep(index);
            
            return (
              <div key={index} className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-emerald-600' :
                isCurrent && isValid ? 'bg-emerald-400' :
                isCurrent ? 'bg-yellow-400' :
                'bg-slate-300'
              }`} />
            );
          })}
        </div>
      </div>

      {/* Step Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {WIZARD_STEPS.map((stepItem, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const isValid = validateStep(index);
          const StepIconItem = stepItem.icon;
          
          return (
            <button
              key={stepItem.id}
              onClick={() => setCurrentStep(index)}
              disabled={index > currentStep && !isCompleted}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                isCurrent 
                  ? isValid 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  : isCompleted
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  : index <= currentStep
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              ) : isCurrent && !isValid ? (
                <div className="h-4 w-4 rounded-full bg-yellow-400 animate-pulse" />
              ) : (
                <StepIconItem className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{stepItem.title}</span>
              {stepItem.required && !isCompleted && (
                <span className="text-xs text-red-500">*</span>
              )}
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
                <MultiSelect
                  options={STANDARDIZED_SECTORS}
                  value={wizardData.sectors || []}
                  onValueChange={(values) => updateWizardData({ sectors: values })}
                  placeholder="Select target sectors..."
                  className="mt-2"
                />
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

          {currentStep === 2 && (
            // Investment Philosophy
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Investment Philosophy & Approach</h3>
                <p className="text-muted-foreground">Define your core investment beliefs and approach that will guide the AI in deal evaluation and sourcing.</p>
              </div>

              <div>
                <Label htmlFor="philosophy">Investment Philosophy</Label>
                <Textarea
                  id="philosophy"
                  value={wizardData.investmentPhilosophy || ''}
                  onChange={(e) => updateWizardData({ investmentPhilosophy: e.target.value })}
                  placeholder="e.g., We believe in backing exceptional founders solving large market problems with innovative technology. We focus on capital-efficient businesses with strong unit economics and clear paths to scale. Our value-add approach includes hands-on support in go-to-market strategy, talent acquisition, and follow-on fundraising..."
                  rows={6}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will help the AI understand your investment approach and make decisions aligned with your philosophy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Risk Tolerance</Label>
                  <div className="flex gap-2 mt-2">
                    {['conservative', 'moderate', 'aggressive'].map(level => (
                      <Button
                        key={level}
                        variant={wizardData.decisionMakingProcess?.riskTolerance === level ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateWizardData({
                          decisionMakingProcess: {
                            ...wizardData.decisionMakingProcess,
                            riskTolerance: level as any
                          }
                        })}
                        className="capitalize"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Investment Horizon</Label>
                  <div className="flex gap-2 mt-2">
                    {['3-5 years', '5-7 years', '7+ years'].map(horizon => (
                      <Button
                        key={horizon}
                        variant={wizardData.decisionMakingProcess?.timelinePreferences === horizon ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateWizardData({
                          decisionMakingProcess: {
                            ...wizardData.decisionMakingProcess,
                            timelinePreferences: horizon
                          }
                        })}
                      >
                        {horizon}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
            {currentStep >= 3 && currentStep <= 8 && (
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
            // Research Preferences
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Research & Due Diligence Preferences</h3>
                <p className="text-muted-foreground">Configure how the AI should approach research, due diligence, and information gathering for deals.</p>
              </div>

              <div>
                <Label>Due Diligence Depth</Label>
                <div className="flex gap-2 mt-2">
                  {[
                    { value: 'light', label: 'Light', desc: 'Basic checks and high-level analysis' },
                    { value: 'standard', label: 'Standard', desc: 'Comprehensive analysis with key focus areas' },
                    { value: 'deep', label: 'Deep', desc: 'Exhaustive research with detailed investigation' }
                  ].map(option => (
                    <div key={option.value} className="flex-1">
                      <Button
                        variant={wizardData.researchApproach?.dueDiligenceDepth === option.value ? "default" : "outline"}
                        className="w-full h-auto p-3 flex-col gap-1"
                        onClick={() => updateWizardData({
                          researchApproach: {
                            ...wizardData.researchApproach,
                            dueDiligenceDepth: option.value as any
                          }
                        })}
                      >
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.desc}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Research Priorities (Select key areas to focus on)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {[
                    'Market Analysis', 'Competitive Intelligence', 'Financial Analysis',
                    'Technology Assessment', 'Team Background', 'Customer Validation',
                    'Regulatory Environment', 'IP & Legal', 'Operational Efficiency'
                  ].map(priority => (
                    <Button
                      key={priority}
                      variant={wizardData.researchApproach?.researchPriorities?.includes(priority) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const currentPriorities = wizardData.researchApproach?.researchPriorities || [];
                        const newPriorities = currentPriorities.includes(priority)
                          ? currentPriorities.filter(p => p !== priority)
                          : [...currentPriorities, priority];
                        
                        updateWizardData({
                          researchApproach: {
                            ...wizardData.researchApproach,
                            researchPriorities: newPriorities
                          }
                        });
                      }}
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Information Sources Preference</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {[
                    'Public Financial Data', 'Industry Reports', 'News & Media',
                    'Social Media Intelligence', 'Patent Databases', 'Regulatory Filings',
                    'Customer Reviews', 'Academic Research'
                  ].map(source => (
                    <Button
                      key={source}
                      variant={wizardData.researchApproach?.informationSources?.includes(source) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const currentSources = wizardData.researchApproach?.informationSources || [];
                        const newSources = currentSources.includes(source)
                          ? currentSources.filter(s => s !== source)
                          : [...currentSources, source];
                        
                        updateWizardData({
                          researchApproach: {
                            ...wizardData.researchApproach,
                            informationSources: newSources
                          }
                        });
                      }}
                    >
                      {source}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 10 && (
            // Deal Sourcing Strategy
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Deal Sourcing Strategy</h3>
                <p className="text-muted-foreground">Configure how the AI should identify, prioritize, and approach potential investment opportunities.</p>
              </div>

              <div>
                <Label>Preferred Sourcing Channels</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {[
                    'Venture Databases', 'Industry Networks', 'Accelerator Programs',
                    'University Partnerships', 'Industry Events', 'Warm Introductions',
                    'Direct Outreach', 'Social Media', 'News & Media Monitoring'
                  ].map(channel => (
                    <Button
                      key={channel}
                      variant={wizardData.dealSourcingStrategy?.sourcingChannels?.includes(channel) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const currentChannels = wizardData.dealSourcingStrategy?.sourcingChannels || [];
                        const newChannels = currentChannels.includes(channel)
                          ? currentChannels.filter(c => c !== channel)
                          : [...currentChannels, channel];
                        
                        updateWizardData({
                          dealSourcingStrategy: {
                            ...wizardData.dealSourcingStrategy,
                            sourcingChannels: newChannels
                          }
                        });
                      }}
                    >
                      {channel}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="networkLeveraging">Network Leveraging Strategy</Label>
                <Textarea
                  id="networkLeveraging"
                  value={wizardData.dealSourcingStrategy?.networkLeveraging || ''}
                  onChange={(e) => updateWizardData({
                    dealSourcingStrategy: {
                      ...wizardData.dealSourcingStrategy,
                      networkLeveraging: e.target.value
                    }
                  })}
                  placeholder="e.g., We leverage our network of enterprise CTOs and technical leaders at Fortune 500 companies for deal flow. Our LP base includes strategic corporate partners who provide warm introductions. We also work closely with top-tier accelerators like Techstars and Y Combinator for early-stage opportunities..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Target Company Profiles</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {[
                    'Fast Growing Startups', 'Bootstrapped Companies', 'Spin-offs',
                    'International Expansion', 'Distressed Assets', 'Platform Companies',
                    'Tech-Enabled Services', 'B2B SaaS', 'Marketplace Models'
                  ].map(profile => (
                    <Button
                      key={profile}
                      variant={wizardData.dealSourcingStrategy?.targetCompanyProfiles?.includes(profile) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const currentProfiles = wizardData.dealSourcingStrategy?.targetCompanyProfiles || [];
                        const newProfiles = currentProfiles.includes(profile)
                          ? currentProfiles.filter(p => p !== profile)
                          : [...currentProfiles, profile];
                        
                        updateWizardData({
                          dealSourcingStrategy: {
                            ...wizardData.dealSourcingStrategy,
                            targetCompanyProfiles: newProfiles
                          }
                        });
                      }}
                    >
                      {profile}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 11 && (
            // Deal Definition
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Scoring Thresholds</h3>
                <p className="text-muted-foreground">Set the score thresholds that determine how deals are classified as Exciting, Promising, or Needs Development in your pipeline.</p>
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

          {currentStep === 12 && (
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

              {/* Enhanced validation summary with richer data */}
              {(() => {
                const validation = validateCriteriaWeights(criteria);
                const totalWeight = criteria.reduce((sum, cat) => sum + cat.weight, 0);
                const hasPhilosophy = !!wizardData.investmentPhilosophy?.trim();
                const hasResearchPrefs = !!wizardData.researchApproach?.dueDiligenceDepth;
                const hasSourcingStrategy = !!wizardData.dealSourcingStrategy?.sourcingChannels?.length;
                
                return (
                  <div className="space-y-4">
                    {/* Core Strategy Validation */}
                    <div className={`p-4 rounded-lg border ${validation.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {validation.isValid ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`font-medium ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
                          Core Strategy: {validation.isValid ? 'Ready' : 'Needs Attention'}
                        </span>
                      </div>
                      <div className={`text-sm ${validation.isValid ? 'text-green-700' : 'text-red-700'}`}>
                        Category Weight Total: {totalWeight}% (Target: 100%)
                      </div>
                      {!validation.isValid && (
                        <ul className="text-sm text-red-700 mt-2 space-y-1">
                          {validation.errors.map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* AI Readiness Assessment */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className={`p-3 rounded border ${hasPhilosophy ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {hasPhilosophy ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-yellow-400" />
                          )}
                          <span className="text-sm font-medium">Investment Philosophy</span>
                        </div>
                        <p className={`text-xs ${hasPhilosophy ? 'text-green-700' : 'text-yellow-700'}`}>
                          {hasPhilosophy ? 'Configured for AI guidance' : 'Optional but recommended'}
                        </p>
                      </div>

                      <div className={`p-3 rounded border ${hasResearchPrefs ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {hasResearchPrefs ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-yellow-400" />
                          )}
                          <span className="text-sm font-medium">Research Preferences</span>
                        </div>
                        <p className={`text-xs ${hasResearchPrefs ? 'text-green-700' : 'text-yellow-700'}`}>
                          {hasResearchPrefs ? 'AI research configured' : 'Optional configuration'}
                        </p>
                      </div>

                      <div className={`p-3 rounded border ${hasSourcingStrategy ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {hasSourcingStrategy ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-yellow-400" />
                          )}
                          <span className="text-sm font-medium">Deal Sourcing</span>
                        </div>
                        <p className={`text-xs ${hasSourcingStrategy ? 'text-green-700' : 'text-yellow-700'}`}>
                          {hasSourcingStrategy ? 'AI sourcing enabled' : 'Optional configuration'}
                        </p>
                      </div>
                    </div>

                    {/* AI Capabilities Summary */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">🤖 Reuben AI Orchestrator Capabilities</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                        <div>✓ Automated deal scoring & ranking</div>
                        <div>✓ Intelligent deal sourcing</div>
                        <div>✓ Comprehensive market research</div>
                        <div>✓ IC memo generation</div>
                        <div>✓ Competitive analysis</div>
                        <div>✓ Risk assessment</div>
                        <div>✓ Portfolio fit analysis</div>
                        <div>✓ Due diligence automation</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Default placeholder for signals step */}
          {false && (
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