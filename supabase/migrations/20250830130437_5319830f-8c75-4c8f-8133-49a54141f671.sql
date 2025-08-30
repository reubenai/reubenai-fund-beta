-- Create trigger function for new deal LinkedIn enrichment
CREATE OR REPLACE FUNCTION public.trigger_new_deal_linkedin_enrichment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger if the new deal has a LinkedIn URL
  IF NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url != '' THEN
    -- Validate LinkedIn URL format
    IF NEW.linkedin_url ~* '^https?://(www\.)?linkedin\.com/company/' THEN
      
      -- Call the brightdata-linkedin-enrichment edge function
      PERFORM net.http_post(
        url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/brightdata-linkedin-enrichment',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
        ),
        body := jsonb_build_object(
          'dealId', NEW.id::text,
          'companyName', NEW.company_name,
          'linkedinUrl', NEW.linkedin_url
        )
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
        'LinkedIn Enrichment Started',
        'Automatic LinkedIn enrichment triggered for new deal creation',
        jsonb_build_object(
          'linkedin_url', NEW.linkedin_url,
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

-- Create trigger for new deal LinkedIn enrichment
CREATE TRIGGER new_deal_linkedin_enrichment_trigger
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_deal_linkedin_enrichment();