-- Fix the LinkedIn profile post-processing trigger to focus on snapshot_id
-- Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_linkedin_profile_auto_post_process ON deal2_enrichment_linkedin_profile_export;

-- Create improved trigger function that focuses on snapshot_id changes
CREATE OR REPLACE FUNCTION trigger_linkedin_profile_post_process()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger post-processing when:
  -- 1. snapshot_id transitions from NULL to a value (data is ready)
  -- 2. processing_status is 'triggered' (safety check)
  IF OLD.snapshot_id IS NULL 
     AND NEW.snapshot_id IS NOT NULL 
     AND NEW.processing_status = 'triggered' THEN
    
    -- Call the post-processor edge function
    PERFORM pg_notify('linkedin_profile_post_process', json_build_object(
      'dealId', NEW.deal_id,
      'linkedinProfileExportId', NEW.id,
      'snapshot_id', NEW.snapshot_id
    )::text);
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new trigger that only fires on snapshot_id updates
CREATE TRIGGER trigger_linkedin_profile_auto_post_process
  AFTER UPDATE OF snapshot_id ON deal2_enrichment_linkedin_profile_export
  FOR EACH ROW
  EXECUTE FUNCTION trigger_linkedin_profile_post_process();