import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Users,
  Lightbulb,
  DollarSign,
  Target,
  ExternalLink,
  Shield,
  Zap,
  Clock,
  Activity,
  Cpu,
  BarChart3
} from 'lucide-react';
import { CategoryDeepDive } from '@/types/enhanced-deal-analysis';
import { MarketOpportunityDeepDive } from './deep-dive/MarketOpportunityDeepDive';
import { TeamLeadershipDeepDive } from './deep-dive/TeamLeadershipDeepDive';
import { ProductTechnologyDeepDive } from './deep-dive/ProductTechnologyDeepDive';
import { FinancialHealthDeepDive } from './deep-dive/FinancialHealthDeepDive';
import { BusinessTractionDeepDive } from './deep-dive/BusinessTractionDeepDive';

interface SubCriteriaItem {
  name: string;
  score: number;
  weight: number;
  confidence?: number;
  reasoning?: string;
}

interface CategoryDeepDiveSectionProps {
  category: string;
  score: number;
  confidence: number;
  weight: number;
  insights: string[];
  strengths: string[];
  concerns: string[];
  detailedAnalysis?: CategoryDeepDive;
  subCriteria?: SubCriteriaItem[];
}

const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('market')) return <TrendingUp className="h-5 w-5" />;
  if (lowerCategory.includes('team') || lowerCategory.includes('leadership')) return <Users className="h-5 w-5" />;
  if (lowerCategory.includes('product') || lowerCategory.includes('technology')) return <Lightbulb className="h-5 w-5" />;
  if (lowerCategory.includes('financial') || lowerCategory.includes('health') || lowerCategory.includes('performance')) return <DollarSign className="h-5 w-5" />;
  if (lowerCategory.includes('traction') || lowerCategory.includes('business')) return <BarChart3 className="h-5 w-5" />;
  if (lowerCategory.includes('operational') || lowerCategory.includes('excellence')) return <Shield className="h-5 w-5" />;
  if (lowerCategory.includes('growth') || lowerCategory.includes('potential')) return <TrendingUp className="h-5 w-5" />;
  if (lowerCategory.includes('position')) return <Target className="h-5 w-5" />;
  if (lowerCategory.includes('trust') || lowerCategory.includes('transparency')) return <Shield className="h-5 w-5" />;
  if (lowerCategory.includes('timing') || lowerCategory.includes('strategic timing')) return <Clock className="h-5 w-5" />;
  if (lowerCategory.includes('strategic') && lowerCategory.includes('fit')) return <Target className="h-5 w-5" />;
  return <Activity className="h-5 w-5" />;
};

const getDeepDiveComponent = (category: string, detailedAnalysis?: CategoryDeepDive) => {
  if (!detailedAnalysis) return null;
  
  const lowerCategory = category.toLowerCase();
  // VC Categories
  if (lowerCategory.includes('market') && detailedAnalysis.market_opportunity) {
    return <MarketOpportunityDeepDive data={detailedAnalysis.market_opportunity} />;
  }
  if (lowerCategory.includes('team') && detailedAnalysis.team_leadership) {
    return <TeamLeadershipDeepDive data={detailedAnalysis.team_leadership} />;
  }
  if (lowerCategory.includes('product') && detailedAnalysis.product_technology) {
    return <ProductTechnologyDeepDive data={detailedAnalysis.product_technology} />;
  }
  if (lowerCategory.includes('financial') && detailedAnalysis.financial_health) {
    return <FinancialHealthDeepDive data={detailedAnalysis.financial_health} />;
  }
  if (lowerCategory.includes('traction') && detailedAnalysis.business_traction) {
    return <BusinessTractionDeepDive data={detailedAnalysis.business_traction} />;
  }
  
  // PE Categories - map to closest equivalent deep dive components
  if (lowerCategory.includes('performance') && detailedAnalysis.financial_health) {
    return <FinancialHealthDeepDive data={detailedAnalysis.financial_health} />;
  }
  if (lowerCategory.includes('position') && detailedAnalysis.market_opportunity) {
    return <MarketOpportunityDeepDive data={detailedAnalysis.market_opportunity} />;
  }
  if (lowerCategory.includes('operational') && detailedAnalysis.team_leadership) {
    return <TeamLeadershipDeepDive data={detailedAnalysis.team_leadership} />;
  }
  if (lowerCategory.includes('growth') && detailedAnalysis.business_traction) {
    return <BusinessTractionDeepDive data={detailedAnalysis.business_traction} />;
  }
  
  return null;
};

