-- Mark all engines as completed for the two problematic deals
-- This creates fake "completed" entries to stop all analysis engines

-- First, delete any existing records for these engines to avoid duplicates
DELETE FROM deal_analysis_sources 
WHERE deal_id IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f')
AND engine_name IN (
  'team-research-engine',
  'product-ip-engine', 
  'market-intelligence-engine',
  'financial-engine',
  'thesis-alignment-engine',
  'vc-industry-enrichment',
  'vc-stage-enrichment', 
  'vc-geography-enrichment',
  'vc-technology-enrichment',
  'vc-business-model-enrichment',
  'enhanced-deal-analysis',
  'safe-mode-analysis',
  'document-processor'
);

-- Define the engine types and blocked deals
WITH engine_types AS (
  SELECT unnest(ARRAY[
    'team-research-engine',
    'product-ip-engine', 
    'market-intelligence-engine',
    'financial-engine',
    'thesis-alignment-engine',
    'vc-industry-enrichment',
    'vc-stage-enrichment', 
    'vc-geography-enrichment',
    'vc-technology-enrichment',
    'vc-business-model-enrichment',
    'enhanced-deal-analysis',
    'safe-mode-analysis',
    'document-processor'
  ]) AS engine_name
),
blocked_deals AS (
  SELECT unnest(ARRAY[
    '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d'::uuid,
    '98c22f44-87c7-4808-be1c-31929c3da52f'::uuid
  ]) AS deal_id
)

-- Insert fake completed analysis records for all engine/deal combinations
INSERT INTO deal_analysis_sources (
  deal_id,
  engine_name,
  source_type,
  data_retrieved,
  confidence_score,
  validated,
  created_at,
  retrieved_at,
  data_snippet,
  validation_notes
)
SELECT 
  bd.deal_id,
  et.engine_name,
  'emergency_completion',
  jsonb_build_object(
    'status', 'emergency_completed',
    'message', 'Analysis marked as completed via emergency shutdown',
    'timestamp', now(),
    'reason', 'Excessive analysis activity - marked complete to prevent re-analysis'
  ),
  100, -- Max confidence to ensure it's not re-analyzed
  true,
  now(),
  now(),
  'Emergency completion - analysis blocked',
  'Marked as completed via emergency shutdown to prevent excessive re-analysis'
FROM blocked_deals bd
CROSS JOIN engine_types et;