-- Continue Phase 6: Fix remaining functions and add missing RLS policies

-- Fix remaining functions without search path
CREATE OR REPLACE FUNCTION public.update_support_ticket_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_ai_service_interaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log when AI services access fund-specific data
  IF NEW.fund_id IS NOT NULL AND NEW.ai_service_name IS NOT NULL THEN
    INSERT INTO public.data_lineage_log (
      source_service,
      target_service,
      fund_id,
      deal_id,
      data_classification,
      transfer_reason,
      approved,
      metadata
    ) VALUES (
      NEW.ai_service_name,
      'fund-memory-engine',
      NEW.fund_id,
      NEW.deal_id,
      'fund_specific',
      'AI service storing fund memory',
      true,
      jsonb_build_object(
        'memory_type', NEW.memory_type,
        'confidence_score', NEW.confidence_score,
        'importance_level', NEW.importance_level
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_overall_score(thesis_score integer DEFAULT NULL::integer, leadership_score integer DEFAULT NULL::integer, market_score integer DEFAULT NULL::integer, product_score integer DEFAULT NULL::integer, financial_score integer DEFAULT NULL::integer, traction_score integer DEFAULT NULL::integer)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result_score integer;
  total_weighted numeric := 0;
  total_weight numeric := 0;
BEGIN
  -- Calculate weighted average of available scores
  IF thesis_score IS NOT NULL THEN
    total_weighted := total_weighted + (thesis_score * 0.2);
    total_weight := total_weight + 0.2;
  END IF;
  
  IF leadership_score IS NOT NULL THEN
    total_weighted := total_weighted + (leadership_score * 0.2);
    total_weight := total_weight + 0.2;
  END IF;
  
  IF market_score IS NOT NULL THEN
    total_weighted := total_weighted + (market_score * 0.2);
    total_weight := total_weight + 0.2;
  END IF;
  
  IF product_score IS NOT NULL THEN
    total_weighted := total_weighted + (product_score * 0.15);
    total_weight := total_weight + 0.15;
  END IF;
  
  IF financial_score IS NOT NULL THEN
    total_weighted := total_weighted + (financial_score * 0.15);
    total_weight := total_weight + 0.15;
  END IF;
  
  IF traction_score IS NOT NULL THEN
    total_weighted := total_weighted + (traction_score * 0.1);
    total_weight := total_weight + 0.1;
  END IF;
  
  -- Return weighted average or NULL if no scores
  IF total_weight > 0 THEN
    result_score := ROUND(total_weighted / total_weight);
  ELSE
    result_score := NULL;
  END IF;
  
  RETURN result_score;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_overall_score()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.overall_score = calculate_overall_score(
    NEW.thesis_alignment_score,
    NEW.leadership_score,
    NEW.market_score,
    NEW.product_score,
    NEW.financial_score,
    NEW.traction_score
  );
  RETURN NEW;
END;
$function$;