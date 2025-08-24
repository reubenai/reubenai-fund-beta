-- Emergency Data Flooding Cleanup and Prevention Migration
-- This migration addresses critical data duplication in deal_analysis_sources and artifacts tables

-- Step 1: Create emergency cleanup function for deal_analysis_sources
CREATE OR REPLACE FUNCTION emergency_cleanup_duplicate_sources()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count INTEGER := 0;
  total_before INTEGER := 0;
  total_after INTEGER := 0;
BEGIN
  -- Get count before cleanup
  SELECT COUNT(*) INTO total_before FROM deal_analysis_sources;
  
  -- Delete duplicates, keeping only the most recent entry per deal/engine combination
  WITH ranked_sources AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY deal_id, engine_name 
             ORDER BY created_at DESC, id DESC
           ) as rn
    FROM deal_analysis_sources
  )
  DELETE FROM deal_analysis_sources 
  WHERE id IN (
    SELECT id FROM ranked_sources WHERE rn > 1
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Get count after cleanup
  SELECT COUNT(*) INTO total_after FROM deal_analysis_sources;
  
  RETURN jsonb_build_object(
    'success', true,
    'table', 'deal_analysis_sources',
    'rows_before', total_before,
    'rows_after', total_after,
    'duplicates_removed', deleted_count,
    'cleanup_timestamp', now()
  );
END;
$$;

-- Step 2: Create emergency cleanup function for artifacts
CREATE OR REPLACE FUNCTION emergency_cleanup_duplicate_artifacts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count INTEGER := 0;
  total_before INTEGER := 0;
  total_after INTEGER := 0;
BEGIN
  -- Get count before cleanup
  SELECT COUNT(*) INTO total_before FROM artifacts;
  
  -- Delete duplicates, keeping only the most recent entry per deal/type/kind combination
  WITH ranked_artifacts AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY deal_id, artifact_type, artifact_kind 
             ORDER BY created_at DESC, id DESC
           ) as rn
    FROM artifacts
  )
  DELETE FROM artifacts 
  WHERE id IN (
    SELECT id FROM ranked_artifacts WHERE rn > 1
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Get count after cleanup
  SELECT COUNT(*) INTO total_after FROM artifacts;
  
  RETURN jsonb_build_object(
    'success', true,
    'table', 'artifacts', 
    'rows_before', total_before,
    'rows_after', total_after,
    'duplicates_removed', deleted_count,
    'cleanup_timestamp', now()
  );
END;
$$;

-- Step 3: Add unique constraints to prevent future duplicates
-- For deal_analysis_sources: one entry per deal/engine combination
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_deal_analysis_sources_unique_deal_engine 
ON deal_analysis_sources (deal_id, engine_name);

-- For artifacts: one entry per deal/type/kind combination  
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_artifacts_unique_deal_type_kind
ON artifacts (deal_id, artifact_type, artifact_kind);

-- Step 4: Create idempotency table for analysis engines
CREATE TABLE IF NOT EXISTS analysis_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  deal_id uuid NOT NULL,
  engine_name text NOT NULL,
  operation_type text NOT NULL,
  result_data jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending, completed, failed
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours')
);

-- RLS for idempotency table
ALTER TABLE analysis_idempotency ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services can manage idempotency keys" 
ON analysis_idempotency 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Step 5: Create monitoring function for duplicate detection
CREATE OR REPLACE FUNCTION detect_duplicate_sources()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  duplicate_sources jsonb;
  duplicate_artifacts jsonb;
