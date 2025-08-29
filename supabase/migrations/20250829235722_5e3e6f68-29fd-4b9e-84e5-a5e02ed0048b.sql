-- First, let's check current RLS policies on deal_documents table
-- and then simplify them to fix the conflicts

-- Drop all existing INSERT policies on deal_documents to remove conflicts
DROP POLICY IF EXISTS "Users can upload documents for deals in their organization" ON public.deal_documents;
DROP POLICY IF EXISTS "Users can upload documents for accessible deals" ON public.deal_documents;
DROP POLICY IF EXISTS "Users can manage documents for accessible deals" ON public.deal_documents;
DROP POLICY IF EXISTS "Fund managers can upload documents" ON public.deal_documents;
DROP POLICY IF EXISTS "Admin users can upload documents" ON public.deal_documents;

-- Create a single, clear INSERT policy that aligns with our permission logic
CREATE POLICY "Users can upload documents to deals in their accessible funds" 
ON public.deal_documents 
FOR INSERT 
WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL
  -- Must be the uploader
  AND uploaded_by = auth.uid()
  -- Must have access to the fund (either super admin or same organization)
  AND (
    -- Super admins can upload to any deal
    (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
    (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com' OR
    -- Regular users can upload to deals in their organization
    (deal_id IN (
      SELECT d.id 
      FROM public.deals d
      JOIN public.funds f ON d.fund_id = f.id
      WHERE f.organization_id = COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid,
        '550e8400-e29b-41d4-a716-446655440000'::uuid
      )
    ))
  )
);

-- Keep the existing SELECT, UPDATE, DELETE policies as they are working fine
-- Just ensure they exist and are not conflicting

-- Create or replace SELECT policy (if it doesn't exist)
DROP POLICY IF EXISTS "Users can view documents for accessible deals" ON public.deal_documents;
CREATE POLICY "Users can view documents for accessible deals" 
ON public.deal_documents 
FOR SELECT 
USING (
  -- Super admins can view all documents
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com' OR
  -- Regular users can view documents for deals in their organization
  (deal_id IN (
    SELECT d.id 
    FROM public.deals d
    JOIN public.funds f ON d.fund_id = f.id
    WHERE f.organization_id = COALESCE(
      (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid,
      '550e8400-e29b-41d4-a716-446655440000'::uuid
    )
  ))
);

-- Create or replace UPDATE policy
DROP POLICY IF EXISTS "Users can update documents they uploaded" ON public.deal_documents;
CREATE POLICY "Users can update documents they uploaded" 
ON public.deal_documents 
FOR UPDATE 
USING (
  -- Must be the uploader or super admin
  uploaded_by = auth.uid() OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
)
WITH CHECK (
  -- Same conditions for the updated row
  uploaded_by = auth.uid() OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
);

-- Create or replace DELETE policy  
DROP POLICY IF EXISTS "Users can delete documents they uploaded" ON public.deal_documents;
CREATE POLICY "Users can delete documents they uploaded" 
ON public.deal_documents 
FOR DELETE 
USING (
  -- Must be the uploader or super admin
  uploaded_by = auth.uid() OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@goreuben.com' OR
  (current_setting('request.jwt.claims', true)::jsonb ->> 'email') LIKE '%@reuben.com'
);