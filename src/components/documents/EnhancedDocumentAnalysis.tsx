import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Download,
  Eye,
  Zap,
  Target,
  Users,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';

interface DocumentAnalysisProps {
  dealId: string;
  documentId?: string;
  companyName: string;
}

interface AnalysisResult {
  id: string;
  financial_score?: number;
  market_score?: number;
  product_score?: number;
  leadership_score?: number;
  thesis_alignment_score?: number;
  engine_results?: any;
  confidence_scores?: any;
  analyzed_at: string;
  document_insights?: any;
}

export function EnhancedDocumentAnalysis({ dealId, documentId, companyName }: DocumentAnalysisProps) {
  const { toast } = useToast();
  const { getRAGCategory } = useStrategyThresholds();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [documentInsights, setDocumentInsights] = useState<any>(null);

  useEffect(() => {
    loadExistingAnalysis();
  }, [dealId, documentId]);

  const loadExistingAnalysis = async () => {
    try {
      // Fetch latest comprehensive analysis for the deal
      const { data: analysisData, error } = await supabase
        .from('deal_analyses')
        .select('*')
        .eq('deal_id', dealId)
        .order('analyzed_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (analysisData && analysisData.length > 0) {
        const latestAnalysis = analysisData[0];
        setAnalysis(latestAnalysis);
        
        // Extract document-specific insights if available
        if (latestAnalysis.engine_results && typeof latestAnalysis.engine_results === 'object') {
          const engineResults = latestAnalysis.engine_results as any;
          if (engineResults.document_analysis) {
            setDocumentInsights(engineResults.document_analysis);
          }
        }
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
    }
  };

  const performDocumentAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Use the document processor for focused document analysis
      const { data, error } = await supabase.functions.invoke('document-processor', {
        body: { 
          dealId,
          documentId,
          analysisType: 'comprehensive',
          includeFinancials: true,
          includeMarketAnalysis: true,
          includeTechnicalAnalysis: true
        }
      });

      if (error) throw error;

      // Process and store the analysis results
      const analysisResult = data?.analysis || data;
      
      // Update deal analysis with document insights
      const { data: updatedAnalysis, error: updateError } = await supabase
        .from('deal_analyses')
        .upsert({
          deal_id: dealId,
          document_insights: analysisResult,
          analyzed_at: new Date().toISOString(),
          analysis_version: 1
        })
        .select()
        .single();

      if (updateError) throw updateError;

      setAnalysis(updatedAnalysis);
      setDocumentInsights(analysisResult);
      
      toast({
        title: "Analysis Complete",
        description: "Document analysis has been completed and integrated",
      });
    } catch (error) {
      console.error('Error performing analysis:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score?: number) => {
    if (!score) return 'bg-muted';
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              ReubenAI Document Analysis
            </CardTitle>
            <div className="flex gap-2">
              {!isAnalyzing && (
                <Button 
                  onClick={performDocumentAnalysis}
                  variant="outline"
                  size="sm"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Analyze Documents
                </Button>
              )}
              {isAnalyzing && (
                <Button disabled size="sm">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                  Analyzing...
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {isAnalyzing && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Processing documents and extracting insights...</span>
              </div>
              <Progress value={33} className="w-full" />
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Document parsing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full" />
                  <span>Financial analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Market assessment</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Key Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analysis Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Financial', score: analysis.financial_score, icon: DollarSign },
                  { label: 'Market', score: analysis.market_score, icon: Target },
                  { label: 'Product', score: analysis.product_score, icon: Zap },
                  { label: 'Leadership', score: analysis.leadership_score, icon: Users },
                  { label: 'Thesis Fit', score: analysis.thesis_alignment_score, icon: CheckCircle }
                ].map((metric) => (
                  <div key={metric.label} className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <metric.icon className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm font-medium">{metric.label}</span>
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {metric.score ? getRAGCategory(metric.score).label : 'N/A'}
                    </div>
                    {metric.score && (
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${getScoreBadgeColor(metric.score)}`}
                          style={{ width: `${metric.score}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Document Insights */}
          {documentInsights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {documentInsights.key_findings && (
                  <div>
                    <h4 className="font-medium mb-2">Key Findings</h4>
                    <ul className="space-y-1">
                      {documentInsights.key_findings.map((finding: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator />

                {documentInsights.financial_highlights && (
                  <div>
                    <h4 className="font-medium mb-2">Financial Highlights</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(documentInsights.financial_highlights).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {documentInsights.risks && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Risk Factors</h4>
                    <ul className="space-y-1">
                      {documentInsights.risks.map((risk: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {documentInsights.opportunities && (
                  <div>
                    <h4 className="font-medium mb-2 text-green-600">Opportunities</h4>
                    <ul className="space-y-1">
                      {documentInsights.opportunities.map((opportunity: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Confidence Levels */}
          {analysis.confidence_scores && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Analysis Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analysis.confidence_scores).map(([category, confidence]: [string, any]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{category.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={confidence} className="w-20" />
                        <span className="text-sm font-medium w-10">{confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Summary */}
          {analysis.engine_results?.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.engine_results.summary}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No Analysis State */}
      {!analysis && !isAnalyzing && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Brain className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Analysis Available</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Run ReubenAI analysis to extract insights from documents and assess {companyName}
            </p>
            <Button onClick={performDocumentAnalysis}>
              <Zap className="h-4 w-4 mr-2" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}