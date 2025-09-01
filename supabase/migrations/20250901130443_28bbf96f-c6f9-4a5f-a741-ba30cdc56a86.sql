-- Create perplexity2_datamining_vc table (following working table pattern)
CREATE TABLE public.perplexity2_datamining_vc (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid NOT NULL,
  fund_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  company_name text NOT NULL,
  category text NOT NULL DEFAULT 'comprehensive_analysis',
  processing_status text NOT NULL DEFAULT 'queued',
  raw_perplexity_response jsonb DEFAULT '{}'::jsonb,
  data_quality_score integer DEFAULT 0,
  confidence_score integer DEFAULT 0,
  subcategory_confidence jsonb DEFAULT '{}'::jsonb,
  subcategory_sources jsonb DEFAULT '{}'::jsonb,
  processed_at timestamp with time zone,
  snapshot_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.perplexity2_datamining_vc
  ADD CONSTRAINT perplexity2_datamining_vc_deal_id_fkey 
  FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;

ALTER TABLE public.perplexity2_datamining_vc
  ADD CONSTRAINT perplexity2_datamining_vc_fund_id_fkey 
  FOREIGN KEY (fund_id) REFERENCES public.funds(id) ON DELETE CASCADE;

ALTER TABLE public.perplexity2_datamining_vc
  ADD CONSTRAINT perplexity2_datamining_vc_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add unique constraint on deal_id (prevents duplicates)
ALTER TABLE public.perplexity2_datamining_vc
  ADD CONSTRAINT perplexity2_datamining_vc_deal_id_unique UNIQUE (deal_id);

-- Create indexes for performance
CREATE INDEX idx_perplexity2_datamining_vc_deal_id ON public.perplexity2_datamining_vc(deal_id);
CREATE INDEX idx_perplexity2_datamining_vc_processing_status ON public.perplexity2_datamining_vc(processing_status);
CREATE INDEX idx_perplexity2_datamining_vc_organization_id ON public.perplexity2_datamining_vc(organization_id);

-- Enable Row Level Security
ALTER TABLE public.perplexity2_datamining_vc ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Organization isolation for users
CREATE POLICY "Users can manage perplexity2 VC data for their organization"
ON public.perplexity2_datamining_vc
FOR ALL
USING (organization_id = get_jwt_org_id())
WITH CHECK (organization_id = get_jwt_org_id());

-- RLS Policy: Services can manage all records
CREATE POLICY "Services can manage all perplexity2 VC data"
ON public.perplexity2_datamining_vc
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policy: Super admins can manage all records
CREATE POLICY "Super admins can manage all perplexity2 VC data"
ON public.perplexity2_datamining_vc
FOR ALL
USING (is_super_admin_by_email())
WITH CHECK (is_super_admin_by_email());

-- Create trigger for updating updated_at column
CREATE TRIGGER update_perplexity2_datamining_vc_updated_at
  BEFORE UPDATE ON public.perplexity2_datamining_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_perplexity_vc();

-- Create trigger to auto-populate organization_id from deal
CREATE OR REPLACE FUNCTION public.populate_perplexity2_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT d.organization_id INTO NEW.organization_id
    FROM public.deals d 
    WHERE d.id = NEW.deal_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER populate_perplexity2_datamining_vc_organization_id
  BEFORE INSERT ON public.perplexity2_datamining_vc
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_perplexity2_organization_id();