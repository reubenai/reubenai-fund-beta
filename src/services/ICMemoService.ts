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
   * Trigger IC memo generation when a deal moves to Investment Committee stage
   */
  async triggerMemoGeneration(dealId: string, fundId: string): Promise<any> {
    console.log(`🚀 [IC Memo Service] Starting memo generation for deal: ${dealId}, fund: ${fundId}`);
    
    // Validate inputs
    if (!dealId || !fundId) {
      const errorMsg = `Invalid inputs: dealId=${dealId}, fundId=${fundId}`;
      console.error(`❌ [IC Memo Service] ${errorMsg}`);
      toast.error('IC Memo Generation Failed', {
        description: 'Invalid deal or fund information provided.'
      });
      throw new Error(errorMsg);
    }
    
    // Update status to generating
    this.updateStatus(dealId, { dealId, status: 'generating', progress: 10 });

    // Show initial notification
    toast.info('IC Memo Generation', {
      description: 'Starting investment committee memo generation...'
    });

    try {
      // Update progress
      this.updateStatus(dealId, { dealId, status: 'generating', progress: 30 });

      console.log(`📡 [IC Memo Service] Calling ic-memo-drafter edge function with dealId: ${dealId}, fundId: ${fundId}`);
      
      // Call the IC memo drafter edge function with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('IC memo generation timeout')), 120000) // 2 minutes
      );
      
      const memoPromise = supabase.functions.invoke('ic-memo-drafter', {
        body: {
          dealId,
          fundId,
          forceRefresh: true
        }
      });

      // Race between timeout and actual function call
      const { data, error } = await Promise.race([memoPromise, timeoutPromise]) as any;

      if (error) {
        console.error(`❌ [IC Memo Service] Edge function returned error:`, error);
        throw error;
      }

      console.log(`📄 [IC Memo Service] Edge function response:`, data);

      // Update status to completed
      this.updateStatus(dealId, { dealId, status: 'completed', progress: 100 });

      // Show success notification
      toast.success('IC Memo Generated', {
        description: 'Investment committee memo has been generated successfully!'
      });

      console.log(`✅ [IC Memo Service] Memo generation completed for deal: ${dealId}`);
      return data;
      
    } catch (error) {
      console.error(`❌ [IC Memo Service] Memo generation failed for deal: ${dealId}`, error);
      
      // Update status to failed
      this.updateStatus(dealId, { 
        dealId, 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      // Show error notification
      toast.error('IC Memo Generation Failed', {
        description: `Failed to generate investment committee memo: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      throw error;
    }
  }

  /**
   * Get all IC sessions for a fund - simplified version
   */
  async getSessions(fundId: string): Promise<any[]> {
    try {
      const response = await supabase
        .from('ic_sessions')
        .select('*')
        .eq('fund_id', fundId)
        .order('session_date', { ascending: false });

      if (response.error) throw response.error;
      
      // Transform database results to match expected interface
      const sessions = (response.data || []).map((session: any) => ({
        ...session,
        title: session.name || 'Untitled Session',
        scheduled_date: session.session_date,
        agenda: typeof session.agenda === 'string' ? session.agenda : JSON.stringify(session.agenda || {}),
        participants: Array.isArray(session.participants) 
          ? (session.participants as any[]).map(p => String(p)) 
          : []
      }));
      
      return sessions;
    } catch (error) {
      console.error('Error fetching IC sessions:', error);
      return [];
    }
  }

  /**
   * Get all voting decisions for a fund - simplified version
   */
  async getVotingDecisions(fundId: string): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('ic_memo_votes') 
        .select('*')
        .eq('fund_id', fundId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform database results to match expected interface
      const decisions = (data || []).map((vote: any) => ({
        ...vote,
        title: vote.decision_id || 'Voting Decision',
        voting_deadline: vote.created_at,
        status: vote.vote || 'pending',
        description: vote.reasoning || ''
      }));
      
      return decisions;
    } catch (error) {
      console.error('Error fetching voting decisions:', error);
      return [];
    }
  }

  /**
   * Create a new IC session - simplified version
   */
  async createSession(sessionData: Record<string, any>): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from('ic_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      
      // Transform result to match expected interface
      if (data) {
        return {
          ...data,
          title: data.name || 'Untitled Session',
          scheduled_date: data.session_date,
          agenda: typeof data.agenda === 'string' ? data.agenda : JSON.stringify(data.agenda || {}),
          participants: Array.isArray(data.participants) 
            ? (data.participants as any[]).map(p => String(p)) 
            : []
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error creating IC session:', error);
      return null;
    }
  }

  /**
   * Create a new voting decision - simplified version
   */
  async createVotingDecision(votingData: Record<string, any>): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from('ic_memo_votes')
        .insert(votingData)
        .select()
        .single();

      if (error) throw error;
      
      // Transform result to match expected interface
      if (data) {
        return {
          ...data,
          title: data.decision_id || 'Voting Decision',
          voting_deadline: data.created_at,
          status: data.vote || 'pending',
          description: data.reasoning || ''
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error creating voting decision:', error);
      return null;
    }
  }

  /**
   * Generate memo for a deal - re-enabled for manual generation
   */
  async generateMemo(dealId: string) {
    console.log(`📝 ICMemoService.generateMemo called for deal: ${dealId}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('ic-memo-drafter', {
        body: { 
          dealId,
          type: 'manual_generation'
        }
      });

      if (error) {
        console.error('❌ Error invoking ic-memo-drafter:', error);
        throw error;
      }

      console.log('✅ ic-memo-drafter response:', data);
      return {
        success: true,
        memo: data,
        message: 'Memo generated successfully'
      };
    } catch (error) {
      console.error('💥 Error in generateMemo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate memo',
        memo: null
      };
    }
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