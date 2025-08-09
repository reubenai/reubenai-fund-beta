-- Add enhanced_analysis column to deals table
ALTER TABLE public.deals 
ADD COLUMN enhanced_analysis JSONB DEFAULT NULL;

-- Create index for enhanced_analysis queries
CREATE INDEX IF NOT EXISTS idx_deals_enhanced_analysis ON public.deals USING GIN(enhanced_analysis);

-- Add comment to document the column
COMMENT ON COLUMN public.deals.enhanced_analysis IS 'Stores comprehensive AI analysis results including rubric breakdown, notes intelligence, and analysis engines data';