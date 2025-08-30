-- Create trigger function for new deal founder profile enrichment
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
BEGIN
  -- Only trigger if the new deal has a founder name
  IF NEW.founder IS NOT NULL AND NEW.founder != '' THEN
    founder_name := trim(NEW.founder);
    
    -- Split founder name into first and last name
    -- Split by spaces and take first word as firstName, rest as lastName
    name_parts := string_to_array(founder_name, ' ');
    
    IF array_length(name_parts, 1) >= 2 THEN
      first_name := name_parts[1];
      -- Join remaining parts as last name
      last_name := array_to_string(name_parts[2:array_length(name_parts, 1)], ' ');
      
      -- Validate we have both first and last name
      IF first_name != '' AND last_name != '' THEN
        
        -- Call the brightdata-linkedin-profile-enrichment edge function
        PERFORM net.http_post(
          url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/brightdata-linkedin-profile-enrichment',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
          ),
          body := jsonb_build_object(
            'dealId', NEW.id::text,
            'firstName', first_name,
            'lastName', last_name
          )
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
          'Founder Profile Enrichment Started',
          'Automatic founder profile enrichment triggered for new deal creation',
          jsonb_build_object(
            'founder_name', founder_name,
            'first_name', first_name,
            'last_name', last_name,
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

-- Create trigger for new deal founder profile enrichment
CREATE TRIGGER new_deal_founder_profile_enrichment_trigger
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_deal_founder_profile_enrichment();