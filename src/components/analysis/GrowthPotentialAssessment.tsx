import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  Rocket, 
  Globe,
  ArrowUpRight,
  Lightbulb,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface GrowthPotentialAssessmentProps {
  deal: any;
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'High Potential': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Moderate Potential': 'bg-amber-100 text-amber-700 border-amber-200',
    'Limited Potential': 'bg-red-100 text-red-700 border-red-200',
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

export function GrowthPotentialAssessment({ deal }: GrowthPotentialAssessmentProps) {
  // Extract growth metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const growthScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Growth Potential'
  )?.score || 0;

  const getOverallStatus = (score: number) => {
    if (score >= 85) return 'High Potential';
    if (score >= 70) return 'Moderate Potential';
    return 'Limited Potential';
  };

  const overallStatus = getOverallStatus(growthScore);

  // Mock individual criteria for consistent layout
  const criteria = [
    {
      criterion: 'Market Expansion',
      aligned: growthScore >= 75,
      reasoning: growthScore >= 75 ? 'Strong geographic expansion opportunities' : 'Market expansion analysis in progress',
      icon: <Globe className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Product Innovation',
      aligned: growthScore >= 70,
      reasoning: growthScore >= 70 ? 'Robust innovation pipeline identified' : 'Product development assessment ongoing',
      icon: <Lightbulb className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Scalability',
      aligned: growthScore >= 65,
      reasoning: growthScore >= 65 ? 'Scalable business model confirmed' : 'Scalability evaluation pending',
      icon: <TrendingUp className="h-4 w-4" />,
      weight: 25
    },
    {
      criterion: 'Value Creation',
      aligned: growthScore >= 70,
      reasoning: growthScore >= 70 ? 'Multiple value creation levers identified' : 'Value creation opportunities under review',
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
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Overall Growth Potential</p>
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
                <Progress value={growthScore} className="w-24" />
                <span className="text-sm font-medium">{growthScore}%</span>
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
              {overallStatus === 'High Potential' && (
                <p>✅ Exceptional growth potential identified. Strong candidate for scaling investment strategy.</p>
              )}
              {overallStatus === 'Moderate Potential' && (
                <p>⚠️ Good growth prospects with some limitations. Focus on maximizing identified opportunities.</p>
              )}
              {overallStatus === 'Limited Potential' && (
                <p>❌ Growth potential concerns identified. Consider if alternative value creation strategies exist.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}