-- Add approval_notes column to ic_memos table
ALTER TABLE public.ic_memos 
ADD COLUMN approval_notes TEXT;