import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Fund {
  id: string;
  name: string;
  fund_type: 'venture_capital' | 'private_equity';
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export function useFunds() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchFunds = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('funds')
        .select('id, name, fund_type, organization_id, created_at, updated_at')
        .order('name');

      if (error) throw error;
      setFunds(data || []);
    } catch (error) {
      console.error('Error fetching funds:', error);
      toast.error('Failed to fetch funds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFunds();
    }
  }, [user]);

  return {
    funds,
    loading,
    fetchFunds
  };
}