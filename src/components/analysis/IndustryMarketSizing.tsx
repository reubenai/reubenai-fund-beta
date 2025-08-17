import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Globe,
  Calculator,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IndustryMarketSizingProps {
  deal: Deal;
}

interface MarketSizing {
  tam: {
    value: number;
    currency: string;
    year: number;
    citation: string;
    source: string;
    confidence: number;
  };
  sam: {
    value: number;
    currency: string;
    calculation_method: string;
    rationale: string;
    confidence: number;
  };
  som: {
    value: number;
    currency: string;
    calculation_method: string;
    rationale: string;
    confidence: number;
  };
  cagr: {
    value: number;
    period: string;
    citation: string;
    source: string;
  };
  methodology: string;
  research_quality: 'high' | 'medium' | 'low';
  last_updated: string;
}

interface IndustryBreakdown {
  industry: string;
  weight: number;
  market_sizing: MarketSizing;
  research_sources: string[];
  validation_status: 'verified' | 'estimated' | 'pending';
}

export function IndustryMarketSizing({ deal }: IndustryMarketSizingProps) {
  const [loading, setLoading] = useState(false);
  const [industryBreakdowns, setIndustryBreakdowns] = useState<IndustryBreakdown[]>([]);
  const [overallMarketSizing, setOverallMarketSizing] = useState<MarketSizing | null>(null);
  const { toast } = useToast();

  const industries = React.useMemo(() => {
    if (!deal.industry) return [];
    
    // Parse multiple industries from the deal
    const primaryIndustry = deal.industry;
    const relatedIndustries = [];
    
    // Add related industries based on primary industry
    if (primaryIndustry.toLowerCase().includes('fintech')) {
      relatedIndustries.push('Financial Services', 'Technology');
    } else if (primaryIndustry.toLowerCase().includes('healthtech')) {
      relatedIndustries.push('Healthcare', 'Technology');
    } else if (primaryIndustry.toLowerCase().includes('edtech')) {
      relatedIndustries.push('Education', 'Technology');
    }
    
    return [primaryIndustry, ...relatedIndustries].slice(0, 3); // Limit to 3 industries
  }, [deal.industry]);

  const fetchMarketSizingData = async () => {
    if (industries.length === 0) return;
    
    setLoading(true);
    try {
      // Call market sizing research function for each industry
      const industryPromises = industries.map(async (industry, index) => {
        const { data, error } = await supabase.functions.invoke('market-sizing-research', {
          body: {
            industry,
            company_name: deal.company_name,
            target_market: deal.target_market || industry,
            geographic_scope: deal.countries_of_operation?.join(', ') || 'Global',
            context: {
              deal_id: deal.id,
              company_stage: deal.company_stage,
              business_model: deal.business_model
            }
          }
        });

        if (error) {
          console.error(`Error fetching market sizing for ${industry}:`, error);
          return null;
        }

        return {
          industry,
          weight: index === 0 ? 0.6 : 0.2, // Primary industry gets 60%, others 20% each
          market_sizing: data.market_sizing,
          research_sources: data.sources || [],
          validation_status: data.research_quality === 'high' ? 'verified' : 
                           data.research_quality === 'medium' ? 'estimated' : 'pending'
        } as IndustryBreakdown;
      });

      const results = await Promise.all(industryPromises);
      const validResults = results.filter(result => result !== null);
      
      setIndustryBreakdowns(validResults);
      
      // Calculate overall market sizing
      if (validResults.length > 0) {
        const weightedTAM = validResults.reduce((sum, breakdown) => 
          sum + (breakdown.market_sizing.tam.value * breakdown.weight), 0);
        
        const primaryIndustry = validResults[0];
        setOverallMarketSizing({
          tam: {
            value: Math.round(weightedTAM),
            currency: primaryIndustry.market_sizing.tam.currency,
            year: primaryIndustry.market_sizing.tam.year,
            citation: `Weighted analysis across ${validResults.length} industries`,
            source: 'Multi-industry analysis',
            confidence: Math.round(validResults.reduce((sum, b) => sum + b.market_sizing.tam.confidence, 0) / validResults.length)
          },
          sam: primaryIndustry.market_sizing.sam,
          som: primaryIndustry.market_sizing.som,
          cagr: primaryIndustry.market_sizing.cagr,
          methodology: 'Industry-weighted market sizing analysis',
          research_quality: validResults.every(b => b.validation_status === 'verified') ? 'high' : 'medium',
          last_updated: new Date().toISOString()
        });
      }

      toast({
        title: "Market sizing updated",
        description: `Analyzed ${validResults.length} industries with real market data`
      });

    } catch (error) {
      console.error('Error fetching market sizing:', error);
      toast({
        title: "Error fetching market data",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketSizingData();
  }, [deal.id, industries.length]);

  const formatCurrency = (value: number, currency: string = 'USD') => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B ${currency}`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M ${currency}`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K ${currency}`;
    }
    return `$${value.toLocaleString()} ${currency}`;
  };

  const getValidationIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'estimated':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  if (industries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No industry data available</p>
              <p className="text-sm">Add industry information to enable market sizing analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Market Sizing Summary */}
      {overallMarketSizing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Overall Market Opportunity</CardTitle>
              <Badge variant="outline" className={getQualityColor(overallMarketSizing.research_quality)}>
                {overallMarketSizing.research_quality} quality
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">TAM (Total Addressable Market)</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(overallMarketSizing.tam.value, overallMarketSizing.tam.currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Confidence: {overallMarketSizing.tam.confidence}%
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">SAM (Serviceable Addressable)</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(overallMarketSizing.sam.value, overallMarketSizing.sam.currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {overallMarketSizing.sam.calculation_method}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium">SOM (Serviceable Obtainable)</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(overallMarketSizing.som.value, overallMarketSizing.som.currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {overallMarketSizing.som.calculation_method}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Market Growth</span>
              </div>
              <div className="text-lg font-semibold">
                {overallMarketSizing.cagr.value}% CAGR
              </div>
              <div className="text-xs text-muted-foreground">
                {overallMarketSizing.cagr.period} • {overallMarketSizing.cagr.source}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Industry Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Industry Breakdown</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMarketSizingData}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Update Data
          </Button>
        </div>

        {industryBreakdowns.map((breakdown, index) => (
          <Card key={breakdown.industry}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{breakdown.industry}</CardTitle>
                  <Badge variant="secondary">{Math.round(breakdown.weight * 100)}% weight</Badge>
                  {getValidationIcon(breakdown.validation_status)}
                </div>
                <Badge variant="outline" className={getQualityColor(breakdown.market_sizing.research_quality)}>
                  {breakdown.market_sizing.research_quality} quality
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* TAM Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium">Total Addressable Market (TAM)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xl font-bold text-primary">
                      {formatCurrency(breakdown.market_sizing.tam.value, breakdown.market_sizing.tam.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {breakdown.market_sizing.tam.year} • Confidence: {breakdown.market_sizing.tam.confidence}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Citation:</div>
                    <div className="text-sm border-l-2 border-primary/20 pl-2">
                      {breakdown.market_sizing.tam.citation}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Source: {breakdown.market_sizing.tam.source}
                    </div>
                  </div>
                </div>
              </div>

              {/* SAM Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Serviceable Addressable Market (SAM)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(breakdown.market_sizing.sam.value, breakdown.market_sizing.sam.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Confidence: {breakdown.market_sizing.sam.confidence}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Calculation Method:</div>
                    <div className="text-sm border-l-2 border-blue-600/20 pl-2">
                      {breakdown.market_sizing.sam.calculation_method}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Rationale: {breakdown.market_sizing.sam.rationale}
                    </div>
                  </div>
                </div>
              </div>

              {/* SOM Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">Serviceable Obtainable Market (SOM)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xl font-bold text-emerald-600">
                      {formatCurrency(breakdown.market_sizing.som.value, breakdown.market_sizing.som.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Confidence: {breakdown.market_sizing.som.confidence}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Calculation Method:</div>
                    <div className="text-sm border-l-2 border-emerald-600/20 pl-2">
                      {breakdown.market_sizing.som.calculation_method}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Rationale: {breakdown.market_sizing.som.rationale}
                    </div>
                  </div>
                </div>
              </div>

              {/* Research Sources */}
              {breakdown.research_sources.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm font-medium">Research Sources</span>
                  </div>
                  <div className="space-y-1">
                    {breakdown.research_sources.map((source, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ExternalLink className="h-3 w-3" />
                        {source}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && industryBreakdowns.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                <p className="text-lg font-medium">Researching market data...</p>
                <p className="text-sm text-muted-foreground">Sourcing real market intelligence and citations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}