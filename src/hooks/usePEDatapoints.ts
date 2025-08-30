import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Deal } from '@/hooks/usePipelineDeals';

export interface PEDatapoints {
  // Financial Performance
  revenue_growth_rate?: number;
  ebitda_margin?: number;
  ebitda_growth_rate?: number;
  cash_flow_generation?: any;
  working_capital_management?: any;
  debt_capacity?: number;
  leverage_ratios?: any;
  return_on_invested_capital?: number;
  free_cash_flow_yield?: number;
  historical_financial_performance?: any;
  
  // Operational Excellence  
  operational_efficiency_metrics?: any;
  cost_structure_analysis?: any;
  technology_infrastructure?: any;
  process_optimization_potential?: any[];
  automation_opportunities?: any[];
  supply_chain_efficiency?: any;
  management_quality_assessment?: any;
  leadership_track_record?: any;
  governance_structure?: any;
  board_composition?: any;
  management_incentives?: any;
  organizational_capabilities?: any[];
  talent_retention_metrics?: any;
  succession_planning?: any;
  
  // Market Position
  market_share?: number;
  competitive_advantages?: any[];
  brand_strength?: number;
  distribution_channels?: any;
  customer_concentration?: any;
  supplier_relationships?: any;
  market_position?: string;
  key_customers?: any[];
  
  // Management Quality 
  strategic_vision_assessment?: any;
  
  // Growth Potential
  organic_growth_potential?: any;
  acquisition_opportunities?: any[];
  expansion_markets?: any[];
  product_line_extensions?: any[];
  pricing_optimization_potential?: number;
  cost_reduction_opportunities?: any;
  capital_allocation_efficiency?: any;
  value_creation_timeline?: any;
  
  // Strategic Fit
  fund_strategy_alignment?: any;
  portfolio_synergies?: any;
  risk_return_profile?: any;
  exit_strategy_options?: any[];
  
  // Additional PE specific
  industry_focus?: string;
  investment_size?: number;
  quality_score?: number;
  key_signals?: any[];
  employee_count?: number;
  founding_year?: number;
  risk_mitigation_strategies?: any[];
  esg_score?: number;
  regulatory_compliance?: any;
  environmental_impact_assessment?: any;
  social_responsibility_metrics?: any;
  governance_best_practices?: any;
  sustainability_initiatives?: any[];
}

export interface PEMappedData {
  financialPerformance: {
    score: number;
    confidence: number;
    insights: string[];
    dataPoints: Partial<PEDatapoints>;
  };
  operationalExcellence: {
    score: number;
    confidence: number;
    insights: string[];
    dataPoints: Partial<PEDatapoints>;
  };
  marketPosition: {
    score: number;
    confidence: number;
    insights: string[];
    dataPoints: Partial<PEDatapoints>;
  };
  managementQuality: {
    score: number;
    confidence: number;
    insights: string[];
    dataPoints: Partial<PEDatapoints>;
  };
  growthPotential: {
    score: number;
    confidence: number;
    insights: string[];
    dataPoints: Partial<PEDatapoints>;
  };
  strategicFit: {
    score: number;
    confidence: number;
    insights: string[];
    dataPoints: Partial<PEDatapoints>;
  };
}

