import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Clock, TrendingUp, Target, BarChart3, AlertTriangle } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { supabase } from '@/integrations/supabase/client';

interface StrategicTimingAssessmentProps {
  deal: Deal;
}

interface TimingCriterion {
  id: string;
  name: string;
  weight: number;
  score: number;
  status: string;
  description: string;
  icon: React.ComponentType<any>;
  breakdown?: any;
}

export function StrategicTimingAssessment({ deal }: StrategicTimingAssessmentProps) {
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [timingData, setTimingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimingDataAndAssess();
    
    // Listen for background refresh events
    const handleDealEnrichmentComplete = (event: CustomEvent) => {
      if (event.detail?.dealId === deal.id) {
        fetchTimingDataAndAssess();
      }
    };

    window.addEventListener('dealEnrichmentComplete', handleDealEnrichmentComplete as EventListener);
    return () => {
      window.removeEventListener('dealEnrichmentComplete', handleDealEnrichmentComplete as EventListener);
    };
  }, [deal.id]);

  const fetchTimingDataAndAssess = async () => {
    setLoading(true);
    try {
      // Mock timing data - will be replaced with actual research data
      setTimingData(null);
    } catch (error) {
      console.error('Error fetching timing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assessStrategicTiming = () => {
    const hasTimingData = timingData && timingData.length > 0;
    
    // Market Cycle Timing (60% weight)
    const marketCycleBreakdown = hasTimingData ? {
      category: 'Market Cycle Analysis',
      factors: [
        'Industry growth phase assessment',
        'Economic cycle positioning',
        'Sector momentum evaluation',
        'Market maturity analysis'
      ],
      methodology: 'Comprehensive market timing analysis using economic indicators, industry lifecycle assessment, and competitive landscape evaluation',
      dataRequirements: [
        'Market growth rates and trends',
        'Economic indicators and forecasts',
        'Industry lifecycle positioning',
        'Competitive market dynamics'
      ],
      insights: [
        'Market timing opportunities and risks',
        'Optimal entry/exit windows',
        'Cyclical positioning advantages',
        'Economic sensitivity analysis'
      ]
    } : null;

    const marketCycleTiming: TimingCriterion = {
      id: 'market_cycle',
      name: 'Market Cycle Timing',
      weight: 60,
      score: hasTimingData ? 65 : 0,
      status: hasTimingData ? 'Market cycle timing analysis pending' : 'Market timing data not available - economic research required',
      description: hasTimingData ? 'Market cycle positioning evaluated' : 'Market timing assessment not completed',
      icon: TrendingUp,
      breakdown: marketCycleBreakdown
    };

    // Exit Timing Potential (40% weight)
    const exitTimingBreakdown = hasTimingData ? {
      category: 'Exit Strategy Timing',
      factors: [
        'Exit pathway optimization',
        'Market conditions for exit',
        'Strategic buyer landscape',
        'IPO market readiness'
      ],
      methodology: 'Exit timing analysis focusing on market conditions, strategic opportunities, and optimal exit windows based on industry trends and company readiness',
      dataRequirements: [
        'Historical exit multiples',
        'Strategic buyer activity',
        'IPO market conditions',
        'Industry consolidation trends'
      ],
      insights: [
        'Optimal exit timing windows',
        'Exit pathway recommendations',
        'Market condition dependencies',
        'Value maximization strategies'
      ]
    } : null;

    const exitTimingPotential: TimingCriterion = {
      id: 'exit_timing',
      name: 'Exit Timing Potential',
      weight: 40,
      score: hasTimingData ? 70 : 0,
      status: hasTimingData ? 'Exit timing evaluation in progress' : 'Exit timing analysis not completed',
      description: hasTimingData ? 'Exit timing potential assessed' : 'Exit strategy timing not evaluated',
      icon: Target,
      breakdown: exitTimingBreakdown
    };

    return [marketCycleTiming, exitTimingPotential];
  };

  const criteria = assessStrategicTiming();
  const totalScore = criteria.reduce((sum, criterion) => sum + (criterion.score * criterion.weight / 100), 0);
  const overallStatus = totalScore >= 75 ? 'Strong' : totalScore >= 50 ? 'Moderate' : totalScore >= 25 ? 'Weak' : 'Poor';
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'strong': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'weak': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleCriteriaExpansion = (criteriaId: string) => {
    const newExpanded = new Set(expandedCriteria);
    if (newExpanded.has(criteriaId)) {
      newExpanded.delete(criteriaId);
    } else {
      newExpanded.add(criteriaId);
    }
    setExpandedCriteria(newExpanded);
  };

  const renderExpandedContent = (criterion: TimingCriterion) => {
    if (!criterion.breakdown) {
      return (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
          <p className="text-sm text-muted-foreground">
            Detailed analysis will be available once timing research is completed.
          </p>
        </div>
      );
    }

    const { breakdown } = criterion;
    return (
      <div className="mt-4 space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg border">
          <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analysis Framework
          </h5>
          <div className="space-y-3">
            <div>
              <h6 className="text-xs font-medium text-muted-foreground mb-1">METHODOLOGY</h6>
              <p className="text-xs">{breakdown.methodology}</p>
            </div>
            <div>
              <h6 className="text-xs font-medium text-muted-foreground mb-1">KEY FACTORS</h6>
              <ul className="text-xs space-y-1">
                {breakdown.factors.map((factor: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-background rounded-lg border">
            <h6 className="text-xs font-medium text-muted-foreground mb-2">DATA REQUIREMENTS</h6>
            <ul className="text-xs space-y-1">
              {breakdown.dataRequirements.map((req: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-background rounded-lg border">
            <h6 className="text-xs font-medium text-muted-foreground mb-2">KEY INSIGHTS</h6>
            <ul className="text-xs space-y-1">
              {breakdown.insights.map((insight: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Strategic Timing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="space-y-3">
              <div className="h-12 bg-muted rounded-lg"></div>
              <div className="h-12 bg-muted rounded-lg"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Strategic Timing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Score Box */}
        <div className="p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-lg border">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Strategic Timing</h4>
                <p className="text-xs text-muted-foreground">Based on 2 timing factors</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={getStatusColor(overallStatus)}>
                {overallStatus}
              </Badge>
              <span className="text-sm font-medium">{Math.round(totalScore)}%</span>
            </div>
          </div>
          <Progress value={totalScore} className="h-2" />
        </div>

        {/* Timing Factors */}
        <div>
          <h4 className="font-medium text-sm mb-4 text-muted-foreground">Timing Factors</h4>
          <div className="space-y-3">
            {criteria.map((criterion) => {
              const isExpanded = expandedCriteria.has(criterion.id);
              const Icon = criterion.icon;
              
              return (
                <div key={criterion.id} className="border rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-4 justify-between hover:bg-muted/50"
                    onClick={() => toggleCriteriaExpansion(criterion.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background rounded border">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{criterion.name}</div>
                        <div className="text-xs text-muted-foreground">{criterion.status}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Weight: {criterion.weight}%</div>
                        <div className="text-sm font-medium">{criterion.score}/100</div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </Button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      {renderExpandedContent(criterion)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Strategic Timing Concerns */}
        <div className="flex items-start gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-orange-800">
            Strategic timing assessment pending - market cycle and exit timing analysis required.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}