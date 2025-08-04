-- Fix the RLS policy for deal_documents INSERT operations
DROP POLICY IF EXISTS "Users can manage deal documents with proper access" ON public.deal_documents;

-- Create corrected policy with proper WITH CHECK clause
CREATE POLICY "Users can manage deal documents with proper access"
ON public.deal_documents
FOR ALL
USING (
  (deal_id IN (
    SELECT d.id
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )) AND has_document_management_access()
)
WITH CHECK (
  (deal_id IN (
    SELECT d.id
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )) AND has_document_management_access()
);