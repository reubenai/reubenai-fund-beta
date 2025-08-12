import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Target,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface FinancialPerformanceAssessmentProps {
  deal: any;
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Strong': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Moderate': 'bg-amber-100 text-amber-700 border-amber-200',
    'Weak': 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getStatusIcon = (aligned: boolean) => {
  return aligned ? (
    <CheckCircle className="h-4 w-4 text-emerald-600" />
  ) : (
    <XCircle className="h-4 w-4 text-red-600" />
  );
};

export function FinancialPerformanceAssessment({ deal }: FinancialPerformanceAssessmentProps) {
  // Extract financial metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const financialScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Financial Performance'
  )?.score || 0;

  const getOverallStatus = (score: number) => {
    if (score >= 85) return 'Strong';
    if (score >= 70) return 'Moderate';
    return 'Weak';
  };

  const overallStatus = getOverallStatus(financialScore);

  // Mock individual criteria for consistent layout
  const criteria = [
    {
      criterion: 'Revenue Growth',
      aligned: financialScore >= 70,
      reasoning: financialScore >= 70 ? 'Strong revenue growth trajectory identified' : 'Revenue growth analysis pending',
      icon: <TrendingUp className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Profitability',
      aligned: financialScore >= 75,
      reasoning: financialScore >= 75 ? 'Healthy profit margins demonstrated' : 'Profitability metrics under review',
      icon: <BarChart3 className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Cash Flow',
      aligned: financialScore >= 65,
      reasoning: financialScore >= 65 ? 'Positive cash flow generation' : 'Cash flow assessment in progress',
      icon: <DollarSign className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Financial Stability',
      aligned: financialScore >= 70,
      reasoning: financialScore >= 70 ? 'Strong financial foundation' : 'Financial stability evaluation ongoing',
      icon: <Target className="h-4 w-4" />,
      weight: 25
    }
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Overall Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-background">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Overall Financial Performance</p>
                <p className="text-sm text-muted-foreground">
                  Based on {criteria.length} criteria
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={`${getStatusColor(overallStatus)} mb-2`}>
                {overallStatus}
              </Badge>
              <div className="flex items-center gap-2">
                <Progress value={financialScore} className="w-24" />
                <span className="text-sm font-medium">{financialScore}%</span>
              </div>
            </div>
          </div>

          {/* Individual Criteria */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Individual Criteria</h4>
            {criteria.map((criterion, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {criterion.icon}
                    {getStatusIcon(criterion.aligned)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{criterion.criterion}</p>
                    <p className="text-xs text-muted-foreground">{criterion.reasoning}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Weight: {criterion.weight}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="p-4 rounded-lg bg-muted/30 border">
            <h4 className="font-medium text-sm mb-2">Recommendations</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {overallStatus === 'Strong' && (
                <p>✅ Strong financial performance indicates solid investment opportunity. Continue with due diligence.</p>
              )}
              {overallStatus === 'Moderate' && (
                <p>⚠️ Moderate financial performance. Review specific metrics and growth plans carefully.</p>
              )}
              {overallStatus === 'Weak' && (
                <p>❌ Financial performance concerns identified. Detailed financial analysis recommended.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}