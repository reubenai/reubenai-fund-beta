-- Fix the storage policy for deal documents upload
-- The current policy extracts deal_id from file path but has complex logic
-- Let's simplify and make it more reliable

DROP POLICY IF EXISTS "Users can upload deal documents for accessible deals" ON storage.objects;

CREATE POLICY "Users can upload deal documents for accessible deals"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'deal-documents' 
  AND auth.uid() IS NOT NULL 
  AND has_document_management_access()
  AND (
    -- Extract deal_id from the path (format: {deal_id}/{filename})
    (substring(name, 1, position('/' in name) - 1))::uuid IN (
      SELECT d.id
      FROM deals d
      JOIN funds f ON d.fund_id = f.id
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
    )
  )
);