-- Phase 1: Database Schema Cleanup
-- Remove potential duplicate unique constraints if they exist
DO $$ 
BEGIN
    -- Check if there are duplicate unique constraints on fund_id
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'investment_strategies' 
        AND constraint_name = 'investment_strategies_fund_id_unique'
        AND constraint_type = 'UNIQUE'
    ) THEN
        -- Only drop if there's already a primary unique constraint on fund_id
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'investment_strategies' 
            AND constraint_name != 'investment_strategies_fund_id_unique'
            AND constraint_type = 'UNIQUE'
        ) THEN
            ALTER TABLE investment_strategies DROP CONSTRAINT IF EXISTS investment_strategies_fund_id_unique;
        END IF;
    END IF;
END $$;