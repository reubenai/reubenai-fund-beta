-- Add the 18 VC analysis columns that the user needs and remove old mismatched columns
ALTER TABLE public.deal_enrichment_perplexity_market_export_vc 
DROP COLUMN IF EXISTS market_cycle,
DROP COLUMN IF EXISTS economic_sensitivity,
DROP COLUMN IF EXISTS investment_climate,
DROP COLUMN IF EXISTS regulatory_timeline,
DROP COLUMN IF EXISTS competitive_window,
DROP COLUMN IF EXISTS regulatory_requirements,
DROP COLUMN IF EXISTS capital_requirements,
DROP COLUMN IF EXISTS distribution_challenges,
DROP COLUMN IF EXISTS geographic_constraints;

-- Add the 18 core VC analysis data points as requested by user
ALTER TABLE public.deal_enrichment_perplexity_market_export_vc 
ADD COLUMN founder_experience text,
ADD COLUMN team_composition text,
ADD COLUMN vision_communication text,
ADD COLUMN market_size text,
ADD COLUMN market_timing text,
ADD COLUMN competitive_landscape text,
ADD COLUMN product_innovation text,
ADD COLUMN technology_advantage text,
ADD COLUMN product_market_fit text,
ADD COLUMN revenue_growth text,
ADD COLUMN customer_metrics text,
ADD COLUMN market_validation text,
ADD COLUMN financial_performance text,
ADD COLUMN capital_efficiency text,
ADD COLUMN financial_planning text,
ADD COLUMN portfolio_synergies text,
ADD COLUMN investment_thesis_alignment text,
ADD COLUMN value_creation_potential text;

-- Also add company_name column that's referenced in the edge function
ALTER TABLE public.deal_enrichment_perplexity_market_export_vc 
ADD COLUMN company_name text;