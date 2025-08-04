import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedStrategy } from '@/hooks/useUnifiedStrategy';
import { 
  Search, 
  Target, 
  Building2, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  BarChart3
} from 'lucide-react';

interface DealSourcingModalProps {
  open: boolean;
  onClose: () => void;
  fundId: string;
  fundName: string;
}

interface ThesisConfig {
  industries: string[];
  geographies: string[];
  investmentSizeMin: number;
  investmentSizeMax: number;
  keySignals: string[];
  focusAreas: string[];
  searchQuery: string;
}

interface SourcingSession {
  id: string;
  status: string;
  total_sourced: number;
  total_reviewed: number;
  total_processed: number;
}

interface SourcedCompany {
  id: string;
  company_name: string;
  description: string;
  industry: string;
  location: string;
  website: string;
  funding_stage: string;
  deal_size: number;
  valuation: number;
  confidence_score: number;
  validation_score: number;
  ai_analysis_score: number;
  strategy_alignment_score: number;
  recommendation: string;
  priority_level: string;
  removed_by_user: boolean;
  raw_data: any;
}

const SOURCING_STEPS = [
  { id: 'thesis', title: 'Configure Thesis', icon: Target },
  { id: 'sourcing', title: 'Source Companies', icon: Search },
  { id: 'review', title: 'Review Companies', icon: Eye },
  { id: 'analysis', title: 'ReubenAI Analysis', icon: BarChart3 },
  { id: 'complete', title: 'Complete', icon: CheckCircle }
];

