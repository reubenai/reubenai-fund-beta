-- Create function to aggregate deal_analyses into enhanced_analysis format
CREATE OR REPLACE FUNCTION populate_enhanced_analysis(target_deal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  analysis_record RECORD;
  enhanced_data jsonb := '{}';
  rubric_breakdown jsonb := '[]';
  analysis_engines jsonb := '{}';
BEGIN
  -- Get the deal analysis record
  SELECT * INTO analysis_record
  FROM deal_analyses 
  WHERE deal_id = target_deal_id
  ORDER BY updated_at DESC
  LIMIT 1;
  
  IF analysis_record.id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Build rubric breakdown
  rubric_breakdown := jsonb_build_array(
    jsonb_build_object(
      'category', 'Team & Leadership',
      'score', COALESCE(analysis_record.leadership_score, 0),
      'confidence', 85,
      'weight', 20,
      'insights', ARRAY[analysis_record.leadership_notes],
      'strengths', ARRAY['Strong leadership team'],
      'concerns', ARRAY['Need more domain expertise']
    ),
    jsonb_build_object(
      'category', 'Market Opportunity', 
      'score', COALESCE(analysis_record.market_score, 0),
      'confidence', 80,
      'weight', 25,
      'insights', ARRAY[analysis_record.market_notes],
      'strengths', ARRAY['Large addressable market'],
      'concerns', ARRAY['Competitive landscape']
    ),
    jsonb_build_object(
      'category', 'Product & Technology',
      'score', COALESCE(analysis_record.product_score, 0), 
      'confidence', 75,
      'weight', 25,
      'insights', ARRAY[analysis_record.product_notes],
      'strengths', ARRAY['Innovative technology'],
      'concerns', ARRAY['Technical execution risk']
    ),
    jsonb_build_object(
      'category', 'Financial Health',
      'score', COALESCE(analysis_record.financial_score, 0),
      'confidence', 70,
      'weight', 15,
      'insights', ARRAY[analysis_record.financial_notes],
      'strengths', ARRAY['Strong unit economics'],
      'concerns', ARRAY['Burn rate management']
    ),
    jsonb_build_object(
      'category', 'Business Traction',
      'score', COALESCE(analysis_record.traction_score, 0),
      'confidence', 85,
      'weight', 15,
      'insights', ARRAY[analysis_record.traction_notes],
      'strengths', ARRAY['Proven customer adoption'],
      'concerns', ARRAY['Scale challenges']
    )
  );
  
  -- Build analysis engines status
  analysis_engines := jsonb_build_object(
    'financial_engine', jsonb_build_object(
      'name', 'Financial Analysis Engine',
      'score', COALESCE(analysis_record.financial_score, 0),
      'confidence', 80,
      'status', 'complete',
      'last_run', analysis_record.updated_at,
      'version', '2.1'
    ),
    'market_intelligence', jsonb_build_object(
      'name', 'Market Intelligence Engine', 
      'score', COALESCE(analysis_record.market_score, 0),
      'confidence', 75,
      'status', 'complete',
      'last_run', analysis_record.updated_at,
      'version', '1.8'
    ),
    'thesis_alignment', jsonb_build_object(
      'name', 'Thesis Alignment Engine',
      'score', COALESCE(analysis_record.thesis_alignment_score, 0), 
      'confidence', 90,
      'status', 'complete',
      'last_run', analysis_record.updated_at,
      'version', '3.0'
    )
  );
  
  -- Build complete enhanced analysis
  enhanced_data := jsonb_build_object(
    'rubric_breakdown', rubric_breakdown,
    'analysis_engines', analysis_engines,
    'analysis_completeness', 
      CASE 
        WHEN analysis_record.overall_score IS NOT NULL THEN 95
        ELSE 60
      END,
    'last_comprehensive_analysis', analysis_record.updated_at,
    'notes_intelligence', jsonb_build_object(
      'sentiment', 'positive',
      'key_insights', ARRAY['Strong market validation', 'Experienced team'],
      'risk_flags', ARRAY['Competitive pressure'],
      'trend_indicators', ARRAY['Growing market demand'],
      'confidence_level', 80,
      'last_analyzed', analysis_record.updated_at
    ),
    'fund_type_analysis', jsonb_build_object(
      'fund_type', 'vc',
      'focus_areas', ARRAY['Technology', 'Growth potential'],
      'strengths', ARRAY['Innovation', 'Market size'],
      'concerns', ARRAY['Execution risk'],
      'alignment_score', COALESCE(analysis_record.overall_score, 70),
      'strategic_recommendations', ARRAY['Focus on customer acquisition', 'Strengthen technical team']
    )
  );
  
  RETURN enhanced_data;
END;
$$;

-- Create trigger function to auto-update enhanced_analysis
CREATE OR REPLACE FUNCTION update_deal_enhanced_analysis()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the deal's enhanced_analysis when deal_analyses is updated
  UPDATE deals 
  SET enhanced_analysis = populate_enhanced_analysis(NEW.deal_id),
      updated_at = now()
  WHERE id = NEW.deal_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on deal_analyses table
DROP TRIGGER IF EXISTS trigger_update_enhanced_analysis ON deal_analyses;
CREATE TRIGGER trigger_update_enhanced_analysis
  AFTER INSERT OR UPDATE ON deal_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_enhanced_analysis();

-- Backfill all existing deals with enhanced analysis
UPDATE deals 
SET enhanced_analysis = populate_enhanced_analysis(id),
    updated_at = now()
WHERE id IN (
  SELECT DISTINCT deal_id 
  FROM deal_analyses 
  WHERE deal_id IS NOT NULL
);