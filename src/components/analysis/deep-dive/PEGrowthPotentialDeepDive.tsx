import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Globe, Lightbulb, ExternalLink } from 'lucide-react';

interface MarketExpansionOpportunity {
  market: string;
  size_potential: string;
  timeline: string;
  investment_required: string;
  risk_level: 'low' | 'medium' | 'high';
  expected_return: string;
}

interface ProductDevelopmentInitiative {
  product: string;
  development_stage: 'concept' | 'development' | 'testing' | 'launch';
  market_potential: number;
  resource_requirements: string;
  competitive_advantage: string;
}

interface ValueCreationInitiative {
  initiative: string;
  type: 'cost_reduction' | 'revenue_enhancement' | 'efficiency' | 'strategic';
  impact_potential: number;
  implementation_difficulty: 'low' | 'medium' | 'high';
  timeline: string;
  estimated_value: string;
}

interface ExitStrategy {
  strategy_type: 'ipo' | 'strategic_sale' | 'dividend_recap' | 'secondary_buyout';
  feasibility: number;
  timeline: string;
  estimated_valuation: string;
  market_conditions: 'favorable' | 'neutral' | 'challenging';
  key_requirements: string[];
}

interface PEGrowthPotentialData {
  market_expansion: {
    expansion_readiness: number;
    geographic_potential: number;
    new_market_opportunities: MarketExpansionOpportunity[];
  };
  product_development: {
    innovation_capability: number;
    r_and_d_investment: number;
    product_pipeline: ProductDevelopmentInitiative[];
  };
  value_creation: {
    value_creation_score: number;
    operational_improvement: number;
    initiatives: ValueCreationInitiative[];
  };
  exit_strategy: {
    exit_readiness: number;
    market_timing: number;
    strategies: ExitStrategy[];
  };
}

interface PEGrowthPotentialDeepDiveProps {
  data: PEGrowthPotentialData;
}