export function DealSourcingModal({ open, onClose, fundId, fundName }: DealSourcingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sourcingSession, setSourcingSession] = useState<SourcingSession | null>(null);
  const [sourcedCompanies, setSourcedCompanies] = useState<SourcedCompany[]>([]);
  const [thesisConfig, setThesisConfig] = useState<ThesisConfig>({
    industries: [],
    geographies: [],
    investmentSizeMin: 0,
    investmentSizeMax: 50000000,
    keySignals: [],
    focusAreas: [],
    searchQuery: ''
  });

  const { strategy, loading: strategyLoading } = useUnifiedStrategy(fundId);
  const { toast } = useToast();

  // Initialize thesis config from strategy
  useEffect(() => {
    if (strategy && !strategyLoading) {
      setThesisConfig({
        industries: strategy.industries || [],
        geographies: strategy.geography || [],
        investmentSizeMin: strategy.min_investment_amount || 0,
        investmentSizeMax: strategy.max_investment_amount || 50000000,
        keySignals: strategy.key_signals || [],
        focusAreas: [],
        searchQuery: ''
      });
    }
  }, [strategy, strategyLoading]);

  const handleClose = () => {
    if (!isProcessing) {
      setCurrentStep(0);
      setProgress(0);
      setSourcingSession(null);
      setSourcedCompanies([]);
      onClose();
    }
  };

  const proceedToNextStep = () => {
    if (currentStep < SOURCING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const startSourcing = async () => {
    setIsProcessing(true);
    setProgress(10);
    
    try {
      // Step 1: Create sourcing session
      const { data: session, error: sessionError } = await supabase
        .from('sourcing_sessions')
        .insert([{
          fund_id: fundId,
          created_by: (await supabase.auth.getUser()).data.user?.id!,
          thesis_snapshot: strategy as any,
          search_parameters: thesisConfig as any,
          status: 'in_progress'
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSourcingSession(session);
      setProgress(30);

      // Step 2: Call enhanced deal sourcing function
      const { data: sourcingResult, error: sourcingError } = await supabase.functions
        .invoke('enhanced-deal-sourcing', {
          body: {
            fundId,
            strategy,
            searchQuery: thesisConfig.searchQuery,
            focusAreas: thesisConfig.focusAreas,
            batchSize: 5,
            sessionId: session.id,
            industries: thesisConfig.industries,
            geographies: thesisConfig.geographies,
            investmentSizeRange: {
              min: thesisConfig.investmentSizeMin,
              max: thesisConfig.investmentSizeMax
            }
          }
        });

      if (sourcingError) throw sourcingError;
      setProgress(70);

      // Step 3: Save sourced companies to database
      const companies = sourcingResult.data.deals.map((deal: any) => ({
        session_id: session.id,
        company_name: deal.company_name,
        description: deal.description,
        industry: deal.industry,
        location: deal.location,
        website: deal.website,
        funding_stage: deal.funding_stage,
        deal_size: deal.deal_size,
        valuation: deal.valuation,
        confidence_score: deal.confidence_score || deal.ai_confidence,
        validation_score: deal.validation_score,
        ai_analysis_score: deal.ai_investment_score,
        strategy_alignment_score: deal.strategy_alignment_score,
        recommendation: deal.recommendation,
        priority_level: deal.priority_level,
        source_method: 'ai_sourcing',
        raw_data: deal
      }));

      const { data: savedCompanies, error: companiesError } = await supabase
        .from('sourced_companies')
        .insert(companies)
        .select();

      if (companiesError) throw companiesError;
      setSourcedCompanies(savedCompanies);

      // Update session stats
      await supabase
        .from('sourcing_sessions')
        .update({
          total_sourced: savedCompanies.length,
          total_reviewed: savedCompanies.length
        })
        .eq('id', session.id);

      setProgress(100);
      proceedToNextStep(); // Move to review step

      toast({
        title: 'Success',
        description: `Successfully sourced ${savedCompanies.length} companies for review`
      });

    } catch (error) {
      console.error('Sourcing error:', error);
      toast({
        title: 'Error',
        description: 'Failed to source companies. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeCompany = async (companyId: string) => {
    try {
      await supabase
        .from('sourced_companies')
        .update({ removed_by_user: true })
        .eq('id', companyId);

      setSourcedCompanies(companies => 
        companies.map(c => 
          c.id === companyId ? { ...c, removed_by_user: true } : c
        )
      );

      toast({
        title: 'Company removed',
        description: 'Company has been removed from the review list'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove company',
        variant: 'destructive'
      });
    }
  };

  const runComprehensiveAnalysis = async () => {
    const activeCompanies = sourcedCompanies.filter(c => !c.removed_by_user);
    
    if (activeCompanies.length === 0) {
      toast({
        title: 'No companies to analyze',
        description: 'Please add companies before running analysis',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const dealIds: string[] = [];

      // Create deals in pipeline for analysis
      for (const [index, company] of activeCompanies.entries()) {
        setProgress((index / activeCompanies.length) * 50);

        const dealData = {
          fund_id: fundId,
          company_name: company.company_name,
          description: company.description,
          industry: company.industry,
          location: company.location,
          website: company.website,
          deal_size: company.deal_size,
          valuation: company.valuation,
          status: 'sourced' as const,
          source_method: 'ai_sourcing',
          created_by: (await supabase.auth.getUser()).data.user?.id!
        };

        const { data: deal, error: dealError } = await supabase
          .from('deals')
          .insert(dealData)
          .select()
          .single();

        if (dealError) throw dealError;
        dealIds.push(deal.id);

        // Update sourced company with created deal ID
        await supabase
          .from('sourced_companies')
          .update({ created_deal_id: deal.id })
          .eq('id', company.id);
      }

      setProgress(60);

      // Run comprehensive analysis via Reuben Orchestrator for each deal
      const analysisPromises = dealIds.map(dealId => 
        supabase.functions.invoke('reuben-orchestrator', {
          body: {
            dealId: dealId,
            fundId: fundId,
            action: 'comprehensive_analysis',
            priority: 'high',
            source: 'deal_sourcing'
          }
        })
      );

      const analysisResults = await Promise.allSettled(analysisPromises);

      // Check for any failed analyses
      const failedAnalyses = analysisResults.filter(result => result.status === 'rejected');
      if (failedAnalyses.length > 0) {
        console.warn(`${failedAnalyses.length} analyses failed, but continuing with successful ones`);
      }
      setProgress(90);

      // Update session as completed
      if (sourcingSession) {
        await supabase
          .from('sourcing_sessions')
          .update({
            status: 'completed',
            total_processed: dealIds.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', sourcingSession.id);
      }

      setProgress(100);
      proceedToNextStep(); // Move to complete step

      toast({
        title: 'Analysis Complete',
        description: `Successfully analyzed ${dealIds.length} companies and added them to your pipeline`
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Error',
        description: 'Failed to run comprehensive analysis',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderThesisStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Configure Investment Thesis</h3>
        <p className="text-muted-foreground">
          Review and customize your investment criteria for this sourcing session
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Strategy Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Industries</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {thesisConfig.industries.map(industry => (
                <Badge key={industry} variant="secondary">{industry}</Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Geographies</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {thesisConfig.geographies.map(geo => (
                <Badge key={geo} variant="secondary">{geo}</Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minInvestment">Min Investment ($)</Label>
              <Input
                id="minInvestment"
                type="number"
                value={thesisConfig.investmentSizeMin}
                onChange={(e) => setThesisConfig({
                  ...thesisConfig,
                  investmentSizeMin: parseInt(e.target.value) || 0
                })}
              />
            </div>
            <div>
              <Label htmlFor="maxInvestment">Max Investment ($)</Label>
              <Input
                id="maxInvestment"
                type="number"
                value={thesisConfig.investmentSizeMax}
                onChange={(e) => setThesisConfig({
                  ...thesisConfig,
                  investmentSizeMax: parseInt(e.target.value) || 50000000
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search Customization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="focusAreas">Focus Areas (optional)</Label>
            <Input
              id="focusAreas"
              placeholder="e.g., AI/ML, Climate Tech, B2B SaaS"
              value={thesisConfig.focusAreas.join(', ')}
              onChange={(e) => setThesisConfig({
                ...thesisConfig,
                focusAreas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
            />
          </div>

          <div>
            <Label htmlFor="searchQuery">Specific Search Query (optional)</Label>
            <Textarea
              id="searchQuery"
              placeholder="Additional context for the sourcing engine..."
              value={thesisConfig.searchQuery}
              onChange={(e) => setThesisConfig({
                ...thesisConfig,
                searchQuery: e.target.value
              })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={proceedToNextStep}>
          Proceed to Sourcing
        </Button>
      </div>
    </div>
  );

  const renderSourcingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">AI-Powered Company Sourcing</h3>
        <p className="text-muted-foreground">
          Using real company databases and your investment thesis to find opportunities
        </p>
      </div>

      {!isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Search className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Ready to Source Companies</p>
                <p className="text-sm text-muted-foreground">
                  We'll search for 5 companies matching your criteria using AI and real databases
                </p>
              </div>
              <Button onClick={startSourcing} className="gap-2">
                <Search className="h-4 w-4" />
                Start Sourcing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Sourcing companies...</span>
              </div>
               <div className="text-sm text-muted-foreground text-center mb-2">
                 {progress < 30 && "Setting up sourcing session..."}
                 {progress >= 30 && progress < 70 && "Searching company databases..."}
                 {progress >= 70 && progress < 100 && "Processing and validating results..."}
                 {progress >= 100 && "Sourcing complete!"}
               </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                This may take a few moments as we search through company databases
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderReviewStep = () => {
    const activeCompanies = sourcedCompanies.filter(c => !c.removed_by_user);
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Review Sourced Companies</h3>
          <p className="text-muted-foreground">
            {activeCompanies.length} companies found. Review and remove any that don't fit.
          </p>
        </div>

        <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2">
          {sourcedCompanies.map((company) => (
            <Card key={company.id} className={company.removed_by_user ? 'opacity-50' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-semibold truncate">{company.company_name}</h4>
                      <Badge variant={company.priority_level === 'HIGH' ? 'default' : 'secondary'}>
                        {company.priority_level}
                      </Badge>
                      {company.website && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(company.website, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {company.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Industry:</span>
                        <p className="truncate">{company.industry}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Location:</span>
                        <p className="truncate">{company.location}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Stage:</span>
                        <p>{company.funding_stage}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">ReubenAI Score:</span>
                        <p>{company.ai_analysis_score}/100</p>
                      </div>
                    </div>
                  </div>

                  {!company.removed_by_user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCompany(company.id)}
                      className="text-destructive hover:text-destructive ml-2 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
            Back
          </Button>
          <Button 
            onClick={proceedToNextStep}
            disabled={activeCompanies.length === 0}
          >
            Proceed to Analysis ({activeCompanies.length} companies)
          </Button>
        </div>
      </div>
    );
  };

  const renderAnalysisStep = () => {
    const activeCompanies = sourcedCompanies.filter(c => !c.removed_by_user);
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Comprehensive ReubenAI Analysis</h3>
          <p className="text-muted-foreground">
            Run detailed analysis on {activeCompanies.length} selected companies
          </p>
        </div>

        {!isProcessing && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">Ready for Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    This will run our 5-engine analysis and add companies to your pipeline
                  </p>
                </div>
                <Button onClick={runComprehensiveAnalysis} className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Run Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isProcessing && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Running comprehensive analysis...</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Analyzing companies and adding them to your pipeline
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isProcessing && (
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
              Back
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sourcing Complete!</h3>
        <p className="text-muted-foreground">
          Successfully analyzed and added companies to your pipeline
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{sourcingSession?.total_sourced || 0}</p>
              <p className="text-sm text-muted-foreground">Companies Sourced</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{sourcingSession?.total_processed || 0}</p>
              <p className="text-sm text-muted-foreground">Analyzed & Added</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">5</p>
              <p className="text-sm text-muted-foreground">Analysis Engines</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={handleClose}>
          Close & View Pipeline
        </Button>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderThesisStep();
      case 1: return renderSourcingStep();
      case 2: return renderReviewStep();
      case 3: return renderAnalysisStep();
      case 4: return renderCompleteStep();
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Deal Sourcing - {fundName}</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between py-4 border-b">
          {SOURCING_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                  isActive ? 'border-primary text-primary' : 'border-muted-foreground/30 text-muted-foreground'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                {index < SOURCING_STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-6">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}