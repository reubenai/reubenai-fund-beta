-- Create the missing trigger on deals table
CREATE TRIGGER trigger_perplexity_datamining_on_deal_creation_trigger
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_perplexity_datamining_vc_on_deal_creation();

-- Update the trigger function to match working pattern
CREATE OR REPLACE FUNCTION public.trigger_perplexity_datamining_vc_on_deal_creation()
RETURNS TRIGGER AS $$
DECLARE
  fund_type_value text;
BEGIN
  -- Get fund type for this deal
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.funds f
  WHERE f.id = NEW.fund_id;
  
  IF fund_type_value = 'venture_capital' OR fund_type_value = 'vc' THEN
    -- Insert into VC datamining table
    INSERT INTO public.perplexity_datamining_vc (
      deal_id,
      fund_id,
      organization_id,
      company_name,
      category,
      processing_status
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      NEW.organization_id,
      NEW.company_name,
      'comprehensive_analysis',
      'queued'
    );
    
  ELSIF fund_type_value = 'private_equity' OR fund_type_value = 'pe' THEN
    -- Insert into PE datamining table
    INSERT INTO public.perplexity_datamining_pe (
      deal_id,
      fund_id,
      organization_id,
      company_name,
      category,
      processing_status
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      NEW.organization_id,
      NEW.company_name,
      'comprehensive_analysis',
      'queued'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;