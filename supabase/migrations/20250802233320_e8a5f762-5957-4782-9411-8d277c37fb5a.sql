-- Create user_feedback table for beta feedback collection
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'general', 'love')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  admin_response TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for user_feedback
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can create their own feedback
CREATE POLICY "Users can create their own feedback" 
ON public.user_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" 
ON public.user_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view and manage all feedback
CREATE POLICY "Admins can manage all feedback" 
ON public.user_feedback 
FOR ALL 
USING (is_reuben_admin() OR (
  SELECT role FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('super_admin', 'admin')
));

-- Add updated_at trigger
CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX idx_user_feedback_created_at ON public.user_feedback(created_at DESC);