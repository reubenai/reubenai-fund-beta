import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Globe,
  BarChart3,
  Target,
  Clock,
  Shield
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { supabase } from '@/integrations/supabase/client';
import { IndustryMarketSizing } from './IndustryMarketSizing';

interface MarketOpportunityAssessmentProps {
  deal: Deal;
}

interface MarketCheck {
  criterion: string;
  aligned: boolean;
  reasoning: string;
  icon: React.ReactNode;
  weight: number;
  score?: number;
}

interface MarketAssessment {
  overallStatus: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  overallScore: number;
  checks: MarketCheck[];
  dataQuality?: {
    completeness: number;
    confidence: number;
    sources: number;
  };
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Excellent': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Good': 'bg-blue-100 text-blue-700 border-blue-200',
    'Fair': 'bg-amber-100 text-amber-700 border-amber-200',
    'Poor': 'bg-red-100 text-red-700 border-red-200',
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

export function MarketOpportunityAssessment({ deal }: MarketOpportunityAssessmentProps) {
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<MarketAssessment | null>(null);

  const fetchMarketDataAndAssess = React.useCallback(async () => {
    try {
      setLoading(true);

      // Fetch the latest vc_market_opportunity data from deal_analysis_sources
      const { data: marketData } = await supabase
        .from('deal_analysis_sources')
        .select('*')
        .eq('deal_id', deal.id)
        .eq('engine_name', 'vc_market_opportunity')
        .order('retrieved_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const assessmentResult = assessMarketOpportunity(deal, marketData);
      setAssessment(assessmentResult);
    } catch (error) {
      console.error('Error in market assessment:', error);
      setAssessment(assessMarketOpportunity(deal, null));
    } finally {
      setLoading(false);
    }
  }, [deal.id]);

  useEffect(() => {
    // Initial load
    fetchMarketDataAndAssess();

    // Listen for enrichment completion events
    const handleEnrichmentComplete = (event: CustomEvent) => {
      if (event.detail?.dealId === deal.id) {
        console.log('🔄 MarketOpportunity: Refreshing due to enrichment completion for deal:', deal.id);
        fetchMarketDataAndAssess();
      }
    };

    console.log('🎧 MarketOpportunity: Setting up enrichment listener for deal:', deal.id);
    window.addEventListener('dealEnrichmentComplete', handleEnrichmentComplete as EventListener);

    return () => {
      window.removeEventListener('dealEnrichmentComplete', handleEnrichmentComplete as EventListener);
    };
  }, [deal.id, fetchMarketDataAndAssess]);

  const assessMarketOpportunity = (deal: Deal, marketData?: any): MarketAssessment => {
    console.log('🔍 MarketOpportunity: Assessing with vc_market_opportunity data:', marketData);
    
    const checks: MarketCheck[] = [];
    const dataRetrieved = marketData?.data_retrieved || {};

    // Market Size Assessment - Using enriched TAM data from vc_market_opportunity
    const tamData = dataRetrieved?.tam_sam_som?.total_addressable_market;
    const marketSizeGood = tamData && tamData.value > 0 && tamData.value >= 100; // $100M+ TAM threshold
    
    checks.push({
      criterion: 'Market Size (TAM)',
      aligned: marketSizeGood || false,
      reasoning: marketSizeGood 
        ? `Large addressable market: ${formatMarketSize(tamData)}` 
        : tamData && tamData.value > 0
          ? `Market size: ${formatMarketSize(tamData)} - may be limited`
          : tamData?.raw_text || 'Add company documents or description for market size analysis',
      icon: <Globe className="h-4 w-4" />,
      weight: 25,
      score: marketSizeGood ? 85 : (tamData && tamData.value > 0) ? 60 : 40
    });

    // Market Growth Rate - Using enriched growth data
    const growthData = dataRetrieved?.growth_rate;
    const growthRate = typeof growthData?.cagr === 'number' ? growthData.cagr : 
      (dataRetrieved?.tam_sam_som?.market_growth_rate?.value || null);
    const growthRateGood = growthRate && growthRate > 10; // 10%+ CAGR threshold
    
    checks.push({
      criterion: 'Market Growth Rate',
      aligned: growthRateGood || false,
      reasoning: growthRateGood 
        ? `Strong market growth: ${growthRate}% CAGR` 
         : growthRate 
           ? `Moderate growth rate: ${growthRate}% CAGR`
           : dataRetrieved?.tam_sam_som?.market_growth_rate?.raw_text || 'Add industry information for growth rate analysis',
      icon: <TrendingUp className="h-4 w-4" />,
      weight: 20,
      score: growthRateGood ? 80 : growthRate ? 65 : 35
    });

    // Competitive Landscape - Using enriched competitive data
    const competitiveData = dataRetrieved?.competitive_landscape;
    const hasRealCompetitors = competitiveData?.top_players && 
      Array.isArray(competitiveData.top_players) && 
      competitiveData.top_players.length > 0 && 
      !competitiveData.top_players.some((player: string) => player.includes('pending'));
    
    const competitionHealthy = hasRealCompetitors && (
      competitiveData.market_position === 'leader' || 
      competitiveData.market_position === 'pioneer' ||
      competitiveData.top_players.length < 5
    );
    
    checks.push({
      criterion: 'Competitive Position',
      aligned: competitionHealthy || false,
      reasoning: competitionHealthy 
        ? `Favorable position with ${competitiveData.top_players.length} competitors. Market position: ${competitiveData.market_position}` 
        : hasRealCompetitors 
          ? `Competitive market with ${competitiveData.top_players.length} players identified`
          : 'Add market research documents for competitive analysis',
      icon: <Target className="h-4 w-4" />,
      weight: 20,
      score: competitionHealthy ? 75 : hasRealCompetitors ? 55 : 40
    });

    // Market Timing - Using enriched trend data
    const marketTrends = dataRetrieved?.tam_sam_som?.market_trends;
    const timingGood = marketTrends && Array.isArray(marketTrends) && 
      marketTrends.some((trend: string) => 
        ['growing', 'expanding', 'emerging', 'rising'].includes(trend.toLowerCase())
      );
    
    checks.push({
      criterion: 'Market Timing',
      aligned: timingGood || false,
      reasoning: timingGood 
        ? `Favorable trends: ${marketTrends.filter((t: string) => ['growing', 'expanding', 'emerging', 'rising'].includes(t.toLowerCase())).join(', ')}` 
        : marketTrends && marketTrends.length > 0 
          ? `Mixed signals: ${marketTrends.join(', ')}`
          : 'Market timing analysis pending',
      icon: <Clock className="h-4 w-4" />,
      weight: 15,
      score: timingGood ? 70 : (marketTrends && marketTrends.length > 0) ? 50 : 35
    });

    // Customer Demand - Using enriched financial data
    const financialData = dataRetrieved?.financial_context;
    const revenueData = financialData?.revenue_data;
    const demandValidated = revenueData && revenueData.value > 0;
    
    checks.push({
      criterion: 'Customer Demand',
      aligned: demandValidated || false,
      reasoning: demandValidated 
        ? `Revenue indicators: ${formatMarketSize(revenueData)} suggests market demand` 
        : revenueData?.raw_text || 'Customer demand validation required',
      icon: <Users className="h-4 w-4" />,
      weight: 15,
      score: demandValidated ? 65 : 30
    });

    // Regulatory Environment
    const regulatoryFavorable = !deal.industry?.toLowerCase().includes('crypto') && 
      !deal.industry?.toLowerCase().includes('gambling');
    
    checks.push({
      criterion: 'Regulatory Environment',
      aligned: regulatoryFavorable,
      reasoning: regulatoryFavorable 
        ? 'Regulatory environment appears favorable' 
        : 'Potential regulatory challenges in this sector',
      icon: <Shield className="h-4 w-4" />,
      weight: 5,
      score: regulatoryFavorable ? 70 : 45
    });

    // Calculate overall score
    const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
    const weightedScore = checks.reduce((sum, check) => 
      sum + ((check.score || (check.aligned ? 70 : 30)) * check.weight / 100), 0);
    const overallScore = totalWeight > 0 ? Math.round(weightedScore) : 0;

    // Determine overall status
    let overallStatus: MarketAssessment['overallStatus'];
    if (overallScore >= 75) {
      overallStatus = 'Excellent';
    } else if (overallScore >= 60) {
      overallStatus = 'Good';
    } else if (overallScore >= 45) {
      overallStatus = 'Fair';
    } else {
      overallStatus = 'Poor';
    }

    return {
      overallStatus,
      overallScore,
      checks
    };
  };

  const formatMarketSize = (size: any): string => {
    if (!size) return 'Unknown';
    
    // Handle our new enrichment data structure
    if (typeof size === 'object' && size.value !== undefined) {
      if (size.value === 0) return size.raw_text || 'Not available';
      
      const value = size.value;
      const unit = size.unit || '';
      
      if (typeof value === 'number' && value > 0) {
        if (unit.toLowerCase().includes('billion') || unit.toLowerCase() === 'b') {
          return `$${value}B`;
        } else if (unit.toLowerCase().includes('million') || unit.toLowerCase() === 'm') {
          return `$${value}M`;
        } else if (unit.toLowerCase().includes('thousand') || unit.toLowerCase() === 'k') {
          return `$${value}K`;
        } else {
          // Auto-format based on value size
          if (value >= 1000000000) {
            return `$${(value / 1000000000).toFixed(1)}B`;
          } else if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
          } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`;
          }
          return `$${value.toLocaleString()}`;
        }
      }
      return size.raw_text || 'Unknown';
    }
    
    // Handle legacy numeric values
    if (typeof size === 'number') {
      if (size >= 1000000000) {
        return `$${(size / 1000000000).toFixed(1)}B`;
      } else if (size >= 1000000) {
        return `$${(size / 1000000).toFixed(1)}M`;
      }
      return `$${size.toLocaleString()}`;
    }
    
    return size?.toString() || 'Unknown';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Market analysis needs more data</p>
              <p className="text-sm">Add company documents or website information to enable market intelligence</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={getStatusColor(assessment.overallStatus)}>
            {assessment.overallStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Industry Market Sizing Breakdown */}
        <div className="mb-6">
          <IndustryMarketSizing deal={deal} />
        </div>

        {/* Overall Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Score</span>
          <div className="flex items-center gap-2">
            <Progress value={assessment.overallScore} className="w-32" />
            <span className="text-sm font-medium">{assessment.overallScore}%</span>
          </div>
        </div>

        {/* Market Factors */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Market Factors</h4>
          {assessment.checks.map((check, index) => (
            <div key={index} className="flex items-start justify-between p-3 rounded-lg border">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 mt-0.5">
                  {check.icon}
                  {getStatusIcon(check.aligned)}
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm">{check.criterion}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{check.reasoning}</p>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {check.score}/100
              </div>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-sm">
            {assessment.overallStatus === 'Excellent' && (
              <p className="text-emerald-700">🎯 Exceptional market opportunity with strong fundamentals across multiple factors.</p>
            )}
            {assessment.overallStatus === 'Good' && (
              <p className="text-blue-700">✅ Solid market opportunity with good potential, consider deeper market research.</p>
            )}
            {assessment.overallStatus === 'Fair' && (
              <p className="text-amber-700">⚠️ Mixed market signals - thorough market validation recommended before proceeding.</p>
            )}
            {assessment.overallStatus === 'Poor' && (
              <p className="text-red-700">🔍 Market opportunity concerns identified - significant market risks to evaluate.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}