-- Enhanced audit trail and hardening features for institutional-grade analysis

-- 1. Extend deal_analyses with comprehensive audit trail
ALTER TABLE public.deal_analyses 
ADD COLUMN IF NOT EXISTS mandate_snapshot jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS model_executions jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS prompt_audit jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cost_tracking jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS degradation_events jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS recency_compliance jsonb DEFAULT '{}';

-- 2. Add analysis execution cost tracking table
CREATE TABLE IF NOT EXISTS public.analysis_cost_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  fund_id uuid NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  execution_id uuid NOT NULL,
  cost_per_minute numeric(10,4) DEFAULT 0,
  cost_per_deal numeric(10,4) DEFAULT 0,
  total_cost numeric(10,4) DEFAULT 0,
  model_costs jsonb DEFAULT '{}',
  degradation_triggered boolean DEFAULT false,
  degradation_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Add ops control table for kill switches
CREATE TABLE IF NOT EXISTS public.ops_control_switches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL UNIQUE,
  enabled boolean DEFAULT true,
  circuit_breaker_open boolean DEFAULT false,
  failure_count integer DEFAULT 0,
  last_failure_at timestamp with time zone,
  config jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Extend investment_strategies with recency thresholds
ALTER TABLE public.investment_strategies
ADD COLUMN IF NOT EXISTS recency_thresholds jsonb DEFAULT '{
  "market_data_months": 12,
  "financial_data_months": 18,
  "team_data_months": 6,
  "product_data_months": 12,
  "traction_data_months": 6
}';

-- 5. Add IC packet exports table
CREATE TABLE IF NOT EXISTS public.ic_packet_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  fund_id uuid NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  exported_by uuid NOT NULL,
  packet_data jsonb NOT NULL,
  export_metadata jsonb DEFAULT '{}',
  file_path text,
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Insert default ops control switches
INSERT INTO public.ops_control_switches (agent_name, enabled, config) VALUES
('enhanced-deal-analysis', true, '{"max_cost_per_deal": 5.0, "max_cost_per_minute": 2.0}'),
('market-intelligence-engine', true, '{"max_cost_per_deal": 2.0, "max_cost_per_minute": 1.0}'),
('financial-engine', true, '{"max_cost_per_deal": 1.5, "max_cost_per_minute": 0.8}'),
('team-research-engine', true, '{"max_cost_per_deal": 1.0, "max_cost_per_minute": 0.5}'),
('product-ip-engine', true, '{"max_cost_per_deal": 1.0, "max_cost_per_minute": 0.5}'),
('thesis-alignment-engine', true, '{"max_cost_per_deal": 0.5, "max_cost_per_minute": 0.3}'),
('reuben-orchestrator', true, '{"max_cost_per_deal": 10.0, "max_cost_per_minute": 5.0}')
ON CONFLICT (agent_name) DO NOTHING;

-- 7. Add RLS policies for new tables
ALTER TABLE public.analysis_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_control_switches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_packet_exports ENABLE ROW LEVEL SECURITY;

-- Cost tracking policies
CREATE POLICY "Users can view cost tracking for accessible funds" ON public.analysis_cost_tracking
  FOR SELECT USING (user_can_access_fund(fund_id));

CREATE POLICY "Services can manage cost tracking" ON public.analysis_cost_tracking
  FOR ALL USING (true);

-- Ops control policies  
CREATE POLICY "Reuben admins can manage ops controls" ON public.ops_control_switches
  FOR ALL USING (is_reuben_email());

CREATE POLICY "Users can view ops controls" ON public.ops_control_switches
  FOR SELECT USING (true);

-- IC packet export policies
CREATE POLICY "Users can manage IC packets for accessible funds" ON public.ic_packet_exports
  FOR ALL USING (user_can_access_fund(fund_id));

-- 8. Add functions for cost control
CREATE OR REPLACE FUNCTION public.check_cost_limits(
  agent_name_param text,
  current_cost_per_deal numeric,
  current_cost_per_minute numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  switch_config jsonb;
  result jsonb;
BEGIN
  -- Get agent configuration
  SELECT config INTO switch_config
  FROM public.ops_control_switches
  WHERE agent_name = agent_name_param AND enabled = true;
  
  -- If agent is disabled, return failure
  IF switch_config IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Agent disabled or not found',
      'degradation_mode', true
    );
  END IF;
  
  -- Check cost limits
  IF (switch_config->>'max_cost_per_deal')::numeric < current_cost_per_deal THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Deal cost limit exceeded',
      'degradation_mode', true,
      'limit_type', 'per_deal'
    );
  END IF;
  
  IF (switch_config->>'max_cost_per_minute')::numeric < current_cost_per_minute THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Minute cost limit exceeded',
      'degradation_mode', true,
      'limit_type', 'per_minute'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'degradation_mode', false
  );
