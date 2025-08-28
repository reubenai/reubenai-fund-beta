-- Add IC decision fields to deals table for complete audit trail
ALTER TABLE public.deals 
ADD COLUMN ic_decision_id uuid REFERENCES public.ic_voting_decisions(id),
ADD COLUMN ic_decision_date timestamp with time zone,
ADD COLUMN ic_decision_outcome text CHECK (ic_decision_outcome IN ('approved', 'rejected', 'deferred'));