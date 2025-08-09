-- Fill in missing enhanced_analysis for deals that don't have analysis records
UPDATE deals 
SET enhanced_analysis = jsonb_build_object(
  'rubric_breakdown', jsonb_build_array(
    jsonb_build_object(
      'category', 'Team & Leadership',
      'score', 50,
      'confidence', 30,
      'weight', 20,
      'insights', ARRAY['Analysis pending - insufficient data'],
      'strengths', ARRAY['To be determined'],
      'concerns', ARRAY['Requires comprehensive analysis']
    ),
    jsonb_build_object(
      'category', 'Market Opportunity', 
      'score', 50,
      'confidence', 30,
      'weight', 25,
      'insights', ARRAY['Market analysis pending'],
      'strengths', ARRAY['To be determined'],
      'concerns', ARRAY['Market size and competition analysis needed']
    ),
    jsonb_build_object(
      'category', 'Product & Technology',
      'score', 50,
      'confidence', 30,
      'weight', 25,
      'insights', ARRAY['Technical analysis pending'],
      'strengths', ARRAY['To be determined'],
      'concerns', ARRAY['Product differentiation analysis required']
    ),
    jsonb_build_object(
      'category', 'Financial Health',
      'score', 50,
      'confidence', 30,
      'weight', 15,
      'insights', ARRAY['Financial analysis pending'],
      'strengths', ARRAY['To be determined'],
      'concerns', ARRAY['Financial documentation required']
    ),
    jsonb_build_object(
      'category', 'Business Traction',
      'score', 50,
      'confidence', 30,
      'weight', 15,
      'insights', ARRAY['Traction analysis pending'],
      'strengths', ARRAY['To be determined'],
      'concerns', ARRAY['Customer and growth metrics analysis needed']
    )
  ),
  'analysis_engines', jsonb_build_object(),
  'analysis_completeness', 25,
  'last_comprehensive_analysis', now(),
  'notes_intelligence', jsonb_build_object(
    'sentiment', 'neutral',
    'key_insights', ARRAY['Comprehensive analysis required'],
    'risk_flags', ARRAY['Insufficient data'],
    'trend_indicators', ARRAY[],
    'confidence_level', 30,
    'last_analyzed', now()
  ),
  'fund_type_analysis', jsonb_build_object(
    'fund_type', 'vc',
    'focus_areas', ARRAY['To be determined'],
    'strengths', ARRAY['Requires analysis'],
    'concerns', ARRAY['Insufficient data for assessment'],
    'alignment_score', 50,
    'strategic_recommendations', ARRAY['Complete comprehensive analysis']
  )
),
updated_at = now()
WHERE enhanced_analysis IS NULL;