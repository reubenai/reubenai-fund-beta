import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Bot, TrendingUp, Clock, CheckCircle, AlertCircle, Database, FileText, Download } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { useReubenAIData } from '@/hooks/useReubenAIData';
import { toTemplateFundType, type AnyFundType } from '@/utils/fundTypeConversion';
import { exportReubenAnalysisToPDF, type ReubenAnalysisData } from '@/utils/pdfClient';
import { toast } from 'sonner';

interface ReubenAISummaryScoreEnhancedProps {
  deal: Deal;
  fundType: AnyFundType;
  onScoreCalculated?: (score: number) => void;
}

const getOverallStatusColor = (score: number): string => {
  if (score >= 120) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (score >= 100) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (score >= 80) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (score >= 60) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

const getOverallStatusLabel = (score: number): string => {
  if (score >= 120) return 'Exceptional';
  if (score >= 100) return 'Strong';
  if (score >= 80) return 'Promising';
  if (score >= 60) return 'Developing';
  return 'Needs Work';
};

const CategorySection = ({ 
  title, 
  summary, 
  dataPoints, 
  vcDataPoints 
}: { 
  title: string;
  summary?: string;
  dataPoints: { key: string; label: string }[];
  vcDataPoints?: any;
}) => {
  return (
    <Card className="w-full border-l-4 border-l-primary/30">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          {title}
        </CardTitle>
        {summary && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-l-primary/50">
            <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-8">
        {dataPoints.map(({ key, label }) => {
          const analysisText = vcDataPoints?.[key];
          
          return (
            <div key={key} className="space-y-3 pb-6 border-b border-border/50 last:border-b-0 last:pb-0">
              <h4 className="text-sm font-medium text-foreground">{label}</h4>
              <div className="bg-background/80 p-6 rounded-lg border">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {analysisText || 'No analysis available for this criterion.'}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export function ReubenAISummaryScoreEnhanced({ deal, fundType, onScoreCalculated }: ReubenAISummaryScoreEnhancedProps) {
  const { data, isLoading, error } = useReubenAIData(deal, fundType);
  const [isExporting, setIsExporting] = useState(false);

  // Define category configurations
  const categories = [
    {
      title: "Team & Leadership",
      summary: data?.scoringResults?.team_leadership_summary,
      dataPoints: [
        { key: "founder_experience", label: "Founder Experience" },
        { key: "team_composition", label: "Team Composition" },
        { key: "vision_communication", label: "Vision & Communication" }
      ]
    },
    {
      title: "Market Opportunity", 
      summary: data?.scoringResults?.market_opportunity_summary,
      dataPoints: [
        { key: "market_size", label: "Market Size" },
        { key: "market_timing", label: "Market Timing" },
        { key: "competitive_landscape", label: "Competitive Landscape" }
      ]
    },
    {
      title: "Product & Technology",
      summary: data?.scoringResults?.product_technology_summary,
      dataPoints: [
        { key: "product_innovation", label: "Product Innovation" },
        { key: "technology_advantage", label: "Technology Advantage" },
        { key: "product_market_fit", label: "Product-Market Fit" }
      ]
    },
    {
      title: "Business Traction",
      summary: data?.scoringResults?.business_traction_summary,
      dataPoints: [
        { key: "revenue_growth", label: "Revenue Growth" },
        { key: "customer_metrics", label: "Customer Metrics" },
        { key: "market_validation", label: "Market Validation" }
      ]
    },
    {
      title: "Financial Health",
      summary: data?.scoringResults?.financial_planning_summary,
      dataPoints: [
        { key: "financial_performance", label: "Financial Performance" },
        { key: "capital_efficiency", label: "Capital Efficiency" },
        { key: "financial_planning", label: "Financial Planning" }
      ]
    },
    {
      title: "Strategic Fit",
      summary: data?.scoringResults?.investment_strategy_summary,
      dataPoints: [
        { key: "portfolio_synergies", label: "Portfolio Synergies" },
        { key: "investment_thesis_alignment", label: "Investment Thesis Alignment" },
        { key: "value_creation_potential", label: "Value Creation Potential" }
      ]
    }
  ];

  const handleExportPDF = async () => {
    if (!data?.scoringResults || !data?.dataPoints) {
      toast.error('No analysis data available to export');
      return;
    }

    setIsExporting(true);
    try {
      const reubenData: ReubenAnalysisData = {
        companyName: deal.company_name,
        overallScore: data.scoringResults.overall_score,
        executiveSummary: data.scoringResults.deal_executive_summary || 'No executive summary available.',
        confidenceScore: data.scoringResults.confidence_score,
        analysisDate: new Date().toLocaleDateString(),
        categories: categories.map(category => ({
          title: category.title,
          summary: category.summary,
          subcriteria: category.dataPoints.map(({ key, label }) => ({
            label,
            content: data.dataPoints[key] || 'No analysis available for this criterion.'
          }))
        }))
      };

      await exportReubenAnalysisToPDF(reubenData);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  React.useEffect(() => {
    if (data.scoringResults?.overall_score) {
      onScoreCalculated?.(data.scoringResults.overall_score);
    }
  }, [data.scoringResults?.overall_score, onScoreCalculated]);

  if (isLoading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading ReubenAI data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">Error loading data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const templateFundType = toTemplateFundType(fundType);
  const fundTypeLabel = templateFundType === 'vc' ? 'VC' : 'PE';

  // Processing state when we have data points but no analysis yet
  if (data.isProcessing || (!data.scoringResults?.overall_score && data.hasData)) {
    return (
      <Card className="border-2 border-amber-200 bg-gradient-to-r from-background to-amber-50/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-6 w-6 text-primary" />
            Reuben Analysis
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <div className="animate-pulse">
                <Clock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium">Reuben is processing your deal</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                We're analyzing your deal data using our {fundTypeLabel} investment framework. 
                This typically takes 2-5 minutes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data available
  if (!data.hasData) {
    return (
      <Card className="border-2 border-muted bg-gradient-to-r from-background to-muted/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-6 w-6 text-primary" />
            Reuben Analysis
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
            <p className="text-sm text-muted-foreground">
              Reuben analysis hasn't been run for this deal yet. 
              Data enrichment and analysis can be triggered through the admin tools.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show completed analysis
  const overallScore = data.scoringResults?.overall_score || 0;
  const executiveSummary = data.scoringResults?.deal_executive_summary;
  const scoringResults = data.scoringResults;

  return (
    <div className="space-y-6">
      {/* Top Section - Key Insights */}
        <Card className="w-full border-l-4 border-l-primary">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Reuben AI Analysis
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comprehensive Investment Assessment
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExportPDF}
                disabled={isExporting || !data?.scoringResults}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
            </div>
          </CardHeader>
        
        <CardContent>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">{overallScore}</p>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getOverallStatusColor(overallScore)} text-base px-3 py-1`}
                >
                  {getOverallStatusLabel(overallScore)}
                </Badge>
              </div>
              
              {executiveSummary && (
                <div className="p-4 rounded-lg bg-background border">
                  <h4 className="text-sm font-medium mb-2">Executive Summary</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {executiveSummary}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <Progress 
                value={Math.min((overallScore / 150) * 100, 100)} 
                className="w-32 h-3" 
              />
              {scoringResults?.confidence_score && (
                <span className="text-xs text-muted-foreground">
                  {scoringResults.confidence_score}% confidence
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Detailed Category Sections */}
      <div className="space-y-6">
        {categories.map((category, index) => (
          <CategorySection
            key={index}
            title={category.title}
            summary={category.summary}
            dataPoints={category.dataPoints}
            vcDataPoints={data.dataPoints}
          />
        ))}
      </div>

      {/* Analysis Metadata */}
      {scoringResults?.analyzed_at && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Analysis completed: {new Date(scoringResults.analyzed_at).toLocaleString()}</span>
              {scoringResults.confidence_score && (
                <span>Confidence: {scoringResults.confidence_score}%</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}