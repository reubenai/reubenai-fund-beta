-- Add missing VC data point columns to deal_analysis_datapoints_vc table
ALTER TABLE public.deal_analysis_datapoints_vc 
ADD COLUMN vision_communication text,
ADD COLUMN product_market_fit text,
ADD COLUMN market_validation text,
ADD COLUMN financial_planning text,
ADD COLUMN portfolio_synergies text,
ADD COLUMN investment_thesis_alignment text,
ADD COLUMN value_creation_potential text;