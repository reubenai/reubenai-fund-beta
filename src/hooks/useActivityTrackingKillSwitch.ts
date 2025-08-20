import { useState } from 'react';

interface ActivityKillSwitchConfig {
  disabledEvents: string[];
  disabledRoutes: { [event: string]: string[] };
}

export function useActivityTrackingKillSwitch() {
  const [config] = useState<ActivityKillSwitchConfig>({
    // Completely disable these event types
    disabledEvents: ['session_end'],
    
    // Disable specific events on specific routes
    disabledRoutes: {
      'page_view': ['/', '/pipeline']
    }
  });

  const shouldSkipEvent = (eventType: string, currentPath?: string): boolean => {
    // Check if event type is completely disabled
    if (config.disabledEvents.includes(eventType)) {
      return true;
    }

    // Check if event is disabled for current route
    const disabledRoutes = config.disabledRoutes[eventType];
    if (disabledRoutes && currentPath && disabledRoutes.includes(currentPath)) {
      return true;
    }

    return false;
  };

  return {
    shouldSkipEvent,
    disabledEvents: config.disabledEvents,
    disabledRoutes: config.disabledRoutes
  };
}