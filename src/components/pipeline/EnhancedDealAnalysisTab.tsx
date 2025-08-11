import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Brain,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  BarChart3,
  Zap,
  FileText,
  Users,
  DollarSign,
  Gauge,
  RefreshCw,
  ExternalLink,
  Shield,
  Database
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { RubricScoreRadar } from './RubricScoreRadar';
import { FundTypeAnalysisPanel } from './FundTypeAnalysisPanel';
import { ScoringMethodologyCard } from './ScoringMethodologyCard';
import { EnhancedDealAnalysis, RubricBreakdown, AnalysisEngine, NotesIntelligence, FundTypeAnalysis } from '@/types/enhanced-deal-analysis';
import { CategoryDeepDiveSection } from '@/components/analysis/CategoryDeepDiveSection';
import { useAIService } from '@/hooks/useAIService';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmergencyFix } from '@/hooks/useEmergencyFix';
import { useFund } from '@/contexts/FundContext';

interface EnhancedDealAnalysisTabProps {
  deal: Deal & { enhanced_analysis?: EnhancedDealAnalysis };
  onDealUpdated?: () => void;
}

export function EnhancedDealAnalysisTab({ deal, onDealUpdated }: EnhancedDealAnalysisTabProps) {
  const analysis = deal.enhanced_analysis;
  const { 
    analyzeCompany, 
    enrichCompany, 
    runOrchestrator, 
    researchCompany,
    isLoading, 
    currentStage 
  } = useAIService();
  const { toast } = useToast();
  const { canTriggerAnalysis } = usePermissions();
  const { triggerEmergencyFix } = useEmergencyFix();
  const { selectedFund } = useFund();

  // Get fund type, defaulting to 'vc' for backward compatibility
  const fundType = selectedFund?.fund_type === 'private_equity' ? 'pe' : 'vc';

  const handleRunComprehensiveAnalysis = async () => {
    console.log('🔄 Triggering comprehensive analysis for deal:', deal.id);
    try {
      const result = await runOrchestrator(deal.id);
      console.log('Orchestrator result:', result);
      if (result.data) {
        toast({
          title: "Analysis Complete",
          description: "Comprehensive AI analysis has been updated",
        });
        onDealUpdated?.();
      } else {
        console.error('Analysis failed - orchestrator returned:', result);
        toast({
          title: "Analysis Failed",
          description: result.error || "Analysis could not be completed",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Analysis failed with error:', error);
      toast({
        title: "Analysis Error", 
        description: "An error occurred during analysis. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEnrichCompany = async () => {
    console.log('🔍 Triggering company enrichment for:', deal.company_name);
    try {
      const result = await enrichCompany(deal.id, deal.company_name, deal.website);
      console.log('Enrichment result:', result);
      if (result.data) {
        toast({
          title: "Company Enriched",
          description: "Company data has been enhanced with external sources",
        });
        onDealUpdated?.();
      } else {
        console.error('Enrichment failed - no data returned:', result);
        toast({
          title: "Enrichment Warning",
          description: result.error || "Company enrichment completed with limited data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Enrichment failed with error:', error);
      toast({
        title: "Enrichment Failed",
        description: "Unable to enrich company data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleWebResearch = async () => {
    try {
      const result = await researchCompany(deal.id, 'comprehensive');
      if (result.data) {
        toast({
          title: "Research Complete",
          description: "Web research has been added to the analysis",
        });
        onDealUpdated?.();
      }
    } catch (error) {
      console.error('Research failed:', error);
    }
  };

  // Check if analysis is incomplete (has partial data but missing core components)
  const isAnalysisIncomplete = analysis && (!analysis.rubric_breakdown || !analysis.analysis_engines || Object.keys(analysis.analysis_engines || {}).length === 0);

  // Show control panel for null analysis OR incomplete analysis (for authorized users only)
  if (!analysis || (isAnalysisIncomplete && canTriggerAnalysis)) {
    return (
      <div className="space-y-6">
        {canTriggerAnalysis ? (
          <>
            {/* Enhanced Analysis Control Panel */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Analysis Control Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={handleRunComprehensiveAnalysis}
                    disabled={isLoading}
                    className="h-auto p-4 flex flex-col items-start gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      <span className="font-medium">Full Analysis</span>
                    </div>
                    <span className="text-xs opacity-80">
                      Run all 5 specialized engines
                    </span>
                  </Button>

                  <Button 
                    onClick={handleEnrichCompany}
                    disabled={isLoading}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span className="font-medium">Enrich Data</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Add Coresignal company data
                    </span>
                  </Button>

                  <Button 
                    onClick={handleWebResearch}
                    disabled={isLoading}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      <span className="font-medium">Web Research</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Gather latest market intel
                    </span>
                  </Button>
                </div>

                {/* Emergency Fix Button (for development) */}
                <div className="mt-4 pt-4 border-t border-border">
                  <Button 
                    onClick={async () => {
                      const success = await triggerEmergencyFix();
                      if (success) {
                        onDealUpdated?.();
                      }
                    }}
                    disabled={isLoading}
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Emergency Fix (Beta v1)
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Fixes analysis data display issues for beta testing
                  </p>
                </div>

                {isLoading && currentStage && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{currentStage}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-xero border-warning/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-warning" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {isAnalysisIncomplete ? 'Analysis Incomplete' : 'Analysis Ready to Start'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isAnalysisIncomplete 
                        ? 'This deal has partial analysis data. Click "Full Analysis" to complete the comprehensive analysis with all 5 specialized engines.'
                        : 'Click "Full Analysis" above to run comprehensive AI analysis with 5 specialized engines and data enrichment.'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="card-xero border-muted/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Analysis Pending</h3>
                  <p className="text-muted-foreground">
                    Analysis has not been completed for this deal yet. Contact your fund manager or analyst to request analysis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // UNIFIED SCORING SYSTEM - Single source of truth from rubric_breakdown
  const getAnalysisScore = () => {
    console.log('🔍 Unified scoring system - Analysis data:', {
      hasRubricBreakdown: !!(analysis.rubric_breakdown && analysis.rubric_breakdown.length > 0),
      hasAnalysisEngines: !!(analysis.analysis_engines && Object.keys(analysis.analysis_engines).length > 0),
      dealOverallScore: deal.overall_score,
      rubricScores: analysis.rubric_breakdown?.map(r => ({ category: r.category, score: r.score }))
    });

    // FIXED: Use rubric_breakdown as primary source of truth
    if (analysis.rubric_breakdown && analysis.rubric_breakdown.length > 0) {
      const validCategories = analysis.rubric_breakdown.filter(item => item.score > 0);
      
      if (validCategories.length === 0) {
        console.log('⚠️ All rubric scores are zero, using deal overall_score:', deal.overall_score);
        return deal.overall_score || 0;
      }
      
      const totalWeight = validCategories.reduce((sum, item) => sum + (item.weight || 16.67), 0);
      const weightedScore = validCategories.reduce(
        (sum, item) => sum + ((item.score || 0) * (item.weight || 16.67) / 100), 0
      );
      
      const calculatedScore = totalWeight > 0 ? Math.round(weightedScore) : (deal.overall_score || 0);
      console.log('📊 Calculated weighted score:', calculatedScore, 'from', validCategories.length, 'categories');
      return calculatedScore;
    }
    
    // Fallback to deal overall_score if rubric not available
    console.log('⚠️ No rubric breakdown, using deal overall_score:', deal.overall_score);
    return deal.overall_score || 0;
  };

  const analysisScore = getAnalysisScore();

  const getSentimentVariant = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'default';
      case 'negative': return 'destructive';
      case 'mixed': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Re-run Analysis Button for Authorized Users */}
      {canTriggerAnalysis && (
        <div className="flex justify-end">
          <Button 
            onClick={handleRunComprehensiveAnalysis}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Re-run Analysis
          </Button>
        </div>
      )}

      {/* Executive Summary Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="card-xero">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                <p className="text-3xl font-bold text-foreground">{analysisScore}</p>
              </div>
              <Gauge className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-xero">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completeness</p>
                <p className="text-3xl font-bold text-foreground">{analysis.analysis_completeness}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-xero">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sentiment</p>
                <Badge variant={getSentimentVariant(analysis.notes_intelligence?.sentiment)}>
                  {analysis.notes_intelligence?.sentiment || 'Neutral'}
                </Badge>
              </div>
              <Brain className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-xero">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm text-foreground">
                  {analysis.last_comprehensive_analysis 
                    ? format(new Date(analysis.last_comprehensive_analysis), 'MMM dd')
                    : 'N/A'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
        </CardContent>
      </Card>
      </div>

      {/* Scoring Methodology */}
      <ScoringMethodologyCard 
        rubricBreakdown={analysis.rubric_breakdown || []}
        overallScore={analysisScore}
        analysisCompleteness={analysis.analysis_completeness || 0}
      />

      {/* Comprehensive Analysis Tabs */}
      <Tabs defaultValue="rubric" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30">
          <TabsTrigger 
            value="rubric" 
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Analysis Breakdown
          </TabsTrigger>
          <TabsTrigger 
            value="engines" 
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Data Quality
          </TabsTrigger>
          <TabsTrigger 
            value="alignment" 
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Fund Alignment
          </TabsTrigger>
          <TabsTrigger 
            value="intelligence" 
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Key Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rubric" className="space-y-6">
          {/* Radar Chart */}
          <Card className="card-xero">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hierarchy-3">
                <Target className="h-5 w-5 text-muted-foreground" />
                Investment Criteria Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RubricScoreRadar rubricBreakdown={analysis.rubric_breakdown || []} fundType={fundType} />
            </CardContent>
          </Card>

           {/* CORRECTED: Enhanced Rubric Breakdown with correct detailed analysis mapping */}
           <div className="grid gap-4">
             {(analysis.rubric_breakdown && analysis.rubric_breakdown.length > 0) ? (
               analysis.rubric_breakdown.map((item, index) => {
                  // Map category names to detailed_breakdown keys correctly for 6-category VC rubric
                  const categoryKey = item.category.toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace('market_opportunity', 'market_opportunity')
                    .replace('product_&_technology', 'product_technology')
                    .replace('team_&_leadership', 'team_leadership')
                    .replace('financial_&_traction', 'financial_traction')
                    .replace('trust_&_transparency', 'trust_transparency')
                    .replace('strategic_timing', 'strategic_timing');
                 
                 return (
                   <CategoryDeepDiveSection
                     key={index}
                     category={item.category}
                     score={item.score}
                     confidence={item.confidence}
                     weight={item.weight}
                     insights={item.insights}
                     strengths={item.strengths}
                     concerns={item.concerns}
                     detailedAnalysis={(analysis as any).detailed_breakdown?.[categoryKey] || {}}
                   />
                 );
               })
             ) : (
               <Card className="card-xero">
                 <CardContent className="p-6">
                   <div className="text-center space-y-4">
                     <AlertCircle className="h-12 w-12 text-warning mx-auto" />
                     <div>
                       <h3 className="text-lg font-semibold">Analysis Data Missing</h3>
                       <p className="text-muted-foreground">
                         No rubric breakdown found. Please run comprehensive analysis.
                       </p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             )}
           </div>
        </TabsContent>

        <TabsContent value="engines" className="space-y-4">
          <Card className="card-xero">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hierarchy-3">
                <Zap className="h-5 w-5 text-muted-foreground" />
                Data Quality & Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                 {Object.entries(analysis.analysis_engines || {}).map(([engineName, engine]) => {
                   // Cast to any to handle extended engine properties
                   const engineData = engine as any;
                   const isCompleted = engineData.status === 'completed' || engineData.status === 'complete';
                   const hasRealData = engineData.analysis_data && Object.keys(engineData.analysis_data).length > 0;
                   
                   return (
                     <div 
                       key={engineName} 
                       className="flex items-center justify-between p-4 border border-border/50 rounded-lg"
                     >
                       <div className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full ${
                           isCompleted ? 'bg-success' :
                           engineData.status === 'partial' ? 'bg-warning' :
                           engineData.status === 'pending' ? 'bg-primary' :
                           'bg-destructive'
                         }`} />
                         <div>
                           <h4 className="font-semibold text-foreground capitalize">
                             {engineData.name || engineName.replace(/_/g, ' ')}
                           </h4>
                           <p className="text-sm text-muted-foreground">
                             Last run: {engineData.last_updated || engineData.last_run ? 
                               format(new Date(engineData.last_updated || engineData.last_run), 'MMM dd, yyyy') : 'Never'}
                           </p>
                         </div>
                       </div>
                       <div className="text-right space-y-1">
                         <div className="flex items-center gap-2">
                           <Badge 
                             variant="outline"
                             className={`${
                               isCompleted ? 'text-success' :
                               engineData.status === 'partial' ? 'text-warning' :
                               engineData.status === 'pending' ? 'text-primary' :
                               'text-destructive'
                             }`}
                           >
                             {isCompleted && hasRealData ? 'Real Data' : engineData.status}
                          </Badge>
                           <span className="text-lg font-bold text-foreground">
                             {engineData.score || 0}
                           </span>
                         </div>
                         <div className="text-sm text-muted-foreground">
                           {engineData.confidence || 0}% confidence
                         </div>
                       </div>
                     </div>
                   );
                 })}
                
                {(!analysis.analysis_engines || Object.keys(analysis.analysis_engines).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No analysis engines have been run for this deal yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alignment" className="space-y-4">
          {analysis.fund_type_analysis ? (
            <FundTypeAnalysisPanel 
              analysis={analysis.fund_type_analysis}
            />
          ) : (
            <Card className="card-xero">
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2" />
                  <p>Fund alignment analysis not available for this deal.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          {analysis.notes_intelligence ? (
            <div className="grid gap-4">
              {/* Sentiment Analysis */}
              <Card className="card-xero">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-hierarchy-3">
                    <Brain className="h-5 w-5 text-muted-foreground" />
                    Sentiment Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Badge 
                      variant={getSentimentVariant(analysis.notes_intelligence.sentiment)}
                      className="text-sm px-3 py-1"
                    >
                      {analysis.notes_intelligence.sentiment}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Confidence: {analysis.notes_intelligence.confidence_level}%
                    </span>
                  </div>
                  
                  <Progress 
                    value={analysis.notes_intelligence.confidence_level} 
                    className="h-2"
                  />
                </CardContent>
              </Card>

              {/* Key Insights */}
              {analysis.notes_intelligence.key_insights && analysis.notes_intelligence.key_insights.length > 0 && (
                <Card className="card-xero">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-hierarchy-3">
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.notes_intelligence.key_insights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Risk Flags */}
              {analysis.notes_intelligence.risk_flags && analysis.notes_intelligence.risk_flags.length > 0 && (
                <Card className="card-xero">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-hierarchy-3">
                      <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                      Risk Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.notes_intelligence.risk_flags.map((flag, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-destructive rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-destructive">{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Trend Indicators */}
              {analysis.notes_intelligence.trend_indicators && analysis.notes_intelligence.trend_indicators.length > 0 && (
                <Card className="card-xero">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-hierarchy-3">
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                      Trend Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.notes_intelligence.trend_indicators.map((trend, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{trend}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="card-xero">
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p>No intelligence data available for this deal yet.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}