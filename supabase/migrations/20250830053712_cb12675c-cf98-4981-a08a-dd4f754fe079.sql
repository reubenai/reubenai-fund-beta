-- Add summary_narrative column to deal_documents table
ALTER TABLE public.deal_documents 
ADD COLUMN summary_narrative text;