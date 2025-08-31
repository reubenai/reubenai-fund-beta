-- Clean up: Drop all individual enrichment source triggers
-- Crunchbase triggers
DROP TRIGGER IF EXISTS trigger_vc_aggregation_crunchbase ON public.deal2_enrichment_crunchbase_export;
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_crunchbase ON public.deal2_enrichment_crunchbase_export;
DROP TRIGGER IF EXISTS trigger_vc_data_aggregation_crunchbase ON public.deal2_enrichment_crunchbase_export;

-- LinkedIn triggers
DROP TRIGGER IF EXISTS trigger_vc_aggregation_linkedin ON public.deal2_enrichment_linkedin_export;
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_linkedin ON public.deal2_enrichment_linkedin_export;
DROP TRIGGER IF EXISTS trigger_vc_data_aggregation_linkedin ON public.deal2_enrichment_linkedin_export;

-- LinkedIn Profile triggers
DROP TRIGGER IF EXISTS trigger_vc_aggregation_linkedin_profile ON public.deal2_enrichment_linkedin_profile_export;
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_linkedin_profile ON public.deal2_enrichment_linkedin_profile_export;
DROP TRIGGER IF EXISTS trigger_vc_data_aggregation_linkedin_profile ON public.deal2_enrichment_linkedin_profile_export;

-- Perplexity Company triggers
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_perplexity_company ON public.deal2_enrichment_perplexity_company_export_vc_duplicate;
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_perplexity_processed ON public.deal2_enrichment_perplexity_company_export_vc_duplicate;
DROP TRIGGER IF EXISTS trigger_vc_aggregation_perplexity_company ON public.deal2_enrichment_perplexity_company_export_vc_duplicate;
DROP TRIGGER IF EXISTS trigger_vc_data_aggregation_perplexity_company_vc ON public.deal2_enrichment_perplexity_company_export_vc_duplicate;

-- Perplexity Founder triggers
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_perplexity_founder ON public.deal2_enrichment_perplexity_founder_export_vc_duplicate;
DROP TRIGGER IF EXISTS trigger_vc_aggregation_perplexity_founder ON public.deal2_enrichment_perplexity_founder_export_vc_duplicate;
DROP TRIGGER IF EXISTS trigger_vc_data_aggregation_perplexity_founder_vc ON public.deal2_enrichment_perplexity_founder_export_vc_duplicate;

-- Perplexity Market triggers
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_perplexity_market ON public.deal2_enrichment_perplexity_market_export_vc_duplicate;

-- Deal creation triggers
DROP TRIGGER IF EXISTS trigger_delayed_vc_aggregation_on_deal_creation ON public.deals;
DROP TRIGGER IF EXISTS trigger_immediate_vc_aggregation_on_analysis ON public.deals;

-- Keep only the main real-time UPDATE trigger on deal_analysis_datapoints_vc
-- (trigger_vc_aggregation_on_enrichment_update is already created and working)

-- Add a comment to document the simplified trigger architecture
COMMENT ON TRIGGER trigger_vc_aggregation_on_enrichment_update ON public.deal_analysis_datapoints_vc 
IS 'Single real-time UPDATE trigger for vc-data-aggregator - triggers when any enrichment JSON field changes in deal_analysis_datapoints_vc';