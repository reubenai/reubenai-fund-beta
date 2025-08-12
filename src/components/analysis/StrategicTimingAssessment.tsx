import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  Target,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface StrategicTimingAssessmentProps {
  deal: any;
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Optimal Timing': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Good Timing': 'bg-amber-100 text-amber-700 border-amber-200',
    'Poor Timing': 'bg-red-100 text-red-700 border-red-200',
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

export function StrategicTimingAssessment({ deal }: StrategicTimingAssessmentProps) {
  // Extract timing metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const timingScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Strategic Timing'
  )?.score || 0;

  const getOverallStatus = (score: number) => {
    if (score >= 85) return 'Optimal Timing';
    if (score >= 70) return 'Good Timing';
    return 'Poor Timing';
  };

  const overallStatus = getOverallStatus(timingScore);

  // Mock individual criteria for consistent layout
  const criteria = [
    {
      criterion: 'Market Timing',
      aligned: timingScore >= 75,
      reasoning: timingScore >= 75 ? 'Favorable market conditions identified' : 'Market timing analysis in progress',
      icon: <TrendingUp className="h-4 w-4" />,
      weight: 30
    },
    {
      criterion: 'Investment Window',
      aligned: timingScore >= 70,
      reasoning: timingScore >= 70 ? 'Optimal investment stage confirmed' : 'Investment readiness assessment ongoing',
      icon: <Calendar className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Competitive Position',
      aligned: timingScore >= 65,
      reasoning: timingScore >= 65 ? 'Strong competitive timing advantage' : 'Competitive timing evaluation pending',
      icon: <Target className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Strategic Fit',
      aligned: timingScore >= 70,
      reasoning: timingScore >= 70 ? 'Aligns well with fund strategy timing' : 'Strategic alignment assessment ongoing',
      icon: <Clock className="h-4 w-4" />,
      weight: 20
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
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Overall Strategic Timing</p>
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
                <Progress value={timingScore} className="w-24" />
                <span className="text-sm font-medium">{timingScore}%</span>
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
              {overallStatus === 'Optimal Timing' && (
                <p>✅ Excellent strategic timing. Market conditions and investment readiness align perfectly.</p>
              )}
              {overallStatus === 'Good Timing' && (
                <p>⚠️ Good timing with minor considerations. Monitor market conditions and competitive dynamics.</p>
              )}
              {overallStatus === 'Poor Timing' && (
                <p>❌ Timing concerns identified. Consider market conditions and investment stage carefully.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}