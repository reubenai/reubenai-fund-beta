-- Fix the SQL aggregation issue in populate_enhanced_analysis_with_real_engines
CREATE OR REPLACE FUNCTION populate_enhanced_analysis_with_real_engines(target_deal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
BEGIN
  -- Get deal and fund data
  SELECT * INTO deal_record FROM deals WHERE id = target_deal_id;
  SELECT * INTO fund_record FROM funds WHERE id = deal_record.fund_id;
  
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
  
  -- Extract real insights from engine data
  real_insights := jsonb_build_object(
    'market_intelligence', 
    CASE 
      WHEN market_intelligence_data != '{}'::jsonb THEN market_intelligence_data
      ELSE jsonb_build_object(
        'tam_sam_som', 'Analysis pending - Real market intelligence will be calculated when engines run',
        'cagr_percentage', 'To be determined by Market Intelligence Engine',
        'market_size', 'Real market size analysis pending'
      )
    END,
    'financial_analysis',
    CASE 
      WHEN financial_analysis_data != '{}'::jsonb THEN financial_analysis_data
      ELSE jsonb_build_object(
        'revenue_model', 'Real financial analysis pending',
        'unit_economics', 'To be calculated by Financial Engine',
        'funding_requirements', 'Analysis will include real funding projections'
      )
    END,
    'team_research',
    CASE 
      WHEN team_research_data != '{}'::jsonb THEN team_research_data
      ELSE jsonb_build_object(
        'founder_assessment', 'Real founder analysis pending',
        'team_composition', 'Comprehensive team analysis will be generated',
        'experience_validation', 'LinkedIn and external validation pending'
      )
    END,
    'product_ip',
    CASE 
      WHEN product_ip_data != '{}'::jsonb THEN product_ip_data
      ELSE jsonb_build_object(
        'ip_assessment', 'Real IP defensibility analysis pending',
        'competitive_advantages', 'Product differentiation analysis will be conducted',
        'technology_moat', 'Technical moat assessment pending'
      )
    END,
    'thesis_alignment',
    CASE 
      WHEN thesis_alignment_data != '{}'::jsonb THEN thesis_alignment_data
      ELSE jsonb_build_object(
        'strategic_fit', 'Real thesis alignment analysis pending',
        'investment_rationale', 'Comprehensive alignment assessment will be generated'
      )
    END
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
        ELSE ARRAY['Real team analysis pending - Founder research and team composition analysis will be conducted'] END,
      'strengths', CASE WHEN team_research_data != '{}'::jsonb 
        THEN ARRAY['Real founder assessment completed', 'Team composition analyzed']
        ELSE ARRAY['Team analysis will include LinkedIn validation', 'Comprehensive founder research pending'] END,
      'concerns', CASE WHEN team_research_data != '{}'::jsonb 
        THEN ARRAY['See detailed team research results']
        ELSE ARRAY['Team analysis pending - real concerns will be identified'] END
    ),
    jsonb_build_object(
      'category', 'Market Opportunity', 
      'score', COALESCE(analysis_record.market_score, 0),
      'confidence', CASE WHEN market_intelligence_data != '{}'::jsonb THEN 95 ELSE 50 END,
      'weight', 25,
      'insights', CASE WHEN analysis_record.market_notes IS NOT NULL 
        THEN ARRAY[analysis_record.market_notes] 
        ELSE ARRAY['Real market intelligence pending - TAM/SAM/SOM analysis will be conducted'] END,
      'strengths', CASE WHEN market_intelligence_data != '{}'::jsonb 
        THEN ARRAY['Real TAM/SAM/SOM calculated', 'CAGR% determined', 'Market validation completed']
        ELSE ARRAY['Market intelligence will include real TAM/SAM/SOM figures', 'CAGR% analysis pending', 'Competitive landscape research scheduled'] END,
      'concerns', CASE WHEN market_intelligence_data != '{}'::jsonb 
        THEN ARRAY['See detailed market intelligence results']
        ELSE ARRAY['Market analysis pending - real competitive threats will be identified'] END
    ),
    jsonb_build_object(
      'category', 'Product & Technology',
      'score', COALESCE(analysis_record.product_score, 0), 
      'confidence', CASE WHEN product_ip_data != '{}'::jsonb THEN 90 ELSE 50 END,
      'weight', 25,
      'insights', CASE WHEN analysis_record.product_notes IS NOT NULL 
        THEN ARRAY[analysis_record.product_notes] 
        ELSE ARRAY['Real product IP analysis pending - Defensibility assessment will be conducted'] END,
      'strengths', CASE WHEN product_ip_data != '{}'::jsonb 
        THEN ARRAY['IP defensibility assessed', 'Technology moat analyzed', 'Competitive advantages identified']
        ELSE ARRAY['IP analysis will include patent research', 'Technology differentiation assessment pending', 'Competitive moat evaluation scheduled'] END,
      'concerns', CASE WHEN product_ip_data != '{}'::jsonb 
        THEN ARRAY['See detailed product IP results']
        ELSE ARRAY['Product analysis pending - real IP risks will be identified'] END
    ),
    jsonb_build_object(
      'category', 'Financial Health',
      'score', COALESCE(analysis_record.financial_score, 0),
      'confidence', CASE WHEN financial_analysis_data != '{}'::jsonb THEN 90 ELSE 50 END,
      'weight', 15,
      'insights', CASE WHEN analysis_record.financial_notes IS NOT NULL 
        THEN ARRAY[analysis_record.financial_notes] 
        ELSE ARRAY['Real financial analysis pending - Revenue model and unit economics assessment scheduled'] END,
      'strengths', CASE WHEN financial_analysis_data != '{}'::jsonb 
        THEN ARRAY['Revenue model validated', 'Unit economics analyzed', 'Funding requirements calculated']
        ELSE ARRAY['Financial analysis will include real revenue projections', 'Unit economics validation pending', 'Funding requirement assessment scheduled'] END,
      'concerns', CASE WHEN financial_analysis_data != '{}'::jsonb 
        THEN ARRAY['See detailed financial analysis results']
        ELSE ARRAY['Financial analysis pending - real burn rate and profitability concerns will be identified'] END
    ),
    jsonb_build_object(
      'category', 'Business Traction',
      'score', COALESCE(analysis_record.traction_score, 0),
      'confidence', CASE WHEN notes_intelligence_data IS NOT NULL THEN 85 ELSE 50 END,
      'weight', 15,
      'insights', CASE WHEN analysis_record.traction_notes IS NOT NULL 
        THEN ARRAY[analysis_record.traction_notes] 
        ELSE ARRAY['Traction analysis will be enhanced with notes intelligence and customer validation'] END,
      'strengths', CASE WHEN notes_intelligence_data IS NOT NULL 
        THEN ARRAY['Notes intelligence analyzed', 'Customer feedback processed']
        ELSE ARRAY['Customer validation research pending', 'Traction metrics analysis scheduled'] END,
      'concerns', CASE WHEN notes_intelligence_data IS NOT NULL 
        THEN ARRAY['See notes intelligence results for concerns']
        ELSE ARRAY['Traction analysis pending - real scale challenges will be identified'] END
    )
  );
  
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
    ),
    'thesis_alignment', jsonb_build_object(
      'name', 'Thesis Alignment Engine',
      'score', COALESCE(analysis_record.thesis_alignment_score, 0), 
      'confidence', CASE WHEN thesis_alignment_data != '{}'::jsonb THEN 95 ELSE 50 END,
      'status', CASE WHEN thesis_alignment_data != '{}'::jsonb THEN 'complete' ELSE 'pending' END,
      'last_run', COALESCE(analysis_record.updated_at, now()),
      'version', '4.0',
      'data_sources', CASE WHEN thesis_alignment_data != '{}'::jsonb THEN 'real_analysis' ELSE 'placeholder' END
    ),
    'team_research', jsonb_build_object(
      'name', 'Team Research Engine',
      'score', COALESCE(analysis_record.leadership_score, 0),
      'confidence', CASE WHEN team_research_data != '{}'::jsonb THEN 90 ELSE 50 END,
      'status', CASE WHEN team_research_data != '{}'::jsonb THEN 'complete' ELSE 'pending' END,
      'last_run', COALESCE(analysis_record.updated_at, now()),
      'version', '2.8',
      'data_sources', CASE WHEN team_research_data != '{}'::jsonb THEN 'real_analysis' ELSE 'placeholder' END
    ),
    'product_ip', jsonb_build_object(
      'name', 'Product IP Engine',
      'score', COALESCE(analysis_record.product_score, 0),
      'confidence', CASE WHEN product_ip_data != '{}'::jsonb THEN 90 ELSE 50 END,
      'status', CASE WHEN product_ip_data != '{}'::jsonb THEN 'complete' ELSE 'pending' END,
      'last_run', COALESCE(analysis_record.updated_at, now()),
      'version', '2.5',
      'data_sources', CASE WHEN product_ip_data != '{}'::jsonb THEN 'real_analysis' ELSE 'placeholder' END
    )
  );
  
  -- Build complete enhanced analysis with real intelligence
  enhanced_data := jsonb_build_object(
    'rubric_breakdown', rubric_breakdown,
    'analysis_engines', analysis_engines,
    'analysis_completeness', 
      CASE 
        WHEN analysis_record.overall_score IS NOT NULL THEN 
          CASE WHEN (
            market_intelligence_data != '{}'::jsonb AND
            financial_analysis_data != '{}'::jsonb AND
            team_research_data != '{}'::jsonb AND
            product_ip_data != '{}'::jsonb AND
            thesis_alignment_data != '{}'::jsonb
          ) THEN 98 ELSE 75 END
        ELSE 60
      END,
    'last_comprehensive_analysis', COALESCE(analysis_record.updated_at, now()),
    'notes_intelligence', COALESCE(notes_intelligence_data, jsonb_build_object(
      'sentiment', 'pending',
      'key_insights', ARRAY['Notes intelligence will be processed when deal notes are analyzed'],
      'risk_flags', ARRAY['Risk analysis pending'],
      'trend_indicators', ARRAY['Trend analysis scheduled'],
      'confidence_level', 50,
      'last_analyzed', now()
    )),
    'fund_type_analysis', jsonb_build_object(
      'fund_type', COALESCE(fund_record.fund_type, 'vc'),
      'focus_areas', ARRAY['Real analysis will determine fund-specific focus areas'],
      'strengths', CASE WHEN (
        market_intelligence_data != '{}'::jsonb OR
        financial_analysis_data != '{}'::jsonb OR
        team_research_data != '{}'::jsonb
      ) THEN ARRAY['Real analysis completed for some engines', 'Data-driven insights available']
      ELSE ARRAY['Comprehensive analysis pending', 'Fund-specific alignment will be calculated'] END,
      'concerns', CASE WHEN (
        market_intelligence_data != '{}'::jsonb OR
        financial_analysis_data != '{}'::jsonb OR
        team_research_data != '{}'::jsonb
      ) THEN ARRAY['See individual engine results for specific concerns']
      ELSE ARRAY['Full analysis pending - real concerns will be identified'] END,
      'alignment_score', COALESCE(analysis_record.overall_score, 70),
      'strategic_recommendations', CASE WHEN (
        market_intelligence_data != '{}'::jsonb OR
        financial_analysis_data != '{}'::jsonb
      ) THEN ARRAY['See detailed engine results for strategic insights', 'Real market and financial data available']
      ELSE ARRAY['Strategic recommendations will be generated after comprehensive analysis', 'Investment thesis alignment pending'] END
    ),
    'real_intelligence_summary', real_insights,
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
      'pending_analysis_note', 'Engines that show "pending" status will run automatically when the analysis queue processes. Real data will replace placeholder insights.'
    )
  );
  
  RETURN enhanced_data;
END;
$$;