-- Fix RLS policies to properly handle Super Admin access for deal documents

-- First, update the deal_documents table policy
DROP POLICY IF EXISTS "Users can manage deal documents with proper access" ON public.deal_documents;

CREATE POLICY "Users can manage deal documents with proper access"
ON public.deal_documents
FOR ALL
USING (
  -- Super admins (by email) have access to everything
  (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com') OR
  -- Or users with document management access in the same organization
  ((deal_id IN (
    SELECT d.id
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )) AND has_document_management_access())
)
WITH CHECK (
  -- Super admins (by email) can upload to any deal
  (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com') OR
  -- Or users with document management access in the same organization
  ((deal_id IN (
    SELECT d.id
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )) AND has_document_management_access())
);

-- Also fix the storage policy to handle Super Admin access
DROP POLICY IF EXISTS "Users can upload deal documents for accessible deals" ON storage.objects;

CREATE POLICY "Users can upload deal documents for accessible deals"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'deal-documents' 
  AND auth.uid() IS NOT NULL 
  AND (
    -- Super admins (by email) can upload to any deal
    (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com') OR
    -- Or users with proper access in their organization
    (has_document_management_access() AND
     (substring(name, 1, position('/' in name) - 1))::uuid IN (
      SELECT d.id
      FROM deals d
      JOIN funds f ON d.fund_id = f.id
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
     )
    )
  )
);