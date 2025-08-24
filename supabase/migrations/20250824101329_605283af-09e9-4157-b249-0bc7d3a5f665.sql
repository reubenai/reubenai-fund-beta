-- Add unique constraints to prevent future duplicates
-- This migration adds constraints after the cleanup functions are available

-- Add unique constraint for deal_analysis_sources
-- One entry per deal/engine combination
ALTER TABLE deal_analysis_sources 
ADD CONSTRAINT unique_deal_engine_sources 
UNIQUE (deal_id, engine_name);

-- Add unique constraint for artifacts  
-- One entry per deal/type/kind combination
ALTER TABLE artifacts 
ADD CONSTRAINT unique_deal_type_kind_artifacts 
UNIQUE (deal_id, artifact_type, artifact_kind);