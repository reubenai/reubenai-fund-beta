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
  const [marketData, setMarketData] = useState<any>(null);

  const fetchMarketDataAndAssess = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch market intelligence data for this deal
      const { data: marketIntelligence, error } = await supabase
        .from('deal_analysis_sources')
        .select('*')
        .eq('deal_id', deal.id)
        .eq('engine_name', 'market-intelligence-engine')
        .order('retrieved_at', { ascending: false })
        .limit(1);

      if (!error && marketIntelligence && marketIntelligence.length > 0) {
        console.log('📊 MarketOpportunity: Market data found:', marketIntelligence[0]);
        setMarketData(marketIntelligence[0].data_retrieved);
      } else {
        console.log('📊 MarketOpportunity: No market data found, using deal data');
      }

      // Perform market opportunity assessment
      const marketAssessment = assessMarketOpportunity(deal, marketIntelligence?.[0]?.data_retrieved);
      setAssessment(marketAssessment);
    } catch (error) {
      console.error('Error in market opportunity assessment:', error);
    } finally {
      setLoading(false);
    }
  }, [deal]);

  useEffect(() => {
    // Initial load
    fetchMarketDataAndAssess();

    // Guaranteed auto-refresh every 30 seconds while modal is open
    const autoRefreshInterval = setInterval(() => {
      console.log('🔄 MarketOpportunity: Auto-refresh via timer for deal:', deal.id);
      fetchMarketDataAndAssess();
    }, 30000);

    // Listen for enrichment completion events (backup trigger)
    const handleEnrichmentComplete = (event: CustomEvent) => {
      if (event.detail?.dealId === deal.id) {
        console.log('🔄 MarketOpportunity: Auto-refreshing due to enrichment completion for deal:', deal.id);
        fetchMarketDataAndAssess();
      }
    };

    // Listen for deal updates (another backup trigger)
    const handleDealUpdate = () => {
      console.log('🔄 MarketOpportunity: Refreshing due to deal update');
      fetchMarketDataAndAssess();
    };

    console.log('🎧 MarketOpportunity: Setting up all event listeners for deal:', deal.id);
    window.addEventListener('dealEnrichmentComplete', handleEnrichmentComplete as EventListener);
    window.addEventListener('dealUpdated', handleDealUpdate as EventListener);

    return () => {
      clearInterval(autoRefreshInterval);
      window.removeEventListener('dealEnrichmentComplete', handleEnrichmentComplete as EventListener);
      window.removeEventListener('dealUpdated', handleDealUpdate as EventListener);
    };
  }, [deal.id, fetchMarketDataAndAssess]);

  const assessMarketOpportunity = (deal: Deal, marketData?: any): MarketAssessment => {
    const checks: MarketCheck[] = [];

    // Market Size Assessment
    const marketSize = marketData?.market_size || marketData?.tam;
    const marketSizeGood = marketSize && (
      (typeof marketSize === 'number' && marketSize > 1000000000) || // $1B+ TAM
      (typeof marketSize === 'string' && marketSize.toLowerCase().includes('billion'))
    );
    
    checks.push({
      criterion: 'Market Size (TAM)',
      aligned: marketSizeGood || false,
      reasoning: marketSizeGood 
        ? `Large addressable market identified: ${formatMarketSize(marketSize)}` 
        : marketSize 
          ? `Market size may be limited: ${formatMarketSize(marketSize)}`
          : 'Market size data not available - requires analysis',
      icon: <Globe className="h-4 w-4" />,
      weight: 25,
      score: marketSizeGood ? 85 : marketSize ? 60 : 40
    });

    // Market Growth Rate
    const growthRate = marketData?.growth_rate || marketData?.cagr;
    const growthRateGood = growthRate && (
      (typeof growthRate === 'number' && growthRate > 15) ||
      (typeof growthRate === 'string' && parseFloat(growthRate) > 15)
    );
    
    checks.push({
      criterion: 'Market Growth Rate',
      aligned: growthRateGood || false,
      reasoning: growthRateGood 
        ? `Strong market growth: ${growthRate}% CAGR` 
        : growthRate 
          ? `Moderate growth rate: ${growthRate}% CAGR`
          : 'Growth rate data not available - market research needed',
      icon: <TrendingUp className="h-4 w-4" />,
      weight: 20,
      score: growthRateGood ? 80 : growthRate ? 65 : 35
    });

    // Competitive Landscape
    const competitiveData = marketData?.competitive_landscape || marketData?.competition;
    const competitionHealthy = competitiveData && (
      competitiveData.fragmented || 
      competitiveData.emerging_market ||
      (competitiveData.competitors && competitiveData.competitors.length < 5)
    );
    
    checks.push({
      criterion: 'Competitive Position',
      aligned: competitionHealthy || false,
      reasoning: competitionHealthy 
        ? 'Favorable competitive landscape with differentiation opportunities' 
        : competitiveData 
          ? 'Competitive market - strong execution required'
          : 'Competitive analysis pending - industry research needed',
      icon: <Target className="h-4 w-4" />,
      weight: 20,
      score: competitionHealthy ? 75 : competitiveData ? 55 : 40
    });

    // Market Maturity & Timing
    const marketTrends = marketData?.market_trends || 
      (deal.enhanced_analysis && 
       typeof deal.enhanced_analysis === 'object' && 
       'market_intelligence' in deal.enhanced_analysis ? 
         (deal.enhanced_analysis as any).market_intelligence?.trends : 
         null);
         
    const timingGood = marketTrends && (
      Array.isArray(marketTrends) ? marketTrends.some(trend => 
        trend.toLowerCase().includes('growing') || 
        trend.toLowerCase().includes('emerging') ||
        trend.toLowerCase().includes('adoption')
      ) : typeof marketTrends === 'string' && (
        marketTrends.toLowerCase().includes('growing') ||
        marketTrends.toLowerCase().includes('emerging')
      )
    );
    
    checks.push({
      criterion: 'Market Timing',
      aligned: timingGood || false,
      reasoning: timingGood 
        ? 'Market timing appears favorable with positive trends' 
        : marketTrends 
          ? 'Mixed market signals - timing assessment needed'
          : 'Market timing analysis pending',
      icon: <Clock className="h-4 w-4" />,
      weight: 15,
      score: timingGood ? 70 : marketTrends ? 50 : 35
    });

    // Customer Demand Validation
    const customerData = marketData?.customer_segments || 
      (deal.enhanced_analysis && 
       typeof deal.enhanced_analysis === 'object' && 
       'business_traction' in deal.enhanced_analysis ? 
         (deal.enhanced_analysis as any).business_traction : 
         null);
         
    const demandValidated = customerData || deal.deal_size || (deal.overall_score && deal.overall_score > 60);
    
    checks.push({
      criterion: 'Customer Demand',
      aligned: demandValidated || false,
      reasoning: demandValidated 
        ? 'Customer demand indicators present' 
        : 'Customer demand validation required',
      icon: <Users className="h-4 w-4" />,
      weight: 15,
      score: demandValidated ? 65 : 30
    });

    // Regulatory Environment
    const regulatoryRisk = marketData?.regulatory_environment;
    const regulatoryFavorable = !regulatoryRisk || 
      (regulatoryRisk && (regulatoryRisk.favorable || regulatoryRisk.risk_level === 'low'));
    
    checks.push({
      criterion: 'Regulatory Environment',
      aligned: regulatoryFavorable,
      reasoning: regulatoryFavorable 
        ? 'Regulatory environment appears favorable' 
        : regulatoryRisk 
          ? 'Regulatory considerations identified'
          : 'Regulatory assessment pending',
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Opportunity Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Opportunity Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Market analysis unavailable</p>
              <p className="text-sm">Trigger AI analysis to assess market opportunity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-background">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Market Opportunity</p>
              <p className="text-sm text-muted-foreground">
                Based on {assessment.checks.length} market factors
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className={`${getStatusColor(assessment.overallStatus)} mb-2`}>
              {assessment.overallStatus}
            </Badge>
            <div className="flex items-center gap-2">
              <Progress value={assessment.overallScore} className="w-24" />
              <span className="text-sm font-medium">{assessment.overallScore}%</span>
            </div>
          </div>
        </div>

        {/* Individual Checks */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Market Factors</h4>
          {assessment.checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {check.icon}
                  {getStatusIcon(check.aligned)}
                </div>
                <div>
                  <p className="font-medium text-sm">{check.criterion}</p>
                  <p className="text-xs text-muted-foreground">{check.reasoning}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Weight: {check.weight}%</span>
                {check.score && (
                  <div className="text-xs font-medium">{check.score}/100</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Market Insights */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <h4 className="font-medium text-sm mb-2">Market Insights</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {assessment.overallStatus === 'Excellent' && (
              <p>🎯 Exceptional market opportunity with strong fundamentals across multiple factors.</p>
            )}
            {assessment.overallStatus === 'Good' && (
              <p>✅ Solid market opportunity with good potential, consider deeper market research.</p>
            )}
            {assessment.overallStatus === 'Fair' && (
              <p>⚠️ Mixed market signals - thorough market validation recommended before proceeding.</p>
            )}
            {assessment.overallStatus === 'Poor' && (
              <p>🔍 Market opportunity concerns identified - significant market risks to evaluate.</p>
            )}
            
            {marketData && (
              <p className="mt-2 pt-2 border-t border-muted-foreground/20">
                💡 Market intelligence data available from recent analysis
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}