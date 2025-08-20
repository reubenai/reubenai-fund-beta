-- Fix fund memory engine constraint violations by adding missing memory types
-- This will stop the 85,985+ excessive executions immediately

-- First, let's see the current constraint
-- ALTER TABLE fund_memory_entries DROP CONSTRAINT IF EXISTS fund_memory_entries_memory_type_check;

-- Add the missing memory types that are causing constraint violations
ALTER TABLE fund_memory_entries DROP CONSTRAINT IF EXISTS fund_memory_entries_memory_type_check;

ALTER TABLE fund_memory_entries ADD CONSTRAINT fund_memory_entries_memory_type_check 
CHECK (memory_type IN (
  'investment_decision', 
  'strategy_evolution', 
  'pattern_insight', 
  'performance_correlation', 
  'ai_service_result', 
  'user_feedback', 
  'market_intelligence',
  'enrichment_pack',
  'decision_context', 
  'decision_pattern',
  'contextual_memory',
  'fund_learning',
  'bias_detection',
  'outcome_validation'
));