-- Add missing enum value for crunchbase enrichment
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'crunchbase_enrichment_queued';

-- Add unique constraint on deal_id to fix ON CONFLICT clause
-- First, remove any existing duplicate records (keeping the first created)
DELETE FROM deal2_enrichment_crunchbase_export 
WHERE id NOT IN (
  SELECT DISTINCT ON (deal_id) id 
  FROM deal2_enrichment_crunchbase_export 
  ORDER BY deal_id, created_at ASC
);

-- Now add the unique constraint
ALTER TABLE deal2_enrichment_crunchbase_export 
ADD CONSTRAINT unique_deal_id_crunchbase_export UNIQUE (deal_id);