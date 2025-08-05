-- Add foreign key constraints to activity_events table for proper joins
ALTER TABLE public.activity_events 
ADD CONSTRAINT fk_activity_events_fund_id 
FOREIGN KEY (fund_id) REFERENCES public.funds(id) ON DELETE CASCADE;

ALTER TABLE public.activity_events 
ADD CONSTRAINT fk_activity_events_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;