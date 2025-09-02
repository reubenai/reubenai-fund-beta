import { supabase } from '@/integrations/supabase/client';

export interface VCScoringResult {
  success: boolean;
  deal_id: string;
  overall_score: number;
  scores_analyzed: number;
  total_criteria: number;
  memo_generation: {
    success: boolean;
    sections_generated: number;
    word_count: number;
    error: string | null;
  };
  message: string;
  error?: string;
}

export const triggerVCScoring = async (dealId: string): Promise<VCScoringResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('updated-scoring-engine-vc', {
      body: { deal_id: dealId }
    });

    if (error) {
      throw new Error(error.message || 'Failed to invoke scoring engine');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Scoring engine returned failure');
    }

    return data as VCScoringResult;
  } catch (error) {
    console.error('VC Scoring Service Error:', error);
    throw error;
  }
};

export const validateVCDeal = (deal: { fund_id: string }, fundType?: string): boolean => {
  // Check if it's a VC fund
  return fundType === 'venture_capital' || fundType === 'vc';
};