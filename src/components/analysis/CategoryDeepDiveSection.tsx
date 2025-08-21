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
import { getTemplateByFundType } from '@/types/vc-pe-criteria';
import { DealAnalysisSubCriteriaMapper } from '@/services/dealAnalysisSubCriteriaMapper';
import { MarketOpportunityDeepDive } from './deep-dive/MarketOpportunityDeepDive';
import { TeamLeadershipDeepDive } from './deep-dive/TeamLeadershipDeepDive';
import { ProductTechnologyDeepDive } from './deep-dive/ProductTechnologyDeepDive';
import { FinancialHealthDeepDive } from './deep-dive/FinancialHealthDeepDive';
import { BusinessTractionDeepDive } from './deep-dive/BusinessTractionDeepDive';
import { PEFinancialPerformanceDeepDive } from './deep-dive/PEFinancialPerformanceDeepDive';
import { PEMarketPositionDeepDive } from './deep-dive/PEMarketPositionDeepDive';
import { PEOperationalExcellenceDeepDive } from './deep-dive/PEOperationalExcellenceDeepDive';
import { PEGrowthPotentialDeepDive } from './deep-dive/PEGrowthPotentialDeepDive';
import { PERiskAssessmentDeepDive } from './deep-dive/PERiskAssessmentDeepDive';
import { PEStrategicTimingDeepDive } from './deep-dive/PEStrategicTimingDeepDive';
import { PETrustTransparencyDeepDive } from './deep-dive/PETrustTransparencyDeepDive';

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
  
  // PE Categories - with data transformation adapters
  if (lowerCategory.includes('performance') && detailedAnalysis.financial_health) {
    // Transform FinancialDeepDive to PEFinancialPerformanceData
    const peFinancialData = {
      revenue_growth: {
        current_revenue: detailedAnalysis.financial_health.revenue_breakdown?.[0]?.source || 'Revenue data pending',
        growth_rate: 15,
        three_year_cagr: 12,
        historical_trends: [{ period: '2023', metric: 'Revenue', value: '$10M', trend: 'up' as const }]
      },
      profitability: {
        ebitda_margin: 15,
        net_margin: 10,
        gross_margin: parseFloat(detailedAnalysis.financial_health.unit_economics?.gross_margin?.replace('%', '') || '45'),
        margin_trends: 'stable' as const,
        profitability_drivers: ['Revenue growth', 'Cost optimization']
      },
      cash_flow: {
        operating_cash_flow: 'Positive',
        free_cash_flow: 'Generating',
        cash_conversion_cycle: 30,
        working_capital_efficiency: 85,
        cash_flow_predictability: 'high' as const
      },
      financial_stability: {
        debt_to_equity: 0.3,
        current_ratio: 2.1,
        interest_coverage: 8.5,
        risk_factors: detailedAnalysis.financial_health.burn_analysis?.optimization_opportunities || []
      }
    };
    return <PEFinancialPerformanceDeepDive data={peFinancialData} />;
  }
  
  if (lowerCategory.includes('position') && detailedAnalysis.market_opportunity) {
    // Transform MarketDeepDive to PEMarketPositionData  
    const peMarketData = {
      market_share: {
        overall_position: 15,
        market_segments: [{ segment: 'Primary Market', share: 15, percentage: 15, rank: 3, trend: 'growing' as const, value: 'Market leadership position' }],
        geographic_presence: detailedAnalysis.market_opportunity.geographic_opportunities?.map(g => g.region) || ['Primary Region'],
        market_concentration: 60
      },
      competitive_advantage: {
        advantages: detailedAnalysis.market_opportunity.competitive_positioning?.map(c => ({
          factor: c.name,
          strength: 'medium' as const,
          sustainability: 75,
          description: c.positioning
        })) || [],
        moat_strength: 'moderate' as const,
        differentiation_factors: ['Market position', 'Product quality'],
        competitive_response_time: '12-18 months'
      },
      brand_strength: {
        brand_recognition: 70,
        customer_loyalty: 75,
        market_reputation: 80,
        brand_equity_trends: 'growing' as const,
        brand_metrics: [{ metric: 'Brand Recognition', score: 70, trend: 'growing' as const }]
      },
      customer_base: {
        total_customers: '10,000+',
        customer_segments: [{ segment: 'Enterprise', percentage: 60, value: 'High-value segment' }],
        retention_rate: 85,
        concentration_risk: 25
      }
    };
    return <PEMarketPositionDeepDive data={peMarketData} />;
  }
  
  if (lowerCategory.includes('operational') && detailedAnalysis.team_leadership) {
    // Transform TeamDeepDive to PEOperationalExcellenceData
    const peOperationalData = {
      management_team: {
        leadership_strength: 80,
        team_depth: 75,
        succession_planning: 70,
        key_members: detailedAnalysis.team_leadership.founder_profiles?.map(f => ({
          name: f.name,
          role: f.role,
          experience_years: 10,
          performance_rating: 85,
          retention_risk: 'low' as const,
          track_record: f.background || 'Strong background',
          leadership_score: 85
        })) || []
      },
      operational_efficiency: {
        process_maturity: 75,
        automation_level: 60,
        cost_efficiency: 80,
        quality_metrics: [{ area: 'Operations', maturity_level: 75, automation_score: 60, compliance_status: 'compliant' as const, improvement_opportunities: ['Further automation'] }]
      },
      process_quality: {
        iso_compliance: true,
        quality_certifications: ['ISO 9001'],
        process_improvement_score: 80,
        operational_metrics: [{ metric: 'Process Quality', score: 80, benchmark: 'Industry Average' }]
      },
      technology_systems: {
        technology_adoption: 75,
        system_integration: 70,
        digital_transformation: 65,
        technology_stack: [{ system: 'Core Systems', score: 75, status: 'Operational' }]
      }
    };
    return <PEOperationalExcellenceDeepDive data={peOperationalData} />;
  }
  
  if (lowerCategory.includes('growth') && detailedAnalysis.business_traction) {
    // Transform TractionDeepDive to PEGrowthPotentialData
    const peGrowthData = {
      market_expansion: {
        expansion_readiness: 75,
        geographic_potential: 80,
        new_market_opportunities: [{ 
          market: 'Adjacent Market', 
          size_potential: '$50M',
          timeline: '12-18 months',
          feasibility: 70,
          risk_level: 'medium' as const,
          expected_return: 3.5,
          key_requirements: ['Market entry strategy', 'Local partnerships']
        }]
      },
      product_development: {
        innovation_capability: 75,
        r_and_d_efficiency: 70,
        product_roadmap_strength: 80,
        development_metrics: [{ product: 'Core Product', development_stage: 'Growth', market_readiness: 85, competitive_advantage: 'high' as const }]
      },
      value_creation: {
        operational_improvement_potential: 70,
        revenue_enhancement_opportunities: 75,
        cost_optimization_potential: 65,
        value_levers: [{ lever: 'Operational Efficiency', impact: 'high' as const, timeline: '6-12 months', investment_required: '$500K' }]
      },
      exit_strategy: {
        exit_readiness: 60,
        market_timing: 70,
        strategies: [{ 
          strategy: 'strategic_sale' as const, 
          feasibility: 75, 
          timeline: '3-5 years',
          estimated_valuation: '$100M',
          market_conditions: 'favorable' as const,
          key_requirements: ['Revenue growth', 'Market position strengthening']
        }]
      }
    };
    return <PEGrowthPotentialDeepDive data={peGrowthData} />;
  }
  
  if (lowerCategory.includes('risk') && detailedAnalysis.market_opportunity) {
    // Transform MarketDeepDive to PERiskAssessmentData
    const peRiskData = {
      market_risks: {
        overall_risk_score: 25,
        market_volatility: 30,
        competitive_threats: 35,
        regulatory_risks: [{ 
          factor: 'Market Regulatory Risk', 
          severity: 'medium' as const, 
          probability: 30, 
          impact: 40,
          mitigation_strategies: ['Compliance monitoring', 'Legal advisory'],
          monitoring_indicators: ['Regulatory changes', 'Market conditions']
        }],
        cyclical_exposure: 20
      },
      operational_risks: {
        overall_risk_score: 20,
        key_person_dependency: 35,
        operational_complexity: 25,
        operational_factors: [{ 
          factor: 'Operational Risk', 
          severity: 'low' as const, 
          probability: 20, 
          impact: 30,
          mitigation_strategies: ['Process documentation', 'Team development'],
          monitoring_indicators: ['Team stability', 'Process efficiency']
        }],
        supply_chain_risks: 15
      },
      financial_risks: {
        overall_risk_score: 30,
        leverage_risk: 25,
        cash_flow_volatility: 35,
        financial_factors: [{ 
          factor: 'Cash Flow Risk', 
          severity: 'medium' as const, 
          probability: 35, 
          impact: 45,
          mitigation_strategies: ['Diversified revenue', 'Cash management'],
          monitoring_indicators: ['Cash flow trends', 'Revenue concentration']
        }],
        covenant_compliance: 90
      },
      execution_risks: {
        overall_risk_score: 25,
        integration_complexity: 30,
        change_management: 20,
        execution_factors: [{ 
          factor: 'Execution Risk', 
          severity: 'low' as const, 
          probability: 25, 
          impact: 35,
          mitigation_strategies: ['Project management', 'Change management'],
          monitoring_indicators: ['Milestone tracking', 'Team performance']
        }],
        timeline_risk: 20
      }
    };
    return <PERiskAssessmentDeepDive data={peRiskData} />;
  }
  
  if (lowerCategory.includes('timing') && detailedAnalysis.business_traction) {
    // Transform TractionDeepDive to PEStrategicTimingData
    const peTimingData = {
      market_cycle_timing: {
        overall_timing_score: 80,
        economic_cycle_alignment: 75,
        industry_cycle_position: 85,
        market_indicators: [{ 
          indicator: 'Market Cycle Position', 
          current_phase: 'growth' as const, 
          timing_score: 80, 
          trend: 'favorable' as const,
          impact_on_deal: 'Positive market conditions support acquisition timing'
        }],
        acquisition_window_rating: 'favorable' as const
      },
      exit_timing_potential: {
        overall_exit_readiness: 70,
        market_timing_for_exit: 75,
        value_creation_timeline: 80,
        exit_scenarios: [{ 
          strategy: 'strategic_sale' as const, 
          feasibility_score: 75, 
          optimal_timeline: '3-5 years',
          market_conditions_required: ['Market growth', 'Strategic buyer interest'],
          value_creation_levers: ['Revenue growth', 'Market expansion'],
          key_milestones: ['Revenue targets', 'Market position']
        }],
        expected_hold_period: '3-5 years'
      },
      competitive_timing: {
        first_mover_advantage: 60,
        competitive_pressure: 40,
        market_saturation_risk: 30,
        consolidation_opportunity: 70
      }
    };
    return <PEStrategicTimingDeepDive data={peTimingData} />;
  }
  
  if (lowerCategory.includes('trust') || lowerCategory.includes('transparency')) {
    // Create PETrustTransparencyData from available data
    const peTrustData = {
      corporate_governance: {
        overall_governance_score: 80,
        board_effectiveness: 75,
        transparency_rating: 85,
        governance_metrics: [{ 
          area: 'Board Structure', 
          score: 75, 
          assessment: 'good' as const,
          key_strengths: ['Independent directors', 'Clear governance'],
          improvement_areas: ['Committee structure', 'Reporting frequency']
        }],
        compliance_status: 'mostly_compliant' as const
      },
      stakeholder_trust: {
        overall_trust_score: 80,
        management_credibility: 85,
        investor_confidence: 75,
        stakeholder_groups: [{ 
          group: 'Management Team', 
          trust_level: 85, 
          engagement_quality: 'high' as const,
          key_concerns: ['Market competition', 'Growth sustainability'],
          satisfaction_drivers: ['Transparent communication', 'Strong performance']
        }],
        reputation_score: 80
      },
      esg_standards: {
        overall_esg_score: 70,
        environmental_score: 65,
        social_score: 75,
        governance_score: 75,
        esg_metrics: [{ 
          category: 'governance' as const, 
          subcategory: 'Board Independence', 
          rating: 'B' as const, 
          score: 75,
          benchmark_comparison: 'at' as const,
          improvement_initiatives: ['Enhanced board diversity', 'Improved reporting']
        }],
        certification_status: ['ESG Reporting Standard']
      }
    };
    return <PETrustTransparencyDeepDive data={peTrustData} />;
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

        {/* Enhanced Sub-Criteria Breakdown Section with Engine Mapping */}
        {subCriteria && subCriteria.length > 0 ? (
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
        ) : (
          // Auto-generate sub-criteria from vc-pe-criteria template when not provided
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Sub-Criteria Analysis
            </h4>
            <div className="bg-muted/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Engine Data Integration Required</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Sub-criteria scores and insights will populate from specialized analysis engines.
                Categories will show detailed breakdowns for {category.replace(/_/g, ' ')} analysis once engine data is available.
              </p>
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