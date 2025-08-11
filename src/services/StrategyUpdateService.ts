import { supabase } from '@/integrations/supabase/client';

// Define the enhanced strategy type based on the database structure
interface EnhancedStrategy {
  id: string;
  fund_id: string;
  fund_type: 'vc' | 'pe';
  industries: string[] | null;
  geography: string[] | null;
  key_signals: string[] | null;
  enhanced_criteria: any;
  strategy_notes: string | null;
  min_investment_amount: number | null;
  max_investment_amount: number | null;
  exciting_threshold: number | null;
  promising_threshold: number | null;
  needs_development_threshold: number | null;
  created_at: string;
  updated_at: string;
}

export class StrategyUpdateService {
  private static instance: StrategyUpdateService;
  private subscriptions: Map<string, any> = new Map();

  static getInstance(): StrategyUpdateService {
    if (!StrategyUpdateService.instance) {
      StrategyUpdateService.instance = new StrategyUpdateService();
    }
    return StrategyUpdateService.instance;
  }

  /**
   * Subscribe to real-time strategy updates for a specific fund
   */
  subscribeToStrategyUpdates(
    fundId: string, 
    onUpdate: (strategy: EnhancedStrategy) => void
  ): () => void {
    console.log('🔄 Subscribing to strategy updates for fund:', fundId);

    const channel = supabase
      .channel(`strategy-updates-${fundId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investment_strategies',
          filter: `fund_id=eq.${fundId}`
        },
        (payload) => {
          console.log('📢 Strategy update received:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updatedStrategy = payload.new as EnhancedStrategy;
            onUpdate(updatedStrategy);
            
            // Trigger re-analysis for all deals in this fund
            this.triggerDealReanalysis(fundId, updatedStrategy);
          }
        }
      )
      .subscribe();

    // Store subscription for cleanup
    this.subscriptions.set(fundId, channel);

    // Return cleanup function
    return () => {
      console.log('🔄 Unsubscribing from strategy updates for fund:', fundId);
      supabase.removeChannel(channel);
      this.subscriptions.delete(fundId);
    };
  }

  /**
   * Trigger re-analysis for all deals when strategy changes
   */
  private async triggerDealReanalysis(fundId: string, strategy: EnhancedStrategy) {
    try {
      console.log('🔄 Triggering deal re-analysis for fund:', fundId);
      
      // Fetch all deals for this fund
      const { data: deals, error } = await supabase
        .from('deals')
        .select('id, company_name')
        .eq('fund_id', fundId);

      if (error) {
        console.error('Error fetching deals for re-analysis:', error);
        return;
      }

      if (!deals || deals.length === 0) {
        console.log('No deals found for fund, skipping re-analysis');
        return;
      }

      console.log(`🚀 Re-analyzing ${deals.length} deals with updated strategy`);

      // Trigger re-analysis for each deal (in batches to avoid overwhelming the system)
      const batchSize = 5;
      for (let i = 0; i < deals.length; i += batchSize) {
        const batch = deals.slice(i, i + batchSize);
        
        const reanalysisPromises = batch.map(deal => 
          this.triggerSingleDealReanalysis(deal.id, deal.company_name)
        );

        await Promise.allSettled(reanalysisPromises);
        
        // Small delay between batches to prevent rate limiting
        if (i + batchSize < deals.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('✅ All deals scheduled for re-analysis');
    } catch (error) {
      console.error('Error triggering deal re-analysis:', error);
    }
  }

  /**
   * Trigger re-analysis for a single deal
   */
  private async triggerSingleDealReanalysis(dealId: string, companyName: string) {
    try {
      console.log(`🔍 Re-analyzing deal: ${companyName} (${dealId})`);
      
      // Call the enhanced reuben-orchestrator
      const { data, error } = await supabase.functions.invoke('reuben-orchestrator', {
        body: { dealId }
      });

      if (error) {
        console.error(`Error re-analyzing deal ${companyName}:`, error);
        return;
      }

      console.log(`✅ Successfully re-analyzed deal: ${companyName}`);
      return data;
    } catch (error) {
      console.error(`Error in deal re-analysis for ${companyName}:`, error);
    }
  }

  /**
   * Manually trigger re-analysis for specific deals
   */
  async triggerManualReanalysis(dealIds: string[]): Promise<void> {
    console.log(`🔄 Manual re-analysis triggered for ${dealIds.length} deals`);
    
    for (const dealId of dealIds) {
      try {
        await this.triggerSingleDealReanalysis(dealId, `Deal ${dealId}`);
      } catch (error) {
        console.error(`Failed to re-analyze deal ${dealId}:`, error);
      }
    }
  }

  /**
   * Check if strategy changes require immediate deal score updates
   */
  async validateStrategyImpact(
    oldStrategy: EnhancedStrategy | null, 
    newStrategy: EnhancedStrategy
  ): Promise<{
    requiresReanalysis: boolean;
    impactedAreas: string[];
    confidence: 'high' | 'medium' | 'low';
  }> {
    const impactedAreas: string[] = [];
    let requiresReanalysis = false;

    // Check for threshold changes
    if (!oldStrategy || 
        oldStrategy.exciting_threshold !== newStrategy.exciting_threshold ||
        oldStrategy.promising_threshold !== newStrategy.promising_threshold ||
        oldStrategy.needs_development_threshold !== newStrategy.needs_development_threshold) {
      impactedAreas.push('Deal Scoring Thresholds');
      requiresReanalysis = true;
    }

    // Check for enhanced criteria changes
    if (!oldStrategy || 
        JSON.stringify(oldStrategy.enhanced_criteria) !== JSON.stringify(newStrategy.enhanced_criteria)) {
      impactedAreas.push('Enhanced Investment Criteria');
      requiresReanalysis = true;
    }

    // Check for geography changes
    if (!oldStrategy ||
        JSON.stringify(oldStrategy.geography) !== JSON.stringify(newStrategy.geography)) {
      impactedAreas.push('Geographic Focus');
      requiresReanalysis = true;
    }

    // Check for industry focus changes
    if (!oldStrategy ||
        JSON.stringify(oldStrategy.industries) !== JSON.stringify(newStrategy.industries)) {
      impactedAreas.push('Industry Focus');
      requiresReanalysis = true;
    }

    // Check for key signals changes
    if (!oldStrategy ||
        JSON.stringify(oldStrategy.key_signals) !== JSON.stringify(newStrategy.key_signals)) {
      impactedAreas.push('Key Investment Signals');
      requiresReanalysis = true;
    }

    const confidence: 'high' | 'medium' | 'low' = 
      impactedAreas.length >= 3 ? 'high' :
      impactedAreas.length >= 2 ? 'medium' : 'low';

    return {
      requiresReanalysis,
      impactedAreas,
      confidence
    };
  }

  /**
   * Get real-time strategy health metrics
   */
  async getStrategyHealthMetrics(fundId: string): Promise<{
    totalDeals: number;
    analyzedDeals: number;
    pendingReanalysis: number;
    lastUpdated: string | null;
    averageScore: number | null;
  }> {
    try {
      // Get strategy last updated time
      const { data: strategy } = await supabase
        .from('investment_strategies')
        .select('updated_at')
        .eq('fund_id', fundId)
        .single();

      // Get deal analysis metrics
      const { data: deals } = await supabase
        .from('deals')
        .select(`
          id,
          overall_score,
          deal_analyses!inner(analysis_version, updated_at)
        `)
        .eq('fund_id', fundId);

      const totalDeals = deals?.length || 0;
      const analyzedDeals = deals?.filter(d => Array.isArray(d.deal_analyses) && d.deal_analyses.length > 0).length || 0;
      
      // Check for deals that need re-analysis (where strategy updated after last analysis)
      const strategyUpdatedAt = strategy?.updated_at ? new Date(strategy.updated_at) : null;
      const pendingReanalysis = strategyUpdatedAt ? deals?.filter(deal => {
        const lastAnalysis = deal.deal_analyses[0]?.updated_at;
        return !lastAnalysis || new Date(lastAnalysis) < strategyUpdatedAt;
      }).length || 0 : 0;

      const scores = deals?.map(d => d.overall_score).filter(s => s !== null) || [];
      const averageScore = scores.length > 0 ? 
        Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;

      return {
        totalDeals,
        analyzedDeals,
        pendingReanalysis,
        lastUpdated: strategy?.updated_at || null,
        averageScore
      };
    } catch (error) {
      console.error('Error getting strategy health metrics:', error);
      return {
        totalDeals: 0,
        analyzedDeals: 0,
        pendingReanalysis: 0,
        lastUpdated: null,
        averageScore: null
      };
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    console.log('🧹 Cleaning up strategy update subscriptions');
    this.subscriptions.forEach((channel, fundId) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const strategyUpdateService = StrategyUpdateService.getInstance();