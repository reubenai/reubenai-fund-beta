-- Check the exact constraint names and use the correct one for upsert
-- The error suggests the constraint doesn't exist or the name is wrong

-- Let's see if we need to drop and recreate with a specific name
-- First check if there are any existing constraints
SELECT conname, contype 
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'investment_strategies' AND contype = 'u';