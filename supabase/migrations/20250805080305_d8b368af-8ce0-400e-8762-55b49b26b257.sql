-- Fix IC schema issues by ensuring proper table relationships exist
-- Create missing foreign key relationships that the queries expect

-- Add foreign key constraint for ic_session_deals if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ic_session_deals_session_id_fkey'
    ) THEN
        ALTER TABLE ic_session_deals 
        ADD CONSTRAINT ic_session_deals_session_id_fkey 
        FOREIGN KEY (session_id) REFERENCES ic_sessions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for ic_voting_decisions to ic_memos if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ic_voting_decisions_memo_id_fkey'
    ) THEN
        ALTER TABLE ic_voting_decisions 
        ADD CONSTRAINT ic_voting_decisions_memo_id_fkey 
        FOREIGN KEY (memo_id) REFERENCES ic_memos(id) ON DELETE CASCADE;
    END IF;
END $$;