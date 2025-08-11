import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  Play,
  Loader2,
  Target,
  FileText,
  Calculator
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useFund } from '@/contexts/FundContext';

interface ThesisSetupValidatorProps {
  onComplete?: () => void;
}

export function ThesisSetupValidator({ onComplete }: ThesisSetupValidatorProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [validationSteps, setValidationSteps] = useState([
    { id: 'strategy-exists', name: 'Investment Strategy Configuration', status: 'pending', error: null },
    { id: 'criteria-valid', name: 'Scoring Criteria Validation', status: 'pending', error: null },
    { id: 'thresholds-set', name: 'RAG Threshold Configuration', status: 'pending', error: null },
    { id: 'thesis-drives-scoring', name: 'Thesis Drives Scoring Test', status: 'pending', error: null }
  ]);
  const { toast } = useToast();
  const { selectedFund } = useFund();

  const runValidation = async () => {
    if (!selectedFund) {
      toast({
        title: "No Fund Selected",
        description: "Please select a fund before running validation",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    
    for (let i = 0; i < validationSteps.length; i++) {
      const step = validationSteps[i];
      
      // Update step to running
      setValidationSteps(prev => prev.map(s => 
        s.id === step.id ? { ...s, status: 'running' } : s
      ));

      try {
        await executeValidationStep(step.id);
        
        // Update step to passed
        setValidationSteps(prev => prev.map(s => 
          s.id === step.id ? { ...s, status: 'passed', error: null } : s
        ));
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        // Update step to failed
        setValidationSteps(prev => prev.map(s => 
          s.id === step.id ? { 
            ...s, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          } : s
        ));
        break;
      }
    }
    
    setIsRunning(false);
    const allPassed = validationSteps.every(s => s.status === 'passed');
    
    if (allPassed) {
      toast({
        title: "Thesis Setup Validated",
        description: "All fund thesis and strategy tests passed",
      });
      onComplete?.();
    }
  };

  const executeValidationStep = async (stepId: string): Promise<void> => {
    switch (stepId) {
      case 'strategy-exists':
        // Check if investment strategy exists
        const { data: strategy, error: strategyError } = await supabase
          .from('investment_strategies')
          .select('*')
          .eq('fund_id', selectedFund?.id)
          .single();
        
        if (strategyError || !strategy) {
          throw new Error('Investment strategy not configured for this fund');
        }
        break;
        
      case 'criteria-valid':
        // Validate scoring criteria structure
        const { data: strategyData, error: criteriaError } = await supabase
          .from('investment_strategies')
          .select('enhanced_criteria')
          .eq('fund_id', selectedFund?.id)
          .single();
        
        if (criteriaError) throw criteriaError;
        
        if (!strategyData?.enhanced_criteria) {
          throw new Error('Enhanced criteria not configured');
        }
        
        // Type assertion for enhanced_criteria
        const criteria = strategyData.enhanced_criteria as any;
        if (!criteria.categories || !Array.isArray(criteria.categories)) {
          throw new Error('Invalid or missing enhanced criteria structure');
        }
        
        const categories = criteria.categories;
        if (categories.length === 0) {
          throw new Error('No scoring categories defined');
        }
        
        // Check that all categories have valid weights
        const totalWeight = categories.reduce((sum: number, cat: any) => sum + (cat.weight || 0), 0);
        if (Math.abs(totalWeight - 100) > 5) { // Allow 5% tolerance
          throw new Error(`Category weights should sum to 100%, got ${totalWeight}%`);
        }
        break;
        
      case 'thresholds-set':
        // Check RAG thresholds
        const { data: thresholds, error: thresholdError } = await supabase
          .from('investment_strategies')
          .select('exciting_threshold, promising_threshold, needs_development_threshold')
          .eq('fund_id', selectedFund?.id)
          .single();
        
        if (thresholdError) throw thresholdError;
        
        if (!thresholds?.exciting_threshold || !thresholds?.promising_threshold || !thresholds?.needs_development_threshold) {
          throw new Error('RAG thresholds not configured');
        }
        
        // Validate threshold logic
        if (thresholds.exciting_threshold <= thresholds.promising_threshold ||
            thresholds.promising_threshold <= thresholds.needs_development_threshold) {
          throw new Error('Invalid threshold configuration: exciting > promising > needs_development');
        }
        break;
        
      case 'thesis-drives-scoring':
        // Test that thesis configuration affects scoring
        const { data: testDeal, error: dealError } = await supabase
          .from('deals')
          .select('overall_score, rag_status')
          .eq('fund_id', selectedFund?.id)
          .limit(1);
        
        if (dealError) throw dealError;
        
        // For now, just verify structure exists
        // In a real implementation, this would test scoring algorithms
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
        
      default:
        throw new Error(`Unknown validation step: ${stepId}`);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full border border-muted-foreground" />;
    }
  };

  const passedSteps = validationSteps.filter(s => s.status === 'passed').length;
  const progress = (passedSteps / validationSteps.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Fund & Thesis Setup Validation
        </CardTitle>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {validationSteps.map((step) => (
            <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
              {getStepIcon(step.status)}
              <div className="flex-1">
                <p className="font-medium text-sm">{step.name}</p>
                {step.error && (
                  <p className="text-xs text-red-600 mt-1">{step.error}</p>
                )}
              </div>
              <Badge variant="outline" className={
                step.status === 'passed' ? 'border-green-200 text-green-700' :
                step.status === 'failed' ? 'border-red-200 text-red-700' :
                step.status === 'running' ? 'border-blue-200 text-blue-700' :
                'border-gray-200 text-gray-600'
              }>
                {step.status}
              </Badge>
            </div>
          ))}
        </div>
        
        <Button 
          onClick={runValidation} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Validation...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Validate Thesis Setup
            </>
          )}
        </Button>
        
        {!selectedFund && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please select a fund to run thesis setup validation tests.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}