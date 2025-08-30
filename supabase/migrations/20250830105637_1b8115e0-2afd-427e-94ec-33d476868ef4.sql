-- Fix search path for the functions created in the previous migration
ALTER FUNCTION is_missing_value(anyelement) SET search_path TO 'public';
ALTER FUNCTION get_nested_json_value(jsonb, text) SET search_path TO 'public';
ALTER FUNCTION trigger_waterfall_extraction() SET search_path TO 'public';
ALTER FUNCTION trigger_waterfall_extraction_datapoints() SET search_path TO 'public';