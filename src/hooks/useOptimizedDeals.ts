import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFund } from '@/contexts/FundContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type DealStatus = Database['public']['Enums']['deal_status'];

interface Deal {
  id: string;
  company_name: string;
  status: string;
  overall_score?: number;
  score_level?: string;
  industry?: string;
  description?: string;
  founder?: string;
  created_at: string;
  updated_at: string;
}

interface UseOptimizedDealsProps {
  pageSize?: number;
  filters?: {
    status?: DealStatus;
    industry?: string;
    minScore?: number;
    search?: string;
  };
}

export const useOptimizedDeals = ({ 
  pageSize = 20, 
  filters = {} 
}: UseOptimizedDealsProps = {}) => {
  const { selectedFund } = useFund();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Memoize the query to avoid unnecessary re-renders
  const query = useMemo(() => {
    if (!selectedFund?.id) return null;

    let query = supabase
      .from('deals')
      .select(`
        id,
        company_name,
        status,
        overall_score,
        score_level,
        industry,
        description,
        founder,
        created_at,
        updated_at
      `)
      .eq('fund_id', selectedFund.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.industry) {
      query = query.eq('industry', filters.industry);
    }
    if (filters.minScore) {
      query = query.gte('overall_score', filters.minScore);
    }
    if (filters.search) {
    // Use ilike for search across multiple fields for better compatibility
      query = query.or(`company_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,industry.ilike.%${filters.search}%,founder.ilike.%${filters.search}%`);
    }

    return query;
  }, [selectedFund?.id, filters]);

  const fetchDeals = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (!query) return;

    try {
      setLoading(true);
      
      const from = pageNum * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query
        .range(from, to)
        .limit(pageSize);

      if (error) throw error;

      const newDeals = data || [];
      
      if (append) {
        setDeals(prev => [...prev, ...newDeals]);
      } else {
        setDeals(newDeals);
      }
      
      // Check if there are more deals to load
      const totalLoaded = append ? deals.length + newDeals.length : newDeals.length;
      setHasMore(newDeals.length === pageSize && totalLoaded < (count || 0));
      
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: "Error loading deals",
        description: "Failed to fetch deals. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [query, pageSize, deals.length, toast]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchDeals(nextPage, true);
    }
  }, [loading, hasMore, page, fetchDeals]);

  const refresh = useCallback(() => {
    setPage(0);
    setDeals([]);
    setHasMore(true);
    fetchDeals(0, false);
  }, [fetchDeals]);

  // Initial load and when filters change
  useEffect(() => {
    setPage(0);
    setDeals([]);
    setHasMore(true);
    if (query) {
      fetchDeals(0, false);
    }
  }, [query]);

  return {
    deals,
    loading,
    hasMore,
    loadMore,
    refresh
  };
};