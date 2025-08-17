import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface HybridRetrievalRequest {
  org_id: string;
  fund_id: string;
  deal_id?: string;
  query: string;
  context_budget: number;
  search_namespaces: string[];
  chunk_types?: string[];
}

interface RetrievedChunk {
  content: string;
  doc_id: string;
  page_section: string;
  similarity_score: number;
  lexical_score: number;
  rerank_score: number;
  chunk_type: string;
  citations: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: HybridRetrievalRequest = await req.json();
    
    console.log(`🔍 [Hybrid Retrieval] Starting retrieval for query: "${request.query}"`);
    console.log(`📊 [Hybrid Retrieval] Context budget: ${request.context_budget}, Namespaces: ${request.search_namespaces.join(', ')}`);

    // Step 1: Generate query embeddings
    const query_embedding = await generateQueryEmbedding(request.query);
    
    // Step 2: Parallel vector and lexical search
    const [vector_results, lexical_results] = await Promise.all([
      vectorSearch(query_embedding, request),
      lexicalSearch(request)
    ]);

    console.log(`📈 [Hybrid Retrieval] Vector results: ${vector_results.length}, Lexical results: ${lexical_results.length}`);

    // Step 3: Combine results using Reciprocal Rank Fusion (RRF)
    const fused_results = combineWithRRF(vector_results, lexical_results);

    // Step 4: Re-rank with cross-encoder
    const reranked_results = await reRankResults(request.query, fused_results);

    // Step 5: Apply context budget and deduplication
    const final_chunks = applyContextBudget(reranked_results, request.context_budget);

    console.log(`✅ [Hybrid Retrieval] Final chunks: ${final_chunks.length} (within budget of ${request.context_budget})`);

