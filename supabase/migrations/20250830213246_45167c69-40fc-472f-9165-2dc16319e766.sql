-- Queue existing Crunchbase enrichment records that are stuck in 'queued' status
-- This will trigger automatic processing for records like s_meylpk0a1485qp2m55

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
)
SELECT 
  gen_random_uuid(),
  'crunchbase_enrichment_queue',
  f.organization_id,
  'crunchbase_enrichment',
  'migration',
  'backfill_existing_records',
  jsonb_build_object('deal_id', cbe.deal_id, 'enrichment_id', cbe.id),
  0,
  3,
  'crunchbase_enrichment:' || cbe.deal_id::text || ':' || cbe.id::text || ':backfill:' || CURRENT_DATE::text,
  jsonb_build_object(
    'enrichment_id', cbe.id,
    'deal_id', cbe.deal_id,
    'company_name', cbe.company_name,
    'crunchbase_url', cbe.crunchbase_url
  ),
  'queued',
  NOW(),
  NOW() + INTERVAL '30 minutes'
FROM public.deal2_enrichment_crunchbase_export cbe
JOIN public.deals d ON d.id = cbe.deal_id
JOIN public.funds f ON f.id = d.fund_id
WHERE cbe.processing_status = 'queued'
  AND NOT EXISTS (
    SELECT 1 FROM public.job_queues jq 
    WHERE jq.engine = 'crunchbase_enrichment' 
    AND jq.related_ids->>'enrichment_id' = cbe.id::text
  )
ON CONFLICT (idempotency_key) DO NOTHING;

-- Queue existing LinkedIn profile enrichment records that are stuck in 'queued' status
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
)
SELECT 
  gen_random_uuid(),
  'linkedin_profile_enrichment_queue',
  f.organization_id,
  'linkedin_profile_enrichment',
  'migration',
  'backfill_existing_records',
  jsonb_build_object('deal_id', lpe.deal_id, 'enrichment_id', lpe.id),
  0,
  3,
  'linkedin_profile_enrichment:' || lpe.deal_id::text || ':' || lpe.id::text || ':backfill:' || CURRENT_DATE::text,
  jsonb_build_object(
    'enrichment_id', lpe.id,
    'deal_id', lpe.deal_id,
    'founder_name', lpe.founder_name,
    'first_name', lpe.first_name,
    'last_name', lpe.last_name
  ),
  'queued',
  NOW(),
  NOW() + INTERVAL '30 minutes'
FROM public.deal2_enrichment_linkedin_profile_export lpe
JOIN public.deals d ON d.id = lpe.deal_id
JOIN public.funds f ON f.id = d.fund_id
WHERE lpe.processing_status = 'queued'
  AND NOT EXISTS (
    SELECT 1 FROM public.job_queues jq 
    WHERE jq.engine = 'linkedin_profile_enrichment' 
    AND jq.related_ids->>'enrichment_id' = lpe.id::text
  )
ON CONFLICT (idempotency_key) DO NOTHING;