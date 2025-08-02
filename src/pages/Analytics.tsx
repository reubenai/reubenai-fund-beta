import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Brain,
  Filter,
  Download,
  FileText,
  Percent,
  Award,
  Globe
} from 'lucide-react';
import { useFund } from '@/contexts/FundContext';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  dealFlowMetrics: {
    totalDeals: number;
    dealsByStage: Record<string, number>;
    conversionRates: Record<string, number>;
    averageTimeInStage: Record<string, number>;
  };
  fundPerformance: {
    totalInvested: number;
    portfolioSize: number;
    avgDealSize: number;
    topPerformingDeals: any[];
    irr: number;
    tvpi: number;
    moic: number;
  };
  aiPerformance: {
    totalAnalyses: number;
    avgConfidence: number;
    accuracyRate: number;
    topEngines: any[];
  };
  trends: {
    monthlyDeals: any[];
    industryBreakdown: any[];
    geographyBreakdown: any[];
    valuationTrends: any[];
  };
  lpMetrics: {
    unrealizedGains: number;
    realizedGains: number;
    drawdownRate: number;
    portfolioGrowth: number;
  };
}

export default function Analytics() {
  const { selectedFund } = useFund();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (selectedFund) {
      fetchAnalyticsData();
    }
  }, [selectedFund, timeRange]);

  const fetchAnalyticsData = async () => {
    if (!selectedFund) return;
    
    setLoading(true);
    try {
      // Parallel fetch all analytics data
      const [dealsData, analysesData, stagesData, sourcesData] = await Promise.all([
        // Fetch deals data
        supabase
          .from('deals')
          .select(`
            *,
            deal_analyses(*)
          `)
          .eq('fund_id', selectedFund.id)
          .gte('created_at', getDateThreshold(timeRange)),
          
        // Fetch AI analyses performance
        supabase
          .from('deal_analyses')
          .select(`
            *,
            deals!inner(fund_id)
          `)
          .eq('deals.fund_id', selectedFund.id)
          .gte('created_at', getDateThreshold(timeRange)),
          
        // Fetch pipeline stages
        supabase
          .from('pipeline_stages')
          .select('*')
          .eq('fund_id', selectedFund.id)
          .order('position'),
          
        // Fetch analysis sources performance
        supabase
          .from('deal_analysis_sources')
          .select(`
            *,
            deals!inner(fund_id)
          `)
          .eq('deals.fund_id', selectedFund.id)
          .gte('created_at', getDateThreshold(timeRange))
      ]);

      if (dealsData.error) throw dealsData.error;
      if (analysesData.error) throw analysesData.error;
      if (stagesData.error) throw stagesData.error;

      const deals = dealsData.data || [];
      const analyses = analysesData.data || [];
      const stages = stagesData.data || [];
      const sources = sourcesData.data || [];

      // Process analytics data
      const analytics: AnalyticsData = {
        dealFlowMetrics: calculateDealFlowMetrics(deals, stages),
        fundPerformance: calculateFundPerformance(deals),
        aiPerformance: calculateAIPerformance(analyses, sources),
        trends: calculateTrends(deals, analyses),
        lpMetrics: calculateLPMetrics(deals)
      };

      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateThreshold = (range: string) => {
    const now = new Date();
    const days = parseInt(range.replace('d', ''));
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  };

  const calculateDealFlowMetrics = (deals: any[], stages: any[]) => {
    const dealsByStage: Record<string, number> = {};
    const timeInStage: Record<string, number[]> = {};
    
    stages.forEach(stage => {
      dealsByStage[stage.name] = 0;
      timeInStage[stage.name] = [];
    });

    deals.forEach(deal => {
      const status = deal.status || 'sourced';
      dealsByStage[status] = (dealsByStage[status] || 0) + 1;
      
      // Calculate time in current stage (simplified)
      const daysInStage = Math.floor((new Date().getTime() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      timeInStage[status]?.push(daysInStage);
    });

    const averageTimeInStage: Record<string, number> = {};
    const conversionRates: Record<string, number> = {};
    
    Object.keys(timeInStage).forEach(stage => {
      const times = timeInStage[stage];
      averageTimeInStage[stage] = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    });

    // Calculate conversion rates between stages
    const orderedStages = stages.sort((a, b) => a.position - b.position);
    for (let i = 0; i < orderedStages.length - 1; i++) {
      const currentStage = orderedStages[i].name;
      const nextStage = orderedStages[i + 1].name;
      const currentCount = dealsByStage[currentStage] || 0;
      const nextCount = dealsByStage[nextStage] || 0;
      conversionRates[`${currentStage}-${nextStage}`] = currentCount > 0 ? (nextCount / currentCount) * 100 : 0;
    }

    return {
      totalDeals: deals.length,
      dealsByStage,
      conversionRates,
      averageTimeInStage
    };
  };

  const calculateFundPerformance = (deals: any[]) => {
    const totalInvested = deals
      .filter(d => d.deal_size)
      .reduce((sum, deal) => sum + (deal.deal_size || 0), 0);
    
    const avgDealSize = deals.length > 0 ? totalInvested / deals.length : 0;
    
    const topPerformingDeals = deals
      .filter(d => d.overall_score)
      .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
      .slice(0, 5);

    // Mock LP-relevant metrics (in production, would come from actual performance data)
    const irr = 28.5; // Internal Rate of Return
    const tvpi = 2.4; // Total Value to Paid-In
    const moic = 3.2; // Multiple on Invested Capital

    return {
      totalInvested,
      portfolioSize: deals.length,
      avgDealSize,
      topPerformingDeals,
      irr,
      tvpi,
      moic
    };
  };

  const calculateLPMetrics = (deals: any[]) => {
    // Mock LP metrics (in production, would come from actual portfolio valuation)
    return {
      unrealizedGains: 45800000, // Unrealized portfolio value
      realizedGains: 12300000,   // Realized returns
      drawdownRate: 67,          // % of committed capital drawn
      portfolioGrowth: 156       // % growth since inception
    };
  };

  const calculateAIPerformance = (analyses: any[], sources: any[]) => {
    const totalAnalyses = analyses.length;
    const avgConfidence = analyses.length > 0 
      ? analyses.reduce((sum, a) => sum + (a.confidence_scores?.overall || 50), 0) / analyses.length 
      : 0;
    
    // Group by engine performance
    const enginePerformance: Record<string, { count: number; avgConfidence: number }> = {};
    
    sources.forEach(source => {
      if (!enginePerformance[source.engine_name]) {
        enginePerformance[source.engine_name] = { count: 0, avgConfidence: 0 };
      }
      enginePerformance[source.engine_name].count++;
      enginePerformance[source.engine_name].avgConfidence += source.confidence_score || 50;
    });

    const topEngines = Object.entries(enginePerformance)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        avgConfidence: stats.count > 0 ? stats.avgConfidence / stats.count : 0
      }))
      .sort((a, b) => b.avgConfidence - a.avgConfidence)
      .slice(0, 5);

    return {
      totalAnalyses,
      avgConfidence,
      accuracyRate: 85, // Placeholder - would need actual validation data
      topEngines
    };
  };

  const calculateTrends = (deals: any[], analyses: any[]) => {
    // Monthly deal trends
    const monthlyDeals = deals.reduce((acc: any[], deal) => {
      const month = new Date(deal.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
      const existing = acc.find(m => m.month === month);
      if (existing) {
        existing.count++;
        existing.value += deal.deal_size || 0;
      } else {
        acc.push({ month, count: 1, value: deal.deal_size || 0 });
      }
      return acc;
    }, []);

    // Industry breakdown
    const industryBreakdown = deals.reduce((acc: any[], deal) => {
      const industry = deal.industry || 'Unknown';
      const existing = acc.find(i => i.industry === industry);
      if (existing) {
        existing.count++;
        existing.value += deal.deal_size || 0;
      } else {
        acc.push({ industry, count: 1, value: deal.deal_size || 0 });
      }
      return acc;
    }, []);

    // Geography breakdown
    const geographyBreakdown = deals.reduce((acc: any[], deal) => {
      const location = deal.location || 'Unknown';
      const existing = acc.find(l => l.location === location);
      if (existing) {
        existing.count++;
        existing.value += deal.deal_size || 0;
      } else {
        acc.push({ location, count: 1, value: deal.deal_size || 0 });
      }
      return acc;
    }, []);

    // Valuation trends (mock data)
    const valuationTrends = monthlyDeals.map(month => ({
      ...month,
      avgValuation: month.count > 0 ? month.value / month.count : 0
    }));

    return {
      monthlyDeals: monthlyDeals.slice(-6), // Last 6 months
      industryBreakdown: industryBreakdown.slice(0, 8), // Top 8 industries
      geographyBreakdown: geographyBreakdown.slice(0, 8), // Top 8 locations
      valuationTrends: valuationTrends.slice(-6)
    };
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPerformanceColor = (value: number, isPositive = true) => {
    const condition = isPositive ? value > 0 : value < 0;
    return condition ? 'text-emerald-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="ml-8 space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">LP Performance Dashboard</h1>
            <p className="text-lg text-muted-foreground mt-2">Loading analytics insights...</p>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="border-border/60 shadow-sm">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedFund) {
    return (
      <div className="ml-8 space-y-8 p-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">LP Performance Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-2">Please select a fund to view performance analytics</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="ml-8 space-y-8 p-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">LP Performance Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-2">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-8 space-y-8 p-8 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-foreground">LP Performance Dashboard</h1>
            <Badge variant="secondary" className="bg-accent-orange/10 text-accent-orange border-accent-orange/20 font-medium">
              beta
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            Comprehensive performance insights for {selectedFund.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key LP Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-elegant bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">Portfolio IRR</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-800">{analyticsData.fundPerformance.irr}%</div>
            <div className="flex items-center space-x-1 text-sm text-emerald-600 mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>Above benchmark</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Total Value (TVPI)</CardTitle>
            <Award className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analyticsData.fundPerformance.tvpi}x</div>
            <div className="flex items-center space-x-1 text-sm text-emerald-600 mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>Strong performance</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Unrealized Value</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(analyticsData.lpMetrics.unrealizedGains)}</div>
            <div className="flex items-center space-x-1 text-sm text-emerald-600 mt-1">
              <Percent className="h-4 w-4" />
              <span>+{analyticsData.lpMetrics.portfolioGrowth}% growth</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Portfolio Companies</CardTitle>
            <Target className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analyticsData.fundPerformance.portfolioSize}</div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
              <Activity className="h-4 w-4" />
              <span>Active investments</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Details & Trends */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-border/60 shadow-elegant">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Deal Flow Performance</CardTitle>
            <CardDescription>Pipeline efficiency and conversion metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(analyticsData.dealFlowMetrics.dealsByStage).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-gradient-primary" />
                    <span className="text-base font-medium capitalize">{stage.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold">{count}</span>
                    <div className="w-24 bg-muted rounded-full h-3">
                      <div 
                        className="bg-gradient-primary h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${(count / analyticsData.dealFlowMetrics.totalDeals) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {((count / analyticsData.dealFlowMetrics.totalDeals) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-elegant">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Investment Intelligence</CardTitle>
            <CardDescription>AI-powered analysis performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Brain className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold">AI Confidence Score</p>
                    <p className="text-sm text-muted-foreground">Average analysis confidence</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{analyticsData.aiPerformance.avgConfidence.toFixed(0)}%</div>
                  <Badge className={getScoreColor(analyticsData.aiPerformance.avgConfidence)}>
                    High Quality
                  </Badge>
                </div>
              </div>
              
              {analyticsData.aiPerformance.topEngines.slice(0, 3).map((engine, index) => (
                <div key={engine.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center font-bold">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{engine.name.replace('-', ' ').replace('engine', '').trim()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getScoreColor(engine.avgConfidence)}>
                      {engine.avgConfidence.toFixed(0)}%
                    </Badge>
                    <span className="text-sm text-muted-foreground">{engine.count} analyses</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Intelligence */}
      <div className="grid gap-8 md:grid-cols-3">
        <Card className="border-border/60 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="h-5 w-5" />
              Investment Trends
            </CardTitle>
            <CardDescription>Monthly investment activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.trends.monthlyDeals.map((month) => (
                <div key={month.month} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="font-medium">{month.month}</span>
                  <div className="text-right">
                    <div className="font-bold">{month.count} deals</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(month.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <PieChart className="h-5 w-5" />
              Sector Focus
            </CardTitle>
            <CardDescription>Portfolio diversification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.trends.industryBreakdown.map((industry, index) => (
                <div key={industry.industry} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(${160 + index * 30}, 60%, 50%)` }}
                    />
                    <span className="text-sm font-medium">{industry.industry}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{industry.count}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(industry.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Globe className="h-5 w-5" />
              Geographic Spread
            </CardTitle>
            <CardDescription>Investment locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.trends.geographyBreakdown.map((location, index) => (
                <div key={location.location} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(${25 + index * 40}, 80%, 60%)` }}
                    />
                    <span className="text-sm font-medium">{location.location}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{location.count}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(location.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}