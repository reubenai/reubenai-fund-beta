-- Phase 4: Evidence Integrity Hard Gate Table

-- Evidence Appendix Table (committed before scoring)
CREATE TABLE IF NOT EXISTS public.evidence_appendix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL,
  appendix_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for deal_id lookups
CREATE INDEX IF NOT EXISTS idx_evidence_appendix_deal_id ON public.evidence_appendix(deal_id);

-- Enable RLS
ALTER TABLE public.evidence_appendix ENABLE ROW LEVEL SECURITY;

-- RLS Policy - users can manage evidence appendix for accessible deals
CREATE POLICY "Users can manage evidence appendix for accessible deals" ON public.evidence_appendix
FOR ALL 
USING (
  deal_id IN (
    SELECT d.id
    FROM deals d
    JOIN funds f ON d.fund_id = f.id
    JOIN profiles p ON f.organization_id = p.organization_id
    WHERE p.user_id = auth.uid()
  )
);