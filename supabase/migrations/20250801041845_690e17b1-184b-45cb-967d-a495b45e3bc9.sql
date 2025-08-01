-- Add extracted text and parsed data fields to deal_documents table
ALTER TABLE public.deal_documents 
ADD COLUMN IF NOT EXISTS extracted_text TEXT,
ADD COLUMN IF NOT EXISTS parsed_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS parsing_status TEXT DEFAULT 'pending';

-- Create index for better text search performance
CREATE INDEX IF NOT EXISTS idx_deal_documents_extracted_text 
ON public.deal_documents USING gin(to_tsvector('english', extracted_text));

-- Add trigger to populate deal_document_relations when documents are inserted
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

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'populate_deal_document_relations_trigger'
  ) THEN
    CREATE TRIGGER populate_deal_document_relations_trigger
      BEFORE INSERT ON public.deal_documents
      FOR EACH ROW
      EXECUTE FUNCTION public.populate_deal_document_relations();
  END IF;
END
$$;