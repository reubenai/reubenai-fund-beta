-- Fix fund type consistency in investment_strategies table
-- Update existing records to use database-consistent fund types
UPDATE public.investment_strategies 
SET fund_type = 'venture_capital' 
WHERE fund_type = 'vc';

UPDATE public.investment_strategies 
SET fund_type = 'private_equity' 
WHERE fund_type = 'pe';

-- Add constraint to ensure only valid fund types are used
ALTER TABLE public.investment_strategies 
DROP CONSTRAINT IF EXISTS investment_strategies_fund_type_check;

ALTER TABLE public.investment_strategies 
ADD CONSTRAINT investment_strategies_fund_type_check 
CHECK (fund_type IN ('venture_capital', 'private_equity'));

-- Update the fund_type column comment for clarity
COMMENT ON COLUMN public.investment_strategies.fund_type IS 
'Fund type must match funds.fund_type values: venture_capital or private_equity';