-- Create bulletproof activity access functions using the same pattern as deals/pipeline
CREATE OR REPLACE FUNCTION public.user_can_access_activity(activity_fund_id uuid, activity_deal_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  -- Reuben emails have access to everything
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    -- Regular users: check organization membership via fund_id OR deal_id
    WHEN activity_fund_id IS NOT NULL THEN user_can_access_fund(activity_fund_id)
    WHEN activity_deal_id IS NOT NULL THEN EXISTS (
      SELECT 1
      FROM deals d
      WHERE d.id = activity_deal_id
        AND user_can_access_fund(d.fund_id)
    )
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.user_can_manage_activity(activity_fund_id uuid, activity_deal_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  -- Reuben emails can manage everything
  SELECT CASE 
    WHEN auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com' THEN true
    -- Regular users: check management permissions via fund_id OR deal_id
    WHEN activity_fund_id IS NOT NULL THEN user_can_manage_fund(activity_fund_id)
    WHEN activity_deal_id IS NOT NULL THEN EXISTS (
      SELECT 1
      FROM deals d
      WHERE d.id = activity_deal_id
        AND user_can_manage_fund(d.fund_id)
    )
    ELSE false
  END;
$$;

-- Drop existing problematic activity_events policies
DROP POLICY IF EXISTS "reuben_activity_access" ON public.activity_events;
DROP POLICY IF EXISTS "users_create_activities" ON public.activity_events;

-- Create bulletproof activity_events policies using security definer functions
CREATE POLICY "Users can view activities for accessible funds and deals"
ON public.activity_events
FOR SELECT
TO authenticated
USING (user_can_access_activity(fund_id, deal_id));

CREATE POLICY "Users can manage activities for manageable funds and deals"
ON public.activity_events
FOR ALL
TO authenticated
USING (user_can_manage_activity(fund_id, deal_id))
WITH CHECK (user_can_manage_activity(fund_id, deal_id));