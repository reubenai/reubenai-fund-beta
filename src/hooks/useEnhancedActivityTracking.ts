import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useFund } from '@/contexts/FundContext';

interface UserActivity {
  event: string;
  timestamp: string;
  path: string;
  userId?: string;
  fundId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

interface BusinessEvent {
  eventType: 'investment_decision' | 'meeting_scheduled' | 'criteria_updated' | 'deal_analysis_completed';
  entityId: string;
  entityType: string;
  outcome?: string;
  confidence?: number;
  metadata: Record<string, any>;
}

export function useEnhancedActivityTracking() {
  const { user } = useAuth();
  const { profile, isSuperAdmin } = useUserRole();
  const { selectedFund, funds } = useFund();

  const trackBusinessEvent = useCallback(async (event: BusinessEvent) => {
    if (!user) return;

    try {
      // Determine the fund context
      const fundContext = selectedFund?.id || (funds?.[0]?.id);
      if (!fundContext) return;

      // Create activity event
      const { data: activityData, error: activityError } = await supabase
        .from('activity_events')
        .insert({
          fund_id: fundContext,
          user_id: user.id,
          activity_type: event.eventType,
          title: generateBusinessEventTitle(event),
          description: generateBusinessEventDescription(event),
          resource_type: event.entityType,
          resource_id: event.entityId,
          context_data: {
            ...event.metadata,
            outcome: event.outcome,
            confidence: event.confidence,
            business_event: true
          },
          priority: determineEventPriority(event.eventType),
          tags: [event.eventType, event.entityType, ...(event.outcome ? [event.outcome] : [])]
        });

      if (activityError) {
        console.warn('Failed to track business event:', activityError);
        return;
      }

      // Trigger Fund Memory Learning if it's a decision event
      if (['investment_decision', 'meeting_scheduled'].includes(event.eventType) && event.outcome) {
        await triggerFundMemoryCapture(fundContext, event);
      }

    } catch (error) {
      console.warn('Failed to track business event:', error);
    }
  }, [user, selectedFund, funds]);

  const trackCrossOrganizationActivity = useCallback(async (
    event: string, 
    metadata?: Record<string, any>
  ) => {
    if (!user || !isSuperAdmin) return;

    try {
      // For super admins, track activities across all accessible funds
      const accessibleFunds = funds || [];
      
      // Create a system-level activity that spans organizations
      for (const fund of accessibleFunds.slice(0, 5)) { // Limit to avoid spam
        await supabase
          .from('activity_events')
          .insert({
            fund_id: fund.id,
            user_id: user.id,
            activity_type: 'system_event',
            title: `Cross-platform action: ${event}`,
            description: `Super admin performed ${event} across platform`,
            context_data: {
              ...metadata,
              cross_organization: true,
              platform_level: true,
              organization_id: fund.organization_id
            },
            priority: 'low',
            tags: ['system', 'cross_org', event],
            is_system_event: true
          });
      }
    } catch (error) {
      console.warn('Failed to track cross-organization activity:', error);
    }
  }, [user, isSuperAdmin, funds]);

  const trackUserActivity = useCallback(async (
    event: string, 
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    const activity: UserActivity = {
      event,
      timestamp: new Date().toISOString(),
      path: window.location.pathname,
      userId: user.id,
      fundId: selectedFund?.id,
      organizationId: profile?.organization_id || undefined,
      metadata
    };

    try {
      // If super admin and tracking platform-wide events
      if (isSuperAdmin && event.includes('admin_')) {
        await trackCrossOrganizationActivity(event, metadata);
      }

      // Regular fund-specific activity tracking
      if (selectedFund?.id) {
        const { activityService } = await import('@/services/ActivityService');
        
        await activityService.createActivity({
          fund_id: selectedFund.id,
          activity_type: mapEventToActivityType(event),
          title: `User ${event}`,
          description: `User performed ${event} on ${activity.path}`,
          context_data: {
            event,
            path: activity.path,
            user_email: user.email,
            is_super_admin: isSuperAdmin,
            organization_id: profile?.organization_id,
            ...metadata
          },
          priority: determineActivityPriority(event),
          tags: [event, 'user_tracking', ...(isSuperAdmin ? ['super_admin'] : [])]
        });
      }
    } catch (error) {
      console.warn('Failed to track activity in database:', error);
    }

    // Also store locally as backup
    const activities = JSON.parse(localStorage.getItem('user-activities') || '[]');
    activities.push(activity);
    
    // Keep only last 1000 activities
    if (activities.length > 1000) {
      activities.splice(0, activities.length - 1000);
    }
    
    localStorage.setItem('user-activities', JSON.stringify(activities));
  }, [user, selectedFund, profile, isSuperAdmin, trackCrossOrganizationActivity]);

  const triggerFundMemoryCapture = useCallback(async (
    fundId: string, 
    event: BusinessEvent
  ) => {
    try {
      // Call the enhanced fund memory engine
      const { data, error } = await supabase.functions.invoke('enhanced-fund-memory-engine', {
        body: {
          action: 'decisionLearningCapture',
          fundId,
          dealId: event.entityType === 'deal' ? event.entityId : undefined,
          sessionId: event.entityType === 'ic_session' ? event.entityId : undefined,
          decisionData: {
            decision_type: event.eventType,
            decision_outcome: event.outcome,
            confidence_level: event.confidence,
            context_data: event.metadata,
            ai_recommendations: event.metadata.ai_recommendations || {},
            supporting_evidence: event.metadata.supporting_evidence || {}
          }
        }
      });

      if (error) {
        console.warn('Failed to trigger fund memory capture:', error);
      } else {
        console.log('Fund memory capture triggered successfully:', data);
      }
    } catch (error) {
      console.warn('Error triggering fund memory capture:', error);
    }
  }, []);

  // Track page views with enhanced context
  useEffect(() => {
    trackUserActivity('page_view', {
      title: document.title,
      referrer: document.referrer,
      fund_context: selectedFund?.name,
      user_role: profile?.role
    });
  }, [trackUserActivity, selectedFund, profile]);

  // Track user interactions with business context
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        const isBusinessAction = target.closest('[data-business-action]');
        const businessActionType = isBusinessAction?.getAttribute('data-business-action');
        
        trackUserActivity('click', {
          element: target.tagName,
          text: target.textContent?.slice(0, 50),
          className: target.className,
          is_business_action: !!isBusinessAction,
          business_action_type: businessActionType,
          fund_context: selectedFund?.name
        });
      }
    };

    const handleFormSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      const isBusinessForm = form.closest('[data-business-form]');
      const businessFormType = isBusinessForm?.getAttribute('data-business-form');
      
      trackUserActivity('form_submit', {
        formId: form.id,
        formName: form.name,
        action: form.action,
        is_business_form: !!isBusinessForm,
        business_form_type: businessFormType,
        fund_context: selectedFund?.name
      });
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleFormSubmit);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleFormSubmit);
    };
  }, [trackUserActivity, selectedFund]);

  // Track session duration with fund context
  useEffect(() => {
    const sessionStart = Date.now();
    
    const trackSessionEnd = () => {
      const duration = Date.now() - sessionStart;
      trackUserActivity('session_end', { 
        duration,
        fund_context: selectedFund?.name,
        user_role: profile?.role
      });
    };

    window.addEventListener('beforeunload', trackSessionEnd);
    
    return () => {
      window.removeEventListener('beforeunload', trackSessionEnd);
      trackSessionEnd();
    };
  }, [trackUserActivity, selectedFund, profile]);

  return {
    trackUserActivity,
    trackBusinessEvent,
    trackCrossOrganizationActivity,
    
    // Enhanced business event tracking methods
    logDealDecision: (dealId: string, decision: string, confidence: number, metadata: Record<string, any>) =>
      trackBusinessEvent({
        eventType: 'investment_decision',
        entityId: dealId,
        entityType: 'deal',
        outcome: decision,
        confidence,
        metadata
      }),
    
    logICSession: (sessionId: string, outcome: string, metadata: Record<string, any>) =>
      trackBusinessEvent({
        eventType: 'meeting_scheduled',
        entityId: sessionId,
        entityType: 'ic_session',
        outcome,
        metadata
      }),
    
    logMemoGeneration: (memoId: string, dealId: string, metadata: Record<string, any>) =>
      trackUserActivity('memo_generation', { memoId, dealId, ...metadata }),
    
    logStrategyUpdate: (strategyId: string, changes: Record<string, any>) =>
      trackBusinessEvent({
        eventType: 'criteria_updated',
        entityId: strategyId,
        entityType: 'strategy',
        metadata: { changes }
      }),
    
    logAnalysisCompletion: (analysisId: string, dealId: string, score: number, metadata: Record<string, any>) =>
      trackBusinessEvent({
        eventType: 'deal_analysis_completed',
        entityId: analysisId,
        entityType: 'analysis',
        confidence: score,
        metadata: { ...metadata, deal_id: dealId }
      }),

    // Legacy methods for backward compatibility
    logActivity: (activity: any) => trackUserActivity('activity', typeof activity === 'string' ? { description: activity } : activity),
    logDocumentUploaded: (...args: any[]) => {
      const [dealId, fileName, documentType, sizeOrMetadata] = args;
      trackUserActivity('document_uploaded', { dealId, fileName, documentType, sizeOrMetadata });
    },
    logDealStageChanged: (...args: any[]) => {
      const [dealId, oldStage, newStage, metadataOrName] = args;
      trackUserActivity('deal_stage_changed', { dealId, oldStage, newStage, metadataOrName });
    },
    logDealCreated: (...args: any[]) => {
      const [dealId, companyName, stageOrMetadata] = args;
      trackUserActivity('deal_created', { dealId, companyName, stageOrMetadata });
    }
  };
}

