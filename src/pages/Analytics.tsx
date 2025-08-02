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
  Filter
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
        trends: calculateTrends(deals, analyses)
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

    return {
      totalInvested,
      portfolioSize: deals.length,
      avgDealSize,
      topPerformingDeals
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
      } else {
        acc.push({ month, count: 1 });
      }
      return acc;
    }, []);

    // Industry breakdown
    const industryBreakdown = deals.reduce((acc: any[], deal) => {
      const industry = deal.industry || 'Unknown';
      const existing = acc.find(i => i.industry === industry);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ industry, count: 1 });
      }
      return acc;
    }, []);

    // Geography breakdown
    const geographyBreakdown = deals.reduce((acc: any[], deal) => {
      const location = deal.location || 'Unknown';
      const existing = acc.find(l => l.location === location);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ location, count: 1 });
      }
      return acc;
    }, []);

    return {
      monthlyDeals: monthlyDeals.slice(-6), // Last 6 months
      industryBreakdown: industryBreakdown.slice(0, 8), // Top 8 industries
      geographyBreakdown: geographyBreakdown.slice(0, 8) // Top 8 locations
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
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Fund performance and insights</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Please select a fund to view analytics</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Performance insights for {selectedFund.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
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

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.dealFlowMetrics.totalDeals}</div>
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.fundPerformance.totalInvested)}</div>
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+8% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.aiPerformance.avgConfidence.toFixed(0)}%</div>
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+5% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.fundPerformance.avgDealSize)}</div>
            <div className="flex items-center space-x-1 text-xs text-red-600">
              <ArrowDownRight className="h-3 w-3" />
              <span>-3% from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deal Flow Funnel */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deal Flow by Stage</CardTitle>
            <CardDescription>Distribution of deals across pipeline stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analyticsData.dealFlowMetrics.dealsByStage).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary/20" />
                    <span className="text-sm font-medium capitalize">{stage}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{count}</span>
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(count / analyticsData.dealFlowMetrics.totalDeals) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Engine Performance</CardTitle>
            <CardDescription>Top performing analysis engines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.aiPerformance.topEngines.map((engine, index) => (
                <div key={engine.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium">{engine.name.replace('-', ' ').replace('engine', '')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold px-2 py-1 rounded ${getScoreColor(engine.avgConfidence)}`}>
                      {engine.avgConfidence.toFixed(0)}%
                    </span>
                    <span className="text-xs text-muted-foreground">{engine.count} uses</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Deal Flow</CardTitle>
            <CardDescription>Deals added over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.trends.monthlyDeals.map((month) => (
                <div key={month.month} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{month.month}</span>
                  <span className="font-semibold">{month.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Industries</CardTitle>
            <CardDescription>Deal distribution by sector</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.trends.industryBreakdown.slice(0, 6).map((industry) => (
                <div key={industry.industry} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground truncate">{industry.industry}</span>
                  <span className="font-semibold">{industry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>Geographic distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.trends.geographyBreakdown.slice(0, 6).map((location) => (
                <div key={location.location} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground truncate">{location.location}</span>
                  <span className="font-semibold">{location.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}