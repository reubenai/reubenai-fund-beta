// Enhanced Deal Analysis Types for Rich Frontend Display

export interface RubricBreakdown {
  category: string;
  score: number;
  confidence: number;
  weight: number;
  insights: string[];
  strengths: string[];
  concerns: string[];
  detailed_analysis?: CategoryDeepDive;
}

// Deep-dive analysis interfaces for each category
export interface CategoryDeepDive {
  market_opportunity?: MarketDeepDive;
  team_leadership?: TeamDeepDive;
  product_technology?: ProductDeepDive;
  financial_health?: FinancialDeepDive;
  business_traction?: TractionDeepDive;
}

export interface MarketDeepDive {
  tam_sam_som?: { tam: string; sam: string; som: string };
  growth_drivers?: string[];
  market_risks?: string[];
  competitive_positioning?: CompetitorAnalysis[];
  customer_validation?: CustomerInsight[];
  geographic_opportunities?: GeographicData[];
}

export interface TeamDeepDive {
  founder_profiles?: FounderProfile[];
  team_gaps?: string[];
  execution_track_record?: ExecutionMetric[];
  advisory_strength?: AdvisoryData[];
}

export interface ProductDeepDive {
  ip_portfolio?: IPAsset[];
  competitive_moats?: MoatAnalysis[];
  technical_advantages?: TechAdvantage[];
  development_roadmap?: RoadmapItem[];
}

export interface FinancialDeepDive {
  revenue_breakdown?: RevenueStream[];
  unit_economics?: UnitEconomicsDetail;
  burn_analysis?: BurnRateAnalysis;
  funding_scenarios?: FundingScenario[];
}

export interface TractionDeepDive {
  customer_metrics?: CustomerMetric[];
  partnership_pipeline?: Partnership[];
  market_penetration?: PenetrationData[];
  growth_trajectory?: GrowthMetric[];
}

// Supporting data structures
export interface CompetitorAnalysis {
  name: string;
  market_share?: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  funding_stage?: string;
}

export interface CustomerInsight {
  segment: string;
  validation_level: 'high' | 'medium' | 'low';
  feedback: string;
  revenue_potential?: string;
}

export interface GeographicData {
  region: string;
  market_size: string;
  penetration_opportunity: string;
  regulatory_barriers?: string[];
}

export interface FounderProfile {
  name: string;
  role: string;
  background: string;
  linkedin_validated?: boolean;
  previous_exits?: string[];
  expertise_areas: string[];
}

export interface ExecutionMetric {
  milestone: string;
  achievement_date: string;
  impact: string;
  validation_source?: string;
}

export interface AdvisoryData {
  name?: string;
  expertise: string;
  influence_level: 'high' | 'medium' | 'low';
  active_involvement: boolean;
}

export interface IPAsset {
  type: 'patent' | 'trademark' | 'trade_secret' | 'copyright';
  status: string;
  defensibility_score: number;
  strategic_value: string;
}

export interface MoatAnalysis {
  moat_type: string;
  strength: 'strong' | 'moderate' | 'weak';
  sustainability: string;
  competitive_response_time?: string;
}

export interface TechAdvantage {
  technology: string;
  advantage_type: string;
  differentiation_level: 'high' | 'medium' | 'low';
  time_to_replicate?: string;
}

export interface RoadmapItem {
  feature: string;
  timeline: string;
  strategic_importance: 'critical' | 'important' | 'nice_to_have';
  market_demand: string;
}

export interface RevenueStream {
  source: string;
  percentage: number;
  growth_rate?: string;
  sustainability: 'high' | 'medium' | 'low';
}

export interface UnitEconomicsDetail {
  cac: string;
  ltv: string;
  ltv_cac_ratio: number;
  payback_period: string;
  gross_margin: string;
}

export interface BurnRateAnalysis {
  monthly_burn: string;
  runway_months: number;
  burn_efficiency: string;
  optimization_opportunities: string[];
}

export interface FundingScenario {
  scenario: 'optimistic' | 'base' | 'pessimistic';
  amount_needed: string;
  timeline: string;
  milestones: string[];
}

export interface CustomerMetric {
  metric: string;
  value: string;
  trend: 'improving' | 'stable' | 'declining';
  benchmark?: string;
}

export interface Partnership {
  partner: string;
  type: string;
  status: 'active' | 'pipeline' | 'negotiating';
  strategic_value: string;
}

export interface PenetrationData {
  segment: string;
  current_penetration: string;
  addressable_market: string;
  growth_potential: string;
}

export interface GrowthMetric {
  period: string;
  metric: string;
  value: string;
  context: string;
}

export interface NotesIntelligence {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  key_insights: string[];
  risk_flags: string[];
  trend_indicators: string[];
  confidence_level: number;
  last_analyzed: string;
}

export interface AnalysisEngine {
  name: string;
  score: number;
  confidence: number;
  status: 'complete' | 'partial' | 'pending' | 'error';
  last_run: string;
  version: string;
}

export interface FundTypeAnalysis {
  fund_type: 'vc' | 'pe';
  focus_areas: string[];
  strengths: string[];
  concerns: string[];
  alignment_score: number;
  strategic_recommendations: string[];
}

export interface EnhancedDealAnalysis {
  rubric_breakdown?: RubricBreakdown[];
  notes_intelligence?: NotesIntelligence;
  analysis_engines?: Record<string, AnalysisEngine>;
  fund_type_analysis?: FundTypeAnalysis;
  analysis_completeness: number;
  last_comprehensive_analysis?: string;
}

// Visualization helpers
export interface RadarChartData {
  category: string;
  score: number;
  maxScore: number;
  color: string;
}

export interface ConfidenceIndicator {
  level: 'high' | 'medium' | 'low';
  score: number;
  color: string;
  description: string;
}

// Fund-type specific display configurations
export interface FundTypeDisplayConfig {
  primaryMetrics: string[];
  secondaryMetrics: string[];
  highlightColors: {
    positive: string;
    neutral: string;
    negative: string;
  };
  iconSet: {
    growth: string;
    operational: string;
    financial: string;
    strategic: string;
  };
}

export const VC_DISPLAY_CONFIG: FundTypeDisplayConfig = {
  primaryMetrics: ['market_opportunity', 'product_technology', 'team_leadership'],
  secondaryMetrics: ['business_traction', 'strategic_fit'],
  highlightColors: {
    positive: 'bg-emerald-100 text-emerald-800',
    neutral: 'bg-blue-100 text-blue-800', 
    negative: 'bg-red-100 text-red-800'
  },
  iconSet: {
    growth: 'TrendingUp',
    operational: 'Cpu', 
    financial: 'DollarSign',
    strategic: 'Target'
  }
};

export const PE_DISPLAY_CONFIG: FundTypeDisplayConfig = {
  primaryMetrics: ['financial_health', 'business_traction', 'operational_efficiency'],
  secondaryMetrics: ['team_leadership', 'market_opportunity'],
  highlightColors: {
    positive: 'bg-blue-100 text-blue-800',
    neutral: 'bg-slate-100 text-slate-800',
    negative: 'bg-red-100 text-red-800'
  },
  iconSet: {
    growth: 'BarChart3',
    operational: 'Cog',
    financial: 'PiggyBank', 
    strategic: 'Crosshair'
  }
};