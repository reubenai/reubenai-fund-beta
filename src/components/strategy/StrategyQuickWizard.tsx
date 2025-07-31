import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  CheckCircle
} from 'lucide-react';
import { useUnifiedStrategy } from '@/hooks/useUnifiedStrategy';
import { EnhancedWizardData, EnhancedStrategy } from '@/services/unifiedStrategyService';

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
  const [wizardData, setWizardData] = useState<Partial<EnhancedWizardData>>({
    fundName: fundName,
    fundType: 'vc',
    sectors: [],
    stages: [],
    geographies: [],
    checkSizeRange: { min: 500000, max: 5000000 },
    keySignals: [],
    dealThresholds: { exciting: 85, promising: 70, needs_development: 50 }
  });
  
  const { createStrategy, loading, getDefaultTemplate } = useUnifiedStrategy(fundId);

  const handleNext = () => {
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
    
    // Apply defaults from template
    const template = getDefaultTemplate(wizardData.fundType);
    const completeData: EnhancedWizardData = {
      ...template,
      ...wizardData,
      fundName: wizardData.fundName || fundName,
      strategyDescription: wizardData.strategyDescription || `Investment strategy for ${fundName}`,
    } as EnhancedWizardData;

    const result = await createStrategy(wizardData.fundType, completeData);
    if (result) {
      onComplete();
    }
  };

  const updateWizardData = (updates: Partial<EnhancedWizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
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
          {/* Basic placeholder content for now */}
          <div className="space-y-6">
            <div className="text-center py-12">
              <StepIcon className="h-16 w-16 mx-auto text-emerald-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 mb-4">{step.description}</p>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Step {currentStep + 1} of {WIZARD_STEPS.length}
              </Badge>
            </div>
          </div>
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