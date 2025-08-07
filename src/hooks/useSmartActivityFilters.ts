import { useState, useMemo, useCallback } from 'react';
import { ActivityEvent } from '@/services/ActivityService';

export interface SmartFilter {
  id: string;
  name: string;
  description: string;
  filter: (activities: ActivityEvent[]) => ActivityEvent[];
  count?: number;
  isActive: boolean;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: {
    timeRange: string;
    activityTypes: string[];
    priorities: string[];
    search: string;
    relevanceThreshold: number;
  };
  isDefault: boolean;
  createdAt: string;
}

export const useSmartActivityFilters = (activities: ActivityEvent[]) => {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([
    {
      id: 'high-priority',
      name: 'High Priority Only',
      filters: {
        timeRange: '7d',
        activityTypes: [],
        priorities: ['high', 'critical'],
        search: '',
        relevanceThreshold: 70
      },
      isDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'deal-focus',
      name: 'Deal Activities',
      filters: {
        timeRange: '30d',
        activityTypes: ['deal_created', 'deal_updated', 'deal_stage_changed', 'investment_decision'],
        priorities: [],
        search: '',
        relevanceThreshold: 50
      },
      isDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'recent-critical',
      name: 'Recent Critical Events',
      filters: {
        timeRange: '24h',
        activityTypes: [],
        priorities: ['critical'],
        search: '',
        relevanceThreshold: 80
      },
      isDefault: true,
      createdAt: new Date().toISOString()
    }
  ]);

  // Generate smart filter suggestions based on activity patterns
  const smartFilters = useMemo((): SmartFilter[] => {
    const filters: SmartFilter[] = [];

    // High relevance filter
    const highRelevanceActivities = activities.filter(a => {
      // Simple relevance calculation based on priority and type
      const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 };
      const typeScore = a.activity_type.includes('decision') ? 4 : 
                       a.activity_type.includes('deal') ? 3 : 2;
      return (priorityScore[a.priority as keyof typeof priorityScore] || 1) + typeScore >= 5;
    });

    filters.push({
      id: 'high-relevance',
      name: 'High Relevance',
      description: 'Most important activities based on context and priority',
      filter: () => highRelevanceActivities,
      count: highRelevanceActivities.length,
      isActive: activeFilters.has('high-relevance')
    });

    // Recent critical filter
    const recentCritical = activities.filter(a => {
      const isRecent = new Date(a.occurred_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
      const isCritical = ['critical', 'high'].includes(a.priority);
      return isRecent && isCritical;
    });

    if (recentCritical.length > 0) {
      filters.push({
        id: 'recent-critical',
        name: 'Urgent & Recent',
        description: 'Critical activities from the last 24 hours',
        filter: () => recentCritical,
        count: recentCritical.length,
        isActive: activeFilters.has('recent-critical')
      });
    }

    // Deal pipeline activities
    const dealActivities = activities.filter(a => 
      ['deal_created', 'deal_stage_changed', 'investment_decision'].includes(a.activity_type)
    );

    if (dealActivities.length > 0) {
      filters.push({
        id: 'deal-pipeline',
        name: 'Deal Pipeline',
        description: 'Activities related to deal progression',
        filter: () => dealActivities,
        count: dealActivities.length,
        isActive: activeFilters.has('deal-pipeline')
      });
    }

    // Team activities
    const teamActivities = activities.filter(a => 
      a.activity_type.includes('team_member') || a.activity_type.includes('document')
    );

    if (teamActivities.length > 0) {
      filters.push({
        id: 'team-activities',
        name: 'Team & Collaboration',
        description: 'Team member and document activities',
        filter: () => teamActivities,
        count: teamActivities.length,
        isActive: activeFilters.has('team-activities')
      });
    }

    // Pattern-based filter: Unusual activity spikes
    const hourlyActivity = activities.reduce((acc, a) => {
      const hour = new Date(a.occurred_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const avgActivity = Object.values(hourlyActivity).reduce((a, b) => a + b, 0) / 24;
    const spikeActivities = activities.filter(a => {
      const hour = new Date(a.occurred_at).getHours();
      return hourlyActivity[hour] > avgActivity * 1.5;
    });

    if (spikeActivities.length > 0) {
      filters.push({
        id: 'activity-spikes',
        name: 'Activity Spikes',
        description: 'Activities during unusually busy periods',
        filter: () => spikeActivities,
        count: spikeActivities.length,
        isActive: activeFilters.has('activity-spikes')
      });
    }

    return filters;
  }, [activities, activeFilters]);

  // Apply active smart filters
  const filteredActivities = useMemo(() => {
    if (activeFilters.size === 0) return activities;

    const activeSmartFilters = smartFilters.filter(f => activeFilters.has(f.id));
    
    if (activeSmartFilters.length === 0) return activities;

    // Combine all active filters (union of results)
    const combinedResults = new Set<string>();
    activeSmartFilters.forEach(filter => {
      filter.filter(activities).forEach(activity => {
        combinedResults.add(activity.id);
      });
    });

    return activities.filter(activity => combinedResults.has(activity.id));
  }, [activities, smartFilters, activeFilters]);

  const toggleSmartFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filterId)) {
        newFilters.delete(filterId);
      } else {
        newFilters.add(filterId);
      }
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters(new Set());
  }, []);

  const saveCurrentFilter = useCallback((name: string, filterConfig: SavedFilter['filters']) => {
    const newFilter: SavedFilter = {
      id: `custom-${Date.now()}`,
      name,
      filters: filterConfig,
      isDefault: false,
      createdAt: new Date().toISOString()
    };
    setSavedFilters(prev => [...prev, newFilter]);
  }, []);

  const applySavedFilter = useCallback((savedFilter: SavedFilter) => {
    // This would integrate with your existing filter system
    // For now, we'll just return the filter config
    return savedFilter.filters;
  }, []);

  const deleteSavedFilter = useCallback((filterId: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId && f.isDefault));
  }, []);

  // Generate contextual suggestions
  const suggestions = useMemo(() => {
    const suggestions: string[] = [];

    if (activities.length > 50) {
      suggestions.push("High activity detected - consider using 'High Relevance' filter");
    }

    const recentCritical = activities.filter(a => 
      a.priority === 'critical' && 
      new Date(a.occurred_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    if (recentCritical.length > 0) {
      suggestions.push(`${recentCritical.length} critical activities need attention`);
    }

    const dealCount = activities.filter(a => a.activity_type.includes('deal')).length;
    if (dealCount > activities.length * 0.6) {
      suggestions.push("Heavy deal activity - use 'Deal Pipeline' filter to focus");
    }

    return suggestions;
  }, [activities]);

  return {
    smartFilters,
    filteredActivities,
    activeFilters,
    savedFilters,
    suggestions,
    toggleSmartFilter,
    clearAllFilters,
    saveCurrentFilter,
    applySavedFilter,
    deleteSavedFilter
  };
};