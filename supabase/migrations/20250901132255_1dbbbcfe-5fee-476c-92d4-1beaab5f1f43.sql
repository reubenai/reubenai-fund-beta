-- Add new analysis columns to VC tables

-- Add 16 new columns to deal_analysis_datapoints_vc (excluding market_size and market_timing which already exist)
ALTER TABLE deal_analysis_datapoints_vc 
ADD COLUMN founder_experience TEXT,
ADD COLUMN team_composition TEXT,
ADD COLUMN vision_communication TEXT,
ADD COLUMN competitive_landscape TEXT,
ADD COLUMN product_innovation TEXT,
ADD COLUMN technology_advantage TEXT,
ADD COLUMN product_market_fit TEXT,
ADD COLUMN revenue_growth TEXT,
ADD COLUMN customer_metrics TEXT,
ADD COLUMN market_validation TEXT,
ADD COLUMN financial_performance TEXT,
ADD COLUMN capital_efficiency TEXT,
ADD COLUMN financial_planning TEXT,
ADD COLUMN portfolio_synergies TEXT,
ADD COLUMN investment_thesis_alignment TEXT,
ADD COLUMN value_creation_potential TEXT;

-- Add all 18 columns to deal_enrichment_perplexity_market_export_vc
ALTER TABLE deal_enrichment_perplexity_market_export_vc
ADD COLUMN founder_experience TEXT,
ADD COLUMN team_composition TEXT,
ADD COLUMN vision_communication TEXT,
ADD COLUMN market_size TEXT,
ADD COLUMN market_timing TEXT,
ADD COLUMN competitive_landscape TEXT,
ADD COLUMN product_innovation TEXT,
ADD COLUMN technology_advantage TEXT,
ADD COLUMN product_market_fit TEXT,
ADD COLUMN revenue_growth TEXT,
ADD COLUMN customer_metrics TEXT,
ADD COLUMN market_validation TEXT,
ADD COLUMN financial_performance TEXT,
ADD COLUMN capital_efficiency TEXT,
ADD COLUMN financial_planning TEXT,
ADD COLUMN portfolio_synergies TEXT,
ADD COLUMN investment_thesis_alignment TEXT,
ADD COLUMN value_creation_potential TEXT;