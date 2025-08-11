-- Add missing data_snippet column to deal_analysis_sources table
ALTER TABLE public.deal_analysis_sources 
ADD COLUMN data_snippet TEXT;