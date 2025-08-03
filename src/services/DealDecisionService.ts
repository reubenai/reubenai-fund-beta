import { supabase } from '@/integrations/supabase/client';

export interface DealDecision {
  id: string;
  deal_id: string;
  fund_id: string;
  decision_type: 'accept' | 'reject' | 'defer' | 'ic_approve' | 'ic_reject' | 'ic_defer';
  decision_maker: string;
  decision_rationale?: string;
  rejection_reason?: string;
  rejection_category?: 'strategy_misalignment' | 'team_concerns' | 'market_issues' | 'financial_concerns' | 'other';
  confidence_level?: number;
  ai_score_at_decision?: number;
  ai_recommendation_at_decision?: string;
  contradicts_ai: boolean;
  learning_context: any;
  decision_metadata: any;
  sourcing_feedback: any;
  impact_on_strategy: any;
  created_at: string;
  updated_at: string;
}

export interface CreateDecisionRequest {
  deal_id: string;
  fund_id: string;
  decision_type: DealDecision['decision_type'];
  decision_rationale?: string;
  rejection_reason?: string;
  rejection_category?: DealDecision['rejection_category'];
  confidence_level?: number;
  sourcing_feedback?: any;
  impact_on_strategy?: any;
}

class DealDecisionService {
  async createDecision(request: CreateDecisionRequest): Promise<{ success: boolean; decision?: DealDecision; error?: string }> {
    try {
      console.log('Creating deal decision:', request);

      // Get current deal data for AI comparison
      const { data: dealData } = await supabase
        .from('deals')
        .select(`
          *,
          deal_analyses(*),
          ic_memos(*)
        `)
        .eq('id', request.deal_id)
        .single();

      // Extract AI context
      const latestAnalysis = dealData?.deal_analyses?.[0];
      const aiScore = dealData?.overall_score || latestAnalysis?.market_score;
      const aiRecommendation = dealData?.rag_status;

      // Determine if decision contradicts AI
      const contradicts_ai = this.determineAIContradiction(request.decision_type, aiScore, aiRecommendation);

      // Build learning context
      const learning_context = {
        deal_stage: dealData?.status,
        sourcing_method: dealData?.source_method,
        industry: dealData?.industry,
        deal_size: dealData?.deal_size,
        analysis_completeness: latestAnalysis ? 'complete' : 'partial',
        decision_speed: this.calculateDecisionSpeed(dealData?.created_at),
      };

      const { data, error } = await supabase
        .from('deal_decisions')
        .insert({
          ...request,
          decision_maker: (await supabase.auth.getUser()).data.user?.id,
          ai_score_at_decision: aiScore,
          ai_recommendation_at_decision: aiRecommendation,
          contradicts_ai,
          learning_context,
          decision_metadata: {
            user_agent: navigator.userAgent,
            decision_timestamp: new Date().toISOString(),
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Update deal status based on decision
      const newStatus = this.getNewDealStatus(request.decision_type);
      if (newStatus) {
        await supabase
          .from('deals')
          .update({ status: newStatus as any })
          .eq('id', request.deal_id);
      }

      // Store learning insights in Fund Memory
      await this.storeLearningInsights(request.fund_id, data as DealDecision);

      // Trigger analysis pattern update
      await this.updateDecisionPatterns(request.fund_id);

      console.log('Deal decision created successfully:', data);
      return { success: true, decision: data as DealDecision };

    } catch (error: any) {
      console.error('Error creating deal decision:', error);
      return { success: false, error: error.message };
    }
  }

  async getDecisions(dealId: string): Promise<DealDecision[]> {
    try {
      const { data, error } = await supabase
        .from('deal_decisions')
        .select(`
          *,
          profiles!deal_decisions_decision_maker_fkey(first_name, last_name, email)
        `)
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DealDecision[];
    } catch (error) {
      console.error('Error fetching deal decisions:', error);
      return [];
    }
  }

  async getDecisionPatterns(fundId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('analyze_decision_patterns', { fund_id_param: fundId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error analyzing decision patterns:', error);
      return null;
    }
  }

  private determineAIContradiction(
    decisionType: string, 
    aiScore?: number, 
    aiRecommendation?: string
  ): boolean {
    if (!aiScore && !aiRecommendation) return false;

    // If AI recommended "exciting" or high score, but human rejected
    if ((aiScore && aiScore >= 85) || aiRecommendation === 'exciting') {
      return decisionType === 'reject' || decisionType === 'ic_reject';
    }

    // If AI recommended "needs development" or low score, but human accepted
    if ((aiScore && aiScore < 50) || aiRecommendation === 'needs_development') {
      return decisionType === 'accept' || decisionType === 'ic_approve';
    }

    return false;
  }

  private calculateDecisionSpeed(createdAt?: string): string {
    if (!createdAt) return 'unknown';
    
    const daysSinceCreated = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreated < 1) return 'same_day';
    if (daysSinceCreated < 7) return 'within_week';
    if (daysSinceCreated < 30) return 'within_month';
    return 'over_month';
  }

  private getNewDealStatus(decisionType: string): string | null {
    switch (decisionType) {
      case 'accept':
        return 'screening';
      case 'reject':
        return 'rejected';
      case 'ic_approve':
        return 'approved';
      case 'ic_reject':
        return 'declined';
      default:
        return null;
    }
  }

  private async storeLearningInsights(fundId: string, decision: DealDecision): Promise<void> {
    try {
      // Store in fund memory for AI learning
      await supabase.functions.invoke('fund-memory-engine', {
        body: {
          action: 'store_memory',
          fundId,
          dealId: decision.deal_id,
          memoryType: 'decision_pattern',
          title: `Deal Decision: ${decision.decision_type}`,
          description: `Human decision on deal with AI learning context`,
          content: `Decision: ${decision.decision_type}. Rationale: ${decision.decision_rationale || 'No rationale provided'}`,
          memoryContent: {
            decision,
            learning_insights: {
              contradicts_ai: decision.contradicts_ai,
              decision_speed: decision.learning_context?.decision_speed,
              confidence: decision.confidence_level,
            }
          },
          aiServiceName: 'deal-decision-service',
          confidenceScore: decision.confidence_level || 75
        }
      });
    } catch (error) {
      console.error('Error storing learning insights:', error);
    }
  }

  private async updateDecisionPatterns(fundId: string): Promise<void> {
    try {
      // Get latest patterns
      const patterns = await this.getDecisionPatterns(fundId);
      
      if (patterns) {
        // Store updated patterns
        await supabase
          .from('decision_learning_patterns')
          .upsert({
            fund_id: fundId,
            pattern_type: 'decision_summary',
            pattern_data: patterns,
            last_updated: new Date().toISOString(),
            confidence_score: 85,
          });
      }
    } catch (error) {
      console.error('Error updating decision patterns:', error);
    }
  }
}

export const dealDecisionService = new DealDecisionService();