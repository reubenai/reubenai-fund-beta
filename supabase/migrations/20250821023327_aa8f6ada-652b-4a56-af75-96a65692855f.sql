-- Emergency shutdown for Deal 7ac26a5f-34c9-4d30-b09c-c05d1d1df81d
-- This deal has been hammering the system with 13,455+ engine hits

-- 1. Block analysis until 2030
UPDATE public.deals 
SET analysis_blocked_until = '2030-01-01 00:00:00+00'::timestamp with time zone,
    auto_analysis_enabled = false,
    analysis_queue_status = 'blocked',
    last_analysis_trigger_reason = 'EMERGENCY_SHUTDOWN_EXCESSIVE_ACTIVITY'
WHERE id = '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d';

-- 2. Add to analysis allowlist as permanently disabled
INSERT INTO public.analysis_allowlist (deal_id, test_phase, notes, created_at)
VALUES (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  'permanently_disabled',
  'Emergency shutdown - Deal was causing excessive engine activity (13,455+ hits in 30 minutes)',
  now()
) ON CONFLICT (deal_id) DO UPDATE SET
  test_phase = 'permanently_disabled',
  notes = 'Emergency shutdown - Deal was causing excessive engine activity (13,455+ hits in 30 minutes)',
  created_at = now();

-- 3. Clear all queue items for this deal
DELETE FROM public.analysis_queue
WHERE deal_id = '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d';

-- 4. Create emergency deal blacklist table
CREATE TABLE IF NOT EXISTS public.emergency_deal_blacklist (
  deal_id UUID PRIMARY KEY,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT NOT NULL,
  blocked_by TEXT DEFAULT 'system'
);

-- Enable RLS on the blacklist table
ALTER TABLE public.emergency_deal_blacklist ENABLE ROW LEVEL SECURITY;

-- Create policy for the blacklist
CREATE POLICY "Reuben admins can manage emergency blacklist"
ON public.emergency_deal_blacklist
FOR ALL
USING (is_reuben_email())
WITH CHECK (is_reuben_email());

-- 5. Add the problematic deal to emergency blacklist
INSERT INTO public.emergency_deal_blacklist (deal_id, reason, blocked_by)
VALUES (
  '7ac26a5f-34c9-4d30-b09c-c05d1d1df81d',
  'Excessive engine activity - 13,455+ hits in 30 minutes causing system overload',
  'emergency_shutdown_system'
) ON CONFLICT (deal_id) DO UPDATE SET
  blocked_at = now(),
  reason = 'Excessive engine activity - 13,455+ hits in 30 minutes causing system overload',
  blocked_by = 'emergency_shutdown_system';