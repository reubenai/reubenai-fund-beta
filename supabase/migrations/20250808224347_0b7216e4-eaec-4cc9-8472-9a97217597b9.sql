-- Create user_fund_access table to track which users have access to which funds
CREATE TABLE public.user_fund_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fund_id uuid NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  access_level text NOT NULL DEFAULT 'read',
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, fund_id)
);

-- Enable RLS
ALTER TABLE public.user_fund_access ENABLE ROW LEVEL SECURITY;

-- Create policies for user_fund_access
CREATE POLICY "Users can view their own fund access" 
ON public.user_fund_access 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Fund managers can manage fund access" 
ON public.user_fund_access 
FOR ALL 
USING (
  fund_id IN (
    SELECT f.id 
    FROM public.funds f
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
    AND p.role = ANY (ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role])
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_user_fund_access_updated_at
BEFORE UPDATE ON public.user_fund_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();