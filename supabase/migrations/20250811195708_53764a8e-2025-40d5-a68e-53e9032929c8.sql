-- Update RLS policies for deals table to include analyst role

-- Drop existing policies
DROP POLICY IF EXISTS "Fund managers can create deals in their organization" ON deals;
DROP POLICY IF EXISTS "Fund managers can update deals in their organization" ON deals;  
DROP POLICY IF EXISTS "Fund managers can delete deals in their organization" ON deals;

-- Recreate policies with analyst role included
CREATE POLICY "Fund managers and analysts can create deals in their organization"
ON deals FOR INSERT
WITH CHECK (
  (auth.email() ~~ '%@goreuben.com'::text) OR 
  (auth.email() ~~ '%@reuben.com'::text) OR 
  (fund_id IN ( 
    SELECT f.id
    FROM (funds f JOIN profiles p ON ((f.organization_id = p.organization_id)))
    WHERE ((p.user_id = auth.uid()) AND 
           (p.role = ANY (ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role, 'analyst'::user_role])) AND 
           ((p.is_deleted IS NULL) OR (p.is_deleted = false)))
  ))
);

CREATE POLICY "Fund managers and analysts can update deals in their organization"  
ON deals FOR UPDATE
USING (
  (auth.email() ~~ '%@goreuben.com'::text) OR 
  (auth.email() ~~ '%@reuben.com'::text) OR 
  (fund_id IN ( 
    SELECT f.id
    FROM (funds f JOIN profiles p ON ((f.organization_id = p.organization_id)))
    WHERE ((p.user_id = auth.uid()) AND 
           (p.role = ANY (ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role, 'analyst'::user_role])) AND 
           ((p.is_deleted IS NULL) OR (p.is_deleted = false)))
  ))
)
WITH CHECK (
  (auth.email() ~~ '%@goreuben.com'::text) OR 
  (auth.email() ~~ '%@reuben.com'::text) OR 
  (fund_id IN ( 
    SELECT f.id
    FROM (funds f JOIN profiles p ON ((f.organization_id = p.organization_id)))
    WHERE ((p.user_id = auth.uid()) AND 
           (p.role = ANY (ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role, 'analyst'::user_role])) AND 
           ((p.is_deleted IS NULL) OR (p.is_deleted = false)))
  ))
);

CREATE POLICY "Fund managers and analysts can delete deals in their organization"
ON deals FOR DELETE
USING (
  (auth.email() ~~ '%@goreuben.com'::text) OR 
  (auth.email() ~~ '%@reuben.com'::text) OR 
  (fund_id IN ( 
    SELECT f.id
    FROM (funds f JOIN profiles p ON ((f.organization_id = p.organization_id)))
    WHERE ((p.user_id = auth.uid()) AND 
           (p.role = ANY (ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role, 'analyst'::user_role])) AND 
           ((p.is_deleted IS NULL) OR (p.is_deleted = false)))
  ))
);