BEGIN
  -- Check for duplicate sources
  SELECT jsonb_agg(
    jsonb_build_object(
      'deal_id', deal_id,
      'engine_name', engine_name,
      'count', count,
      'company_name', company_name
    )
  ) INTO duplicate_sources
  FROM (
    SELECT 
      das.deal_id,
      das.engine_name,
      COUNT(*) as count,
      d.company_name
    FROM deal_analysis_sources das
    LEFT JOIN deals d ON das.deal_id = d.id
    WHERE das.created_at > now() - interval '1 hour'
    GROUP BY das.deal_id, das.engine_name, d.company_name
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
    LIMIT 20
  ) duplicates;
  
  -- Check for duplicate artifacts
  SELECT jsonb_agg(
    jsonb_build_object(
      'deal_id', deal_id,
      'artifact_type', artifact_type,
      'artifact_kind', artifact_kind,
      'count', count,
      'company_name', company_name
    )
  ) INTO duplicate_artifacts
  FROM (
    SELECT 
      a.deal_id,
      a.artifact_type,
      a.artifact_kind,
      COUNT(*) as count,
      d.company_name
    FROM artifacts a
    LEFT JOIN deals d ON a.deal_id = d.id
    WHERE a.created_at > now() - interval '1 hour'
    GROUP BY a.deal_id, a.artifact_type, a.artifact_kind, d.company_name
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
    LIMIT 20
  ) duplicates;
  
  RETURN jsonb_build_object(
    'sources_duplicates', COALESCE(duplicate_sources, '[]'::jsonb),
    'artifacts_duplicates', COALESCE(duplicate_artifacts, '[]'::jsonb),
    'check_timestamp', now()
  );
END;
$$;

-- Step 6: Create prevention trigger for deal_analysis_sources
CREATE OR REPLACE FUNCTION prevent_duplicate_analysis_sources()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if entry already exists
  IF EXISTS (
    SELECT 1 FROM deal_analysis_sources 
    WHERE deal_id = NEW.deal_id 
      AND engine_name = NEW.engine_name
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    -- Update existing entry instead of creating duplicate
    UPDATE deal_analysis_sources 
    SET 
      data_retrieved = NEW.data_retrieved,
      confidence_score = NEW.confidence_score,
      validated = NEW.validated,
      retrieved_at = NEW.retrieved_at,
      source_url = NEW.source_url,
      source_type = NEW.source_type,
      validation_notes = NEW.validation_notes,
      data_snippet = NEW.data_snippet
    WHERE deal_id = NEW.deal_id 
      AND engine_name = NEW.engine_name;
    
    -- Return NULL to cancel the INSERT
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the prevention trigger
DROP TRIGGER IF EXISTS prevent_duplicate_sources_trigger ON deal_analysis_sources;
CREATE TRIGGER prevent_duplicate_sources_trigger
  BEFORE INSERT ON deal_analysis_sources
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_analysis_sources();

-- Step 7: Create prevention trigger for artifacts
CREATE OR REPLACE FUNCTION prevent_duplicate_artifacts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if entry already exists
  IF EXISTS (
    SELECT 1 FROM artifacts 
    WHERE deal_id = NEW.deal_id 
      AND artifact_type = NEW.artifact_type
      AND artifact_kind = NEW.artifact_kind
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    -- Update existing entry instead of creating duplicate
    UPDATE artifacts 
    SET 
      artifact_data = NEW.artifact_data,
      provenance = NEW.provenance,
      validation_status = NEW.validation_status,
      citations = NEW.citations,
      updated_at = NEW.updated_at
    WHERE deal_id = NEW.deal_id 
      AND artifact_type = NEW.artifact_type
      AND artifact_kind = NEW.artifact_kind;
    
    -- Return NULL to cancel the INSERT
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the prevention trigger
DROP TRIGGER IF EXISTS prevent_duplicate_artifacts_trigger ON artifacts;
CREATE TRIGGER prevent_duplicate_artifacts_trigger
  BEFORE INSERT ON artifacts
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_artifacts();

-- Step 8: Create cleanup index for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deal_analysis_sources_cleanup
ON deal_analysis_sources (deal_id, engine_name, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artifacts_cleanup
ON artifacts (deal_id, artifact_type, artifact_kind, created_at DESC);

-- Step 9: Execute immediate cleanup (commented out for safety - run manually)
-- SELECT emergency_cleanup_duplicate_sources();
-- SELECT emergency_cleanup_duplicate_artifacts();