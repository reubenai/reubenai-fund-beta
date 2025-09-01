-- Fix fund type consistency in investment_strategies table
-- Update enhanced_criteria JSON and fund_type column together

-- First, update records where fund_type is 'vc'
UPDATE public.investment_strategies 
SET 
  fund_type = 'venture_capital',
  enhanced_criteria = jsonb_set(
    enhanced_criteria, 
    '{fundType}', 
    '"venture_capital"'::jsonb
  )
WHERE fund_type = 'vc';

-- Then, update records where fund_type is 'pe' 
UPDATE public.investment_strategies 
SET 
  fund_type = 'private_equity',
  enhanced_criteria = jsonb_set(
    enhanced_criteria, 
    '{fundType}', 
    '"private_equity"'::jsonb
  )
WHERE fund_type = 'pe';

-- Also update any enhanced_criteria that might have inconsistent fundType values
UPDATE public.investment_strategies 
SET enhanced_criteria = jsonb_set(
  enhanced_criteria, 
  '{fundType}', 
  '"venture_capital"'::jsonb
)
WHERE enhanced_criteria->>'fundType' = 'vc'
AND fund_type = 'venture_capital';

UPDATE public.investment_strategies 
SET enhanced_criteria = jsonb_set(
  enhanced_criteria, 
  '{fundType}', 
  '"private_equity"'::jsonb
)
WHERE enhanced_criteria->>'fundType' = 'pe'
AND fund_type = 'private_equity';

-- Now add constraint to ensure only valid fund types are used
ALTER TABLE public.investment_strategies 
DROP CONSTRAINT IF EXISTS investment_strategies_fund_type_check;

ALTER TABLE public.investment_strategies 
ADD CONSTRAINT investment_strategies_fund_type_check 
CHECK (fund_type IN ('venture_capital', 'private_equity'));

-- Update the fund_type column comment for clarity
COMMENT ON COLUMN public.investment_strategies.fund_type IS 
'Fund type must match funds.fund_type values: venture_capital or private_equity';