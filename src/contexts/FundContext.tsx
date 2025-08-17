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
    // CRITICAL SECURITY FIX: Prevent data leakage during login
    // Only fetch funds when all authentication and role data is complete
    if (user && !roleLoading) {
      if (isSuperAdmin || organizationId) {
        fetchFunds();
      } else {
        console.log('⏳ [FundContext] Waiting for organizationId to be available for non-super admin user');
        // For non-super admins without organizationId, set empty state (don't load anything)
        setFunds([]);
        setSelectedFund(null);
        setLoading(false);
      }
    } else {
      // SECURITY: While authentication is loading, ensure no funds are visible
      setFunds([]);
      setSelectedFund(null);
      setLoading(true);
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
        // Super admins can see all funds - use the special admin function
        console.log('  - Using admin RPC for super admin');
        const response = await supabase.rpc('admin_get_all_funds_with_orgs');
        data = response.data;
        error = response.error;
      } else {
        // CRITICAL: Regular users MUST only see funds from their organization via RLS
        if (!organizationId) {
          console.error('❌ Organization ID is required for non-super admin users');
          setFunds([]);
          setSelectedFund(null);
          return;
        }
        
        console.log('  - Fetching organization-specific funds for organizationId:', organizationId);
        console.log('  - ⚠️ SECURITY: Using RLS-enforced query to prevent data leakage');
        
        // This query MUST respect RLS policies - never bypass them for regular users
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
        
        // CRITICAL SECURITY CHECK: Verify all returned funds belong to user's organization
        if (data && data.length > 0) {
          const unauthorizedFunds = data.filter(fund => fund.organization_id !== organizationId);
          if (unauthorizedFunds.length > 0) {
            console.error('🚨 SECURITY BREACH DETECTED: User has access to unauthorized funds:', unauthorizedFunds);
            console.error('🚨 User org:', organizationId, 'Unauthorized fund orgs:', unauthorizedFunds.map(f => f.organization_id));
            // Block access to prevent data breach
            data = data.filter(fund => fund.organization_id === organizationId);
          }
        }
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

      // CRITICAL SECURITY: Final verification for non-super admin users
      let secureData = fundsData;
      if (!isSuperAdmin && organizationId && fundsData) {
        // Double-check: filter out any funds that don't belong to user's organization
        secureData = fundsData.filter(fund => fund.organization_id === organizationId);
        
        if (secureData.length !== fundsData.length) {
          console.error('🚨 SECURITY: Filtered out unauthorized funds in FundContext');
          console.error('Original count:', fundsData.length, 'Filtered count:', secureData.length);
        }
      } else if (isSuperAdmin) {
        // Super admins should see all funds without filtering
        console.log('  - Super admin access: showing all funds without organization filtering');
        secureData = fundsData;
      }

      console.log('  - Final secure query result:');
      console.log('    - Data count:', secureData?.length || 0);
      console.log('    - Fund names:', secureData?.map(f => f.name) || []);
      console.log('    - Fund orgs:', secureData?.map(f => f.organization_id) || []);
      console.log('    - User org:', organizationId);

      setFunds(secureData || []);
      
      // Auto-select first fund if none selected or if current selection is invalid
      if (secureData && secureData.length > 0) {
        const isCurrentFundValid = selectedFund && secureData.find(f => f.id === selectedFund.id);
        
        if (!isCurrentFundValid) {
          console.log('  - Auto-selecting first fund:', secureData[0].name);
          setSelectedFund(secureData[0]);
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