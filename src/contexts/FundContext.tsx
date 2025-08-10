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
    // Only fetch funds when user is available and role loading is complete
    // For non-super admins, also ensure organizationId is available
    if (user && !roleLoading) {
      if (isSuperAdmin || organizationId) {
        fetchFunds();
      } else {
        console.log('⏳ [FundContext] Waiting for organizationId to be available for non-super admin user');
        setLoading(false); // Stop loading since we're waiting for organizationId
      }
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
      
      // Phase 7: Fetch funds based on user role
      console.log('  - Fetching funds based on user role');
      
      let data, error;
      
      if (isSuperAdmin) {
        // Super admins can see all funds
        console.log('  - Using admin RPC for super admin');
        const response = await supabase.rpc('admin_get_all_funds');
        data = response.data;
        error = response.error;
      } else {
        // Regular users only see funds from their organization
        if (!organizationId) {
          console.error('❌ Organization ID is required for non-super admin users');
          setFunds([]);
          setSelectedFund(null);
          return;
        }
        
        console.log('  - Fetching organization-specific funds for organizationId:', organizationId);
        const response = await supabase
          .from('funds')
          .select(`
            *,
            organization:organizations(name)
          `)
          .eq('organization_id', organizationId)
          .eq('is_active', true);
        data = response.data;
        error = response.error;
      }

      if (error) {
        console.error('❌ Fund fetch error:', error);
        setFunds([]);
        setSelectedFund(null);
        return;
      }
      
      // Transform data to match expected format
      const fundsData = data?.map((fund: any) => ({
        ...fund,
        organization: { 
          name: fund.organization?.name || fund.organization_name || 'Unknown Organization' 
        }
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