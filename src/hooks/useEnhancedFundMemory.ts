import { useState, useEffect } from 'react';
import { enhancedFundMemoryService, DecisionContext, FundMemoryInsight, DecisionAnalytics } from '@/services/EnhancedFundMemoryService';
import { useToast } from '@/hooks/use-toast';

export const useEnhancedFundMemory = (fundId?: string) => {
  const [insights, setInsights] = useState<FundMemoryInsight[]>([]);
  const [analytics, setAnalytics] = useState<DecisionAnalytics | null>(null);
  const [contextualPrompts, setContextualPrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Capture a decision context and trigger learning
   */
  const captureDecisionContext = async (context: DecisionContext) => {
    if (!fundId) return;

    try {
      setIsLoading(true);
      await enhancedFundMemoryService.captureDecisionContext(fundId, context);
      
      toast({
        title: "Decision Captured",
        description: "Decision context captured for learning and pattern analysis",
      });

      // Refresh insights after capturing
      await refreshInsights();
    } catch (error) {
      console.error('Error capturing decision context:', error);
      toast({
        title: "Error",
        description: "Failed to capture decision context",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate and refresh immediate insights
   */
  const refreshInsights = async (timeframeHours: number = 168) => {
    if (!fundId) return;

    try {
      setIsLoading(true);
      const newInsights = await enhancedFundMemoryService.generateImmediateInsights(fundId, timeframeHours);
      setInsights(newInsights);
    } catch (error) {
      console.error('Error refreshing insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load decision analytics
   */
  const loadAnalytics = async (timeframeDays: number = 30) => {
    if (!fundId) return;

    try {
      setIsLoading(true);
      const newAnalytics = await enhancedFundMemoryService.getDecisionAnalytics(fundId, timeframeDays);
      setAnalytics(newAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get contextual prompts for a deal
   */
  const getContextualPrompts = async (dealContext?: any) => {
    if (!fundId) return;

    try {
      const prompts = await enhancedFundMemoryService.getContextualPrompts(fundId, dealContext);
      setContextualPrompts(prompts);
      return prompts;
    } catch (error) {
      console.error('Error getting contextual prompts:', error);
      return [];
    }
  };

  /**
   * Auto-load insights and analytics when fundId changes
   */
  useEffect(() => {
    if (fundId) {
      refreshInsights();
      loadAnalytics();
    }
  }, [fundId]);

  return {
    insights,
    analytics,
    contextualPrompts,
    isLoading,
    captureDecisionContext,
    refreshInsights,
    loadAnalytics,
    getContextualPrompts,
  };
};