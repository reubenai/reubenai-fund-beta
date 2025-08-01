import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Target, 
  Globe, 
  Sparkles, 
  Settings,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  X
} from 'lucide-react';
import { useUnifiedStrategy } from '@/hooks/useUnifiedStrategy';
import { EnhancedWizardData, EnhancedStrategy } from '@/services/unifiedStrategyService';
import { DEFAULT_INVESTMENT_CRITERIA, InvestmentCriteria, validateCriteriaWeights } from '@/types/investment-criteria';
import { SECTOR_OPTIONS, STAGE_OPTIONS } from '@/types/enhanced-strategy';
import { toast } from 'sonner';

interface EnhancedStrategyWizardProps {
  fundId: string;
  fundName: string;
  onComplete: () => void;
  onCancel: () => void;
  existingStrategy?: EnhancedStrategy | null;
}

// Geographic regions with hierarchical structure
const GEOGRAPHIC_REGIONS = {
  'North America': {
    countries: ['United States', 'Canada', 'Mexico'],
    jurisdictions: {
      'United States': ['California', 'New York', 'Texas', 'Florida', 'Massachusetts', 'Washington'],
      'Canada': ['Ontario', 'British Columbia', 'Quebec', 'Alberta'],
      'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey']
    }
  },
  'Europe': {
    countries: ['United Kingdom', 'Germany', 'France', 'Netherlands', 'Sweden', 'Switzerland', 'Spain', 'Italy'],
    jurisdictions: {
      'United Kingdom': ['England', 'Scotland', 'Wales'],
      'Germany': ['Bavaria', 'Berlin', 'Baden-Württemberg'],
      'France': ['Île-de-France', 'Provence-Alpes-Côte d\'Azur']
    }
  },
  'Asia Pacific': {
    countries: ['Singapore', 'Australia', 'Japan', 'South Korea', 'China', 'India', 'Hong Kong'],
    jurisdictions: {
      'Australia': ['New South Wales', 'Victoria', 'Queensland'],
      'China': ['Beijing', 'Shanghai', 'Shenzhen'],
      'India': ['Karnataka', 'Maharashtra', 'Delhi']
    }
  },
  'Latin America': {
    countries: ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru'],
    jurisdictions: {
      'Brazil': ['São Paulo', 'Rio de Janeiro', 'Minas Gerais'],
      'Argentina': ['Buenos Aires', 'Córdoba']
    }
  },
  'Middle East & Africa': {
    countries: ['Israel', 'UAE', 'South Africa', 'Kenya', 'Nigeria'],
    jurisdictions: {
      'UAE': ['Dubai', 'Abu Dhabi'],
      'South Africa': ['Western Cape', 'Gauteng']
    }
  }
};

// Streamlined 6-step wizard
const WIZARD_STEPS = [
  { id: 'basics', title: 'Fund Basics', icon: Target, description: 'Core fund information and strategy overview' },
  { id: 'focus', title: 'Investment Focus', icon: Globe, description: 'Sectors, stages, and geographic focus' },
  { id: 'philosophy', title: 'Investment Philosophy', icon: Sparkles, description: 'Your investment beliefs and approach' },
  { id: 'criteria', title: 'Investment Criteria', icon: Settings, description: 'Detailed evaluation criteria and weights' },
  { id: 'thresholds', title: 'Scoring Thresholds', icon: Target, description: 'AI scoring thresholds for deal evaluation' },
  { id: 'review', title: 'Review & Launch', icon: CheckCircle, description: 'Review configuration and activate strategy' }
];

// Investment philosophy structured prompts
const PHILOSOPHY_PROMPTS = {
  investmentDrivers: [
    'Market disruption potential',
    'Strong founding team',
    'Proven business model',
    'Technology innovation',
    'Scalability potential',
    'Network effects',
    'Defensible moats'
  ],
  riskApproach: [
    'Conservative - Lower risk, proven markets',
    'Balanced - Mix of proven and emerging opportunities',
    'Aggressive - High risk, high reward investments'
  ],
  valueCreation: [
    'Hands-on operational support',
    'Strategic guidance and networking',
    'Financial optimization',
    'Growth acceleration',
    'Market expansion support'
  ]
};

