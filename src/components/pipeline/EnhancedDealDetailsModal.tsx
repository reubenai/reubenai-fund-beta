import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { DetailedAnalysisSection } from '@/components/analysis/DetailedAnalysisSection';
import { EnhancedCompanyDetails } from '@/components/company/EnhancedCompanyDetails';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Users, 
  Globe, 
  Linkedin, 
  ExternalLink,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Brain,
  Target,
  User,
  Edit,
  Activity,
  FileText,
  Zap,
  Eye
} from 'lucide-react';
import { DocumentManager } from '@/components/documents/DocumentManager';
import { EnhancedDocumentAnalysis } from '@/components/documents/EnhancedDocumentAnalysis';
import { DealNotesManager } from '@/components/notes/DealNotesManager';
import { EnhancedDealAnalysisTab } from './EnhancedDealAnalysisTab';
import { Deal as BaseDeal } from '@/hooks/usePipelineDeals';
import { EnhancedDealAnalysis } from '@/types/enhanced-deal-analysis';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedDealActivities } from '@/hooks/useEnhancedDealActivities';
import { ShareDealModal } from '@/components/deals/ShareDealModal';
import { DealPermissionGuard, DealActionGuard } from '@/components/deals/DealPermissionGuard';
import { EnhancedActivityTable } from '@/components/activities/EnhancedActivityTable';
import { ThesisAlignmentSection } from '@/components/analysis/ThesisAlignmentSection';
import { MarketOpportunityAssessment } from '@/components/analysis/MarketOpportunityAssessment';
import { FounderTeamStrengthAssessment } from '@/components/analysis/FounderTeamStrengthAssessment';
import { ProductIPMoatAssessment } from '@/components/analysis/ProductIPMoatAssessment';
import { TractionFinancialFeasibilityAssessment } from '@/components/analysis/TractionFinancialFeasibilityAssessment';
import { FinancialPerformanceAssessment } from '@/components/analysis/FinancialPerformanceAssessment';
import { MarketPositionAssessment } from '@/components/analysis/MarketPositionAssessment';
import { OperationalExcellenceAssessment } from '@/components/analysis/OperationalExcellenceAssessment';
import { GrowthPotentialAssessment } from '@/components/analysis/GrowthPotentialAssessment';
import { RiskAssessmentSection } from '@/components/analysis/RiskAssessmentSection';
import { StrategicTimingAssessment } from '@/components/analysis/StrategicTimingAssessment';
import { TrustTransparencyAssessment } from '@/components/analysis/TrustTransparencyAssessment';
import { ReubenAIDualInterface } from '@/components/analysis/ReubenAIDualInterface';
import { ReubenAISummaryScoreEnhanced } from '@/components/analysis/ReubenAISummaryScoreEnhanced';
import { toTemplateFundType } from '@/utils/fundTypeConversion';
import { BlueprintVCMarketOpportunity } from '@/components/analysis/blueprint/BlueprintVCMarketOpportunity';
import { BlueprintVCTeamLeadership } from '@/components/analysis/blueprint/BlueprintVCTeamLeadership';
import { BlueprintVCProductTechnology } from '@/components/analysis/blueprint/BlueprintVCProductTechnology';
import { BlueprintVCBusinessTraction } from '@/components/analysis/blueprint/BlueprintVCBusinessTraction';
import { BlueprintVCFinancialHealth } from '@/components/analysis/blueprint/BlueprintVCFinancialHealth';
import { BlueprintVCStrategicFit } from '@/components/analysis/blueprint/BlueprintVCStrategicFit';
import { BlueprintPEFinancialPerformance } from '@/components/analysis/blueprint/BlueprintPEFinancialPerformance';
import { BlueprintPEOperationalExcellence } from '@/components/analysis/blueprint/BlueprintPEOperationalExcellence';
import { BlueprintPEMarketPosition } from '@/components/analysis/blueprint/BlueprintPEMarketPosition';
import { BlueprintPEManagementQuality } from '@/components/analysis/blueprint/BlueprintPEManagementQuality';
import { BlueprintPEGrowthPotential } from '@/components/analysis/blueprint/BlueprintPEGrowthPotential';
import { BlueprintPEStrategicFit } from '@/components/analysis/blueprint/BlueprintPEStrategicFit';
// Removed DealAnalysisTrigger - reverting to background processing
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFund } from '@/contexts/FundContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { triggerVCScoring, validateVCDeal } from '@/services/vcScoringService';
import { triggerICDatapointSourcingPublic, validateICDeal } from '@/services/icDatapointSourcingService';

