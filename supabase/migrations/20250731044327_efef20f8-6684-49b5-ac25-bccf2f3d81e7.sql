-- Add missing fields to deals table for enhanced deal cards
ALTER TABLE public.deals 
ADD COLUMN founder TEXT,
ADD COLUMN linkedin_url TEXT,
ADD COLUMN crunchbase_url TEXT,
ADD COLUMN primary_source TEXT DEFAULT 'manual',
ADD COLUMN web_presence_confidence INTEGER,
ADD COLUMN source_confidence_score INTEGER,
ADD COLUMN company_validation_status TEXT DEFAULT 'pending',
ADD COLUMN employee_count INTEGER,
ADD COLUMN business_model TEXT,
ADD COLUMN rag_reasoning JSONB,
ADD COLUMN rag_confidence INTEGER,
ADD COLUMN next_action TEXT,
ADD COLUMN priority TEXT DEFAULT 'medium';