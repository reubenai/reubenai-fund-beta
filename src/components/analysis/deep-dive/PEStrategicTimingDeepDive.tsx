import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface MarketCycleIndicator {
  indicator: string;
  current_phase: 'early' | 'growth' | 'mature' | 'decline';
  timing_score: number;
  trend: 'favorable' | 'neutral' | 'unfavorable';
  impact_on_deal: string;
}

interface ExitScenario {
  strategy: 'ipo' | 'strategic_sale' | 'secondary_buyout' | 'management_buyout';
  feasibility_score: number;
  optimal_timeline: string;
  market_conditions_required: string[];
  value_creation_levers: string[];
  key_milestones: string[];
}

interface PEStrategicTimingData {
  market_cycle_timing: {
    overall_timing_score: number;
    economic_cycle_alignment: number;
    industry_cycle_position: number;
    market_indicators: MarketCycleIndicator[];
    acquisition_window_rating: 'optimal' | 'favorable' | 'neutral' | 'unfavorable';
  };
  exit_timing_potential: {
    overall_exit_readiness: number;
    market_timing_for_exit: number;
    value_creation_timeline: number;
    exit_scenarios: ExitScenario[];
    expected_hold_period: string;
  };
  competitive_timing: {
    first_mover_advantage: number;
    competitive_pressure: number;
    market_saturation_risk: number;
    consolidation_opportunity: number;
  };
}

interface PEStrategicTimingDeepDiveProps {
  data: PEStrategicTimingData;
}

export function PEStrategicTimingDeepDive({ data }: PEStrategicTimingDeepDiveProps) {
  const getTimingColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: 'favorable' | 'neutral' | 'unfavorable') => {
    switch (trend) {
      case 'favorable': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'unfavorable': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPhaseColor = (phase: 'early' | 'growth' | 'mature' | 'decline') => {
    switch (phase) {
      case 'early': return 'bg-blue-100 text-blue-800';
      case 'growth': return 'bg-green-100 text-green-800';
      case 'mature': return 'bg-yellow-100 text-yellow-800';
      case 'decline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWindowRatingColor = (rating: 'optimal' | 'favorable' | 'neutral' | 'unfavorable') => {
    switch (rating) {
      case 'optimal': return 'text-green-700 bg-green-50 border-green-200';
      case 'favorable': return 'text-green-600 bg-green-50 border-green-200';
      case 'neutral': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unfavorable': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Strategic Timing Deep Dive</h3>
      </div>

      {/* Timing Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Cycle Timing</p>
                <p className={`text-3xl font-bold ${getTimingColor(data.market_cycle_timing.overall_timing_score)}`}>
                  {data.market_cycle_timing.overall_timing_score}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Exit Readiness</p>
                <p className={`text-3xl font-bold ${getTimingColor(data.exit_timing_potential.overall_exit_readiness)}`}>
                  {data.exit_timing_potential.overall_exit_readiness}
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Competitive Window</p>
                <p className={`text-3xl font-bold ${getTimingColor(data.competitive_timing.first_mover_advantage)}`}>
                  {data.competitive_timing.first_mover_advantage}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acquisition Window Analysis */}
      <Card className={`border-2 ${getWindowRatingColor(data.market_cycle_timing.acquisition_window_rating)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Market Cycle & Acquisition Window
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getWindowRatingColor(data.market_cycle_timing.acquisition_window_rating)}>
                {data.market_cycle_timing.acquisition_window_rating.toUpperCase()} Acquisition Window
              </Badge>
              <span className="text-sm text-muted-foreground">
                Economic Cycle: {data.market_cycle_timing.economic_cycle_alignment}% Aligned
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Industry Cycle Position</span>
                <Badge variant="outline">{data.market_cycle_timing.industry_cycle_position}%</Badge>
              </div>
              <Progress value={data.market_cycle_timing.industry_cycle_position} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Economic Alignment</span>
                <Badge variant="outline">{data.market_cycle_timing.economic_cycle_alignment}%</Badge>
              </div>
              <Progress value={data.market_cycle_timing.economic_cycle_alignment} className="h-2" />
            </div>
          </div>

          <div className="space-y-3">
            {data.market_cycle_timing.market_indicators?.map((indicator, index) => (
              <div key={index} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    {getTrendIcon(indicator.trend)}
                    {indicator.indicator}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge className={getPhaseColor(indicator.current_phase)}>
                      {indicator.current_phase}
                    </Badge>
                    <Badge variant="outline">{indicator.timing_score}/100</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{indicator.impact_on_deal}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exit Strategy Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            Exit Timing & Strategy Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className={`text-xl font-bold ${getTimingColor(data.exit_timing_potential.market_timing_for_exit)}`}>
                {data.exit_timing_potential.market_timing_for_exit}
              </div>
              <div className="text-sm text-muted-foreground">Market Timing Score</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className={`text-xl font-bold ${getTimingColor(data.exit_timing_potential.value_creation_timeline)}`}>
                {data.exit_timing_potential.value_creation_timeline}
              </div>
              <div className="text-sm text-muted-foreground">Value Creation Timeline</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-lg font-bold text-primary">
                {data.exit_timing_potential.expected_hold_period}
              </div>
              <div className="text-sm text-muted-foreground">Expected Hold Period</div>
            </div>
          </div>

          <div className="space-y-4">
            {data.exit_timing_potential.exit_scenarios?.map((scenario, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold capitalize">
                    {scenario.strategy.replace(/_/g, ' ')} Exit
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={scenario.feasibility_score >= 70 ? 'default' : 
                                   scenario.feasibility_score >= 50 ? 'secondary' : 'outline'}>
                      {scenario.feasibility_score}% feasible
                    </Badge>
                    <Badge variant="outline">{scenario.optimal_timeline}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium mb-2">Market Conditions Required</h5>
                    <ul className="space-y-1">
                      {scenario.market_conditions_required.map((condition, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          {condition}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Value Creation Levers</h5>
                    <ul className="space-y-1">
                      {scenario.value_creation_levers.map((lever, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ArrowRight className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                          {lever}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Key Milestones</h5>
                    <ul className="space-y-1">
                      {scenario.key_milestones.map((milestone, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Calendar className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                          {milestone}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Competitive Timing Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Competitive Timing Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">First Mover Advantage</span>
                <Badge variant="outline">{data.competitive_timing.first_mover_advantage}%</Badge>
              </div>
              <Progress value={data.competitive_timing.first_mover_advantage} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Competitive Pressure</span>
                <Badge variant="outline">{data.competitive_timing.competitive_pressure}%</Badge>
              </div>
              <Progress value={data.competitive_timing.competitive_pressure} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Saturation Risk</span>
                <Badge variant="outline">{data.competitive_timing.market_saturation_risk}%</Badge>
              </div>
              <Progress value={data.competitive_timing.market_saturation_risk} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Consolidation Opportunity</span>
                <Badge variant="outline">{data.competitive_timing.consolidation_opportunity}%</Badge>
              </div>
              <Progress value={data.competitive_timing.consolidation_opportunity} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}