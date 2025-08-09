-- Add overall_score column to deal_analyses table to fix the query mismatch
ALTER TABLE public.deal_analyses ADD COLUMN IF NOT EXISTS overall_score integer;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_deal_analyses_overall_score ON public.deal_analyses(overall_score);

-- Create or replace function to calculate overall score from individual scores
CREATE OR REPLACE FUNCTION public.calculate_overall_score(
  thesis_score integer DEFAULT NULL,
  leadership_score integer DEFAULT NULL,
  market_score integer DEFAULT NULL,
  product_score integer DEFAULT NULL,
  financial_score integer DEFAULT NULL,
  traction_score integer DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
  result_score integer;
  total_weighted numeric := 0;
  total_weight numeric := 0;
BEGIN
  -- Calculate weighted average of available scores
  IF thesis_score IS NOT NULL THEN
    total_weighted := total_weighted + (thesis_score * 0.2);
    total_weight := total_weight + 0.2;
  END IF;
  
  IF leadership_score IS NOT NULL THEN
    total_weighted := total_weighted + (leadership_score * 0.2);
    total_weight := total_weight + 0.2;
  END IF;
  
  IF market_score IS NOT NULL THEN
    total_weighted := total_weighted + (market_score * 0.2);
    total_weight := total_weight + 0.2;
  END IF;
  
  IF product_score IS NOT NULL THEN
    total_weighted := total_weighted + (product_score * 0.15);
    total_weight := total_weight + 0.15;
  END IF;
  
  IF financial_score IS NOT NULL THEN
    total_weighted := total_weighted + (financial_score * 0.15);
    total_weight := total_weight + 0.15;
  END IF;
  
  IF traction_score IS NOT NULL THEN
    total_weighted := total_weighted + (traction_score * 0.1);
    total_weight := total_weight + 0.1;
  END IF;
  
  -- Return weighted average or NULL if no scores
  IF total_weight > 0 THEN
    result_score := ROUND(total_weighted / total_weight);
  ELSE
    result_score := NULL;
  END IF;
  
  RETURN result_score;
END;
$function$;

-- Create trigger to automatically calculate overall_score when individual scores change
CREATE OR REPLACE FUNCTION public.update_overall_score()
RETURNS TRIGGER AS $function$
BEGIN
  NEW.overall_score = calculate_overall_score(
    NEW.thesis_alignment_score,
    NEW.leadership_score,
    NEW.market_score,
    NEW.product_score,
    NEW.financial_score,
    NEW.traction_score
  );
  RETURN NEW;
END;
$function$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_overall_score ON public.deal_analyses;
CREATE TRIGGER trigger_update_overall_score
  BEFORE INSERT OR UPDATE ON public.deal_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_overall_score();

-- Update existing records to calculate overall_score
UPDATE public.deal_analyses 
SET overall_score = calculate_overall_score(
  thesis_alignment_score,
  leadership_score,
  market_score,
  product_score,
  financial_score,
  traction_score
)
WHERE overall_score IS NULL;