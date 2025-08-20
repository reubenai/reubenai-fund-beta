-- Disable the LinkedIn enrichment trigger temporarily to fix deal saves
DROP TRIGGER IF EXISTS deals_linkedin_url_change ON public.deals;

-- Fix the is_deal_safe_to_edit function parameter naming
CREATE OR REPLACE FUNCTION public.is_deal_safe_to_edit(deal_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  queue_count integer;
  analysis_count integer;
BEGIN
  -- Check if deal is currently in analysis queue
  SELECT COUNT(*) INTO queue_count
  FROM public.analysis_queue 
  WHERE deal_id = deal_id_param 
    AND status IN ('queued', 'processing');
  
  -- Check if deal analysis is currently running
  SELECT COUNT(*) INTO analysis_count
  FROM public.deal_analyses 
  WHERE deal_id = deal_id_param 
    AND updated_at > now() - interval '5 minutes';
  
  -- Deal is safe to edit if not in queue and no recent analysis
  RETURN (queue_count = 0 AND analysis_count = 0);
END;
$function$;

-- Check what activity_type enum values are actually allowed
DO $$
BEGIN
  -- Add missing activity types if they don't exist
  BEGIN
    ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'linkedin_enrichment_triggered';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'analysis_triggered';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;