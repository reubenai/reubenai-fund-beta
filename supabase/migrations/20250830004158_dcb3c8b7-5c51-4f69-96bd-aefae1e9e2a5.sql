-- Add new columns for splitting document_summary into separate VC and PE data points
ALTER TABLE public.deal_documents 
ADD COLUMN data_points_vc JSONB DEFAULT NULL,
ADD COLUMN data_points_pe JSONB DEFAULT NULL;

-- Create GIN indexes for performance on new JSONB columns
CREATE INDEX IF NOT EXISTS idx_deal_documents_data_points_vc_gin ON public.deal_documents USING gin(data_points_vc);
CREATE INDEX IF NOT EXISTS idx_deal_documents_data_points_pe_gin ON public.deal_documents USING gin(data_points_pe);

-- Migrate existing document_summary data to new structure
UPDATE public.deal_documents 
SET 
  data_points_vc = CASE 
    WHEN document_summary->>'data_points' IS NOT NULL 
    THEN document_summary->'data_points'
    ELSE NULL 
  END,
  document_summary = CASE 
    WHEN document_summary->>'narrative' IS NOT NULL 
    THEN jsonb_build_object('narrative', document_summary->'narrative')
    ELSE document_summary 
  END
WHERE document_summary IS NOT NULL;