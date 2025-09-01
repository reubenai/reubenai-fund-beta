-- Update trigger to handle both VC and PE deals with all required fields
CREATE OR REPLACE FUNCTION public.trigger_perplexity_datamining_vc_on_deal_creation()
RETURNS TRIGGER AS $$
DECLARE
  fund_type_value text;
  fund_org_id uuid;
BEGIN
  -- Get fund type and organization ID for this deal
  SELECT f.fund_type::text, f.organization_id INTO fund_type_value, fund_org_id
  FROM public.funds f
  WHERE f.id = NEW.fund_id;
  
  -- Handle VC deals
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    -- Insert row into perplexity_datamining_vc with all required fields
    INSERT INTO public.perplexity_datamining_vc (
      deal_id,
      fund_id,
      organization_id,
      company_name,
      category,
      processing_status,
      created_at
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      fund_org_id,
      NEW.company_name,
      'comprehensive_analysis',
      'queued',
      NOW()
    )
    ON CONFLICT (deal_id) DO NOTHING; -- Prevent duplicate processing
    
    -- Log activity event for VC
    INSERT INTO public.activity_events (
      user_id,
      fund_id,
      deal_id,
      activity_type,
      title,
      description,
      context_data
    ) VALUES (
      NEW.created_by,
      NEW.fund_id,
      NEW.id,
      'perplexity_datamining_queued',
      'VC Perplexity Data Mining Queued',
      'Perplexity data mining has been automatically queued for VC deal: ' || NEW.company_name,
      jsonb_build_object(
        'deal_id', NEW.id,
        'company_name', NEW.company_name,
        'fund_type', fund_type_value,
        'category', 'comprehensive_analysis',
        'auto_triggered', true
      )
    );
    
    RAISE LOG 'VC Perplexity datamining queued for deal % (%)', NEW.id, NEW.company_name;
    
  -- Handle PE deals  
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Insert row into perplexity_datamining_pe with all required fields
    INSERT INTO public.perplexity_datamining_pe (
      deal_id,
      fund_id,
      organization_id,
      company_name,
      category,
      processing_status,
      created_at
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      fund_org_id,
      NEW.company_name,
      'comprehensive_analysis',
      'queued',
      NOW()
    )
    ON CONFLICT (deal_id) DO NOTHING; -- Prevent duplicate processing
    
    -- Log activity event for PE
    INSERT INTO public.activity_events (
      user_id,
      fund_id,
      deal_id,
      activity_type,
      title,
      description,
      context_data
    ) VALUES (
      NEW.created_by,
      NEW.fund_id,
      NEW.id,
      'perplexity_datamining_queued',
      'PE Perplexity Data Mining Queued',
      'Perplexity data mining has been automatically queued for PE deal: ' || NEW.company_name,
      jsonb_build_object(
        'deal_id', NEW.id,
        'company_name', NEW.company_name,
        'fund_type', fund_type_value,
        'category', 'comprehensive_analysis',
        'auto_triggered', true
      )
    );
    
    RAISE LOG 'PE Perplexity datamining queued for deal % (%)', NEW.id, NEW.company_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;