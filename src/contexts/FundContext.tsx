import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Fund {
  id: string;
  name: string;
  organization_id: string;
  fund_type: string;
  description?: string;
  target_size?: number;
  currency?: string;
  is_active: boolean;
}

interface FundContextType {
  funds: Fund[];
  selectedFund: Fund | null;
  setSelectedFund: (fund: Fund | null) => void;
  loading: boolean;
}

const FundContext = createContext<FundContextType | undefined>(undefined);

export const FundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFunds();
    }
  }, [user]);

  const fetchFunds = async () => {
    try {
      setLoading(true);
      
      // Get user's profile to check role and organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('user_id', user?.id)
        .single();

      // Check if user is Super Admin (can access all funds)
      const isReubenAdmin = user?.email?.includes('@goreuben.com') || user?.email?.includes('@reuben.com');
      const isSuperAdmin = profile?.role === 'super_admin' || isReubenAdmin;

      let fundsQuery = supabase
        .from('funds')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // If not Super Admin, filter by organization
      if (!isSuperAdmin && profile?.organization_id) {
        fundsQuery = fundsQuery.eq('organization_id', profile.organization_id);
      }

      const { data: fundsData, error } = await fundsQuery;

      if (error) throw error;

      setFunds(fundsData || []);
      
      // Auto-select first fund if none selected
      if (fundsData && fundsData.length > 0 && !selectedFund) {
        setSelectedFund(fundsData[0]);
      }
    } catch (error) {
      console.error('Error fetching funds:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FundContext.Provider value={{ funds, selectedFund, setSelectedFund, loading }}>
      {children}
    </FundContext.Provider>
  );
};

export const useFund = () => {
  const context = useContext(FundContext);
  if (context === undefined) {
    throw new Error('useFund must be used within a FundProvider');
  }
  return context;
};