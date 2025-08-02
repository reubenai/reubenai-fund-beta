import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface UserActivity {
  event: string;
  timestamp: string;
  path: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export function useActivityTracking() {
  const { user } = useAuth();

  const trackEvent = useCallback((event: string, metadata?: Record<string, any>) => {
    const activity: UserActivity = {
      event,
      timestamp: new Date().toISOString(),
      path: window.location.pathname,
      userId: user?.id,
      metadata
    };

    // Store locally for now - in production this would go to analytics service
    const activities = JSON.parse(localStorage.getItem('user-activities') || '[]');
    activities.push(activity);
    
    // Keep only last 1000 activities
    if (activities.length > 1000) {
      activities.splice(0, activities.length - 1000);
    }
    
    localStorage.setItem('user-activities', JSON.stringify(activities));
    
    // Log for debugging (remove in production)
    console.log('Activity tracked:', activity);
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
