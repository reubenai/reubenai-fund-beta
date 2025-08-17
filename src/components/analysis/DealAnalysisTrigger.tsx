import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  TrendingUp,
  Target,
  PlayCircle
} from 'lucide-react';
import { useOrchestrator } from '@/hooks/useOrchestrator';
import { useEnrichmentEngine } from '@/hooks/useEnrichmentEngine';
import { MetricShiftNotification } from './MetricShiftNotification';
import { useFund } from '@/contexts/FundContext';
import { toast } from 'sonner';

interface DealAnalysisTriggerProps {
  dealId: string;
  orgId: string;
  fundId: string;
  deal?: any;
  onAnalysisComplete?: () => void;
}

export function DealAnalysisTrigger({
  dealId,
  orgId,
  fundId,
  deal,
  onAnalysisComplete
}: DealAnalysisTriggerProps) {
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'enriching' | 'analyzing' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  const { analyzeDeal, enrichDeal, isProcessing } = useOrchestrator();
  const { triggerEnrichment, isEnriching, enrichmentResults, metricShifts } = useEnrichmentEngine();
  const { selectedFund } = useFund();

  // Check if deal has minimum metadata for analysis
  const hasMinimumData = deal && (deal.industry || deal.funding_stage || deal.company_name);
  const canAnalyze = hasMinimumData && !isProcessing && !isEnriching;

  useEffect(() => {
    // Auto-trigger analysis if deal has sufficient data and hasn't been analyzed
    if (hasMinimumData && analysisStatus === 'idle' && !deal.first_analysis_completed) {
      triggerFullAnalysis();
    }
  }, [hasMinimumData, dealId]);

  const triggerFullAnalysis = async () => {
    if (!canAnalyze) return;

    try {
      setAnalysisStatus('enriching');
      setCurrentStep('Starting deal enrichment...');
      setProgress(10);

      console.log('🚀 [Analysis Trigger] Starting full analysis for deal:', dealId);

      // Step 1: Trigger enrichment first
      const enrichmentResult = await triggerEnrichment({
        dealId,
        fundId,
        orgId
      });

      if (enrichmentResult.success) {
        setProgress(40);
        setCurrentStep('Enrichment completed, analyzing deal...');
        setAnalysisStatus('analyzing');

        // Step 2: Trigger comprehensive analysis
        const analysisResult = await analyzeDeal(orgId, fundId, dealId, {
          trigger_reason: 'comprehensive_analysis',
          enrichment_completed: true
        });

        if (analysisResult.success) {
          setProgress(100);
          setCurrentStep('Analysis completed successfully');
          setAnalysisStatus('complete');
          
          toast.success('Deal analysis completed successfully', {
            description: 'Enhanced insights are now available'
          });

          // Show metric shift notifications
          if (metricShifts.length > 0) {
            const majorShifts = metricShifts.filter(s => s.significance === 'major');
            if (majorShifts.length > 0) {
              toast.warning(`${majorShifts.length} significant metric changes detected`, {
                description: 'Review the updated analysis for new insights'
              });
            }
          }

          onAnalysisComplete?.();
        } else {
          throw new Error(analysisResult.error || 'Analysis failed');
        }
      } else {
        throw new Error(enrichmentResult.error || 'Enrichment failed');
      }

    } catch (error) {
      console.error('❌ [Analysis Trigger] Failed:', error);
      setAnalysisStatus('error');
      setCurrentStep(`Error: ${error.message}`);
      
      toast.error('Analysis failed', {
        description: error.message
      });
    }
  };

  const triggerEnrichmentOnly = async () => {
    if (!canAnalyze) return;

    try {
      setAnalysisStatus('enriching');
      setCurrentStep('Refreshing deal enrichment...');
      setProgress(20);

      const result = await triggerEnrichment({
        dealId,
        fundId,
        orgId,
        forceRefresh: true
      });

      if (result.success) {
        setProgress(100);
        setCurrentStep('Enrichment refresh completed');
        setAnalysisStatus('complete');
        
        toast.success('Deal enrichment refreshed successfully');
        onAnalysisComplete?.();
      } else {
        throw new Error(result.error || 'Enrichment failed');
      }

    } catch (error) {
      console.error('❌ [Enrichment Trigger] Failed:', error);
      setAnalysisStatus('error');
      setCurrentStep(`Error: ${error.message}`);
      
      toast.error('Enrichment failed', {
        description: error.message
      });
    }
  };

  const resetStatus = () => {
    setAnalysisStatus('idle');
    setProgress(0);
    setCurrentStep('');
  };

  if (!hasMinimumData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Add industry, stage, or other company details to enable analysis.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5" />
          ReubenAI Analysis
          <Badge variant={analysisStatus === 'complete' ? 'default' : 'secondary'} className="ml-auto">
            {analysisStatus === 'complete' ? 'Active' : 'Ready'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Display */}
        {analysisStatus !== 'idle' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {analysisStatus === 'enriching' && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
              {analysisStatus === 'analyzing' && <Brain className="h-4 w-4 animate-pulse text-purple-600" />}
              {analysisStatus === 'complete' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {analysisStatus === 'error' && <AlertTriangle className="h-4 w-4 text-red-600" />}
              
              <span className="text-sm font-medium">{currentStep}</span>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            {analysisStatus === 'complete' && enrichmentResults.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {enrichmentResults.length} enrichment packs processed • 
                {enrichmentResults.filter(r => r.confidence > 70).length} high-confidence insights
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {analysisStatus === 'idle' || analysisStatus === 'error' ? (
            <>
              <Button 
                onClick={triggerFullAnalysis}
                disabled={!canAnalyze}
                className="flex-1"
                size="sm"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Analysis
              </Button>
              
              <Button 
                onClick={triggerEnrichmentOnly}
                disabled={!canAnalyze}
                variant="outline"
                size="sm"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Enrich Only
              </Button>
            </>
          ) : analysisStatus === 'complete' ? (
            <>
              <Button 
                onClick={triggerFullAnalysis}
                disabled={!canAnalyze}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-analyze
              </Button>
              
              <Button 
                onClick={resetStatus}
                variant="ghost"
                size="sm"
              >
                <Target className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </>
          ) : (
            <Button 
              disabled
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Clock className="h-4 w-4 mr-2" />
              Processing...
            </Button>
          )}
        </div>

        {/* Metric Shifts Alert */}
        {metricShifts.length > 0 && (
          <MetricShiftNotification
            shifts={metricShifts}
            onDismiss={() => {
              // Clear metric shifts
            }}
            onRefreshAnalysis={triggerFullAnalysis}
          />
        )}
      </CardContent>
    </Card>
  );
}