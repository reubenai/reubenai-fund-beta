-- Phase 3: Fix User Management - Filter soft-deleted users (CORRECTED)
-- Views cannot have RLS policies, so we'll update the components to use filtered queries instead

-- Drop the view since we can't apply RLS to it
DROP VIEW IF EXISTS active_profiles;

-- Phase 4: Backfill enhanced analysis for all existing deals
-- Update all existing deals to use the new enhanced analysis function
UPDATE deals 
SET enhanced_analysis = populate_enhanced_analysis(id),
    updated_at = now()
WHERE enhanced_analysis IS NULL 
   OR NOT (enhanced_analysis ? 'engines_completion_status')
   OR NOT (enhanced_analysis ? 'real_intelligence_summary');

-- Phase 5: Create a function to manually trigger analysis for specific deals
CREATE OR REPLACE FUNCTION force_deal_analysis(deal_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deal_id uuid;
  result_count integer := 0;
  error_count integer := 0;
  results jsonb := '[]'::jsonb;
BEGIN
  -- Process each deal ID
  FOREACH deal_id IN ARRAY deal_ids
  LOOP
    BEGIN
      -- Queue the deal for immediate analysis
      PERFORM queue_deal_analysis(
        deal_id,
        'manual_force',
        'high',
        0 -- No delay for forced analysis
      );
      
      result_count := result_count + 1;
      results := results || jsonb_build_array(jsonb_build_object(
        'deal_id', deal_id,
        'status', 'queued',
        'message', 'Successfully queued for immediate analysis'
      ));
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      results := results || jsonb_build_array(jsonb_build_object(
        'deal_id', deal_id,
        'status', 'error',
        'message', SQLERRM
      ));
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'total_deals', array_length(deal_ids, 1),
    'successfully_queued', result_count,
    'errors', error_count,
    'results', results,
    'timestamp', now()
  );
END;
$$;