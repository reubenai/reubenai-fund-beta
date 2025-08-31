-- Create trigger function for VC data aggregation
CREATE OR REPLACE FUNCTION public.trigger_vc_data_aggregation()
RETURNS TRIGGER AS $$
DECLARE
  target_deal_id uuid;
BEGIN
  -- Determine deal_id based on which table triggered this
  IF TG_TABLE_NAME = 'deal_analysis_datapoints_vc' THEN
    target_deal_id := NEW.deal_id;
  ELSE
    target_deal_id := NEW.deal_id;
  END IF;
  
  -- Log the trigger
  RAISE LOG 'VC Data Aggregation triggered for deal_id: % from table: %', target_deal_id, TG_TABLE_NAME;
  
  -- Call the VC data aggregator edge function asynchronously
  PERFORM
    net.http_post(
      url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/vc-data-aggregator',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('deal_id', target_deal_id)
    );
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the main operation
    RAISE LOG 'VC Data Aggregation trigger failed for deal_id: %. Error: %', target_deal_id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for all specified tables/columns

-- Trigger for documents_data_points_vc updates
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_documents ON deal_analysis_datapoints_vc;
CREATE TRIGGER trigger_vc_aggregation_on_documents
  AFTER UPDATE OF documents_data_points_vc ON deal_analysis_datapoints_vc
  FOR EACH ROW
  WHEN (OLD.documents_data_points_vc IS DISTINCT FROM NEW.documents_data_points_vc)
  EXECUTE FUNCTION trigger_vc_data_aggregation();

-- Trigger for Crunchbase export
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_crunchbase ON deal2_enrichment_crunchbase_export;
CREATE TRIGGER trigger_vc_aggregation_on_crunchbase
  AFTER INSERT OR UPDATE ON deal2_enrichment_crunchbase_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND NEW.raw_brightdata_response IS NOT NULL)
  EXECUTE FUNCTION trigger_vc_data_aggregation();

-- Trigger for LinkedIn export
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_linkedin ON deal2_enrichment_linkedin_export;
CREATE TRIGGER trigger_vc_aggregation_on_linkedin
  AFTER INSERT OR UPDATE ON deal2_enrichment_linkedin_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND NEW.raw_brightdata_response IS NOT NULL)
  EXECUTE FUNCTION trigger_vc_data_aggregation();

-- Trigger for LinkedIn profile export
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_linkedin_profile ON deal2_enrichment_linkedin_profile_export;
CREATE TRIGGER trigger_vc_aggregation_on_linkedin_profile
  AFTER INSERT OR UPDATE ON deal2_enrichment_linkedin_profile_export
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND NEW.raw_brightdata_response IS NOT NULL)
  EXECUTE FUNCTION trigger_vc_data_aggregation();

-- Trigger for Perplexity company export
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_perplexity_company ON deal2_enrichment_perplexity_company_export_vc;
CREATE TRIGGER trigger_vc_aggregation_on_perplexity_company
  AFTER INSERT OR UPDATE ON deal2_enrichment_perplexity_company_export_vc
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND NEW.raw_perplexity_response IS NOT NULL)
  EXECUTE FUNCTION trigger_vc_data_aggregation();

-- Trigger for Perplexity founder export
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_perplexity_founder ON deal2_enrichment_perplexity_founder_export_vc;
CREATE TRIGGER trigger_vc_aggregation_on_perplexity_founder
  AFTER INSERT OR UPDATE ON deal2_enrichment_perplexity_founder_export_vc
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND NEW.raw_perplexity_response IS NOT NULL)
  EXECUTE FUNCTION trigger_vc_data_aggregation();

-- Trigger for Perplexity market export
DROP TRIGGER IF EXISTS trigger_vc_aggregation_on_perplexity_market ON deal2_enrichment_perplexity_market_export_vc;
CREATE TRIGGER trigger_vc_aggregation_on_perplexity_market
  AFTER INSERT OR UPDATE ON deal2_enrichment_perplexity_market_export_vc
  FOR EACH ROW
  WHEN (NEW.processing_status = 'completed' AND NEW.raw_perplexity_response IS NOT NULL)
  EXECUTE FUNCTION trigger_vc_data_aggregation();

-- Test the aggregation with Luwjistik deal manually
-- This will demonstrate the system working
DO $$
DECLARE
  luwjistik_deal_id uuid := 'e6f5c319-0e8e-48df-8169-7c67b20cbb3c';
BEGIN
  RAISE LOG 'Testing VC data aggregation for Luwjistik deal: %', luwjistik_deal_id;
  
  -- Trigger aggregation by calling the function directly
  PERFORM
    net.http_post(
      url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/vc-data-aggregator',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('deal_id', luwjistik_deal_id)
    );
    
  RAISE LOG 'Test aggregation request sent for Luwjistik deal';
END $$;