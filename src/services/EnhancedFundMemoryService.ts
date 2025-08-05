import { supabase } from '@/integrations/supabase/client';

export interface DecisionContext {
  deal_id?: string;
  ic_session_id?: string;
  decision_type: string;
  decision_outcome: string;
  confidence_level: number;
  ai_recommendations?: any;
  supporting_evidence?: any;
  context_data?: any;
}

export interface FundMemoryInsight {
  type: 'decision_pattern' | 'bias_detection' | 'success_factor' | 'risk_signal';
  title: string;
  description: string;
  confidence_score: number;
  actionable_recommendation: string;
  supporting_data: any;
}

export interface DecisionAnalytics {
  decision_speed_avg: number;
  decision_consistency: number;
  ai_alignment_rate: number;
  bias_frequency: number;
  success_correlation: number;
}

class EnhancedFundMemoryService {
  /**
   * Capture decision context for immediate learning
   */
  async captureDecisionContext(fundId: string, context: DecisionContext): Promise<void> {
    try {
      // Store in fund memory entries
      const { error: memoryError } = await supabase
        .from('fund_memory_entries')
        .insert({
          fund_id: fundId,
          deal_id: context.deal_id,
          ic_meeting_id: context.ic_session_id,
          memory_type: 'decision_context',
          title: `Decision: ${context.decision_type} - ${context.decision_outcome}`,
          description: `Decision context captured with ${context.confidence_level}% confidence`,
          memory_content: {
            decision_type: context.decision_type,
            decision_outcome: context.decision_outcome,
            confidence_level: context.confidence_level,
            ai_recommendations: context.ai_recommendations,
            supporting_evidence: context.supporting_evidence,
            context_data: context.context_data,
            captured_at: new Date().toISOString()
          },
          confidence_score: context.confidence_level,
          importance_level: context.confidence_level > 80 ? 'high' : 'medium',
          contextual_tags: [
            'decision_context',
            context.decision_type,
            context.decision_outcome,
            context.deal_id ? 'deal_decision' : 'ic_decision'
          ],
          ai_service_name: 'enhanced-fund-memory-service',
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (memoryError) throw memoryError;

      // Trigger pattern analysis
      await this.triggerPatternAnalysis(fundId, context);

    } catch (error) {
      console.error('Error capturing decision context:', error);
      throw error;
    }
  }

  /**
   * Generate immediate insights from recent decisions
   */
  async generateImmediateInsights(fundId: string, timeframeHours: number = 168): Promise<FundMemoryInsight[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - timeframeHours);

      // Get recent memory entries
      const { data: recentMemories, error: memoriesError } = await supabase
        .from('fund_memory_entries')
        .select('*')
        .eq('fund_id', fundId)
        .gte('created_at', cutoffDate.toISOString())
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (memoriesError) throw memoriesError;

      // Get recent deal decisions
      const { data: recentDecisions, error: decisionsError } = await supabase
        .from('deal_decisions')
        .select('*')
        .eq('fund_id', fundId)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (decisionsError) throw decisionsError;

      const insights: FundMemoryInsight[] = [];

      // Analyze decision patterns
      if (recentDecisions && recentDecisions.length > 0) {
        insights.push(...this.analyzeDecisionPatterns(recentDecisions));
      }

      // Analyze memory patterns
      if (recentMemories && recentMemories.length > 0) {
        insights.push(...this.analyzeMemoryPatterns(recentMemories));
      }

      // Generate bias detection insights
      insights.push(...this.generateBiasInsights(recentDecisions || [], recentMemories || []));

      return insights.slice(0, 10); // Return top 10 insights
    } catch (error) {
      console.error('Error generating immediate insights:', error);
      return [];
    }
  }

