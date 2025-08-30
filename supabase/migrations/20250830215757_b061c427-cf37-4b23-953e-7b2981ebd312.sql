-- Fix the trigger version of queue_crunchbase_enrichment_job function by removing ON CONFLICT
CREATE OR REPLACE FUNCTION public.queue_crunchbase_enrichment_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Queue job in job_queues using the new QueueManager system (removed ON CONFLICT clause)
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
    gen_random_uuid(),
    'crunchbase_enrichment_queue',
    (SELECT f.organization_id FROM deals d JOIN funds f ON d.fund_id = f.id WHERE d.id = NEW.deal_id),
    'crunchbase_enrichment',
    'event',
    'enrichment_record_created',
    jsonb_build_object('deal_id', NEW.deal_id, 'enrichment_id', NEW.id),
    0,
    3,
    'crunchbase_enrichment:' || NEW.deal_id::text || ':' || NEW.id::text || ':' || CURRENT_DATE::text,
    jsonb_build_object(
      'enrichment_id', NEW.id,
      'deal_id', NEW.deal_id,
      'company_name', NEW.company_name,
      'crunchbase_url', NEW.crunchbase_url
    ),
    'queued',
    NOW(),
    NOW() + INTERVAL '30 minutes'
  );
  
  RETURN NEW;
END;
$function$;