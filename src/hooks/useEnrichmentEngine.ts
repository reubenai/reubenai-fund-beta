import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EnrichmentRequest {
  dealId: string;
  fundId: string;
  orgId: string;
  enrichmentPacks?: string[];
  forceRefresh?: boolean;
}

interface EnrichmentResult {
  success: boolean;
  enrichment_results?: any[];
  error?: string;
  timestamp?: string;
}

interface MetricShift {
  category: string;
  metric: string;
  old_value: any;
  new_value: any;
  significance: 'minor' | 'moderate' | 'major';
  confidence: number;
  source: string;
}

export function useEnrichmentEngine() {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentResults, setEnrichmentResults] = useState<any[]>([]);
  const [metricShifts, setMetricShifts] = useState<MetricShift[]>([]);

  const triggerEnrichment = useCallback(async (request: EnrichmentRequest): Promise<EnrichmentResult> => {
    setIsEnriching(true);
    
    try {
      console.log('🔬 [Enrichment Hook] Starting enrichment for deal:', request.dealId);
      
      // Get current deal data for comparison
      const { data: currentDeal } = await supabase
        .from('deals')
        .select('*')
        .eq('id', request.dealId)
        .single();
      
      // Determine enrichment packs if not specified
      let enrichmentPacks = request.enrichmentPacks;
      if (!enrichmentPacks) {
        enrichmentPacks = await determineEnrichmentPacks(request.dealId, request.fundId);
      }
      
      // Call enrichment engine
      const { data, error } = await supabase.functions.invoke('deal-enrichment-engine', {
        body: {
          org_id: request.orgId,
          fund_id: request.fundId,
          deal_id: request.dealId,
          enrichment_packs: enrichmentPacks,
          force_refresh: request.forceRefresh || false
        }
      });

      if (error) throw error;

      console.log('✅ [Enrichment Hook] Enrichment completed:', data);
      
      // Store results
      setEnrichmentResults(data.enrichment_results || []);
      
      // Check for significant metric shifts
      const shifts = await detectMetricShifts(request.dealId, currentDeal, data.enrichment_results);
      setMetricShifts(shifts);
      
      // Show notifications for significant shifts
      if (shifts.length > 0) {
        const majorShifts = shifts.filter(s => s.significance === 'major');
        if (majorShifts.length > 0) {
          toast.warning(`${majorShifts.length} significant metric shifts detected`, {
            description: 'Check the deal analysis for updated insights',
            duration: 10000
          });
        }
      }
      
      toast.success(`Deal enrichment completed (${data.enrichment_results?.length || 0} packs processed)`);
      
      return data;
      
    } catch (error) {
      console.error('❌ [Enrichment Hook] Failed:', error);
      toast.error(`Enrichment failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsEnriching(false);
    }
  }, []);

  const getEnrichmentHistory = useCallback(async (dealId: string) => {
    try {
      const { data, error } = await supabase
        .from('deal_analysis_sources')
        .select('*')
        .eq('deal_id', dealId)
        .eq('source_type', 'enrichment_pack')
        .order('retrieved_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Failed to fetch enrichment history:', error);
      return [];
    }
  }, []);

  const refreshSpecificPack = useCallback(async (
    dealId: string, 
    fundId: string, 
    orgId: string,
    packName: string
  ) => {
    return triggerEnrichment({
      dealId,
      fundId,
      orgId,
      enrichmentPacks: [packName],
      forceRefresh: true
    });
  }, [triggerEnrichment]);

  return {
    isEnriching,
    enrichmentResults,
    metricShifts,
    triggerEnrichment,
    getEnrichmentHistory,
    refreshSpecificPack
  };
}

// Helper functions

async function determineEnrichmentPacks(dealId: string, fundId: string): Promise<string[]> {
  try {
    const { data: deal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();
      
    const { data: fund } = await supabase
      .from('funds')
      .select('fund_type')
      .eq('id', fundId)
      .single();
    
    if (!deal || !fund) return [];
    
    const packs: string[] = [];
    
    // Check if deal has minimum metadata for enrichment
    if (!deal.industry && !deal.funding_stage && !deal.location) {
      return []; // Skip enrichment if insufficient metadata
    }
    
    // Determine packs based on fund type
    if (fund.fund_type === 'venture_capital') {
      // Core VC categories
      packs.push('vc_market_opportunity', 'vc_team_leadership');
      
      // Conditional packs based on available data
      if (deal.website || deal.description) {
        packs.push('vc_product_technology', 'vc_business_traction');
      }
      
      if (deal.deal_size || deal.valuation) {
        packs.push('vc_financial_health');
      }
      
      // Strategic analysis
      packs.push('vc_strategic_fit', 'vc_strategic_timing');
      
      // Trust/transparency for mature companies
      if (deal.funding_stage && ['series_a', 'series_b', 'series_c'].includes(deal.funding_stage)) {
        packs.push('vc_trust_transparency');
      }
      
    } else if (fund.fund_type === 'private_equity') {
      // PE companies typically have more data available
      packs.push(
        'pe_financial_performance',
        'pe_market_position', 
        'pe_operational_excellence',
        'pe_growth_potential',
        'pe_risk_assessment',
        'pe_strategic_timing',
        'pe_trust_transparency'
      );
    }
    
    return packs;
  } catch (error) {
    console.error('Error determining enrichment packs:', error);
    return [];
  }
}

async function detectMetricShifts(
  dealId: string, 
  currentDeal: any, 
  enrichmentResults: any[]
): Promise<MetricShift[]> {
  const shifts: MetricShift[] = [];
  
  try {
    // Get historical enrichment data
    const { data: historicalData } = await supabase
      .from('deal_analysis_sources')
      .select('*')
      .eq('deal_id', dealId)
      .eq('source_type', 'enrichment_pack')
      .order('retrieved_at', { ascending: false })
      .limit(10); // Last 10 enrichment runs

    if (!historicalData || historicalData.length === 0) {
      return []; // No historical data to compare
    }

    // Compare each enrichment result with historical data
    for (const result of enrichmentResults) {
      const packName = result.pack_name;
      const currentData = result.data;
      
      // Find corresponding historical data
      const historical = historicalData.find(h => h.engine_name === packName);
      if (!historical) continue;
      
      const historicalData_parsed = historical.data_retrieved;
      
      // Detect significant changes in key metrics
      const detected_shifts = compareMetrics(packName, historicalData_parsed, currentData);
      shifts.push(...detected_shifts);
    }
    
    return shifts;
  } catch (error) {
    console.error('Error detecting metric shifts:', error);
    return [];
  }
}

function compareMetrics(packName: string, oldData: any, newData: any): MetricShift[] {
  const shifts: MetricShift[] = [];
  
  try {
    switch (packName) {
      case 'vc_market_opportunity':
      case 'pe_market_position':
        // Check market size changes
        if (oldData.tam_sam_som?.total_addressable_market && newData.tam_sam_som?.total_addressable_market) {
          const oldTAM = parseFloat(oldData.tam_sam_som.total_addressable_market);
          const newTAM = parseFloat(newData.tam_sam_som.total_addressable_market);
          
          if (Math.abs((newTAM - oldTAM) / oldTAM) > 0.2) { // 20% change threshold
            shifts.push({
              category: 'Market Opportunity',
              metric: 'Total Addressable Market',
              old_value: oldTAM,
              new_value: newTAM,
              significance: Math.abs((newTAM - oldTAM) / oldTAM) > 0.5 ? 'major' : 'moderate',
              confidence: 80,
              source: packName
            });
          }
        }
        break;
        
      case 'vc_financial_health':
      case 'pe_financial_performance':
        // Check revenue growth changes
        if (oldData.revenue_growth?.growth_rates && newData.revenue_growth?.growth_rates) {
          // Implementation for revenue growth comparison
          // This would compare specific metrics like YoY growth, revenue projections, etc.
        }
        break;
        
      case 'vc_business_traction':
        // Check customer metrics changes
        if (oldData.customer_metrics?.acquisition_cost && newData.customer_metrics?.acquisition_cost) {
          // Implementation for CAC comparison
        }
        break;
        
      // Add more pack-specific comparisons as needed
    }
  } catch (error) {
    console.error(`Error comparing metrics for ${packName}:`, error);
  }
  
  return shifts;
}