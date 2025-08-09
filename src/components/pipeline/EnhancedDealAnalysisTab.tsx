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
import { useAIService } from '@/hooks/useAIService';
import { useToast } from '@/hooks/use-toast';

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

  const handleRunComprehensiveAnalysis = async () => {
    try {
      const result = await runOrchestrator(deal.id);
      if (result.data) {
        toast({
          title: "Analysis Complete",
          description: "Comprehensive AI analysis has been updated",
        });
        onDealUpdated?.();
      } else {
        toast({
          title: "Analysis Failed",
          description: result.error || "Analysis could not be completed",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleEnrichCompany = async () => {
    try {
      const result = await enrichCompany(deal.id, deal.company_name, deal.website);
      if (result.data) {
        toast({
          title: "Company Enriched",
          description: "Company data has been enhanced with external sources",
        });
        onDealUpdated?.();
      }
    } catch (error) {
      console.error('Enrichment failed:', error);
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

  // Analysis In Progress fallback
  if (!deal.enhanced_analysis) {
    return (
      <div className="space-y-6">
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
                <h3 className="text-lg font-semibold text-foreground">Analysis Ready to Start</h3>
                <p className="text-muted-foreground">
                  Click "Full Analysis" above to run comprehensive AI analysis with 5 specialized engines and data enrichment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate overall analysis score - this becomes the unified source of truth
  const getAnalysisScore = () => {
    if (!analysis.rubric_breakdown) return deal.overall_score || 0;
    const totalWeight = analysis.rubric_breakdown.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) return deal.overall_score || 0;
    const weightedScore = analysis.rubric_breakdown.reduce(
      (sum, item) => sum + (item.score * item.weight / totalWeight), 0
    );
    return Math.round(weightedScore);
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
              <RubricScoreRadar rubricBreakdown={analysis.rubric_breakdown || []} fundType="vc" />
            </CardContent>
          </Card>

          {/* Detailed Rubric Breakdown */}
          <div className="grid gap-4">
            {(analysis.rubric_breakdown || []).map((item, index) => (
              <Card key={index} className="card-xero">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize text-foreground">
                      {item.category.replace(/_/g, ' ')}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {item.score}/100
                      </Badge>
                      <Badge variant="outline">
                        Weight: {item.weight}%
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={`${
                          item.confidence >= 80 ? 'text-success' :
                          item.confidence >= 60 ? 'text-warning' :
                          'text-destructive'
                        }`}
                      >
                        {item.confidence}% confidence
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-medium text-foreground">{item.score}/100</span>
                    </div>
                    <Progress 
                      value={item.score} 
                      className="h-2"
                    />
                  </div>

                  {/* Key Insights */}
                  {item.insights && item.insights.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-muted-foreground" />
                        Key Insights
                      </h4>
                      <ul className="space-y-1">
                        {item.insights.map((insight, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strengths and Concerns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.strengths && item.strengths.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {item.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-success flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-success rounded-full mt-2 flex-shrink-0" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.concerns && item.concerns.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-warning mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Concerns
                        </h4>
                        <ul className="space-y-1">
                          {item.concerns.map((concern, i) => (
                            <li key={i} className="text-sm text-warning flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
                {Object.entries(analysis.analysis_engines || {}).map(([engineName, engine]) => (
                  <div 
                    key={engineName} 
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        engine.status === 'complete' ? 'bg-success' :
                        engine.status === 'partial' ? 'bg-warning' :
                        engine.status === 'pending' ? 'bg-primary' :
                        'bg-destructive'
                      }`} />
                      <div>
                        <h4 className="font-semibold text-foreground capitalize">
                          {engineName.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Last run: {engine.last_run ? format(new Date(engine.last_run), 'MMM dd, yyyy') : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={`${
                            engine.status === 'complete' ? 'text-success' :
                            engine.status === 'partial' ? 'text-warning' :
                            engine.status === 'pending' ? 'text-primary' :
                            'text-destructive'
                          }`}
                        >
                          {engine.status}
                        </Badge>
                        <span className="text-lg font-bold text-foreground">
                          {engine.score || 0}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {engine.confidence || 0}% confidence
                      </div>
                    </div>
                  </div>
                ))}
                
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