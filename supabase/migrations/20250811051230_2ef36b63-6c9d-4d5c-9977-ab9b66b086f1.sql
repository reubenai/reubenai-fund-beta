-- Update RLS policy to validate pre-populated fund_id and organization_id
-- Now that DocumentService pre-populates these fields, we can check them directly

DROP POLICY IF EXISTS "Users can insert documents for accessible deals" ON public.deal_documents;

CREATE POLICY "Users can insert documents for accessible deals"
ON public.deal_documents
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND uploaded_by = auth.uid()
  AND fund_id IS NOT NULL
  AND organization_id IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.organization_id = deal_documents.organization_id
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);