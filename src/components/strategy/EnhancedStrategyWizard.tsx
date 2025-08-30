import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
import { SECTOR_OPTIONS } from '@/types/enhanced-strategy';
import { getStageOptionsByFundType } from '@/types/enhanced-fund-specialization';
import { VC_CRITERIA_TEMPLATE, PE_CRITERIA_TEMPLATE, EnhancedCriteriaCategory, EnhancedSubcategory, getTemplateByFundType } from '@/types/vc-pe-criteria';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { HierarchicalSectorSelector } from './HierarchicalSectorSelector';

interface EnhancedStrategyWizardProps {
  fundId: string;
  fundName: string;
  fundType: 'vc' | 'pe';  // Auto-populated from fund
  onComplete: () => void;
  onCancel: () => void;
  existingStrategy?: EnhancedStrategy | null;
}

// Comprehensive Geographic regions with startup ecosystem intelligence
const GEOGRAPHIC_REGIONS = {
  'North America': {
    countries: ['United States', 'Canada', 'Mexico', 'Costa Rica'],
    ecosystems: ['Silicon Valley', 'New York', 'Toronto', 'Austin', 'Seattle', 'Boston', 'Vancouver', 'Montreal'],
    jurisdictions: {
      'United States': ['California', 'New York', 'Texas', 'Florida', 'Massachusetts', 'Washington', 'Illinois', 'Colorado', 'Georgia', 'North Carolina'],
      'Canada': ['Ontario', 'British Columbia', 'Quebec', 'Alberta', 'Nova Scotia'],
      'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Tijuana'],
      'Costa Rica': ['San José', 'Cartago']
    }
  },
  'Europe': {
    countries: ['United Kingdom', 'Germany', 'France', 'Netherlands', 'Sweden', 'Switzerland', 'Spain', 'Italy', 'Denmark', 'Norway', 'Finland', 'Estonia', 'Latvia', 'Lithuania', 'Poland', 'Czech Republic', 'Austria', 'Belgium', 'Ireland', 'Portugal', 'Greece', 'Romania', 'Bulgaria', 'Hungary', 'Slovenia', 'Slovakia', 'Croatia', 'Luxembourg', 'Malta', 'Cyprus'],
    ecosystems: ['London', 'Berlin', 'Paris', 'Amsterdam', 'Stockholm', 'Zurich', 'Barcelona', 'Madrid', 'Milan', 'Copenhagen', 'Oslo', 'Helsinki', 'Tallinn', 'Warsaw', 'Prague', 'Vienna', 'Brussels', 'Dublin', 'Lisbon'],
    jurisdictions: {
      'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
      'Germany': ['Bavaria', 'Berlin', 'Baden-Württemberg', 'North Rhine-Westphalia', 'Hamburg', 'Hesse'],
      'France': ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine'],
      'Netherlands': ['North Holland', 'South Holland', 'Utrecht', 'North Brabant'],
      'Sweden': ['Stockholm', 'Gothenburg', 'Malmö'],
      'Switzerland': ['Zurich', 'Geneva', 'Basel', 'Bern']
    }
  },
  'Asia Pacific': {
    countries: ['Singapore', 'Australia', 'Japan', 'South Korea', 'China', 'India', 'Hong Kong', 'Taiwan', 'Thailand', 'Malaysia', 'Indonesia', 'Vietnam', 'Philippines', 'New Zealand', 'Bangladesh', 'Sri Lanka', 'Cambodia', 'Laos', 'Myanmar'],
    ecosystems: ['Singapore', 'Sydney', 'Melbourne', 'Perth', 'Tokyo', 'Seoul', 'Beijing', 'Shanghai', 'Shenzhen', 'Bangalore', 'Mumbai', 'Delhi', 'Hong Kong', 'Taipei', 'Bangkok', 'Kuala Lumpur', 'Jakarta', 'Ho Chi Minh City', 'Manila', 'Auckland'],
    jurisdictions: {
      'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia'],
      'China': ['Beijing', 'Shanghai', 'Shenzhen', 'Guangzhou', 'Hangzhou', 'Chengdu', 'Nanjing'],
      'India': ['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana', 'Gujarat', 'West Bengal'],
      'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Fukuoka'],
      'South Korea': ['Seoul', 'Busan', 'Incheon']
    }
  },
  'Latin America': {
    countries: ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Mexico', 'Uruguay', 'Ecuador', 'Bolivia', 'Paraguay', 'Venezuela', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Panama', 'Dominican Republic', 'Cuba', 'Haiti', 'Jamaica', 'Trinidad and Tobago', 'Barbados'],
    ecosystems: ['São Paulo', 'Rio de Janeiro', 'Buenos Aires', 'Santiago', 'Bogotá', 'Lima', 'Mexico City', 'Montevideo', 'Medellín', 'Guadalajara'],
    jurisdictions: {
      'Brazil': ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Rio Grande do Sul', 'Paraná', 'Santa Catarina'],
      'Argentina': ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza'],
      'Chile': ['Santiago', 'Valparaíso', 'Concepción'],
      'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla']
    }
  },
  'Middle East & Africa': {
    countries: ['Israel', 'UAE', 'South Africa', 'Kenya', 'Nigeria', 'Egypt', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Morocco', 'Tunisia', 'Algeria', 'Ghana', 'Ethiopia', 'Uganda', 'Tanzania', 'Rwanda', 'Botswana', 'Zambia', 'Zimbabwe', 'Namibia', 'Mauritius', 'Senegal', 'Ivory Coast', 'Cameroon', 'Angola', 'Mozambique'],
    ecosystems: ['Tel Aviv', 'Dubai', 'Abu Dhabi', 'Cape Town', 'Johannesburg', 'Nairobi', 'Lagos', 'Cairo', 'Riyadh', 'Doha', 'Kuwait City', 'Casablanca', 'Tunis', 'Accra', 'Addis Ababa', 'Kampala', 'Dar es Salaam', 'Kigali'],
    jurisdictions: {
      'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
      'South Africa': ['Western Cape', 'Gauteng', 'KwaZulu-Natal', 'Eastern Cape'],
      'Israel': ['Tel Aviv', 'Jerusalem', 'Haifa', 'Beer Sheva'],
      'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam', 'Mecca'],
      'Nigeria': ['Lagos', 'Abuja', 'Kano', 'Port Harcourt'],
      'Kenya': ['Nairobi', 'Mombasa', 'Kisumu']
    }
  }
};

