-- Add RLS policies for the new tables and create the trigger function
DO $$
BEGIN
  -- Create policies for memory_prompt_triggers (skip if already exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'memory_prompt_triggers' 
    AND policyname = 'Users can manage memory triggers with proper access'
  ) THEN
    CREATE POLICY "Users can manage memory triggers with proper access" 
    ON public.memory_prompt_triggers 
    FOR ALL 
    USING (
      is_reuben_admin() OR 
      (fund_id IN (
        SELECT f.id FROM funds f
        JOIN profiles p ON f.organization_id = p.organization_id
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
      ))
    );
  END IF;

  -- Create policies for market_signal_responses (skip if already exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'market_signal_responses' 
    AND policyname = 'Users can manage market signals with proper access'
  ) THEN
    CREATE POLICY "Users can manage market signals with proper access" 
    ON public.market_signal_responses 
    FOR ALL 
    USING (
      is_reuben_admin() OR 
      (fund_id IN (
        SELECT f.id FROM funds f
        JOIN profiles p ON f.organization_id = p.organization_id
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
      ))
    );
  END IF;
END $$;

-- Enhanced trigger function for capturing deal decision patterns
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for deal status changes
DROP TRIGGER IF EXISTS trigger_capture_deal_decision_memory ON public.deals;
CREATE TRIGGER trigger_capture_deal_decision_memory
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION capture_deal_decision_memory();

-- Populate initial memory prompt triggers for existing funds
INSERT INTO public.memory_prompt_triggers (fund_id, trigger_type, prompt_template, trigger_conditions)
SELECT 
  f.id,
  'similar_deal',
  'When evaluating {company_name}, consider similar {industry} deals from your portfolio',
  jsonb_build_object('industry_match', true, 'deal_size_range', 0.5)
FROM public.funds f
WHERE f.is_active = true
ON CONFLICT DO NOTHING;

INSERT INTO public.memory_prompt_triggers (fund_id, trigger_type, prompt_template, trigger_conditions)
SELECT 
  f.id,
  'risk_pattern',
  'Risk pattern detected in {company_name} - review past experiences with {risk_category}',
  jsonb_build_object('confidence_threshold', 70)
FROM public.funds f
WHERE f.is_active = true
ON CONFLICT DO NOTHING;

INSERT INTO public.memory_prompt_triggers (fund_id, trigger_type, prompt_template, trigger_conditions)
SELECT 
  f.id,
  'bias_warning',
  'Decision bias alert: consider objective criteria for {company_name}',
  jsonb_build_object('deviation_threshold', 20)
FROM public.funds f
WHERE f.is_active = true
ON CONFLICT DO NOTHING;