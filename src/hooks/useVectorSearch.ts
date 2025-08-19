import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VectorSearchOptions {
  contentType?: string;
  fundId?: string;
  similarityThreshold?: number;
  maxResults?: number;
}

interface VectorSearchResult {
  content_id: string;
  content_type: string;
  content_text: string;
  similarity_score: number;
  metadata: any;
  fund_id: string;
}

export function useVectorSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<VectorSearchResult[]>([]);

  const generateEmbedding = async (text: string): Promise<number[] | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('vector-embedding-generator', {
        body: { text, contentType: 'query' }
      });

      if (error) {
        console.error('Failed to generate embedding:', error);
        return null;
      }

      return data.embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  };

  const semanticSearch = async (
    query: string, 
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> => {
    setIsSearching(true);
    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query);
      if (!queryEmbedding) {
        throw new Error('Failed to generate query embedding');
      }

      // Perform vector similarity search
      const { data, error } = await supabase.rpc('vector_similarity_search', {
        query_embedding: queryEmbedding,
        content_type_filter: options.contentType || null,
        fund_id_filter: options.fundId || null,
        similarity_threshold: options.similarityThreshold || 0.7,
        max_results: options.maxResults || 10
      });

      if (error) {
        console.error('Vector search failed:', error);
        return [];
      }

      const results = data || [];
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const findSimilarDeals = async (dealId: string, fundId?: string): Promise<VectorSearchResult[]> => {
    try {
      // Get deal details first
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .select('company_name, description, industry')
        .eq('id', dealId)
        .single();

      if (dealError || !deal) {
        console.error('Failed to fetch deal:', dealError);
        return [];
      }

      // Create search query from deal data
      const searchQuery = `${deal.company_name} ${deal.description} ${deal.industry}`;
      
      return await semanticSearch(searchQuery, {
        contentType: 'deal_document',
        fundId,
        similarityThreshold: 0.6,
        maxResults: 10
      });
    } catch (error) {
      console.error('Failed to find similar deals:', error);
      return [];
    }
  };

  const hybridSearch = async (
    query: string,
    options: VectorSearchOptions = {}
  ): Promise<{ semantic: VectorSearchResult[], text: any[] }> => {
    try {
      // Perform semantic search
      const semanticResults = await semanticSearch(query, options);

      // Perform text-based search in parallel
      const textSearchPromise = supabase
        .from('vector_embeddings')
        .select('*')
        .textSearch('content_text', query, { 
          type: 'websearch',
          config: 'english'
        })
        .limit(options.maxResults || 10);

      const { data: textResults } = await textSearchPromise;

      return {
        semantic: semanticResults,
        text: textResults || []
      };
    } catch (error) {
      console.error('Hybrid search failed:', error);
      return { semantic: [], text: [] };
    }
  };

  return {
    isSearching,
    searchResults,
    semanticSearch,
    findSimilarDeals,
    hybridSearch,
    generateEmbedding
  };
}