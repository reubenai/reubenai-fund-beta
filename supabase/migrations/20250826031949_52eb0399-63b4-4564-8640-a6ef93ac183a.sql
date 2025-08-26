-- Analysis Queue Cleanup: Cancel queued items due to engine shutdown

-- Step 1: Cancel queued analysis items
UPDATE analysis_queue 
SET status = 'cancelled',
    error_message = 'Analysis engines permanently shut down - manual cleanup',
    completed_at = now(),
    updated_at = now()
WHERE status = 'queued' 
AND deal_id IN ('937af150-c4e8-4af6-badb-23464b6be701', '9f9caa2f-896a-4042-b182-2ed70619d19d', '3fa9d788-682e-41d5-8dd0-6cc0d99080ef', 'd7bf7671-2fef-49e2-8e5e-ac3163f463e5');

-- Step 2: Clear analysis flags from deals
UPDATE deals 
SET analysis_queue_status = NULL,
    last_analysis_trigger = NULL,
    updated_at = now()
WHERE id IN ('937af150-c4e8-4af6-badb-23464b6be701', '9f9caa2f-896a-4042-b182-2ed70619d19d', '3fa9d788-682e-41d5-8dd0-6cc0d99080ef', 'd7bf7671-2fef-49e2-8e5e-ac3163f463e5');

-- Step 3: Log cleanup operation for audit trail
INSERT INTO activity_events (
    user_id, 
    fund_id, 
    activity_type, 
    title, 
    description, 
    context_data, 
    is_system_event, 
    priority
) 
SELECT DISTINCT
    '00000000-0000-0000-0000-000000000000'::uuid, -- System user
    d.fund_id,
    'system_cleanup',
    'Analysis Queue Cleanup',
    'Cancelled queued analysis items due to permanently shut down engines',
    jsonb_build_object(
        'cleanup_reason', 'engines_permanently_shut_down',
        'items_cancelled', 4,
        'company_names', array_agg(d.company_name),
        'deal_ids', array_agg(d.id::text)
    ),
    true,
    'low'
FROM deals d 
WHERE d.id IN ('937af150-c4e8-4af6-badb-23464b6be701', '9f9caa2f-896a-4042-b182-2ed70619d19d', '3fa9d788-682e-41d5-8dd0-6cc0d99080ef', 'd7bf7671-2fef-49e2-8e5e-ac3163f463e5')
GROUP BY d.fund_id;