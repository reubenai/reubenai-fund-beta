import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp,
  Globe,
  MapPin,
  ExternalLink,
  RefreshCw,
  Info,
  Calendar,
  BarChart3,
  Zap,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Deal } from '@/hooks/usePipelineDeals';

interface IndustryMarketData {
  industry: string;
  tam: {
    value: number;
    unit: string;
    currency: string;
    year: number;
    source: string;
    citation: string;
  };
  sam: {
    value: number;
    unit: string;
    currency: string;
    rationale: string;
    methodology: string;
  };
  som: {
    value: number;
    unit: string;
    currency: string;
    rationale: string;
    methodology: string;
  };
  growth_rate: {
    cagr: number;
    period: string;
    source: string;
  };
  regional_analysis?: {
    region_name: string;
    market_size: string;
    growth_rate: number;
    vs_global_comparison: string;
    regional_drivers: string[];
    market_maturity: string;
    fund_alignment: string;
  };
  local_analysis?: {
    country_name: string;
    market_size: string;
    growth_rate: number;
    local_opportunities: string[];
    regulatory_environment: string[];
    competitive_dynamics: string[];
  };
  enhanced_insights?: string[];
  last_updated: string;
}

interface EnhancedMarketSizingProps {
  deal: Deal;
}

export function EnhancedMarketSizing({ deal }: EnhancedMarketSizingProps) {
  const [marketData, setMarketData] = useState<IndustryMarketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastResearchDate, setLastResearchDate] = useState<string | null>(null);
  const { toast } = useToast();

  const industries = deal.industry ? [deal.industry] : ['Technology'];
  const location = deal.location || 'Global';

  useEffect(() => {
    // Check if we have cached data
    const cacheKey = `market_sizing_${deal.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const cachedData = JSON.parse(cached);
      setMarketData(cachedData.data || []);
      setLastResearchDate(cachedData.last_updated);
    }
  }, [deal.id]);

  const fetchMarketSizing = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching real market sizing data for:', industries);
      
      const { data, error } = await supabase.functions.invoke('market-sizing-research', {
        body: {
          industry: industries[0],
          company_name: deal.company_name,
          target_market: industries[0],
          geographic_scope: location,
          deal_location: location,
          fund_geographies: [], // TODO: Get from fund strategy
          context: `Market sizing analysis for ${deal.company_name}`
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        const enhancedData = [{
          industry: data.industry,
          tam: {
            value: Math.round(data.market_sizing.tam.value / 1000000000),
            unit: 'B',
            currency: data.market_sizing.tam.currency,
            year: data.market_sizing.tam.year || 2024,
            source: data.market_sizing.tam.source,
            citation: data.market_sizing.tam.citation
          },
          sam: {
            value: Math.round(data.market_sizing.sam.value / 1000000000),
            unit: 'B', 
            currency: data.market_sizing.sam.currency,
            rationale: data.market_sizing.sam.rationale,
            methodology: data.market_sizing.sam.calculation_method
          },
          som: {
            value: Math.round(data.market_sizing.som.value / 1000000000),
            unit: 'B',
            currency: data.market_sizing.som.currency,
            rationale: data.market_sizing.som.rationale,
            methodology: data.market_sizing.som.calculation_method
          },
          growth_rate: {
            cagr: data.market_sizing.cagr.value,
            period: data.market_sizing.cagr.period,
            source: data.market_sizing.cagr.source
          },
          regional_analysis: data.market_sizing.regional_analysis,
          local_analysis: data.market_sizing.local_analysis,
          enhanced_insights: data.market_sizing.enhanced_insights,
          last_updated: data.timestamp
        }];

        setMarketData(enhancedData);
        setLastResearchDate(data.timestamp);
        
        // Cache the results
        const cacheKey = `market_sizing_${deal.id}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          data: enhancedData,
          last_updated: data.timestamp
        }));

        toast({
          title: "Market Research Complete",
          description: `Updated market sizing with regional and local analysis for ${data.industry}`
        });
      }
    } catch (error) {
      console.error('Market sizing research error:', error);
      toast({
        title: "Research Error",
        description: "Failed to fetch market sizing data. Using fallback estimates.",
        variant: "destructive"
      });
      
      // Fallback data
      setMarketData([{
        industry: industries[0],
        tam: {
          value: 500,
          unit: 'B',
          currency: 'USD',
          year: 2024,
          source: 'Industry Estimates',
          citation: 'Based on industry analysis and market reports'
        },
        sam: {
          value: 75,
          unit: 'B',
          currency: 'USD',
          rationale: 'Estimated 15% of TAM addressable based on market dynamics',
          methodology: 'Standard market addressability calculation'
        },
        som: {
          value: 4.5,
          unit: 'B',
          currency: 'USD',
          rationale: 'Conservative 6% market capture over 3-5 years',
          methodology: 'Realistic market penetration projection'
        },
        growth_rate: {
          cagr: 8.5,
          period: '2024-2029',
          source: 'Industry analysis'
        },
        last_updated: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number, unit: string) => {
    return `$${value}${unit}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Market Sizing Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          {lastResearchDate && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Updated {formatDate(lastResearchDate)}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMarketSizing}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Researching...' : 'Research Markets'}
          </Button>
        </div>
      </div>

      {marketData.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Click "Research Markets" to fetch real market sizing data
            </p>
            <Button onClick={fetchMarketSizing} className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Start Market Research
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-lg font-medium">Researching Market Data</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing {industries.join(', ')} market in {location}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {marketData.map((industry, index) => (
        <Card key={index} className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {industry.industry} Market
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {location}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* TAM/SAM/SOM Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* TAM */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    Total Addressable Market
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-primary">
                    {formatValue(industry.tam.value, industry.tam.unit)}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {industry.tam.year} Market Size
                    </div>
                    <div className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {industry.tam.source}
                    </div>
                  </div>
                  <div className="text-xs bg-background p-2 rounded border">
                    <strong>Citation:</strong> {industry.tam.citation}
                  </div>
                </CardContent>
              </Card>

              {/* SAM */}
              <Card className="bg-secondary/5 border-secondary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    Serviceable Addressable Market
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-secondary">
                    {formatValue(industry.sam.value, industry.sam.unit)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((industry.sam.value / industry.tam.value) * 100).toFixed(1)}% of TAM
                  </div>
                  <div className="text-xs bg-background p-2 rounded border space-y-2">
                    <div><strong>Rationale:</strong> {industry.sam.rationale}</div>
                    <div><strong>Methodology:</strong> {industry.sam.methodology}</div>
                  </div>
                </CardContent>
              </Card>

              {/* SOM */}
              <Card className="bg-accent/5 border-accent/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    Serviceable Obtainable Market
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-accent">
                    {formatValue(industry.som.value, industry.som.unit)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((industry.som.value / industry.sam.value) * 100).toFixed(1)}% of SAM
                  </div>
                  <div className="text-xs bg-background p-2 rounded border space-y-2">
                    <div><strong>Rationale:</strong> {industry.som.rationale}</div>
                    <div><strong>Methodology:</strong> {industry.som.methodology}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Growth Rate */}
            <Card className="bg-success/5 border-success/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Market Growth Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xl font-bold text-success">
                    {industry.growth_rate.cagr}% CAGR
                  </div>
                  <Badge variant="outline">{industry.growth_rate.period}</Badge>
                </div>
                <Progress value={Math.min(industry.growth_rate.cagr * 5, 100)} className="mb-2" />
                <div className="text-xs text-muted-foreground">
                  Source: {industry.growth_rate.source}
                </div>
              </CardContent>
            </Card>

            {/* Regional & Local Market Analysis */}
            {(industry.regional_analysis || industry.local_analysis) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Regional Analysis */}
                {industry.regional_analysis && (
                  <Card className="bg-blue-50/50 border-blue-200/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        Regional Market ({industry.regional_analysis.region_name})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-lg font-bold text-blue-600">
                        {industry.regional_analysis.market_size}
                      </div>
                      <div className="text-sm space-y-2">
                        <div className="p-2 bg-background rounded border">
                          <strong>Growth Rate:</strong> {industry.regional_analysis.growth_rate}% CAGR
                        </div>
                        <div className="p-2 bg-background rounded border">
                          <strong>vs Global:</strong> {industry.regional_analysis.vs_global_comparison}
                        </div>
                        <div className="p-2 bg-background rounded border">
                          <strong>Fund Alignment:</strong> {industry.regional_analysis.fund_alignment}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Local Analysis */}
                {industry.local_analysis && (
                  <Card className="bg-green-50/50 border-green-200/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-600" />
                        Local Market ({industry.local_analysis.country_name})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-lg font-bold text-green-600">
                        {industry.local_analysis.market_size}
                      </div>
                      <div className="text-sm space-y-2">
                        <div className="p-2 bg-background rounded border">
                          <strong>Local Growth:</strong> {industry.local_analysis.growth_rate}% CAGR
                        </div>
                        <div className="p-2 bg-background rounded border">
                          <strong>Key Opportunities:</strong> {industry.local_analysis.local_opportunities.slice(0, 1).join(', ')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Enhanced Summary Insights */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Market Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>
                      <strong>Global Market:</strong> {industry.industry} represents a 
                      {formatValue(industry.tam.value, industry.tam.unit)} total market with 
                      {industry.growth_rate.cagr}% annual growth
                    </span>
                  </div>
                  
                  {industry.regional_analysis && (
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      <span>
                        <strong>Regional Opportunity:</strong> {industry.regional_analysis.vs_global_comparison}
                      </span>
                    </div>
                  )}
                  
                  {industry.local_analysis && (
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                      <span>
                        <strong>Local Market:</strong> {industry.local_analysis.country_name} shows 
                        {industry.local_analysis.growth_rate}% growth with direct market access opportunities
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                    <span>
                      <strong>Target Opportunity:</strong> {formatValue(industry.som.value, industry.som.unit)} 
                      represents a realistic 3-5 year market capture target
                    </span>
                  </div>
                  
                  {industry.enhanced_insights && industry.enhanced_insights.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <strong className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Enhanced Insights</strong>
                      {industry.enhanced_insights.map((insight, i) => (
                        <div key={i} className="flex items-start gap-2 mb-1">
                          <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-xs text-purple-700">{insight}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}