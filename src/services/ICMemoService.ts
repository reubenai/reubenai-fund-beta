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
  async triggerMemoGeneration(dealId: string, fundId: string) {
    console.log(`🎯 [IC Memo Service] Triggering memo generation for deal: ${dealId}`);
    
    try {
      // Update status to generating
      this.updateStatus(dealId, { dealId, status: 'generating', progress: 0 });

      // Show user notification
      toast.info('IC Memo Generation Started', {
        description: 'Generating investment committee memo in the background...'
      });

      // Call the IC memo drafter edge function
      const { data, error } = await supabase.functions.invoke('ic-memo-drafter', {
        body: {
          dealId,
          fundId,
          forceRefresh: true
        }
      });

      if (error) throw error;

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
        description: 'Failed to generate investment committee memo. Please try again.'
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