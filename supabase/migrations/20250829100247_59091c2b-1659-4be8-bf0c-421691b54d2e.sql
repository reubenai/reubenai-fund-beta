-- Fix the queue_waterfall_processing function to properly get fund_type from funds table
CREATE OR REPLACE FUNCTION public.queue_waterfall_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  fund_type_value text;
BEGIN
  -- Get fund_type from funds table using the fund_id
  SELECT fund_type::text INTO fund_type_value
  FROM public.funds 
  WHERE id = NEW.fund_id;
  
  -- If fund not found, use default value
  IF fund_type_value IS NULL THEN
    fund_type_value := 'venture_capital';
  END IF;
  
  -- Create engine completion tracking record
  INSERT INTO public.engine_completion_tracking (
    deal_id,
    fund_id,
    organization_id,
    fund_type,
    active_engines,
    timeout_at
  ) VALUES (
    NEW.id,
    NEW.fund_id,
    NEW.organization_id,
    fund_type_value,
    ARRAY['documents', 'crunchbase', 'linkedin_profile', 'linkedin_export', 'perplexity_company', 'perplexity_founder', 'perplexity_market'],
    now() + interval '5 minutes'
  );
  
  -- Queue analysis with waterfall processing flag
  PERFORM public.queue_deal_analysis(
    NEW.id,
    'waterfall_processing',
    'high',
    2 -- 2 minute delay
  );
  
  RETURN NEW;
END;
$function$;