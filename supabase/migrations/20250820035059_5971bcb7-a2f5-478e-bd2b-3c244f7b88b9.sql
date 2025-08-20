-- Add missing columns to investment_strategies table to support all wizard fields
ALTER TABLE public.investment_strategies 
ADD COLUMN IF NOT EXISTS investment_philosophy text,
ADD COLUMN IF NOT EXISTS philosophy_config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS research_approach jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS deal_sourcing_strategy jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS decision_making_process jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS investment_stages text[],
ADD COLUMN IF NOT EXISTS specialized_sectors text[];

-- Add comments for documentation
COMMENT ON COLUMN public.investment_strategies.investment_philosophy IS 'Investment thesis narrative and philosophy description';
COMMENT ON COLUMN public.investment_strategies.philosophy_config IS 'Structured philosophy data including investment drivers, risk tolerance, horizon, and value creation approach';
COMMENT ON COLUMN public.investment_strategies.research_approach IS 'Due diligence configuration including depth, priorities, sources, and competitive analysis focus';
COMMENT ON COLUMN public.investment_strategies.deal_sourcing_strategy IS 'Sourcing configuration including channels, network leveraging, target profiles, and outreach strategy';
COMMENT ON COLUMN public.investment_strategies.decision_making_process IS 'Decision process configuration including timeline preferences, stakeholder involvement, and risk tolerance';
COMMENT ON COLUMN public.investment_strategies.investment_stages IS 'Array of investment stages (Seed, Series A, etc.)';
COMMENT ON COLUMN public.investment_strategies.specialized_sectors IS 'Array of specialized sector focus areas';

-- Update the trigger to handle new columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;