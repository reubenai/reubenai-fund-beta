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
  Eye,
  RefreshCw
} from 'lucide-react';
import { DocumentManager } from '@/components/documents/DocumentManager';
import { EnhancedDocumentAnalysis } from '@/components/documents/EnhancedDocumentAnalysis';
import { DealNotesManager } from '@/components/notes/DealNotesManager';
import { EnhancedDealAnalysisTab } from './EnhancedDealAnalysisTab';
import { Deal as BaseDeal } from '@/hooks/usePipelineDeals';
import { EnhancedDealAnalysis } from '@/types/enhanced-deal-analysis';
import { useToast } from '@/hooks/use-toast';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedDealActivities } from '@/hooks/useEnhancedDealActivities';
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
import { ReubenAISummaryScore } from '@/components/analysis/ReubenAISummaryScore';
// Removed DealAnalysisTrigger - reverting to background processing
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFund } from '@/contexts/FundContext';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasTriggeredEnrichment, setHasTriggeredEnrichment] = useState(false);
  const { toast } = useToast();
  const { getRAGCategory } = useStrategyThresholds();
  const { canViewActivities, canViewAnalysis, role, loading } = usePermissions();
  const { selectedFund } = useFund();
  
  // Get fund type for dynamic criteria rendering
  const fundType = selectedFund?.fund_type || 'venture_capital';
  
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

  useEffect(() => {
    if (deal && open) {
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
  }, [deal?.id, open, hasTriggeredEnrichment]);

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

  const refreshAnalysis = async () => {
    if (!deal || isRefreshing) return;

    setIsRefreshing(true);
    try {
      // Step 1: Company Enrichment with Coresignal
      console.log('🔍 Step 1: Company Enrichment...');
      const { data: enrichmentData, error: enrichmentError } = await supabase.functions.invoke('company-enrichment-engine', {
        body: {
          dealId: deal.id,
          companyName: deal.company_name,
          website: deal.website,
          linkedinUrl: deal.linkedin_url,
          triggerReanalysis: false
        }
      });

      if (enrichmentError) {
        console.warn('Company enrichment failed:', enrichmentError);
      } else {
        console.log('✅ Company enrichment complete:', enrichmentData);
      }

      // Step 2: Comprehensive Analysis via Reuben Orchestrator  
      console.log('🤖 Step 2: Running comprehensive AI analysis...');
      const { data: orchestratorData, error: orchestratorError } = await supabase.functions.invoke('reuben-orchestrator', {
        body: { 
          dealId: deal.id,
          strategyContext: {
            fundType: selectedFund?.fund_type === 'private_equity' ? 'pe' : 'vc',
            enhancedCriteria: true,
            thresholds: { exciting: 85, promising: 70, needs_development: 50 }
          },
          includeWebResearch: true,
          includeMarketIntelligence: true,
          includeFinancialAnalysis: true,
          includeTeamResearch: true,
          includeProductIPAnalysis: true,
          includeThesisAlignment: true
        }
      });

      if (orchestratorError) {
        console.error('Orchestrator failed:', orchestratorError);
        throw orchestratorError;
      }

      console.log('✅ Orchestrator analysis complete:', orchestratorData);

      // Step 3: Enhanced Deal Analysis (final aggregation)
      console.log('📊 Step 3: Enhanced Deal Analysis...');
      const { data: enhancedAnalysis, error: analysisError } = await supabase.functions.invoke('enhanced-deal-analysis', {
        body: {
          dealId: deal.id,
          action: 'single'
        }
      });

      if (analysisError) {
        console.warn('Enhanced analysis failed:', analysisError);
      } else {
        console.log('✅ Enhanced analysis complete:', enhancedAnalysis);
      }

      // Step 4: Create comprehensive enhanced analysis object
      const engines = orchestratorData?.engines || {};
      const analysis = orchestratorData?.analysis || {};
      
      const comprehensiveAnalysis = {
        rubric_breakdown: [
          {
            category: 'Team & Leadership',
            score: engines['team-research-engine']?.score || analysis.engine_results?.founder_team_strength?.score || 50,
            confidence: engines['team-research-engine']?.confidence || 75,
            weight: 25,
            insights: [engines['team-research-engine']?.analysis || analysis.engine_results?.founder_team_strength?.analysis || 'Team analysis pending'],
            strengths: engines['team-research-engine']?.strengths || ['Analysis in progress'],
            concerns: engines['team-research-engine']?.concerns || ['Pending detailed analysis']
          },
          {
            category: 'Market Opportunity',
            score: engines['market-intelligence-engine']?.score || analysis.engine_results?.market_attractiveness?.score || 50,
            confidence: engines['market-intelligence-engine']?.confidence || 75,
            weight: 25,
            insights: [engines['market-intelligence-engine']?.analysis || analysis.engine_results?.market_attractiveness?.analysis || 'Market analysis pending'],
            strengths: engines['market-intelligence-engine']?.strengths || ['Analysis in progress'],
            concerns: engines['market-intelligence-engine']?.concerns || ['Pending detailed analysis']
          },
          {
            category: 'Product & Technology',
            score: engines['product-ip-engine']?.score || analysis.engine_results?.product_strength_ip?.score || 50,
            confidence: engines['product-ip-engine']?.confidence || 75,
            weight: 25,
            insights: [engines['product-ip-engine']?.analysis || analysis.engine_results?.product_strength_ip?.analysis || 'Product analysis pending'],
            strengths: engines['product-ip-engine']?.strengths || ['Analysis in progress'],
            concerns: engines['product-ip-engine']?.concerns || ['Pending detailed analysis']
          },
          {
            category: 'Financial Health',
            score: engines['financial-engine']?.score || analysis.engine_results?.financial_feasibility?.score || 50,
            confidence: engines['financial-engine']?.confidence || 75,
            weight: 15,
            insights: [engines['financial-engine']?.analysis || analysis.engine_results?.financial_feasibility?.analysis || 'Financial analysis pending'],
            strengths: engines['financial-engine']?.strengths || ['Analysis in progress'],
            concerns: engines['financial-engine']?.concerns || ['Pending detailed analysis']
          },
          {
            category: 'Strategic Fit',
            score: engines['thesis-alignment-engine']?.score || analysis.engine_results?.investment_thesis_alignment?.score || 50,
            confidence: engines['thesis-alignment-engine']?.confidence || 75,
            weight: 10,
            insights: [engines['thesis-alignment-engine']?.analysis || analysis.engine_results?.investment_thesis_alignment?.analysis || 'Thesis analysis pending'],
            strengths: engines['thesis-alignment-engine']?.strengths || ['Analysis in progress'],
            concerns: engines['thesis-alignment-engine']?.concerns || ['Pending detailed analysis']
          }
        ],
        analysis_engines: {
          'team-research-engine': {
            name: 'Team Research Engine',
            score: engines['team-research-engine']?.score || 50,
            confidence: engines['team-research-engine']?.confidence || 75,
            status: engines['team-research-engine'] ? 'complete' : 'pending',
            last_run: new Date().toISOString(),
            version: '3.1'
          },
          'market-intelligence-engine': {
            name: 'Market Intelligence Engine',
            score: engines['market-intelligence-engine']?.score || 50,
            confidence: engines['market-intelligence-engine']?.confidence || 75,
            status: engines['market-intelligence-engine'] ? 'complete' : 'pending',
            last_run: new Date().toISOString(),
            version: '2.8'
          },
          'product-ip-engine': {
            name: 'Product IP Engine',
            score: engines['product-ip-engine']?.score || 50,
            confidence: engines['product-ip-engine']?.confidence || 75,
            status: engines['product-ip-engine'] ? 'complete' : 'pending',
            last_run: new Date().toISOString(),
            version: '2.5'
          },
          'financial-engine': {
            name: 'Financial Engine',
            score: engines['financial-engine']?.score || 50,
            confidence: engines['financial-engine']?.confidence || 75,
            status: engines['financial-engine'] ? 'complete' : 'pending',
            last_run: new Date().toISOString(),
            version: '3.0'
          },
          'thesis-alignment-engine': {
            name: 'Thesis Alignment Engine',
            score: engines['thesis-alignment-engine']?.score || 50,
            confidence: engines['thesis-alignment-engine']?.confidence || 75,
            status: engines['thesis-alignment-engine'] ? 'complete' : 'pending',
            last_run: new Date().toISOString(),
            version: '2.9'
          }
        },
        notes_intelligence: {
          sentiment: 'positive',
          key_insights: orchestratorData?.insights || ['Comprehensive analysis complete'],
          risk_flags: orchestratorData?.risk_factors || [],
          trend_indicators: ['AI analysis integrated'],
          confidence_level: 75,
          last_analyzed: new Date().toISOString()
        },
        fund_type_analysis: {
          fund_type: selectedFund?.fund_type === 'private_equity' ? 'pe' : 'vc',
          focus_areas: selectedFund?.fund_type === 'private_equity' 
            ? ['Financial Performance', 'Operational Excellence', 'Market Position'] 
            : ['Technology', 'Growth potential', 'Market opportunity'],
          strengths: orchestratorData?.analysis?.strengths || ['Analysis completed'],
          concerns: orchestratorData?.analysis?.concerns || [],
          alignment_score: engines['thesis-alignment-engine']?.score || analysis.overall_score || 70,
          strategic_recommendations: orchestratorData?.next_steps || ['Continue analysis']
        },
        analysis_completeness: Object.keys(engines).length > 0 ? 95 : 30,
        last_comprehensive_analysis: new Date().toISOString(),
        company_enrichment: enrichmentData?.data?.enrichment_data || null
      };

      // Update deal with all enhanced data
      const { error: updateError } = await supabase
        .from('deals')
        .update({
          enhanced_analysis: comprehensiveAnalysis,
          overall_score: analysis.overall_score || orchestratorData?.analysis?.overall_score,
          rag_status: analysis.rag_status || orchestratorData?.analysis?.rag_status || 'needs_development',
          employee_count: enrichmentData?.data?.enrichment_data?.employeeCount || deal.employee_count,
          updated_at: new Date().toISOString()
        })
        .eq('id', deal.id);

      if (updateError) {
        console.error('Error updating deal:', updateError);
        throw updateError;
      }

      // Store enriched company details
      setCompanyDetails({
        team_size: enrichmentData?.data?.enrichment_data?.employeeCount || deal.employee_count,
        revenue_estimate: enrichmentData?.data?.enrichment_data?.revenueEstimate,
        growth_rate: enrichmentData?.data?.enrichment_data?.growthRate,
        ...orchestratorData?.company_details
      });
      
      // Dispatch event to notify components of analysis completion
      window.dispatchEvent(new CustomEvent('dealEnrichmentComplete', { 
        detail: { dealId: deal.id } 
      }));
      
      // Force refresh
      setTimeout(() => {
        onDealUpdated?.();
        loadEnhancedData();
      }, 1000);

      toast({
        title: "✅ Analysis Updated",
        description: `Successfully refreshed analysis for ${deal.company_name}`,
      });

    } catch (error) {
      console.error('Analysis refresh failed:', error);
      toast({
        title: "Refresh Error", 
        description: "Failed to refresh analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!deal) return null;

  const formatAmount = (amount?: number, currency: string = 'USD') => {
    if (!amount) return 'Not specified';
    return formatCurrency(amount, currency);
  };

  const rag = getRAGCategory(deal.overall_score);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="h-6 w-6" />
            {deal.company_name}
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
              {/* Company Overview Card with subtle background processing indicator */}
              <Card>
                <CardContent className="pt-6">
                  {isRefreshing && (
                    <div className="flex items-center gap-2 mb-4 p-2 bg-muted/50 rounded-md">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                      <span className="text-sm text-muted-foreground">Refreshing analysis...</span>
                    </div>
                  )}

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
              
              {/* Assessment Sections with Accordion - Dynamic based on fund type */}
              {fundType === 'private_equity' ? (
                <Accordion type="multiple" className="w-full space-y-4" defaultValue={["thesis", "financial", "market", "operational", "growth", "risk", "timing", "trust"]}>
                  <AccordionItem value="thesis" className="border rounded-lg">
                    <AccordionTrigger className="px-4 text-lg font-semibold hover:no-underline">
                      Thesis Alignment
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <ThesisAlignmentSection deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="financial" className="border rounded-lg">
                    <AccordionTrigger className="px-4 text-lg font-semibold hover:no-underline">
                      Financial Performance
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <FinancialPerformanceAssessment deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="market" className="border rounded-lg">
                    <AccordionTrigger className="px-4 text-lg font-semibold hover:no-underline">
                      Market Position
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <MarketPositionAssessment deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="operational" className="border rounded-lg">
                    <AccordionTrigger className="px-4 text-lg font-semibold hover:no-underline">
                      Operational Excellence
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <OperationalExcellenceAssessment deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="growth" className="border rounded-lg">
                    <AccordionTrigger className="px-4 text-lg font-semibold hover:no-underline">
                      Growth Potential
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <GrowthPotentialAssessment deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="risk" className="border rounded-lg">
                    <AccordionTrigger className="px-4 text-lg font-semibold hover:no-underline">
                      Risk Assessment
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <RiskAssessmentSection deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="timing" className="border rounded-lg">
                    <AccordionTrigger className="px-4 text-lg font-semibold hover:no-underline">
                      Strategic Timing
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <StrategicTimingAssessment deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="trust" className="border rounded-lg">
                    <AccordionTrigger className="px-4 text-lg font-semibold hover:no-underline">
                      Trust & Transparency
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <TrustTransparencyAssessment deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <Accordion type="multiple" className="w-full space-y-4" defaultValue={["thesis", "market", "team", "product", "traction"]}>
                  <AccordionItem value="thesis" className="border rounded-lg">
                    <AccordionTrigger className="px-4 text-lg font-semibold hover:no-underline">
                      Thesis Alignment
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <ThesisAlignmentSection deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="market" className="border rounded-lg">
                    <AccordionTrigger className="px-4 text-lg font-semibold hover:no-underline">
                      Market Opportunity
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <MarketOpportunityAssessment deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="team" className="border rounded-lg">
                    <AccordionTrigger className="px-4 text-lg font-semibold hover:no-underline">
                      Founder & Team Strength
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <FounderTeamStrengthAssessment deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="product" className="border rounded-lg">
                    <AccordionTrigger className="px-4 text-lg font-semibold hover:no-underline">
                      Product & IP Moat
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <ProductIPMoatAssessment deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="traction" className="border rounded-lg">
                    <AccordionTrigger className="px-4 text-lg font-semibold hover:no-underline">
                      Traction & Financial Feasibility
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <TractionFinancialFeasibilityAssessment deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </TabsContent>
          )}

          <TabsContent value="documents" className="space-y-6">
            <DocumentManager
              dealId={deal.id}
              companyName={deal.company_name}
            />
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <DealNotesManager
              dealId={deal.id}
              companyName={deal.company_name}
            />
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
  );
}