import React, { useState, useEffect } from 'react';
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
import { ReubenAISummaryScore } from '@/components/analysis/ReubenAISummaryScore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  const [isEnriching, setIsEnriching] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const { toast } = useToast();
  const { getRAGCategory } = useStrategyThresholds();
  const { canViewActivities, canViewAnalysis, role, loading } = usePermissions();
  
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
    }
  }, [deal?.id, open]);

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

  const enrichCompanyData = async () => {
    if (!deal || isEnriching) return;

    setIsEnriching(true);
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
            fundType: 'vc', // This should come from fund data
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
          fund_type: 'vc',
          focus_areas: ['Technology', 'Growth potential', 'Market opportunity'],
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
      
      // Force refresh
      setTimeout(() => {
        onDealUpdated?.();
        loadEnhancedData();
      }, 1000);

      toast({
        title: "🎯 Comprehensive Analysis Complete",
        description: `Successfully analyzed ${deal.company_name} using ${Object.keys(engines).length} AI engines`,
      });

    } catch (error) {
      console.error('Comprehensive analysis failed:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to complete comprehensive analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnriching(false);
    }
  };

  if (!deal) return null;

  const formatAmount = (amount?: number, currency: string = 'USD') => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: amount >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(amount);
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

        <Tabs defaultValue="overview" className="w-full">
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
          

          <TabsContent value="overview" className="space-y-6">
            {/* Executive Summary */}
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-muted/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Building2 className="h-6 w-6 text-primary" />
                  Executive Summary
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={enrichCompanyData}
                    disabled={isEnriching}
                    className="ml-auto"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isEnriching ? 'animate-spin' : ''}`} />
                    Enrich Data
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border bg-background">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Deal Size</p>
                        <p className="font-semibold text-lg text-foreground">
                          {formatAmount(deal.deal_size, deal.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-background">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valuation</p>
                        <p className="font-semibold text-lg text-foreground">
                          {formatAmount(deal.valuation, deal.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-background">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">AI Score</p>
                        {(() => {
                          // Calculate simple average: total scores divided by 5
                          let finalScore = deal.overall_score;
                          
                          // If we have assessment components, calculate simple average
                          if (deal.enhanced_analysis && 
                              typeof deal.enhanced_analysis === 'object' &&
                              'rubric_breakdown' in deal.enhanced_analysis &&
                              Array.isArray(deal.enhanced_analysis.rubric_breakdown)) {
                            const rubricBreakdown = deal.enhanced_analysis.rubric_breakdown as any[];
                            if (rubricBreakdown.length > 0) {
                              const totalScore = rubricBreakdown.reduce((sum, item) => sum + (item.score || 0), 0);
                              finalScore = Math.round(totalScore / rubricBreakdown.length);
                            }
                          }
                          
                          return (
                            <p className="font-semibold text-lg text-foreground">
                              {finalScore || 'Pending'}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Company Details
                    </h4>
                    {deal.industry && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Industry</p>
                          <p className="text-sm text-muted-foreground">{deal.industry}</p>
                        </div>
                      </div>
                    )}
                    {deal.location && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Location</p>
                          <p className="text-sm text-muted-foreground">{deal.location}</p>
                        </div>
                      </div>
                    )}
                    {deal.founder && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Founder</p>
                          <p className="text-sm text-muted-foreground">{deal.founder}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Digital Presence
                    </h4>
                    {deal.website && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Website</p>
                          <a 
                            href={deal.website.startsWith('http') ? deal.website : `https://${deal.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {deal.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>
                    )}
                    {deal.linkedin_url && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">LinkedIn</p>
                          <a 
                            href={deal.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Company Profile
                          </a>
                        </div>
                      </div>
                    )}
                    {(deal.employee_count || companyDetails?.team_size) && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Team Size</p>
                          <p className="text-sm text-muted-foreground">
                            {companyDetails?.team_size || deal.employee_count} employees
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Description */}
            {(deal.description || companyDetails?.description) && (
              <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-muted/30">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="h-6 w-6 text-primary" />
                    Company Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {companyDetails?.description || deal.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>


          {canViewAnalysis && (
            <TabsContent value="analysis" className="space-y-6">
              {/* Beta Notice */}
              <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="p-4">
                  <p className="text-sm text-foreground">
                    <strong>Beta v1 Notice:</strong> New data channels will be progressively made available to deep individual criteria and category assessments. To request a specific dataset or data type, please submit a request via the Feedback widget.
                  </p>
                </CardContent>
              </Card>
              
              {/* Assessment Sections with Accordion */}
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