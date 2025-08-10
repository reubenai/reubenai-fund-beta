-- Phase 6 Final: Fix remaining 5 functions without search_path

CREATE OR REPLACE FUNCTION public.check_cost_limits(agent_name_param text, current_cost_per_deal numeric, current_cost_per_minute numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.generate_ic_packet(deal_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_fund_memory_insights_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_analysis_cost_tracking()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_ops_control_switches()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Comment: All function search_path issues resolved
-- Ready for final Phase 6 sign-off