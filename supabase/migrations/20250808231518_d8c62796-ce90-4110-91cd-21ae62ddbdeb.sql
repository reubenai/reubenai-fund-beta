-- Create support tickets table to track feedback/support requests
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'general', 'love')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID NULL,
  rating INTEGER NULL CHECK (rating >= 1 AND rating <= 5),
  fund_id UUID NULL,
  fund_name TEXT NULL,
  internal_notes TEXT NULL,
  resolution_notes TEXT NULL,
  first_response_at TIMESTAMP WITH TIME ZONE NULL,
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  closed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create archived activity events table for performance
CREATE TABLE public.archived_activity_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL, -- Reference to original activity_events.id
  user_id UUID NOT NULL,
  fund_id UUID NOT NULL,
  deal_id UUID NULL,
  resource_id UUID NULL,
  activity_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NULL,
  context_data JSONB DEFAULT '{}',
  change_data JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  searchable_content TEXT NULL,
  resource_type TEXT NULL,
  session_id TEXT NULL,
  user_agent TEXT NULL,
  source_ip INET NULL,
  is_system_event BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  retention_date TIMESTAMP WITH TIME ZONE NULL,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity archival configuration table
CREATE TABLE public.activity_archival_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  retention_days INTEGER NOT NULL DEFAULT 90,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(activity_type, priority)
);

-- Enable RLS on new tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_archival_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets
CREATE POLICY "Reuben admins can manage all support tickets" ON public.support_tickets
FOR ALL USING (is_reuben_email());

CREATE POLICY "Users can view their own tickets" ON public.support_tickets
FOR SELECT USING (user_id = auth.uid());

-- RLS policies for archived_activity_events (same as activity_events)
CREATE POLICY "Users can manage archived activities for manageable funds and deals" ON public.archived_activity_events
FOR ALL USING (user_can_manage_activity(fund_id, deal_id));

CREATE POLICY "Users can view archived activities for accessible funds and deals" ON public.archived_activity_events
FOR SELECT USING (user_can_access_activity(fund_id, deal_id));

-- RLS policies for activity_archival_config
CREATE POLICY "Reuben admins can manage archival config" ON public.activity_archival_config
FOR ALL USING (is_reuben_email());

CREATE POLICY "Users can view archival config" ON public.activity_archival_config
FOR SELECT USING (true);

-- Insert default archival configuration
INSERT INTO public.activity_archival_config (activity_type, priority, retention_days, description) VALUES
('page_view', 'low', 30, 'Basic page navigation events'),
('page_view', 'medium', 60, 'Important page views'),
('page_view', 'high', 90, 'Critical page views'),
('click', 'low', 30, 'Basic click events'),
('click', 'medium', 60, 'Important click events'),
('click', 'high', 90, 'Critical click events'),
('deal_created', 'low', 180, 'Deal creation events'),
('deal_created', 'medium', 365, 'Important deal creation'),
('deal_created', 'high', 730, 'Critical deal creation'),
('deal_updated', 'low', 180, 'Deal update events'),
('deal_updated', 'medium', 365, 'Important deal updates'),
('deal_updated', 'high', 730, 'Critical deal updates'),
('document_uploaded', 'low', 365, 'Document upload events'),
('document_uploaded', 'medium', 730, 'Important document uploads'),
('document_uploaded', 'high', 1095, 'Critical document uploads'),
('memo_generated', 'low', 365, 'Memo generation events'),
('memo_generated', 'medium', 730, 'Important memo generation'),
('memo_generated', 'high', 1095, 'Critical memo generation'),
('ic_session', 'low', 730, 'IC session events'),
('ic_session', 'medium', 1095, 'Important IC sessions'),
('ic_session', 'high', 2190, 'Critical IC sessions'),
('strategy_updated', 'low', 365, 'Strategy update events'),
('strategy_updated', 'medium', 730, 'Important strategy updates'),
('strategy_updated', 'high', 1095, 'Critical strategy updates'),
('analysis_completed', 'low', 180, 'Analysis completion events'),
('analysis_completed', 'medium', 365, 'Important analysis completion'),
('analysis_completed', 'high', 730, 'Critical analysis completion');

-- Function to archive old activities based on configuration
CREATE OR REPLACE FUNCTION public.archive_old_activities()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archived_count INTEGER := 0;
  row_count_var INTEGER;
  config_record RECORD;
