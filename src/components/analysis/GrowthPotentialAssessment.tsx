import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  Rocket, 
  Globe,
  ArrowUpRight,
  Lightbulb,
  Users
} from 'lucide-react';

interface GrowthPotentialAssessmentProps {
  deal: any;
}

export function GrowthPotentialAssessment({ deal }: GrowthPotentialAssessmentProps) {
  // Extract growth metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const growthScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Growth Potential'
  )?.score || 0;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 85) return <Badge variant="secondary" className="bg-green-100 text-green-800">High Potential</Badge>;
    if (score >= 70) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Moderate Potential</Badge>;
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Limited Potential</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Overall Growth Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Growth Potential Overview
            </CardTitle>
            {getStatusBadge(growthScore)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Growth Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(growthScore)}`}>
                {growthScore}/100
              </span>
            </div>
            <Progress value={growthScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Market Expansion Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Market Expansion Potential
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Markets</p>
              <p className="text-sm font-medium">
                {deal?.countries_of_operation?.length > 0 
                  ? `${deal.countries_of_operation.length} countries`
                  : 'Regional presence'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Market Stage</p>
              <p className="text-sm font-medium">
                {deal?.company_stage || 'Growth stage'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              <span className="text-sm">Geographic expansion opportunities being analyzed</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm">New market segment potential under review</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Development & Innovation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Product Development & Innovation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Innovation Pipeline</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">R&D Investment</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Product Roadmap</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
          </div>
          
          {deal?.technology_stack?.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Technology Foundation</p>
              <div className="flex flex-wrap gap-2">
                {deal.technology_stack.slice(0, 4).map((tech: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Value Creation Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Value Creation Potential
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Funding Stage</p>
              <p className="text-sm font-medium">
                {deal?.funding_stage || 'Series A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Business Model</p>
              <p className="text-sm font-medium">
                {deal?.business_model || deal?.revenue_model || 'SaaS/Recurring'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Scalability assessment in progress</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm">Value creation levers being identified</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Growth potential analysis includes market expansion, product development, operational scaling, and strategic partnerships assessment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}