// Extend the Deal type to include enhanced_analysis
type Deal = BaseDeal & {
  enhanced_analysis?: EnhancedDealAnalysis;
};

interface EnhancedDealDetailsModalProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealUpdated?: () => void;
}

interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  activity_type: string;
  occurred_at: string;
  user_id: string;
  context_data?: any;
}

interface CompanyDetails {
  description?: string;
  business_model?: string;
  revenue_model?: string;
  customer_segments?: string[];
  competitive_advantages?: string[];
  funding_history?: any[];
  team_size?: number;
  key_partnerships?: string[];
  technology_stack?: string[];
  ip_portfolio?: string[];
}

export function EnhancedDealDetailsModal({ 
  deal, 
  open, 
  onOpenChange, 
  onDealUpdated
}: EnhancedDealDetailsModalProps) {
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  
  const [hasTriggeredEnrichment, setHasTriggeredEnrichment] = useState(false);
  const [dealFund, setDealFund] = useState<any>(null);
  const [fundTypeLoading, setFundTypeLoading] = useState(true);
  const [isVCScoring, setIsVCScoring] = useState(false);
  const [isICAnalyzing, setIsICAnalyzing] = useState(false);
  const { toast } = useToast();
  const { getRAGCategory } = useStrategyThresholds();
  const { canViewActivities, canViewAnalysis, role, loading } = usePermissions();
  const { selectedFund } = useFund();
  const { isSuperAdmin } = useUserRole();
  
  // Get fund type from deal's specific fund, not selected fund
  const fundType = dealFund?.fund_type || 'venture_capital';
  
  // Enhanced activity hook with user data and 30-day filter
  const { 
    activities: enhancedActivities, 
    loading: activitiesLoading, 
    refresh: refreshActivities 
  } = useEnhancedDealActivities(deal?.id);

  // Debug logging
  console.log('Deal Modal Permissions Debug:', {
    canViewActivities,
    canViewAnalysis,
    role,
    loading,
    userEmail: 'checking permissions'
  });

  // Load deal's fund data
  useEffect(() => {
    const loadDealFund = async () => {
      if (!deal?.fund_id) return;
      
      setFundTypeLoading(true);
      try {
        const { data: fund, error } = await supabase
          .from('funds')
          .select('fund_type')
          .eq('id', deal.fund_id)
          .single();
        
        if (!error && fund) {
          setDealFund(fund);
          console.log('Deal fund type:', fund.fund_type, 'for deal:', deal.company_name);
        }
      } catch (error) {
        console.error('Error loading deal fund:', error);
      } finally {
        setFundTypeLoading(false);
      }
    };

    loadDealFund();
  }, [deal?.fund_id]);

  useEffect(() => {
    if (deal && open && !fundTypeLoading) {
      loadEnhancedData();
      // Only trigger enrichment once per modal session to prevent infinite loops
      if (!hasTriggeredEnrichment) {
        setHasTriggeredEnrichment(true);
        triggerBackgroundEnrichment();
      }
    } else if (!open) {
      // Reset enrichment flag when modal closes
      setHasTriggeredEnrichment(false);
    }
  }, [deal?.id, open, hasTriggeredEnrichment, fundTypeLoading]);

  const loadEnhancedData = async () => {
    if (!deal) return;

    try {
      // Load analysis data
      const { data: analysis, error: analysisError } = await supabase
        .from('deal_analyses')
        .select('*')
        .eq('deal_id', deal.id)
        .order('analyzed_at', { ascending: false })
        .limit(1);

      if (!analysisError && analysis && analysis.length > 0) {
        setAnalysisData(analysis[0]);
      }

      // Refresh activities from the enhanced hook
      refreshActivities();

    } catch (error) {
      console.error('Error loading enhanced data:', error);
    }
  };

  const triggerBackgroundEnrichment = async () => {
    if (!deal || !selectedFund) return;

    try {
      // Silent background enrichment via deal-enrichment-engine
      console.log('🔄 [Background] Starting silent enrichment...');
      
      const { data, error } = await supabase.functions.invoke('deal-enrichment-engine', {
        body: {
          org_id: selectedFund.organization_id,
          fund_id: selectedFund.id,
          deal_id: deal.id,
          enrichment_packs: selectedFund.fund_type === 'private_equity' 
            ? ['pe_financial_performance', 'pe_market_position', 'pe_operational_excellence', 'pe_growth_potential', 'pe_risk_assessment']
            : ['vc_market_opportunity', 'vc_team_leadership', 'vc_product_technology', 'vc_business_traction', 'vc_strategic_fit', 'vc_strategic_timing'],
          force_refresh: false
        }
      });

      
      console.log('📊 [Background] Enrichment response:', { data, error });

      if (!error) {
        console.log('✅ [Background] Enrichment completed silently');
        // Dispatch event to notify components of enrichment completion
        console.log('🎯 [Background] Dispatching dealEnrichmentComplete event for deal:', deal.id);
        window.dispatchEvent(new CustomEvent('dealEnrichmentComplete', { 
          detail: { dealId: deal.id } 
        }));
        // Refresh data after enrichment, but don't call onDealUpdated to prevent infinite loop
        setTimeout(() => {
          loadEnhancedData();
          // Note: Removed onDealUpdated?.() call to prevent infinite re-rendering
        }, 3000); // Increased timeout to allow engines to populate data
      } else {
        console.warn('⚠️ [Background] Enrichment had error:', error);
      }
    } catch (error) {
      console.log('⚠️ [Background] Enrichment failed silently:', error);
    }
  };

  const handleVCScoring = async () => {
    if (!deal) return;
    
    if (!validateVCDeal(deal, dealFund?.fund_type)) {
      toast({
        title: "Invalid Deal Type",
        description: "VC scoring is only available for Venture Capital deals",
        variant: "destructive"
      });
      return;
    }

    setIsVCScoring(true);
    try {
      const result = await triggerVCScoring(deal.id);
      
      toast({
        title: "VC Analysis Completed",
        description: `Analysis completed for ${deal.company_name} with score ${result.overall_score}/100. ${result.memo_generation.success ? 'IC memo generated successfully.' : 'Memo generation failed.'}`,
        variant: "default"
      });
      
      // Refresh the modal data
      loadEnhancedData();
      
      // Notify parent component
      if (onDealUpdated) {
        onDealUpdated();
      }
    } catch (error) {
      console.error('VC Scoring failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze deal",
        variant: "destructive"
      });
    } finally {
      setIsVCScoring(false);
    }
  };

  const handleICAnalysis = async () => {
    if (!deal) return;
    
    if (!validateICDeal(deal, dealFund?.fund_type)) {
      toast({
        title: "Invalid Deal",
        description: "IC analysis requires a valid deal with fund information",
        variant: "destructive"
      });
      return;
    }

    setIsICAnalyzing(true);
    try {
      const result = await triggerICDatapointSourcingPublic(deal.id);
      
      toast({
        title: "IC Content Generated",
        description: `IC memo content generated for ${deal.company_name}. ${result.sections_generated} sections created successfully.`,
        variant: "default"
      });
      
      // Refresh the modal data
      loadEnhancedData();
      
      // Notify parent component
      if (onDealUpdated) {
        onDealUpdated();
      }
    } catch (error) {
      console.error('IC Analysis failed:', error);
      toast({
        title: "IC Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate IC content",
        variant: "destructive"
      });
    } finally {
      setIsICAnalyzing(false);
    }
  };


  if (!deal) return null;

  const formatAmount = (amount?: number, currency: string = 'USD') => {
    if (!amount) return 'Not specified';
    return formatCurrency(amount, currency);
  };

  const rag = getRAGCategory(deal.overall_score);

  return (
    <>
      {/* Development Debug Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black/80 text-white px-3 py-1 rounded text-xs z-50">
          Fund Type: {fundTypeLoading ? 'Loading...' : fundType} | Deal: {deal?.company_name}
        </div>
      )}
      
      {/* Fund Type Loading State */}
      {fundTypeLoading && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Loading Deal Analysis...</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading fund information...</span>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {!fundTypeLoading && (
        <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6" />
              {deal.company_name}
            </div>
            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <>
                  <Button
                    onClick={handleVCScoring}
                    disabled={isVCScoring}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    {isVCScoring ? 'Analyzing...' : 'Run VC Analysis'}
                  </Button>
                  <Button
                    onClick={handleICAnalysis}
                    disabled={isICAnalyzing}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {isICAnalyzing ? 'Generating IC Content...' : 'Generate IC Content'}
                  </Button>
                </>
              )}
              <DealActionGuard dealId={deal.id} action="manage">
                {(canManage) => canManage && (
                  <ShareDealModal dealId={deal.id} dealName={deal.company_name} />
                )}
              </DealActionGuard>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className={`grid w-full bg-muted/30 ${
            canViewAnalysis && canViewActivities 
              ? 'grid-cols-5' 
              : canViewAnalysis || canViewActivities 
                ? 'grid-cols-4' 
                : 'grid-cols-3'
          }`}>
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Company Overview
            </TabsTrigger>
            {canViewAnalysis && (
            <TabsTrigger value="analysis" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Brain className="w-4 h-4 mr-1" />
                ReubenAI
              </TabsTrigger>
            )}
            <TabsTrigger value="documents" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <FileText className="w-4 h-4 mr-1" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Notes
            </TabsTrigger>
            {canViewActivities && (
              <TabsTrigger value="activity" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Activity
              </TabsTrigger>
            )}
          </TabsList>
          

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              {/* IC Decision Card - Only show if decision exists */}
              {deal.ic_decision_outcome && (
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5" />
                      Investment Committee Decision
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          deal.ic_decision_outcome === 'approved' ? 'default' : 
                          deal.ic_decision_outcome === 'rejected' ? 'destructive' : 
                          'secondary'
                        }>
                          {deal.ic_decision_outcome?.toUpperCase()}
                        </Badge>
                        {deal.ic_decision_date && (
                          <span className="text-sm text-muted-foreground">
                            Decided on {format(new Date(deal.ic_decision_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      {deal.ic_decision_outcome === 'approved' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {deal.ic_decision_outcome === 'rejected' && (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Investment Committee has {deal.ic_decision_outcome} this opportunity. 
                      {deal.ic_decision_outcome === 'approved' && ' Proceeding to term sheet preparation.'}
                      {deal.ic_decision_outcome === 'rejected' && ' Deal archived with learnings captured.'}
                      {deal.ic_decision_outcome === 'deferred' && ' Additional due diligence required.'}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Company Overview Card with subtle background processing indicator */}
              <Card>
                <CardContent className="pt-6">

                  {/* Enhanced Company Details */}
                  <EnhancedCompanyDetails 
                    deal={deal}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          {canViewAnalysis && (
            <TabsContent value="analysis" className="space-y-6">
              {/* Beta Notice */}
              <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="p-4">
                  <div className="text-sm text-foreground space-y-2">
                    <p>
                      <strong>Beta v1 Notice:</strong> The Deal Analysis Modal currently applies basic rubric scoring, with new data channels and deeper insights to be added progressively. Request datasets via the Feedback widget.
                    </p>
                    <p>
                      Adding notes and documents (such as pitch decks and financial models) to deals will auto-trigger re-analysis and scoring accuracy. Market movements and external signals are also considered in deal scoring.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* ReubenAI Summary Score - Conditional rendering based on fund type */}
              {toTemplateFundType(dealFund?.fund_type || 'vc') === 'vc' ? (
                // For VC deals: Show enhanced Reuben directly without tabs
                <ReubenAISummaryScoreEnhanced 
                  deal={deal} 
                  fundType={dealFund?.fund_type || 'vc'} 
                  onScoreCalculated={(score) => console.log('AI Score calculated:', score)}
                />
              ) : (
                // For PE deals: Keep dual interface with tabs
                <ReubenAIDualInterface 
                  deal={deal} 
                  fundType={dealFund?.fund_type || 'vc'} 
                  onScoreCalculated={(score) => console.log('AI Score calculated:', score)}
                />
              )}
            </TabsContent>
          )}

          <TabsContent value="documents" className="space-y-6">
            <DealPermissionGuard dealId={deal.id} requiredAction="view">
              <DocumentManager
                dealId={deal.id}
                companyName={deal.company_name}
              />
            </DealPermissionGuard>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <DealPermissionGuard dealId={deal.id} requiredAction="view">
                <DealNotesManager 
                  dealId={deal.id} 
                  companyName={deal.company_name}
                  fundType={fundType === 'venture_capital' ? 'vc' : 'pe'}
                />
            </DealPermissionGuard>
          </TabsContent>

          {canViewActivities && (
            <TabsContent value="activity" className="space-y-6">
              <EnhancedActivityTable 
                activities={enhancedActivities} 
                loading={activitiesLoading} 
              />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
      )}
    </>
  );
}