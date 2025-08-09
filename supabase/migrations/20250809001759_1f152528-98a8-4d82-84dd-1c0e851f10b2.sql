-- Add RLS policy for Reuben admins to view all user feedback
CREATE POLICY "Reuben admins can view all feedback"
ON public.user_feedback
FOR SELECT
TO public
USING (
  is_reuben_email()
);