export function PEGrowthPotentialDeepDive({ data }: PEGrowthPotentialDeepDiveProps) {
  const getScoreColor = (score: number, thresholds: { good: number; fair: number }) => {
    if (score >= thresholds.good) return 'text-green-600';
    if (score >= thresholds.fair) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    if (risk === 'low') return 'text-green-600 bg-green-50';
    if (risk === 'medium') return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getDifficultyColor = (difficulty: 'low' | 'medium' | 'high') => {
    if (difficulty === 'low') return 'text-green-600 bg-green-50';
    if (difficulty === 'medium') return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStageColor = (stage: string) => {
    if (stage === 'launch') return 'text-green-600 bg-green-50';
    if (stage === 'testing') return 'text-blue-600 bg-blue-50';
    if (stage === 'development') return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getMarketConditionsColor = (conditions: string) => {
    if (conditions === 'favorable') return 'text-green-600 bg-green-50';
    if (conditions === 'neutral') return 'text-blue-600 bg-blue-50';
    return 'text-red-600 bg-red-50';
  };

  const getTypeIcon = (type: string) => {
    if (type === 'strategic_sale') return <ExternalLink className="h-4 w-4" />;
    if (type === 'ipo') return <TrendingUp className="h-4 w-4" />;
    return <Globe className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Market Expansion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Market Expansion Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.market_expansion.expansion_readiness, { good: 80, fair: 60 })}`}>
                {data.market_expansion.expansion_readiness}/100
              </div>
              <div className="text-sm text-muted-foreground">Expansion Readiness</div>
              <Progress value={data.market_expansion.expansion_readiness} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.market_expansion.geographic_potential, { good: 75, fair: 50 })}`}>
                {data.market_expansion.geographic_potential}/100
              </div>
              <div className="text-sm text-muted-foreground">Geographic Potential</div>
              <Progress value={data.market_expansion.geographic_potential} className="mt-2" />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Expansion Opportunities</h4>
            {data.market_expansion.new_market_opportunities.map((opportunity, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{opportunity.market}</span>
                    <span className="text-sm text-muted-foreground block">
                      Size: {opportunity.size_potential}
                    </span>
                  </div>
                  <Badge className={getRiskColor(opportunity.risk_level)}>
                    {opportunity.risk_level} risk
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeline:</span> {opportunity.timeline}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Investment:</span> {opportunity.investment_required}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expected Return:</span> {opportunity.expected_return}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Development */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Product Development & Innovation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.product_development.innovation_capability, { good: 85, fair: 65 })}`}>
                {data.product_development.innovation_capability}/100
              </div>
              <div className="text-sm text-muted-foreground">Innovation Capability</div>
              <Progress value={data.product_development.innovation_capability} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.product_development.r_and_d_investment, { good: 80, fair: 60 })}`}>
                {data.product_development.r_and_d_investment}/100
              </div>
              <div className="text-sm text-muted-foreground">R&D Investment Level</div>
              <Progress value={data.product_development.r_and_d_investment} className="mt-2" />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Product Pipeline</h4>
            {data.product_development.product_pipeline.map((product, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{product.product}</span>
                    <div className="text-sm text-muted-foreground">
                      {product.competitive_advantage}
                    </div>
                  </div>
                  <Badge className={getStageColor(product.development_stage)}>
                    {product.development_stage}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Market Potential:</span>
                    <Progress value={product.market_potential} className="w-20" />
                    <span className="font-medium">{product.market_potential}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Resources:</span> {product.resource_requirements}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Value Creation */}
      <Card>
        <CardHeader>
          <CardTitle>Value Creation Initiatives</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.value_creation.value_creation_score, { good: 85, fair: 70 })}`}>
                {data.value_creation.value_creation_score}/100
              </div>
              <div className="text-sm text-muted-foreground">Value Creation Score</div>
              <Progress value={data.value_creation.value_creation_score} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.value_creation.operational_improvement, { good: 80, fair: 60 })}`}>
                {data.value_creation.operational_improvement}/100
              </div>
              <div className="text-sm text-muted-foreground">Operational Improvement</div>
              <Progress value={data.value_creation.operational_improvement} className="mt-2" />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Key Initiatives</h4>
            {data.value_creation.initiatives.map((initiative, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{initiative.initiative}</span>
                    <Badge variant="outline" className="ml-2">
                      {initiative.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{initiative.estimated_value}</div>
                    <div className="text-xs text-muted-foreground">{initiative.timeline}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Impact:</span>
                    <Progress value={initiative.impact_potential} className="w-20" />
                    <span className="text-sm font-medium">{initiative.impact_potential}%</span>
                  </div>
                  <Badge className={getDifficultyColor(initiative.implementation_difficulty)}>
                    {initiative.implementation_difficulty} difficulty
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exit Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Exit Strategy Readiness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.exit_strategy.exit_readiness, { good: 80, fair: 60 })}`}>
                {data.exit_strategy.exit_readiness}/100
              </div>
              <div className="text-sm text-muted-foreground">Exit Readiness</div>
              <Progress value={data.exit_strategy.exit_readiness} className="mt-2" />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(data.exit_strategy.market_timing, { good: 75, fair: 50 })}`}>
                {data.exit_strategy.market_timing}/100
              </div>
              <div className="text-sm text-muted-foreground">Market Timing</div>
              <Progress value={data.exit_strategy.market_timing} className="mt-2" />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Exit Options</h4>
            {data.exit_strategy.strategies.map((strategy, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(strategy.strategy_type)}
                    <span className="font-medium">
                      {strategy.strategy_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{strategy.estimated_valuation}</div>
                    <div className="text-xs text-muted-foreground">{strategy.timeline}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Feasibility:</span>
                    <Progress value={strategy.feasibility} className="w-20" />
                    <span className="text-sm font-medium">{strategy.feasibility}%</span>
                  </div>
                  <Badge className={getMarketConditionsColor(strategy.market_conditions)}>
                    {strategy.market_conditions} conditions
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Key Requirements:</div>
                  <div className="flex flex-wrap gap-1">
                    {strategy.key_requirements.map((req, reqIndex) => (
                      <Badge key={reqIndex} variant="outline" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}