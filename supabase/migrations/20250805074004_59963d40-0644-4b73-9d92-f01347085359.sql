-- Fix the search_path security warning for the function
CREATE OR REPLACE FUNCTION capture_deal_decision_memory()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into fund memory when deal status changes (captures decision patterns)
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.fund_memory_entries (
      fund_id,
      deal_id,
      memory_type,
      title,
      description,
      memory_content,
      confidence_score,
      importance_level,
      contextual_tags,
      ai_service_name,
      created_by
    ) VALUES (
      NEW.fund_id,
      NEW.id,
      'decision_pattern',
      'Deal Status Change: ' || COALESCE(OLD.status::text, 'new') || ' → ' || NEW.status::text,
      'Decision pattern captured from deal progression',
      jsonb_build_object(
        'decision_type', 'status_change',
        'from_status', OLD.status,
        'to_status', NEW.status,
        'company_name', NEW.company_name,
        'industry', NEW.industry,
        'deal_size', NEW.deal_size,
        'overall_score', NEW.overall_score,
        'rag_status', NEW.rag_status,
        'decision_timestamp', now(),
        'progression_speed_days', EXTRACT(EPOCH FROM (now() - NEW.created_at)) / 86400
      ),
      CASE 
        WHEN NEW.status IN ('approved', 'declined') THEN 90
        WHEN NEW.status IN ('investment_committee', 'screening') THEN 80
        ELSE 70
      END,
      CASE 
        WHEN NEW.status IN ('approved', 'declined') THEN 'high'
        WHEN NEW.status IN ('investment_committee') THEN 'high'
        ELSE 'medium'
      END,
      ARRAY[
        'decision_pattern',
        NEW.status::text,
        COALESCE(NEW.industry, 'unknown_industry'),
        CASE WHEN NEW.deal_size > 1000000 THEN 'large_deal' ELSE 'standard_deal' END
      ],
      'deal-status-tracker',
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';