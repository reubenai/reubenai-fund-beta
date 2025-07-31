-- Implement simplified permission system without fund_permissions table

-- 1. Drop the fund_permissions table and related policies since we're simplifying
DROP TABLE IF EXISTS public.fund_permissions;

-- 2. Update user_role enum to match the 5-tier hierarchy
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 3. Create simplified permission helper functions
CREATE OR REPLACE FUNCTION public.is_reuben_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user email ends with @goreuben.com or @reuben.com
  RETURN (
    auth.email() LIKE '%@goreuben.com' OR 
    auth.email() LIKE '%@reuben.com' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_manage_funds()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    public.is_reuben_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'fund_manager')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_edit_fund_data()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    public.is_reuben_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'fund_manager', 'analyst')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  IF public.is_reuben_admin() THEN
    RETURN 'super_admin';
  END IF;
  
  RETURN (
    SELECT role::text FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Update RLS policies for funds table
DROP POLICY IF EXISTS "Fund managers can manage funds" ON public.funds;
DROP POLICY IF EXISTS "Users can view funds in their organization" ON public.funds;

-- Super admins can manage all funds, others based on organization and role
CREATE POLICY "Users can manage funds based on role" ON public.funds
FOR ALL USING (
  public.is_reuben_admin() OR
  (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'fund_manager')
    )
  )
);

CREATE POLICY "Users can view funds in their organization" ON public.funds
FOR SELECT USING (
  public.is_reuben_admin() OR
  organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- 5. Update RLS policies for deals table  
DROP POLICY IF EXISTS "Users can manage deals in accessible funds" ON public.deals;
DROP POLICY IF EXISTS "Users can view deals in accessible funds" ON public.deals;

CREATE POLICY "Users can manage deals based on role" ON public.deals
FOR ALL USING (
  public.is_reuben_admin() OR
  public.can_edit_fund_data()
);

CREATE POLICY "Users can view deals in their organization" ON public.deals
FOR SELECT USING (
  public.is_reuben_admin() OR
  fund_id IN (
    SELECT f.id FROM public.funds f
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

-- 6. Update investment strategies policies
DROP POLICY IF EXISTS "Fund managers can manage strategies" ON public.investment_strategies;
DROP POLICY IF EXISTS "Users can view strategies for accessible funds" ON public.investment_strategies;

CREATE POLICY "Users can manage strategies based on role" ON public.investment_strategies
FOR ALL USING (
  public.is_reuben_admin() OR
  public.can_edit_fund_data()
);

CREATE POLICY "Users can view strategies in their organization" ON public.investment_strategies
FOR SELECT USING (
  public.is_reuben_admin() OR
  fund_id IN (
    SELECT f.id FROM public.funds f
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

-- 7. Update other related table policies similarly
DROP POLICY IF EXISTS "Users can manage deal analyses for accessible deals" ON public.deal_analyses;
DROP POLICY IF EXISTS "Users can view deal analyses for accessible deals" ON public.deal_analyses;

CREATE POLICY "Users can manage deal analyses based on role" ON public.deal_analyses
FOR ALL USING (
  public.is_reuben_admin() OR
  public.can_edit_fund_data()
);

CREATE POLICY "Users can view deal analyses in their organization" ON public.deal_analyses
FOR SELECT USING (
  public.is_reuben_admin() OR
  deal_id IN (
    SELECT d.id FROM public.deals d
    JOIN public.funds f ON d.fund_id = f.id
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

-- 8. Update IC meetings policies
DROP POLICY IF EXISTS "Fund managers can manage IC meetings" ON public.ic_meetings;
DROP POLICY IF EXISTS "Users can view IC meetings for accessible funds" ON public.ic_meetings;

CREATE POLICY "Users can manage IC meetings based on role" ON public.ic_meetings
FOR ALL USING (
  public.is_reuben_admin() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'fund_manager')
  )
);

CREATE POLICY "Users can view IC meetings in their organization" ON public.ic_meetings
FOR SELECT USING (
  public.is_reuben_admin() OR
  fund_id IN (
    SELECT f.id FROM public.funds f
    JOIN public.profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);

-- 9. Update profiles policies to be cleaner
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

CREATE POLICY "Users can view profiles in their organization" ON public.profiles
FOR SELECT USING (
  public.is_reuben_admin() OR
  user_id = auth.uid() OR
  organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);