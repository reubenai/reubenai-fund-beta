import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Users, 
  Trophy, 
  Target,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface MarketPositionAssessmentProps {
  deal: any;
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Leading': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Competitive': 'bg-amber-100 text-amber-700 border-amber-200',
    'Challenging': 'bg-red-100 text-red-700 border-red-200',
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

export function MarketPositionAssessment({ deal }: MarketPositionAssessmentProps) {
  // Extract market position metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const marketScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Market Position'
  )?.score || 0;

  const getOverallStatus = (score: number) => {
    if (score >= 85) return 'Leading';
    if (score >= 70) return 'Competitive';
    return 'Challenging';
  };

  const overallStatus = getOverallStatus(marketScore);

  // Mock individual criteria for consistent layout
  const criteria = [
    {
      criterion: 'Market Share',
      aligned: marketScore >= 75,
      reasoning: marketScore >= 75 ? 'Strong market position identified' : 'Market share analysis in progress',
      icon: <Globe className="h-4 w-4" />,
      weight: 30
    },
    {
      criterion: 'Competitive Advantage',
      aligned: marketScore >= 70,
      reasoning: marketScore >= 70 ? 'Clear differentiation established' : 'Competitive positioning under review',
      icon: <Shield className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Brand Strength',
      aligned: marketScore >= 65,
      reasoning: marketScore >= 65 ? 'Strong brand recognition' : 'Brand assessment pending',
      icon: <Trophy className="h-4 w-4" />,
      weight: 20
    },
    {
      criterion: 'Customer Base',
      aligned: marketScore >= 70,
      reasoning: marketScore >= 70 ? 'Diversified customer portfolio' : 'Customer analysis ongoing',
      icon: <Users className="h-4 w-4" />,
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
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Overall Market Position</p>
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
                <Progress value={marketScore} className="w-24" />
                <span className="text-sm font-medium">{marketScore}%</span>
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
              {overallStatus === 'Leading' && (
                <p>✅ Strong market position provides competitive advantage. Focus on defending and expanding position.</p>
              )}
              {overallStatus === 'Competitive' && (
                <p>⚠️ Solid market position with room for improvement. Identify opportunities to strengthen competitive moat.</p>
              )}
              {overallStatus === 'Challenging' && (
                <p>❌ Market position requires attention. Develop strategies to improve competitive standing.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}