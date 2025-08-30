-- Remove old waterfall processing system components

-- Drop the old trigger on deals table
DROP TRIGGER IF EXISTS trigger_waterfall_processing_on_deal_creation ON public.deals;

-- Drop the queue_waterfall_processing function
DROP FUNCTION IF EXISTS public.queue_waterfall_processing();

-- Drop the engine_completion_tracking table (no longer needed)
DROP TABLE IF EXISTS public.engine_completion_tracking;