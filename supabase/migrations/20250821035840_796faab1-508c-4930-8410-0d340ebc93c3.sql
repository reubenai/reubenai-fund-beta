-- Delete all related data for Kernel and Astro deals first (due to foreign key constraints)

-- Delete from deal_analyses
DELETE FROM public.deal_analyses WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from deal_documents
DELETE FROM public.deal_documents WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from deal_notes
DELETE FROM public.deal_notes WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from analysis_queue
DELETE FROM public.analysis_queue WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from analysis_queue_metrics
DELETE FROM public.analysis_queue_metrics WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from deal_analysis_sources
DELETE FROM public.deal_analysis_sources WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from deal_analysis_catalysts
DELETE FROM public.deal_analysis_catalysts WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from deal_decisions
DELETE FROM public.deal_decisions WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from deal_enrichment_linkedin_export
DELETE FROM public.deal_enrichment_linkedin_export WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from artifacts
DELETE FROM public.artifacts WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from deal_features
DELETE FROM public.deal_features WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from deal_scores
DELETE FROM public.deal_scores WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from analysis_cost_tracking
DELETE FROM public.analysis_cost_tracking WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from analysis_execution_log
DELETE FROM public.analysis_execution_log WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from analysis_quality_monitor
DELETE FROM public.analysis_quality_monitor WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from ai_human_decision_divergence
DELETE FROM public.ai_human_decision_divergence WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from ai_service_interactions
DELETE FROM public.ai_service_interactions WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from ai_service_performance
DELETE FROM public.ai_service_performance WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from activity_events
DELETE FROM public.activity_events WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from archived_activity_events
DELETE FROM public.archived_activity_events WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Delete from data_lineage_log
DELETE FROM public.data_lineage_log WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Remove from emergency blacklist if exists
DELETE FROM public.emergency_deal_blacklist WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Remove from analysis allowlist if exists
DELETE FROM public.analysis_allowlist WHERE deal_id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Finally, delete the deals themselves
DELETE FROM public.deals WHERE id IN (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  '98c22f44-87c7-4808-be1c-31929c3da52f'
);

-- Log the deletion action
INSERT INTO public.activity_events (
  user_id,
  fund_id,
  activity_type,
  title,
  description,
  context_data,
  priority
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid, -- System/Admin user
  '550e8400-e29b-41d4-a716-446655440000'::uuid, -- Default fund for system actions
  'deal_deleted',
  'Problematic Deals Deleted',
  'Kernel and Astro deals have been completely removed from the system to prevent automated analysis runs',
  jsonb_build_object(
    'deleted_deal_ids', ARRAY['7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'],
    'deal_names', ARRAY['Kernel', 'Astro'],
    'reason', 'Emergency deletion to block automated analysis runs',
    'admin_action', true
  ),
  'high'::activity_priority
);