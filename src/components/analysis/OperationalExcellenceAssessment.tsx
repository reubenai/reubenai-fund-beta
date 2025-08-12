import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Users, 
  Zap, 
  Target,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface OperationalExcellenceAssessmentProps {
  deal: any;
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Excellent': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Good': 'bg-amber-100 text-amber-700 border-amber-200',
    'Needs Improvement': 'bg-red-100 text-red-700 border-red-200',
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

export function OperationalExcellenceAssessment({ deal }: OperationalExcellenceAssessmentProps) {
  // Extract operational metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const operationalScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Operational Excellence'
  )?.score || 0;

  const getOverallStatus = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    return 'Needs Improvement';
  };

  const overallStatus = getOverallStatus(operationalScore);

  // Mock individual criteria for consistent layout
  const criteria = [
    {
      criterion: 'Process Efficiency',
      aligned: operationalScore >= 75,
      reasoning: operationalScore >= 75 ? 'Streamlined operational processes' : 'Process optimization opportunities identified',
      icon: <Zap className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Management Quality',
      aligned: operationalScore >= 70,
      reasoning: operationalScore >= 70 ? 'Strong leadership capabilities' : 'Management assessment in progress',
      icon: <Users className="h-4 w-4" />,
      weight: 30
    },
    {
      criterion: 'Systems & Technology',
      aligned: operationalScore >= 65,
      reasoning: operationalScore >= 65 ? 'Robust technology infrastructure' : 'Technology assessment ongoing',
      icon: <Settings className="h-4 w-4" />,
      weight: 20
    },
    {
      criterion: 'Scalability',
      aligned: operationalScore >= 70,
      reasoning: operationalScore >= 70 ? 'Ready for growth scaling' : 'Scalability review pending',
      icon: <TrendingUp className="h-4 w-4" />,
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
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Overall Operational Excellence</p>
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
                <Progress value={operationalScore} className="w-24" />
                <span className="text-sm font-medium">{operationalScore}%</span>
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
              {overallStatus === 'Excellent' && (
                <p>✅ Outstanding operational excellence. Company demonstrates strong execution capabilities and scalability.</p>
              )}
              {overallStatus === 'Good' && (
                <p>⚠️ Good operational foundation with opportunities for optimization. Focus on identified improvement areas.</p>
              )}
              {overallStatus === 'Needs Improvement' && (
                <p>❌ Operational improvements required. Detailed operational due diligence recommended.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}