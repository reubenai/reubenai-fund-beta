import { supabase } from '@/integrations/supabase/client';

export interface ICMemo {
  id: string;
  deal_id: string;
  fund_id: string;
  template_id?: string;
  title: string;
  status: string;
  memo_content: any;
  executive_summary?: string;
  investment_recommendation?: string;
  rag_status?: string;
  overall_score?: number;
  created_by: string;
  reviewed_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  approved_at?: string;
}

export interface ICSession {
  id: string;
  fund_id: string;
  name: string;
  session_date: string;
  status: string;
  agenda: any;
  participants: any;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ICVotingDecision {
  id: string;
  memo_id: string;
  session_id?: string;
  title: string;
  description?: string;
  status: string;
  voting_deadline: string;
  final_decision?: string;
  vote_summary: any;
  decision_rationale?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

class ICMemoService {
  // Memo Management
  async generateMemo(dealId: string, templateId?: string): Promise<{ success: boolean; memo?: ICMemo; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-memo-generator', {
        body: { dealId, templateId }
      });

      if (error) throw error;

      return { success: true, memo: data.memo };
    } catch (error) {
      console.error('Error generating memo:', error);
      return { success: false, error: error.message };
    }
  }

  async getMemos(fundId: string): Promise<ICMemo[]> {
    const { data, error } = await supabase
      .from('ic_memos')
      .select(`
        *,
        deals (company_name, deal_size, valuation, rag_status)
      `)
      .eq('fund_id', fundId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memos:', error);
      return [];
    }

    return data || [];
  }

  async getMemo(memoId: string): Promise<ICMemo | null> {
    const { data, error } = await supabase
      .from('ic_memos')
      .select('*')
      .eq('id', memoId)
      .single();

    if (error) {
      console.error('Error fetching memo:', error);
      return null;
    }

    return data;
  }

  async updateMemo(memoId: string, updates: Partial<ICMemo>): Promise<boolean> {
    const { error } = await supabase
      .from('ic_memos')
      .update(updates)
      .eq('id', memoId);

    if (error) {
      console.error('Error updating memo:', error);
      return false;
    }

    return true;
  }

  // Session Management
  async createSession(sessionData: Omit<ICSession, 'id' | 'created_at' | 'updated_at'>): Promise<ICSession | null> {
    const { data, error } = await supabase
      .from('ic_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return data as ICSession;
  }

  async getSessions(fundId: string): Promise<ICSession[]> {
    const { data, error } = await supabase
      .from('ic_sessions')
      .select(`
        *,
        ic_session_deals (
          deals (company_name)
        )
      `)
      .eq('fund_id', fundId)
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return (data || []) as ICSession[];
  }

  async sendInvitations(sessionId: string, emails: string[], message?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-ic-invitation', {
        body: { sessionId, recipientEmails: emails, message }
      });

      if (error) throw error;

      return data.success;
    } catch (error) {
      console.error('Error sending invitations:', error);
      return false;
    }
  }

  // Voting Management
  async createVotingDecision(decisionData: Omit<ICVotingDecision, 'id' | 'created_at' | 'updated_at'>): Promise<ICVotingDecision | null> {
    const { data, error } = await supabase
      .from('ic_voting_decisions')
      .insert(decisionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating voting decision:', error);
      return null;
    }

    return data;
  }

  async getVotingDecisions(fundId: string): Promise<ICVotingDecision[]> {
    const { data, error } = await supabase
      .from('ic_voting_decisions')
      .select(`
        *,
        ic_memos (
          deals (company_name, fund_id)
        )
      `)
      .eq('ic_memos.deals.fund_id', fundId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching voting decisions:', error);
      return [];
    }

    return data || [];
  }

  async submitVote(decisionId: string, vote: 'approve' | 'reject' | 'abstain', reasoning?: string): Promise<boolean> {
    const { error } = await supabase
      .from('ic_memo_votes')
      .upsert({
        decision_id: decisionId,
        voter_id: (await supabase.auth.getUser()).data.user?.id,
        vote,
        reasoning
      });

    if (error) {
      console.error('Error submitting vote:', error);
      return false;
    }

    return true;
  }

  async finalizeDealDecision(decisionId: string, finalDecision: 'approved' | 'rejected' | 'deferred', rationale?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('update-deal-from-decision', {
        body: { decisionId, finalDecision, decisionRationale: rationale }
      });

      if (error) throw error;

      return data.success;
    } catch (error) {
      console.error('Error finalizing deal decision:', error);
      return false;
    }
  }

  // Templates
  async getTemplates(fundId?: string): Promise<any[]> {
    let query = supabase
      .from('ic_memo_templates')
      .select('*')
      .eq('is_active', true);

    if (fundId) {
      query = query.or(`fund_id.eq.${fundId},fund_id.is.null`);
    } else {
      query = query.is('fund_id', null);
    }

    const { data, error } = await query.order('is_default', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return [];
    }

    return data || [];
  }
}

export const icMemoService = new ICMemoService();