-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION public.populate_deal_document_relations()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Get organization_id and fund_id from the associated deal
  SELECT f.organization_id, d.fund_id
  INTO NEW.organization_id, NEW.fund_id
  FROM deals d
  JOIN funds f ON d.fund_id = f.id
  WHERE d.id = NEW.deal_id;
  
  RETURN NEW;
END;
$$;