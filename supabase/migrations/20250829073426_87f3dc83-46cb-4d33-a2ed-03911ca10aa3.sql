-- Create simplified RLS policies that don't depend on JWT functions
-- These will work alongside the existing policies as alternatives

-- Add policy for deal_documents based on direct profile organization check
CREATE POLICY "Profile-based document access for same organization"
ON public.deal_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.deals d ON d.id = deal_documents.deal_id
    JOIN public.funds f ON f.id = d.fund_id
    WHERE p.user_id = auth.uid()
      AND p.organization_id = f.organization_id
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);

-- Add policy for document insertion based on profile organization
CREATE POLICY "Profile-based document upload for same organization"
ON public.deal_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.deals d ON d.id = deal_documents.deal_id
    JOIN public.funds f ON f.id = d.fund_id
    WHERE p.user_id = auth.uid()
      AND p.organization_id = f.organization_id
      AND p.role IN ('super_admin', 'admin', 'fund_manager', 'analyst')
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
      AND deal_documents.uploaded_by = auth.uid()
  )
);

-- Add policy for deals table to ensure users can see deals from their organization
CREATE POLICY "Profile-based deal access for same organization"
ON public.deals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.funds f ON f.id = deals.fund_id
    WHERE p.user_id = auth.uid()
      AND p.organization_id = f.organization_id
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);

-- Add policy for funds table to ensure users can see funds from their organization
CREATE POLICY "Profile-based fund access for same organization"
ON public.funds
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.organization_id = funds.organization_id
      AND (p.is_deleted IS NULL OR p.is_deleted = false)
  )
);