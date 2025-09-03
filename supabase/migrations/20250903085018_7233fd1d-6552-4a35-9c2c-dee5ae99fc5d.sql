-- Re-enable IC memo drafting system
UPDATE public.feature_flags 
SET flag_value = true, updated_at = now()
WHERE flag_name = 'ic_memo_drafter_v1';