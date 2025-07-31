-- Fix infinite recursion in profiles table and implement comprehensive personalization system

-- 1. First, drop existing problematic policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- 2. Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.is_reuben_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user email ends with @goreuben.com or @reuben.com
  -- OR has reuben_admin flag in metadata
  RETURN (
    auth.email() LIKE '%@goreuben.com' OR 
    auth.email() LIKE '%@reuben.com' OR
    auth.email() = 'kat@goreuben.com' OR
    (auth.jwt() -> 'user_metadata' ->> 'reuben_admin')::boolean = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_organization_id(p_user_id UUID DEFAULT auth.uid())
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = p_user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Create new personalization tables
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  sidebar_collapsed BOOLEAN DEFAULT false,
  default_view TEXT DEFAULT 'dashboard',
  timezone TEXT DEFAULT 'UTC',
  notification_email BOOLEAN DEFAULT true,
  notification_deal_updates BOOLEAN DEFAULT true,
  notification_team_changes BOOLEAN DEFAULT true,
  notification_system_alerts BOOLEAN DEFAULT true,
  last_active_organization UUID,
  last_active_fund UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.fund_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fund_id UUID NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'fund_admin', 'gp', 'owner', 'member', 'viewer')),
  invitation_status TEXT DEFAULT 'active' CHECK (invitation_status IN ('pending', 'active', 'declined', 'revoked')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, fund_id)
);

-- 4. Create proper RLS policies for profiles (non-recursive)
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles  
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can view all profiles" ON public.profiles
FOR ALL USING (public.is_reuben_admin());

-- 5. Enable RLS on new tables
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_permissions ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for user_preferences
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all preferences" ON public.user_preferences
FOR ALL USING (public.is_reuben_admin());

-- 7. RLS policies for fund_permissions
CREATE POLICY "Users can view their own permissions" ON public.fund_permissions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Fund admins can manage fund permissions" ON public.fund_permissions
FOR ALL USING (
  public.is_reuben_admin() OR
  EXISTS (
    SELECT 1 FROM public.fund_permissions fp
    WHERE fp.user_id = auth.uid() 
    AND fp.fund_id = fund_permissions.fund_id
    AND fp.role IN ('fund_admin', 'gp', 'owner')
    AND fp.invitation_status = 'active'
  )
);

-- 8. Helper functions for permissions
CREATE OR REPLACE FUNCTION public.get_user_role_in_fund(p_fund_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.fund_permissions 
    WHERE user_id = p_user_id 
    AND fund_id = p_fund_id 
    AND invitation_status = 'active'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_create_funds(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    public.is_reuben_admin() OR 
    EXISTS (
      SELECT 1 FROM public.fund_permissions 
      WHERE user_id = p_user_id 
      AND role IN ('gp', 'fund_admin', 'owner')
      AND invitation_status = 'active'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 9. Create trigger for user_preferences updates
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fund_permissions_updated_at
  BEFORE UPDATE ON public.fund_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Insert default preferences for demo user
INSERT INTO public.user_preferences (user_id, theme, default_view)
SELECT id, 'light', 'dashboard'
FROM auth.users 
WHERE email = 'demo@goreuben.com'
ON CONFLICT (user_id) DO NOTHING;

-- 11. Grant demo user GP access to demo fund
INSERT INTO public.fund_permissions (user_id, fund_id, role, invitation_status)
SELECT 
  u.id as user_id,
  '00000000-0000-0000-0000-000000000002'::uuid as fund_id,
  'gp' as role,
  'active' as invitation_status
FROM auth.users u
WHERE u.email = 'demo@goreuben.com'
ON CONFLICT (user_id, fund_id) DO NOTHING;