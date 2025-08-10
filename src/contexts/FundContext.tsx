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
      
      console.log('🔍 [FundContext] Phase 7.1 - Fund Context Integrity Check');
      console.log('  - User:', user?.email);
      console.log('  - isSuperAdmin:', isSuperAdmin);
      console.log('  - organizationId:', organizationId);
      
      // Phase 7.1: JWT Claims Consistency Check
      const { data: claimsData, error: claimsError } = await supabase
        .rpc('validate_jwt_claims');
      
      if (claimsError) {
        console.error('❌ JWT Claims validation failed:', claimsError);
        setFunds([]);
        setSelectedFund(null);
        return;
      }
      
      const claims = claimsData?.[0];
      console.log('  - JWT Claims valid:', claims?.claims_valid);
      console.log('  - Missing claims:', claims?.missing_claims);
      
      if (!claims?.claims_valid) {
        console.error('❌ Required JWT claims missing:', claims?.missing_claims);
        setFunds([]);
        setSelectedFund(null);
        return;
      }
      
      // Phase 7: Simplified Fund Fetching with New RLS
      console.log('  - Fetching funds (RLS automatically applies visibility)');
      
      // Now that RLS is properly configured, we can use a single query
      // Super Admins will see all funds, regular users only their org funds
      const { data, error } = await supabase
        .from('funds')
        .select(`
          *,
          organizations!inner(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Fund fetch error:', error);
        setFunds([]);
        setSelectedFund(null);
        return;
      }
      
      // Transform data to match expected format
      const fundsData = data?.map(fund => ({
        ...fund,
        organization: { name: fund.organizations.name }
      }));

      console.log('  - Query result:');
      console.log('    - Data count:', fundsData?.length || 0);
      console.log('    - Fund names:', fundsData?.map(f => f.name) || []);

      setFunds(fundsData || []);
      
      // Auto-select first fund if none selected or if current selection is invalid
      if (fundsData && fundsData.length > 0) {
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