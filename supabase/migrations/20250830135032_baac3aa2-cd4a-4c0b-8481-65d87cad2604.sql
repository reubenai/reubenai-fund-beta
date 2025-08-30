-- Drop the older duplicate founder profile enrichment trigger
-- The older trigger 'new_deal_founder_profile_enrichment_trigger' was created in migration 20250830131014
-- The newer trigger 'trigger_new_deal_founder_profile_enrichment_trigger' was created in migration 20250830133312
-- Both call the same function, so we're removing the older one to eliminate the duplicate

DROP TRIGGER IF EXISTS new_deal_founder_profile_enrichment_trigger ON public.deals;