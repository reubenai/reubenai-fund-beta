import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { captureEvent } from '@/lib/analytics/posthog';
import { useFund } from '@/contexts/FundContext';

interface UserActivity {
  event: string;
  timestamp: string;
  path: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export function useActivityTracking() {
  const { user } = useAuth();

  const trackEvent = useCallback(async (event: string, metadata?: Record<string, any>) => {
    const activity: UserActivity = {
      event,
      timestamp: new Date().toISOString(),
      path: window.location.pathname,
      userId: user?.id,
      metadata
    };

    // Mirror to PostHog (avoid double page_view capture; handled by router tracker)
    if (event !== 'page_view') {
      captureEvent(event, {
        path: activity.path,
        userId: activity.userId,
        ...metadata
      });
    }

    try {
      // Store in database via activity service
      const { activityService } = await import('@/services/ActivityService');
      
      // Get current fund
      const { data: currentFund } = await supabase
        .from('funds')
        .select('id')
        .limit(1)
        .single();

      if (currentFund) {
        await activityService.createActivity({
          fund_id: currentFund.id,
          activity_type: event === 'page_view' ? 'system_event' : 'deal_updated',
          title: `User ${event}`,
          description: `User performed ${event} on ${activity.path}`,
          context_data: {
            event,
            path: activity.path,
            ...metadata
          },
          priority: 'low',
          tags: [event, 'user_tracking']
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
  }, [user?.id]);

  // Track page views
  useEffect(() => {
    trackEvent('page_view', {
      title: document.title,
      referrer: document.referrer
    });
  }, [trackEvent]);

  // Track user interactions
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        trackEvent('click', {
          element: target.tagName,
          text: target.textContent?.slice(0, 50),
          className: target.className
        });
      }
    };

    const handleFormSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      trackEvent('form_submit', {
        formId: form.id,
        formName: form.name,
        action: form.action
      });
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleFormSubmit);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleFormSubmit);
    };
  }, [trackEvent]);

  // Track session duration
  useEffect(() => {
    const sessionStart = Date.now();
    
    const trackSessionEnd = () => {
      const duration = Date.now() - sessionStart;
      trackEvent('session_end', { duration });
    };

    window.addEventListener('beforeunload', trackSessionEnd);
    
    return () => {
      window.removeEventListener('beforeunload', trackSessionEnd);
      trackSessionEnd();
    };
  }, [trackEvent]);

  return {
    trackEvent,
    // Legacy methods for backward compatibility
    logActivity: (activity: any) => trackEvent('activity', typeof activity === 'string' ? { description: activity } : activity),
    logDocumentUploaded: (...args: any[]) => {
      const [dealId, fileName, documentType, sizeOrMetadata] = args;
      trackEvent('document_uploaded', { dealId, fileName, documentType, sizeOrMetadata });
    },
    logDealStageChanged: (...args: any[]) => {
      const [dealId, oldStage, newStage, metadataOrName] = args;
      trackEvent('deal_stage_changed', { dealId, oldStage, newStage, metadataOrName });
    },
    logDealCreated: (...args: any[]) => {
      const [dealId, companyName, stageOrMetadata] = args;
      trackEvent('deal_created', { dealId, companyName, stageOrMetadata });
    }
  };
}
