-- Add partial unique index for analysis queue duplicate prevention
-- This prevents duplicate active queue entries for the same deal and trigger reason
CREATE UNIQUE INDEX idx_analysis_queue_unique_active_deal_trigger 
ON public.analysis_queue (deal_id, trigger_reason) 
WHERE status IN ('queued', 'processing');