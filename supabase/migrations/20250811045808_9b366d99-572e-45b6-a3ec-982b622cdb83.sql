-- Fix document upload RLS policies and authentication context

-- Drop existing problematic INSERT policy
DROP POLICY IF EXISTS "Users can insert documents for valid deals" ON deal_documents;

-- Create new INSERT policy that uses direct database lookup instead of JWT claims
CREATE POLICY "Users can insert documents for accessible deals" ON deal_documents
FOR INSERT 
WITH CHECK (
  -- Ensure user is authenticated
  auth.uid() IS NOT NULL 
  AND 
  -- Ensure user can access the deal through organization membership
  EXISTS (
    SELECT 1 
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE d.id = deal_documents.deal_id 
      AND p.user_id = auth.uid()
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
  AND
  -- Ensure uploaded_by is set to current user
  uploaded_by = auth.uid()
);

-- Update SELECT policy to be more explicit about organization access
DROP POLICY IF EXISTS "Users can view documents for accessible deals" ON deal_documents;

CREATE POLICY "Users can view documents for accessible deals" ON deal_documents
FOR SELECT 
USING (
  -- Super admin access
  jwt_is_super_admin() 
  OR 
  -- Organization member access through deal relationship
  EXISTS (
    SELECT 1 
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE d.id = deal_documents.deal_id 
      AND p.user_id = auth.uid()
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);

-- Ensure the trigger function is working correctly
CREATE OR REPLACE FUNCTION public.populate_deal_document_relations()
RETURNS TRIGGER AS $$
BEGIN
  -- Get organization_id and fund_id from the associated deal
  SELECT f.organization_id, d.fund_id
  INTO NEW.organization_id, NEW.fund_id
  FROM deals d
  JOIN funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  -- Ensure we found the data
  IF NEW.organization_id IS NULL OR NEW.fund_id IS NULL THEN
    RAISE EXCEPTION 'Could not populate organization_id and fund_id for deal_id: %', NEW.deal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;