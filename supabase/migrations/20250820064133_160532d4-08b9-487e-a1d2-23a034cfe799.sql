-- Fix deal creation by updating invalid activity_type in trigger
-- Change 'conflict_detected' to 'system_event' which is a valid enum value

CREATE OR REPLACE FUNCTION handle_deal_analysis_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if deal is being updated while analysis is running
  IF TG_OP = 'UPDATE' THEN
    -- Check for existing analysis in queue
    IF EXISTS (
      SELECT 1 FROM analysis_queue 
      WHERE deal_id = NEW.id 
        AND status IN ('queued', 'processing')
    ) THEN
      -- Log the conflict but don't block the update
      INSERT INTO activity_events (
        user_id, fund_id, deal_id, activity_type, title, description, priority
      ) VALUES (
        auth.uid(), NEW.fund_id, NEW.id, 
        'system_event', 
        'Concurrent Analysis Conflict', 
        'Deal updated while analysis was active - potential data conflict',
        'high'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;