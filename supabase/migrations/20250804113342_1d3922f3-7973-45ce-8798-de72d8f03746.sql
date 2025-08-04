-- Fix IC memo status workflow by adding missing columns
ALTER TABLE ic_memos 
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS publishing_notes text,
ADD COLUMN IF NOT EXISTS review_priority text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS review_notes text,
ADD COLUMN IF NOT EXISTS submitted_for_review_at timestamp with time zone;

-- Update existing memos to have proper status
UPDATE ic_memos 
SET is_published = false 
WHERE is_published IS NULL;

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_ic_memos_status_published ON ic_memos(status, is_published);
CREATE INDEX IF NOT EXISTS idx_ic_memos_fund_status ON ic_memos(fund_id, status);

-- Fix any memos that should be published based on creation date (older than 1 day)
UPDATE ic_memos 
SET status = 'review', 
    submitted_for_review_at = created_at + interval '1 hour'
WHERE status = 'draft' 
  AND created_at < NOW() - interval '1 day'
  AND memo_content IS NOT NULL 
  AND memo_content != '{}'::jsonb;