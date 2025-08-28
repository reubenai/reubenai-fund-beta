import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MarketEnrichmentRequest {
  dealId: string;
  primaryIndustry: string;
  location: string;
}

interface MarketEnrichmentResult {
  success: boolean;
  data?: {
    market_cycle: string;
    economic_sensitivity: string;
    investment_climate: string;
    regulatory_timeline: string;
    competitive_window: string;
    regulatory_requirements: string;
    capital_requirements: string;
    technology_moats: string;
    distribution_challenges: string;
    geographic_constraints: string;
    subcategory_sources: Record<string, string[]>;
    subcategory_confidence: Record<string, string>;
    data_quality_score: number;
    confidence_level: string;
  };
  error?: string;
  snapshot_id?: string;
  data_quality_score?: number;
}

export const usePerplexityMarketEnrichment = () => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentResult, setEnrichmentResult] = useState<MarketEnrichmentResult | null>(null);

  const enrichMarketProfile = async (
    dealId: string, 
    primaryIndustry: string, 
    location: string
  ): Promise<MarketEnrichmentResult | null> => {
    if (!dealId?.trim() || !primaryIndustry?.trim() || !location?.trim()) {
      toast.error('Deal ID, Primary Industry, and Location are required for market enrichment');
      return null;
    }

    setIsEnriching(true);
    setEnrichmentResult(null);

    try {
      console.log('🚀 Calling Perplexity Market Enrichment function...');
      
      const { data, error } = await supabase.functions.invoke('perplexity-market-enrichment', {
        body: { 
          dealId: dealId.trim(), 
          primaryIndustry: primaryIndustry.trim(), 
          location: location.trim() 
        },
      });

      if (error) {
        console.error('❌ Perplexity market enrichment error:', error);
        const errorMessage = `Market enrichment failed: ${error.message || 'Unknown error'}`;
        toast.error(errorMessage);
        
        const result: MarketEnrichmentResult = {
          success: false,
          error: errorMessage
        };
        
        setEnrichmentResult(result);
        return result;
      }

      if (!data?.success) {
        const errorMessage = data?.error || 'Market enrichment failed';
        console.error('❌ Market enrichment unsuccessful:', errorMessage);
        toast.error(errorMessage);
        
        const result: MarketEnrichmentResult = {
          success: false,
          error: errorMessage
        };
        
        setEnrichmentResult(result);
        return result;
      }

      console.log('✅ Market enrichment completed successfully');
      toast.success(`Market intelligence enriched for ${primaryIndustry} industry`);
      
      const result: MarketEnrichmentResult = {
        success: true,
        data: data.data,
        snapshot_id: data.snapshot_id,
        data_quality_score: data.data_quality_score
      };
      
      setEnrichmentResult(result);
      return result;

    } catch (error) {
      console.error('❌ Unexpected error in market enrichment:', error);
      const errorMessage = `Market enrichment error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      toast.error(errorMessage);
      
      const result: MarketEnrichmentResult = {
        success: false,
        error: errorMessage
      };
      
      setEnrichmentResult(result);
      return result;
    } finally {
      setIsEnriching(false);
    }
  };

  const triggerMarketEnrichment = async (
    dealId: string, 
    primaryIndustry: string, 
    location: string
  ): Promise<MarketEnrichmentResult | null> => {
    try {
      // First check if this deal is from a venture capital fund
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
        console.error('❌ Error checking deal fund type:', dealError);
        toast.error('Failed to verify deal information');
        return {
          success: false,
          error: 'Failed to verify deal information'
        };
      }

      if (dealData.funds.fund_type !== 'venture_capital') {
        const message = 'Market enrichment is only available for venture capital deals';
        console.log('🚫 Skipping market enrichment - not a VC deal');
        toast.error(message);
        return {
          success: false,
          error: message
        };
      }

      // Proceed with enrichment if it's a VC deal
      return await enrichMarketProfile(dealId, primaryIndustry, location);

    } catch (error) {
      console.error('❌ Error in triggerMarketEnrichment:', error);
      const errorMessage = `Error triggering market enrichment: ${error instanceof Error ? error.message : 'Unknown error'}`;
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const getMarketEnrichmentData = async (dealId: string) => {
    try {
      const { data, error } = await supabase
        .from('deal_enrichment_perplexity_market_export_vc')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('❌ Error fetching market enrichment data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Error in getMarketEnrichmentData:', error);
      return null;
    }
  };

  return {
    isEnriching,
    enrichmentResult,
    triggerMarketEnrichment,
    getMarketEnrichmentData,
  };
};