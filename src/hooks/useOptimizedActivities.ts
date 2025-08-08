import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFund } from '@/contexts/FundContext';
import { useQueryCache } from './useQueryCache';

interface Activity {
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

export const useOptimizedActivities = (limit: number = 10) => {
  const { selectedFund } = useFund();
  
  const cacheKey = `activities_${selectedFund?.id}_${limit}`;
  
  const queryFn = useCallback(async () => {
    if (!selectedFund?.id) return [];
    
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
      .eq('fund_id', selectedFund.id)
      .eq('is_visible', true)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }, [selectedFund?.id, limit]);

  const {
    data: activities = [],
    loading,
    error,
    refresh,
    invalidate
  } = useQueryCache<Activity[]>(
    cacheKey,
    queryFn,
    {
      ttl: 2 * 60 * 1000, // 2 minutes cache for activities
      enabled: !!selectedFund?.id,
      dependencies: [selectedFund?.id, limit]
    }
  );

  // Subscribe to real-time changes for activities
  useEffect(() => {
    if (!selectedFund?.id) return;

    const channel = supabase
      .channel(`activities_${selectedFund.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_events',
          filter: `fund_id=eq.${selectedFund.id}`
        },
        () => {
          // Invalidate cache and refresh when activities change
          invalidate();
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedFund?.id, invalidate, refresh]);

  return {
    activities,
    loading,
    error,
    refresh
  };
};