-- Add unique constraint to prevent multiple IC memos per deal
-- This will ensure only one memo can exist per deal_id + fund_id combination

-- First, clean up duplicate memos by keeping only the latest one per deal
WITH latest_memos AS (
  SELECT DISTINCT ON (deal_id, fund_id) 
    id,
    deal_id, 
    fund_id,
    created_at
  FROM ic_memos
  ORDER BY deal_id, fund_id, created_at DESC
),
duplicate_memos AS (
  SELECT id 
  FROM ic_memos 
  WHERE id NOT IN (SELECT id FROM latest_memos)
)
DELETE FROM ic_memos 
WHERE id IN (SELECT id FROM duplicate_memos);

-- Add unique constraint to prevent future duplicates
ALTER TABLE ic_memos 
ADD CONSTRAINT unique_memo_per_deal 
UNIQUE (deal_id, fund_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT unique_memo_per_deal ON ic_memos IS 
'Ensures only one IC memo can exist per deal within each fund';