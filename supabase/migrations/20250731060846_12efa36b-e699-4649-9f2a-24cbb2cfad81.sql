-- Create storage buckets for document management
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('deal-documents', 'deal-documents', false),
  ('fund-documents', 'fund-documents', false),
  ('organization-documents', 'organization-documents', false);

-- Create enums for document categorization
CREATE TYPE public.document_category AS ENUM (
  'pitch_deck',
  'financial_statement', 
  'legal_document',
  'business_plan',
  'technical_documentation',
  'market_research',
  'due_diligence',
  'other'
);

CREATE TYPE public.document_analysis_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'skipped'
);

-- Add new columns to deal_documents table
ALTER TABLE public.deal_documents 
ADD COLUMN organization_id uuid,
ADD COLUMN fund_id uuid,
ADD COLUMN bucket_name text DEFAULT 'deal-documents',
ADD COLUMN storage_path text,
ADD COLUMN document_category public.document_category DEFAULT 'other',
ADD COLUMN document_type text,
ADD COLUMN document_analysis_status public.document_analysis_status DEFAULT 'pending',
ADD COLUMN document_analysis_id uuid,
ADD COLUMN tags text[] DEFAULT '{}',
ADD COLUMN version integer DEFAULT 1,
ADD COLUMN is_public boolean DEFAULT false,
ADD COLUMN metadata jsonb DEFAULT '{}';

-- Update existing records to populate organization_id and fund_id
UPDATE public.deal_documents 
SET 
  organization_id = f.organization_id,
  fund_id = d.fund_id
FROM deals d
JOIN funds f ON d.fund_id = f.id
WHERE deal_documents.deal_id = d.id;

-- Create function to auto-populate organization_id and fund_id for new documents
CREATE OR REPLACE FUNCTION public.populate_deal_document_relations()
RETURNS TRIGGER AS $$
BEGIN
  -- Get organization_id and fund_id from the associated deal
  SELECT f.organization_id, d.fund_id
  INTO NEW.organization_id, NEW.fund_id
  FROM deals d
  JOIN funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate relations on insert/update
CREATE TRIGGER populate_deal_document_relations_trigger
  BEFORE INSERT OR UPDATE ON public.deal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_deal_document_relations();

-- Create indexes for efficient querying
CREATE INDEX idx_deal_documents_organization_id ON public.deal_documents(organization_id);
CREATE INDEX idx_deal_documents_fund_id ON public.deal_documents(fund_id);
CREATE INDEX idx_deal_documents_bucket_name ON public.deal_documents(bucket_name);
CREATE INDEX idx_deal_documents_document_category ON public.deal_documents(document_category);
CREATE INDEX idx_deal_documents_document_analysis_status ON public.deal_documents(document_analysis_status);
CREATE INDEX idx_deal_documents_storage_path ON public.deal_documents(storage_path);
CREATE INDEX idx_deal_documents_tags ON public.deal_documents USING GIN(tags);