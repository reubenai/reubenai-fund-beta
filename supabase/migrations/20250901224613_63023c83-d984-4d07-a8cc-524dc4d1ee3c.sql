-- Create function to sync Perplexity market data to VC datapoints
CREATE OR REPLACE FUNCTION public.sync_perplexity_market_to_datapoints_vc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_fund_id uuid;
  target_org_id uuid;
  mapped_status text;
BEGIN
  -- Only process when status changes to completed or processed
  IF NEW.processing_status NOT IN ('completed', 'processed') THEN
    RETURN NEW;
  END IF;
  
  -- Skip if status hasn't actually changed
  IF OLD.processing_status = NEW.processing_status THEN
    RETURN NEW;
  END IF;
  
  -- Get fund_id and organization_id from deals table
  SELECT d.fund_id, f.organization_id
  INTO target_fund_id, target_org_id
  FROM deals d
  JOIN funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  -- Skip if deal not found or missing fund info
  IF target_fund_id IS NULL OR target_org_id IS NULL THEN
    RAISE LOG 'Deal % not found or missing fund info, skipping sync', NEW.deal_id;
    RETURN NEW;
  END IF;
  
  -- Map processing status to datapoints status
  mapped_status := CASE 
    WHEN NEW.processing_status IN ('completed', 'processed') THEN 'completed'
    ELSE 'failed'
  END;
  
  -- UPSERT into deal_datapoints_vc
  INSERT INTO deal_datapoints_vc (
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
    confidence_level,
    source_engines,
    data_completeness_score,
    processing_status,
    processed_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.deal_id,
    target_fund_id,
    target_org_id,
    NEW.investment_thesis_alignment,
    NEW.market_size,
    NEW.customer_metrics,
    NEW.product_innovation,
    NEW.market_timing,
    NEW.revenue_growth,
    NEW.product_market_fit,
    NEW.financial_performance,
    NEW.technology_advantage,
    NEW.value_creation_potential,
    NEW.founder_experience,
    NEW.team_composition,
    NEW.competitive_landscape,
    NEW.financial_planning,
    NEW.market_validation,
    NEW.vision_communication,
    NEW.portfolio_synergies,
    NEW.capital_efficiency,
    NEW.confidence_level,
    ARRAY['perplexity_market']::text[],
    COALESCE(NEW.data_quality_score, 0),
    mapped_status,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (deal_id) DO UPDATE SET
    investment_thesis_alignment = EXCLUDED.investment_thesis_alignment,
    market_size = EXCLUDED.market_size,
    customer_metrics = EXCLUDED.customer_metrics,
    product_innovation = EXCLUDED.product_innovation,
    market_timing = EXCLUDED.market_timing,
    revenue_growth = EXCLUDED.revenue_growth,
    product_market_fit = EXCLUDED.product_market_fit,
    financial_performance = EXCLUDED.financial_performance,
    technology_advantage = EXCLUDED.technology_advantage,
    value_creation_potential = EXCLUDED.value_creation_potential,
    founder_experience = EXCLUDED.founder_experience,
    team_composition = EXCLUDED.team_composition,
    competitive_landscape = EXCLUDED.competitive_landscape,
    financial_planning = EXCLUDED.financial_planning,
    market_validation = EXCLUDED.market_validation,
    vision_communication = EXCLUDED.vision_communication,
    portfolio_synergies = EXCLUDED.portfolio_synergies,
    capital_efficiency = EXCLUDED.capital_efficiency,
    confidence_level = EXCLUDED.confidence_level,
    source_engines = CASE 
      WHEN 'perplexity_market' = ANY(deal_datapoints_vc.source_engines) 
      THEN deal_datapoints_vc.source_engines
      ELSE array_append(deal_datapoints_vc.source_engines, 'perplexity_market')
    END,
    data_completeness_score = EXCLUDED.data_completeness_score,
    processing_status = EXCLUDED.processing_status,
    processed_at = EXCLUDED.processed_at,
    updated_at = NOW();
  
  RAISE LOG 'Synced Perplexity market data for deal % to deal_datapoints_vc', NEW.deal_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on deal_enrichment_perplexity_market_export_vc
CREATE TRIGGER trigger_sync_perplexity_market_to_datapoints_vc
  AFTER UPDATE ON deal_enrichment_perplexity_market_export_vc
  FOR EACH ROW
  EXECUTE FUNCTION sync_perplexity_market_to_datapoints_vc();

-- One-time sync of existing processed records
INSERT INTO deal_datapoints_vc (
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
  confidence_level,
  source_engines,
  data_completeness_score,
  processing_status,
  processed_at,
  created_at,
  updated_at
)
SELECT 
  pme.deal_id,
  d.fund_id,
  f.organization_id,
  pme.investment_thesis_alignment,
  pme.market_size,
  pme.customer_metrics,
  pme.product_innovation,
  pme.market_timing,
  pme.revenue_growth,
  pme.product_market_fit,
  pme.financial_performance,
  pme.technology_advantage,
  pme.value_creation_potential,
  pme.founder_experience,
  pme.team_composition,
  pme.competitive_landscape,
  pme.financial_planning,
  pme.market_validation,
  pme.vision_communication,
  pme.portfolio_synergies,
  pme.capital_efficiency,
  pme.confidence_level,
  ARRAY['perplexity_market']::text[],
  COALESCE(pme.data_quality_score, 0),
  CASE 
    WHEN pme.processing_status IN ('completed', 'processed') THEN 'completed'
    ELSE 'failed'
  END,
  NOW(),
  NOW(),
  NOW()
FROM deal_enrichment_perplexity_market_export_vc pme
JOIN deals d ON pme.deal_id = d.id
JOIN funds f ON d.fund_id = f.id
WHERE pme.processing_status IN ('completed', 'processed')
ON CONFLICT (deal_id) DO NOTHING;