// Helper functions
function generateBusinessEventTitle(event: BusinessEvent): string {
  const titleMap: Record<string, string> = {
    investment_decision: `Investment Decision Made`,
    meeting_scheduled: `IC Session Completed`,
    criteria_updated: `Investment Strategy Updated`,
    deal_analysis_completed: `Deal Analysis Completed`
  };
  return titleMap[event.eventType] || event.eventType;
}

function generateBusinessEventDescription(event: BusinessEvent): string {
  const descMap: Record<string, string> = {
    investment_decision: `Investment decision made with outcome: ${event.outcome}`,
    meeting_scheduled: `Investment committee session completed`,
    criteria_updated: `Investment strategy criteria updated`,
    deal_analysis_completed: `Comprehensive deal analysis completed`
  };
  return descMap[event.eventType] || `Business event: ${event.eventType}`;
}

function determineEventPriority(eventType: string): 'low' | 'medium' | 'high' | 'critical' {
  const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    investment_decision: 'high',
    meeting_scheduled: 'high',
    criteria_updated: 'high',
    deal_analysis_completed: 'medium'
  };
  return priorityMap[eventType] || 'medium';
}

function mapEventToActivityType(event: string): 'deal_created' | 'deal_updated' | 'deal_stage_changed' | 'deal_deleted' | 'deal_note_added' | 'deal_analysis_started' | 'deal_analysis_completed' | 'document_uploaded' | 'pitch_deck_uploaded' | 'fund_created' | 'fund_updated' | 'criteria_updated' | 'team_member_invited' | 'team_member_joined' | 'meeting_scheduled' | 'investment_decision' | 'system_event' {
  const eventMap: Record<string, 'deal_created' | 'deal_updated' | 'deal_stage_changed' | 'deal_deleted' | 'deal_note_added' | 'deal_analysis_started' | 'deal_analysis_completed' | 'document_uploaded' | 'pitch_deck_uploaded' | 'fund_created' | 'fund_updated' | 'criteria_updated' | 'team_member_invited' | 'team_member_joined' | 'meeting_scheduled' | 'investment_decision' | 'system_event'> = {
    page_view: 'system_event',
    click: 'system_event',
    form_submit: 'system_event',
    session_end: 'system_event',
    deal_created: 'deal_created',
    deal_updated: 'deal_updated',
    deal_stage_changed: 'deal_stage_changed',
    document_uploaded: 'document_uploaded',
    admin_user_invite: 'team_member_invited',
    admin_fund_create: 'fund_created',
    memo_generation: 'system_event'
  };
  return eventMap[event] || 'system_event';
}

function determineActivityPriority(event: string): 'low' | 'medium' | 'high' | 'critical' {
  if (event.includes('admin_') || event.includes('decision')) return 'high';
  if (event.includes('create') || event.includes('delete')) return 'medium';
  return 'low';
}
