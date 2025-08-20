-- Fix memory type constraint violations and add queue cleanup functions

-- 1. Create function to clean up stalled analysis queue items
CREATE OR REPLACE FUNCTION cleanup_stalled_analysis_queue()
RETURNS TABLE(cleaned_count INTEGER, processing_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleaned_items INTEGER := 0;
  processing_items INTEGER := 0;
BEGIN
  -- Count items stuck in processing for over 1 hour
  SELECT COUNT(*) INTO processing_items
  FROM analysis_queue 
  WHERE status = 'processing' 
    AND started_at < NOW() - INTERVAL '1 hour';
    
  -- Reset stuck processing items to queued
  UPDATE analysis_queue 
  SET status = 'queued',
      started_at = NULL,
      attempts = LEAST(attempts + 1, max_attempts),
      error_message = 'Reset from stalled processing state'
  WHERE status = 'processing' 
    AND started_at < NOW() - INTERVAL '1 hour'
    AND attempts < max_attempts;
    
  GET DIAGNOSTICS cleaned_items = ROW_COUNT;
  
  -- Mark items that exceeded max attempts as failed
  UPDATE analysis_queue 
  SET status = 'failed',
      completed_at = NOW(),
      error_message = 'Exceeded maximum attempts - stalled processing'
  WHERE status = 'processing' 
    AND started_at < NOW() - INTERVAL '1 hour'
    AND attempts >= max_attempts;
  
  RETURN QUERY SELECT cleaned_items, processing_items;
END;
$$;

-- 2. Create function to check if deal is safe to edit
CREATE OR REPLACE FUNCTION is_deal_safe_to_edit(deal_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_active_analysis BOOLEAN := FALSE;
BEGIN
  -- Check if deal has any active analysis
  SELECT EXISTS(
    SELECT 1 FROM analysis_queue 
    WHERE deal_id = deal_id_param 
      AND status IN ('queued', 'processing')
  ) INTO has_active_analysis;
  
  RETURN NOT has_active_analysis;
END;
$$;

-- 3. Add index for better performance on analysis queue checks
CREATE INDEX IF NOT EXISTS idx_analysis_queue_deal_status 
ON analysis_queue(deal_id, status) 
WHERE status IN ('queued', 'processing');

-- 4. Add trigger to prevent concurrent analysis conflicts
CREATE OR REPLACE FUNCTION prevent_concurrent_analysis()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check for deals table updates that might trigger analysis
  IF TG_TABLE_NAME = 'deals' AND TG_OP = 'UPDATE' THEN
    -- Check if there's an active analysis
    IF EXISTS(
      SELECT 1 FROM analysis_queue 
      WHERE deal_id = NEW.id 
        AND status IN ('queued', 'processing')
    ) THEN
      -- Log the conflict but don't block the update
      INSERT INTO activity_events (
        user_id, fund_id, deal_id, activity_type, title, description, priority
      ) VALUES (
        auth.uid(), NEW.fund_id, NEW.id, 
        'conflict_detected', 
        'Concurrent Analysis Conflict', 
        'Deal updated while analysis was active - potential data conflict',
        'high'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply trigger to deals table
DROP TRIGGER IF EXISTS trigger_prevent_concurrent_analysis ON deals;
CREATE TRIGGER trigger_prevent_concurrent_analysis
  AFTER UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION prevent_concurrent_analysis();

-- 5. Update deals table to add optimistic locking support
ALTER TABLE deals ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 6. Clean up existing stalled queue items
SELECT cleanup_stalled_analysis_queue();