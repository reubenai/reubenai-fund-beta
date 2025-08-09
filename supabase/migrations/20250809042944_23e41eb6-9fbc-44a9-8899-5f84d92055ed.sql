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
BEGIN
  -- Calculate weighted average of available scores
  -- Skip null values in calculation
  WITH score_data AS (
    SELECT 
      COALESCE(thesis_score, 0) * 0.2 as thesis_weighted,
      COALESCE(leadership_score, 0) * 0.2 as leadership_weighted,
      COALESCE(market_score, 0) * 0.2 as market_weighted,
      COALESCE(product_score, 0) * 0.15 as product_weighted,
      COALESCE(financial_score, 0) * 0.15 as financial_weighted,
      COALESCE(traction_score, 0) * 0.1 as traction_weighted,
      (
        CASE WHEN thesis_score IS NOT NULL THEN 0.2 ELSE 0 END +
        CASE WHEN leadership_score IS NOT NULL THEN 0.2 ELSE 0 END +
        CASE WHEN market_score IS NOT NULL THEN 0.2 ELSE 0 END +
        CASE WHEN product_score IS NOT NULL THEN 0.15 ELSE 0 END +
        CASE WHEN financial_score IS NOT NULL THEN 0.15 ELSE 0 END +
        CASE WHEN traction_score IS NOT NULL THEN 0.1 ELSE 0 END
      ) as total_weight
  )
  SELECT 
    CASE 
      WHEN total_weight > 0 THEN 
        ROUND((thesis_weighted + leadership_weighted + market_weighted + product_weighted + financial_weighted + traction_weighted) / total_weight)::integer
      ELSE 
        NULL
    END
  FROM score_data INTO return_value;
  
  RETURN return_value;
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