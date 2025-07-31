-- Add enhanced criteria and fund type support to investment_strategies table
ALTER TABLE public.investment_strategies 
ADD COLUMN enhanced_criteria JSONB DEFAULT '{}',
ADD COLUMN fund_type TEXT CHECK (fund_type IN ('vc', 'pe'));

-- Update existing records to have a default fund_type based on existing data
-- We'll default to 'vc' for existing records, users can update manually
UPDATE public.investment_strategies 
SET fund_type = 'vc' 
WHERE fund_type IS NULL;

-- Make fund_type NOT NULL after setting defaults
ALTER TABLE public.investment_strategies 
ALTER COLUMN fund_type SET NOT NULL,
ALTER COLUMN fund_type SET DEFAULT 'vc';