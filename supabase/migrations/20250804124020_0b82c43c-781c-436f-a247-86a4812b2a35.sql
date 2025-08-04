-- Update the deals SELECT policy to allow super_admin access to all deals
DROP POLICY IF EXISTS "Users can view deals in their organization" ON public.deals;

CREATE POLICY "Users can view deals with super_admin access" 
ON public.deals 
FOR SELECT 
USING (
  -- Super admins can see all deals
  public.get_user_role_simple() = 'super_admin' 
  OR 
  -- Regular users can see deals in their organization
  (fund_id IN ( 
    SELECT f.id
    FROM (funds f
      JOIN profiles p ON ((f.organization_id = p.organization_id)))
    WHERE (p.user_id = auth.uid())
  ))
);

-- Also update the deal_analyses policy for consistency
DROP POLICY IF EXISTS "Users can view deal analyses in their organization" ON public.deal_analyses;

CREATE POLICY "Users can view deal analyses with super_admin access" 
ON public.deal_analyses 
FOR SELECT 
USING (
  -- Super admins can see all deal analyses
  public.get_user_role_simple() = 'super_admin' 
  OR 
  -- Regular users can see deal analyses for deals in their organization
  (deal_id IN ( 
    SELECT d.id
    FROM ((deals d
      JOIN funds f ON ((d.fund_id = f.id)))
      JOIN profiles p ON ((f.organization_id = p.organization_id)))
    WHERE (p.user_id = auth.uid())
  ))
);