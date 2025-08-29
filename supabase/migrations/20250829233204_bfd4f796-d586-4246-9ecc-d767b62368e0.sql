-- Drop existing problematic JWT-dependent policies on deal_documents
DROP POLICY IF EXISTS "JWT Super admin deal documents access" ON public.deal_documents;
DROP POLICY IF EXISTS "Users can view documents for accessible deals" ON public.deal_documents;
DROP POLICY IF EXISTS "Users can manage documents for accessible deals" ON public.deal_documents;
DROP POLICY IF EXISTS "Users can manage deal documents for accessible funds" ON public.deal_documents;
DROP POLICY IF EXISTS "Super admins can manage all deal documents" ON public.deal_documents;

-- Create new RLS policies that mirror the working storage policies exactly

-- Policy for SELECT (viewing documents)
CREATE POLICY "Admin and org users can view deal documents" 
ON public.deal_documents 
FOR SELECT 
USING (
  (auth.email() ~~ '%@goreuben.com'::text) OR 
  (auth.email() ~~ '%@reuben.com'::text) OR 
  (EXISTS (
    SELECT 1 
    FROM ((deals d JOIN funds f ON ((d.fund_id = f.id))) JOIN profiles p ON ((f.organization_id = p.organization_id)))
    WHERE ((d.id = deal_documents.deal_id) AND (p.user_id = auth.uid()) AND ((p.is_deleted IS NULL) OR (p.is_deleted = false)))
  ))
);

-- Policy for UPDATE/DELETE (modifying documents)  
CREATE POLICY "Admin and org users can modify deal documents"
ON public.deal_documents 
FOR ALL
USING (
  (auth.email() ~~ '%@goreuben.com'::text) OR 
  (auth.email() ~~ '%@reuben.com'::text) OR 
  (EXISTS (
    SELECT 1 
    FROM deals d 
    WHERE ((d.id = deal_documents.deal_id) AND user_can_access_fund(d.fund_id))
  ))
)
WITH CHECK (
  (auth.email() ~~ '%@goreuben.com'::text) OR 
  (auth.email() ~~ '%@reuben.com'::text) OR 
  (EXISTS (
    SELECT 1 
    FROM ((deals d JOIN funds f ON ((d.fund_id = f.id))) JOIN profiles p ON ((f.organization_id = p.organization_id)))
    WHERE ((d.id = deal_documents.deal_id) AND (p.user_id = auth.uid()) AND ((p.is_deleted IS NULL) OR (p.is_deleted = false)))
  ))
);