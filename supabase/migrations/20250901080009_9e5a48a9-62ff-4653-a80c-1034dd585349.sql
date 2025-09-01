-- Add a comment to investment_strategies.fund_type to document expected formats
-- This migration adds flexibility for fund type handling without modifying existing data

COMMENT ON COLUMN public.investment_strategies.fund_type IS 
'Fund type should ideally match funds.fund_type values (venture_capital/private_equity) but may contain legacy values (vc/pe) for backward compatibility';

-- Add an index to improve fund type queries
CREATE INDEX IF NOT EXISTS idx_investment_strategies_fund_type 
ON public.investment_strategies(fund_type);

-- Add an index to improve fund queries on fund_type
CREATE INDEX IF NOT EXISTS idx_funds_fund_type 
ON public.funds(fund_type);