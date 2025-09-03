import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ICMemoGenerationStatus {
  dealId: string;
  status: 'generating' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

class ICMemoService {
  private generationStatus = new Map<string, ICMemoGenerationStatus>();
  private statusCallbacks = new Map<string, ((status: ICMemoGenerationStatus) => void)[]>();

  /**
   * Trigger IC memo generation by fetching existing sections from deal_analysisresult_vc
   */
  async triggerMemoGeneration(dealId: string, fundId: string) {
    console.log(`🎯 [IC Memo Service] Fetching IC memo sections for deal: ${dealId}`);
    
    try {
      // Update status to generating
      this.updateStatus(dealId, { dealId, status: 'generating', progress: 0 });

      // Show user notification
      toast.info('Loading IC Memo', {
        description: 'Fetching investment committee memo sections...'
      });

      // Query deal_analysisresult_vc for IC sections
      const { data: analysisResult, error } = await supabase
        .from('deal_analysisresult_vc')
        .select(`
          ic_executive_summary,
          ic_company_overview,
          ic_market_opportunity,
          ic_product_service,
          ic_business_model,
          ic_competitive_landscape,
          ic_financial_analysis,
          ic_management_team,
          ic_risks_mitigants,
          ic_exit_strategy,
          ic_investment_terms,
          ic_investment_recommendation
        `)
        .eq('deal_id', dealId)
        .single();

      if (error) throw error;

      if (!analysisResult) {
        throw new Error('No IC analysis found for this deal');
      }

      // Map database fields to memo sections array (expected format)
      const sections = [
        { title: 'Executive Summary', content: analysisResult.ic_executive_summary || 'No executive summary available' },
        { title: 'Company Overview', content: analysisResult.ic_company_overview || 'No company overview available' },
        { title: 'Market Opportunity', content: analysisResult.ic_market_opportunity || 'No market opportunity analysis available' },
        { title: 'Product/Service Analysis', content: analysisResult.ic_product_service || 'No product/service analysis available' },
        { title: 'Business Model & Strategy', content: analysisResult.ic_business_model || 'No business model analysis available' },
        { title: 'Competitive Landscape', content: analysisResult.ic_competitive_landscape || 'No competitive analysis available' },
        { title: 'Financial Analysis', content: analysisResult.ic_financial_analysis || 'No financial analysis available' },
        { title: 'Management Team', content: analysisResult.ic_management_team || 'No management team analysis available' },
        { title: 'Risk Assessment & Mitigants', content: analysisResult.ic_risks_mitigants || 'No risk analysis available' },
        { title: 'Exit Strategy & Value Realization', content: analysisResult.ic_exit_strategy || 'No exit strategy analysis available' },
        { title: 'Investment Terms & Structure', content: analysisResult.ic_investment_terms || 'No investment terms available' },
        { title: 'Investment Recommendation', content: analysisResult.ic_investment_recommendation || 'No investment recommendation available' }
      ];

      // Update status to completed
      this.updateStatus(dealId, { dealId, status: 'completed', progress: 100 });

      // Show success notification
      toast.success('IC Memo Loaded', {
        description: 'Investment committee memo sections have been loaded successfully!'
      });

      console.log(`✅ [IC Memo Service] Memo sections loaded for deal: ${dealId}`);
      
      // Return data in expected format with sections array
      return {
        success: true,
        message: 'IC memo sections loaded successfully',
        memo: { sections }
      };
      
    } catch (error) {
      console.error(`❌ [IC Memo Service] Failed to load memo sections for deal: ${dealId}`, error);
      
      // Update status to failed
      this.updateStatus(dealId, { 
        dealId, 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      // Show error notification
      toast.error('IC Memo Load Failed', {
        description: 'Failed to load investment committee memo sections. Please try again.'
      });

      throw error;
    }
  }

  /**
   * Get all IC sessions for a fund - simplified version
   */
  async getSessions(fundId: string) {
    try {
      const { data, error } = await supabase
        .from('ic_sessions')
        .select('*')
        .eq('fund_id', fundId)
        .order('session_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching IC sessions:', error);
      return [];
    }
  }

  /**
   * Get all voting decisions for a fund - simplified version
   */
  async getVotingDecisions(fundId: string): Promise<any[]> {
    // Simplified to avoid TypeScript recursion issues
    console.log('getVotingDecisions called for fund:', fundId);
    return [];
  }

  /**
   * Create a new IC session - simplified version
   */
  async createSession(sessionData: any) {
    try {
      const { data, error } = await supabase
        .from('ic_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating IC session:', error);
      return null;
    }
  }

  /**
   * Create a new voting decision - simplified version
   */
  async createVotingDecision(votingData: any) {
    try {
      const { data, error } = await supabase
        .from('ic_memo_votes')
        .insert(votingData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating voting decision:', error);
      return null;
    }
  }

  /**
   * Generate memo for a deal - returns expected structure for compatibility
   */
  async generateMemo(dealId: string) {
    console.log(`📝 [Legacy] generateMemo called for deal: ${dealId}`);
    
    // Return expected structure for backward compatibility
    return {
      success: false,
      message: 'Memo generation is now triggered automatically when deals move to Investment Committee stage',
      memo: null,
      error: 'Auto-generation disabled - move deal to Investment Committee stage instead'
    };
  }

  /**
   * Check if a memo already exists for this deal
   */
  async hasMemo(dealId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('ic_memos')
        .select('id')
        .eq('deal_id', dealId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking memo existence:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking memo existence:', error);
      return false;
    }
  }

  /**
   * Get memo generation status for a deal
   */
  getGenerationStatus(dealId: string): ICMemoGenerationStatus | null {
    return this.generationStatus.get(dealId) || null;
  }

  /**
   * Subscribe to memo generation status updates
   */
  onStatusChange(dealId: string, callback: (status: ICMemoGenerationStatus) => void) {
    if (!this.statusCallbacks.has(dealId)) {
      this.statusCallbacks.set(dealId, []);
    }
    this.statusCallbacks.get(dealId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.statusCallbacks.get(dealId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private updateStatus(dealId: string, status: ICMemoGenerationStatus) {
    this.generationStatus.set(dealId, status);
    
    // Notify subscribers
    const callbacks = this.statusCallbacks.get(dealId) || [];
    callbacks.forEach(callback => callback(status));
  }

  /**
   * Clear generation status for a deal
   */
  clearStatus(dealId: string) {
    this.generationStatus.delete(dealId);
    this.statusCallbacks.delete(dealId);
  }
}

export const icMemoService = new ICMemoService();