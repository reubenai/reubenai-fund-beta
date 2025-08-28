import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interface for company enrichment request
interface CompanyEnrichmentRequest {
  dealId: string;
  companyName: string;
  additionalContext?: {
    industry?: string;
    website?: string;
    description?: string;
  };
}

// Interface for company enrichment result
interface CompanyEnrichmentResult {
  success: boolean;
  data?: any;
  error?: string;
  snapshot_id?: string;
  data_quality_score?: number;
}

export const usePerplexityCompanyEnrichment = () => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentResult, setEnrichmentResult] = useState<CompanyEnrichmentResult | null>(null);

  // Function to enrich company profile
  const enrichCompanyProfile = async (
    dealId: string,
    companyName: string,
    additionalContext?: {
      industry?: string;
      website?: string;
      description?: string;
    }
  ): Promise<CompanyEnrichmentResult | null> => {
    setIsEnriching(true);
    
    try {
      console.log('🔍 Starting Perplexity company enrichment for:', companyName);
      
      const { data, error } = await supabase.functions.invoke('perplexity-company-enrichment', {
        body: {
          dealId,
          companyName,
          additionalContext
        }
      });

      if (error) {
        console.error('❌ Company enrichment error:', error);
        toast.error('Failed to enrich company profile');
        const errorResult = { success: false, error: error.message };
        setEnrichmentResult(errorResult);
        return errorResult;
      }

      if (!data.success) {
        console.error('❌ Company enrichment failed:', data.error);
        toast.error(data.error || 'Company enrichment failed');
        setEnrichmentResult(data);
        return data;
      }

      console.log('✅ Company enrichment completed successfully');
      toast.success(`Company enrichment completed for ${companyName}`);
      setEnrichmentResult(data);
      return data;

    } catch (error) {
      console.error('❌ Unexpected error during company enrichment:', error);
      toast.error('An unexpected error occurred during company enrichment');
      const errorResult = { success: false, error: 'Unexpected error occurred' };
      setEnrichmentResult(errorResult);
      return errorResult;
    } finally {
      setIsEnriching(false);
    }
  };

  // Wrapper function to trigger company enrichment (VC deals only)
  const triggerCompanyEnrichment = async (
    dealId: string,
    companyName: string,
    additionalContext?: {
      industry?: string;
      website?: string;
      description?: string;
    }
  ): Promise<CompanyEnrichmentResult | null> => {
    // First check if the deal's fund is venture capital
    try {
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .select(`
          id,
          fund_id,
          funds!deals_fund_id_fkey(
            id,
            fund_type
          )
        `)
        .eq('id', dealId)
        .single();

      if (dealError) {
        console.error('❌ Error fetching deal data:', dealError);
        toast.error('Failed to fetch deal information');
        const errorResult = { success: false, error: 'Failed to fetch deal information' };
        setEnrichmentResult(errorResult);
        return errorResult;
      }

      // Only proceed if fund type is venture_capital
      if (dealData.funds.fund_type !== 'venture_capital') {
        console.log(`🚫 Skipping Perplexity enrichment for ${companyName} - Fund type is ${dealData.funds.fund_type}, not venture_capital`);
        toast.error('Perplexity company enrichment is only available for venture capital deals');
        const errorResult = { 
          success: false, 
          error: 'Perplexity company enrichment is only available for venture capital deals',
          fund_type: dealData.funds.fund_type 
        };
        setEnrichmentResult(errorResult);
        return errorResult;
      }

      console.log(`✅ Deal ${dealId} confirmed as venture capital - proceeding with enrichment`);
      
      // Proceed with enrichment for VC deals
      return enrichCompanyProfile(dealId, companyName, additionalContext);
      
    } catch (error) {
      console.error('❌ Unexpected error during fund type check:', error);
      toast.error('An unexpected error occurred during fund type validation');
      const errorResult = { success: false, error: 'Fund type validation failed' };
      setEnrichmentResult(errorResult);
      return errorResult;
    }
  };

  // Function to get existing company enrichment data (VC only)
  const getCompanyEnrichmentData = async (dealId: string) => {
    try {
      const { data, error } = await supabase
        .from('deal_enrichment_perplexity_company_export_vc')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching VC company enrichment data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Unexpected error fetching VC company enrichment data:', error);
      return null;
    }
  };

  return {
    isEnriching,
    enrichmentResult,
    triggerCompanyEnrichment,
    getCompanyEnrichmentData
  };
};