    return new Response(JSON.stringify({
      success: true,
      query: request.query,
      chunks: final_chunks,
      retrieval_stats: {
        vector_count: vector_results.length,
        lexical_count: lexical_results.length,
        fused_count: fused_results.length,
        final_count: final_chunks.length,
        context_budget: request.context_budget
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [Hybrid Retrieval] Failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    console.log('🧠 [Hybrid Retrieval] Generating query embedding...');
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
        encoding_format: 'float'
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
    
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    throw error;
  }
}

async function vectorSearch(
  query_embedding: number[], 
  request: HybridRetrievalRequest
): Promise<RetrievedChunk[]> {
  
  console.log('🎯 [Hybrid Retrieval] Performing vector search...');
  
  const { data, error } = await supabase.rpc('vector_similarity_search', {
    query_embedding: query_embedding,
    fund_id_filter: request.fund_id,
    similarity_threshold: 0.7,
    max_results: Math.min(request.context_budget * 3, 50) // Get more for fusion
  });

  if (error) {
    console.error('Vector search failed:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    content: item.content_text,
    doc_id: item.content_id,
    page_section: item.metadata?.page || 'unknown',
    similarity_score: item.similarity_score,
    lexical_score: 0,
    rerank_score: 0,
    chunk_type: item.content_type,
    citations: [{
      source: item.content_type,
      doc_id: item.content_id,
      page: item.metadata?.page
    }]
  }));
}

async function lexicalSearch(request: HybridRetrievalRequest): Promise<RetrievedChunk[]> {
  console.log('📝 [Hybrid Retrieval] Performing lexical search...');
  
  // Simple keyword matching for now - could be enhanced with full-text search
  const { data, error } = await supabase
    .from('vector_embeddings')
    .select('content_id, content_type, content_text, metadata')
    .eq('fund_id', request.fund_id)
    .textSearch('content_text', request.query.replace(/[^\w\s]/g, ''))
    .limit(Math.min(request.context_budget * 3, 50));

  if (error) {
    console.error('Lexical search failed:', error);
    return [];
  }

  return (data || []).map((item: any, index: number) => ({
    content: item.content_text,
    doc_id: item.content_id,
    page_section: item.metadata?.page || 'unknown',
    similarity_score: 0,
    lexical_score: 1.0 / (index + 1), // Simple ranking
    rerank_score: 0,
    chunk_type: item.content_type,
    citations: [{
      source: item.content_type,
      doc_id: item.content_id,
      page: item.metadata?.page
    }]
  }));
}

function combineWithRRF(
  vector_results: RetrievedChunk[], 
  lexical_results: RetrievedChunk[]
): RetrievedChunk[] {
  
  console.log('🔀 [Hybrid Retrieval] Applying Reciprocal Rank Fusion...');
  
  const k = 60; // RRF parameter
  const chunk_scores = new Map<string, { chunk: RetrievedChunk; rrf_score: number }>();

  // Process vector results
  vector_results.forEach((chunk, index) => {
    const rrf_score = 1 / (k + index + 1);
    chunk_scores.set(chunk.doc_id, {
      chunk: { ...chunk, similarity_score: chunk.similarity_score },
      rrf_score
    });
  });

  // Process lexical results and combine scores
  lexical_results.forEach((chunk, index) => {
    const rrf_score = 1 / (k + index + 1);
    const existing = chunk_scores.get(chunk.doc_id);
    
    if (existing) {
      // Combine scores for duplicate chunks
      existing.rrf_score += rrf_score;
      existing.chunk.lexical_score = chunk.lexical_score;
    } else {
      chunk_scores.set(chunk.doc_id, {
        chunk: { ...chunk, lexical_score: chunk.lexical_score },
        rrf_score
      });
    }
  });

  // Sort by combined RRF score
  return Array.from(chunk_scores.values())
    .sort((a, b) => b.rrf_score - a.rrf_score)
    .map(({ chunk, rrf_score }) => ({
      ...chunk,
      rerank_score: rrf_score
    }));
}

async function reRankResults(
  query: string, 
  chunks: RetrievedChunk[]
): Promise<RetrievedChunk[]> {
  
  console.log('🏆 [Hybrid Retrieval] Re-ranking with cross-encoder...');
  
  if (chunks.length === 0) return chunks;

  try {
    // Use OpenAI for cross-encoder re-ranking
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a relevance scorer. Rate each text chunk\'s relevance to the query on a scale of 0-1. Return only a JSON array of scores.'
          },
          {
            role: 'user',
            content: `Query: "${query}"\n\nChunks:\n${chunks.slice(0, 20).map((chunk, i) => `${i}: ${chunk.content.slice(0, 200)}...`).join('\n\n')}\n\nReturn scores array [0.1, 0.8, 0.3, ...]:`
          }
        ],
        temperature: 0
      }),
    });

    if (!response.ok) {
      console.warn('Re-ranking failed, using original scores');
      return chunks;
    }

    const data = await response.json();
    const scores = JSON.parse(data.choices[0].message.content);
    
    return chunks.map((chunk, index) => ({
      ...chunk,
      rerank_score: scores[index] || chunk.rerank_score
    })).sort((a, b) => b.rerank_score - a.rerank_score);

  } catch (error) {
    console.warn('Re-ranking failed, using original order:', error);
    return chunks;
  }
}

function applyContextBudget(
  chunks: RetrievedChunk[], 
  context_budget: number
): RetrievedChunk[] {
  
  console.log(`✂️ [Hybrid Retrieval] Applying context budget: ${context_budget} chunks`);
  
  // Apply budget limit
  const budgeted_chunks = chunks.slice(0, context_budget);
  
  // Apply MMR deduplication (simplified version)
  const final_chunks: RetrievedChunk[] = [];
  const similarity_threshold = 0.85;
  
  for (const chunk of budgeted_chunks) {
    // Simple deduplication based on content similarity
    const is_duplicate = final_chunks.some(existing => {
      const overlap = calculateTextOverlap(chunk.content, existing.content);
      return overlap > similarity_threshold;
    });
    
    if (!is_duplicate) {
      final_chunks.push(chunk);
    }
  }
  
  return final_chunks;
}

function calculateTextOverlap(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}