-- Create document analysis status enum
CREATE TYPE document_analysis_status AS ENUM (
  'pending',
  'processing', 
  'completed',
  'failed',
  'skipped'
);

-- Create document category enum
CREATE TYPE document_category AS ENUM (
  'pitch_deck',
  'financial_statement',
  'legal_document',
  'market_research',
  'due_diligence',
  'term_sheet',
  'cap_table',
  'other'
);

-- Create storage buckets for documents
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('deal-documents', 'deal-documents', false),
  ('fund-documents', 'fund-documents', false),
  ('organization-documents', 'organization-documents', false);

-- Create storage policies for deal documents
CREATE POLICY "Users can view deal documents for accessible deals" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'deal-documents' AND 
       (SELECT deal_id::text FROM deal_documents WHERE storage_path = name LIMIT 1) IN 
       (SELECT d.id::text FROM deals d JOIN funds f ON d.fund_id = f.id JOIN profiles p ON f.organization_id = p.organization_id WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can upload deal documents for accessible deals" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'deal-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update deal documents for accessible deals" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'deal-documents' AND 
       (SELECT deal_id::text FROM deal_documents WHERE storage_path = name LIMIT 1) IN 
       (SELECT d.id::text FROM deals d JOIN funds f ON d.fund_id = f.id JOIN profiles p ON f.organization_id = p.organization_id WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'fund_manager', 'analyst')));

CREATE POLICY "Users can delete deal documents for accessible deals" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'deal-documents' AND 
       (SELECT deal_id::text FROM deal_documents WHERE storage_path = name LIMIT 1) IN 
       (SELECT d.id::text FROM deals d JOIN funds f ON d.fund_id = f.id JOIN profiles p ON f.organization_id = p.organization_id WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'fund_manager', 'analyst')));

-- Create storage policies for fund documents
CREATE POLICY "Users can view fund documents for accessible funds" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'fund-documents' AND 
       (SELECT fund_id::text FROM deal_documents WHERE storage_path = name LIMIT 1) IN 
       (SELECT f.id::text FROM funds f JOIN profiles p ON f.organization_id = p.organization_id WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can manage fund documents for accessible funds" 
ON storage.objects FOR ALL 
USING (bucket_id = 'fund-documents' AND auth.uid() IS NOT NULL);

-- Create storage policies for organization documents
CREATE POLICY "Users can view organization documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'organization-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage organization documents" 
ON storage.objects FOR ALL 
USING (bucket_id = 'organization-documents' AND auth.uid() IS NOT NULL);

-- Add new columns to deal_documents table
ALTER TABLE deal_documents 
ADD COLUMN organization_id uuid,
ADD COLUMN fund_id uuid,
ADD COLUMN document_category document_category,
ADD COLUMN document_type text,
ADD COLUMN bucket_name text DEFAULT 'deal-documents',
ADD COLUMN storage_path text,
ADD COLUMN version integer DEFAULT 1,
ADD COLUMN document_analysis_status document_analysis_status DEFAULT 'pending',
ADD COLUMN document_analysis_id uuid,
ADD COLUMN tags text[],
ADD COLUMN description text,
ADD COLUMN is_public boolean DEFAULT false,
ADD COLUMN deleted_at timestamp with time zone,
ADD COLUMN original_filename text,
ADD COLUMN mime_type text;

-- Update existing records to have proper bucket_name and storage_path
UPDATE deal_documents 
SET storage_path = file_path,
    original_filename = name,
    mime_type = content_type;

-- Create indexes for better performance
CREATE INDEX idx_deal_documents_organization_id ON deal_documents(organization_id);
CREATE INDEX idx_deal_documents_fund_id ON deal_documents(fund_id);
CREATE INDEX idx_deal_documents_category ON deal_documents(document_category);
CREATE INDEX idx_deal_documents_analysis_status ON deal_documents(document_analysis_status);
CREATE INDEX idx_deal_documents_tags ON deal_documents USING GIN(tags);
CREATE INDEX idx_deal_documents_deleted_at ON deal_documents(deleted_at);

-- Create function to auto-populate organization_id and fund_id
CREATE OR REPLACE FUNCTION populate_deal_document_relations()
RETURNS TRIGGER AS $$
BEGIN
  -- Get fund_id and organization_id from the deal
  SELECT d.fund_id, f.organization_id
  INTO NEW.fund_id, NEW.organization_id
  FROM deals d
  JOIN funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate relations
CREATE TRIGGER trigger_populate_deal_document_relations
  BEFORE INSERT OR UPDATE ON deal_documents
  FOR EACH ROW
  EXECUTE FUNCTION populate_deal_document_relations();