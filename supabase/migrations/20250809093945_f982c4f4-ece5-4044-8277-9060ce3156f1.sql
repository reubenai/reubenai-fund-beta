-- Phase 3: Fix User Management - Filter soft-deleted users
-- Update profiles view to automatically filter out soft-deleted users in admin interface

-- Create a view for active profiles (non-deleted users)
CREATE OR REPLACE VIEW active_profiles AS
SELECT *
FROM profiles
WHERE is_deleted IS NULL OR is_deleted = false;

-- Grant the same permissions to the view as the original table
ALTER VIEW active_profiles OWNER TO postgres;
GRANT ALL ON active_profiles TO postgres;
GRANT ALL ON active_profiles TO service_role;

-- Create RLS policies for the view
ALTER TABLE active_profiles ENABLE ROW LEVEL SECURITY;

-- Copy existing policies to the view
CREATE POLICY "Users can view active profiles in their org" ON active_profiles
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id
    FROM profiles p
    WHERE p.user_id = auth.uid()
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  ));

CREATE POLICY "Reuben admins can manage all active profiles" ON active_profiles
  FOR ALL
  USING (is_reuben_email())
  WITH CHECK (is_reuben_email());

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