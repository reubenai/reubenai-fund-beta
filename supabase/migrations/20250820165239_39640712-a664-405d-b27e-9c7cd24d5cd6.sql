-- Clean unwanted activity events
-- Remove page_view events on / and /pipeline routes
DELETE FROM activity_events 
WHERE activity_type = 'system_event' 
  AND (context_data->>'event' = 'page_view')
  AND (context_data->>'path' IN ('/', '/pipeline'));

-- Remove all session_end events
DELETE FROM activity_events 
WHERE activity_type = 'system_event' 
  AND (context_data->>'event' = 'session_end');

-- Clean archived activity events as well
DELETE FROM archived_activity_events 
WHERE activity_type = 'system_event' 
  AND (context_data->>'event' = 'page_view')
  AND (context_data->>'path' IN ('/', '/pipeline'));

DELETE FROM archived_activity_events 
WHERE activity_type = 'system_event' 
  AND (context_data->>'event' = 'session_end');