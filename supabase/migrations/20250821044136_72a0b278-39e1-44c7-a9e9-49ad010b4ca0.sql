-- EMERGENCY DATABASE SHUTDOWN FOR KERNEL AND ASTRO DEALS
-- Block ALL writes (INSERT/UPDATE/DELETE) for deal IDs:
-- 7ac26a5f-34c9-4d30-b09c-c05d1d1df81d (Kernel)
-- 98c22f44-87c7-4808-be1c-31929c3da52f (Astro)

-- Emergency RLS Policy for deal_analysis_sources - BLOCK ALL WRITES
DROP POLICY IF EXISTS "EMERGENCY_BLOCK_SOURCES_KERNEL_ASTRO" ON deal_analysis_sources;
CREATE POLICY "EMERGENCY_BLOCK_SOURCES_KERNEL_ASTRO" ON deal_analysis_sources
FOR ALL 
USING (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'))
WITH CHECK (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'));

-- Emergency RLS Policy for artifacts - BLOCK ALL WRITES  
DROP POLICY IF EXISTS "EMERGENCY_BLOCK_ARTIFACTS_KERNEL_ASTRO" ON artifacts;
CREATE POLICY "EMERGENCY_BLOCK_ARTIFACTS_KERNEL_ASTRO" ON artifacts
FOR ALL
USING (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'))
WITH CHECK (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'));

-- Emergency RLS Policy for deal_analyses - BLOCK ALL WRITES
DROP POLICY IF EXISTS "EMERGENCY_BLOCK_ANALYSES_KERNEL_ASTRO" ON deal_analyses;
CREATE POLICY "EMERGENCY_BLOCK_ANALYSES_KERNEL_ASTRO" ON deal_analyses  
FOR ALL
USING (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'))
WITH CHECK (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'));

-- Emergency RLS Policy for deal_features - BLOCK ALL WRITES
DROP POLICY IF EXISTS "EMERGENCY_BLOCK_FEATURES_KERNEL_ASTRO" ON deal_features;
CREATE POLICY "EMERGENCY_BLOCK_FEATURES_KERNEL_ASTRO" ON deal_features
FOR ALL  
USING (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'))
WITH CHECK (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'));

-- Emergency RLS Policy for deal_scores - BLOCK ALL WRITES
DROP POLICY IF EXISTS "EMERGENCY_BLOCK_SCORES_KERNEL_ASTRO" ON deal_scores;
CREATE POLICY "EMERGENCY_BLOCK_SCORES_KERNEL_ASTRO" ON deal_scores
FOR ALL
USING (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f')) 
WITH CHECK (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'));

-- Emergency RLS Policy for analysis_queue - BLOCK ALL WRITES
DROP POLICY IF EXISTS "EMERGENCY_BLOCK_QUEUE_KERNEL_ASTRO" ON analysis_queue;
CREATE POLICY "EMERGENCY_BLOCK_QUEUE_KERNEL_ASTRO" ON analysis_queue
FOR ALL
USING (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'))
WITH CHECK (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'));

-- Emergency RLS Policy for ai_service_interactions - BLOCK ALL WRITES
DROP POLICY IF EXISTS "EMERGENCY_BLOCK_AI_INTERACTIONS_KERNEL_ASTRO" ON ai_service_interactions;
CREATE POLICY "EMERGENCY_BLOCK_AI_INTERACTIONS_KERNEL_ASTRO" ON ai_service_interactions  
FOR ALL
USING (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'))
WITH CHECK (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'));

-- Emergency RLS Policy for analysis_execution_log - BLOCK ALL WRITES  
DROP POLICY IF EXISTS "EMERGENCY_BLOCK_EXECUTION_LOG_KERNEL_ASTRO" ON analysis_execution_log;
CREATE POLICY "EMERGENCY_BLOCK_EXECUTION_LOG_KERNEL_ASTRO" ON analysis_execution_log
FOR ALL
USING (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'))
WITH CHECK (deal_id NOT IN ('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'));

-- Log the emergency shutdown activation
INSERT INTO analysis_execution_log (
  deal_id,
  fund_id, 
  execution_type,
  stage_name,
  status,
  metadata,
  started_at,
  completed_at
) VALUES 
('7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', (SELECT fund_id FROM deals WHERE id = '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d'), 'emergency_shutdown', 'database_firewall', 'completed', 
 '{"emergency_type": "database_rls_shutdown", "reason": "excessive_analysis_activity", "timestamp": "'||now()||'", "affected_tables": ["deal_analysis_sources", "artifacts", "deal_analyses", "deal_features", "deal_scores", "analysis_queue", "ai_service_interactions", "analysis_execution_log"]}', 
 now(), now()),
('98c22f44-87c7-4808-be1c-31929c3da52f', (SELECT fund_id FROM deals WHERE id = '98c22f44-87c7-4808-be1c-31929c3da52f'), 'emergency_shutdown', 'database_firewall', 'completed',
 '{"emergency_type": "database_rls_shutdown", "reason": "excessive_analysis_activity", "timestamp": "'||now()||'", "affected_tables": ["deal_analysis_sources", "artifacts", "deal_analyses", "deal_features", "deal_scores", "analysis_queue", "ai_service_interactions", "analysis_execution_log"]}',
 now(), now());

-- Add comment for future reference
COMMENT ON POLICY "EMERGENCY_BLOCK_SOURCES_KERNEL_ASTRO" ON deal_analysis_sources IS 'EMERGENCY POLICY: Blocks all writes for Kernel (7ac26a5f...) and Astro (98c22f44...) deals due to excessive analysis activity. Remove when safe.';
COMMENT ON POLICY "EMERGENCY_BLOCK_ARTIFACTS_KERNEL_ASTRO" ON artifacts IS 'EMERGENCY POLICY: Blocks all writes for Kernel (7ac26a5f...) and Astro (98c22f44...) deals due to excessive analysis activity. Remove when safe.';
COMMENT ON POLICY "EMERGENCY_BLOCK_ANALYSES_KERNEL_ASTRO" ON deal_analyses IS 'EMERGENCY POLICY: Blocks all writes for Kernel (7ac26a5f...) and Astro (98c22f44...) deals due to excessive analysis activity. Remove when safe.';
COMMENT ON POLICY "EMERGENCY_BLOCK_FEATURES_KERNEL_ASTRO" ON deal_features IS 'EMERGENCY POLICY: Blocks all writes for Kernel (7ac26a5f...) and Astro (98c22f44...) deals due to excessive analysis activity. Remove when safe.';
COMMENT ON POLICY "EMERGENCY_BLOCK_SCORES_KERNEL_ASTRO" ON deal_scores IS 'EMERGENCY POLICY: Blocks all writes for Kernel (7ac26a5f...) and Astro (98c22f44...) deals due to excessive analysis activity. Remove when safe.';
COMMENT ON POLICY "EMERGENCY_BLOCK_QUEUE_KERNEL_ASTRO" ON analysis_queue IS 'EMERGENCY POLICY: Blocks all writes for Kernel (7ac26a5f...) and Astro (98c22f44...) deals due to excessive analysis activity. Remove when safe.';
COMMENT ON POLICY "EMERGENCY_BLOCK_AI_INTERACTIONS_KERNEL_ASTRO" ON ai_service_interactions IS 'EMERGENCY POLICY: Blocks all writes for Kernel (7ac26a5f...) and Astro (98c22f44...) deals due to excessive analysis activity. Remove when safe.';
COMMENT ON POLICY "EMERGENCY_BLOCK_EXECUTION_LOG_KERNEL_ASTRO" ON analysis_execution_log IS 'EMERGENCY POLICY: Blocks all writes for Kernel (7ac26a5f...) and Astro (98c22f44...) deals due to excessive analysis activity. Remove when safe.';