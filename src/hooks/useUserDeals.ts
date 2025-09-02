import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFund } from '@/contexts/FundContext';

export interface Deal {
  id: string;
  company_name: string;
  fund_id: string;
  fund_type: 'venture_capital' | 'private_equity';
  industry?: string;
  stage?: string;
  overall_score?: number;
  created_at: string;
  updated_at: string;
}

interface UseUserDealsReturn {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUserDeals(): UseUserDealsReturn {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedFund } = useFund();

  const fetchDeals = async () => {
    if (!selectedFund) {
      setDeals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch deals for the selected fund with fund type
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select(`
          id,
          company_name,
          fund_id,
          industry,
          stage,
          overall_score,
          created_at,
          updated_at,
          funds!inner(fund_type)
        `)
        .eq('fund_id', selectedFund.id)
        .order('updated_at', { ascending: false });

      if (dealsError) {
        throw dealsError;
      }

      // Transform the data to include fund_type at the deal level
      const transformedDeals = (dealsData || []).map((deal: any) => ({
        ...deal,
        fund_type: deal.funds.fund_type
      }));

      setDeals(transformedDeals);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [selectedFund?.id]);

  const refetch = () => {
    fetchDeals();
  };

  return {
    deals,
    loading,
    error,
    refetch,
  };
}