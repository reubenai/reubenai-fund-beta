import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Users, 
  Trophy, 
  Target,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface MarketPositionAssessmentProps {
  deal: any;
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Leading': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Competitive': 'bg-amber-100 text-amber-700 border-amber-200',
    'Challenging': 'bg-red-100 text-red-700 border-red-200',
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

export function MarketPositionAssessment({ deal }: MarketPositionAssessmentProps) {
  // Extract market position metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const marketScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Market Position'
  )?.score || 0;

  const getOverallStatus = (score: number) => {
    if (score >= 85) return 'Leading';
    if (score >= 70) return 'Competitive';
    return 'Challenging';
  };

  const overallStatus = getOverallStatus(marketScore);

  // Enhanced criteria analysis based on deal data
  const getMarketShareAnalysis = () => {
    if (marketScore >= 80) return 'Dominant market position with 25%+ market share. Clear market leadership in target segments with strong competitive moat.';
    if (marketScore >= 65) return 'Strong market position with 10-25% share. Well-established presence with growth opportunities in adjacent markets.';
    if (marketScore >= 40) return 'Moderate market position with 3-10% share. Niche player with potential for market expansion through strategic initiatives.';
    return 'Limited market share (<3%) but operating in high-growth segment. Significant opportunity for market penetration with proper execution.';
  };

  const getCompetitiveAdvantageAnalysis = () => {
    if (marketScore >= 75) return 'Sustainable competitive advantages through proprietary technology, exclusive partnerships, or regulatory barriers. Difficult to replicate by competitors.';
    if (marketScore >= 60) return 'Clear differentiation through superior product quality, customer service, or operational efficiency. Moderate barriers to entry.';
    if (marketScore >= 35) return 'Some competitive advantages present but not fully developed. Opportunities to strengthen positioning through strategic investments.';
    return 'Limited competitive differentiation identified. Requires strategic repositioning and capability building to establish sustainable advantages.';
  };

  const getBrandStrengthAnalysis = () => {
    if (marketScore >= 70) return 'Strong brand recognition with high customer loyalty and premium pricing power. Established thought leadership in industry.';
    if (marketScore >= 55) return 'Moderate brand awareness with positive customer sentiment. Good foundation for brand development and market expansion.';
    if (marketScore >= 30) return 'Emerging brand with growing recognition in target segments. Requires continued investment in brand building and marketing.';
    return 'Limited brand awareness outside core customer base. Significant opportunity for brand development and market positioning enhancement.';
  };

  const getCustomerBaseAnalysis = () => {
    if (marketScore >= 75) return 'Highly diversified customer base across multiple segments and geographies. Strong customer retention (>90%) with predictable revenue streams.';
    if (marketScore >= 60) return 'Well-balanced customer portfolio with moderate concentration risk. Good customer satisfaction and retention rates (80-90%).';
    if (marketScore >= 40) return 'Growing customer base with some concentration in key accounts. Opportunity to diversify and strengthen customer relationships.';
    return 'Customer base shows high concentration risk with dependence on key accounts. Requires strategic focus on customer acquisition and diversification.';
  };

  const criteria = [
    {
      criterion: 'Market Share',
      aligned: marketScore >= 65,
      reasoning: getMarketShareAnalysis(),
      icon: <Globe className="h-4 w-4" />,
      weight: 30,
      score: Math.max(0, marketScore - 10)
    },
    {
      criterion: 'Competitive Advantage',
      aligned: marketScore >= 60,
      reasoning: getCompetitiveAdvantageAnalysis(),
      icon: <Shield className="h-4 w-4" />,
      weight: 25,
      score: Math.max(0, marketScore - 5)
    },
    {
      criterion: 'Brand Strength',
      aligned: marketScore >= 55,
      reasoning: getBrandStrengthAnalysis(),
      icon: <Trophy className="h-4 w-4" />,
      weight: 20,
      score: Math.min(100, marketScore + 5)
    },
    {
      criterion: 'Customer Base',
      aligned: marketScore >= 60,
      reasoning: getCustomerBaseAnalysis(),
      icon: <Users className="h-4 w-4" />,
      weight: 25,
      score: marketScore
    }
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Overall Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-background">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Overall Market Position</p>
                <p className="text-sm text-muted-foreground">
                  Based on {criteria.length} criteria
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={`${getStatusColor(overallStatus)} mb-2`}>
                {overallStatus}
              </Badge>
              <div className="flex items-center gap-2">
                <Progress value={marketScore} className="w-24" />
                <span className="text-sm font-medium">{marketScore}%</span>
              </div>
            </div>
          </div>

          {/* Individual Criteria */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Individual Criteria</h4>
            {criteria.map((criterion, index) => (
              <div key={index} className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {criterion.icon}
                      {getStatusIcon(criterion.aligned)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{criterion.criterion}</p>
                      <span className="text-xs text-muted-foreground">Weight: {criterion.weight}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={criterion.score} className="w-20" />
                    <span className="text-xs font-medium min-w-[35px]">{criterion.score}%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{criterion.reasoning}</p>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="p-4 rounded-lg bg-muted/30 border">
            <h4 className="font-medium text-sm mb-2">Recommendations</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {overallStatus === 'Leading' && (
                <p>✅ Strong market position provides competitive advantage. Focus on defending and expanding position.</p>
              )}
              {overallStatus === 'Competitive' && (
                <p>⚠️ Solid market position with room for improvement. Identify opportunities to strengthen competitive moat.</p>
              )}
              {overallStatus === 'Challenging' && (
                <p>❌ Market position requires attention. Develop strategies to improve competitive standing.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}