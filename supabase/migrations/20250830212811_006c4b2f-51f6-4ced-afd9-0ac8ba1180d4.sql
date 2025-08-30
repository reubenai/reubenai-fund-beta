-- Register Crunchbase and LinkedIn enrichment engines
INSERT INTO public.engine_registry (
  engine_id,
  queue_name,
  max_concurrency,
  job_ttl_minutes,
  enabled,
  feature_flag
) VALUES 
(
  'crunchbase_enrichment',
  'crunchbase_enrichment_queue',
  2,
  30,
  true,
  'enable_crunchbase_enrichment'
),
(
  'linkedin_profile_enrichment',
  'linkedin_profile_enrichment_queue',
  2,
  30,
  true,
  'enable_linkedin_profile_enrichment'
)
ON CONFLICT (engine_id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  max_concurrency = EXCLUDED.max_concurrency,
  job_ttl_minutes = EXCLUDED.job_ttl_minutes,
  updated_at = now();