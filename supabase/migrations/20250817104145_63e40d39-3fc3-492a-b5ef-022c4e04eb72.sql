-- Enable the retrieval_hybrid_v1 feature flag to fix orchestrator crashes
UPDATE public.feature_flags 
SET flag_value = true 
WHERE flag_name = 'retrieval_hybrid_v1';

-- Also enable other critical flags for the analysis pipeline
UPDATE public.feature_flags 
SET flag_value = true 
WHERE flag_name IN ('feature_store_v1', 'scoring_v2', 'guardrails_v1');

-- Add data quality monitoring for market opportunity analysis
CREATE TABLE IF NOT EXISTS public.analysis_quality_monitor (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid NOT NULL,
  fund_id uuid NOT NULL,
  org_id uuid NOT NULL,
  analysis_type text NOT NULL,
  data_completeness_score integer CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100),
  data_sources_count integer DEFAULT 0,
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  has_market_data boolean DEFAULT false,
  has_financial_data boolean DEFAULT false,
  has_competitive_data boolean DEFAULT false,
  quality_flags jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.analysis_quality_monitor ENABLE ROW LEVEL SECURITY;

-- Create policy for quality monitoring
CREATE POLICY "Users can manage quality monitor for accessible funds"
ON public.analysis_quality_monitor
FOR ALL
USING (org_id = get_jwt_org_id())
WITH CHECK (org_id = get_jwt_org_id());

-- Add indexes for performance
CREATE INDEX idx_quality_monitor_deal ON public.analysis_quality_monitor(deal_id);
CREATE INDEX idx_quality_monitor_org_fund ON public.analysis_quality_monitor(org_id, fund_id);
CREATE INDEX idx_quality_monitor_type ON public.analysis_quality_monitor(analysis_type);

-- Function to check and update analysis quality
CREATE OR REPLACE FUNCTION public.monitor_analysis_quality(
  p_deal_id uuid,
  p_analysis_type text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deal_record record;
  quality_score integer := 0;
  sources_count integer := 0;
  market_data_exists boolean := false;
  financial_data_exists boolean := false;
  competitive_data_exists boolean := false;
  quality_flags jsonb := '{}';
BEGIN
  -- Get deal and fund info
  SELECT d.*, f.fund_type, f.organization_id INTO deal_record
  FROM deals d
  JOIN funds f ON d.fund_id = f.id
  WHERE d.id = p_deal_id;
  
  -- Check data sources
  SELECT COUNT(*) INTO sources_count
  FROM deal_analysis_sources
  WHERE deal_id = p_deal_id;
  
  -- Check for specific data types in market intelligence results
  SELECT EXISTS(
    SELECT 1 FROM deal_analysis_sources 
    WHERE deal_id = p_deal_id 
    AND engine_name = 'market-intelligence-engine'
    AND data_retrieved ? 'market_size'
  ) INTO market_data_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM deal_analysis_sources 
    WHERE deal_id = p_deal_id 
    AND engine_name = 'financial-engine'
    AND data_retrieved ? 'revenue'
  ) INTO financial_data_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM deal_analysis_sources 
    WHERE deal_id = p_deal_id 
    AND data_retrieved ? 'competitors'
  ) INTO competitive_data_exists;
  
  -- Calculate quality score
  quality_score := (
    CASE WHEN market_data_exists THEN 25 ELSE 0 END +
    CASE WHEN financial_data_exists THEN 25 ELSE 0 END +
    CASE WHEN competitive_data_exists THEN 25 ELSE 0 END +
    LEAST(sources_count * 5, 25)
  );
  
  -- Set quality flags
  quality_flags := jsonb_build_object(
    'insufficient_market_data', NOT market_data_exists,
    'insufficient_financial_data', NOT financial_data_exists,
    'insufficient_competitive_data', NOT competitive_data_exists,
    'low_source_count', sources_count < 3,
    'needs_reanalysis', quality_score < 50
  );
  
  -- Insert or update quality record
  INSERT INTO analysis_quality_monitor (
    deal_id, fund_id, org_id, analysis_type,
    data_completeness_score, data_sources_count, confidence_score,
    has_market_data, has_financial_data, has_competitive_data,
    quality_flags
  ) VALUES (
    p_deal_id, deal_record.fund_id, deal_record.organization_id, p_analysis_type,
    quality_score, sources_count, quality_score,
    market_data_exists, financial_data_exists, competitive_data_exists,
    quality_flags
  )
  ON CONFLICT (deal_id, analysis_type) 
  DO UPDATE SET
    data_completeness_score = EXCLUDED.data_completeness_score,
    data_sources_count = EXCLUDED.data_sources_count,
    confidence_score = EXCLUDED.confidence_score,
    has_market_data = EXCLUDED.has_market_data,
    has_financial_data = EXCLUDED.has_financial_data,
    has_competitive_data = EXCLUDED.has_competitive_data,
    quality_flags = EXCLUDED.quality_flags,
    created_at = now();
  
  RETURN jsonb_build_object(
    'quality_score', quality_score,
    'sources_count', sources_count,
    'quality_flags', quality_flags,
    'recommendations', CASE 
      WHEN quality_score < 50 THEN ARRAY['needs_more_data', 'trigger_reanalysis']
      WHEN quality_score < 75 THEN ARRAY['enhance_data_collection']
      ELSE ARRAY['quality_sufficient']
    END
  );
END;
$$;