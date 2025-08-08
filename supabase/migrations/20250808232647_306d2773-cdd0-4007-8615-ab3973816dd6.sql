-- Create performance indexes for activity queries with user attribution
CREATE INDEX IF NOT EXISTS idx_activity_events_user_occurred 
ON public.activity_events (user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_events_fund_user_occurred 
ON public.activity_events (fund_id, user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_user_lookup 
ON public.profiles (user_id);

-- Add composite index for activity filtering and sorting
CREATE INDEX IF NOT EXISTS idx_activity_events_composite 
ON public.activity_events (fund_id, is_visible, occurred_at DESC, priority, activity_type);