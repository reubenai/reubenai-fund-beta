-- Fix the populate_enhanced_analysis function to handle fund_type properly
CREATE OR REPLACE FUNCTION public.populate_enhanced_analysis_with_real_engines(target_deal_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  analysis_record RECORD;
  deal_record RECORD;
  fund_record RECORD;
  enhanced_data jsonb := '{}';
  rubric_breakdown jsonb := '[]';
  analysis_engines jsonb := '{}';
  market_intelligence_data jsonb := '{}';
  financial_analysis_data jsonb := '{}';
  team_research_data jsonb := '{}';
  product_ip_data jsonb := '{}';
  thesis_alignment_data jsonb := '{}';
  notes_intelligence_data jsonb := '{}';
  real_insights jsonb := '{}';
  fund_type_value text;
BEGIN
  -- Get deal and fund data
  SELECT * INTO deal_record FROM deals WHERE id = target_deal_id;
  SELECT * INTO fund_record FROM funds WHERE id = deal_record.fund_id;
  
  -- Convert enum to text safely
  fund_type_value := CASE 
    WHEN fund_record.fund_type = 'venture_capital' THEN 'venture_capital'
    WHEN fund_record.fund_type = 'private_equity' THEN 'private_equity'
    ELSE 'venture_capital'  -- default fallback
  END;
  
  -- Get the latest deal analysis record
  SELECT * INTO analysis_record
  FROM deal_analyses 
  WHERE deal_id = target_deal_id
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- Get real engine results from deal_analysis_sources (fixed queries)
  SELECT 
    COALESCE(data_retrieved, '{}'::jsonb) INTO market_intelligence_data
  FROM deal_analysis_sources 
  WHERE deal_id = target_deal_id AND engine_name = 'market-intelligence-engine'
  ORDER BY retrieved_at DESC
  LIMIT 1;
  
  SELECT 
    COALESCE(data_retrieved, '{}'::jsonb) INTO financial_analysis_data
  FROM deal_analysis_sources 
  WHERE deal_id = target_deal_id AND engine_name = 'financial-engine'
  ORDER BY retrieved_at DESC
  LIMIT 1;
  
  SELECT 
    COALESCE(data_retrieved, '{}'::jsonb) INTO team_research_data
  FROM deal_analysis_sources 
  WHERE deal_id = target_deal_id AND engine_name = 'team-research-engine'
  ORDER BY retrieved_at DESC
  LIMIT 1;
  
  SELECT 
    COALESCE(data_retrieved, '{}'::jsonb) INTO product_ip_data
  FROM deal_analysis_sources 
  WHERE deal_id = target_deal_id AND engine_name = 'product-ip-engine'
  ORDER BY retrieved_at DESC
  LIMIT 1;
  
  SELECT 
    COALESCE(data_retrieved, '{}'::jsonb) INTO thesis_alignment_data
  FROM deal_analysis_sources 
  WHERE deal_id = target_deal_id AND engine_name = 'thesis-alignment-engine'
  ORDER BY retrieved_at DESC
  LIMIT 1;
  
  -- Get notes intelligence from actual notes analysis
  SELECT 
    jsonb_build_object(
      'sentiment', 
      CASE 
        WHEN AVG(CASE sentiment WHEN 'positive' THEN 3 WHEN 'neutral' THEN 2 WHEN 'negative' THEN 1 ELSE 2 END) > 2.5 THEN 'positive'
        WHEN AVG(CASE sentiment WHEN 'positive' THEN 3 WHEN 'neutral' THEN 2 WHEN 'negative' THEN 1 ELSE 2 END) < 1.5 THEN 'negative'
        ELSE 'mixed'
      END,
      'key_insights', COALESCE(array_agg(DISTINCT content) FILTER (WHERE content IS NOT NULL), ARRAY[]::text[]),
      'risk_flags', COALESCE(array_agg(DISTINCT content) FILTER (WHERE sentiment = 'negative'), ARRAY[]::text[]),
      'trend_indicators', COALESCE(array_agg(DISTINCT COALESCE(array_to_string(tags, ', '), '')) FILTER (WHERE tags IS NOT NULL), ARRAY[]::text[]),
      'confidence_level', CASE WHEN COUNT(*) > 5 THEN 85 WHEN COUNT(*) > 2 THEN 70 ELSE 60 END,
      'last_analyzed', MAX(created_at)
    ) INTO notes_intelligence_data
  FROM deal_notes 
  WHERE deal_id = target_deal_id;
  
  -- Build real analysis engines status
  analysis_engines := jsonb_build_object(
    'financial_engine', jsonb_build_object(
      'name', 'Financial Analysis Engine',
      'score', COALESCE(analysis_record.financial_score, 0),
      'confidence', CASE WHEN financial_analysis_data != '{}'::jsonb THEN 90 ELSE 50 END,
      'status', CASE WHEN financial_analysis_data != '{}'::jsonb THEN 'complete' ELSE 'pending' END,
      'last_run', COALESCE(analysis_record.updated_at, now()),
      'version', '3.1',
      'data_sources', CASE WHEN financial_analysis_data != '{}'::jsonb THEN 'real_analysis' ELSE 'placeholder' END
    ),
    'market_intelligence', jsonb_build_object(
      'name', 'Market Intelligence Engine', 
      'score', COALESCE(analysis_record.market_score, 0),
      'confidence', CASE WHEN market_intelligence_data != '{}'::jsonb THEN 95 ELSE 50 END,
      'status', CASE WHEN market_intelligence_data != '{}'::jsonb THEN 'complete' ELSE 'pending' END,
      'last_run', COALESCE(analysis_record.updated_at, now()),
      'version', '2.3',
      'data_sources', CASE WHEN market_intelligence_data != '{}'::jsonb THEN 'real_analysis' ELSE 'placeholder' END,
      'tam_sam_som_available', market_intelligence_data != '{}'::jsonb
    )
  );
  
  -- Build enhanced rubric breakdown with real engine data
  rubric_breakdown := jsonb_build_array(
    jsonb_build_object(
      'category', 'Team & Leadership',
      'score', COALESCE(analysis_record.leadership_score, 0),
      'confidence', CASE WHEN team_research_data != '{}'::jsonb THEN 90 ELSE 50 END,
      'weight', 20,
      'insights', CASE WHEN analysis_record.leadership_notes IS NOT NULL 
        THEN ARRAY[analysis_record.leadership_notes] 
        ELSE ARRAY['Real team analysis pending'] END,
      'strengths', ARRAY['Team analysis will be conducted'],
      'concerns', ARRAY['Team analysis pending']
    ),
    jsonb_build_object(
      'category', 'Market Opportunity', 
      'score', COALESCE(analysis_record.market_score, 0),
      'confidence', CASE WHEN market_intelligence_data != '{}'::jsonb THEN 95 ELSE 50 END,
      'weight', 25,
      'insights', CASE WHEN analysis_record.market_notes IS NOT NULL 
        THEN ARRAY[analysis_record.market_notes] 
        ELSE ARRAY['Market intelligence pending'] END,
      'strengths', ARRAY['Market intelligence will be calculated'],
      'concerns', ARRAY['Market analysis pending']
    )
  );
  
  -- Build complete enhanced analysis with real intelligence
  enhanced_data := jsonb_build_object(
    'rubric_breakdown', rubric_breakdown,
    'analysis_engines', analysis_engines,
    'analysis_completeness', 
      CASE 
        WHEN analysis_record.overall_score IS NOT NULL THEN 75 
        ELSE 60
      END,
    'last_comprehensive_analysis', COALESCE(analysis_record.updated_at, now()),
    'notes_intelligence', COALESCE(notes_intelligence_data, jsonb_build_object(
      'sentiment', 'pending',
      'key_insights', ARRAY['Notes intelligence pending'],
      'risk_flags', ARRAY['Risk analysis pending'],
      'trend_indicators', ARRAY['Trend analysis scheduled'],
      'confidence_level', 50,
      'last_analyzed', now()
    )),
    'fund_type_analysis', jsonb_build_object(
      'fund_type', fund_type_value,
      'focus_areas', ARRAY['Analysis will determine focus areas'],
      'strengths', ARRAY['Comprehensive analysis pending'],
      'concerns', ARRAY['Analysis pending'],
      'alignment_score', COALESCE(analysis_record.overall_score, 70),
      'strategic_recommendations', ARRAY['Strategic recommendations pending']
    ),
    'engines_completion_status', jsonb_build_object(
      'market_intelligence_complete', market_intelligence_data != '{}'::jsonb,
      'financial_analysis_complete', financial_analysis_data != '{}'::jsonb,
      'team_research_complete', team_research_data != '{}'::jsonb,
      'product_ip_complete', product_ip_data != '{}'::jsonb,
      'thesis_alignment_complete', thesis_alignment_data != '{}'::jsonb,
      'total_engines_complete', (
        CASE WHEN market_intelligence_data != '{}'::jsonb THEN 1 ELSE 0 END +
        CASE WHEN financial_analysis_data != '{}'::jsonb THEN 1 ELSE 0 END +
        CASE WHEN team_research_data != '{}'::jsonb THEN 1 ELSE 0 END +
        CASE WHEN product_ip_data != '{}'::jsonb THEN 1 ELSE 0 END +
        CASE WHEN thesis_alignment_data != '{}'::jsonb THEN 1 ELSE 0 END
      ),
      'pending_analysis_note', 'Engines will run when analysis queue processes'
    )
  );
  
  RETURN enhanced_data;
END;
$function$;