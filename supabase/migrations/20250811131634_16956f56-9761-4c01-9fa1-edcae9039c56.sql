-- Add new fields for capital tracking
ALTER TABLE public.deals
ADD COLUMN capital_raised_to_date BIGINT,
ADD COLUMN current_round_size BIGINT;