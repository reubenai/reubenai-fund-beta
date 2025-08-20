import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign,
  Target,
  Globe,
  ChevronDown,
  ChevronRight,
  Shield,
  Zap
} from 'lucide-react';
import { IndustryCompetitiveAnalysis, CompetitorAnalysis } from '@/types/enhanced-deal-analysis';

interface EnhancedCompetitivePositionProps {
  data: {
    competitive_breakdown?: IndustryCompetitiveAnalysis[];
    competitive_landscape?: CompetitorAnalysis[];
  };
}

const CompetitorCard: React.FC<{ competitor: CompetitorAnalysis }> = ({ competitor }) => {
  const getStageColor = (stage?: string) => {
    const colors: Record<string, string> = {
      'Seed': 'bg-green-100 text-green-700',
      'Series A': 'bg-blue-100 text-blue-700',
      'Series B': 'bg-purple-100 text-purple-700',
      'Series C+': 'bg-orange-100 text-orange-700',
      'Public': 'bg-gray-100 text-gray-700',
      'Incumbent': 'bg-red-100 text-red-700'
    };
    return colors[stage || 'Unknown'] || 'bg-gray-100 text-gray-700';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Incumbent': <Building2 className="h-4 w-4" />,
      'Challenger': <Target className="h-4 w-4" />,
      'Emerging': <Zap className="h-4 w-4" />,
      'Whitespace': <Globe className="h-4 w-4" />
    };
    return icons[type] || <Building2 className="h-4 w-4" />;
  };

  const formatValuation = (val?: number) => {
    if (!val) return 'Undisclosed';
    if (val >= 1000000000) return `$${(val / 1000000000).toFixed(1)}B`;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(0)}M`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <Card className="mb-4 border-l-4 border-l-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon(competitor.competitor_type)}
            <h4 className="font-semibold text-sm">{competitor.name}</h4>
          </div>
          <div className="flex gap-2">
            {competitor.funding_stage && (
              <Badge variant="outline" className={getStageColor(competitor.funding_stage)}>
                {competitor.funding_stage}
              </Badge>
            )}
            {competitor.market_share && (
              <Badge variant="secondary">
                {competitor.market_share}% market share
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Valuation:</span>
              <p className="font-medium">{formatValuation(competitor.valuation)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Geography:</span>
              <p className="font-medium">{competitor.geography.join(', ')}</p>
            </div>
          </div>
          
          <div>
            <span className="text-muted-foreground text-sm">Positioning:</span>
            <p className="text-sm mt-1">{competitor.positioning}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground text-sm">Strengths:</span>
              <ul className="text-sm mt-1 space-y-1">
                {competitor.strengths.slice(0, 3).map((strength, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-green-600" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Weaknesses:</span>
              <ul className="text-sm mt-1 space-y-1">
                {competitor.weaknesses.slice(0, 3).map((weakness, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-red-600" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const IndustryCompetitiveSection: React.FC<{ industry: IndustryCompetitiveAnalysis }> = ({ industry }) => {
  const [expanded, setExpanded] = useState(false);

  const getFragmentationColor = (fragmentation: string) => {
    const colors: Record<string, string> = {
      'Concentrated': 'bg-red-100 text-red-700',
      'Moderate': 'bg-yellow-100 text-yellow-700',
      'Fragmented': 'bg-green-100 text-green-700'
    };
    return colors[fragmentation] || 'bg-gray-100 text-gray-700';
  };

  const getTensionColor = (tension: string) => {
    const colors: Record<string, string> = {
      'High': 'bg-red-100 text-red-700',
      'Medium': 'bg-yellow-100 text-yellow-700',
      'Low': 'bg-green-100 text-green-700'
    };
    return colors[tension] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{industry.industry}</CardTitle>
            <Badge variant="outline">
              Weight: {Math.round(industry.weight * 100)}%
            </Badge>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{industry.hhi_index.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">HHI Index</p>
          </div>
          <div className="text-center">
            <Badge className={getFragmentationColor(industry.market_fragmentation)}>
              {industry.market_fragmentation}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">Market Structure</p>
          </div>
          <div className="text-center">
            <Badge className={getTensionColor(industry.competitive_tension)}>
              {industry.competitive_tension}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">Competitive Tension</p>
          </div>
        </div>

        {expanded && (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Key Competitors ({industry.competitors.length})
              </h4>
              <div className="space-y-3">
                {industry.competitors.map((competitor, idx) => (
                  <CompetitorCard key={idx} competitor={competitor} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Whitespace Opportunities
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {industry.whitespace_opportunities.map((opportunity, idx) => (
                  <Badge key={idx} variant="outline" className="justify-start p-2">
                    {opportunity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
              <p className="text-muted-foreground">Enhanced competitive analysis in progress</p>
              <p className="text-sm text-muted-foreground mt-1">
                Real competitor mapping and intelligence gathering underway
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Multi-industry competitive analysis
  if (data.competitive_breakdown && data.competitive_breakdown.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Competitive Position by Industry</h3>
        </div>
        
        {data.competitive_breakdown.map((industry, idx) => (
          <IndustryCompetitiveSection key={idx} industry={industry} />
        ))}
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
              <CompetitorCard key={idx} competitor={competitor} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};