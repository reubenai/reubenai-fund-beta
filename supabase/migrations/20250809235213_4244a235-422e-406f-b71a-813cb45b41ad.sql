-- Continue Phase 6: Fix remaining function search path issues

-- Get all functions that still need search path fixing
-- Update remaining functions with search path

CREATE OR REPLACE FUNCTION public.archive_old_activities()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  archived_count INTEGER := 0;
  row_count_var INTEGER;
  config_record RECORD;
BEGIN
  -- Loop through each active archival configuration
  FOR config_record IN 
    SELECT activity_type, priority, retention_days 
    FROM public.activity_archival_config 
    WHERE is_active = true
  LOOP
    -- Archive activities older than retention period
    INSERT INTO public.archived_activity_events (
      original_id, user_id, fund_id, deal_id, resource_id, activity_type, priority,
      title, description, context_data, change_data, tags, searchable_content,
      resource_type, session_id, user_agent, source_ip, is_system_event,
      is_visible, retention_date, occurred_at, created_at, updated_at
    )
    SELECT 
      id, user_id, fund_id, deal_id, resource_id, activity_type, priority,
      title, description, context_data, change_data, tags, searchable_content,
      resource_type, session_id, user_agent, source_ip, is_system_event,
      is_visible, retention_date, occurred_at, created_at, updated_at
    FROM public.activity_events
    WHERE activity_type = config_record.activity_type 
      AND priority = config_record.priority
      AND occurred_at < (now() - (config_record.retention_days || ' days')::interval)
      AND id NOT IN (SELECT original_id FROM public.archived_activity_events);
    
    GET DIAGNOSTICS row_count_var = ROW_COUNT;
    archived_count = archived_count + row_count_var;
    
    -- Delete archived activities from main table
    DELETE FROM public.activity_events
    WHERE activity_type = config_record.activity_type 
      AND priority = config_record.priority
      AND occurred_at < (now() - (config_record.retention_days || ' days')::interval);
  END LOOP;
  
  RETURN archived_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.restore_archived_activities(activity_ids uuid[] DEFAULT NULL::uuid[], start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, end_date timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  restored_count INTEGER := 0;
BEGIN
  -- Restore specific activities by ID
  IF activity_ids IS NOT NULL THEN
    INSERT INTO public.activity_events (
      id, user_id, fund_id, deal_id, resource_id, activity_type, priority,
      title, description, context_data, change_data, tags, searchable_content,
      resource_type, session_id, user_agent, source_ip, is_system_event,
      is_visible, retention_date, occurred_at, created_at, updated_at
    )
    SELECT 
      original_id, user_id, fund_id, deal_id, resource_id, activity_type, priority,
      title, description, context_data, change_data, tags, searchable_content,
      resource_type, session_id, user_agent, source_ip, is_system_event,
      is_visible, retention_date, occurred_at, created_at, updated_at
    FROM public.archived_activity_events
    WHERE original_id = ANY(activity_ids)
      AND original_id NOT IN (SELECT id FROM public.activity_events);
  
  -- Restore activities by date range
  ELSIF start_date IS NOT NULL AND end_date IS NOT NULL THEN
    INSERT INTO public.activity_events (
      id, user_id, fund_id, deal_id, resource_id, activity_type, priority,
      title, description, context_data, change_data, tags, searchable_content,
      resource_type, session_id, user_agent, source_ip, is_system_event,
      is_visible, retention_date, occurred_at, created_at, updated_at
    )
    SELECT 
      original_id, user_id, fund_id, deal_id, resource_id, activity_type, priority,
      title, description, context_data, change_data, tags, searchable_content,
      resource_type, session_id, user_agent, source_ip, is_system_event,
      is_visible, retention_date, occurred_at, created_at, updated_at
    FROM public.archived_activity_events
    WHERE occurred_at BETWEEN start_date AND end_date
      AND original_id NOT IN (SELECT id FROM public.activity_events);
  END IF;
  
  GET DIAGNOSTICS restored_count = ROW_COUNT;
  RETURN restored_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_archival_statistics()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'active_activities', (SELECT COUNT(*) FROM public.activity_events),
    'archived_activities', (SELECT COUNT(*) FROM public.archived_activity_events),
    'oldest_active_activity', (SELECT MIN(occurred_at) FROM public.activity_events),
    'newest_archived_activity', (SELECT MAX(occurred_at) FROM public.archived_activity_events),
    'archival_configs', (SELECT COUNT(*) FROM public.activity_archival_config WHERE is_active = true),
    'total_retention_configs', (SELECT COUNT(*) FROM public.activity_archival_config),
    'archive_size_estimate', (
      SELECT jsonb_build_object(
        'archived_count', COUNT(*),
        'size_mb', ROUND(pg_total_relation_size('public.archived_activity_events')::numeric / 1048576, 2)
      )
      FROM public.archived_activity_events
    )
  ) INTO stats;
  
  RETURN stats;
END;
$function$;