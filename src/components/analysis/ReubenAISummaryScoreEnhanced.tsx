import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, TrendingUp, Database, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { useReubenAIData } from '@/hooks/useReubenAIData';
import { toTemplateFundType, type AnyFundType } from '@/utils/fundTypeConversion';

interface ReubenAISummaryScoreEnhancedProps {
  deal: Deal;
  fundType: AnyFundType;
  onScoreCalculated?: (score: number) => void;
}

const getOverallStatusColor = (score: number): string => {
  if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (score >= 70) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (score >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (score >= 50) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

const getOverallStatusLabel = (score: number): string => {
  if (score >= 80) return 'Exceptional';
  if (score >= 70) return 'Strong';
  if (score >= 60) return 'Promising';
  if (score >= 50) return 'Developing';
  return 'Needs Work';
};

const formatDataPoint = (key: string, value: any): { label: string; displayValue: string } => {
  const formatters: Record<string, (val: any) => { label: string; displayValue: string }> = {
    tam: (val) => ({ label: 'Total Addressable Market', displayValue: `$${(val / 1000000).toFixed(0)}M` }),
    sam: (val) => ({ label: 'Serviceable Addressable Market', displayValue: `$${(val / 1000000).toFixed(0)}M` }),
    som: (val) => ({ label: 'Serviceable Obtainable Market', displayValue: `$${(val / 1000000).toFixed(0)}M` }),
    cagr: (val) => ({ label: 'Market Growth Rate (CAGR)', displayValue: `${val}%` }),
    employee_count: (val) => ({ label: 'Employee Count', displayValue: val.toString() }),
    retention_rate: (val) => ({ label: 'Customer Retention Rate', displayValue: `${val}%` }),
    ltv_cac_ratio: (val) => ({ label: 'LTV/CAC Ratio', displayValue: `${val}:1` }),
    revenue_current: (val) => ({ label: 'Current Revenue', displayValue: `$${(val / 1000000).toFixed(1)}M` }),
    revenue_growth_rate: (val) => ({ label: 'Revenue Growth Rate', displayValue: `${val}%` }),
    ebitda_margin: (val) => ({ label: 'EBITDA Margin', displayValue: `${val}%` }),
    market_share: (val) => ({ label: 'Market Share', displayValue: `${val}%` }),
    business_model: (val) => ({ label: 'Business Model', displayValue: val }),
    funding_stage: (val) => ({ label: 'Funding Stage', displayValue: val }),
  };

  const formatter = formatters[key];
  if (formatter) {
    return formatter(value);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return { label, displayValue: value.slice(0, 3).join(', ') + (value.length > 3 ? '...' : '') };
  }

  // Default formatting
  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return { label, displayValue: value?.toString() || 'N/A' };
};

const getCriteriaFromStrategy = (strategy: any, fundType: string) => {
  if (!strategy?.enhanced_criteria) return [];

  const criteria = strategy.enhanced_criteria;
  const templateFundType = fundType === 'venture_capital' ? 'vc' : 'pe';

  if (templateFundType === 'vc') {
    return [
      { key: 'founder_experience', label: 'Founder Experience', weight: criteria.founder_experience?.weight || 15 },
      { key: 'team_composition', label: 'Team Composition', weight: criteria.team_composition?.weight || 15 },
      { key: 'market_size', label: 'Market Size', weight: criteria.market_size?.weight || 20 },
      { key: 'market_timing', label: 'Market Timing', weight: criteria.market_timing?.weight || 15 },
      { key: 'product_innovation', label: 'Product Innovation', weight: criteria.product_innovation?.weight || 15 },
      { key: 'revenue_growth', label: 'Revenue Growth', weight: criteria.revenue_growth?.weight || 10 },
      { key: 'investment_thesis_alignment', label: 'Investment Thesis Alignment', weight: criteria.investment_thesis_alignment?.weight || 10 },
    ];
  } else {
    return [
      { key: 'financial_performance', label: 'Financial Performance', weight: 25 },
      { key: 'operational_excellence', label: 'Operational Excellence', weight: 20 },
      { key: 'market_position', label: 'Market Position', weight: 20 },
      { key: 'management_quality', label: 'Management Quality', weight: 15 },
      { key: 'growth_potential', label: 'Growth Potential', weight: 10 },
      { key: 'strategic_fit', label: 'Strategic Fit', weight: 10 },
    ];
  }
};

export function ReubenAISummaryScoreEnhanced({ deal, fundType, onScoreCalculated }: ReubenAISummaryScoreEnhancedProps) {
  const { data, isLoading, error, refetch } = useReubenAIData(deal, fundType);

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
            ReubenAI Analysis
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <div className="animate-pulse">
                <Clock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium">ReubenAI is processing your deal</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                We're analyzing your deal data using our {fundTypeLabel} investment framework. 
                This typically takes 2-5 minutes. We'll let you know once it's completed.
              </p>
              {data.lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  Data last updated: {new Date(data.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Show available data points while processing */}
          {data.dataPoints && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Available Data Points
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(data.dataPoints)
                  .filter(([key, value]) => 
                    value !== null && 
                    value !== undefined && 
                    !['id', 'deal_id', 'created_at', 'updated_at', 'data_completeness_score', 'source_engines'].includes(key)
                  )
                  .slice(0, 6)
                  .map(([key, value]) => {
                    const { label, displayValue } = formatDataPoint(key, value);
                    return (
                      <div key={key} className="p-3 rounded-lg border bg-muted/30">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium">{displayValue}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
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
            ReubenAI Analysis
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
            <p className="text-sm text-muted-foreground">
              ReubenAI analysis hasn't been run for this deal yet. 
              Data enrichment and analysis can be triggered through the admin tools.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show completed analysis
  const overallScore = data.scoringResults?.overall_score || 0;
  const criteria = getCriteriaFromStrategy(data.strategy, fundType);

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-muted/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Bot className="h-6 w-6 text-primary" />
          ReubenAI Summary Score
          <CheckCircle className="h-5 w-5 text-emerald-500" />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Score Display */}
        <div className="flex items-center justify-between p-6 rounded-lg border-2 bg-background">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overallScore}/100</p>
              <p className="text-sm text-muted-foreground">
                {fundTypeLabel} Analysis Score
              </p>
              {data.scoringResults?.analysis_summary && (
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  {data.scoringResults.analysis_summary}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <Badge 
              variant="outline" 
              className={`${getOverallStatusColor(overallScore)} text-lg px-4 py-2 mb-3`}
            >
              {getOverallStatusLabel(overallScore)}
            </Badge>
            <div className="flex items-center gap-3">
              <Progress value={overallScore} className="w-32 h-3" />
              <span className="text-lg font-semibold text-primary">{overallScore}%</span>
            </div>
          </div>
        </div>

        {/* Data Points Section */}
        {data.dataPoints && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Key Data Points
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.dataPoints)
                .filter(([key, value]) => 
                  value !== null && 
                  value !== undefined && 
                  !['id', 'deal_id', 'created_at', 'updated_at', 'data_completeness_score', 'source_engines'].includes(key)
                )
                .slice(0, 9)
                .map(([key, value]) => {
                  const { label, displayValue } = formatDataPoint(key, value);
                  return (
                    <div key={key} className="p-3 rounded-lg border bg-muted/30">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium">{displayValue}</p>
                    </div>
                  );
                })}
            </div>
            {data.dataPoints.data_completeness_score && (
              <div className="text-xs text-muted-foreground">
                Data completeness: {data.dataPoints.data_completeness_score}%
                {data.dataPoints.source_engines && (
                  <span> • Sources: {data.dataPoints.source_engines.join(', ')}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Criteria Scoring */}
        {criteria.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {fundTypeLabel} Investment Criteria
            </h4>
            
            <div className="grid gap-4">
              {criteria.map((criterion) => {
                const scoreKey = `${criterion.key}_score`;
                const summaryKey = `${criterion.key}_summary`;
                const score = data.scoringResults?.[scoreKey as keyof typeof data.scoringResults] as number;
                const summary = data.scoringResults?.[summaryKey as keyof typeof data.scoringResults] as string;

                return (
                  <div key={criterion.key} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-sm text-primary">
                        {criterion.label} ({criterion.weight}%)
                      </h5>
                      {score !== undefined && score !== null && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{score}</span>
                          <Progress value={score} className="w-20 h-2" />
                        </div>
                      )}
                    </div>
                    
                    {summary ? (
                      <p className="text-xs text-muted-foreground">{summary}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        ReubenAI is processing this criterion analysis...
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Analysis Metadata */}
        {data.scoringResults && (
          <div className="p-4 rounded-lg bg-muted/30 border">
            <h4 className="font-medium text-sm mb-2">Analysis Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {data.scoringResults.confidence_score && (
                <div>
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="ml-2 font-medium">{data.scoringResults.confidence_score}%</span>
                </div>
              )}
              {data.scoringResults.analyzed_at && (
                <div>
                  <span className="text-muted-foreground">Analyzed:</span>
                  <span className="ml-2 font-medium">
                    {new Date(data.scoringResults.analyzed_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Score Interpretation */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <h4 className="font-medium text-sm mb-2">Score Interpretation</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {overallScore >= 80 && (
              <p>🎯 <strong>Exceptional opportunity</strong> - Strong performance across all {fundTypeLabel} criteria. Recommended for immediate deep dive.</p>
            )}
            {overallScore >= 70 && overallScore < 80 && (
              <p>💪 <strong>Strong candidate</strong> - Good fundamentals with high potential across key {fundTypeLabel} factors. Consider for priority review.</p>
            )}
            {overallScore >= 60 && overallScore < 70 && (
              <p>📈 <strong>Promising deal</strong> - Solid opportunity with some areas to monitor in the {fundTypeLabel} assessment. Worth further investigation.</p>
            )}
            {overallScore >= 50 && overallScore < 60 && (
              <p>⚠️ <strong>Developing opportunity</strong> - Some concerns present in key criteria. Detailed analysis recommended.</p>
            )}
            {overallScore < 50 && (
              <p>🔍 <strong>Needs significant work</strong> - Multiple concerns identified across assessment criteria. Consider pass or major improvements needed.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}