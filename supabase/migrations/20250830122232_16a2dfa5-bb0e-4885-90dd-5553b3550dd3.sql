-- Add automatic post-processor trigger for Crunchbase enrichment
CREATE OR REPLACE FUNCTION public.trigger_crunchbase_post_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger if raw_brightdata_response is populated and processing_status is 'raw'
  IF NEW.raw_brightdata_response IS NOT NULL AND NEW.processing_status = 'raw' THEN
    
    -- Call the crunchbase-export-post-processor edge function
    PERFORM net.http_post(
      url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/crunchbase-export-post-processor',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := jsonb_build_object(
        'linkedinExportId', NEW.id
      )
    );
    
    -- Log the trigger
    INSERT INTO public.activity_events (
      user_id,
      fund_id,
      deal_id,
      activity_type,
      title,
      description,
      context_data
    ) VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      NEW.fund_id,
      NEW.deal_id,
      'data_processing',
      'Crunchbase Post-Processing Triggered',
      'Raw Crunchbase data received, post-processing initiated automatically',
      jsonb_build_object(
        'crunchbase_export_id', NEW.id,
        'company_name', NEW.company_name,
        'processing_status', NEW.processing_status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for automatic post-processing
DROP TRIGGER IF EXISTS trigger_crunchbase_auto_post_process ON public.deal_enrichment_crunchbase_export;
CREATE TRIGGER trigger_crunchbase_auto_post_process
  AFTER INSERT OR UPDATE ON public.deal_enrichment_crunchbase_export
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_crunchbase_post_processing();

-- Update the datapoint sync trigger to use PROCESSED data instead of raw data
CREATE OR REPLACE FUNCTION public.trigger_crunchbase_datapoint_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
BEGIN
  -- Only process if the record has been processed (not raw data)
  IF NEW.processing_status != 'processed' THEN
    RETURN NEW;
  END IF;
  
  -- Get fund type for this deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    -- Update VC datapoints with PROCESSED Crunchbase data
    UPDATE public.deal_analysis_datapoints_vc 
    SET 
      deal_enrichment_crunchbase_export = jsonb_build_object(
        'company_name', NEW.company_name,
        'website', NEW.website,
        'founded_date', NEW.founded,
        'industry', NEW.industry,
        'description', NEW.description,
        'headquarters', NEW.headquarters,
        'num_employees', NEW.team_size,
        'specialties', NEW.specialties,
        'linkedin_followers', NEW.linkedin_followers,
        'key_personnel', NEW.key_personnel,
        'updated_at', NEW.updated_at,
        'processing_status', NEW.processing_status
      ),
      -- Sync key fields to individual columns
      founding_year = CASE 
        WHEN NEW.founded IS NOT NULL AND NEW.founded ~ '^\d{4}$' 
        THEN NEW.founded::integer 
        ELSE founding_year 
      END,
      employee_count = CASE 
        WHEN NEW.team_size IS NOT NULL AND array_length(NEW.team_size, 1) > 0
        THEN (NEW.team_size)[1]::text  -- Take first element as string
        ELSE employee_count 
      END,
      competitors = CASE 
        WHEN NEW.competitors IS NOT NULL AND array_length(NEW.competitors, 1) > 0
        THEN NEW.competitors
        ELSE competitors 
      END,
      source_engines = CASE WHEN 'crunchbase' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'crunchbase') END,
      data_completeness_score = data_completeness_score + 25,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Update PE datapoints with PROCESSED Crunchbase data
    UPDATE public.deal_analysis_datapoints_pe 
    SET 
      deal_enrichment_crunchbase_export = jsonb_build_object(
        'company_name', NEW.company_name,
        'website', NEW.website,
        'founded_date', NEW.founded,
        'industry', NEW.industry,
        'description', NEW.description,
        'headquarters', NEW.headquarters,
        'num_employees', NEW.team_size,
        'specialties', NEW.specialties,
        'linkedin_followers', NEW.linkedin_followers,
        'key_personnel', NEW.key_personnel,
        'updated_at', NEW.updated_at,
        'processing_status', NEW.processing_status
      ),
      -- Sync key fields to individual columns
      founding_year = CASE 
        WHEN NEW.founded IS NOT NULL AND NEW.founded ~ '^\d{4}$' 
        THEN NEW.founded::integer 
        ELSE founding_year 
      END,
      employee_count = CASE 
        WHEN NEW.team_size IS NOT NULL AND array_length(NEW.team_size, 1) > 0
        THEN (NEW.team_size)[1]::integer  -- PE uses integer
        ELSE employee_count 
      END,
      competitors = CASE 
        WHEN NEW.competitors IS NOT NULL AND array_length(NEW.competitors, 1) > 0
        THEN NEW.competitors
        ELSE competitors 
      END,
      source_engines = CASE WHEN 'crunchbase' = ANY(source_engines) 
        THEN source_engines
        ELSE array_append(source_engines, 'crunchbase') END,
      data_completeness_score = data_completeness_score + 25,
      updated_at = now()
    WHERE deal_id = NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger for processed data sync
DROP TRIGGER IF EXISTS trigger_crunchbase_sync_datapoints ON public.deal_enrichment_crunchbase_export;
CREATE TRIGGER trigger_crunchbase_sync_datapoints
  AFTER UPDATE ON public.deal_enrichment_crunchbase_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'processed' AND OLD.processing_status != 'processed')
  EXECUTE FUNCTION public.trigger_crunchbase_datapoint_update();