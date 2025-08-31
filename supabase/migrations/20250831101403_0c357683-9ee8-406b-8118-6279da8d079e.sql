-- Add missing partial unique constraint for analysis queue duplicate prevention
ALTER TABLE public.analysis_queue 
ADD CONSTRAINT unique_active_deal_trigger 
UNIQUE (deal_id, trigger_reason) 
WHERE status IN ('queued', 'processing');