BEGIN
  -- Loop through each active archival configuration
  FOR config_record IN 
    SELECT activity_type, priority, retention_days 
    FROM public.activity_archival_config 
    WHERE is_active = true
  LOOP
    -- Archive activities older than retention period
    INSERT INTO public.archived_activity_events (
      original_id, user_id, fund_id, deal_id, resource_id, activity_type, priority,
      title, description, context_data, change_data, tags, searchable_content,
      resource_type, session_id, user_agent, source_ip, is_system_event,
      is_visible, retention_date, occurred_at, created_at, updated_at
    )
    SELECT 
      id, user_id, fund_id, deal_id, resource_id, activity_type, priority,
      title, description, context_data, change_data, tags, searchable_content,
      resource_type, session_id, user_agent, source_ip, is_system_event,
      is_visible, retention_date, occurred_at, created_at, updated_at
    FROM public.activity_events
    WHERE activity_type = config_record.activity_type 
      AND priority = config_record.priority
      AND occurred_at < (now() - (config_record.retention_days || ' days')::interval)
      AND id NOT IN (SELECT original_id FROM public.archived_activity_events);
    
    GET DIAGNOSTICS row_count_var = ROW_COUNT;
    archived_count = archived_count + row_count_var;
    
    -- Delete archived activities from main table
    DELETE FROM public.activity_events
    WHERE activity_type = config_record.activity_type 
      AND priority = config_record.priority
      AND occurred_at < (now() - (config_record.retention_days || ' days')::interval);
  END LOOP;
  
  RETURN archived_count;
END;
$$;

-- Function to restore archived activities (for investigations)
CREATE OR REPLACE FUNCTION public.restore_archived_activities(
  activity_ids UUID[] DEFAULT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  restored_count INTEGER := 0;
BEGIN
  -- Restore specific activities by ID
  IF activity_ids IS NOT NULL THEN
    INSERT INTO public.activity_events (
      id, user_id, fund_id, deal_id, resource_id, activity_type, priority,
      title, description, context_data, change_data, tags, searchable_content,
      resource_type, session_id, user_agent, source_ip, is_system_event,
      is_visible, retention_date, occurred_at, created_at, updated_at
    )
    SELECT 
      original_id, user_id, fund_id, deal_id, resource_id, activity_type, priority,
      title, description, context_data, change_data, tags, searchable_content,
      resource_type, session_id, user_agent, source_ip, is_system_event,
      is_visible, retention_date, occurred_at, created_at, updated_at
    FROM public.archived_activity_events
    WHERE original_id = ANY(activity_ids)
      AND original_id NOT IN (SELECT id FROM public.activity_events);
  
  -- Restore activities by date range
  ELSIF start_date IS NOT NULL AND end_date IS NOT NULL THEN
    INSERT INTO public.activity_events (
      id, user_id, fund_id, deal_id, resource_id, activity_type, priority,
      title, description, context_data, change_data, tags, searchable_content,
      resource_type, session_id, user_agent, source_ip, is_system_event,
      is_visible, retention_date, occurred_at, created_at, updated_at
    )
    SELECT 
      original_id, user_id, fund_id, deal_id, resource_id, activity_type, priority,
      title, description, context_data, change_data, tags, searchable_content,
      resource_type, session_id, user_agent, source_ip, is_system_event,
      is_visible, retention_date, occurred_at, created_at, updated_at
    FROM public.archived_activity_events
    WHERE occurred_at BETWEEN start_date AND end_date
      AND original_id NOT IN (SELECT id FROM public.activity_events);
  END IF;
  
  GET DIAGNOSTICS restored_count = ROW_COUNT;
  RETURN restored_count;
END;
$$;

-- Function to get archival statistics
CREATE OR REPLACE FUNCTION public.get_archival_statistics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'active_activities', (SELECT COUNT(*) FROM public.activity_events),
    'archived_activities', (SELECT COUNT(*) FROM public.archived_activity_events),
    'oldest_active_activity', (SELECT MIN(occurred_at) FROM public.activity_events),
    'newest_archived_activity', (SELECT MAX(occurred_at) FROM public.archived_activity_events),
    'archival_configs', (SELECT COUNT(*) FROM public.activity_archival_config WHERE is_active = true),
    'total_retention_configs', (SELECT COUNT(*) FROM public.activity_archival_config),
    'archive_size_estimate', (
      SELECT jsonb_build_object(
        'archived_count', COUNT(*),
        'size_mb', ROUND(pg_total_relation_size('public.archived_activity_events')::numeric / 1048576, 2)
      )
      FROM public.archived_activity_events
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_support_ticket_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_ticket_updated_at();

CREATE TRIGGER update_activity_archival_config_updated_at
  BEFORE UPDATE ON public.activity_archival_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at);
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);

CREATE INDEX idx_archived_activity_events_occurred_at ON public.archived_activity_events(occurred_at);
CREATE INDEX idx_archived_activity_events_activity_type ON public.archived_activity_events(activity_type);
CREATE INDEX idx_archived_activity_events_fund_id ON public.archived_activity_events(fund_id);
CREATE INDEX idx_archived_activity_events_user_id ON public.archived_activity_events(user_id);
CREATE INDEX idx_archived_activity_events_original_id ON public.archived_activity_events(original_id);

CREATE INDEX idx_activity_archival_config_type_priority ON public.activity_archival_config(activity_type, priority);
CREATE INDEX idx_activity_archival_config_active ON public.activity_archival_config(is_active);