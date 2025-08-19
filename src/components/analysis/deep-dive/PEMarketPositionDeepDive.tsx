import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Users, Shield } from 'lucide-react';

interface MarketShare {
  segment: string;
  percentage: number;
  rank: number;
  trend: 'growing' | 'stable' | 'declining';
}

interface CompetitiveAdvantage {
  factor: string;
  strength: 'high' | 'medium' | 'low';
  sustainability: number;
  description: string;
}

interface PEMarketPositionData {
  market_share: {
    overall_position: number;
    market_segments: MarketShare[];
    geographic_presence: string[];
    market_concentration: number;
  };
  competitive_advantage: {
    advantages: CompetitiveAdvantage[];
    moat_strength: number;
    differentiation_score: number;
    barriers_to_entry: string[];
  };
  brand_strength: {
    brand_recognition: number;
    customer_loyalty: number;
    net_promoter_score?: number;
    brand_value_metrics: { metric: string; value: string; trend: 'up' | 'down' | 'stable' }[];
  };
  customer_base: {
    total_customers: string;
    customer_segments: { segment: string; percentage: number; value: string }[];
    retention_rate: number;
    concentration_risk: number;
  };
}

interface PEMarketPositionDeepDiveProps {
  data: PEMarketPositionData;
}

export function PEMarketPositionDeepDive({ data }: PEMarketPositionDeepDiveProps) {
  const getTrendColor = (trend: 'growing' | 'stable' | 'declining' | 'up' | 'down') => {
    if (trend === 'growing' || trend === 'up') return 'text-green-600';
    if (trend === 'declining' || trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getStrengthColor = (strength: 'high' | 'medium' | 'low') => {
    if (strength === 'high') return 'text-green-600 bg-green-50';
    if (strength === 'medium') return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreColor = (score: number, thresholds: { good: number; fair: number }) => {
    if (score >= thresholds.good) return 'text-green-600';
    if (score >= thresholds.fair) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRankSuffix = (rank: number) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  return (
    <div className="space-y-6">
      {/* Market Share Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Market Share Position
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                #{data.market_share.overall_position}
              </div>
              <div className="text-sm text-muted-foreground">Overall Market Position</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {data.market_share.market_concentration}%
              </div>
              <div className="text-sm text-muted-foreground">Market Concentration</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Market Segments</h4>
            {data.market_share.market_segments.map((segment, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{segment.segment}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      #{segment.rank}{getRankSuffix(segment.rank)}
                    </Badge>
                    <span className={`text-sm font-medium ${getTrendColor(segment.trend)}`}>
                      {segment.percentage}%
                    </span>
                  </div>
                </div>
                <Progress value={segment.percentage} className="h-2" />
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-medium mb-2">Geographic Presence</h4>
            <div className="flex flex-wrap gap-2">
              {data.market_share.geographic_presence.map((region, index) => (
                <Badge key={index} variant="secondary">{region}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Advantage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Competitive Advantages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.competitive_advantage.moat_strength, { good: 80, fair: 60 })}`}>
                {data.competitive_advantage.moat_strength}/100
              </div>
              <div className="text-sm text-muted-foreground">Moat Strength</div>
              <Progress value={data.competitive_advantage.moat_strength} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.competitive_advantage.differentiation_score, { good: 75, fair: 50 })}`}>
                {data.competitive_advantage.differentiation_score}/100
              </div>
              <div className="text-sm text-muted-foreground">Differentiation Score</div>
              <Progress value={data.competitive_advantage.differentiation_score} className="mt-2" />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Key Advantages</h4>
            {data.competitive_advantage.advantages.map((advantage, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{advantage.factor}</span>
                  <div className="flex items-center gap-2">
                    <Badge className={getStrengthColor(advantage.strength)}>
                      {advantage.strength}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {advantage.sustainability}% sustainable
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{advantage.description}</p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-medium mb-2">Barriers to Entry</h4>
            <div className="space-y-1">
              {data.competitive_advantage.barriers_to_entry.map((barrier, index) => (
                <div key={index} className="text-sm bg-blue-50 text-blue-700 p-2 rounded">
                  {barrier}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Strength */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Strength Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.brand_strength.brand_recognition, { good: 80, fair: 60 })}`}>
                {data.brand_strength.brand_recognition}%
              </div>
              <div className="text-sm text-muted-foreground">Brand Recognition</div>
              <Progress value={data.brand_strength.brand_recognition} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.brand_strength.customer_loyalty, { good: 75, fair: 50 })}`}>
                {data.brand_strength.customer_loyalty}%
              </div>
              <div className="text-sm text-muted-foreground">Customer Loyalty</div>
              <Progress value={data.brand_strength.customer_loyalty} className="mt-2" />
            </div>
            {data.brand_strength.net_promoter_score && (
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(data.brand_strength.net_promoter_score + 100, { good: 150, fair: 100 })}`}>
                  {data.brand_strength.net_promoter_score}
                </div>
                <div className="text-sm text-muted-foreground">Net Promoter Score</div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Brand Value Metrics</h4>
            {data.brand_strength.brand_value_metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{metric.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metric.value}</span>
                  <TrendingUp className={`h-4 w-4 ${getTrendColor(metric.trend)}`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Base Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Base Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.customer_base.total_customers}</div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.customer_base.retention_rate, { good: 90, fair: 80 })}`}>
                {data.customer_base.retention_rate}%
              </div>
              <div className="text-sm text-muted-foreground">Retention Rate</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${data.customer_base.concentration_risk > 20 ? 'text-red-600' : 'text-green-600'}`}>
                {data.customer_base.concentration_risk}%
              </div>
              <div className="text-sm text-muted-foreground">Concentration Risk</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Customer Segments</h4>
            {data.customer_base.customer_segments.map((segment, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{segment.segment}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{segment.value}</span>
                    <span className="text-sm font-medium">{segment.percentage}%</span>
                  </div>
                </div>
                <Progress value={segment.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}