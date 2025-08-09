-- Nuclear Cleanup: Delete all deals and related data for fresh start
-- This will give us a clean slate to re-upload deals with fixed edge functions

-- Step 1: Stop all processing by clearing the analysis queue
DELETE FROM public.analysis_queue;

-- Step 2: Delete all deal-related activity events
DELETE FROM public.activity_events WHERE deal_id IS NOT NULL;

-- Step 3: Delete all deal-related fund memory entries
DELETE FROM public.fund_memory_entries WHERE deal_id IS NOT NULL;

-- Step 4: Delete all deal analysis sources
DELETE FROM public.deal_analysis_sources;

-- Step 5: Delete all deals (this will cascade to delete deal_analyses, deal_notes, deal_documents)
DELETE FROM public.deals;

-- Step 6: Clean up any orphaned records that might exist
DELETE FROM public.deal_decisions WHERE deal_id NOT IN (SELECT id FROM public.deals);
DELETE FROM public.ai_human_decision_divergence WHERE deal_id NOT IN (SELECT id FROM public.deals);

-- Step 7: Reset queue health metrics to start fresh
DELETE FROM public.queue_health_metrics;