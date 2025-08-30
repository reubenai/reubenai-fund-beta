-- Fix deal creation by decoupling API calls from deal triggers
-- Move API calls to export table triggers instead

-- Step 1: Replace the existing deal triggers with lightweight versions that just insert export rows

-- Replace founder profile enrichment trigger (lightweight version)
CREATE OR REPLACE FUNCTION public.trigger_new_deal_founder_profile_enrichment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  founder_name text;
  first_name text;
  last_name text;
  name_parts text[];
  snapshot_id text;
BEGIN
  -- Only trigger if the new deal has a founder name
  IF NEW.founder IS NOT NULL AND NEW.founder != '' THEN
    founder_name := trim(NEW.founder);
    
    -- Split founder name into first and last name
    name_parts := string_to_array(founder_name, ' ');
    
    IF array_length(name_parts, 1) >= 2 THEN
      first_name := name_parts[1];
      last_name := array_to_string(name_parts[2:array_length(name_parts, 1)], ' ');
      
      -- Validate we have both first and last name
      IF first_name != '' AND last_name != '' THEN
        
        -- Generate snapshot ID
        snapshot_id := 'deal-' || NEW.id::text || '-founder-' || extract(epoch from now())::text;
        
        -- Insert row into export table (this will trigger the API call via export table trigger)
        INSERT INTO public.deal_enrichment_linkedin_profile_export (
          deal_id,
          snapshot_id,
          first_name,
          last_name,
          name,
          raw_brightdata_response,
          processing_status
        ) VALUES (
          NEW.id,
          snapshot_id,
          first_name,
          last_name,
          founder_name,
          jsonb_build_object('status', 'pending_api_call'),
          'pending'
        );
        
        -- Log the founder profile enrichment trigger activity
        INSERT INTO public.activity_events (
          user_id,
          fund_id,
          deal_id,
          activity_type,
          title,
          description,
          context_data
        ) VALUES (
          COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid),
          NEW.fund_id,
          NEW.id,
          'founder_profile_enrichment_triggered',
          'Founder Profile Enrichment Queued',
          'Founder profile enrichment queued for processing',
          jsonb_build_object(
            'founder_name', founder_name,
            'first_name', first_name,
            'last_name', last_name,
            'snapshot_id', snapshot_id,
            'trigger_type', 'new_deal_creation',
            'company_name', NEW.company_name
          )
        );
        
      ELSE
        -- Log invalid founder name format
        INSERT INTO public.activity_events (
          user_id,
          fund_id,
          deal_id,
          activity_type,
          title,
          description,
          context_data
        ) VALUES (
          COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid),
          NEW.fund_id,
          NEW.id,
          'founder_profile_enrichment_skipped',
          'Founder Profile Enrichment Skipped',
          'Founder name format invalid - enrichment not triggered',
          jsonb_build_object(
            'founder_name', founder_name,
            'reason', 'insufficient_name_parts'
          )
        );
      END IF;
    ELSE
      -- Log insufficient name parts
      INSERT INTO public.activity_events (
        user_id,
        fund_id,
        deal_id,
        activity_type,
        title,
        description,
        context_data
      ) VALUES (
        COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid),
        NEW.fund_id,
        NEW.id,
        'founder_profile_enrichment_skipped',
        'Founder Profile Enrichment Skipped',
        'Founder name must contain both first and last name',
        jsonb_build_object(
          'founder_name', founder_name,
          'reason', 'single_name_only'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Replace LinkedIn enrichment trigger (lightweight version)
CREATE OR REPLACE FUNCTION public.trigger_new_deal_linkedin_enrichment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  snapshot_id text;
BEGIN
  -- Only trigger if the new deal has a LinkedIn URL
  IF NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url != '' THEN
    -- Validate LinkedIn URL format
    IF NEW.linkedin_url ~* '^https?://(www\.)?linkedin\.com/company/' THEN
      
      -- Generate snapshot ID
      snapshot_id := 'deal-' || NEW.id::text || '-linkedin-' || extract(epoch from now())::text;
      
      -- Insert row into export table (this will trigger the API call via export table trigger)
      INSERT INTO public.deal_enrichment_linkedin_export (
        deal_id,
        snapshot_id,
        linkedin_url,
        company_name,
        raw_brightdata_response,
        processing_status
      ) VALUES (
        NEW.id,
        snapshot_id,
        NEW.linkedin_url,
        NEW.company_name,
        jsonb_build_object('status', 'pending_api_call'),
        'pending'
      );
      
      -- Log the LinkedIn enrichment trigger activity
      INSERT INTO public.activity_events (
        user_id,
        fund_id,
        deal_id,
        activity_type,
        title,
        description,
        context_data
      ) VALUES (
        COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid),
        NEW.fund_id,
        NEW.id,
        'linkedin_enrichment_triggered',
        'LinkedIn Enrichment Queued',
        'LinkedIn enrichment queued for processing',
        jsonb_build_object(
          'linkedin_url', NEW.linkedin_url,
          'snapshot_id', snapshot_id,
          'trigger_type', 'new_deal_creation',
          'company_name', NEW.company_name
        )
      );
      
    ELSE
      -- Log invalid LinkedIn URL
      INSERT INTO public.activity_events (
        user_id,
        fund_id,
        deal_id,
        activity_type,
        title,
        description,
        context_data
      ) VALUES (
        COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid),
        NEW.fund_id,
        NEW.id,
        'linkedin_enrichment_skipped',
        'LinkedIn Enrichment Skipped',
        'LinkedIn URL format invalid - enrichment not triggered',
        jsonb_build_object(
          'linkedin_url', NEW.linkedin_url,
          'reason', 'invalid_linkedin_url_format'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Step 2: Create triggers on export tables to handle API calls

-- Trigger function for LinkedIn profile export table (handles API calls)
CREATE OR REPLACE FUNCTION public.trigger_linkedin_profile_export_api_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger if this is a new row with pending status
  IF NEW.processing_status = 'pending' AND (OLD IS NULL OR OLD.processing_status != 'pending') THEN
    
    -- Call the brightdata-linkedin-profile-enrichment edge function
    PERFORM net.http_post(
      url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/brightdata-linkedin-profile-enrichment',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := jsonb_build_object(
        'dealId', NEW.deal_id::text,
        'firstName', NEW.first_name,
        'lastName', NEW.last_name
      )
    );
    
    -- Update status to indicate API call was made
    UPDATE public.deal_enrichment_linkedin_profile_export 
    SET processing_status = 'api_called',
        updated_at = now()
    WHERE id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Trigger function for LinkedIn company export table (handles API calls)
