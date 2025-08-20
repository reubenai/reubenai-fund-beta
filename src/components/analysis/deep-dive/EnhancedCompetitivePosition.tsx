import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, DollarSign, Globe, TrendingUp, Users, Target, Zap } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ChartTooltip, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid } from 'recharts';

interface CompetitorData {
  name: string;
  website?: string;
  description: string;
  funding_stage?: string;
  valuation?: number;
  market_share?: number;
  geography: string[];
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  competitor_type: 'Incumbent' | 'Challenger' | 'Emerging' | 'Whitespace';
}

interface IndustryCompetitiveAnalysis {
  industry: string;
  weight: number;
  competitors: CompetitorData[];
  hhi_index: number;
  competitive_tension: 'High' | 'Medium' | 'Low';
  whitespace_opportunities: string[];
  market_fragmentation: 'Concentrated' | 'Moderate' | 'Fragmented';
  citation: any;
}

interface CompetitorAnalysis {
  name: string;
  market_share: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  funding_stage?: string;
  valuation?: number;
  last_funding?: number;
  geography?: string[];
  competitor_type: 'Incumbent' | 'Challenger' | 'Emerging' | 'Whitespace';
}

interface EnhancedCompetitivePositionProps {
  data: {
    competitive_breakdown?: IndustryCompetitiveAnalysis[];
    competitive_landscape?: CompetitorAnalysis[];
  };
}

const formatValuation = (valuation?: number): string => {
  if (!valuation || valuation === 0) return 'Private';
  if (valuation >= 1000000000) return `$${(valuation / 1000000000).toFixed(1)}B`;
  if (valuation >= 1000000) return `$${(valuation / 1000000).toFixed(0)}M`;
  return `$${(valuation / 1000).toFixed(0)}K`;
};

const getCompetitorTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'Incumbent': 'bg-red-100 text-red-700 border-red-200',
    'Challenger': 'bg-blue-100 text-blue-700 border-blue-200',
    'Emerging': 'bg-green-100 text-green-700 border-green-200',
    'Whitespace': 'bg-purple-100 text-purple-700 border-purple-200'
  };
  return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getFragmentationColor = (fragmentation: string) => {
  const colors: Record<string, string> = {
    'Concentrated': 'bg-red-100 text-red-700 border-red-200',
    'Moderate': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Fragmented': 'bg-green-100 text-green-700 border-green-200'
  };
  return colors[fragmentation] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getTensionColor = (tension: string) => {
  const colors: Record<string, string> = {
    'High': 'bg-red-100 text-red-700 border-red-200',
    'Medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Low': 'bg-green-100 text-green-700 border-green-200'
  };
  return colors[tension] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const CompetitiveMatrix: React.FC<{ industry: IndustryCompetitiveAnalysis }> = ({ industry }) => {
  // Prepare data for scatter plot matrix
  const matrixData = industry.competitors.map(comp => ({
    name: comp.name,
    x: comp.market_share || 0,
    y: comp.valuation ? Math.log10(comp.valuation) : 6, // Log scale for valuation
    size: (comp.market_share || 1) * 2, // Size based on market share
    type: comp.competitor_type,
    valuation: comp.valuation || 0,
    funding_stage: comp.funding_stage || 'Unknown'
  }));

  // Prepare data for pie chart
  const pieData = industry.competitors
    .filter(comp => (comp.market_share || 0) > 0)
    .map(comp => ({
      name: comp.name,
      value: comp.market_share || 0,
      type: comp.competitor_type
    }));

  // Add whitespace to pie chart
  const totalShare = pieData.reduce((sum, item) => sum + item.value, 0);
  if (totalShare < 100) {
    pieData.push({
      name: 'Market Whitespace',
      value: 100 - totalShare,
      type: 'Whitespace' as const
    });
  }

  const COLORS = {
    'Incumbent': '#ef4444',
    'Challenger': '#3b82f6', 
    'Emerging': '#10b981',
    'Whitespace': '#e5e7eb'
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{industry.hhi_index}</div>
          <div className="text-sm text-muted-foreground">HHI Index</div>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <Badge className={getFragmentationColor(industry.market_fragmentation)}>
            {industry.market_fragmentation}
          </Badge>
          <div className="text-sm text-muted-foreground mt-1">Market Structure</div>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <Badge className={getTensionColor(industry.competitive_tension)}>
            {industry.competitive_tension}
          </Badge>
          <div className="text-sm text-muted-foreground mt-1">Competitive Tension</div>
        </div>
      </div>

      {/* Competitive Matrix and Market Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Share Distribution */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Market Share Distribution
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={30}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm">{Number(data.value).toFixed(1)}% market share</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                ></div>
                <span>{type}s</span>
              </div>
            ))}
          </div>
        </div>

        {/* Competitive Positioning Matrix */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Competitive Matrix
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Market Share (%)"
                  domain={[0, 'dataMax + 10']}
                  label={{ value: 'Market Share (%)', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Valuation (log)"
                  domain={['dataMin - 1', 'dataMax + 1']}
                  label={{ value: 'Valuation (log scale)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `10^${value.toFixed(0)}`}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm">Market Share: {data.x.toFixed(1)}%</p>
                          <p className="text-sm">Valuation: {formatValuation(data.valuation)}</p>
                          <p className="text-sm">Stage: {data.funding_stage}</p>
                          <Badge 
                            className={`${getCompetitorTypeColor(data.type)} text-xs mt-1`}
                          >
                            {data.type}
                          </Badge>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  data={matrixData} 
                  fill="hsl(var(--primary))"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Competitors List */}
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Key Market Players ({industry.competitors.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {industry.competitors.slice(0, 6).map((competitor, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">{competitor.name}</span>
                </div>
                <Badge className={getCompetitorTypeColor(competitor.competitor_type)}>
                  {competitor.competitor_type}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Market Share:</span>
                <span className="font-medium">{(competitor.market_share || 0).toFixed(1)}%</span>
              </div>
              
              {competitor.valuation && competitor.valuation > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valuation:</span>
                  <span className="font-medium">{formatValuation(competitor.valuation)}</span>
                </div>
              )}
              
              {competitor.funding_stage && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stage:</span>
                  <span className="font-medium">{competitor.funding_stage}</span>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">{competitor.positioning}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Whitespace Opportunities */}
      {industry.whitespace_opportunities.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Whitespace Opportunities
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {industry.whitespace_opportunities.map((opportunity, idx) => (
              <Badge key={idx} variant="outline" className="justify-start p-3 text-xs">
                {opportunity}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const EnhancedCompetitivePosition: React.FC<EnhancedCompetitivePositionProps> = ({ data }) => {
  if (!data.competitive_breakdown && !data.competitive_landscape) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="text-muted-foreground">Competitive analysis in progress</p>
              <p className="text-sm text-muted-foreground mt-1">
                Real competitor mapping and intelligence gathering underway
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Multi-industry competitive analysis - no double expansion, direct display
  if (data.competitive_breakdown && data.competitive_breakdown.length > 0) {
    const industry = data.competitive_breakdown[0]; // Show first industry directly
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{industry.industry} Competitive Landscape</h3>
        </div>
        
        <CompetitiveMatrix industry={industry} />
      </div>
    );
  }

  // Legacy single-industry view
  if (data.competitive_landscape && data.competitive_landscape.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Competitive Landscape
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.competitive_landscape.map((competitor, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{competitor.name}</span>
                  <Badge className={getCompetitorTypeColor(competitor.competitor_type)}>
                    {competitor.competitor_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{competitor.positioning}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};