import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Deal } from '@/hooks/usePipelineDeals';
import { toTemplateFundType, type AnyFundType } from '@/utils/fundTypeConversion';

interface VCDataPoints {
  // Team & Leadership
  founder_experience?: string;
  team_composition?: string;
  vision_communication?: string;
  
  // Market Opportunity
  market_size?: string;
  market_timing?: string;
  competitive_landscape?: string;
  
  // Product & Technology
  product_innovation?: string;
  technology_advantage?: string;
  product_market_fit?: string;
  
  // Business Traction
  revenue_growth?: string;
  customer_metrics?: string;
  market_validation?: string;
  
  // Financial Health
  financial_performance?: string;
  capital_efficiency?: string;
  financial_planning?: string;
  
  // Strategic Fit
  portfolio_synergies?: string;
  investment_thesis_alignment?: string;
  value_creation_potential?: string;
}

interface PEDataPoints {
  revenue_current?: number;
  revenue_growth_rate?: number;
  ebitda_margin?: number;
  employee_count?: number;
  market_share?: number;
  operational_efficiency_score?: number;
  management_experience_years?: number;
  acquisition_opportunities?: string[];
  data_completeness_score?: number;
  source_engines?: string[];
}

interface ScoringResults {
  overall_score?: number;
  deal_executive_summary?: string;
  
  // Category summaries
  team_leadership_summary?: string;
  market_opportunity_summary?: string;
  product_technology_summary?: string;
  business_traction_summary?: string;
  financial_health_summary?: string;
  strategic_fit_summary?: string;
  
  // Individual scores (for display purposes)
  founder_experience_score?: number;
  team_composition_score?: number;
  vision_communication_score?: number;
  market_size_score?: number;
  market_timing_score?: number;
  competitive_landscape_score?: number;
  product_innovation_score?: number;
  technology_advantage_score?: number;
  product_market_fit_score?: number;
  revenue_growth_score?: number;
  customer_metrics_score?: number;
  market_validation_score?: number;
  financial_performance_score?: number;
  capital_efficiency_score?: number;
  financial_planning_score?: number;
  portfolio_synergies_score?: number;
  investment_thesis_alignment_score?: number;
  value_creation_potential_score?: number;
  
  processing_status?: string;
  analyzed_at?: string;
  confidence_score?: number;
}

interface InvestmentStrategy {
  enhanced_criteria?: any;
  exciting_threshold?: number;
  promising_threshold?: number;
  needs_development_threshold?: number;
  fund_type?: string;
}

interface ReubenAIData {
  dataPoints: VCDataPoints | PEDataPoints | null;
  scoringResults: ScoringResults | null;
  strategy: InvestmentStrategy | null;
  isProcessing: boolean;
  hasData: boolean;
  lastUpdated?: string;
}

interface UseReubenAIDataReturn {
  data: ReubenAIData;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReubenAIData(deal: Deal, fundType: AnyFundType): UseReubenAIDataReturn {
  const [data, setData] = useState<ReubenAIData>({
    dataPoints: null,
    scoringResults: null,
    strategy: null,
    isProcessing: false,
    hasData: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReubenAIData = async () => {
    if (!deal.id || !deal.fund_id) return;

    setIsLoading(true);
    setError(null);

    try {
      const templateFundType = toTemplateFundType(fundType);
      
      // Fetch data points based on fund type
      let dataPointsResult = null;
      if (templateFundType === 'vc') {
        const { data: vcData, error: vcError } = await supabase
          .from('deal_datapoints_vc')
          .select('*')
          .eq('deal_id', deal.id)
          .maybeSingle();
        
        if (vcError && vcError.code !== 'PGRST116') {
          console.error('Error fetching VC datapoints:', vcError);
        }
        dataPointsResult = vcData;
      } else {
        const { data: peData, error: peError } = await supabase
          .from('deal_datapoints_pe')
          .select('*')
          .eq('deal_id', deal.id)
          .maybeSingle();
        
        if (peError && peError.code !== 'PGRST116') {
          console.error('Error fetching PE datapoints:', peError);
        }
        dataPointsResult = peData;
      }

      // Fetch scoring results (only for VC currently as per edge function)
      let scoringResults = null;
      if (templateFundType === 'vc') {
        const { data: scoringData, error: scoringError } = await supabase
          .from('deal_analysisresult_vc')
          .select('*')
          .eq('deal_id', deal.id)
          .maybeSingle();
        
        if (scoringError && scoringError.code !== 'PGRST116') {
          console.error('Error fetching scoring results:', scoringError);
        }
        scoringResults = scoringData;
      }

      // Fetch investment strategy
      const { data: strategyData, error: strategyError } = await supabase
        .from('investment_strategies')
        .select('enhanced_criteria, exciting_threshold, promising_threshold, needs_development_threshold, fund_type')
        .eq('fund_id', deal.fund_id)
        .maybeSingle();
      
      if (strategyError && strategyError.code !== 'PGRST116') {
        console.error('Error fetching investment strategy:', strategyError);
      }

      // Determine processing status
      const isProcessing = scoringResults?.processing_status === 'processing' || 
                          scoringResults?.processing_status === 'pending' ||
                          (!scoringResults && dataPointsResult); // Has data but no analysis yet

      const hasData = !!(dataPointsResult || scoringResults);
      const lastUpdated = scoringResults?.analyzed_at || dataPointsResult?.updated_at;

      setData({
        dataPoints: dataPointsResult,
        scoringResults,
        strategy: strategyData,
        isProcessing,
        hasData,
        lastUpdated,
      });

    } catch (err) {
      console.error('Error fetching ReubenAI data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReubenAIData();
  }, [deal.id, deal.fund_id, fundType]);

  const refetch = () => {
    fetchReubenAIData();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}