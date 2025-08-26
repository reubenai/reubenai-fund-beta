-- Add document_summary column to deal_documents table
ALTER TABLE public.deal_documents 
ADD COLUMN document_summary JSONB DEFAULT NULL;

-- Add index for better query performance on document summary
CREATE INDEX IF NOT EXISTS idx_deal_documents_document_summary 
ON public.deal_documents USING GIN (document_summary);

-- Add comment to explain the structure
COMMENT ON COLUMN public.deal_documents.document_summary IS 'Investment summary containing narrative and structured VC criteria data points (TAM, SAM, SOM, CAGR, etc.)';