export function EnhancedStrategyWizard({ 
  fundId, 
  fundName, 
  onComplete, 
  onCancel, 
  existingStrategy 
}: EnhancedStrategyWizardProps) {
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
    philosophyConfig: {
      investmentDrivers: [],
      riskTolerance: 'balanced',
      investmentHorizon: '5-7 years',
      valueCreationApproach: []
    }
  });
  
  const { createStrategy, loading, getDefaultTemplate } = useUnifiedStrategy(fundId);

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Fund Basics
        return !!(wizardData.fundName?.trim() && wizardData.strategyDescription?.trim());
      case 1: // Investment Focus
        return !!(wizardData.sectors?.length && wizardData.stages?.length && wizardData.geographies?.length);
      case 2: // Investment Philosophy
        return !!(wizardData.philosophyConfig?.investmentDrivers?.length && 
                  wizardData.philosophyConfig?.riskTolerance && 
                  wizardData.philosophyConfig?.valueCreationApproach?.length);
      case 3: // Investment Criteria
        const validation = validateCriteriaWeights(criteria);
        return validation.isValid;
      case 4: // Scoring Thresholds
        return !!(wizardData.dealThresholds?.exciting && wizardData.dealThresholds?.promising);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      const step = WIZARD_STEPS[currentStep];
      toast.error(`Please complete all required fields in ${step.title}`);
      return;
    }

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
    
    const validation = validateCriteriaWeights(criteria);
    if (!validation.isValid) {
      toast.error('Please fix criteria weight validation errors before completing');
      return;
    }
    
    const template = getDefaultTemplate(wizardData.fundType);
    const completeData: EnhancedWizardData = {
      ...template,
      ...wizardData,
      fundName: wizardData.fundName || fundName,
      strategyDescription: wizardData.strategyDescription || `Investment strategy for ${fundName}`,
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

  const addGeography = (type: 'region' | 'country' | 'jurisdiction', value: string, parent?: string) => {
    const currentGeos = wizardData.geographies || [];
    let newGeo = value;
    
    if (type === 'country' && parent) {
      newGeo = `${parent} > ${value}`;
    } else if (type === 'jurisdiction' && parent) {
      newGeo = `${parent} > ${value}`;
    }
    
    if (!currentGeos.includes(newGeo)) {
      updateWizardData({ geographies: [...currentGeos, newGeo] });
    }
  };

  const removeGeography = (value: string) => {
    const currentGeos = wizardData.geographies || [];
    updateWizardData({ geographies: currentGeos.filter(geo => geo !== value) });
  };

  const step = WIZARD_STEPS[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Clean Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center">
          <StepIcon className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Strategy Configuration</h1>
          <p className="text-muted-foreground mt-1">{step.title} • Step {currentStep + 1} of {WIZARD_STEPS.length}</p>
        </div>
      </div>

      {/* Elegant Progress Bar */}
      <div className="space-y-4">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="h-2 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Step Indicators */}
        <div className="flex justify-between items-center">
          {WIZARD_STEPS.map((stepItem, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            
            return (
              <div key={stepItem.id} className="flex flex-col items-center space-y-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  isCompleted ? 'bg-primary text-primary-foreground' :
                  isCurrent ? 'bg-primary/20 text-primary border-2 border-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  isCurrent ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {stepItem.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-0 shadow-lg bg-card">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">{step.title}</h2>
              <p className="text-muted-foreground">{step.description}</p>
            </div>

            {/* Step Content */}
            <div className="max-w-2xl mx-auto">
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fundName" className="text-base font-medium">Fund Name</Label>
                    <Input
                      id="fundName"
                      value={wizardData.fundName || ''}
                      onChange={(e) => updateWizardData({ fundName: e.target.value })}
                      placeholder="Enter your fund name"
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base font-medium">Strategy Overview</Label>
                    <Textarea
                      id="description"
                      value={wizardData.strategyDescription || ''}
                      onChange={(e) => updateWizardData({ strategyDescription: e.target.value })}
                      placeholder="Describe your investment strategy, focus areas, and approach..."
                      rows={4}
                      className="text-base"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Minimum Investment</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={wizardData.checkSizeRange?.min || 0}
                          onChange={(e) => updateWizardData({ 
                            checkSizeRange: { 
                              ...wizardData.checkSizeRange, 
                              min: parseInt(e.target.value) || 0 
                            } 
                          })}
                          placeholder="500,000"
                          className="pl-8 h-12 text-base"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Maximum Investment</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={wizardData.checkSizeRange?.max || 0}
                          onChange={(e) => updateWizardData({ 
                            checkSizeRange: { 
                              ...wizardData.checkSizeRange, 
                              max: parseInt(e.target.value) || 0 
                            } 
                          })}
                          placeholder="5,000,000"
                          className="pl-8 h-12 text-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-8">
                  {/* Sectors */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Target Sectors</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SECTOR_OPTIONS.map(sector => {
                        const isSelected = wizardData.sectors?.includes(sector);
                        return (
                          <Button
                            key={sector}
                            variant={isSelected ? "default" : "outline"}
                            className="h-12 justify-start"
                            onClick={() => {
                              const current = wizardData.sectors || [];
                              if (isSelected) {
                                updateWizardData({ sectors: current.filter(s => s !== sector) });
                              } else {
                                updateWizardData({ sectors: [...current, sector] });
                              }
                            }}
                          >
                            {sector}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stages */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Investment Stages</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {STAGE_OPTIONS.map(stage => {
                        const isSelected = wizardData.stages?.includes(stage);
                        return (
                          <Button
                            key={stage}
                            variant={isSelected ? "default" : "outline"}
                            className="h-12 justify-start"
                            onClick={() => {
                              const current = wizardData.stages || [];
                              if (isSelected) {
                                updateWizardData({ stages: current.filter(s => s !== stage) });
                              } else {
                                updateWizardData({ stages: [...current, stage] });
                              }
                            }}
                          >
                            {stage}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hierarchical Geography */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Geographic Focus</Label>
                    
                    {/* Selected Geographies */}
                    {wizardData.geographies && wizardData.geographies.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
                        {wizardData.geographies.map(geo => (
                          <Badge key={geo} variant="secondary" className="gap-2">
                            {geo}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => removeGeography(geo)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Geographic Regions */}
                    <div className="space-y-6">
                      {Object.entries(GEOGRAPHIC_REGIONS).map(([region, data]) => (
                        <div key={region} className="space-y-3">
                          <Button
                            variant="outline"
                            size="lg"
                            className="w-full h-14 justify-start text-left"
                            onClick={() => addGeography('region', region)}
                          >
                            <Globe className="h-5 w-5 mr-3" />
                            <div>
                              <div className="font-medium">{region}</div>
                              <div className="text-sm text-muted-foreground">
                                {data.countries.length} countries available
                              </div>
                            </div>
                          </Button>
                          
                          {/* Countries for this region */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-6">
                            {data.countries.map(country => (
                              <Button
                                key={country}
                                variant="ghost"
                                size="sm"
                                className="justify-start text-sm h-10"
                                onClick={() => addGeography('country', country, region)}
                              >
                                {country}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  {/* Investment Drivers */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">What drives your investment decisions?</Label>
                    <p className="text-sm text-muted-foreground">Select the key factors that influence your investment choices</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {PHILOSOPHY_PROMPTS.investmentDrivers.map(driver => {
                        const isSelected = wizardData.philosophyConfig?.investmentDrivers?.includes(driver);
                        return (
                          <Button
                            key={driver}
                            variant={isSelected ? "default" : "outline"}
                            className="h-12 justify-start text-left"
                            onClick={() => {
                              const current = wizardData.philosophyConfig?.investmentDrivers || [];
                              const updated = isSelected 
                                ? current.filter(d => d !== driver)
                                : [...current, driver];
                              updateWizardData({ 
                                philosophyConfig: { 
                                  ...wizardData.philosophyConfig, 
                                  investmentDrivers: updated 
                                } 
                              });
                            }}
                          >
                            {driver}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Risk Tolerance */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Risk Approach</Label>
                    <RadioGroup
                      value={wizardData.philosophyConfig?.riskTolerance || 'balanced'}
                      onValueChange={(value) => updateWizardData({
                        philosophyConfig: { 
                          ...wizardData.philosophyConfig, 
                          riskTolerance: value 
                        }
                      })}
                    >
                      <div className="space-y-3">
                        {PHILOSOPHY_PROMPTS.riskApproach.map(approach => (
                          <div key={approach} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value={approach.toLowerCase().split(' - ')[0]} />
                            <div>
                              <div className="font-medium">{approach.split(' - ')[0]}</div>
                              <div className="text-sm text-muted-foreground">{approach.split(' - ')[1]}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Value Creation */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Value Creation Approach</Label>
                    <p className="text-sm text-muted-foreground">How do you create value in your portfolio companies?</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {PHILOSOPHY_PROMPTS.valueCreation.map(approach => {
                        const isSelected = wizardData.philosophyConfig?.valueCreationApproach?.includes(approach);
                        return (
                          <Button
                            key={approach}
                            variant={isSelected ? "default" : "outline"}
                            className="h-12 justify-start text-left"
                            onClick={() => {
                              const current = wizardData.philosophyConfig?.valueCreationApproach || [];
                              const updated = isSelected 
                                ? current.filter(a => a !== approach)
                                : [...current, approach];
                              updateWizardData({ 
                                philosophyConfig: { 
                                  ...wizardData.philosophyConfig, 
                                  valueCreationApproach: updated 
                                } 
                              });
                            }}
                          >
                            {approach}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-muted-foreground">Configure the weight and importance of each evaluation criteria</p>
                  </div>
                  
                  <div className="space-y-6">
                    {criteria.map((criterion, index) => (
                      <div key={criterion.id} className="p-6 border rounded-lg space-y-4">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-primary"></div>
                             <div>
                               <h3 className="font-medium">{criterion.name}</h3>
                               <p className="text-sm text-muted-foreground">Weight: {criterion.weight}%</p>
                             </div>
                           </div>
                           <Badge variant="outline">{criterion.weight}%</Badge>
                         </div>
                        
                        <Slider
                          value={[criterion.weight]}
                          onValueChange={(values) => {
                            const newCriteria = [...criteria];
                            newCriteria[index] = { ...criterion, weight: values[0] };
                            setCriteria(newCriteria);
                          }}
                          max={50}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Total Weight:</span>
                      <span className={`font-medium ${
                        criteria.reduce((sum, c) => sum + c.weight, 0) === 100 ? 'text-success' : 'text-destructive'
                      }`}>
                        {criteria.reduce((sum, c) => sum + c.weight, 0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-muted-foreground">Set the scoring thresholds for deal categorization</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium text-success">Exciting Threshold</Label>
                        <Badge variant="outline" className="text-success border-success">
                          {wizardData.dealThresholds?.exciting || 85}%
                        </Badge>
                      </div>
                      <Slider
                        value={[wizardData.dealThresholds?.exciting || 85]}
                        onValueChange={(values) => updateWizardData({
                          dealThresholds: { ...wizardData.dealThresholds, exciting: values[0] }
                        })}
                        min={70}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium text-warning">Promising Threshold</Label>
                        <Badge variant="outline" className="text-warning border-warning">
                          {wizardData.dealThresholds?.promising || 70}%
                        </Badge>
                      </div>
                      <Slider
                        value={[wizardData.dealThresholds?.promising || 70]}
                        onValueChange={(values) => updateWizardData({
                          dealThresholds: { ...wizardData.dealThresholds, promising: values[0] }
                        })}
                        min={50}
                        max={90}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium text-muted-foreground">Needs Development Threshold</Label>
                        <Badge variant="outline">
                          {wizardData.dealThresholds?.needs_development || 50}%
                        </Badge>
                      </div>
                      <Slider
                        value={[wizardData.dealThresholds?.needs_development || 50]}
                        onValueChange={(values) => updateWizardData({
                          dealThresholds: { ...wizardData.dealThresholds, needs_development: values[0] }
                        })}
                        min={20}
                        max={70}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Threshold Guide</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>• <span className="text-success">Exciting</span>: High-priority deals with strong investment potential</div>
                      <div>• <span className="text-warning">Promising</span>: Solid opportunities worth deeper investigation</div>
                      <div>• <span className="text-muted-foreground">Needs Development</span>: Early-stage or developing opportunities</div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 mx-auto text-success mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Ready to Launch</h3>
                    <p className="text-muted-foreground">Review your strategy configuration and launch your AI-powered investment framework</p>
                  </div>
                  
                  <div className="space-y-4 p-6 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Fund:</span>
                        <p className="text-muted-foreground">{wizardData.fundName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Investment Range:</span>
                        <p className="text-muted-foreground">
                          ${wizardData.checkSizeRange?.min?.toLocaleString()} - ${wizardData.checkSizeRange?.max?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Sectors:</span>
                        <p className="text-muted-foreground">{wizardData.sectors?.length || 0} selected</p>
                      </div>
                      <div>
                        <span className="font-medium">Geographies:</span>
                        <p className="text-muted-foreground">{wizardData.geographies?.length || 0} selected</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={currentStep === 0 ? onCancel : handlePrevious}
          className="px-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </Button>
        
        <div className="text-center text-sm text-muted-foreground">
          Step {currentStep + 1} of {WIZARD_STEPS.length}
        </div>
        
        {currentStep === WIZARD_STEPS.length - 1 ? (
          <Button 
            onClick={handleComplete} 
            disabled={loading}
            className="px-6"
          >
            {loading ? 'Launching...' : 'Launch Strategy'}
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleNext} 
            disabled={!validateStep(currentStep)}
            className="px-6"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}