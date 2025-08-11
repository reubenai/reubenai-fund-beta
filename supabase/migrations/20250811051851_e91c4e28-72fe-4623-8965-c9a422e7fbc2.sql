-- Fix storage policies to not rely on JWT org_id claims
-- Update both INSERT and SELECT policies for deal-documents bucket

-- Drop existing storage policies
DROP POLICY IF EXISTS "deal-docs insert" ON storage.objects;
DROP POLICY IF EXISTS "deal-docs select" ON storage.objects;

-- Create new INSERT policy that validates via profiles table
CREATE POLICY "deal-docs insert" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'deal-documents'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE d.id = (NULLIF(split_part(objects.name, '/', 1), ''))::uuid
      AND p.user_id = auth.uid()
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);

-- Create new SELECT policy that validates via profiles table
CREATE POLICY "deal-docs select"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'deal-documents'
  AND EXISTS (
    SELECT 1
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE d.id = (NULLIF(split_part(objects.name, '/', 1), ''))::uuid
      AND p.user_id = auth.uid()
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);