// Streamlined 5-step wizard (RAG thresholds step hidden)
const WIZARD_STEPS = [
  { id: 'basics', title: 'Fund Basics', icon: Target, description: 'Core fund information and strategy overview' },
  { id: 'focus', title: 'Investment Focus', icon: Globe, description: 'Sectors, stages, and geographic focus' },
  { id: 'philosophy', title: 'Investment Philosophy', icon: Sparkles, description: 'Your investment beliefs and approach' },
  { id: 'criteria', title: 'Investment Criteria', icon: Settings, description: 'Detailed evaluation criteria and weights' },
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
  fundType,
  onComplete, 
  onCancel, 
  existingStrategy 
}: EnhancedStrategyWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancedCriteria, setEnhancedCriteria] = useState<EnhancedCriteriaCategory[]>(
    getTemplateByFundType(fundType).categories
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [wizardData, setWizardData] = useState<Partial<EnhancedWizardData>>({
    fundName: fundName,
    fundType: fundType, // Auto-populated from selected fund
    strategyDescription: existingStrategy?.strategy_notes || '',
    investmentPhilosophy: '',
    sectors: existingStrategy?.industries || [],
    stages: [],
    geographies: existingStrategy?.geography || [],
    checkSizeRange: { 
      min: existingStrategy?.min_investment_amount || 500000, 
      max: existingStrategy?.max_investment_amount || 5000000 
    },
    keySignals: existingStrategy?.key_signals || [],
    dealThresholds: { 
      exciting: existingStrategy?.exciting_threshold || 85, 
      promising: existingStrategy?.promising_threshold || 70, 
      needs_development: existingStrategy?.needs_development_threshold || 50 
    },
    philosophyConfig: {
      investmentDrivers: [],
      riskTolerance: 'balanced',
      investmentHorizon: '5-7 years',
      valueCreationApproach: [],
      diversityPreference: []
    }
  });
  
  const { saveStrategy, updateStrategy, loading, getDefaultTemplate } = useUnifiedStrategy(fundId);

  // Enhanced criteria are initialized based on fund type - no manual fund type changes allowed
  useEffect(() => {
    // Initializing Enhanced Criteria
    const template = getTemplateByFundType(fundType);
    
    // Ensure all categories and subcategories are properly enabled WITH DEFAULT WEIGHTS
    const enabledCriteria = template.categories.map(category => ({
      ...category,
      enabled: true, // Force enable all categories
      weight: category.weight || 25, // Ensure each category has a default weight
      subcategories: category.subcategories.map(sub => ({
        ...sub,
        enabled: true, // Force enable all subcategories
        weight: sub.weight || 25 // Ensure each subcategory has a default weight
      }))
    }));
    
    // Verify that total weight sums to 100%
    const totalWeight = enabledCriteria.reduce((sum, cat) => sum + (cat.enabled ? cat.weight : 0), 0);
    // Verify that total weight sums to 100%
    
    if (Math.abs(totalWeight - 100) > 0.1) {
      // Adjust weights to equal distribution (25% each for 4 categories)
      const equalWeight = 100 / enabledCriteria.length;
      const adjustedCriteria = enabledCriteria.map(cat => ({
        ...cat,
        weight: equalWeight
      }));
      setEnhancedCriteria(adjustedCriteria);
      
      // Save to wizard data
      setWizardData(prev => ({
        ...prev,
        enhancedCriteria: adjustedCriteria
      }));
    } else {
      // Enabled criteria set with correct weights
      setEnhancedCriteria(enabledCriteria);
      
      // Save enhanced criteria to wizard data for step persistence
      setWizardData(prev => ({
        ...prev,
        enhancedCriteria: enabledCriteria
      }));
    }
  }, [fundType]);

  // Restore enhanced criteria when navigating back to criteria step
  useEffect(() => {
    if (currentStep === 3 && wizardData.enhancedCriteria) {
      // Restoring Enhanced Criteria for Step 4
      setEnhancedCriteria(wizardData.enhancedCriteria);
    }
  }, [currentStep, wizardData.enhancedCriteria]);

  // Enhanced criteria management
  const updateCategoryWeight = (categoryIndex: number, weight: number) => {
    const newCriteria = [...enhancedCriteria];
    newCriteria[categoryIndex] = { ...newCriteria[categoryIndex], weight };
    setEnhancedCriteria(newCriteria);
    
    // Persist to wizard data for step navigation
    setWizardData(prev => ({
      ...prev,
      enhancedCriteria: newCriteria
    }));
  };

  const updateSubcategoryWeight = (categoryIndex: number, subcategoryIndex: number, weight: number) => {
    const newCriteria = [...enhancedCriteria];
    const category = { ...newCriteria[categoryIndex] };
    const subcategories = [...category.subcategories];
    subcategories[subcategoryIndex] = { ...subcategories[subcategoryIndex], weight };
    category.subcategories = subcategories;
    newCriteria[categoryIndex] = category;
    setEnhancedCriteria(newCriteria);
    
    // Persist to wizard data for step navigation
    setWizardData(prev => ({
      ...prev,
      enhancedCriteria: newCriteria
    }));
  };

  const toggleSubcategory = (categoryIndex: number, subcategoryIndex: number) => {
    const newCriteria = [...enhancedCriteria];
    const category = { ...newCriteria[categoryIndex] };
    const subcategories = [...category.subcategories];
    subcategories[subcategoryIndex] = { 
      ...subcategories[subcategoryIndex], 
      enabled: !subcategories[subcategoryIndex].enabled 
    };
    category.subcategories = subcategories;
    newCriteria[categoryIndex] = category;
    setEnhancedCriteria(newCriteria);
    
    // Persist to wizard data for step navigation
    setWizardData(prev => ({
      ...prev,
      enhancedCriteria: newCriteria
    }));
  };

  const toggleCategoryExpansion = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  // Validation for enhanced criteria
  const validateEnhancedCriteria = (): boolean => {
    const totalWeight = enhancedCriteria.reduce((sum, cat) => sum + (cat.enabled ? cat.weight : 0), 0);
    
    console.log('🔍 Weight validation debug:');
    console.log('Total weight calculated:', totalWeight);
    console.log('Criteria:', enhancedCriteria.map(c => ({ name: c.name, enabled: c.enabled, weight: c.weight })));
    
    // More lenient precision check - allow up to 0.5% difference for floating point errors
    if (Math.abs(totalWeight - 100) > 0.5) {
      console.log('❌ Total weight validation failed:', totalWeight);
      return false;
    }
    
    // Validate subcategory weights for each enabled category
    for (const category of enhancedCriteria) {
      if (category.enabled) {
        const enabledSubcategories = category.subcategories.filter(sub => sub.enabled);
        if (enabledSubcategories.length > 0) {
          const subWeight = enabledSubcategories.reduce((sum, sub) => sum + sub.weight, 0);
          console.log(`Subcategory weights for ${category.name}:`, subWeight);
          
          // More lenient precision check for subcategories too
          if (Math.abs(subWeight - 100) > 0.5) {
            console.log(`❌ Subcategory weight validation failed for ${category.name}:`, subWeight);
            return false;
          }
        }
      }
    }
    console.log('✅ All weight validations passed');
    return true;
  };

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
        return validateEnhancedCriteria();
      // Step 4 (Scoring Thresholds) removed - RAG analysis disabled
      default:
        return true;
    }
  };

  const handleNext = () => {
    console.log('=== Handle Next Step ===');
    console.log('Current step:', currentStep);
    console.log('Enhanced criteria before validation:', enhancedCriteria);
    
    if (!validateStep(currentStep)) {
      const step = WIZARD_STEPS[currentStep];
      let errorMessage = `Please complete all required fields in ${step.title}`;
      
      // Provide specific error message for criteria step
      if (currentStep === 3) {
        const totalWeight = enhancedCriteria.reduce((sum, cat) => sum + (cat.enabled ? cat.weight : 0), 0);
        errorMessage = `Category weights must sum to 100% (currently ${totalWeight.toFixed(1)}%)`;
        // Criteria validation failed
      }
      
      toast.error(errorMessage);
      return;
    }

    // Save enhanced criteria to wizard data when leaving criteria step
    if (currentStep === 3) {
      // Saving Enhanced Criteria
      setWizardData(prev => ({
        ...prev,
        enhancedCriteria: enhancedCriteria
      }));
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
    
    if (!validateEnhancedCriteria()) {
      toast.error('Please fix criteria weight validation errors before completing');
      return;
    }
    
    console.log('🚀 === STARTING STRATEGY SAVE PROCESS ===');
    console.log('Fund ID:', fundId);
    console.log('Fund Type:', wizardData.fundType);
    console.log('Existing Strategy:', existingStrategy?.id ? 'EXISTS' : 'NEW');
    
    try {
      setIsProcessing(true);
      
      // Convert enhanced criteria to the format expected by the V2 service
      const enhancedCriteriaData = {
        fundType: wizardData.fundType,
        categories: enhancedCriteria,
        totalWeight: enhancedCriteria.reduce((sum, cat) => sum + (cat.enabled ? cat.weight : 0), 0)
      };

      console.log('📊 Enhanced Criteria Data to Save:', enhancedCriteriaData);
      
      let result;
      
      // Always save (UPDATE) since funds automatically have default strategies
      console.log('💾 Saving strategy with UPDATE-only logic');
      console.log('📊 Enhanced Criteria State:', enhancedCriteria);
      console.log('📊 Wizard Data Before Merge:', wizardData);
      
      // Use the properly formatted enhanced criteria data
      const completeWizardData: any = {
        ...wizardData,
        enhancedCriteria: enhancedCriteriaData // Use the full V2 format structure
      };
      
      console.log('📊 Complete Wizard Data After Merge:', completeWizardData);
      console.log('📊 Enhanced Criteria in Complete Data:', completeWizardData.enhancedCriteria);
      console.log('📊 Enhanced Criteria Array Length:', completeWizardData.enhancedCriteria?.length || 0);
      
      result = await saveStrategy(wizardData.fundType as 'vc' | 'pe', completeWizardData);
      
      console.log('📈 Save Result:', result);
      
      if (result) {
        // Show success message with delay before redirect
        toast.success('Investment strategy saved successfully!', {
          description: 'Your strategy configuration has been applied to the fund.',
          duration: 3000,
        });
        
        console.log('✅ Strategy saved successfully, redirecting in 2 seconds...');
        
        // Add a small delay so user sees the success message
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        console.error('❌ Strategy save returned null/undefined');
        toast.error('Strategy save failed', {
          description: 'The strategy was not saved. Please try again.',
          duration: 5000,
        });
      }
      
    } catch (error: any) {
      console.error('💥 Strategy save error:', error);
      
      // Parse error message for user-friendly display
      let errorMessage = 'Failed to save strategy';
      let errorDescription = 'Please try again or contact support if the issue persists.';
      
      if (error?.message) {
        if (error.message.includes('Database')) {
          errorMessage = 'Database Error';
          errorDescription = 'There was an issue saving to the database. Please try again.';
        } else if (error.message.includes('validation')) {
          errorMessage = 'Validation Error';
          errorDescription = 'Please check your strategy configuration and try again.';
        } else if (error.message.includes('permission') || error.message.includes('Access denied')) {
          errorMessage = 'Permission Error';
          errorDescription = 'You do not have permission to save strategies for this fund.';
        } else {
          errorDescription = error.message;
        }
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 8000,
        action: {
          label: 'Retry',
          onClick: () => handleComplete(),
        },
      });
      
    } finally {
      setIsProcessing(false);
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

  const addGeography = (type: 'region' | 'country' | 'jurisdiction' | 'ecosystem', value: string, parent?: string) => {
    const currentGeos = wizardData.geographies || [];
    let newGeo = value;
    
    if ((type === 'country' || type === 'jurisdiction' || type === 'ecosystem') && parent) {
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
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Clean Header */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
          <StepIcon className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Strategy Configuration</h1>
          <p className="text-muted-foreground text-sm">{step.title} • Step {currentStep + 1} of {WIZARD_STEPS.length}</p>
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
                     <Label className="text-base font-medium">Fund Type</Label>
                     <div className="p-3 bg-muted rounded-lg">
                       <Badge variant="secondary" className="text-sm">
                         {fundType === 'vc' ? 'Venture Capital' : 'Private Equity'}
                       </Badge>
                       <p className="text-sm text-muted-foreground mt-1">
                         Auto-populated from your selected fund configuration
                       </p>
                     </div>
                   </div>

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
                        placeholder="e.g., We invest in early-stage B2B SaaS companies with strong technical teams, focusing on AI/ML and automation tools for enterprise customers in North America..."
                        rows={4}
                       className="text-base"
                     />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <Label className="text-base font-medium">Minimum Investment</Label>
                       <NumberInput
                         value={wizardData.checkSizeRange?.min || undefined}
                         onChange={(value) => updateWizardData({ 
                           checkSizeRange: { 
                             ...wizardData.checkSizeRange, 
                             min: value || 0 
                           } 
                          })}
                          placeholder="500,000"
                          className="h-12 text-base"
                          showCurrency
                          currency="USD"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Maximum Investment</Label>
                        <NumberInput
                          value={wizardData.checkSizeRange?.max || undefined}
                          onChange={(value) => updateWizardData({ 
                            checkSizeRange: { 
                              ...wizardData.checkSizeRange, 
                              max: value || 0
                              } 
                            })}
                            placeholder="5,000,000"
                            className="h-12 text-base"
                            showCurrency
                            currency="USD"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Typical range: $500K - $5M for seed/Series A</p>
                     </div>
                   </div>
                 </div>
               )}

              {currentStep === 1 && (
                <div className="space-y-8">
                  {/* Sectors - Hierarchical Selection */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Target Industries & Sectors</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select entire industries or specific sectors within them. 
                        {fundType && ` Relevance scores shown for ${fundType.toUpperCase()} funds.`}
                      </p>
                    </div>
                    <HierarchicalSectorSelector
                      selectedSectors={wizardData.sectors || []}
                      onSelectionChange={(sectors) => updateWizardData({ sectors })}
                      fundType={fundType}
                    />
                  </div>

                  {/* Stages */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Investment Stages</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getStageOptionsByFundType(fundType).map(stage => {
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

                   {/* Target Geographies - Hierarchical */}
                   <div className="space-y-4">
                     <Label className="text-base font-medium">Target Geographies</Label>
                     <div className="space-y-4">
                       {/* Current selections */}
                       {wizardData.geographies && wizardData.geographies.length > 0 && (
                         <div className="space-y-2">
                           <Label className="text-sm text-muted-foreground">Selected Geographies</Label>
                           <div className="flex flex-wrap gap-2">
                             {wizardData.geographies.map((geo, index) => (
                               <Badge key={index} variant="outline" className="px-3 py-1 gap-2">
                                 {geo}
                                 <X 
                                   className="h-3 w-3 cursor-pointer" 
                                   onClick={() => removeGeography(geo)}
                                 />
                               </Badge>
                             ))}
                           </div>
                         </div>
                       )}
                       
                       {/* Hierarchical selection */}
                       <div className="space-y-6">
                         {/* Regions */}
                         <div className="space-y-3">
                           <Label className="text-sm font-medium">Major Regions</Label>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {Object.entries(GEOGRAPHIC_REGIONS).map(([region, data]) => (
                               <Button
                                 key={region}
                                 variant={wizardData.geographies?.includes(region) ? "default" : "outline"}
                                 className="h-auto p-4 justify-start flex-col items-start"
                                 onClick={() => {
                                   const current = wizardData.geographies || [];
                                   if (current.includes(region)) {
                                     removeGeography(region);
                                   } else {
                                     addGeography('region', region);
                                   }
                                 }}
                               >
                                 <span className="font-medium">{region}</span>
                                 <span className="text-xs text-muted-foreground">
                                   {data.countries.length} countries • {data.ecosystems.length} ecosystems
                                 </span>
                               </Button>
                             ))}
                           </div>
                         </div>

                         {/* Countries within selected regions */}
                         {wizardData.geographies?.some(geo => Object.keys(GEOGRAPHIC_REGIONS).includes(geo)) && (
                           <div className="space-y-3">
                             <Label className="text-sm font-medium">Countries</Label>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                               {Object.entries(GEOGRAPHIC_REGIONS)
                                 .filter(([region]) => wizardData.geographies?.includes(region))
                                 .flatMap(([region, data]) => 
                                   data.countries.map(country => ({
                                     country,
                                     region,
                                     fullName: `${region} > ${country}`
                                   }))
                                 )
                                 .map(({ country, region, fullName }) => (
                                   <Button
                                     key={fullName}
                                     variant={wizardData.geographies?.includes(fullName) ? "default" : "outline"}
                                     size="sm"
                                     className="justify-start text-xs"
                                     onClick={() => {
                                       const current = wizardData.geographies || [];
                                       if (current.includes(fullName)) {
                                         removeGeography(fullName);
                                       } else {
                                         addGeography('country', country, region);
                                       }
                                     }}
                                   >
                                     {country}
                                   </Button>
                                 ))
                               }
                             </div>
                           </div>
                         )}

                         {/* Startup Ecosystems */}
                         {wizardData.geographies?.some(geo => Object.keys(GEOGRAPHIC_REGIONS).includes(geo)) && (
                           <div className="space-y-3">
                             <Label className="text-sm font-medium">Key Startup Ecosystems</Label>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                               {Object.entries(GEOGRAPHIC_REGIONS)
                                 .filter(([region]) => wizardData.geographies?.includes(region))
                                 .flatMap(([region, data]) => 
                                   data.ecosystems.map(ecosystem => ({
                                     ecosystem,
                                     region,
                                     fullName: `${region} > ${ecosystem}`
                                   }))
                                 )
                                 .map(({ ecosystem, region, fullName }) => (
                                   <Button
                                     key={fullName}
                                     variant={wizardData.geographies?.includes(fullName) ? "default" : "outline"}
                                     size="sm"
                                     className="justify-start text-xs"
                                     onClick={() => {
                                       const current = wizardData.geographies || [];
                                       if (current.includes(fullName)) {
                                         removeGeography(fullName);
                                       } else {
                                         addGeography('ecosystem', ecosystem, region);
                                       }
                                     }}
                                   >
                                     {ecosystem}
                                   </Button>
                                 ))
                               }
                             </div>
                           </div>
                         )}
                       </div>
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

                  {/* Founder & Diversity Preference */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Founder & Diversity Preference</Label>
                    <p className="text-sm text-muted-foreground">Select founder diversity criteria that align with your investment focus</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        'Women-led',
                        'Minority-led', 
                        'Veteran-led',
                        'LGBTQ+-led',
                        'Immigrant Entrepreneur-led',
                        'Other Underrepresented Founders'
                      ].map(diversity => {
                        const isSelected = wizardData.philosophyConfig?.diversityPreference?.includes(diversity);
                        return (
                          <Button
                            key={diversity}
                            variant={isSelected ? "default" : "outline"}
                            className="h-12 justify-start text-left"
                            onClick={() => {
                              const current = wizardData.philosophyConfig?.diversityPreference || [];
                              const updated = isSelected 
                                ? current.filter(d => d !== diversity)
                                : [...current, diversity];
                              updateWizardData({ 
                                philosophyConfig: { 
                                  ...wizardData.philosophyConfig, 
                                  diversityPreference: updated 
                                } 
                              });
                            }}
                          >
                            {diversity}
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
                    <p className="text-muted-foreground">Configure detailed evaluation criteria and weights for {wizardData.fundType?.toUpperCase() || 'VC'} investments</p>
                  </div>
                  
                  <div className="space-y-4">
                    {enhancedCriteria.map((category, categoryIndex) => (
                      <div key={category.name} className="border rounded-lg overflow-hidden">
                        <Collapsible
                          open={expandedCategories.has(category.name)}
                          onOpenChange={() => toggleCategoryExpansion(category.name)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="p-4 hover:bg-muted/50 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <ChevronDown className={`h-4 w-4 transition-transform ${
                                    expandedCategories.has(category.name) ? 'rotate-180' : ''
                                  }`} />
                                  <div>
                                    <h3 className="font-medium">{category.name}</h3>
                                    <p className="text-sm text-muted-foreground">{category.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline">{category.weight}%</Badge>
                                  <Switch
                                    checked={category.enabled}
                                    onCheckedChange={(checked) => {
                                      const newCriteria = [...enhancedCriteria];
                                      newCriteria[categoryIndex] = { ...category, enabled: checked };
                                      setEnhancedCriteria(newCriteria);
                                      
                                      // Sync to wizard data for proper save
                                      setWizardData(prev => ({
                                        ...prev,
                                        enhancedCriteria: newCriteria
                                      }));
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="p-4 border-t bg-muted/20 space-y-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Category Weight</Label>
                                <Slider
                                  value={[category.weight]}
                                  onValueChange={(values) => updateCategoryWeight(categoryIndex, values[0])}
                                  max={50}
                                  step={1}
                                  className="w-full"
                                  disabled={!category.enabled}
                                />
                              </div>
                              
                              <div className="space-y-3">
                                <Label className="text-sm font-medium">Subcategories</Label>
                                {category.subcategories.map((subcategory, subcategoryIndex) => (
                                  <div key={subcategory.name} className="p-3 border rounded-lg bg-background">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={subcategory.enabled}
                                          onCheckedChange={() => toggleSubcategory(categoryIndex, subcategoryIndex)}
                                          disabled={!category.enabled}
                                        />
                                        <div>
                                          <h4 className="text-sm font-medium">{subcategory.name}</h4>
                                          <p className="text-xs text-muted-foreground">{subcategory.requirements}</p>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {subcategory.weight}%
                                      </Badge>
                                    </div>
                                    
                                    {subcategory.enabled && (
                                      <Slider
                                        value={[subcategory.weight]}
                                        onValueChange={(values) => updateSubcategoryWeight(categoryIndex, subcategoryIndex, values[0])}
                                        max={100}
                                        step={5}
                                        className="w-full"
                                        disabled={!category.enabled}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Category Weight:</span>
                      <span className={`font-medium ${
                        validateEnhancedCriteria() ? 'text-success' : 'text-destructive'
                      }`}>
                        {enhancedCriteria.reduce((sum, c) => sum + (c.enabled ? c.weight : 0), 0)}%
                      </span>
                    </div>
                    {!validateEnhancedCriteria() && (
                      <p className="text-xs text-destructive">
                        Category weights must sum to 100% and all subcategory weights within enabled categories must sum to 100%
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4 (Scoring Thresholds) hidden - RAG analysis disabled */}

              {currentStep === 4 && (
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
                    
                    {/* Enhanced Criteria Validation Summary */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Investment Criteria:</span>
                        <Badge variant={validateEnhancedCriteria() ? "default" : "destructive"}>
                          {enhancedCriteria.reduce((sum, cat) => sum + (cat.enabled ? cat.weight : 0), 0).toFixed(1)}% 
                          {validateEnhancedCriteria() ? " ✓" : " ✗"}
                        </Badge>
                      </div>
                      {!validateEnhancedCriteria() && (
                        <div className="text-sm text-destructive">
                          Category weights must sum to 100% (currently {enhancedCriteria.reduce((sum, cat) => sum + (cat.enabled ? cat.weight : 0), 0).toFixed(1)}%)
                        </div>
                      )}
                      <div className="space-y-1 text-xs text-muted-foreground mt-2">
                        {enhancedCriteria.map(cat => (
                          <div key={cat.name} className="flex justify-between">
                            <span>{cat.name}{cat.enabled ? '' : ' (disabled)'}</span>
                            <span>{cat.enabled ? cat.weight : 0}%</span>
                          </div>
                        ))}
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
        <div className="flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="px-6">
                <X className="h-4 w-4 mr-2" />
                Cancel Wizard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Strategy Configuration?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel? All progress in this wizard will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Wizard</AlertDialogCancel>
                <AlertDialogAction onClick={onCancel}>Cancel Wizard</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {currentStep > 0 && (
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              className="px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          Step {currentStep + 1} of {WIZARD_STEPS.length}
        </div>
        
        {currentStep === WIZARD_STEPS.length - 1 ? (
          <Button 
            onClick={handleComplete} 
            disabled={isProcessing || loading}
            className="px-6"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Saving Strategy...
              </>
            ) : (
              <>
                Launch Strategy
                <CheckCircle className="h-4 w-4 ml-2" />
              </>
            )}
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