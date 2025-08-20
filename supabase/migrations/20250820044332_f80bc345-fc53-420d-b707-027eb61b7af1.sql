-- Add unique constraint for investment_strategies table to fix upsert issue
-- The error indicates ON CONFLICT needs a unique constraint to work properly

-- First check if there's already a unique constraint
DO $$
BEGIN
    -- Add unique constraint on fund_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'investment_strategies_fund_id_unique' 
        AND table_name = 'investment_strategies'
    ) THEN
        ALTER TABLE public.investment_strategies 
        ADD CONSTRAINT investment_strategies_fund_id_unique UNIQUE (fund_id);
    END IF;
END $$;