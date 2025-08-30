-- Create triggers to automatically queue enrichment jobs when enrichment records are created

-- Function to queue Crunchbase enrichment job
CREATE OR REPLACE FUNCTION queue_crunchbase_enrichment_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue job in job_queues using the new QueueManager system
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
  )
  ON CONFLICT (idempotency_key) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Function to queue LinkedIn profile enrichment job
CREATE OR REPLACE FUNCTION queue_linkedin_profile_enrichment_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue job in job_queues using the new QueueManager system
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
    'linkedin_profile_enrichment_queue',
    (SELECT f.organization_id FROM deals d JOIN funds f ON d.fund_id = f.id WHERE d.id = NEW.deal_id),
    'linkedin_profile_enrichment',
    'event',
    'enrichment_record_created',
    jsonb_build_object('deal_id', NEW.deal_id, 'enrichment_id', NEW.id),
    0,
    3,
    'linkedin_profile_enrichment:' || NEW.deal_id::text || ':' || NEW.id::text || ':' || CURRENT_DATE::text,
    jsonb_build_object(
      'enrichment_id', NEW.id,
      'deal_id', NEW.deal_id,
      'founder_name', NEW.founder_name,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name
    ),
    'queued',
    NOW(),
    NOW() + INTERVAL '30 minutes'
  )
  ON CONFLICT (idempotency_key) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create triggers for automatic job queuing
DROP TRIGGER IF EXISTS trigger_crunchbase_enrichment_job ON public.deal2_enrichment_crunchbase_export;
CREATE TRIGGER trigger_crunchbase_enrichment_job
  AFTER INSERT ON public.deal2_enrichment_crunchbase_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'queued')
  EXECUTE FUNCTION queue_crunchbase_enrichment_job();

DROP TRIGGER IF EXISTS trigger_linkedin_profile_enrichment_job ON public.deal2_enrichment_linkedin_profile_export;
CREATE TRIGGER trigger_linkedin_profile_enrichment_job
  AFTER INSERT ON public.deal2_enrichment_linkedin_profile_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'queued')
  EXECUTE FUNCTION queue_linkedin_profile_enrichment_job();