import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { enhancedAnalysisEngine } from '@/services/EnhancedAnalysisEngine';

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
      console.log('🔬 [Enrichment Hook] Starting intelligent enrichment for deal:', request.dealId);
      
      // Get current deal and fund data
      const { data: currentDeal } = await supabase
        .from('deals')
        .select('*')
        .eq('id', request.dealId)
        .single();
        
      const { data: fund } = await supabase
        .from('funds')
        .select('fund_type')
        .eq('id', request.fundId)
        .single();

      if (!currentDeal || !fund) {
        throw new Error('Deal or fund not found');
      }

      // Generate enhanced analysis using industry intelligence
      const analysisResults = await enhancedAnalysisEngine.generateEnhancedAnalysis({
        dealId: request.dealId,
        fundId: request.fundId,
        industry: currentDeal.industry,
        fundType: fund.fund_type === 'venture_capital' ? 'vc' : 'pe',
        companyData: currentDeal,
        forceRefresh: request.forceRefresh
      });

      console.log('✅ [Enhanced Analysis] Generated intelligent baseline analysis:', analysisResults.length, 'categories');

      // Update deal with enhanced analysis
      const enhancedAnalysisData = {
        analysis_engines: analysisResults.reduce((acc, result) => {
          acc[result.categoryName.toLowerCase().replace(/[^a-z]/g, '_')] = {
            name: result.categoryName,
            score: result.overallScore,
            confidence: result.confidence,
            status: result.status,
            subcriteria: result.subcriteria,
            recommendations: result.recommendations,
            data_gaps: result.dataGaps,
            last_run: new Date().toISOString(),
            version: '2.0',
            data_sources: 'industry_intelligence'
          };
          return acc;
        }, {} as any),
        analysis_completeness: Math.round(
          analysisResults.reduce((sum, r) => sum + r.confidence, 0) / analysisResults.length
        ),
        last_comprehensive_analysis: new Date().toISOString(),
        fund_type_analysis: {
          fund_type: fund.fund_type,
          focus_areas: analysisResults.filter(r => r.overallScore >= 70).map(r => r.categoryName),
          strengths: analysisResults.filter(r => r.overallScore >= 70).map(r => r.categoryName),
          concerns: analysisResults.filter(r => r.overallScore < 60).map(r => r.categoryName),
          alignment_score: Math.round(
            analysisResults.reduce((sum, r) => sum + r.overallScore, 0) / analysisResults.length
          ),
          strategic_recommendations: analysisResults.flatMap(r => r.recommendations).slice(0, 5)
        }
      };

      // Update deal with enhanced analysis
      await supabase
        .from('deals')
        .update({ 
          enhanced_analysis: enhancedAnalysisData,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.dealId);

      // Store enrichment results
      const enrichmentResults = analysisResults.map(result => ({
        pack_name: result.categoryName,
        data: result,
        confidence: result.confidence,
        timestamp: new Date().toISOString()
      }));
      
      setEnrichmentResults(enrichmentResults);
      
      // Check for significant metric shifts
      const shifts = await detectMetricShifts(request.dealId, currentDeal, enrichmentResults);
      setMetricShifts(shifts);
      
      toast.success(`Intelligent analysis completed (${analysisResults.length} categories analyzed)`);
      
      return {
        success: true,
        enrichment_results: enrichmentResults,
        timestamp: new Date().toISOString()
      };
      
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