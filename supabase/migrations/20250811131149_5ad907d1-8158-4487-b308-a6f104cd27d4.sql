-- Add comprehensive company fields for detailed deal tracking
ALTER TABLE public.deals
ADD COLUMN company_stage TEXT,
ADD COLUMN founding_year INTEGER,
ADD COLUMN founder_email TEXT,
ADD COLUMN co_founders TEXT[],
ADD COLUMN headquarters TEXT,
ADD COLUMN countries_of_operation TEXT[],
ADD COLUMN funding_stage TEXT,
ADD COLUMN previous_funding_amount BIGINT,
ADD COLUMN competitors TEXT[],
ADD COLUMN key_customers TEXT[],
ADD COLUMN revenue_model TEXT,
ADD COLUMN target_market TEXT,
ADD COLUMN technology_stack TEXT[];