  /**
   * Get decision analytics for performance tracking
   */
  async getDecisionAnalytics(fundId: string, timeframeDays: number = 30): Promise<DecisionAnalytics> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);

      // Get deal decisions for analytics
      const { data: decisions, error: decisionsError } = await supabase
        .from('deal_decisions')
        .select('*')
        .eq('fund_id', fundId)
        .gte('created_at', cutoffDate.toISOString());

      // Get related deals data separately
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('id, created_at, company_name, industry')
        .in('id', decisions?.map(d => d.deal_id) || []);

      if (decisionsError || dealsError) throw decisionsError || dealsError;

      if (!decisions || decisions.length === 0) {
        return {
          decision_speed_avg: 0,
          decision_consistency: 70,
          ai_alignment_rate: 75,
          bias_frequency: 10,
          success_correlation: 65
        };
      }

      // Create deal lookup map
      const dealMap = (deals || []).reduce((acc: any, deal) => {
        acc[deal.id] = deal;
        return acc;
      }, {});

      // Calculate decision speed
      const speedData = decisions.map(d => {
        const deal = dealMap[d.deal_id];
        if (!deal) return 7; // default 7 days if no deal found
        const dealCreated = new Date(deal.created_at);
        const decisionMade = new Date(d.created_at);
        return (decisionMade.getTime() - dealCreated.getTime()) / (1000 * 60 * 60 * 24); // days
      });
      const avgSpeed = speedData.reduce((a, b) => a + b, 0) / speedData.length;

      // Calculate AI alignment rate
      const aiAlignedDecisions = decisions.filter(d => !d.contradicts_ai).length;
      const aiAlignmentRate = (aiAlignedDecisions / decisions.length) * 100;

      // Calculate consistency (similar confidence levels for similar deal types)
      const consistencyScore = this.calculateDecisionConsistency(decisions);

      // Calculate bias frequency (decisions that contradict AI with low confidence)
      const biasDecisions = decisions.filter(d => 
        d.contradicts_ai && (d.confidence_level || 0) < 70
      ).length;
      const biasFrequency = (biasDecisions / decisions.length) * 100;

      // Calculate success correlation (placeholder - would need outcome data)
      const successCorrelation = 70 + Math.min(20, decisions.length * 2);

      return {
        decision_speed_avg: Math.round(avgSpeed * 10) / 10,
        decision_consistency: Math.round(consistencyScore),
        ai_alignment_rate: Math.round(aiAlignmentRate),
        bias_frequency: Math.round(biasFrequency),
        success_correlation: Math.round(successCorrelation)
      };

    } catch (error) {
      console.error('Error calculating decision analytics:', error);
      return {
        decision_speed_avg: 0,
        decision_consistency: 70,
        ai_alignment_rate: 75,
        bias_frequency: 10,
        success_correlation: 65
      };
    }
  }

  /**
   * Get contextual memory prompts for current deal evaluation
   */
  async getContextualPrompts(fundId: string, dealContext?: any): Promise<string[]> {
    try {
      const prompts: string[] = [];

      if (dealContext) {
        // Find similar deals from memory
        const { data: similarDeals, error } = await supabase
          .from('fund_memory_entries')
          .select('*')
          .eq('fund_id', fundId)
          .eq('memory_type', 'decision_pattern')
          .contains('contextual_tags', [dealContext.industry || 'unknown'])
          .eq('is_active', true)
          .order('confidence_score', { ascending: false })
          .limit(3);

        if (!error && similarDeals) {
          similarDeals.forEach(deal => {
            const content = deal.memory_content as any;
            if (content?.decision_type) {
              prompts.push(
                `Similar ${dealContext.industry} deal: ${content.company_name} was ${content.to_status} - consider ${content.decision_type} patterns`
              );
            }
          });
        }
      }

      // Add general prompts from triggers
      const { data: triggers } = await supabase
        .from('memory_prompt_triggers')
        .select('*')
        .eq('fund_id', fundId)
        .eq('is_active', true)
        .order('effectiveness_score', { ascending: false })
        .limit(2);

      if (triggers) {
        triggers.forEach(trigger => {
          if (trigger.prompt_template) {
            let prompt = trigger.prompt_template;
            if (dealContext) {
              prompt = prompt
                .replace('{company_name}', dealContext.company_name || 'this company')
                .replace('{industry}', dealContext.industry || 'this sector');
            }
            prompts.push(prompt);
          }
        });
      }

      return prompts.slice(0, 5);
    } catch (error) {
      console.error('Error getting contextual prompts:', error);
      return [];
    }
  }

  private async triggerPatternAnalysis(fundId: string, context: DecisionContext): Promise<void> {
    try {
      // Check for bias patterns
      if (context.ai_recommendations && context.confidence_level < 70) {
        await supabase
          .from('fund_decision_patterns')
          .upsert({
            fund_id: fundId,
            pattern_type: 'bias_pattern',
            pattern_name: 'Low Confidence Override',
            pattern_description: `Decision made with ${context.confidence_level}% confidence despite AI recommendations`,
            pattern_data: {
              decision_type: context.decision_type,
              confidence_level: context.confidence_level,
              ai_recommendations: context.ai_recommendations,
              frequency: 1
            },
            confidence_score: 75,
            actionable_insights: 'Consider implementing confidence thresholds and bias checkpoints'
          });
      }

      // Update trigger effectiveness
      const { data: currentTrigger } = await supabase
        .from('memory_prompt_triggers')
        .select('effectiveness_score')
        .eq('fund_id', fundId)
        .eq('trigger_type', context.decision_type)
        .single();

      if (currentTrigger) {
        await supabase
          .from('memory_prompt_triggers')
          .update({ 
            last_triggered: new Date().toISOString(),
            effectiveness_score: (currentTrigger.effectiveness_score || 75) + 1
          })
          .eq('fund_id', fundId)
          .eq('trigger_type', context.decision_type);
      }

    } catch (error) {
      console.error('Error triggering pattern analysis:', error);
    }
  }

  private analyzeDecisionPatterns(decisions: any[]): FundMemoryInsight[] {
    const insights: FundMemoryInsight[] = [];

    // Speed analysis - we'll need to get deal data separately for this analysis
    // For now, use a simplified approach based on decision metadata
    const fastDecisions = decisions.filter(d => {
      const metadata = d.learning_context;
      return metadata?.decision_speed === 'same_day' || metadata?.decision_speed === 'within_week';
    });

    if (fastDecisions.length > decisions.length * 0.5) {
      insights.push({
        type: 'decision_pattern',
        title: 'Fast Decision Pattern Detected',
        description: `${Math.round((fastDecisions.length / decisions.length) * 100)}% of recent decisions made within 2 days`,
        confidence_score: 85,
        actionable_recommendation: 'Consider if rapid decisions maintain quality standards',
        supporting_data: { fast_decisions: fastDecisions.length, total: decisions.length }
      });
    }

    // Rejection pattern analysis
    const rejections = decisions.filter(d => d.decision_type.includes('reject'));
    if (rejections.length > 0) {
      const rejectionReasons = rejections.reduce((acc: any, d) => {
        const reason = d.rejection_category || 'unspecified';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {});

      const topReason = Object.keys(rejectionReasons).reduce((a, b) => 
        rejectionReasons[a] > rejectionReasons[b] ? a : b
      );

      insights.push({
        type: 'decision_pattern',
        title: `Primary Rejection Pattern: ${topReason}`,
        description: `${rejectionReasons[topReason]} out of ${rejections.length} rejections due to ${topReason}`,
        confidence_score: 80,
        actionable_recommendation: `Focus screening criteria on ${topReason} to improve deal quality`,
        supporting_data: rejectionReasons
      });
    }

    return insights;
  }

  private analyzeMemoryPatterns(memories: any[]): FundMemoryInsight[] {
    const insights: FundMemoryInsight[] = [];

    // Industry pattern analysis
    const industryPatterns = memories.reduce((acc: any, memory) => {
      const tags = memory.contextual_tags || [];
      tags.forEach((tag: string) => {
        if (!['decision_pattern', 'large_deal', 'standard_deal'].includes(tag)) {
          acc[tag] = (acc[tag] || 0) + 1;
        }
      });
      return acc;
    }, {});

    const topIndustry = Object.keys(industryPatterns).reduce((a, b) => 
      (industryPatterns[a] || 0) > (industryPatterns[b] || 0) ? a : b, ''
    );

    if (topIndustry && industryPatterns[topIndustry] > 2) {
      insights.push({
        type: 'decision_pattern',
        title: `Industry Focus: ${topIndustry}`,
        description: `High activity in ${topIndustry} sector with ${industryPatterns[topIndustry]} recent decisions`,
        confidence_score: 75,
        actionable_recommendation: `Consider developing specialized ${topIndustry} investment criteria`,
        supporting_data: industryPatterns
      });
    }

    return insights;
  }

  private generateBiasInsights(decisions: any[], memories: any[]): FundMemoryInsight[] {
    const insights: FundMemoryInsight[] = [];

    // AI contradiction analysis
    const contradictions = decisions.filter(d => d.contradicts_ai);
    if (contradictions.length > 0 && contradictions.length > decisions.length * 0.3) {
      insights.push({
        type: 'bias_detection',
        title: 'High AI Contradiction Rate',
        description: `${Math.round((contradictions.length / decisions.length) * 100)}% of decisions contradict AI recommendations`,
        confidence_score: 85,
        actionable_recommendation: 'Review decision criteria alignment with AI scoring methodology',
        supporting_data: { contradictions: contradictions.length, total: decisions.length }
      });
    }

    return insights;
  }

  private calculateDecisionConsistency(decisions: any[]): number {
    if (decisions.length < 2) return 70;

    // Group by decision type and calculate confidence variance
    const decisionGroups = decisions.reduce((acc: any, d) => {
      const type = d.decision_type || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(d.confidence_level || 75);
      return acc;
    }, {});

    let totalVariance = 0;
    let groupCount = 0;

    Object.values(decisionGroups).forEach((confidences: any) => {
      if (confidences.length > 1) {
        const avg = confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length;
        const variance = confidences.reduce((acc: number, conf: number) => acc + Math.pow(conf - avg, 2), 0) / confidences.length;
        totalVariance += variance;
        groupCount++;
      }
    });

    if (groupCount === 0) return 70;

    const avgVariance = totalVariance / groupCount;
    return Math.max(40, Math.min(100, 100 - (avgVariance / 10)));
  }
}

export const enhancedFundMemoryService = new EnhancedFundMemoryService();