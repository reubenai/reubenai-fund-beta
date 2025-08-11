-- Fix deal_documents RLS policy to allow trigger population
-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert deal documents for accessible deals" ON public.deal_documents;

-- Create simplified INSERT policy that allows authenticated users to insert for valid deals
-- The trigger will populate organization_id and fund_id after successful insert
CREATE POLICY "Users can insert documents for valid deals" 
ON public.deal_documents 
FOR INSERT 
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL 
  AND 
  -- Deal must exist
  EXISTS (
    SELECT 1 FROM public.deals 
    WHERE id = deal_documents.deal_id
  )
  AND
  -- User must be the one uploading
  uploaded_by = auth.uid()
);

-- Update SELECT policy to be more explicit about organization access
DROP POLICY IF EXISTS "JWT User deal documents access" ON public.deal_documents;
CREATE POLICY "Users can view documents for accessible deals" 
ON public.deal_documents 
FOR SELECT 
USING (
  -- Super admin access
  jwt_is_super_admin() 
  OR 
  -- User in same organization as the deal's fund
  (organization_id IS NOT NULL AND organization_id = jwt_org_id())
  OR
  -- Fallback: check through deal -> fund -> organization relationship
  (deal_id IN (
    SELECT d.id 
    FROM deals d 
    JOIN funds f ON d.fund_id = f.id 
    WHERE f.organization_id = jwt_org_id()
  ))
);

-- Ensure the trigger function properly handles the population
CREATE OR REPLACE FUNCTION public.populate_deal_document_relations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;