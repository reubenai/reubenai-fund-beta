-- Fix the trigger function that's causing the ON CONFLICT error
-- Remove the problematic ON CONFLICT clause since there's no unique constraint on deal_id
CREATE OR REPLACE FUNCTION public.trigger_analysis_on_document_upload()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger if this is a new document that should trigger reanalysis
  IF NEW.triggers_reanalysis = true THEN
    
    -- Update the deal to indicate analysis should be refreshed
    UPDATE deals 
    SET last_analysis_trigger = NOW(),
        last_analysis_trigger_reason = 'document_upload',
        analysis_queue_status = 'pending'
    WHERE id = NEW.deal_id;
    
    -- Queue for analysis if auto-analysis is enabled (without ON CONFLICT)
    -- Check if there's already a queued analysis for this deal
    IF NOT EXISTS (
      SELECT 1 FROM analysis_queue 
      WHERE deal_id = NEW.deal_id 
      AND status IN ('queued', 'processing')
    ) THEN
      INSERT INTO analysis_queue (
        deal_id, 
        fund_id, 
        trigger_reason, 
        priority,
        scheduled_for,
        metadata
      )
      SELECT 
        d.id,
        d.fund_id,
        'document_upload',
        'normal',
        NOW() + INTERVAL '10 minutes', -- Slight delay to allow document processing
        jsonb_build_object(
          'document_id', NEW.id,
          'document_name', NEW.name,
          'document_type', NEW.document_type
        )
      FROM deals d
      WHERE d.id = NEW.deal_id AND d.auto_analysis_enabled = true;
    END IF;
      
    -- Log document upload activity
    INSERT INTO activity_events (
      user_id,
      fund_id,
      deal_id,
      activity_type,
      title,
      description,
      context_data
    ) VALUES (
      NEW.uploaded_by,
      NEW.fund_id,
      NEW.deal_id,
      'document_uploaded',
      'Document Uploaded - Analysis Queued',
      'New document "' || NEW.name || '" uploaded, analysis refresh queued',
      jsonb_build_object(
        'document_id', NEW.id,
        'document_name', NEW.name,
        'document_type', NEW.document_type,
        'triggers_reanalysis', NEW.triggers_reanalysis
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;