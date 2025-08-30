-- Drop the conflicting trigger that's causing the upload error
-- This trigger conflicts with DocumentService which already sets fund_id and organization_id
DROP TRIGGER IF EXISTS populate_deal_document_relations_trigger ON public.deal_documents;

-- Drop the function as well since it's no longer needed
DROP FUNCTION IF EXISTS public.populate_deal_document_relations();

-- Verify that deal_documents table structure is correct
-- The DocumentService already handles setting fund_id and organization_id properly