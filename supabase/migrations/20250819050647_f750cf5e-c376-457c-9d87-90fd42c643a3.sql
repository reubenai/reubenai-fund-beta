-- Fix storage policy for super admin cross-organization document uploads

-- Drop existing INSERT policy for deal-documents storage
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;

-- Create new INSERT policy that allows super admins to upload across organizations
CREATE POLICY "Users can upload documents with proper access" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'deal-documents' AND (
    -- Super admin emails can upload anywhere
    (auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com') OR
    -- Regular users: check organization membership via deal->fund->organization path
    EXISTS (
      SELECT 1
      FROM deals d
      JOIN funds f ON d.fund_id = f.id
      JOIN profiles p ON f.organization_id = p.organization_id
      WHERE d.id::text = split_part(name, '/', 1)  -- Extract deal_id from path
        AND p.user_id = auth.uid()
        AND (p.is_deleted IS NULL OR p.is_deleted = false)
    )
  )
);

-- Also ensure super admins can read all documents
CREATE POLICY "Super admins can read all deal documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'deal-documents' AND (
    auth.email() LIKE '%@goreuben.com' OR auth.email() LIKE '%@reuben.com'
  )
);