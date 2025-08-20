import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CompetitiveIntelligenceService, { CompetitiveAnalysisResult } from '@/services/competitiveIntelligenceService';

export function useEnhancedCompetitiveAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [competitiveData, setCompetitiveData] = useState<CompetitiveAnalysisResult | null>(null);
  const { toast } = useToast();

  const runCompetitiveAnalysis = useCallback(async (dealId: string, fundId: string) => {
    console.log('🎯 runCompetitiveAnalysis called with:', { dealId, fundId, currentlyAnalyzing: isAnalyzing });
    
    if (isAnalyzing) {
      console.log('⚠️ Analysis already in progress, skipping');
      return null;
    }
    
    setIsAnalyzing(true);
    try {
      console.log('🏆 Starting enhanced competitive analysis for deal:', dealId);
      
      // First check if we have recent competitive data
      const storedData = await CompetitiveIntelligenceService.getStoredCompetitiveData(dealId);
      console.log('📚 Stored data check:', { hasStoredData: !!storedData, isRecent: storedData ? isRecentAnalysis(storedData.last_updated) : false });
      
      if (storedData && isRecentAnalysis(storedData.last_updated)) {
        console.log('✅ Using cached competitive analysis:', storedData);
        setCompetitiveData(storedData);
        toast({
          title: "Competitive Analysis Ready",
          description: "Using recent competitive intelligence data",
        });
        return storedData;
      }

      // Run fresh competitive analysis
      console.log('🔄 Running fresh competitive analysis via service');
      const result = await CompetitiveIntelligenceService.analyzeCompetitors(dealId, fundId);
      console.log('📊 Fresh analysis result:', { hasResult: !!result, resultType: typeof result, breakdown: result?.competitive_breakdown });
      
      if (result) {
        console.log('✅ Setting competitive data:', result);
        setCompetitiveData(result);
        toast({
          title: "Competitive Analysis Complete",
          description: `Identified ${result.competitive_breakdown?.[0]?.competitors?.length || 0} competitors with real intelligence`,
        });
        return result;
      } else {
        console.log('⚠️ No result from analysis');
        toast({
          title: "Analysis Warning",
          description: "Competitive analysis completed with limited data",
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      console.error('❌ Competitive analysis error:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to complete competitive analysis. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      console.log('🏁 Analysis completed, setting isAnalyzing to false');
      setIsAnalyzing(false);
    }
  }, [toast, isAnalyzing]);

  const getCompetitorSummary = useCallback((data: CompetitiveAnalysisResult) => {
    if (!data.competitive_breakdown || data.competitive_breakdown.length === 0) {
      return 'No competitive data available';
    }

    const breakdown = data.competitive_breakdown[0];
    const competitorCount = breakdown.competitors?.length || 0;
    const majorPlayers = breakdown.competitors?.filter(c => c.competitor_type === 'Incumbent').length || 0;
    
    return `${competitorCount} competitors identified (${majorPlayers} major players)`;
  }, []);

  const getMarketStructureInsight = useCallback((data: CompetitiveAnalysisResult) => {
    if (!data.competitive_breakdown || data.competitive_breakdown.length === 0) {
      return 'Market structure analysis pending';
    }

    const breakdown = data.competitive_breakdown[0];
    return `${breakdown.market_fragmentation} market with ${breakdown.competitive_tension.toLowerCase()} competitive tension`;
  }, []);

  return {
    isAnalyzing,
    competitiveData,
    runCompetitiveAnalysis,
    getCompetitorSummary,
    getMarketStructureInsight,
    formatCompetitors: CompetitiveIntelligenceService.formatCompetitorDisplay,
    calculateConcentration: CompetitiveIntelligenceService.calculateMarketConcentration
  };
}

function isRecentAnalysis(lastUpdated: string): boolean {
  const analysisDate = new Date(lastUpdated);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return analysisDate > oneDayAgo;
}