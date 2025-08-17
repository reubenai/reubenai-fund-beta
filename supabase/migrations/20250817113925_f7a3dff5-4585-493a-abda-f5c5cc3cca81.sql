-- Function to force process all queued analysis items
CREATE OR REPLACE FUNCTION force_process_analysis_queue()
RETURNS jsonb AS $$
DECLARE
  processed_count INTEGER := 0;
  item_record RECORD;
  result JSONB;
BEGIN
  -- Update all queued items to processing status temporarily
  FOR item_record IN 
    SELECT id, deal_id, fund_id, trigger_reason
    FROM analysis_queue 
    WHERE status = 'queued' 
    AND scheduled_for <= now()
  LOOP
    -- Mark as processing
    UPDATE analysis_queue 
    SET status = 'processing', 
        started_at = now(),
        attempts = attempts + 1
    WHERE id = item_record.id;
    
    -- Simulate successful completion for now
    UPDATE analysis_queue 
    SET status = 'completed',
        completed_at = now()
    WHERE id = item_record.id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  result := jsonb_build_object(
    'processed_count', processed_count,
    'timestamp', now()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;