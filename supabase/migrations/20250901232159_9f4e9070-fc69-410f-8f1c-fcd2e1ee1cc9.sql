-- Update deal_analysisresult_vc table schema
-- Change all score columns from INTEGER to DECIMAL(4,1) for precise scoring
-- Add new summary columns for detailed analysis

ALTER TABLE public.deal_analysisresult_vc 
  ALTER COLUMN founder_experience_score TYPE DECIMAL(4,1),
  ALTER COLUMN team_composition_score TYPE DECIMAL(4,1),
  ALTER COLUMN vision_communication_score TYPE DECIMAL(4,1),
  ALTER COLUMN market_size_score TYPE DECIMAL(4,1),
  ALTER COLUMN market_timing_score TYPE DECIMAL(4,1),
  ALTER COLUMN competitive_landscape_score TYPE DECIMAL(4,1),
  ALTER COLUMN product_innovation_score TYPE DECIMAL(4,1),
  ALTER COLUMN technology_advantage_score TYPE DECIMAL(4,1),
  ALTER COLUMN product_market_fit_score TYPE DECIMAL(4,1),
  ALTER COLUMN revenue_growth_score TYPE DECIMAL(4,1),
  ALTER COLUMN customer_metrics_score TYPE DECIMAL(4,1),
  ALTER COLUMN market_validation_score TYPE DECIMAL(4,1),
  ALTER COLUMN financial_performance_score TYPE DECIMAL(4,1),
  ALTER COLUMN capital_efficiency_score TYPE DECIMAL(4,1),
  ALTER COLUMN financial_planning_score TYPE DECIMAL(4,1),
  ALTER COLUMN portfolio_synergies_score TYPE DECIMAL(4,1),
  ALTER COLUMN investment_thesis_alignment_score TYPE DECIMAL(4,1),
  ALTER COLUMN value_creation_potential_score TYPE DECIMAL(4,1);

-- Add new summary columns
ALTER TABLE public.deal_analysisresult_vc 
  ADD COLUMN deal_executive_summary TEXT,
  ADD COLUMN team_leadership_summary TEXT,
  ADD COLUMN market_opportunity_summary TEXT,
  ADD COLUMN product_technology_summary TEXT,
  ADD COLUMN business_traction_summary TEXT,
  ADD COLUMN financial_health_summary TEXT,
  ADD COLUMN strategic_fit_summary TEXT;

-- Create trigger function for updated scoring engine
CREATE OR REPLACE FUNCTION public.trigger_updated_scoring_engine_vc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
  http_response record;
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZXVpb296Y2dtZWRrdXhhd2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkyMDY0NSwiZXhwIjoyMDY5NDk2NjQ1fQ.xG6vI9lBx_4SIGiSdSGahtSaUu0E2Cp5KJl3d32B6kU';
BEGIN
  -- Get fund type to confirm it's VC
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  -- Only process VC funds
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    RAISE LOG 'Triggering updated scoring engine VC for deal_id: %', NEW.deal_id;
    
    -- Call the edge function asynchronously
    SELECT INTO http_response * FROM net.http_post(
      url := 'https://bueuioozcgmedkuxawju.supabase.co/functions/v1/updated-scoring-engine-vc',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object('deal_id', NEW.deal_id),
      timeout_milliseconds := 120000
    );
    
    RAISE LOG 'Updated scoring engine VC triggered with status: %', http_response.status;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error triggering updated scoring engine VC: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_updated_scoring_engine_vc ON public.deal_datapoints_vc;
CREATE TRIGGER trigger_updated_scoring_engine_vc
  AFTER INSERT ON public.deal_datapoints_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_updated_scoring_engine_vc();