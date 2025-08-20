-- Add the expected investment_strategies_fund_id_unique constraint
-- This will fix the "ON CONFLICT specification" error
ALTER TABLE public.investment_strategies 
ADD CONSTRAINT investment_strategies_fund_id_unique UNIQUE (fund_id);

-- Note: This creates a duplicate constraint with unique_fund_strategy
-- We can consolidate them in a future migration once the system is working