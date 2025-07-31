-- Create activity type enum
CREATE TYPE public.activity_type AS ENUM (
  'deal_created',
  'deal_updated', 
  'deal_stage_changed',
  'deal_deleted',
  'deal_note_added',
  'deal_analysis_started',
  'deal_analysis_completed',
  'document_uploaded',
  'pitch_deck_uploaded',
  'fund_created',
  'fund_updated',
  'criteria_updated',
  'team_member_invited',
  'team_member_joined',
  'meeting_scheduled',
  'investment_decision',
  'system_event'
);

-- Create activity priority enum
CREATE TYPE public.activity_priority AS ENUM (
  'low',
  'medium', 
  'high',
  'critical'
);

-- Create activity_events table
CREATE TABLE public.activity_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  user_id UUID NOT NULL,
  activity_type activity_type NOT NULL,
  priority activity_priority NOT NULL DEFAULT 'medium',
  
  -- Content fields
  title TEXT NOT NULL,
  description TEXT,
  deal_id UUID,
  resource_type TEXT,
  resource_id UUID,
  
  -- Audit trail fields
  context_data JSONB DEFAULT '{}',
  change_data JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  searchable_content TEXT,
  
  -- Session tracking
  session_id TEXT,
  source_ip INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- System flags
  is_system_event BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  retention_date TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Create policies for activity events
CREATE POLICY "Users can view activities in their organization" 
ON public.activity_events 
FOR SELECT 
USING (
  is_reuben_admin() OR 
  fund_id IN (
    SELECT f.id 
    FROM funds f 
    JOIN profiles p ON f.organization_id = p.organization_id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create activities for accessible funds" 
ON public.activity_events 
FOR INSERT 
WITH CHECK (
  is_reuben_admin() OR 
  fund_id IN (
    SELECT f.id 
    FROM funds f 
    JOIN profiles p ON f.organization_id = p.organization_id 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'fund_manager', 'analyst')
  )
);

-- Create indexes for performance
CREATE INDEX idx_activity_events_fund_id ON public.activity_events(fund_id);
CREATE INDEX idx_activity_events_user_id ON public.activity_events(user_id);
CREATE INDEX idx_activity_events_deal_id ON public.activity_events(deal_id);
CREATE INDEX idx_activity_events_type ON public.activity_events(activity_type);
CREATE INDEX idx_activity_events_priority ON public.activity_events(priority);
CREATE INDEX idx_activity_events_created_at ON public.activity_events(created_at DESC);
CREATE INDEX idx_activity_events_occurred_at ON public.activity_events(occurred_at DESC);

-- GIN indexes for JSONB and text search
CREATE INDEX idx_activity_events_context_data ON public.activity_events USING GIN(context_data);
CREATE INDEX idx_activity_events_change_data ON public.activity_events USING GIN(change_data);
CREATE INDEX idx_activity_events_tags ON public.activity_events USING GIN(tags);
CREATE INDEX idx_activity_events_searchable ON public.activity_events USING GIN(to_tsvector('english', searchable_content));

-- Function to update searchable content
CREATE OR REPLACE FUNCTION public.update_activity_searchable_content()
RETURNS TRIGGER AS $$
BEGIN
  NEW.searchable_content = concat_ws(' ', 
    NEW.title, 
    NEW.description,
    array_to_string(NEW.tags, ' '),
    NEW.context_data->>'company_name',
    NEW.context_data->>'industry',
    NEW.context_data->>'stage_from',
    NEW.context_data->>'stage_to'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update searchable content
CREATE TRIGGER update_activity_searchable_content_trigger
  BEFORE INSERT OR UPDATE ON public.activity_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_activity_searchable_content();

-- Add trigger for updated_at on activity_events
CREATE TRIGGER update_activity_events_updated_at
  BEFORE UPDATE ON public.activity_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();