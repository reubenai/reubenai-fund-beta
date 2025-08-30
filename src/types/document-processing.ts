/**
 * TypeScript interfaces for the enhanced document processing system
 * with separate VC and PE data points
 */

export interface DocumentSummary {
  narrative: string;
}

export interface VCDataPoints {
  TAM: string;
  SAM: string;
  SOM: string;
  CAGR: string;
  "Growth Drivers": string;
  "Market Share Distribution": string;
  "Key Market Players": string;
  "Whitespace Opportunities": string;
  "Addressable Customers": string;
  "CAC Trend": string;
  "LTV:CAC Ratio": string;
  "Retention Rate": string;
  "Channel Effectiveness": string;
  "Strategic Advisors": string;
  "Investor Network": string;
  "Partnership Ecosystem": string;
}

export interface PEDataPoints {
  // Financial Performance subcriteria
  "Revenue Quality": PERevenueQuality | string;
  "Profitability Analysis": PEProfitabilityAnalysis | string;
  "Cash Management": PECashManagement | string;
  
  // Operational Excellence subcriteria
  "Management Team Strength": PEManagementStrength | string;
  "Operational Efficiency": PEOperationalEfficiency | string;
  "Technology & Systems": PETechnologySystems | string;
  
  // Market Position subcriteria
  "Market Share & Position": PEMarketPosition | string;
  "Competitive Advantages": PECompetitiveAdvantages | string;
  "Customer Base Quality": PECustomerBaseQuality | string;
  
  // Management Quality subcriteria
  "Leadership Track Record": PELeadershipTrackRecord | string;
  "Organizational Strength": PEOrganizationalStrength | string;
  "Strategic Vision": PEStrategicVision | string;
  
  // Growth Potential subcriteria
  "Market Expansion Opportunities": PEMarketExpansion | string;
  "Value Creation Initiatives": PEValueCreation | string;
  "Exit Strategy Potential": PEExitStrategy | string;
  
  // Strategic Fit subcriteria
  "Fund Strategy Alignment": string;
  "Portfolio Synergies": string;
  "Risk-Return Profile": string;
}

// Detailed PE subcriteria interfaces
export interface PERevenueQuality {
  recurring_revenue: string;
  revenue_predictability: string;
  customer_retention: string;
  contract_length: string;
}

export interface PEProfitabilityAnalysis {
  ebitda_margins: string;
  margin_trends: string;
  operating_leverage: string;
  cost_structure: string;
}

export interface PECashManagement {
  free_cash_flow: string;
  working_capital_efficiency: string;
  cash_conversion_cycle: string;
  dso_metrics: string;
}

export interface PEManagementStrength {
  leadership_experience: string[];
  track_record: string[];
  industry_expertise: string[];
  team_stability: string;
}

export interface PEOperationalEfficiency {
  productivity_metrics: string;
  process_automation: string;
  operational_kpis: Record<string, any>;
  efficiency_benchmarks: string;
}

export interface PETechnologySystems {
  technology_stack: string;
  digital_capabilities: string;
  automation_potential: string[];
  system_scalability: string[];
}

export interface PEMarketPosition {
  market_share: string;
  competitive_position: string;
  brand_recognition: string;
  pricing_power: string;
}

export interface PECompetitiveAdvantages {
  competitive_moats: string[];
  differentiation: string[];
  barriers_to_entry: string[];
  unique_value_proposition: string;
}

export interface PECustomerBaseQuality {
  customer_diversification: string;
  customer_retention_rates: string;
  customer_satisfaction: string;
  contract_duration: string;
}

export interface PELeadershipTrackRecord {
  leadership_history: string[];
  value_creation_experience: Record<string, any>;
  industry_relationships: Record<string, any>;
  leadership_capabilities: string;
}

export interface PEOrganizationalStrength {
  organizational_depth: string;
  employee_retention: string;
  company_culture: string;
  succession_planning: string;
}

export interface PEStrategicVision {
  strategic_planning: string;
  execution_track_record: string;
  adaptability: string;
  strategic_clarity: string;
}

export interface PEMarketExpansion {
  geographic_expansion: string[];
  product_expansion: string[];
  market_penetration: string;
  expansion_runway: string;
}

export interface PEValueCreation {
  operational_improvements: string[];
  cost_reduction_opportunities: string[];
  efficiency_gains: string[];
  value_creation_roadmap: string;
}

export interface PEExitStrategy {
  strategic_buyers: string[];
  exit_multiples: string;
  exit_timing: string;
  market_receptivity: string;
}

// Enhanced document interface with new structure
export interface EnhancedDocument {
  id: string;
  deal_id: string;
  name: string;
  document_type?: string;
  document_category?: string;
  extracted_text?: string;
  parsed_data?: Record<string, any>;
  document_summary?: DocumentSummary;
  data_points_vc?: VCDataPoints;
  data_points_pe?: PEDataPoints;
  created_at: string;
  updated_at?: string;
}