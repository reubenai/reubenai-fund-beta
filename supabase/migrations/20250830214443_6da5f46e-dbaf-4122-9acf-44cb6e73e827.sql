-- Fix trigger functions by removing ON CONFLICT clauses that reference non-unique idempotency_key

-- Update queue_crunchbase_enrichment_job function to remove ON CONFLICT
CREATE OR REPLACE FUNCTION public.queue_crunchbase_enrichment_job(p_deal_id uuid, p_company_name text, p_crunchbase_url text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  job_uuid uuid;
  tenant_uuid uuid;
BEGIN
  -- Get tenant_id (organization_id) from deal
  SELECT f.organization_id INTO tenant_uuid
  FROM deals d
  JOIN funds f ON f.id = d.fund_id
  WHERE d.id = p_deal_id;
  
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Could not find organization for deal %', p_deal_id;
  END IF;
  
  -- Generate job UUID
  job_uuid := gen_random_uuid();
  
  -- Insert job into queue (removed ON CONFLICT clause)
  INSERT INTO public.job_queues (
    job_id,
    queue_name,
    tenant_id,
    engine,
    source,
    trigger_reason,
    related_ids,
    retry_count,
    max_retries,
    idempotency_key,
    job_payload,
    status,
    scheduled_for,
    expires_at
  ) VALUES (
    job_uuid,
    'crunchbase_enrichment_queue',
    tenant_uuid,
    'crunchbase_enrichment',
    'trigger',
    'deal_created',
    jsonb_build_object('deal_id', p_deal_id),
    0,
    3,
    'crunchbase_enrichment:' || p_deal_id::text || ':' || CURRENT_DATE::text,
    jsonb_build_object(
      'deal_id', p_deal_id,
      'company_name', p_company_name,
      'crunchbase_url', p_crunchbase_url
    ),
    'queued',
    NOW(),
    NOW() + INTERVAL '30 minutes'
  );
  
  RETURN job_uuid;
END;
$function$;

-- Update queue_linkedin_profile_enrichment_job function to remove ON CONFLICT
CREATE OR REPLACE FUNCTION public.queue_linkedin_profile_enrichment_job(p_deal_id uuid, p_founder_name text, p_first_name text DEFAULT NULL, p_last_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  job_uuid uuid;
  tenant_uuid uuid;
BEGIN
  -- Get tenant_id (organization_id) from deal
  SELECT f.organization_id INTO tenant_uuid
  FROM deals d
  JOIN funds f ON f.id = d.fund_id
  WHERE d.id = p_deal_id;
  
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Could not find organization for deal %', p_deal_id;
  END IF;
  
  -- Generate job UUID
  job_uuid := gen_random_uuid();
  
  -- Insert job into queue (removed ON CONFLICT clause)
  INSERT INTO public.job_queues (
    job_id,
    queue_name,
    tenant_id,
    engine,
    source,
    trigger_reason,
    related_ids,
    retry_count,
    max_retries,
    idempotency_key,
    job_payload,
    status,
    scheduled_for,
    expires_at
  ) VALUES (
    job_uuid,
    'linkedin_profile_enrichment_queue',
    tenant_uuid,
    'linkedin_profile_enrichment',
    'trigger',
    'deal_created',
    jsonb_build_object('deal_id', p_deal_id),
    0,
    3,
    'linkedin_profile_enrichment:' || p_deal_id::text || ':' || CURRENT_DATE::text,
    jsonb_build_object(
      'deal_id', p_deal_id,
      'founder_name', p_founder_name,
      'first_name', p_first_name,
      'last_name', p_last_name
    ),
    'queued',
    NOW(),
    NOW() + INTERVAL '30 minutes'
  );
  
  RETURN job_uuid;
END;
$function$;