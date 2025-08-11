-- Add custom sections support to ic_memos table
ALTER TABLE ic_memos 
ADD COLUMN IF NOT EXISTS custom_sections jsonb DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN ic_memos.custom_sections IS 'Array of custom memo sections with key, title, and content fields';