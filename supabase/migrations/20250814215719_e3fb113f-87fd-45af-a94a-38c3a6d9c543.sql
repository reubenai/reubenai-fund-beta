-- Update vector similarity search function to handle JSON string parameter
CREATE OR REPLACE FUNCTION public.vector_similarity_search(
  query_embedding text, -- Changed from vector to text to handle JSON string
  content_type_filter text DEFAULT NULL,
  fund_id_filter uuid DEFAULT NULL,
  similarity_threshold float DEFAULT 0.7,
  max_results integer DEFAULT 10
)
RETURNS TABLE(
  content_id uuid,
  content_type text,
  content_text text,
  similarity_score float,
  metadata jsonb,
  fund_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  embedding_vector vector(1536);
BEGIN
  -- Parse the JSON string to vector
  embedding_vector := query_embedding::vector(1536);
  
  RETURN QUERY
  SELECT 
    ve.content_id,
    ve.content_type,
    ve.content_text,
    (1 - (ve.embedding <=> embedding_vector))::float as similarity_score,
    ve.metadata,
    ve.fund_id
  FROM public.vector_embeddings ve
  WHERE 
    (content_type_filter IS NULL OR ve.content_type = content_type_filter)
    AND (fund_id_filter IS NULL OR ve.fund_id = fund_id_filter)
    AND (1 - (ve.embedding <=> embedding_vector)) >= similarity_threshold
  ORDER BY ve.embedding <=> embedding_vector
  LIMIT max_results;
END;
$$;