import { supabase } from '@/integrations/supabase/client';

export interface ICDatapointSourcingResult {
  success: boolean;
  deal_id: string;
  sections_generated: number;
  memo_generation: {
    success: boolean;
    sections_generated: number;
    word_count: number;
    error: string | null;
    ai_powered?: boolean;
    model_used?: string;
  };
  message: string;
  error?: string;
}

export const triggerICDatapointSourcing = async (dealId: string): Promise<ICDatapointSourcingResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('ic-datapoint-sourcing', {
      body: { 
        deal_id: dealId,
        manual_trigger: true
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to invoke IC datapoint sourcing');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'IC datapoint sourcing returned failure');
    }

    return data as ICDatapointSourcingResult;
  } catch (error) {
    console.error('IC Datapoint Sourcing Service Error:', error);
    throw error;
  }
};

export const validateICDeal = (deal: { fund_id: string }, fundType?: string): boolean => {
  // IC analysis can work for any fund type, but deal must exist
  return !!deal.fund_id;
};