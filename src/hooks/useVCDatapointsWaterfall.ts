import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WaterfallDataExtractionService } from '@/services/waterfallDataExtractionService';

interface WaterfallVCDatapoints {
  employee_count: {
    value: number | string;
    source: string;
    confidence: 'high' | 'medium' | 'low';
    lastUpdated?: string;
    isFallback: boolean;
  };
  founding_year: {
    value: number | string;
    source: string;
    confidence: 'high' | 'medium' | 'low';
    lastUpdated?: string;
    isFallback: boolean;
  };
  business_model: {
    value: string;
    source: string;
    confidence: 'high' | 'medium' | 'low';
    lastUpdated?: string;
    isFallback: boolean;
  };
}

interface UseVCDatapointsWaterfallReturn {
  data: WaterfallVCDatapoints | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVCDatapointsWaterfall(dealId: string): UseVCDatapointsWaterfallReturn {
  const [data, setData] = useState<WaterfallVCDatapoints | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWaterfallData = async () => {
    if (!dealId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all enrichment data sources in parallel
      const [
        documentsResult,
        vcDatapointsResult,
        crunchbaseExportResult,
        linkedinExportResult,
        perplexityCompanyResult,
        perplexityFounderResult,
        perplexityMarketResult
      ] = await Promise.all([
        // Documents data points
        supabase
          .from('deal_documents')
          .select('data_points_vc')
          .eq('deal_id', dealId)
          .not('data_points_vc', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1),

        // VC Datapoints table with enrichment JSON columns
        supabase
          .from('deal_analysis_datapoints_vc')
          .select(`
            deal_enrichment_crunchbase_export,
            deal_enrichment_linkedin_export,
            deal_enrichment_linkedin_profile_export,
            deal_enrichment_perplexity_company_export_vc,
            deal_enrichment_perplexity_founder_export_vc,
            deal_enrichment_perplexity_market_export_vc
          `)
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false })
          .limit(1),

        // Crunchbase export table
        supabase
          .from('deal_enrichment_crunchbase_export')
          .select('num_employees, founded_date, created_at')
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false })
          .limit(1),

        // LinkedIn export table
        supabase
          .from('deal_enrichment_linkedin_export')
          .select('employees_in_linkedin, founded, created_at')
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false })
          .limit(1),

        // Perplexity Company export
        supabase
          .from('deal_enrichment_perplexity_company_export_vc')
          .select('tam, sam, som, cagr, created_at')
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false })
          .limit(1),

        // Perplexity Founder export
        supabase
          .from('deal_enrichment_perplexity_founder_export_vc')
          .select('founder_name, leadership_experience, created_at')
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false })
          .limit(1),

        // Perplexity Market export
        supabase
          .from('deal_enrichment_perplexity_market_export_vc')
          .select('primary_industry, market_cycle, created_at')
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false })
          .limit(1)
      ]);

      // Process the data
      const enrichmentData = {
        documents: documentsResult.data?.[0] || null,
        vc_datapoints: vcDatapointsResult.data?.[0] || null,
        crunchbase: crunchbaseExportResult.data?.[0] || null,
        linkedin: linkedinExportResult.data?.[0] || null,
        perplexity_company: perplexityCompanyResult.data?.[0] || null,
        perplexity_founder: perplexityFounderResult.data?.[0] || null,
        perplexity_market: perplexityMarketResult.data?.[0] || null,
      };

      // Extract data using waterfall logic
      const waterfallData: WaterfallVCDatapoints = {
        employee_count: WaterfallDataExtractionService.extractEmployeeCount(enrichmentData),
        founding_year: WaterfallDataExtractionService.extractFoundingYear(enrichmentData),
        business_model: WaterfallDataExtractionService.extractBusinessModel(enrichmentData),
      };

      setData(waterfallData);
    } catch (err) {
      console.error('Error fetching waterfall data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaterfallData();
  }, [dealId]);

  const refetch = () => {
    fetchWaterfallData();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}