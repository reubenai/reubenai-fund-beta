import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface Fund {
  id: string;
  name: string;
  organization_id: string;
  fund_type: string;
  description?: string;
  target_size?: number;
  currency?: string;
  is_active: boolean;
  organization?: {
    name: string;
  };
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
  const { isSuperAdmin, organizationId, loading: roleLoading } = useUserRole();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !roleLoading) {
      fetchFunds();
    }
  }, [user, roleLoading, isSuperAdmin, organizationId]);

  const fetchFunds = async () => {
    try {
      setLoading(true);
      
      // Debug: Log authentication state
      console.log('🔍 [FundContext] Debugging fund fetch:');
      console.log('  - User:', user?.email);
      console.log('  - isSuperAdmin:', isSuperAdmin);
      console.log('  - organizationId:', organizationId);
      console.log('  - roleLoading:', roleLoading);
      
      // Check auth session
      const { data: session } = await supabase.auth.getSession();
      console.log('  - Session valid:', !!session.session);
      console.log('  - Session user:', session.session?.user?.email);
      
      // With the new RLS system, super admins can see all funds automatically
      // Regular users can only see funds in their organization
      let fundsQuery = supabase
        .from('funds')
        .select(`
          *,
          organization:organizations(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      console.log('  - Executing query (RLS will handle filtering automatically)...');
      const { data: fundsData, error } = await fundsQuery;

      console.log('  - Query result:');
      console.log('    - Error:', error);
      console.log('    - Data count:', fundsData?.length || 0);
      console.log('    - Fund names:', fundsData?.map(f => f.name) || []);

      if (error) {
        console.error('Fund fetch error:', error);
        // Don't throw, just set empty array and log the error
        setFunds([]);
        setSelectedFund(null);
        return;
      }

      setFunds(fundsData || []);
      
      // Auto-select first fund if none selected or if current selection is invalid
      if (fundsData && fundsData.length > 0) {
        // Check if current selectedFund is still valid
        const isCurrentFundValid = selectedFund && fundsData.find(f => f.id === selectedFund.id);
        
        if (!isCurrentFundValid) {
          console.log('  - Auto-selecting first fund:', fundsData[0].name);
          setSelectedFund(fundsData[0]);
        } else {
          console.log('  - Current fund selection is valid:', selectedFund.name);
        }
      } else {
        console.log('  - No funds available, clearing selection');
        setSelectedFund(null);
      }
    } catch (error) {
      console.error('❌ Error fetching funds:', error);
      setFunds([]);
      setSelectedFund(null);
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