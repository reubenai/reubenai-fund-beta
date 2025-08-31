-- Fix the trigger_waterfall_extraction_datapoints function to reference correct column
CREATE OR REPLACE FUNCTION public.trigger_waterfall_extraction_datapoints()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fund_type_value text;
BEGIN
  -- Only process if document has analysis data
  IF NEW.documents_data_points_vc IS NULL AND NEW.documents_data_points_pe IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get fund type for this deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' AND NEW.documents_data_points_vc IS NOT NULL THEN
    -- Only update if documents_data_points_vc actually changed
    IF NEW.documents_data_points_vc IS DISTINCT FROM OLD.documents_data_points_vc THEN
      -- Update VC datapoints with document data
      UPDATE public.deal_analysis_datapoints_vc 
      SET 
        documents_data_points_vc = NEW.documents_data_points_vc,
        source_engines = CASE WHEN 'documents' = ANY(source_engines) 
          THEN source_engines
          ELSE array_append(source_engines, 'documents') END,
        data_completeness_score = data_completeness_score + 20,
        updated_at = now()
      WHERE deal_id = NEW.deal_id;
    END IF;
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' AND NEW.documents_data_points_pe IS NOT NULL THEN
    -- Only update if documents_data_points_pe actually changed
    IF NEW.documents_data_points_pe IS DISTINCT FROM OLD.documents_data_points_pe THEN
      -- Update PE datapoints with document data
      UPDATE public.deal_analysis_datapoints_pe 
      SET 
        documents_data_points_pe = NEW.documents_data_points_pe,
        source_engines = CASE WHEN 'documents' = ANY(source_engines) 
          THEN source_engines
          ELSE array_append(source_engines, 'documents') END,
        data_completeness_score = data_completeness_score + 20,
        updated_at = now()
      WHERE deal_id = NEW.deal_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;