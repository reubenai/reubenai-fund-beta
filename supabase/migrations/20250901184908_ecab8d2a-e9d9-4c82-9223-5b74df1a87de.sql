-- Create trigger function to transform and populate deal_datapoints_vc from perplexity market enrichment
CREATE OR REPLACE FUNCTION public.trigger_perplexity_market_to_datapoints_vc()
RETURNS TRIGGER AS $$
DECLARE
  deal_fund_id uuid;
  deal_org_id uuid;
  completeness_score integer := 0;
  total_fields integer := 18;
  confidence_level text := 'medium';
BEGIN
  -- Only process when status indicates completion
  IF NEW.processing_status NOT IN ('processed', 'completed') THEN
    RETURN NEW;
  END IF;
  
  -- Get fund_id and organization_id from deals table
  SELECT d.fund_id, f.organization_id 
  INTO deal_fund_id, deal_org_id
  FROM public.deals d
  JOIN public.funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  IF deal_fund_id IS NULL THEN
    RAISE LOG 'Deal % not found or missing fund_id', NEW.deal_id;
    RETURN NEW;
  END IF;
  
  -- Calculate data completeness score
  completeness_score := (
    CASE WHEN NEW.investment_thesis_alignment IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.market_size IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.customer_metrics IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.product_innovation IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.market_timing IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.revenue_growth IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.product_market_fit IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.financial_performance IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.technology_advantage IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.value_creation_potential IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.founder_experience IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.team_composition IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.competitive_landscape IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.financial_planning IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.market_validation IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.vision_communication IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.portfolio_synergies IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.capital_efficiency IS NOT NULL THEN 1 ELSE 0 END
  );
  
  -- Determine confidence level based on completeness
  IF completeness_score >= 15 THEN
    confidence_level := 'high';
  ELSIF completeness_score >= 10 THEN
    confidence_level := 'medium';
  ELSE
    confidence_level := 'low';
  END IF;
  
  -- UPSERT into deal_datapoints_vc
  INSERT INTO public.deal_datapoints_vc (
    deal_id,
    fund_id,
    organization_id,
    investment_thesis_alignment,
    market_size,
    customer_metrics,
    product_innovation,
    market_timing,
    revenue_growth,
    product_market_fit,
    financial_performance,
    technology_advantage,
    value_creation_potential,
    founder_experience,
    team_composition,
    competitive_landscape,
    financial_planning,
    market_validation,
    vision_communication,
    portfolio_synergies,
    capital_efficiency,
    source_engines,
    data_completeness_score,
    confidence_level,
    created_at,
    updated_at
  ) VALUES (
    NEW.deal_id,
    deal_fund_id,
    deal_org_id,
    CASE WHEN NEW.investment_thesis_alignment IS NOT NULL THEN 
      jsonb_build_object('value', NEW.investment_thesis_alignment, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.market_size IS NOT NULL THEN 
      jsonb_build_object('value', NEW.market_size, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.customer_metrics IS NOT NULL THEN 
      jsonb_build_object('value', NEW.customer_metrics, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.product_innovation IS NOT NULL THEN 
      jsonb_build_object('value', NEW.product_innovation, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.market_timing IS NOT NULL THEN 
      jsonb_build_object('value', NEW.market_timing, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.revenue_growth IS NOT NULL THEN 
      jsonb_build_object('value', NEW.revenue_growth, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.product_market_fit IS NOT NULL THEN 
      jsonb_build_object('value', NEW.product_market_fit, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.financial_performance IS NOT NULL THEN 
      jsonb_build_object('value', NEW.financial_performance, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.technology_advantage IS NOT NULL THEN 
      jsonb_build_object('value', NEW.technology_advantage, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.value_creation_potential IS NOT NULL THEN 
      jsonb_build_object('value', NEW.value_creation_potential, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.founder_experience IS NOT NULL THEN 
      jsonb_build_object('value', NEW.founder_experience, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.team_composition IS NOT NULL THEN 
      jsonb_build_object('value', NEW.team_composition, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.competitive_landscape IS NOT NULL THEN 
      jsonb_build_object('value', NEW.competitive_landscape, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.financial_planning IS NOT NULL THEN 
      jsonb_build_object('value', NEW.financial_planning, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.market_validation IS NOT NULL THEN 
      jsonb_build_object('value', NEW.market_validation, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.vision_communication IS NOT NULL THEN 
      jsonb_build_object('value', NEW.vision_communication, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.portfolio_synergies IS NOT NULL THEN 
      jsonb_build_object('value', NEW.portfolio_synergies, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    CASE WHEN NEW.capital_efficiency IS NOT NULL THEN 
      jsonb_build_object('value', NEW.capital_efficiency, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE NULL END,
    ARRAY['perplexity_market'],
    (completeness_score * 100 / total_fields),
    confidence_level,
    NOW(),
    NOW()
  )
  ON CONFLICT (deal_id) DO UPDATE SET
    investment_thesis_alignment = CASE WHEN NEW.investment_thesis_alignment IS NOT NULL THEN 
      jsonb_build_object('value', NEW.investment_thesis_alignment, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.investment_thesis_alignment END,
    market_size = CASE WHEN NEW.market_size IS NOT NULL THEN 
      jsonb_build_object('value', NEW.market_size, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.market_size END,
    customer_metrics = CASE WHEN NEW.customer_metrics IS NOT NULL THEN 
      jsonb_build_object('value', NEW.customer_metrics, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.customer_metrics END,
    product_innovation = CASE WHEN NEW.product_innovation IS NOT NULL THEN 
      jsonb_build_object('value', NEW.product_innovation, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.product_innovation END,
    market_timing = CASE WHEN NEW.market_timing IS NOT NULL THEN 
      jsonb_build_object('value', NEW.market_timing, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.market_timing END,
    revenue_growth = CASE WHEN NEW.revenue_growth IS NOT NULL THEN 
      jsonb_build_object('value', NEW.revenue_growth, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.revenue_growth END,
    product_market_fit = CASE WHEN NEW.product_market_fit IS NOT NULL THEN 
      jsonb_build_object('value', NEW.product_market_fit, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.product_market_fit END,
    financial_performance = CASE WHEN NEW.financial_performance IS NOT NULL THEN 
      jsonb_build_object('value', NEW.financial_performance, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.financial_performance END,
    technology_advantage = CASE WHEN NEW.technology_advantage IS NOT NULL THEN 
      jsonb_build_object('value', NEW.technology_advantage, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.technology_advantage END,
    value_creation_potential = CASE WHEN NEW.value_creation_potential IS NOT NULL THEN 
      jsonb_build_object('value', NEW.value_creation_potential, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.value_creation_potential END,
    founder_experience = CASE WHEN NEW.founder_experience IS NOT NULL THEN 
      jsonb_build_object('value', NEW.founder_experience, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.founder_experience END,
    team_composition = CASE WHEN NEW.team_composition IS NOT NULL THEN 
      jsonb_build_object('value', NEW.team_composition, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.team_composition END,
    competitive_landscape = CASE WHEN NEW.competitive_landscape IS NOT NULL THEN 
      jsonb_build_object('value', NEW.competitive_landscape, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.competitive_landscape END,
    financial_planning = CASE WHEN NEW.financial_planning IS NOT NULL THEN 
      jsonb_build_object('value', NEW.financial_planning, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.financial_planning END,
    market_validation = CASE WHEN NEW.market_validation IS NOT NULL THEN 
      jsonb_build_object('value', NEW.market_validation, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.market_validation END,
    vision_communication = CASE WHEN NEW.vision_communication IS NOT NULL THEN 
      jsonb_build_object('value', NEW.vision_communication, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.vision_communication END,
    portfolio_synergies = CASE WHEN NEW.portfolio_synergies IS NOT NULL THEN 
      jsonb_build_object('value', NEW.portfolio_synergies, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.portfolio_synergies END,
    capital_efficiency = CASE WHEN NEW.capital_efficiency IS NOT NULL THEN 
      jsonb_build_object('value', NEW.capital_efficiency, 'confidence', 'medium', 'source', 'perplexity_market') 
      ELSE EXCLUDED.capital_efficiency END,
    source_engines = CASE WHEN 'perplexity_market' = ANY(deal_datapoints_vc.source_engines) 
      THEN deal_datapoints_vc.source_engines 
      ELSE array_append(deal_datapoints_vc.source_engines, 'perplexity_market') END,
    data_completeness_score = (completeness_score * 100 / total_fields),
    confidence_level = confidence_level,
    updated_at = NOW();
  
  RAISE LOG 'Populated deal_datapoints_vc for deal % with % fields (%% complete)', 
    NEW.deal_id, completeness_score, (completeness_score * 100 / total_fields);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
CREATE TRIGGER trigger_perplexity_market_to_datapoints_vc
  AFTER INSERT OR UPDATE ON public.deal_enrichment_perplexity_market_export_vc
  FOR EACH ROW
  WHEN (NEW.processing_status IN ('processed', 'completed'))
  EXECUTE FUNCTION public.trigger_perplexity_market_to_datapoints_vc();