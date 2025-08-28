import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FounderEnrichmentRequest {
  dealId: string;
  founderName: string;
  companyName: string;
  companyWebsite?: string;
  linkedinUrl?: string;
  crunchbaseUrl?: string;
}

export interface FounderEnrichmentResult {
  success: boolean;
  data?: any;
  error?: string;
  dataSource: string;
  trustScore: number;
  dataQuality: number;
}

export const usePerplexityFounderEnrichment = () => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentResult, setEnrichmentResult] = useState<FounderEnrichmentResult | null>(null);
  const { toast } = useToast();

  const enrichFounderProfile = async (
    dealId: string, 
    founderName: string, 
    companyName: string,
    additionalContext?: {
      companyWebsite?: string;
      linkedinUrl?: string;
      crunchbaseUrl?: string;
    }
  ): Promise<FounderEnrichmentResult | null> => {
    if (!founderName.trim() || !companyName.trim()) {
      toast({
        title: "Missing Information",
        description: "Founder name and company name are required for profile enrichment",
        variant: "destructive",
      });
      return null;
    }

    setIsEnriching(true);
    setEnrichmentResult(null);

    try {
      console.log(`🚀 Starting Perplexity founder enrichment for: ${founderName} at ${companyName}`);
      
      const { data, error } = await supabase.functions.invoke(
        'perplexity-founder-enrichment',
        {
          body: {
            dealId,
            founderName,
            companyName,
            companyWebsite: additionalContext?.companyWebsite,
            linkedinUrl: additionalContext?.linkedinUrl,
            crunchbaseUrl: additionalContext?.crunchbaseUrl
          }
        }
      );

      if (error) {
        console.error('❌ Perplexity founder enrichment error:', error);
        toast({
          title: "Founder Enrichment Failed",
          description: error.message || "Failed to enrich founder profile using Perplexity",
          variant: "destructive",
        });
        return null;
      }

      console.log('✅ Perplexity founder enrichment completed:', data);
      setEnrichmentResult(data);
      
      if (data.success) {
        toast({
          title: "Founder Profile Enriched Successfully", 
          description: `Successfully enriched profile for ${founderName} using Perplexity AI`,
        });
      } else {
        toast({
          title: "Founder Enrichment Issue",
          description: data.error || "Founder enrichment completed with warnings",
          variant: "destructive",
        });
      }

      return data;
    } catch (error) {
      console.error('❌ Perplexity founder enrichment exception:', error);
      toast({
        title: "Founder Enrichment Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive", 
      });
      return null;
    } finally {
      setIsEnriching(false);
    }
  };

  const triggerFounderEnrichment = async (
    dealId: string, 
    founderName: string, 
    companyName: string,
    additionalContext?: {
      companyWebsite?: string;
      linkedinUrl?: string;
      crunchbaseUrl?: string;
    }
  ) => {
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
        toast({
          title: "Deal Validation Failed",
          description: "Failed to validate deal information for founder enrichment",
          variant: "destructive",
        });
        return null;
      }

      // Only proceed if fund type is venture_capital
      if (dealData.funds.fund_type !== 'venture_capital') {
        console.log(`🚫 Skipping Perplexity founder enrichment for ${founderName} at ${companyName} - Fund type is ${dealData.funds.fund_type}, not venture_capital`);
        toast({
          title: "Founder Enrichment Not Available",
          description: "Perplexity founder enrichment is only available for venture capital deals",
          variant: "destructive",
        });
        return null;
      }

      console.log(`✅ Deal ${dealId} confirmed as venture capital - proceeding with founder enrichment`);
    } catch (error) {
      console.error('❌ Unexpected error during fund type check:', error);
      toast({
        title: "Fund Type Validation Error",
        description: "An unexpected error occurred during fund type validation",
        variant: "destructive",
      });
      return null;
    }

    // Proceed with enrichment for VC deals
    const result = await enrichFounderProfile(dealId, founderName, companyName, additionalContext);
    return result;
  };

  // Function to get existing founder enrichment data for a deal (VC only)
  const getFounderEnrichmentData = async (dealId: string) => {
    try {
      const { data, error } = await supabase
        .from('deal_enrichment_perplexity_founder_export_vc')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching VC founder enrichment data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception fetching VC founder enrichment data:', error);
      return null;
    }
  };

  return {
    isEnriching,
    enrichmentResult,
    enrichFounderProfile,
    triggerFounderEnrichment,
    getFounderEnrichmentData
  };
};