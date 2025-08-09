import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, TrendingUp, AlertTriangle, Target, Lightbulb, RefreshCw } from 'lucide-react';
import { useEnhancedFundMemory } from '@/hooks/useEnhancedFundMemory';
import { FundMemoryInsight } from '@/services/EnhancedFundMemoryService';

interface EnhancedFundMemoryInsightsProps {
  fundId: string;
  className?: string;
}

const InsightCard: React.FC<{ insight: FundMemoryInsight }> = ({ insight }) => {
  const getIcon = () => {
    switch (insight.type) {
      case 'bias_detection':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'decision_pattern':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'success_factor':
        return <Target className="h-4 w-4 text-success" />;
      case 'risk_signal':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Brain className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getImpactColor(insight.actionable_recommendation ? 'high' : 'low')}>
              {insight.actionable_recommendation ? 'Actionable' : 'Informational'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {Math.round(insight.confidence_score)}% confidence
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
        
        {insight.actionable_recommendation && (
          <Alert className="mb-3">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Recommendation:</strong> {insight.actionable_recommendation}
            </AlertDescription>
          </Alert>
        )}

        {insight.supporting_data && (
          <div className="text-xs text-muted-foreground">
            <details className="cursor-pointer">
              <summary className="font-medium hover:text-foreground">Supporting Data</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify(insight.supporting_data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AnalyticsCard: React.FC<{ analytics: any }> = ({ analytics }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Decision Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Decision Speed</span>
              <span className="text-sm font-medium">{analytics.decision_speed_avg} days</span>
            </div>
            <Progress value={Math.min(100, (7 / Math.max(1, analytics.decision_speed_avg)) * 100)} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Consistency</span>
              <span className={`text-sm font-medium ${getScoreColor(analytics.decision_consistency)}`}>
                {analytics.decision_consistency}%
              </span>
            </div>
            <Progress value={analytics.decision_consistency} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">AI Alignment</span>
              <span className={`text-sm font-medium ${getScoreColor(analytics.ai_alignment_rate)}`}>
                {analytics.ai_alignment_rate}%
              </span>
            </div>
            <Progress value={analytics.ai_alignment_rate} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bias Frequency</span>
              <span className={`text-sm font-medium ${getScoreColor(100 - analytics.bias_frequency)}`}>
                {analytics.bias_frequency}%
              </span>
            </div>
            <Progress value={analytics.bias_frequency} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const EnhancedFundMemoryInsights: React.FC<EnhancedFundMemoryInsightsProps> = ({
  fundId,
  className = ""
}) => {
  const { 
    insights, 
    analytics, 
    isLoading, 
    refreshInsights, 
    loadAnalytics 
  } = useEnhancedFundMemory(fundId);

  const handleRefresh = async () => {
    await Promise.all([refreshInsights(), loadAnalytics()]);
  };

  if (!fundId) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Select a fund to view memory insights</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Fund Memory Insights
          </h2>
          <p className="text-muted-foreground">
            AI-powered analysis of your fund's decision patterns and learning
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {analytics && (
        <AnalyticsCard analytics={analytics} />
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Insights</h3>
        {insights.length > 0 ? (
          insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {isLoading ? 'Loading insights...' : 'No insights available yet. Make some decisions to start learning!'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};