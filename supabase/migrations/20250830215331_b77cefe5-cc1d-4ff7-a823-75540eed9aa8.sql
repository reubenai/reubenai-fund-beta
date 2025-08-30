-- Remove queue_linkedin_profile_enrichment_job function to test deal creation

-- Drop the function entirely
DROP FUNCTION IF EXISTS public.queue_linkedin_profile_enrichment_job(uuid, text, text, text);

-- Also drop any triggers that might call this function
-- Check for triggers on deals table that might reference linkedin enrichment
DROP TRIGGER IF EXISTS queue_linkedin_profile_enrichment_on_deal_insert ON public.deals;