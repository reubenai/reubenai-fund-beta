-- Create missing triggers on deals table to trigger enrichment processes

-- Trigger for LinkedIn company enrichment
CREATE TRIGGER trigger_new_deal_linkedin_enrichment_trigger
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_deal_linkedin_enrichment();

-- Trigger for LinkedIn founder profile enrichment  
CREATE TRIGGER trigger_new_deal_founder_profile_enrichment_trigger
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_deal_founder_profile_enrichment();

-- Create function and trigger for Crunchbase enrichment
CREATE OR REPLACE FUNCTION public.trigger_new_deal_crunchbase_enrichment()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert row to trigger Crunchbase enrichment
  INSERT INTO public.deal_enrichment_crunchbase_export (
    deal_id,
    fund_id,
    organization_id,
    company_name,
    website_url,
    status
  ) VALUES (
    NEW.id,
    NEW.fund_id,
    NEW.organization_id,
    NEW.company_name,
    NEW.website,
    'pending'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_new_deal_crunchbase_enrichment_trigger
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_deal_crunchbase_enrichment();

-- Create function and trigger for Perplexity VC enrichments
CREATE OR REPLACE FUNCTION public.trigger_new_deal_perplexity_vc_enrichment()
RETURNS TRIGGER AS $$
DECLARE
  fund_type_value text;
BEGIN
  -- Get fund type
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.funds f
  WHERE f.id = NEW.fund_id;
  
  -- Only trigger for VC funds
  IF fund_type_value = 'venture_capital' THEN
    -- Company enrichment
    INSERT INTO public.deal_enrichment_perplexity_company_export_vc (
      deal_id,
      fund_id,
      organization_id,
      company_name,
      website_url,
      status
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      NEW.organization_id,
      NEW.company_name,
      NEW.website,
      'pending'
    );
    
    -- Founder enrichment
    INSERT INTO public.deal_enrichment_perplexity_founder_export_vc (
      deal_id,
      fund_id,
      organization_id,
      company_name,
      founder_name,
      website_url,
      status
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      NEW.organization_id,
      NEW.company_name,
      COALESCE(NEW.founder_name, 'Unknown'),
      NEW.website,
      'pending'
    );
    
    -- Market enrichment
    INSERT INTO public.deal_enrichment_perplexity_market_export_vc (
      deal_id,
      fund_id,
      organization_id,
      company_name,
      industry,
      location,
      status
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      NEW.organization_id,
      NEW.company_name,
      NEW.industry,
      NEW.location,
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_new_deal_perplexity_vc_enrichment_trigger
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_deal_perplexity_vc_enrichment();

-- Create function and trigger for Perplexity PE enrichments
CREATE OR REPLACE FUNCTION public.trigger_new_deal_perplexity_pe_enrichment()
RETURNS TRIGGER AS $$
DECLARE
  fund_type_value text;
BEGIN
  -- Get fund type
  SELECT f.fund_type::text INTO fund_type_value
  FROM public.funds f
  WHERE f.id = NEW.fund_id;
  
  -- Only trigger for PE funds
  IF fund_type_value = 'private_equity' THEN
    -- Company enrichment
    INSERT INTO public.deal_enrichment_perplexity_company_export_pe (
      deal_id,
      fund_id,
      organization_id,
      company_name,
      website_url,
      status
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      NEW.organization_id,
      NEW.company_name,
      NEW.website,
      'pending'
    );
    
    -- Founder enrichment
    INSERT INTO public.deal_enrichment_perplexity_founder_export_pe (
      deal_id,
      fund_id,
      organization_id,
      company_name,
      founder_name,
      website_url,
      status
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      NEW.organization_id,
      NEW.company_name,
      COALESCE(NEW.founder_name, 'Unknown'),
      NEW.website,
      'pending'
    );
    
    -- Market enrichment
    INSERT INTO public.deal_enrichment_perplexity_market_export_pe (
      deal_id,
      fund_id,
      organization_id,
      company_name,
      industry,
      location,
      status
    ) VALUES (
      NEW.id,
      NEW.fund_id,
      NEW.organization_id,
      NEW.company_name,
      NEW.industry,
      NEW.location,
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_new_deal_perplexity_pe_enrichment_trigger
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_deal_perplexity_pe_enrichment();