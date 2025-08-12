import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  Eye,
  Target,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface RiskAssessmentSectionProps {
  deal: any;
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Low Risk': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Medium Risk': 'bg-amber-100 text-amber-700 border-amber-200',
    'High Risk': 'bg-red-100 text-red-700 border-red-200',
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

export function RiskAssessmentSection({ deal }: RiskAssessmentSectionProps) {
  // Extract risk metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const riskScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Risk Assessment'
  )?.score || 0;

  const getOverallStatus = (score: number) => {
    if (score >= 85) return 'Low Risk';
    if (score >= 70) return 'Medium Risk';
    return 'High Risk';
  };

  const overallStatus = getOverallStatus(riskScore);

  // Mock individual criteria for consistent layout
  const criteria = [
    {
      criterion: 'Market Risk',
      aligned: riskScore >= 75,
      reasoning: riskScore >= 75 ? 'Low market concentration risk' : 'Market risk assessment in progress',
      icon: <TrendingDown className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Operational Risk',
      aligned: riskScore >= 70,
      reasoning: riskScore >= 70 ? 'Strong operational capabilities' : 'Operational risk review ongoing',
      icon: <AlertTriangle className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Financial Risk',
      aligned: riskScore >= 65,
      reasoning: riskScore >= 65 ? 'Stable financial position' : 'Financial risk analysis pending',
      icon: <XCircle className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Competitive Risk',
      aligned: riskScore >= 70,
      reasoning: riskScore >= 70 ? 'Defensible competitive position' : 'Competitive risk evaluation ongoing',
      icon: <Shield className="h-4 w-4" />,
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
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Overall Risk Assessment</p>
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
                <Progress value={riskScore} className="w-24" />
                <span className="text-sm font-medium">{riskScore}%</span>
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
              {overallStatus === 'Low Risk' && (
                <p>✅ Low risk profile supports investment confidence. Proceed with standard due diligence.</p>
              )}
              {overallStatus === 'Medium Risk' && (
                <p>⚠️ Moderate risk factors identified. Enhanced due diligence recommended for specific areas.</p>
              )}
              {overallStatus === 'High Risk' && (
                <p>❌ Significant risk factors require careful evaluation. Comprehensive risk mitigation strategies needed.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}