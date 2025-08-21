-- Create deal-level permissions system
CREATE TABLE public.deal_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT CHECK (role IN ('viewer', 'commenter', 'note_creator')) NOT NULL,
  access_type TEXT CHECK (access_type IN ('internal', 'external')) NOT NULL,
  access_granted_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (deal_id, user_id)
);

-- Enable RLS
ALTER TABLE public.deal_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for deal permissions
CREATE POLICY "Users can view deal permissions for accessible deals"
ON public.deal_permissions FOR SELECT
USING (
  deal_id IN (
    SELECT d.id FROM public.deals d
    JOIN public.funds f ON d.fund_id = f.id
    WHERE user_can_access_fund(f.id)
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Fund members can manage deal permissions"
ON public.deal_permissions FOR ALL
USING (
  deal_id IN (
    SELECT d.id FROM public.deals d
    JOIN public.funds f ON d.fund_id = f.id
    WHERE user_can_access_fund(f.id)
  )
)
WITH CHECK (
  deal_id IN (
    SELECT d.id FROM public.deals d
    JOIN public.funds f ON d.fund_id = f.id
    WHERE user_can_access_fund(f.id)
  )
);

-- Create function to check if user has deal permission
CREATE OR REPLACE FUNCTION public.user_can_access_deal(target_deal_id uuid, required_role text DEFAULT 'viewer')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Super admins can access everything
  SELECT CASE 
    WHEN auth_is_super_admin() THEN true
    -- Check if user is fund member (internal access)
    WHEN EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.funds f ON d.fund_id = f.id
      WHERE d.id = target_deal_id 
        AND user_can_access_fund(f.id)
    ) THEN true
    -- Check explicit deal permission
    WHEN EXISTS (
      SELECT 1 FROM public.deal_permissions dp
      WHERE dp.deal_id = target_deal_id 
        AND dp.user_id = auth.uid()
        AND (
          required_role = 'viewer' OR
          (required_role = 'commenter' AND dp.role IN ('commenter', 'note_creator')) OR
          (required_role = 'note_creator' AND dp.role = 'note_creator')
        )
    ) THEN true
    ELSE false
  END;
$$;

-- Create function to get user's role for a deal
CREATE OR REPLACE FUNCTION public.get_user_deal_role(target_deal_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    -- Super admins get full access
    WHEN auth_is_super_admin() THEN 'admin'
    -- Fund members get full access
    WHEN EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.funds f ON d.fund_id = f.id
      WHERE d.id = target_deal_id 
        AND user_can_access_fund(f.id)
    ) THEN 'admin'
    -- External users get their assigned role
    ELSE COALESCE(
      (SELECT dp.role FROM public.deal_permissions dp
       WHERE dp.deal_id = target_deal_id AND dp.user_id = auth.uid()),
      'none'
    )
  END;
$$;

-- Add indexes for performance
CREATE INDEX idx_deal_permissions_deal_id ON public.deal_permissions(deal_id);
CREATE INDEX idx_deal_permissions_user_id ON public.deal_permissions(user_id);
CREATE INDEX idx_deal_permissions_composite ON public.deal_permissions(deal_id, user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_deal_permissions_updated_at
  BEFORE UPDATE ON public.deal_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();