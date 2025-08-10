import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

type WorkflowState = 'draft' | 'submitted' | 'approved' | 'rejected' | 'scheduled' | 'voting' | 'decided';

interface WorkflowTransition {
  memoId: string;
  toState: WorkflowState;
  reason?: string;
  isOverride?: boolean;
}

interface WorkflowAuditEntry {
  id: string;
  memo_id: string;
  from_state: string | null;
  to_state: string;
  action_by: string;
  action_at: string;
  reason: string | null;
  is_override: boolean;
  metadata: any;
}

export function useICWorkflow() {
  const { toast } = useToast();
  const { isSuperAdmin } = useUserRole();

  const transitionMemoState = useCallback(async (
    transition: WorkflowTransition
  ) => {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error('User not authenticated');

      // Get current memo state
      const { data: memo, error: memoError } = await supabase
        .from('ic_memos')
        .select('workflow_state, title, deal_id')
        .eq('id', transition.memoId)
        .single();

      if (memoError) throw memoError;

      // Prepare update data
      const updateData: any = {
        workflow_state: transition.toState,
        super_admin_override: transition.isOverride || false,
        override_reason: transition.reason
      };

      // Set specific timestamp fields based on transition
      switch (transition.toState) {
        case 'submitted':
          updateData.submitted_at = new Date().toISOString();
          updateData.submitted_by = currentUser.id;
          break;
        case 'approved':
          updateData.approved_at = new Date().toISOString();
          updateData.approved_by = currentUser.id;
          break;
        case 'rejected':
          updateData.rejected_at = new Date().toISOString();
          updateData.rejected_by = currentUser.id;
          updateData.rejection_reason = transition.reason;
          break;
        case 'scheduled':
          updateData.scheduled_at = new Date().toISOString();
          updateData.scheduled_by = currentUser.id;
          break;
      }

      // Update memo (will trigger audit via database trigger)
      const { error: updateError } = await supabase
        .from('ic_memos')
        .update(updateData)
        .eq('id', transition.memoId);

      if (updateError) throw updateError;

      // Show appropriate toast message
      const stateMessages = {
        submitted: 'Memo submitted for review',
        approved: 'Memo approved for scheduling',
        rejected: 'Memo rejected and returned to draft',
        scheduled: 'Memo scheduled for IC meeting',
        voting: 'Voting process started',
        decided: 'Final decision recorded'
      };

      toast({
        title: "Workflow Updated",
        description: stateMessages[transition.toState] || `Memo moved to ${transition.toState}`,
        variant: "default"
      });

      return { success: true };
    } catch (error) {
      console.error('Error transitioning memo state:', error);
      toast({
        title: "Workflow Error",
        description: error.message || "Failed to update memo workflow",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  }, [toast]);

  const submitMemoForReview = useCallback(async (memoId: string) => {
    return transitionMemoState({
      memoId,
      toState: 'submitted',
      reason: 'Analyst submission for review'
    });
  }, [transitionMemoState]);

  const approveMemo = useCallback(async (memoId: string, reason?: string) => {
    return transitionMemoState({
      memoId,
      toState: 'approved',
      reason: reason || 'Fund Manager approval'
    });
  }, [transitionMemoState]);

  const rejectMemo = useCallback(async (memoId: string, reason: string) => {
    return transitionMemoState({
      memoId,
      toState: 'rejected',
      reason
    });
  }, [transitionMemoState]);

  const scheduleForIC = useCallback(async (memoId: string, sessionId?: string) => {
    const result = await transitionMemoState({
      memoId,
      toState: 'scheduled',
      reason: sessionId ? `Scheduled for IC session ${sessionId}` : 'Scheduled for IC review'
    });

    // If successful and sessionId provided, link memo to session
    if (result.success && sessionId) {
      try {
        await supabase
          .from('ic_session_deals')
          .insert({
            session_id: sessionId,
            deal_id: (await supabase.from('ic_memos').select('deal_id').eq('id', memoId).single()).data?.deal_id
          });
      } catch (error) {
        console.warn('Failed to link memo to session:', error);
      }
    }

    return result;
  }, [transitionMemoState]);

  const startVoting = useCallback(async (memoId: string) => {
    return transitionMemoState({
      memoId,
      toState: 'voting',
      reason: 'Voting process initiated'
    });
  }, [transitionMemoState]);

  const recordDecision = useCallback(async (
    memoId: string, 
    decision: 'approved' | 'rejected' | 'deferred',
    rationale?: string
  ) => {
    // First transition to decided state
    const result = await transitionMemoState({
      memoId,
      toState: 'decided',
      reason: `Final decision: ${decision}`
    });

    if (result.success) {
      // Decision details are already recorded in the workflow transition reason
      // No additional fields needed since decision_rationale doesn't exist in the table
      console.log(`Decision recorded: ${decision} - ${rationale}`);
    }

    return result;
  }, [transitionMemoState]);

  const overrideWorkflow = useCallback(async (
    memoId: string,
    toState: WorkflowState,
    reason: string
  ) => {
    if (!isSuperAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only Super Admins can override workflow states",
        variant: "destructive"
      });
      return { success: false, error: 'Insufficient permissions' };
    }

    return transitionMemoState({
      memoId,
      toState,
      reason,
      isOverride: true
    });
  }, [isSuperAdmin, transitionMemoState, toast]);

  const getWorkflowAudit = useCallback(async (memoId: string): Promise<WorkflowAuditEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('ic_memo_workflow_audit')
        .select(`
          *,
          profiles!action_by(first_name, last_name, email)
        `)
        .eq('memo_id', memoId)
        .order('action_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching workflow audit:', error);
      return [];
    }
  }, []);

  const canTransition = useCallback((
    currentState: WorkflowState | null,
    targetState: WorkflowState,
    userRole: string
  ): { allowed: boolean; reason?: string } => {
    // Super admin can always transition
    if (isSuperAdmin) {
      return { allowed: true };
    }

    const state = currentState || 'draft';

    // Define role-based transition permissions
    const rolePermissions = {
      'analyst': {
        'draft': ['submitted'],
        'rejected': ['draft', 'submitted']
      },
      'fund_manager': {
        'submitted': ['approved', 'rejected', 'draft'],
        'approved': ['scheduled', 'rejected']
      },
      'admin': {
        'submitted': ['approved', 'rejected', 'draft'],
        'approved': ['scheduled', 'rejected'],
        'scheduled': ['voting'],
        'voting': ['decided']
      }
    };

    const allowedTransitions = rolePermissions[userRole]?.[state] || [];
    
    if (!allowedTransitions.includes(targetState)) {
      return {
        allowed: false,
        reason: `${userRole} cannot transition from ${state} to ${targetState}`
      };
    }

    return { allowed: true };
  }, [isSuperAdmin]);

  return {
    transitionMemoState,
    submitMemoForReview,
    approveMemo,
    rejectMemo,
    scheduleForIC,
    startVoting,
    recordDecision,
    overrideWorkflow,
    getWorkflowAudit,
    canTransition
  };
}