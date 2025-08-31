-- Create trigger function for Crunchbase enrichment
CREATE OR REPLACE FUNCTION public.trigger_crunchbase_enrichment_on_deal_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process if crunchbase_url is provided
  IF NEW.crunchbase_url IS NOT NULL AND NEW.crunchbase_url != '' THEN
    -- Insert record into enrichment queue table
    INSERT INTO public.deal2_enrichment_crunchbase_export (
      deal_id,
      company_name,
      crunchbase_url,
      processing_status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.company_name,
      NEW.crunchbase_url,
      'queued',
      now(),
      now()
    ) ON CONFLICT (deal_id) 
    DO UPDATE SET
      company_name = EXCLUDED.company_name,
      crunchbase_url = EXCLUDED.crunchbase_url,
      processing_status = 'queued',
      updated_at = now();
      
    -- Log activity
    INSERT INTO public.activity_events (
      user_id,
      fund_id,
      deal_id,
      activity_type,
      title,
      description,
      context_data,
      priority,
      occurred_at
    ) VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      NEW.fund_id,
      NEW.id,
      'crunchbase_enrichment_queued',
      'Crunchbase Enrichment Queued',
      'Deal queued for Crunchbase data enrichment',
      jsonb_build_object(
        'company_name', NEW.company_name,
        'crunchbase_url', NEW.crunchbase_url,
        'trigger_source', 'deal_creation'
      ),
      'low',
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on deals table
DROP TRIGGER IF EXISTS deal_crunchbase_enrichment_trigger ON public.deals;
CREATE TRIGGER deal_crunchbase_enrichment_trigger
  AFTER INSERT OR UPDATE OF crunchbase_url ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_crunchbase_enrichment_on_deal_insert();