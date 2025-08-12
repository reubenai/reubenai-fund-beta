import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  Target,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface StrategicTimingAssessmentProps {
  deal: any;
}

export function StrategicTimingAssessment({ deal }: StrategicTimingAssessmentProps) {
  // Extract timing metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const timingScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Strategic Timing'
  )?.score || 0;

  const getTimingAssessment = (score: number) => {
    if (score >= 85) return { level: 'Optimal Timing', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 70) return { level: 'Good Timing', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Suboptimal Timing', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const timingAssessment = getTimingAssessment(timingScore);

  return (
    <div className="space-y-6">
      {/* Overall Timing Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Strategic Timing Overview
            </CardTitle>
            <Badge variant="secondary" className={`${timingAssessment.bgColor} ${timingAssessment.color}`}>
              {timingAssessment.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Timing Score</span>
              <span className={`text-2xl font-bold ${timingAssessment.color}`}>
                {timingScore}/100
              </span>
            </div>
            <Progress value={timingScore} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Assessment of market conditions, company readiness, and investment timing alignment
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Market Timing Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Market Timing & Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Market Cycle Position</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Industry Growth Phase</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Competitive Window</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Industry</p>
              <p className="text-sm font-medium">
                {deal?.industry || 'Technology'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Founded</p>
              <p className="text-sm font-medium">
                {deal?.founding_year || 'Recent'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Readiness */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Company Readiness & Momentum
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Growth trajectory assessment in progress</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Product-market fit validation ongoing</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Scaling readiness evaluation pending</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Funding Stage</p>
              <p className="text-sm font-medium">
                {deal?.funding_stage || 'Series A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Business Model</p>
              <p className="text-sm font-medium">
                {deal?.business_model || deal?.revenue_model || 'SaaS'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Window Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Investment Window & Urgency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Funding Urgency</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Competitive Dynamics</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Exit Timeline Alignment</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Timing Assessment</p>
                <p className="text-xs text-muted-foreground">
                  Strategic timing analysis considers market conditions, company momentum, competitive positioning, and investment thesis alignment to determine optimal entry timing.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}