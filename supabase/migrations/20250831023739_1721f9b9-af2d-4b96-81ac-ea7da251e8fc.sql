-- Add missing enum value for crunchbase enrichment
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'crunchbase_enrichment_queued';

-- Add unique constraint on deal_id to fix ON CONFLICT clause
-- First, remove any existing duplicate records
WITH duplicate_deals AS (
  SELECT deal_id, MIN(id) as keep_id
  FROM deal2_enrichment_crunchbase_export 
  GROUP BY deal_id 
  HAVING COUNT(*) > 1
)
DELETE FROM deal2_enrichment_crunchbase_export 
WHERE deal_id IN (SELECT deal_id FROM duplicate_deals) 
AND id NOT IN (SELECT keep_id FROM duplicate_deals);

-- Now add the unique constraint
ALTER TABLE deal2_enrichment_crunchbase_export 
ADD CONSTRAINT unique_deal_id_crunchbase_export UNIQUE (deal_id);