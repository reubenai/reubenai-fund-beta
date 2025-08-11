import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedActivityEvent {
  id: string;
  title: string;
  description?: string;
  activity_type: string;
  occurred_at: string;
  priority: string;
  context_data?: any;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url?: string | null;
  };
}

export function useEnhancedDealActivities(dealId?: string, limit: number = 50) {
  const [activities, setActivities] = useState<EnhancedActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDealActivities = useCallback(async () => {
    if (!dealId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get activities from the last 30 days with user information
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('activity_events')
        .select(`
          id,
          title,
          description,
          activity_type,
          occurred_at,
          priority,
          context_data,
          user:profiles!user_id (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .or(`deal_id.eq.${dealId},context_data->>deal_id.eq.${dealId}`)
        .gte('occurred_at', thirtyDaysAgo.toISOString())
        .eq('is_visible', true)
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching deal activities:', err);
      setError('Failed to fetch deal activities');
    } finally {
      setLoading(false);
    }
  }, [dealId, limit]);

  useEffect(() => {
    fetchDealActivities();
  }, [fetchDealActivities]);

  const refresh = useCallback(() => {
    fetchDealActivities();
  }, [fetchDealActivities]);

  return {
    activities,
    loading,
    error,
    refresh
  };
}