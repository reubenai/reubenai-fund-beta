-- Enhanced Analysis Migration: Use datapoints tables instead of unreliable engine sources
CREATE OR REPLACE FUNCTION public.populate_enhanced_analysis_with_real_engines(target_deal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deal_record RECORD;
  fund_record RECORD;
  vc_datapoints RECORD;
  pe_datapoints RECORD;
  enhanced_data jsonb := '{}';
  rubric_breakdown jsonb := '[]';
  analysis_engines jsonb := '{}';
  notes_intelligence_data jsonb := '{}';
  fund_type_value text;
  data_completeness_score integer := 0;
  total_possible_score integer := 0;
  confidence_level integer := 50;
BEGIN
  -- Get deal and fund data
  SELECT * INTO deal_record FROM deals WHERE id = target_deal_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Deal not found');
  END IF;
  
  SELECT * INTO fund_record FROM funds WHERE id = deal_record.fund_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Fund not found');
  END IF;
  
  -- Convert enum to text safely
  fund_type_value := CASE 
    WHEN fund_record.fund_type = 'venture_capital' THEN 'venture_capital'
    WHEN fund_record.fund_type = 'private_equity' THEN 'private_equity'
    ELSE 'venture_capital'  -- default fallback
  END;
  
  -- Get datapoints based on fund type
  IF fund_type_value = 'venture_capital' THEN
    SELECT * INTO vc_datapoints
    FROM deal_analysis_datapoints_vc 
    WHERE deal_id = target_deal_id
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Calculate VC data completeness and confidence
    IF vc_datapoints.id IS NOT NULL THEN
      -- Count populated VC fields (key fields for analysis)
      data_completeness_score := 
        CASE WHEN vc_datapoints.tam IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN vc_datapoints.sam IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN vc_datapoints.som IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN vc_datapoints.cagr IS NOT NULL THEN 8 ELSE 0 END +
        CASE WHEN vc_datapoints.competitors IS NOT NULL AND array_length(vc_datapoints.competitors, 1) > 0 THEN 8 ELSE 0 END +
        CASE WHEN vc_datapoints.key_customers IS NOT NULL AND array_length(vc_datapoints.key_customers, 1) > 0 THEN 8 ELSE 0 END +
        CASE WHEN vc_datapoints.growth_drivers IS NOT NULL AND array_length(vc_datapoints.growth_drivers, 1) > 0 THEN 8 ELSE 0 END +
        CASE WHEN vc_datapoints.funding_stage IS NOT NULL THEN 6 ELSE 0 END +
        CASE WHEN vc_datapoints.employee_count IS NOT NULL THEN 6 ELSE 0 END +
        CASE WHEN vc_datapoints.business_model IS NOT NULL THEN 6 ELSE 0 END +
        CASE WHEN vc_datapoints.retention_rate IS NOT NULL THEN 8 ELSE 0 END +
        CASE WHEN vc_datapoints.ltv_cac_ratio IS NOT NULL THEN 8 ELSE 0 END +
        CASE WHEN vc_datapoints.technology_stack IS NOT NULL AND array_length(vc_datapoints.technology_stack, 1) > 0 THEN 6 ELSE 0 END;
      
      total_possible_score := 100;
      confidence_level := LEAST(95, GREATEST(50, data_completeness_score));
      
      -- Build VC rubric breakdown with real datapoints
      rubric_breakdown := jsonb_build_array(
        jsonb_build_object(
          'category', 'Market Opportunity',
          'score', CASE 
            WHEN vc_datapoints.tam IS NOT NULL AND vc_datapoints.tam > 1000000000 THEN 85
            WHEN vc_datapoints.tam IS NOT NULL AND vc_datapoints.tam > 100000000 THEN 75
            WHEN vc_datapoints.tam IS NOT NULL THEN 65
            ELSE 40
          END,
          'confidence', CASE WHEN vc_datapoints.tam IS NOT NULL THEN 90 ELSE 40 END,
          'weight', 25,
          'insights', ARRAY[
            CASE WHEN vc_datapoints.tam IS NOT NULL 
              THEN 'TAM: $' || (vc_datapoints.tam / 1000000)::text || 'M' 
              ELSE 'Market size analysis pending' END,
            CASE WHEN vc_datapoints.cagr IS NOT NULL 
              THEN 'Market growth rate: ' || vc_datapoints.cagr::text || '%'
              ELSE 'Growth analysis pending' END
          ],
          'strengths', CASE WHEN vc_datapoints.growth_drivers IS NOT NULL 
            THEN vc_datapoints.growth_drivers 
            ELSE ARRAY['Market analysis will be conducted'] END,
          'concerns', CASE WHEN array_length(vc_datapoints.competitors, 1) > 5 
            THEN ARRAY['Highly competitive market']
            ELSE ARRAY['Competitive analysis pending'] END
        ),
        jsonb_build_object(
          'category', 'Product & Technology',
          'score', CASE 
            WHEN vc_datapoints.technology_readiness_level >= 8 THEN 80
            WHEN vc_datapoints.technology_readiness_level >= 6 THEN 70
            WHEN vc_datapoints.technology_readiness_level IS NOT NULL THEN 60
            ELSE 45
          END,
          'confidence', CASE WHEN vc_datapoints.technology_stack IS NOT NULL THEN 85 ELSE 40 END,
          'weight', 20,
          'insights', ARRAY[
            CASE WHEN vc_datapoints.technology_readiness_level IS NOT NULL 
              THEN 'Technology readiness level: ' || vc_datapoints.technology_readiness_level::text 
              ELSE 'Technology assessment pending' END
          ],
          'strengths', CASE WHEN vc_datapoints.technology_moats IS NOT NULL 
            THEN vc_datapoints.technology_moats 
            ELSE ARRAY['Technology analysis will be conducted'] END,
          'concerns', ARRAY['Technology validation pending']
        ),
        jsonb_build_object(
          'category', 'Business Traction',
          'score', CASE 
            WHEN vc_datapoints.ltv_cac_ratio >= 3 THEN 85
            WHEN vc_datapoints.ltv_cac_ratio >= 2 THEN 75
            WHEN vc_datapoints.ltv_cac_ratio IS NOT NULL THEN 65
            ELSE 45
          END,
          'confidence', CASE WHEN vc_datapoints.ltv_cac_ratio IS NOT NULL THEN 90 ELSE 40 END,
          'weight', 20,
          'insights', ARRAY[
            CASE WHEN vc_datapoints.ltv_cac_ratio IS NOT NULL 
              THEN 'LTV/CAC ratio: ' || vc_datapoints.ltv_cac_ratio::text 
              ELSE 'Unit economics analysis pending' END,
            CASE WHEN vc_datapoints.retention_rate IS NOT NULL 
              THEN 'Customer retention: ' || vc_datapoints.retention_rate::text || '%'
              ELSE 'Retention analysis pending' END
          ],
          'strengths', CASE WHEN vc_datapoints.key_customers IS NOT NULL 
            THEN vc_datapoints.key_customers 
            ELSE ARRAY['Customer analysis will be conducted'] END,
          'concerns', ARRAY['Traction metrics validation pending']
        ),
        jsonb_build_object(
          'category', 'Team & Leadership',
          'score', CASE 
            WHEN vc_datapoints.leadership_experience IS NOT NULL AND array_length(vc_datapoints.leadership_experience, 1) >= 3 THEN 80
            WHEN vc_datapoints.leadership_experience IS NOT NULL THEN 70
            ELSE 45
          END,
          'confidence', CASE WHEN vc_datapoints.leadership_experience IS NOT NULL THEN 85 ELSE 40 END,
          'weight', 20,
          'insights', ARRAY[
            CASE WHEN vc_datapoints.leadership_experience IS NOT NULL 
              THEN 'Leadership experience documented' 
              ELSE 'Team analysis pending' END
          ],
          'strengths', CASE WHEN vc_datapoints.leadership_experience IS NOT NULL 
            THEN vc_datapoints.leadership_experience 
            ELSE ARRAY['Team analysis will be conducted'] END,
          'concerns', ARRAY['Team assessment pending']
        ),
        jsonb_build_object(
          'category', 'Financial Health',
          'score', CASE 
            WHEN vc_datapoints.capital_efficiency_ratios IS NOT NULL THEN 75
            WHEN vc_datapoints.profitability_metrics IS NOT NULL THEN 65
            ELSE 45
          END,
          'confidence', CASE WHEN vc_datapoints.profitability_metrics IS NOT NULL THEN 80 ELSE 40 END,
          'weight', 15,
          'insights', ARRAY[
            CASE WHEN vc_datapoints.profitability_metrics IS NOT NULL 
              THEN 'Financial metrics available' 
              ELSE 'Financial analysis pending' END
          ],
          'strengths', ARRAY['Financial analysis will be conducted'],
          'concerns', ARRAY['Financial validation pending']
        )
      );
      
      -- Build VC analysis engines status
      analysis_engines := jsonb_build_object(
        'market_intelligence', jsonb_build_object(
          'name', 'Market Analysis Engine',
          'score', CASE WHEN vc_datapoints.tam IS NOT NULL THEN 85 ELSE 0 END,
          'confidence', CASE WHEN vc_datapoints.tam IS NOT NULL THEN 95 ELSE 30 END,
          'status', CASE WHEN vc_datapoints.tam IS NOT NULL THEN 'completed' ELSE 'pending' END,
          'last_run', vc_datapoints.updated_at,
          'version', '4.0-datapoints',
          'analysis_data', CASE WHEN vc_datapoints.tam IS NOT NULL 
            THEN jsonb_build_object(
              'tam', vc_datapoints.tam,
              'sam', vc_datapoints.sam,
              'som', vc_datapoints.som,
              'cagr', vc_datapoints.cagr,
              'competitors', vc_datapoints.competitors
            ) 
            ELSE '{}'::jsonb END
        ),
        'traction_engine', jsonb_build_object(
          'name', 'Traction Analysis Engine',
          'score', CASE WHEN vc_datapoints.ltv_cac_ratio IS NOT NULL THEN 80 ELSE 0 END,
          'confidence', CASE WHEN vc_datapoints.ltv_cac_ratio IS NOT NULL THEN 90 ELSE 30 END,
          'status', CASE WHEN vc_datapoints.ltv_cac_ratio IS NOT NULL THEN 'completed' ELSE 'pending' END,
          'last_run', vc_datapoints.updated_at,
          'version', '4.0-datapoints',
          'analysis_data', CASE WHEN vc_datapoints.ltv_cac_ratio IS NOT NULL 
            THEN jsonb_build_object(
              'ltv_cac_ratio', vc_datapoints.ltv_cac_ratio,
              'retention_rate', vc_datapoints.retention_rate,
              'key_customers', vc_datapoints.key_customers
            ) 
            ELSE '{}'::jsonb END
        ),
        'technology_engine', jsonb_build_object(
          'name', 'Technology Assessment Engine',
          'score', CASE WHEN vc_datapoints.technology_readiness_level IS NOT NULL THEN 75 ELSE 0 END,
          'confidence', CASE WHEN vc_datapoints.technology_stack IS NOT NULL THEN 85 ELSE 30 END,
          'status', CASE WHEN vc_datapoints.technology_stack IS NOT NULL THEN 'completed' ELSE 'pending' END,
          'last_run', vc_datapoints.updated_at,
          'version', '4.0-datapoints',
          'analysis_data', CASE WHEN vc_datapoints.technology_stack IS NOT NULL 
            THEN jsonb_build_object(
              'technology_stack', vc_datapoints.technology_stack,
              'technology_moats', vc_datapoints.technology_moats,
              'readiness_level', vc_datapoints.technology_readiness_level
            ) 
            ELSE '{}'::jsonb END
        )
      );
    END IF;
    
  ELSE -- Private Equity
    SELECT * INTO pe_datapoints
    FROM deal_analysis_datapoints_pe 
    WHERE deal_id = target_deal_id
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Calculate PE data completeness and confidence
    IF pe_datapoints.id IS NOT NULL THEN
      -- Count populated PE fields (key fields for analysis)
      data_completeness_score := 
        CASE WHEN pe_datapoints.revenue_growth_rate IS NOT NULL THEN 12 ELSE 0 END +
        CASE WHEN pe_datapoints.ebitda_margin IS NOT NULL THEN 12 ELSE 0 END +
        CASE WHEN pe_datapoints.ebitda_growth_rate IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN pe_datapoints.return_on_invested_capital IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN pe_datapoints.free_cash_flow_yield IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN pe_datapoints.market_share IS NOT NULL THEN 8 ELSE 0 END +
        CASE WHEN pe_datapoints.competitive_advantages IS NOT NULL AND array_length(pe_datapoints.competitive_advantages, 1) > 0 THEN 8 ELSE 0 END +
        CASE WHEN pe_datapoints.operational_efficiency_metrics IS NOT NULL THEN 8 ELSE 0 END +
        CASE WHEN pe_datapoints.management_quality_assessment IS NOT NULL THEN 8 ELSE 0 END +
        CASE WHEN pe_datapoints.employee_count IS NOT NULL THEN 6 ELSE 0 END +
        CASE WHEN pe_datapoints.expansion_markets IS NOT NULL AND array_length(pe_datapoints.expansion_markets, 1) > 0 THEN 8 ELSE 0 END;
      
      total_possible_score := 100;
      confidence_level := LEAST(95, GREATEST(50, data_completeness_score));
      
      -- Build PE rubric breakdown with real datapoints
      rubric_breakdown := jsonb_build_array(
        jsonb_build_object(
          'category', 'Financial Performance',
          'score', CASE 
            WHEN pe_datapoints.ebitda_margin >= 0.2 THEN 90
            WHEN pe_datapoints.ebitda_margin >= 0.15 THEN 80
            WHEN pe_datapoints.ebitda_margin IS NOT NULL THEN 70
            ELSE 45
          END,
          'confidence', CASE WHEN pe_datapoints.ebitda_margin IS NOT NULL THEN 95 ELSE 40 END,
          'weight', 30,
          'insights', ARRAY[
            CASE WHEN pe_datapoints.ebitda_margin IS NOT NULL 
              THEN 'EBITDA margin: ' || (pe_datapoints.ebitda_margin * 100)::text || '%' 
              ELSE 'Financial metrics analysis pending' END,
            CASE WHEN pe_datapoints.revenue_growth_rate IS NOT NULL 
              THEN 'Revenue growth: ' || pe_datapoints.revenue_growth_rate::text || '%'
              ELSE 'Growth analysis pending' END
          ],
          'strengths', ARRAY[
            CASE WHEN pe_datapoints.return_on_invested_capital IS NOT NULL AND pe_datapoints.return_on_invested_capital > 0.15 
              THEN 'Strong ROIC performance' 
              ELSE 'Financial analysis will be conducted' END
          ],
          'concerns', ARRAY['Financial validation pending']
        ),
        jsonb_build_object(
          'category', 'Market Position',
          'score', CASE 
            WHEN pe_datapoints.market_share >= 0.2 THEN 85
            WHEN pe_datapoints.market_share >= 0.1 THEN 75
            WHEN pe_datapoints.market_share IS NOT NULL THEN 65
            ELSE 45
          END,
          'confidence', CASE WHEN pe_datapoints.market_share IS NOT NULL THEN 90 ELSE 40 END,
          'weight', 25,
          'insights', ARRAY[
            CASE WHEN pe_datapoints.market_share IS NOT NULL 
              THEN 'Market share: ' || (pe_datapoints.market_share * 100)::text || '%' 
              ELSE 'Market position analysis pending' END
          ],
          'strengths', CASE WHEN pe_datapoints.competitive_advantages IS NOT NULL 
            THEN pe_datapoints.competitive_advantages 
            ELSE ARRAY['Competitive analysis will be conducted'] END,
          'concerns', ARRAY['Market assessment pending']
        ),
        jsonb_build_object(
          'category', 'Operational Excellence',
          'score', CASE 
            WHEN pe_datapoints.operational_efficiency_metrics IS NOT NULL THEN 80
            WHEN pe_datapoints.cost_reduction_opportunities IS NOT NULL THEN 70
            ELSE 45
          END,
          'confidence', CASE WHEN pe_datapoints.operational_efficiency_metrics IS NOT NULL THEN 85 ELSE 40 END,
          'weight', 20,
          'insights', ARRAY[
            CASE WHEN pe_datapoints.operational_efficiency_metrics IS NOT NULL 
              THEN 'Operational metrics documented' 
              ELSE 'Operational analysis pending' END
          ],
          'strengths', CASE WHEN pe_datapoints.process_optimization_potential IS NOT NULL 
            THEN pe_datapoints.process_optimization_potential 
            ELSE ARRAY['Operational analysis will be conducted'] END,
          'concerns', ARRAY['Operational assessment pending']
        ),
        jsonb_build_object(
          'category', 'Management Quality',
          'score', CASE 
            WHEN pe_datapoints.management_quality_assessment IS NOT NULL THEN 75
            WHEN pe_datapoints.leadership_track_record IS NOT NULL THEN 70
            ELSE 45
          END,
          'confidence', CASE WHEN pe_datapoints.management_quality_assessment IS NOT NULL THEN 85 ELSE 40 END,
          'weight', 15,
          'insights', ARRAY[
            CASE WHEN pe_datapoints.management_quality_assessment IS NOT NULL 
              THEN 'Management assessment completed' 
              ELSE 'Management analysis pending' END
          ],
          'strengths', ARRAY['Management analysis will be conducted'],
          'concerns', ARRAY['Management assessment pending']
        ),
        jsonb_build_object(
          'category', 'Growth Potential',
          'score', CASE 
            WHEN pe_datapoints.organic_growth_potential IS NOT NULL THEN 80
            WHEN array_length(pe_datapoints.expansion_markets, 1) > 2 THEN 75
            WHEN pe_datapoints.expansion_markets IS NOT NULL THEN 65
            ELSE 45
          END,
          'confidence', CASE WHEN pe_datapoints.expansion_markets IS NOT NULL THEN 80 ELSE 40 END,
          'weight', 10,
          'insights', ARRAY[
            CASE WHEN pe_datapoints.expansion_markets IS NOT NULL 
              THEN 'Growth opportunities identified' 
              ELSE 'Growth analysis pending' END
          ],
          'strengths', CASE WHEN pe_datapoints.expansion_markets IS NOT NULL 
            THEN pe_datapoints.expansion_markets 
            ELSE ARRAY['Growth analysis will be conducted'] END,
          'concerns', ARRAY['Growth validation pending']
        )
      );
      
      -- Build PE analysis engines status
      analysis_engines := jsonb_build_object(
        'financial_engine', jsonb_build_object(
          'name', 'Financial Analysis Engine',
          'score', CASE WHEN pe_datapoints.ebitda_margin IS NOT NULL THEN 90 ELSE 0 END,
          'confidence', CASE WHEN pe_datapoints.ebitda_margin IS NOT NULL THEN 95 ELSE 30 END,
          'status', CASE WHEN pe_datapoints.ebitda_margin IS NOT NULL THEN 'completed' ELSE 'pending' END,
          'last_run', pe_datapoints.updated_at,
          'version', '4.0-datapoints',
          'analysis_data', CASE WHEN pe_datapoints.ebitda_margin IS NOT NULL 
            THEN jsonb_build_object(
              'ebitda_margin', pe_datapoints.ebitda_margin,
              'revenue_growth_rate', pe_datapoints.revenue_growth_rate,
              'return_on_invested_capital', pe_datapoints.return_on_invested_capital
            ) 
            ELSE '{}'::jsonb END
        ),
        'market_engine', jsonb_build_object(
          'name', 'Market Position Engine',
          'score', CASE WHEN pe_datapoints.market_share IS NOT NULL THEN 85 ELSE 0 END,
          'confidence', CASE WHEN pe_datapoints.market_share IS NOT NULL THEN 90 ELSE 30 END,
          'status', CASE WHEN pe_datapoints.market_share IS NOT NULL THEN 'completed' ELSE 'pending' END,
          'last_run', pe_datapoints.updated_at,
          'version', '4.0-datapoints',
          'analysis_data', CASE WHEN pe_datapoints.market_share IS NOT NULL 
            THEN jsonb_build_object(
              'market_share', pe_datapoints.market_share,
              'competitive_advantages', pe_datapoints.competitive_advantages,
              'market_position', pe_datapoints.market_position
            ) 
            ELSE '{}'::jsonb END
        ),
        'operational_engine', jsonb_build_object(
          'name', 'Operational Excellence Engine',
          'score', CASE WHEN pe_datapoints.operational_efficiency_metrics IS NOT NULL THEN 80 ELSE 0 END,
          'confidence', CASE WHEN pe_datapoints.operational_efficiency_metrics IS NOT NULL THEN 85 ELSE 30 END,
          'status', CASE WHEN pe_datapoints.operational_efficiency_metrics IS NOT NULL THEN 'completed' ELSE 'pending' END,
          'last_run', pe_datapoints.updated_at,
          'version', '4.0-datapoints',
          'analysis_data', CASE WHEN pe_datapoints.operational_efficiency_metrics IS NOT NULL 
            THEN jsonb_build_object(
              'operational_efficiency_metrics', pe_datapoints.operational_efficiency_metrics,
              'cost_reduction_opportunities', pe_datapoints.cost_reduction_opportunities
            ) 
            ELSE '{}'::jsonb END
        )
      );
    END IF;
  END IF;
  
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
  
  -- If no datapoints found, use minimal structure
  IF (fund_type_value = 'venture_capital' AND vc_datapoints.id IS NULL) OR 
     (fund_type_value = 'private_equity' AND pe_datapoints.id IS NULL) THEN
    
    rubric_breakdown := jsonb_build_array(
      jsonb_build_object(
        'category', 'Data Collection',
        'score', 0,
        'confidence', 20,
        'weight', 100,
        'insights', ARRAY['Waterfall data collection in progress'],
        'strengths', ARRAY['Data enrichment pipeline active'],
        'concerns', ARRAY['Analysis pending data collection completion']
      )
    );
    
    analysis_engines := jsonb_build_object(
      'data_collection', jsonb_build_object(
        'name', 'Data Collection Engine',
        'score', 0,
        'confidence', 20,
        'status', 'pending',
        'last_run', now(),
        'version', '4.0-datapoints',
        'analysis_data', '{}'::jsonb
      )
    );
    
    data_completeness_score := 0;
    confidence_level := 20;
  END IF;
  
  -- Build complete enhanced analysis with datapoints-based intelligence
  enhanced_data := jsonb_build_object(
    'rubric_breakdown', rubric_breakdown,
    'analysis_engines', analysis_engines,
    'analysis_completeness', data_completeness_score,
    'confidence_level', confidence_level,
    'data_source', 'datapoints_waterfall',
    'last_comprehensive_analysis', COALESCE(
      CASE WHEN fund_type_value = 'venture_capital' THEN vc_datapoints.updated_at ELSE pe_datapoints.updated_at END,
      now()
    ),
    'notes_intelligence', COALESCE(notes_intelligence_data, jsonb_build_object(
      'sentiment', 'pending',
      'key_insights', ARRAY['Notes analysis pending'],
      'risk_flags', ARRAY['Risk analysis pending'],
      'trend_indicators', ARRAY['Trend analysis scheduled'],
      'confidence_level', 50,
      'last_analyzed', now()
    )),
    'fund_type_analysis', jsonb_build_object(
      'fund_type', fund_type_value,
      'data_completeness_score', data_completeness_score,
      'total_possible_score', total_possible_score,
      'confidence_level', confidence_level,
      'datapoints_available', CASE 
        WHEN fund_type_value = 'venture_capital' THEN vc_datapoints.id IS NOT NULL
        ELSE pe_datapoints.id IS NOT NULL 
      END,
      'last_enrichment', CASE 
        WHEN fund_type_value = 'venture_capital' THEN vc_datapoints.updated_at
        ELSE pe_datapoints.updated_at 
      END
    ),
    'data_quality_indicators', jsonb_build_object(
      'has_real_data', CASE 
        WHEN fund_type_value = 'venture_capital' THEN vc_datapoints.id IS NOT NULL
        ELSE pe_datapoints.id IS NOT NULL 
      END,
      'data_freshness', CASE 
        WHEN fund_type_value = 'venture_capital' AND vc_datapoints.updated_at > (now() - interval '7 days') THEN 'fresh'
        WHEN fund_type_value = 'private_equity' AND pe_datapoints.updated_at > (now() - interval '7 days') THEN 'fresh'
        WHEN fund_type_value = 'venture_capital' AND vc_datapoints.id IS NOT NULL THEN 'stale'
        WHEN fund_type_value = 'private_equity' AND pe_datapoints.id IS NOT NULL THEN 'stale'
        ELSE 'missing'
      END,
      'source_engines', CASE 
        WHEN fund_type_value = 'venture_capital' THEN COALESCE(vc_datapoints.source_engines, ARRAY[]::text[])
        ELSE COALESCE(pe_datapoints.source_engines, ARRAY[]::text[])
      END,
      'completeness_breakdown', jsonb_build_object(
        'score', data_completeness_score,
        'max_score', total_possible_score,
        'percentage', CASE WHEN total_possible_score > 0 THEN (data_completeness_score * 100 / total_possible_score) ELSE 0 END
      )
    )
  );
  
  RETURN enhanced_data;
END;
$function$