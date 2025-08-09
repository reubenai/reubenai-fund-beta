// Enhanced Deal Analysis Types for Rich Frontend Display

export interface RubricBreakdown {
  category: string;
  score: number;
  confidence: number;
  weight: number;
  insights: string[];
  strengths: string[];
  concerns: string[];
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