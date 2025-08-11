-- Fix integer constraint errors preventing analysis completion
-- Update all score columns to accept decimal values for more accurate scoring

-- Update deal_analyses table to use NUMERIC for all score columns
ALTER TABLE public.deal_analyses 
ALTER COLUMN thesis_alignment_score TYPE NUMERIC(5,2),
ALTER COLUMN market_score TYPE NUMERIC(5,2),
ALTER COLUMN product_score TYPE NUMERIC(5,2),
ALTER COLUMN leadership_score TYPE NUMERIC(5,2), 
ALTER COLUMN financial_score TYPE NUMERIC(5,2),
ALTER COLUMN traction_score TYPE NUMERIC(5,2),
ALTER COLUMN overall_score TYPE NUMERIC(5,2);

-- Update deals table overall_score to accept decimals
ALTER TABLE public.deals
ALTER COLUMN overall_score TYPE NUMERIC(5,2);

-- Update any other scoring-related columns that might have similar issues
-- Note: This preserves existing integer values while allowing decimals going forward