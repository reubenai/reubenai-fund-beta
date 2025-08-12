import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Eye, 
  Users, 
  FileCheck,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface TrustTransparencyAssessmentProps {
  deal: any;
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'High Trust': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Moderate Trust': 'bg-amber-100 text-amber-700 border-amber-200',
    'Trust Concerns': 'bg-red-100 text-red-700 border-red-200',
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

export function TrustTransparencyAssessment({ deal }: TrustTransparencyAssessmentProps) {
  // Extract trust metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const trustScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Trust & Transparency'
  )?.score || 0;

  const getOverallStatus = (score: number) => {
    if (score >= 85) return 'High Trust';
    if (score >= 70) return 'Moderate Trust';
    return 'Trust Concerns';
  };

  const overallStatus = getOverallStatus(trustScore);

  // Mock individual criteria for consistent layout
  const criteria = [
    {
      criterion: 'Governance Quality',
      aligned: trustScore >= 75,
      reasoning: trustScore >= 75 ? 'Strong governance framework established' : 'Governance assessment in progress',
      icon: <FileCheck className="h-4 w-4" />,
      weight: 30
    },
    {
      criterion: 'Management Transparency',
      aligned: trustScore >= 70,
      reasoning: trustScore >= 70 ? 'Open and transparent communication' : 'Transparency evaluation ongoing',
      icon: <Eye className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Stakeholder Relations',
      aligned: trustScore >= 65,
      reasoning: trustScore >= 65 ? 'Strong stakeholder relationships' : 'Stakeholder assessment pending',
      icon: <Users className="h-4 w-4" />,
      weight: 20
    },
    {
      criterion: 'Compliance Standards',
      aligned: trustScore >= 70,
      reasoning: trustScore >= 70 ? 'High compliance standards maintained' : 'Compliance review ongoing',
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
                <p className="font-medium">Overall Trust & Transparency</p>
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
                <Progress value={trustScore} className="w-24" />
                <span className="text-sm font-medium">{trustScore}%</span>
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
              {overallStatus === 'High Trust' && (
                <p>✅ Excellent trust and transparency standards. Strong foundation for partnership confidence.</p>
              )}
              {overallStatus === 'Moderate Trust' && (
                <p>⚠️ Good transparency with areas for improvement. Address identified concerns before investment.</p>
              )}
              {overallStatus === 'Trust Concerns' && (
                <p>❌ Trust and transparency issues require attention. Enhanced due diligence recommended.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}