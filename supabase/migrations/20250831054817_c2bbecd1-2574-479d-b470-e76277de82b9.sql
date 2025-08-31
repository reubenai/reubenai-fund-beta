-- Phase 1: Modify existing trigger to handle UPDATE operations for founder name changes
-- First, drop the existing trigger
DROP TRIGGER IF EXISTS trigger_linkedin_profile_enrichment_on_deal_insert ON deals;

-- Recreate the function to handle both INSERT and UPDATE
CREATE OR REPLACE FUNCTION public.trigger_linkedin_profile_enrichment_on_deal_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
  first_name text;
  last_name text;
BEGIN
  -- For INSERT: Check if founder name exists
  -- For UPDATE: Check if founder name was added (changed from NULL/empty to a value)
  IF TG_OP = 'INSERT' THEN
    -- Only proceed if founder name exists on new deal
    IF NEW.founder IS NULL OR trim(NEW.founder) = '' THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only proceed if founder name was added or changed meaningfully
    IF (OLD.founder IS NULL OR trim(OLD.founder) = '') AND (NEW.founder IS NOT NULL AND trim(NEW.founder) != '') THEN
      -- Founder name was added
      NULL; -- Continue processing
    ELSIF OLD.founder != NEW.founder AND NEW.founder IS NOT NULL AND trim(NEW.founder) != '' THEN
      -- Founder name was changed to a different non-empty value
      NULL; -- Continue processing
    ELSE
      -- No meaningful founder name change
      RETURN NEW;
    END IF;
  END IF;

  -- Get fund type
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.funds f
  WHERE f.id = NEW.fund_id;

  -- Only proceed for venture capital funds
  IF fund_type_value != 'venture_capital' AND fund_type_value != 'vc' THEN
    RETURN NEW;
  END IF;

  -- Split founder name into first and last name
  first_name := split_part(trim(NEW.founder), ' ', 1);
  last_name := CASE 
    WHEN position(' ' in trim(NEW.founder)) > 0 
    THEN trim(substring(trim(NEW.founder) from position(' ' in trim(NEW.founder)) + 1))
    ELSE ''
  END;

  -- Insert or update record in LinkedIn profile export table
  INSERT INTO public.deal2_enrichment_linkedin_profile_export (
    deal_id,
    founder_name,
    first_name,
    last_name,
    processing_status
  ) VALUES (
    NEW.id,
    NEW.founder,
    first_name,
    last_name,
    'queued'
  )
  ON CONFLICT (deal_id) 
  DO UPDATE SET
    founder_name = EXCLUDED.founder_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    processing_status = 'queued',
    updated_at = now();

  RETURN NEW;
END;
$function$;

-- Create the trigger for both INSERT and UPDATE operations
CREATE TRIGGER trigger_linkedin_profile_enrichment_on_deal_change
  AFTER INSERT OR UPDATE OF founder ON deals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_linkedin_profile_enrichment_on_deal_change();

-- Phase 2: Create automatic post-processing function
CREATE OR REPLACE FUNCTION public.trigger_linkedin_profile_post_processor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger post-processing when record moves to 'triggered' status with snapshot_id
  IF NEW.processing_status = 'triggered' AND NEW.snapshot_id IS NOT NULL THEN
    -- Use pg_notify for asynchronous processing to avoid blocking the transaction
    PERFORM pg_notify(
      'linkedin_profile_post_process',
      json_build_object(
        'deal_id', NEW.deal_id,
        'linkedin_profile_export_id', NEW.id,
        'snapshot_id', NEW.snapshot_id,
        'founder_name', NEW.founder_name
      )::text
    );
    
    -- Log the trigger for debugging
    INSERT INTO public.activity_events (
      user_id,
      fund_id,
      deal_id,
      activity_type,
      title,
      description,
      context_data
    ) 
    SELECT
      auth.uid(),
      d.fund_id,
      NEW.deal_id,
      'linkedin_profile_post_process_triggered',
      'LinkedIn Profile Post-Processing Triggered',
      'Automatic post-processing initiated for founder: ' || NEW.founder_name,
      jsonb_build_object(
        'linkedin_export_id', NEW.id,
        'snapshot_id', NEW.snapshot_id,
        'processing_status', NEW.processing_status
      )
    FROM deals d
    WHERE d.id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for automatic post-processing
CREATE TRIGGER trigger_linkedin_profile_auto_post_process
  AFTER INSERT OR UPDATE OF processing_status, snapshot_id ON deal2_enrichment_linkedin_profile_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'triggered' AND NEW.snapshot_id IS NOT NULL)
  EXECUTE FUNCTION trigger_linkedin_profile_post_processor();

-- Phase 3: Add safety constraint to prevent duplicate processing
-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'deal2_enrichment_linkedin_profile_export_deal_id_key'
  ) THEN
    ALTER TABLE deal2_enrichment_linkedin_profile_export 
    ADD CONSTRAINT deal2_enrichment_linkedin_profile_export_deal_id_key 
    UNIQUE (deal_id);
  END IF;
END $$;

-- Create index for performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_linkedin_profile_export_status_snapshot 
ON deal2_enrichment_linkedin_profile_export (processing_status, snapshot_id) 
WHERE processing_status IN ('queued', 'processing', 'triggered');

-- Add helpful comment
COMMENT ON FUNCTION trigger_linkedin_profile_enrichment_on_deal_change() IS 
'Triggers LinkedIn profile enrichment when founder name is added to deals (INSERT or UPDATE)';

COMMENT ON FUNCTION trigger_linkedin_profile_post_processor() IS 
'Automatically triggers post-processing when LinkedIn profile export receives snapshot_id';

COMMENT ON TRIGGER trigger_linkedin_profile_auto_post_process ON deal2_enrichment_linkedin_profile_export IS 
'Automatically calls post-processor when processing_status=triggered and snapshot_id is available';