export function CategoryDeepDiveSection({
  category,
  score,
  confidence,
  weight,
  insights,
  strengths,
  concerns,
  detailedAnalysis,
  subCriteria
}: CategoryDeepDiveSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Emergency fix: ensure insights is always an array
  const safeInsights = Array.isArray(insights) ? insights : [insights || 'Analysis completed'];
  const safeStrengths = Array.isArray(strengths) ? strengths : [strengths || 'Detailed analysis available'];
  const safeConcerns = Array.isArray(concerns) ? concerns : [];
  
  const hasDeepDive = detailedAnalysis && Object.keys(detailedAnalysis).length > 0;
  const deepDiveComponent = getDeepDiveComponent(category, detailedAnalysis);

  return (
    <Card className="card-xero">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg capitalize text-foreground flex items-center gap-2">
            {getCategoryIcon(category)}
            {category.replace(/_/g, ' ')}
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="outline">
              {score}/100
            </Badge>
            <Badge variant="outline">
              Weight: {weight}%
            </Badge>
            <Badge 
              variant="outline"
              className={`${
                confidence >= 80 ? 'text-success' :
                confidence >= 60 ? 'text-warning' :
                'text-destructive'
              }`}
            >
              {confidence}% confidence
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Analysis (existing functionality) */}
        <div className="space-y-4">
           {/* Key Insights */}
           {safeInsights && safeInsights.length > 0 && safeInsights[0] !== 'Analysis scheduled' && (
             <div>
               <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                 <Zap className="h-4 w-4 text-muted-foreground" />
                 Key Insights
               </h4>
               <ul className="space-y-1">
                 {safeInsights.map((insight, i) => (
                   <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                     <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                     {insight}
                   </li>
                 ))}
               </ul>
             </div>
           )}

          {/* Strengths and Concerns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeStrengths && safeStrengths.length > 0 && (
              <div>
                <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {safeStrengths.map((strength, i) => (
                    <li key={i} className="text-sm text-success flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-success rounded-full mt-2 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {safeConcerns && safeConcerns.length > 0 && (
              <div>
                <h4 className="font-semibold text-warning mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Concerns
                </h4>
                <ul className="space-y-1">
                  {safeConcerns.map((concern, i) => (
                    <li key={i} className="text-sm text-warning flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sub-Criteria Breakdown Section */}
        {subCriteria && subCriteria.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Sub-Criteria Breakdown
            </h4>
            <div className="grid gap-3">
              {subCriteria.map((subCriteria, index) => (
                <div key={index} className="bg-muted/20 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{subCriteria.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {subCriteria.score}/100
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {subCriteria.weight}%
                      </Badge>
                    </div>
                  </div>
                  {subCriteria.confidence && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          subCriteria.confidence >= 80 ? 'text-success' :
                          subCriteria.confidence >= 60 ? 'text-warning' :
                          'text-destructive'
                        }`}
                      >
                        {subCriteria.confidence}%
                      </Badge>
                    </div>
                  )}
                  {subCriteria.reasoning && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {subCriteria.reasoning}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deep Dive Section - Always available but shows real data only */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                View Detailed Analysis
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="border-t border-border pt-4">
              {hasDeepDive && deepDiveComponent ? (
                deepDiveComponent
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Real Analysis Data Required</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deep-dive analysis will show real engine data once the comprehensive analysis completes.
                    Engine results will populate market research, team analysis, financial assessment, and more.
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <span>Analysis Status:</span>
                    <Badge variant="outline" className="text-xs">
                      Waiting for Engine Data
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}