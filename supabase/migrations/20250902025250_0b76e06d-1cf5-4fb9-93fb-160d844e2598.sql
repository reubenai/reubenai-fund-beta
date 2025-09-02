-- Create function to initialize VC analysis result records
CREATE OR REPLACE FUNCTION public.initialize_vc_analysis_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only act when data completeness indicates readiness for analysis
  IF NEW.data_completeness_score >= 60 AND (OLD.data_completeness_score IS NULL OR OLD.data_completeness_score < 60) THEN
    
    -- Insert or update deal_analysisresult_vc record with basic identifiers
    INSERT INTO public.deal_analysisresult_vc (
      deal_id,
      fund_id,
      organization_id,
      processing_status,
      created_at,
      updated_at
    )
    SELECT 
      d.id,
      d.fund_id,
      f.organization_id,
      'pending',
      now(),
      now()
    FROM public.deals d
    JOIN public.funds f ON d.fund_id = f.id
    WHERE d.id = NEW.deal_id
    ON CONFLICT (deal_id) DO UPDATE SET
      processing_status = 'pending',
      updated_at = now();
      
    RAISE LOG 'Initialized deal_analysisresult_vc record for deal %', NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on deal_analysis_datapoints_vc
CREATE TRIGGER initialize_vc_analysis_result_trigger
    AFTER UPDATE ON public.deal_analysis_datapoints_vc
    FOR EACH ROW
    EXECUTE FUNCTION public.initialize_vc_analysis_result();