-- Fix RLS policy timing issue for deal_documents INSERT
-- The current policy checks organization_id/fund_id which are NULL during insert
-- Update to check deal access directly via JOINs

DROP POLICY IF EXISTS "Users can insert documents for accessible deals" ON public.deal_documents;

CREATE POLICY "Users can insert documents for accessible deals"
ON public.deal_documents
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE d.id = deal_documents.deal_id
      AND p.user_id = auth.uid()
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);