import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const generateEmbedding = useCallback(async (text: string): Promise<number[] | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('vector-embedding-generator', {
        body: { text }
      });

      if (error) throw error;
      return data.embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }, []);

  const semanticSearch = useCallback(async (
    query: string, 
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> => {
    setIsSearching(true);
    try {
      // Generate embedding for query
      const queryEmbedding = await generateEmbedding(query);
      if (!queryEmbedding) {
        throw new Error('Failed to generate query embedding');
      }

      // Search for similar vectors - use pgvector format
      const { data, error } = await supabase.rpc('vector_similarity_search', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        content_type_filter: options.contentType || null,
        fund_id_filter: options.fundId || null,
        similarity_threshold: options.similarityThreshold || 0.7,
        max_results: options.maxResults || 10
      });

      if (error) throw error;

      const results = data || [];
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error('Vector search failed:', error);
      toast({
        title: "Search Error",
        description: "Failed to perform semantic search. Please try again.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [generateEmbedding, toast]);

  const findSimilarDeals = useCallback(async (
    dealId: string,
    fundId?: string
  ): Promise<VectorSearchResult[]> => {
    try {
      // Get the deal's content for similarity search
      const { data: deal, error } = await supabase
        .from('deals')
        .select('company_name, description, industry, business_model')
        .eq('id', dealId)
        .single();

      if (error) throw error;

      const searchText = [
        deal.company_name,
        deal.description,
        deal.industry,
        deal.business_model
      ].filter(Boolean).join(' ');

      return await semanticSearch(searchText, {
        contentType: 'deal',
        fundId,
        maxResults: 5
      });
    } catch (error) {
      console.error('Error finding similar deals:', error);
      return [];
    }
  }, [semanticSearch]);

  const hybridSearch = useCallback(async (
    query: string,
    options: VectorSearchOptions = {}
  ): Promise<{semantic: VectorSearchResult[], text: any[]}> => {
    try {
      // Perform both semantic and text search in parallel
      const [semanticResults, textResults] = await Promise.all([
        semanticSearch(query, options),
        supabase
          .from('deals')
          .select('*')
          .or(`company_name.ilike.%${query}%,description.ilike.%${query}%,industry.ilike.%${query}%`)
          .limit(options.maxResults || 10)
      ]);

      return {
        semantic: semanticResults,
        text: textResults.data || []
      };
    } catch (error) {
      console.error('Hybrid search failed:', error);
      return { semantic: [], text: [] };
    }
  }, [semanticSearch]);

  return {
    isSearching,
    searchResults,
    semanticSearch,
    findSimilarDeals,
    hybridSearch,
    generateEmbedding
  };
}