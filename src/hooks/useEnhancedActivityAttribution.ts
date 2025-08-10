import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

interface ActivityCreationData {
  fund_id: string;
  activity_type: string;
  title: string;
  deal_id?: string;
  description?: string;
  context_data?: Record<string, any>;
}

export function useEnhancedActivityAttribution() {
  const { user } = useAuth();
  const { role, organizationId, isSuperAdmin } = useUserRole();

  const createActivityWithContext = useCallback(async (activityData: ActivityCreationData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Enhanced context with role and organization information
    const enhancedContextData = {
      ...activityData.context_data,
      user_role: role,
      organization_id: organizationId,
      is_super_admin: isSuperAdmin,
      user_email: user.email,
      attribution_source: 'enhanced_activity_attribution',
      created_at: new Date().toISOString()
    };

    try {
      // Use the new database function for context-aware activity creation
      const { data, error } = await supabase.rpc('create_activity_with_context', {
        p_fund_id: activityData.fund_id,
        p_activity_type: activityData.activity_type,
        p_title: activityData.title,
        p_deal_id: activityData.deal_id || null,
        p_description: activityData.description || null,
        p_context_data: enhancedContextData
      });

      if (error) {
        console.error('Failed to create activity with context:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Activity creation error:', err);
      throw err;
    }
  }, [user, role, organizationId, isSuperAdmin]);

  const createICMemoActivity = useCallback(async (
    fundId: string, 
    dealId: string, 
    memoId: string,
    action: 'created' | 'updated' | 'published'
  ) => {
    return createActivityWithContext({
      fund_id: fundId,
      deal_id: dealId,
      activity_type: 'ic_memo_activity',
      title: `IC Memo ${action}`,
      description: `IC memo was ${action} for this deal`,
      context_data: {
        memo_id: memoId,
        memo_action: action,
        generated_by: 'ic_memo_system'
      }
    });
  }, [createActivityWithContext]);

  const createDocumentActivity = useCallback(async (
    fundId: string,
    dealId: string,
    documentId: string,
    documentName: string,
    action: 'uploaded' | 'analyzed' | 'updated'
  ) => {
    return createActivityWithContext({
      fund_id: fundId,
      deal_id: dealId,
      activity_type: 'document_activity',
      title: `Document ${action}`,
      description: `Document "${documentName}" was ${action}`,
      context_data: {
        document_id: documentId,
        document_name: documentName,
        document_action: action,
        triggers_reanalysis: action === 'uploaded'
      }
    });
  }, [createActivityWithContext]);

  const createNoteActivity = useCallback(async (
    fundId: string,
    dealId: string,
    noteId: string,
    action: 'created' | 'updated' | 'deleted'
  ) => {
    return createActivityWithContext({
      fund_id: fundId,
      deal_id: dealId,
      activity_type: 'note_activity',
      title: `Note ${action}`,
      description: `A note was ${action} for this deal`,
      context_data: {
        note_id: noteId,
        note_action: action
      }
    });
  }, [createActivityWithContext]);

  const createFundMemoryActivity = useCallback(async (
    fundId: string,
    memoryType: string,
    action: 'created' | 'updated' | 'triggered',
    dealId?: string
  ) => {
    return createActivityWithContext({
      fund_id: fundId,
      deal_id: dealId,
      activity_type: 'fund_memory_activity',
      title: `Fund Memory ${action}`,
      description: `${memoryType} memory was ${action}`,
      context_data: {
        memory_type: memoryType,
        memory_action: action,
        fund_memory_source: 'enhanced_attribution'
      }
    });
  }, [createActivityWithContext]);

  return {
    createActivityWithContext,
    createICMemoActivity,
    createDocumentActivity,
    createNoteActivity,
    createFundMemoryActivity
  };
}