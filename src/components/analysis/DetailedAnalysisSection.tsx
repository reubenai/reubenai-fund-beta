import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Users, 
  Lightbulb, 
  DollarSign, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Star
} from 'lucide-react';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';

interface EngineResult {
  engine: string;
  score: number;
  analysis: string;
  confidence: number;
  sources: any[];
  data: any;
  validation_status: string;
}

interface DetailedAnalysisSectionProps {
  engineResults: {
    market_opportunity?: EngineResult;
    product_technology?: EngineResult;
    team_leadership?: EngineResult;
    financial_traction?: EngineResult;
    thesis_alignment?: EngineResult;
  };
  executiveSummary?: string;
  overallScore?: number;
  overallRecommendation?: string;
}

const getEngineIcon = (engineType: string) => {
  switch (engineType) {
    case 'market_opportunity': return <TrendingUp className="h-5 w-5" />;
    case 'product_technology': return <Lightbulb className="h-5 w-5" />;
    case 'team_leadership': return <Users className="h-5 w-5" />;
    case 'financial_traction': return <DollarSign className="h-5 w-5" />;
    case 'thesis_alignment': return <Target className="h-5 w-5" />;
    default: return <Info className="h-5 w-5" />;
  }
};

const getEngineTitle = (engineType: string) => {
  switch (engineType) {
    case 'market_opportunity': return 'Market Opportunity';
    case 'product_technology': return 'Product & Technology';
    case 'team_leadership': return 'Team & Leadership';
    case 'financial_traction': return 'Financial & Traction';
    case 'thesis_alignment': return 'Thesis Alignment';
    default: return engineType;
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'text-green-600';
  if (confidence >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getValidationBadge = (status: string) => {
  switch (status) {
    case 'validated':
      return <Badge variant="outline" className="text-green-600 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Validated</Badge>;
    case 'partial':
      return <Badge variant="outline" className="text-yellow-600 border-yellow-200"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>;
    default:
      return <Badge variant="outline" className="text-gray-600 border-gray-200"><Info className="h-3 w-3 mr-1" />Unvalidated</Badge>;
  }
};

export function DetailedAnalysisSection({ 
  engineResults, 
  executiveSummary, 
  overallScore, 
  overallRecommendation 
}: DetailedAnalysisSectionProps) {
  const { getRAGCategory } = useStrategyThresholds();

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      {executiveSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Executive Summary
              {overallScore && (
                <Badge className={getRAGCategory(overallScore).color}>
                  {getRAGCategory(overallScore).label}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed mb-4">{executiveSummary}</p>
            {overallRecommendation && (
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium mb-2">Recommendation</h4>
                <p className="text-sm text-muted-foreground">{overallRecommendation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Engine Analysis */}
      <div className="grid gap-6">
        {Object.entries(engineResults).map(([engineType, result]) => {
          if (!result) return null;

          const ragCategory = getRAGCategory(result.score);

          return (
            <Card key={engineType} className="border-l-4" style={{ borderLeftColor: ragCategory.color.includes('emerald') ? 'rgb(16 185 129)' : ragCategory.color.includes('amber') ? 'rgb(245 158 11)' : ragCategory.color.includes('orange') ? 'rgb(249 115 22)' : 'rgb(239 68 68)' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getEngineIcon(engineType)}
                    {getEngineTitle(engineType)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getValidationBadge(result.validation_status)}
                    <Badge className={ragCategory.color}>
                      {ragCategory.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score and Confidence */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-2xl font-bold">{result.score}/100</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                    <div>
                      <div className={`text-lg font-semibold ${getConfidenceColor(result.confidence)}`}>
                        {result.confidence}%
                      </div>
                      <div className="text-xs text-muted-foreground">Confidence</div>
                    </div>
                  </div>
                  <Progress value={result.score} className="w-32" />
                </div>

                <Separator />

                {/* Analysis */}
                <div>
                  <h4 className="font-medium mb-2">Analysis</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.analysis}
                  </p>
                </div>

                {/* Key Data Points */}
                {result.data && Object.keys(result.data).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Key Insights</h4>
                    <div className="space-y-3">
                      {Object.entries(result.data).map(([key, value]: [string, any]) => {
                        if (key === 'fund_criteria_weight' || !value || (Array.isArray(value) && value.length === 0)) return null;
                        
                        return (
                          <div key={key} className="bg-muted/30 rounded-lg p-3">
                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              {key.replace(/_/g, ' ')}
                            </h5>
                            {Array.isArray(value) ? (
                              <div className="space-y-1">
                                {value.map((item, index) => (
                                  <div key={index} className="text-sm">
                                    {typeof item === 'string' ? item : JSON.stringify(item)}
                                  </div>
                                ))}
                              </div>
                            ) : typeof value === 'object' && value !== null ? (
                              <div className="space-y-2">
                                {Object.entries(value).map(([subKey, subValue]: [string, any]) => (
                                  <div key={subKey} className="flex justify-between items-start">
                                    <span className="text-xs text-muted-foreground">{subKey.replace(/_/g, ' ')}</span>
                                    <span className="text-sm font-medium text-right max-w-[60%]">
                                      {typeof subValue === 'string' ? subValue : JSON.stringify(subValue)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm">{String(value)}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sources */}
                {result.sources && result.sources.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Data Sources</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.sources.map((source, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {source.type}: {source.source}
                          {source.confidence && (
                            <span className={`ml-1 ${getConfidenceColor(source.confidence)}`}>
                              ({source.confidence}%)
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}