export interface UsePEDatapointsResult {
  data: PEMappedData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePEDatapoints(deal: Deal): UsePEDatapointsResult {
  const [data, setData] = useState<PEMappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPEDatapoints = async () => {
    if (!deal) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch PE datapoints from deal_analysis_datapoints_pe table
      const { data: peData, error: fetchError } = await supabase
        .from('deal_analysis_datapoints_pe')
        .select('*')
        .eq('deal_id', deal.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        throw fetchError;
      }

      // Map raw datapoints to structured PE categories
      const mappedData: PEMappedData = {
        financialPerformance: {
          score: calculateFinancialScore(peData),
          confidence: peData ? 85 : 50,
          insights: generateFinancialInsights(peData),
          dataPoints: {
            revenue_growth_rate: peData?.revenue_growth_rate,
            ebitda_margin: peData?.ebitda_margin,
            ebitda_growth_rate: peData?.ebitda_growth_rate,
            cash_flow_generation: peData?.cash_flow_generation,
            working_capital_management: peData?.working_capital_management,
            debt_capacity: peData?.debt_capacity,
            leverage_ratios: peData?.leverage_ratios,
            return_on_invested_capital: peData?.return_on_invested_capital,
            free_cash_flow_yield: peData?.free_cash_flow_yield,
            historical_financial_performance: peData?.historical_financial_performance
          }
        },
        operationalExcellence: {
          score: calculateOperationalScore(peData),
          confidence: peData ? 80 : 50,
          insights: generateOperationalInsights(peData),
          dataPoints: {
            operational_efficiency_metrics: peData?.operational_efficiency_metrics,
            technology_infrastructure: peData?.technology_infrastructure,
            process_optimization_potential: peData?.process_optimization_potential,
            automation_opportunities: peData?.automation_opportunities,
            supply_chain_efficiency: peData?.supply_chain_efficiency,
            management_quality_assessment: peData?.management_quality_assessment,
            leadership_track_record: peData?.leadership_track_record
          }
        },
        marketPosition: {
          score: calculateMarketScore(peData),
          confidence: peData ? 75 : 50,
          insights: generateMarketInsights(peData),
          dataPoints: {
            market_share: peData?.market_share,
            competitive_advantages: peData?.competitive_advantages,
            brand_strength: peData?.brand_strength,
            distribution_channels: peData?.distribution_channels,
            customer_concentration: peData?.customer_concentration,
            market_position: peData?.market_position
          }
        },
        managementQuality: {
          score: calculateManagementScore(peData),
          confidence: peData ? 70 : 50,
          insights: generateManagementInsights(peData),
          dataPoints: {
            leadership_track_record: peData?.leadership_track_record,
            governance_structure: peData?.governance_structure,
            board_composition: peData?.board_composition,
            strategic_vision_assessment: peData?.strategic_vision_assessment,
            organizational_capabilities: peData?.organizational_capabilities,
            talent_retention_metrics: peData?.talent_retention_metrics
          }
        },
        growthPotential: {
          score: calculateGrowthScore(peData),
          confidence: peData ? 65 : 50,
          insights: generateGrowthInsights(peData),
          dataPoints: {
            organic_growth_potential: peData?.organic_growth_potential,
            acquisition_opportunities: peData?.acquisition_opportunities,
            expansion_markets: peData?.expansion_markets,
            product_line_extensions: peData?.product_line_extensions,
            value_creation_timeline: peData?.value_creation_timeline
          }
        },
        strategicFit: {
          score: calculateStrategicScore(peData),
          confidence: peData ? 80 : 50,
          insights: generateStrategicInsights(peData),
          dataPoints: {
            fund_strategy_alignment: peData?.fund_strategy_alignment,
            portfolio_synergies: peData?.portfolio_synergies,
            risk_return_profile: peData?.risk_return_profile,
            exit_strategy_options: peData?.exit_strategy_options
          }
        }
      };

      setData(mappedData);
    } catch (err) {
      console.error('Error fetching PE datapoints:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch PE datapoints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPEDatapoints();
  }, [deal?.id]);

  return {
    data,
    loading,
    error,
    refetch: fetchPEDatapoints
  };
}

// Helper functions to calculate scores from PE data
function calculateFinancialScore(data: any): number {
  if (!data) return 72;
  
  let score = 70;
  if (data.ebitda_margin && data.ebitda_margin > 15) score += 10;
  if (data.revenue_growth_rate && data.revenue_growth_rate > 10) score += 8;
  if (data.free_cash_flow_yield && data.free_cash_flow_yield > 0) score += 7;
  if (data.return_on_invested_capital && data.return_on_invested_capital > 15) score += 5;
  
  return Math.min(100, score);
}

function calculateOperationalScore(data: any): number {
  if (!data) return 68;
  
  let score = 65;
  if (data.operational_efficiency_metrics) score += 8;
  if (data.technology_infrastructure) score += 7;
  if (data.management_quality_assessment) score += 10;
  if (data.process_optimization_potential?.length > 0) score += 5;
  
  return Math.min(100, score);
}

function calculateMarketScore(data: any): number {
  if (!data) return 75;
  
  let score = 70;
  if (data.market_share && data.market_share > 10) score += 10;
  if (data.brand_strength && data.brand_strength > 7) score += 8;
  if (data.competitive_advantages?.length > 0) score += 7;
  
  return Math.min(100, score);
}

function calculateManagementScore(data: any): number {
  if (!data) return 78;
  
  let score = 75;
  if (data.leadership_track_record) score += 8;
  if (data.governance_structure) score += 5;
  if (data.strategic_vision_assessment) score += 7;
  
  return Math.min(100, score);
}

function calculateGrowthScore(data: any): number {
  if (!data) return 70;
  
  let score = 65;
  if (data.organic_growth_potential) score += 10;
  if (data.acquisition_opportunities?.length > 0) score += 8;
  if (data.expansion_markets?.length > 0) score += 7;
  
  return Math.min(100, score);
}

function calculateStrategicScore(data: any): number {
  if (!data) return 82;
  
  let score = 80;
  if (data.fund_strategy_alignment) score += 8;
  if (data.portfolio_synergies) score += 6;
  if (data.risk_return_profile) score += 6;
  
  return Math.min(100, score);
}

// Helper functions to generate insights
function generateFinancialInsights(data: any): string[] {
  if (!data) return ['Financial analysis pending comprehensive data review'];
  
  const insights: string[] = [];
  
  if (data.ebitda_margin) {
    insights.push(`EBITDA margin of ${data.ebitda_margin}% indicates ${data.ebitda_margin > 15 ? 'strong' : 'developing'} profitability`);
  }
  
  if (data.revenue_growth_rate) {
    insights.push(`Revenue growth rate of ${data.revenue_growth_rate}% shows ${data.revenue_growth_rate > 10 ? 'strong' : 'moderate'} expansion`);
  }
  
  if (insights.length === 0) {
    insights.push('Financial assessment requires additional data points');
  }
  
  return insights;
}

function generateOperationalInsights(data: any): string[] {
  if (!data) return ['Operational analysis pending data collection'];
  
  const insights: string[] = [];
  
  if (data.operational_efficiency_metrics) {
    insights.push('Operational efficiency metrics show structured performance tracking');
  }
  
  if (data.technology_infrastructure) {
    insights.push('Technology infrastructure assessment indicates digital capability levels');
  }
  
  if (insights.length === 0) {
    insights.push('Operational excellence assessment in progress');
  }
  
  return insights;
}

function generateMarketInsights(data: any): string[] {
  if (!data) return ['Market position analysis pending research'];
  
  const insights: string[] = [];
  
  if (data.market_share) {
    insights.push(`Market share of ${data.market_share}% indicates ${data.market_share > 10 ? 'strong' : 'emerging'} position`);
  }
  
  if (data.competitive_advantages) {
    insights.push('Competitive advantages identified and assessed');
  }
  
  if (insights.length === 0) {
    insights.push('Market position evaluation requires additional competitive intelligence');
  }
  
  return insights;
}

function generateManagementInsights(data: any): string[] {
  if (!data) return ['Management assessment pending team evaluation'];
  
  const insights: string[] = [];
  
  if (data.leadership_track_record) {
    insights.push('Leadership track record analysis shows historical performance patterns');
  }
  
  if (data.governance_structure) {
    insights.push('Governance structure assessment indicates organizational maturity');
  }
  
  if (insights.length === 0) {
    insights.push('Management quality evaluation in development');
  }
  
  return insights;
}

function generateGrowthInsights(data: any): string[] {
  if (!data) return ['Growth potential analysis pending strategic review'];
  
  const insights: string[] = [];
  
  if (data.organic_growth_potential) {
    insights.push('Organic growth opportunities identified and evaluated');
  }
  
  if (data.acquisition_opportunities) {
    insights.push('Acquisition opportunities mapped for strategic expansion');
  }
  
  if (insights.length === 0) {
    insights.push('Growth strategy assessment requires market expansion analysis');
  }
  
  return insights;
}

function generateStrategicInsights(data: any): string[] {
  if (!data) return ['Strategic fit analysis pending fund alignment review'];
  
  const insights: string[] = [];
  
  if (data.fund_strategy_alignment) {
    insights.push('Fund strategy alignment shows strong mandate fit');
  }
  
  if (data.portfolio_synergies) {
    insights.push('Portfolio synergies identified for value creation');
  }
  
  if (insights.length === 0) {
    insights.push('Strategic fit evaluation requires fund strategy assessment');
  }
  
  return insights;
}