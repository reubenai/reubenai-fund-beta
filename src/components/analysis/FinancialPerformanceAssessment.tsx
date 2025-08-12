import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface FinancialPerformanceAssessmentProps {
  deal: any;
}

export function FinancialPerformanceAssessment({ deal }: FinancialPerformanceAssessmentProps) {
  // Extract financial metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const financialScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Financial Performance'
  )?.score || 0;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 85) return <Badge variant="secondary" className="bg-green-100 text-green-800">Strong</Badge>;
    if (score >= 70) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Moderate</Badge>;
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Weak</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Overall Financial Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Performance Overview
            </CardTitle>
            {getStatusBadge(financialScore)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(financialScore)}`}>
                {financialScore}/100
              </span>
            </div>
            <Progress value={financialScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Revenue Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue & Growth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Annual Revenue</p>
              <p className="text-lg font-semibold">
                {deal?.current_round_size ? `$${(deal.current_round_size / 1000000).toFixed(1)}M` : 'Not disclosed'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Growth Rate</p>
              <p className="text-lg font-semibold text-green-600">
                Analysis pending
              </p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Financial analysis includes revenue growth trends, profitability metrics, and cash flow assessment.</p>
          </div>
        </CardContent>
      </Card>

      {/* Profitability Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Profitability & Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Gross Margin</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">EBITDA Margin</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Operating Efficiency</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow & Liquidity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Cash Flow & Liquidity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Cash flow analysis in progress</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Working capital assessment pending</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Comprehensive financial analysis will be available once document processing is complete.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}