END;
$$;

-- 9. Add function to generate IC packet
CREATE OR REPLACE FUNCTION public.generate_ic_packet(deal_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deal_record record;
  analysis_record record;
  fund_record record;
  strategy_record record;
  packet_data jsonb;
BEGIN
  -- Get deal data
  SELECT * INTO deal_record FROM public.deals WHERE id = deal_id_param;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found: %', deal_id_param;
  END IF;
  
  -- Get analysis data
  SELECT * INTO analysis_record FROM public.deal_analyses 
  WHERE deal_id = deal_id_param ORDER BY updated_at DESC LIMIT 1;
  
  -- Get fund and strategy data
  SELECT * INTO fund_record FROM public.funds WHERE id = deal_record.fund_id;
  SELECT * INTO strategy_record FROM public.investment_strategies WHERE fund_id = deal_record.fund_id;
  
  -- Build IC packet
  packet_data := jsonb_build_object(
    'deal_summary', jsonb_build_object(
      'company_name', deal_record.company_name,
      'industry', deal_record.industry,
      'deal_size', deal_record.deal_size,
      'valuation', deal_record.valuation,
      'overall_score', deal_record.overall_score,
      'rag_status', deal_record.rag_status
    ),
    'analysis_report', jsonb_build_object(
      'overall_score', COALESCE(analysis_record.overall_score, 0),
      'leadership_score', analysis_record.leadership_score,
      'market_score', analysis_record.market_score,
      'product_score', analysis_record.product_score,
      'financial_score', analysis_record.financial_score,
      'traction_score', analysis_record.traction_score,
      'thesis_alignment_score', analysis_record.thesis_alignment_score,
      'enhanced_analysis', deal_record.enhanced_analysis
    ),
    'evidence_appendix', jsonb_build_object(
      'data_sources', COALESCE(analysis_record.data_sources, '{}'),
      'confidence_scores', COALESCE(analysis_record.confidence_scores, '{}'),
      'validation_flags', COALESCE(analysis_record.validation_flags, '{}')
    ),
    'mandate_snapshot', jsonb_build_object(
      'fund_info', jsonb_build_object(
        'name', fund_record.name,
        'fund_type', fund_record.fund_type,
        'target_size', fund_record.target_size
      ),
      'investment_strategy', COALESCE(strategy_record.enhanced_criteria, '{}'),
      'thresholds', jsonb_build_object(
        'exciting_threshold', strategy_record.exciting_threshold,
        'promising_threshold', strategy_record.promising_threshold,
        'needs_development_threshold', strategy_record.needs_development_threshold
      ),
      'recency_thresholds', COALESCE(strategy_record.recency_thresholds, '{}')
    ),
    'audit_trail', jsonb_build_object(
      'model_executions', COALESCE(analysis_record.model_executions, '[]'),
      'prompt_audit', COALESCE(analysis_record.prompt_audit, '{}'),
      'cost_tracking', COALESCE(analysis_record.cost_tracking, '{}'),
      'analysis_version', analysis_record.analysis_version,
      'analyzed_at', analysis_record.analyzed_at
    ),
    'routing_timeline', jsonb_build_object(
      'created_at', deal_record.created_at,
      'last_analysis_trigger', deal_record.last_analysis_trigger,
      'current_status', deal_record.status,
      'queue_status', deal_record.analysis_queue_status
    ),
    'metadata', jsonb_build_object(
      'exported_at', now(),
      'packet_version', '1.0',
      'compliance_status', 'audit_ready'
    )
  );
  
  RETURN packet_data;
END;
$$;

-- 10. Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_analysis_cost_tracking()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at_ops_control_switches()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analysis_cost_tracking_updated_at
  BEFORE UPDATE ON public.analysis_cost_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_analysis_cost_tracking();

CREATE TRIGGER update_ops_control_switches_updated_at
  BEFORE UPDATE ON public.ops_control_switches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_ops_control_switches();