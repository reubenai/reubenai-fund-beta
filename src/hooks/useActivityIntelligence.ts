import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFund } from '@/contexts/FundContext';
import { useUserRole } from '@/hooks/useUserRole';
import { ActivityEvent } from '@/services/ActivityService';

interface ActivityInsight {
  type: 'trend' | 'pattern' | 'alert' | 'summary';
  title: string;
  description: string;
  value: number | string;
  change?: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  context?: Record<string, any>;
}

interface ActivityTrend {
  period: string;
  count: number;
  types: Record<string, number>;
  priorities: Record<string, number>;
}

export const useActivityIntelligence = (timeRange: string = '7d') => {
  const { selectedFund, funds } = useFund();
  const { isSuperAdmin, profile } = useUserRole();
  const [insights, setInsights] = useState<ActivityInsight[]>([]);
  const [trends, setTrends] = useState<ActivityTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate relevance score for activities
  const calculateRelevanceScore = (activity: ActivityEvent): number => {
    let score = 50; // Base score

    // Priority scoring
    const priorityScores = { critical: 40, high: 25, medium: 10, low: 5 };
    score += priorityScores[activity.priority as keyof typeof priorityScores] || 0;

    // Activity type scoring
    const typeScores = {
      investment_decision: 30,
      deal_created: 25,
      deal_stage_changed: 20,
      fund_created: 20,
      criteria_updated: 15,
      document_uploaded: 10,
      deal_note_added: 5
    };
    score += typeScores[activity.activity_type as keyof typeof typeScores] || 10;

    // Recency scoring (more recent = higher score)
    const hours = (Date.now() - new Date(activity.occurred_at).getTime()) / (1000 * 60 * 60);
    if (hours < 1) score += 20;
    else if (hours < 24) score += 15;
    else if (hours < 168) score += 10; // 1 week
    else score += 5;

    // Context data richness
    if (activity.context_data && Object.keys(activity.context_data).length > 3) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  };

  const fetchActivityIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);

      // Define time range
      const hours = {
        '1h': 1,
        '24h': 24,
        '7d': 168,
        '30d': 720
      }[timeRange] || 168;

      const threshold = new Date();
      threshold.setHours(threshold.getHours() - hours);

      // Build query
      let query = supabase
        .from('activity_events')
        .select(`
          *,
          fund:funds(name, organization_id),
          user:profiles(email, first_name, last_name, role)
        `)
        .eq('is_visible', true)
        .gte('occurred_at', threshold.toISOString())
        .order('occurred_at', { ascending: false });

      // Apply fund filtering
      if (!isSuperAdmin && selectedFund?.id) {
        query = query.eq('fund_id', selectedFund.id);
      } else if (!isSuperAdmin && profile?.organization_id) {
        const orgFunds = funds?.map(f => f.id) || [];
        if (orgFunds.length > 0) {
          query = query.in('fund_id', orgFunds);
        }
      }

      const { data: activities, error } = await query;
      if (error) throw error;

      // Generate insights and trends
      const activityInsights = generateInsights(activities || [], timeRange);
      const activityTrends = generateTrends(activities || [], timeRange);

      setInsights(activityInsights);
      setTrends(activityTrends);
    } catch (err) {
      console.error('Error fetching activity intelligence:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activity intelligence');
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (activities: any[], timeRange: string): ActivityInsight[] => {
    const insights: ActivityInsight[] = [];
    const now = new Date();

    // Activity volume insight
    const totalActivities = activities.length;
    const highPriorityCount = activities.filter(a => ['high', 'critical'].includes(a.priority)).length;
    
    insights.push({
      type: 'summary',
      title: 'Activity Volume',
      description: `${totalActivities} activities in the last ${timeRange.replace('d', ' days').replace('h', ' hours')}`,
      value: totalActivities,
      urgency: totalActivities > 50 ? 'high' : totalActivities > 20 ? 'medium' : 'low',
      timeframe: timeRange,
      context: { high_priority_count: highPriorityCount }
    });

    // Deal activity pattern
    const dealActivities = activities.filter(a => a.activity_type.startsWith('deal_'));
    if (dealActivities.length > 0) {
      const uniqueDeals = new Set(dealActivities.map(a => a.deal_id).filter(Boolean));
      insights.push({
        type: 'pattern',
        title: 'Deal Activity',
        description: `${dealActivities.length} deal-related activities across ${uniqueDeals.size} deals`,
        value: `${uniqueDeals.size} deals`,
        urgency: dealActivities.length > 10 ? 'medium' : 'low',
        timeframe: timeRange
      });
    }

    // Investment decision alerts
    const decisions = activities.filter(a => a.activity_type === 'investment_decision');
    if (decisions.length > 0) {
      insights.push({
        type: 'alert',
        title: 'Investment Decisions',
        description: `${decisions.length} investment decisions made`,
        value: decisions.length,
        urgency: 'high',
        timeframe: timeRange
      });
    }

    // Fund activity distribution
    const fundActivity = activities.reduce((acc, a) => {
      const fundName = a.fund?.name || 'Unknown';
      acc[fundName] = (acc[fundName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(fundActivity).length > 1) {
      const mostActiveFund = Object.entries(fundActivity).sort(([,a], [,b]) => (b as number) - (a as number))[0];
      insights.push({
        type: 'trend',
        title: 'Most Active Fund',
        description: `${mostActiveFund[0]} leads with ${mostActiveFund[1]} activities`,
        value: mostActiveFund[0],
        urgency: 'medium',
        timeframe: timeRange,
        context: fundActivity
      });
    }

    return insights;
  };

  const generateTrends = (activities: any[], timeRange: string): ActivityTrend[] => {
    // Group activities by time periods
    const periods = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const periodHours = timeRange === '24h' ? 1 : 24;
    
    const trends: ActivityTrend[] = [];
    const numPeriods = typeof periods === 'number' ? periods : 7;
    const hoursPerPeriod = typeof periodHours === 'number' ? periodHours : 24;
    
    for (let i = 0; i < numPeriods; i++) {
      const start = new Date();
      start.setHours(start.getHours() - (i + 1) * hoursPerPeriod);
      const end = new Date();
      end.setHours(end.getHours() - i * hoursPerPeriod);
      
      const periodActivities = activities.filter(a => {
        const activityTime = new Date(a.occurred_at);
        return activityTime >= start && activityTime < end;
      });
      
      const types = periodActivities.reduce((acc, a) => {
        acc[a.activity_type] = (acc[a.activity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const priorities = periodActivities.reduce((acc, a) => {
        acc[a.priority] = (acc[a.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      trends.unshift({
        period: timeRange === '24h' ? 
          `${start.getHours()}:00` : 
          start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: periodActivities.length,
        types,
        priorities
      });
    }
    
    return trends;
  };

  useEffect(() => {
    fetchActivityIntelligence();
  }, [selectedFund?.id, timeRange, isSuperAdmin]);

  const significantActivities = useMemo(() => {
    // This would be populated from the activity data with relevance scoring
    return [];
  }, [insights]);

  return {
    insights,
    trends,
    significantActivities,
    loading,
    error,
    refresh: fetchActivityIntelligence,
    calculateRelevanceScore
  };
};