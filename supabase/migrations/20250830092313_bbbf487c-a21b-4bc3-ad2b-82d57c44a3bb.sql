-- Add missing PE subcriteria columns to deal_analysis_datapoints_pe table
ALTER TABLE public.deal_analysis_datapoints_pe 
ADD COLUMN strategic_vision_assessment jsonb DEFAULT NULL,
ADD COLUMN fund_strategy_alignment jsonb DEFAULT NULL,
ADD COLUMN portfolio_synergies jsonb DEFAULT NULL,
ADD COLUMN risk_return_profile jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.deal_analysis_datapoints_pe.strategic_vision_assessment IS 'Assessment of management strategic vision and execution capability';
COMMENT ON COLUMN public.deal_analysis_datapoints_pe.fund_strategy_alignment IS 'Analysis of how well the deal aligns with fund investment strategy';
COMMENT ON COLUMN public.deal_analysis_datapoints_pe.portfolio_synergies IS 'Evaluation of potential synergies with existing portfolio companies';
COMMENT ON COLUMN public.deal_analysis_datapoints_pe.risk_return_profile IS 'Risk-return profile analysis and alignment with fund objectives';