-- Create function to call the edge function via HTTP POST
CREATE OR REPLACE FUNCTION trigger_crunchbase_post_processor()
RETURNS void AS $$
DECLARE
  response_record RECORD;
BEGIN
  -- Call the post-processor edge function
  SELECT content::jsonb, status INTO response_record
  FROM http((
    'POST',
    'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/deal2-crunchbase-export-post-processor',
    ARRAY[http_header('Content-Type', 'application/json'), http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true))],
    'application/json',
    '{}'
  )::http_request);
  
  -- Log the trigger execution
  INSERT INTO activity_events (
    user_id, fund_id, activity_type, title, description,
    context_data, priority, occurred_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'crunchbase_auto_trigger',
    'Auto-triggered Crunchbase Post-Processor',
    'Database trigger automatically invoked post-processor',
    jsonb_build_object(
      'http_status', response_record.status,
      'response', response_record.content,
      'timestamp', now()
    ),
    'low',
    NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors
    INSERT INTO activity_events (
      user_id, fund_id, activity_type, title, description,
      context_data, priority, occurred_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'crunchbase_trigger_error',
      'Crunchbase Post-Processor Trigger Failed',
      'Database trigger failed to invoke post-processor: ' || SQLERRM,
      jsonb_build_object(
        'error_message', SQLERRM,
        'error_state', SQLSTATE,
        'timestamp', now()
      ),
      'high',
      NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function that checks for 'triggered' status
CREATE OR REPLACE FUNCTION check_and_trigger_crunchbase_processor()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status is 'triggered', snapshot_id exists, and this is a new trigger
  IF NEW.processing_status = 'triggered' 
     AND NEW.snapshot_id IS NOT NULL 
     AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND COALESCE(OLD.processing_status, '') != 'triggered')) THEN
    
    -- Use pg_notify for async processing to avoid blocking the transaction
    PERFORM pg_notify('crunchbase_processor_trigger', 
      jsonb_build_object(
        'record_id', NEW.id,
        'deal_id', NEW.deal_id,
        'snapshot_id', NEW.snapshot_id,
        'triggered_at', now()
      )::text
    );
    
    -- Also call the processor function directly (with error handling)
    BEGIN
      PERFORM trigger_crunchbase_post_processor();
    EXCEPTION
      WHEN OTHERS THEN
        -- Continue even if trigger fails - the pg_notify will serve as backup
        NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the actual triggers
DROP TRIGGER IF EXISTS crunchbase_processor_insert_trigger ON deal2_enrichment_crunchbase_export;
DROP TRIGGER IF EXISTS crunchbase_processor_update_trigger ON deal2_enrichment_crunchbase_export;

CREATE TRIGGER crunchbase_processor_insert_trigger
  AFTER INSERT ON deal2_enrichment_crunchbase_export
  FOR EACH ROW
  EXECUTE FUNCTION check_and_trigger_crunchbase_processor();

CREATE TRIGGER crunchbase_processor_update_trigger
  AFTER UPDATE ON deal2_enrichment_crunchbase_export
  FOR EACH ROW
  EXECUTE FUNCTION check_and_trigger_crunchbase_processor();

-- Create a periodic check function as backup
CREATE OR REPLACE FUNCTION periodic_crunchbase_check()
RETURNS INTEGER AS $$
DECLARE
  triggered_count INTEGER;
BEGIN
  -- Count triggered records with snapshot_id
  SELECT COUNT(*) INTO triggered_count 
  FROM deal2_enrichment_crunchbase_export 
  WHERE processing_status = 'triggered' 
    AND snapshot_id IS NOT NULL;
    
  -- Only call processor if there are records to process
  IF triggered_count > 0 THEN
    PERFORM trigger_crunchbase_post_processor();
  END IF;
  
  RETURN triggered_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;