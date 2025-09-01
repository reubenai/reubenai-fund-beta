import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VCMarketData {
  cagr: number | null;
  growth_drivers: string[] | null;
  market_timing: string | null;
  source_engines: string[] | null;
}

interface UseVCMarketDataReturn {
  data: VCMarketData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVCMarketData(dealId: string): UseVCMarketDataReturn {
  const [data, setData] = useState<VCMarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    if (!dealId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fetchError } = await supabase
        .from('deal_analysis_datapoints_vc')
        .select('cagr, growth_drivers, market_timing, source_engines')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setData(result || {
        cagr: null,
        growth_drivers: null,
        market_timing: null,
        source_engines: null
      });
    } catch (err) {
      console.error('Error fetching VC market data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, [dealId]);

  const refetch = () => {
    fetchMarketData();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}