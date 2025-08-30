-- Drop the older duplicate LinkedIn enrichment trigger
-- The older trigger 'new_deal_linkedin_enrichment_trigger' was created in migration 20250830130437
-- The newer trigger 'trigger_new_deal_linkedin_enrichment_trigger' was created in migration 20250830133312
-- Both call the same function, so we're removing the older one to eliminate the duplicate

DROP TRIGGER IF EXISTS new_deal_linkedin_enrichment_trigger ON public.deals;