-- Add primary key to deal_documents table to support upsert operations
-- This will fix the ON CONFLICT error in document uploads
ALTER TABLE public.deal_documents 
ADD CONSTRAINT deal_documents_pkey PRIMARY KEY (id);

-- Also add a unique constraint on (deal_id, file_path) to prevent duplicate files
ALTER TABLE public.deal_documents 
ADD CONSTRAINT deal_documents_deal_file_unique 
UNIQUE (deal_id, file_path);