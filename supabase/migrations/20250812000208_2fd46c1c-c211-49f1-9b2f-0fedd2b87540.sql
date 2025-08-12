-- Expand note types that trigger deal analysis

-- Update the trigger function to include additional note categories and conditions
CREATE OR REPLACE FUNCTION public.trigger_deal_reanalysis_on_note()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this note should trigger reanalysis
  -- Expanded categories that trigger analysis
  IF NEW.category IN (
    'founder_meeting', 
    'financial_observations', 
    'due_diligence', 
    'competitive_intelligence',
    'market_insights',        -- NEW: Market intelligence updates
    'team_assessment',        -- NEW: Team evaluation insights  
    'product_feedback'        -- NEW: Product/technology insights
  )
  -- OR negative sentiment (potential red flags)
  OR NEW.sentiment = 'negative'
  -- OR positive sentiment with high confidence (significant positive developments)
  OR (NEW.sentiment = 'positive' AND length(NEW.content) > 100)
  -- OR notes with tags (indicating structured/important information)
  OR array_length(NEW.tags, 1) > 0
  -- OR notes with business-critical keywords
  OR (
    NEW.content ILIKE ANY(ARRAY[
      '%funding%', '%investment%', '%revenue%', '%customer%', '%partnership%',
      '%competition%', '%risk%', '%milestone%', '%product launch%', '%regulatory%'
    ])
  )
  THEN
    -- Insert catalyst record to track what triggered the analysis
    INSERT INTO public.deal_analysis_catalysts (
      deal_id,
      triggered_by,
      catalyst_type,
      metadata
    ) VALUES (
      NEW.deal_id,
      NEW.created_by,
      'note_update',
      jsonb_build_object(
        'note_id', NEW.id,
        'note_category', NEW.category,
        'note_sentiment', NEW.sentiment,
        'trigger_reason', CASE 
          WHEN NEW.category IN ('market_insights', 'team_assessment', 'product_feedback') THEN 'expanded_category'
          WHEN NEW.sentiment = 'negative' THEN 'negative_sentiment'
          WHEN NEW.sentiment = 'positive' AND length(NEW.content) > 100 THEN 'significant_positive'
          WHEN array_length(NEW.tags, 1) > 0 THEN 'tagged_note'
          WHEN NEW.content ILIKE ANY(ARRAY['%funding%', '%investment%', '%revenue%', '%customer%', '%partnership%', '%competition%', '%risk%', '%milestone%', '%product launch%', '%regulatory%']) THEN 'business_critical_keyword'
          ELSE 'standard_category'
        END,
        'content_length', length(NEW.content),
        'has_tags', array_length(NEW.tags, 1) > 0
      )
    );
    
    -- Queue analysis with appropriate priority
    PERFORM public.queue_deal_analysis(
      NEW.deal_id,
      'note_update',
      CASE 
        WHEN NEW.sentiment = 'negative' OR NEW.category = 'due_diligence' THEN 'high'
        WHEN NEW.category IN ('market_insights', 'team_assessment', 'product_feedback') THEN 'normal'
        ELSE 'normal'
      END,
      2 -- 2 minute delay for note-triggered analysis
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;