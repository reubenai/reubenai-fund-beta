-- Drop the existing policy with hardcoded roles
DROP POLICY IF EXISTS "Users can manage deal documents for accessible deals" ON public.deal_documents;

-- Create new policy using the document management access function
CREATE POLICY "Users can manage deal documents with proper access" 
  ON public.deal_documents 
  FOR ALL 
  USING (
    deal_id IN (
      SELECT d.id
      FROM deals d
      JOIN funds f ON d.fund_id = f.id
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
    ) AND public.has_document_management_access()
  );