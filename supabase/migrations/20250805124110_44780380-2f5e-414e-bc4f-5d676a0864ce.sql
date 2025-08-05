-- Fix the fund_memory_entries table to allow the system to create entries
-- Update the created_by column to have a proper default for system-generated entries

-- Add a default system user ID for automated entries
ALTER TABLE fund_memory_entries 
ALTER COLUMN created_by SET DEFAULT '00000000-0000-0000-0000-000000000000';

-- Update existing entries with null created_by to use system user
UPDATE fund_memory_entries 
SET created_by = '00000000-0000-0000-0000-000000000000'
WHERE created_by IS NULL;