-- Remove queue_crunchbase_enrichment_job functions entirely to test deal creation
-- First drop the dependent trigger, then the functions

-- Drop the specific trigger that depends on the function
DROP TRIGGER IF EXISTS trigger_crunchbase_enrichment_job ON public.deal2_enrichment_crunchbase_export;

-- Drop both versions of the function (trigger version and parameterized version)
DROP FUNCTION IF EXISTS public.queue_crunchbase_enrichment_job();
DROP FUNCTION IF EXISTS public.queue_crunchbase_enrichment_job(uuid, text, text);

-- Also drop any other potential triggers
DROP TRIGGER IF EXISTS queue_crunchbase_enrichment_on_deal_insert ON public.deals;
DROP TRIGGER IF EXISTS queue_crunchbase_enrichment_on_enrichment_insert ON public.deal2_enrichment_crunchbase_export;