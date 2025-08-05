-- Add new columns to deal_notes table for enhanced functionality
ALTER TABLE public.deal_notes 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS category text DEFAULT 'other',
ADD COLUMN IF NOT EXISTS sentiment text DEFAULT 'neutral';

-- Create index for better query performance on tags
CREATE INDEX IF NOT EXISTS idx_deal_notes_tags ON public.deal_notes USING GIN(tags);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_deal_notes_category ON public.deal_notes (category);

-- Create index for sentiment filtering
CREATE INDEX IF NOT EXISTS idx_deal_notes_sentiment ON public.deal_notes (sentiment);

-- Update trigger to handle note data flow into analysis engine
CREATE OR REPLACE FUNCTION public.trigger_deal_reanalysis_on_note()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the note content contains important keywords that should trigger reanalysis
  IF NEW.category IN ('founder_meeting', 'financial_observations', 'due_diligence', 'competitive_intelligence') OR
     NEW.sentiment = 'negative' OR
     array_length(NEW.tags, 1) > 0 THEN
    
    -- Update the deal's updated timestamp to indicate new information
    UPDATE public.deals 
    SET updated_at = now()
    WHERE id = NEW.deal_id;
    
    -- Log activity for significant notes
    INSERT INTO public.activity_events (
      user_id,
      deal_id,
      fund_id,
      activity_type,
      title,
      description,
      context_data
    ) VALUES (
      NEW.created_by,
      NEW.deal_id,
      (SELECT fund_id FROM public.deals WHERE id = NEW.deal_id),
      'note_added',
      'Important Note Added',
      CASE 
        WHEN NEW.category = 'founder_meeting' THEN 'Founder meeting insights added'
        WHEN NEW.category = 'financial_observations' THEN 'Financial observations documented'
        WHEN NEW.category = 'due_diligence' THEN 'Due diligence notes added'
        WHEN NEW.sentiment = 'negative' THEN 'Concerns or negative feedback documented'
        ELSE 'New note added with relevant insights'
      END,
      jsonb_build_object(
        'note_id', NEW.id,
        'category', NEW.category,
        'sentiment', NEW.sentiment,
        'tags', NEW.tags,
        'content_preview', left(NEW.content, 100)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new notes
DROP TRIGGER IF EXISTS trigger_reanalysis_on_note ON public.deal_notes;
CREATE TRIGGER trigger_reanalysis_on_note
  AFTER INSERT ON public.deal_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_deal_reanalysis_on_note();