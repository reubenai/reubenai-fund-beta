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
  Zap
} from 'lucide-react';
import { CategoryDeepDive } from '@/types/enhanced-deal-analysis';
import { MarketOpportunityDeepDive } from './deep-dive/MarketOpportunityDeepDive';
import { TeamLeadershipDeepDive } from './deep-dive/TeamLeadershipDeepDive';
import { ProductTechnologyDeepDive } from './deep-dive/ProductTechnologyDeepDive';
import { FinancialHealthDeepDive } from './deep-dive/FinancialHealthDeepDive';
import { BusinessTractionDeepDive } from './deep-dive/BusinessTractionDeepDive';

interface CategoryDeepDiveSectionProps {
  category: string;
  score: number;
  confidence: number;
  weight: number;
  insights: string[];
  strengths: string[];
  concerns: string[];
  detailedAnalysis?: CategoryDeepDive;
}

const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('market')) return <TrendingUp className="h-5 w-5" />;
  if (lowerCategory.includes('team') || lowerCategory.includes('leadership')) return <Users className="h-5 w-5" />;
  if (lowerCategory.includes('product') || lowerCategory.includes('technology')) return <Lightbulb className="h-5 w-5" />;
  if (lowerCategory.includes('financial') || lowerCategory.includes('health')) return <DollarSign className="h-5 w-5" />;
  if (lowerCategory.includes('traction') || lowerCategory.includes('business')) return <Target className="h-5 w-5" />;
  return <Zap className="h-5 w-5" />;
};

const getDeepDiveComponent = (category: string, detailedAnalysis?: CategoryDeepDive) => {
  if (!detailedAnalysis) return null;
  
  const lowerCategory = category.toLowerCase();
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
  detailedAnalysis
}: CategoryDeepDiveSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
          {insights && insights.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                Key Insights
              </h4>
              <ul className="space-y-1">
                {insights.map((insight, i) => (
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
            {strengths && strengths.length > 0 && (
              <div>
                <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {strengths.map((strength, i) => (
                    <li key={i} className="text-sm text-success flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-success rounded-full mt-2 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {concerns && concerns.length > 0 && (
              <div>
                <h4 className="font-semibold text-warning mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Concerns
                </h4>
                <ul className="space-y-1">
                  {concerns.map((concern, i) => (
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

        {/* Deep Dive Section - Always available */}
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
                <div className="space-y-4">
                  {/* Demo Deep-Dive Content based on category */}
                  {category.toLowerCase().includes('market') && (
                    <MarketOpportunityDeepDive 
                      data={{
                        tam_sam_som: { tam: "$2.8T", sam: "$350B", som: "$45B" },
                        growth_drivers: [
                          "Increasing demand for sustainable technology solutions",
                          "Government regulations driving green initiatives",
                          "Corporate ESG commitments creating market pull"
                        ],
                        market_risks: [
                          "Regulatory uncertainty in emerging markets",
                          "High capital requirements for scaling",
                          "Competition from established players"
                        ],
                        competitive_positioning: [
                          { 
                            name: "Traditional Plastics Inc", 
                            market_share: "45%",
                            positioning: "Incumbent", 
                            strengths: ["Scale", "Distribution"],
                            weaknesses: ["Innovation lag", "Sustainability concerns"]
                          },
                          { 
                            name: "GreenTech Solutions", 
                            market_share: "12%",
                            positioning: "Direct Competitor", 
                            strengths: ["Innovation", "Sustainability"],
                            weaknesses: ["Limited scale", "High costs"]
                          }
                        ],
                        customer_validation: [
                          { 
                            segment: "Enterprise", 
                            validation_level: "high" as const,
                            feedback: "3 pilot programs running with positive initial results",
                            revenue_potential: "$10M ARR potential"
                          }
                        ],
                        geographic_opportunities: [
                          { 
                            region: "North America", 
                            market_size: "$150B",
                            penetration_opportunity: "Early market entry opportunity in sustainable packaging"
                          }
                        ]
                      }}
                    />
                  )}
                  
                  {category.toLowerCase().includes('team') && (
                    <TeamLeadershipDeepDive 
                      data={{
                        founder_profiles: [
                          { 
                            name: "Analysis pending", 
                            role: "CEO/Founder",
                            background: "Comprehensive founder analysis pending - insufficient data",
                            linkedin_validated: false,
                            previous_exits: [],
                            expertise_areas: ["To be determined"]
                          }
                        ],
                        team_gaps: ["Analysis pending - insufficient data"],
                        execution_track_record: [],
                        advisory_strength: []
                      }}
                    />
                  )}
                  
                  {category.toLowerCase().includes('product') && (
                    <ProductTechnologyDeepDive 
                      data={{
                        ip_portfolio: [],
                        competitive_moats: [],
                        technical_advantages: [],
                        development_roadmap: []
                      }}
                    />
                  )}
                  
                  {category.toLowerCase().includes('financial') && (
                    <FinancialHealthDeepDive 
                      data={{
                        revenue_breakdown: [],
                        unit_economics: {
                          cac: "TBD",
                          ltv: "TBD",
                          ltv_cac_ratio: 0,
                          payback_period: "TBD",
                          gross_margin: "TBD"
                        },
                        burn_analysis: {
                          monthly_burn: "TBD",
                          runway_months: 0,
                          burn_efficiency: "TBD",
                          optimization_opportunities: []
                        },
                        funding_scenarios: []
                      }}
                    />
                  )}
                  
                  {category.toLowerCase().includes('traction') && (
                    <BusinessTractionDeepDive 
                      data={{
                        customer_metrics: [],
                        partnership_pipeline: [],
                        market_penetration: [],
                        growth_trajectory: []
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}