CREATE OR REPLACE FUNCTION public.trigger_linkedin_export_api_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger if this is a new row with pending status
  IF NEW.processing_status = 'pending' AND (OLD IS NULL OR OLD.processing_status != 'pending') THEN
    
    -- Call the brightdata-linkedin-enrichment edge function
    PERFORM net.http_post(
      url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/brightdata-linkedin-enrichment',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := jsonb_build_object(
        'dealId', NEW.deal_id::text,
        'companyName', NEW.company_name,
        'linkedinUrl', NEW.linkedin_url
      )
    );
    
    -- Update status to indicate API call was made
    UPDATE public.deal_enrichment_linkedin_export 
    SET processing_status = 'api_called',
        updated_at = now()
    WHERE id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Step 3: Create the actual triggers on export tables

-- Trigger on LinkedIn profile export table
CREATE TRIGGER linkedin_profile_export_api_trigger
  AFTER INSERT OR UPDATE ON public.deal_enrichment_linkedin_profile_export
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_linkedin_profile_export_api_call();

-- Trigger on LinkedIn company export table  
CREATE TRIGGER linkedin_export_api_trigger
  AFTER INSERT OR UPDATE ON public.deal_enrichment_linkedin_export
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_linkedin_export_api_call();

-- Step 4: Add missing processing status values if they don't exist
ALTER TABLE public.deal_enrichment_linkedin_profile_export 
DROP CONSTRAINT IF EXISTS deal_enrichment_linkedin_profile_export_processing_status_check;

ALTER TABLE public.deal_enrichment_linkedin_profile_export 
ADD CONSTRAINT deal_enrichment_linkedin_profile_export_processing_status_check 
CHECK (processing_status IN ('pending', 'api_called', 'raw', 'vectorized', 'processed', 'failed'));

ALTER TABLE public.deal_enrichment_linkedin_export 
DROP CONSTRAINT IF EXISTS deal_enrichment_linkedin_export_processing_status_check;

ALTER TABLE public.deal_enrichment_linkedin_export 
ADD CONSTRAINT deal_enrichment_linkedin_export_processing_status_check 
CHECK (processing_status IN ('pending', 'api_called', 'raw', 'vectorized', 'processed', 'failed'));