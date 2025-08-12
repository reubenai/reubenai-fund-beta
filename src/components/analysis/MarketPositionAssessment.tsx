import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Users, 
  Trophy, 
  Target,
  TrendingUp,
  Shield
} from 'lucide-react';

interface MarketPositionAssessmentProps {
  deal: any;
}

export function MarketPositionAssessment({ deal }: MarketPositionAssessmentProps) {
  // Extract market position metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const marketScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Market Position'
  )?.score || 0;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 85) return <Badge variant="secondary" className="bg-green-100 text-green-800">Leading</Badge>;
    if (score >= 70) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Competitive</Badge>;
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Challenging</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Overall Market Position Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Market Position Overview
            </CardTitle>
            {getStatusBadge(marketScore)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Position Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(marketScore)}`}>
                {marketScore}/100
              </span>
            </div>
            <Progress value={marketScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Market Share & Presence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Market Share & Presence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Geographic Presence</p>
              <p className="text-sm font-medium">
                {deal?.countries_of_operation?.length > 0 
                  ? deal.countries_of_operation.join(', ')
                  : deal?.location || 'Global'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Target Market</p>
              <p className="text-sm font-medium">
                {deal?.target_market || deal?.industry || 'Enterprise'}
              </p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Market position analysis includes competitive positioning, market share assessment, and brand strength evaluation.</p>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Advantages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Competitive Advantages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {deal?.competitors?.length > 0 ? (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Key Competitors</p>
              <div className="flex flex-wrap gap-2">
                {deal.competitors.slice(0, 3).map((competitor: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {competitor}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Competitive analysis in progress</p>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Differentiation analysis pending</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm">Market positioning assessment in progress</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Base Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Base & Relationships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deal?.key_customers?.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Key Customers</p>
                <div className="space-y-1">
                  {deal.key_customers.slice(0, 3).map((customer: string, index: number) => (
                    <Badge key={index} variant="secondary" className="mr-2 text-xs">
                      {customer}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Customer analysis in progress</p>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">
              Customer concentration, retention rates, and relationship strength assessment will be available once analysis is complete.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}