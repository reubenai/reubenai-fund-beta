-- Fix activity_events table policies to allow Reuben admins to create activities
CREATE POLICY "reuben_activity_access" 
ON public.activity_events 
FOR ALL 
USING (public.is_reuben_email())
WITH CHECK (public.is_reuben_email());

-- Add policy for users to create activities for funds they have access to
CREATE POLICY "users_create_activities" 
ON public.activity_events 
FOR INSERT 
WITH CHECK (
  fund_id IN (
    SELECT f.id 
    FROM public.funds f 
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
    AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);

-- Add policies for deal_notes table to ensure user recognition
CREATE POLICY "reuben_deal_notes_access" 
ON public.deal_notes 
FOR ALL 
USING (public.is_reuben_email())
WITH CHECK (public.is_reuben_email());

-- Add policy for users to manage their own deal notes
CREATE POLICY "users_own_deal_notes" 
ON public.deal_notes 
FOR ALL 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());