import { useState, useEffect, useCallback } from 'react';
import { activityService, ActivityEvent, ActivityFilters } from '@/services/ActivityService';
import { useFund } from '@/contexts/FundContext';

export function useActivities(filters: Omit<ActivityFilters, 'fund_id'> = {}) {
  const { selectedFund } = useFund();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!selectedFund?.id) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await activityService.getActivities({
        ...filters,
        fund_id: selectedFund.id
      });
      
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [selectedFund?.id, filters]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const refresh = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    refresh
  };
}

export function useDealActivities(dealId?: string, limit: number = 50) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
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
      
      const data = await activityService.getDealActivities(dealId, limit);
      setActivities(data);
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

export function useRecentActivities(limit: number = 20) {
  const { selectedFund } = useFund();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentActivities = useCallback(async () => {
    if (!selectedFund?.id) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await activityService.getRecentActivities(selectedFund.id, limit);
      setActivities(data);
    } catch (err) {
      console.error('Error fetching recent activities:', err);
      setError('Failed to fetch recent activities');
    } finally {
      setLoading(false);
    }
  }, [selectedFund?.id, limit]);

  useEffect(() => {
    fetchRecentActivities();
  }, [fetchRecentActivities]);

  const refresh = useCallback(() => {
    fetchRecentActivities();
  }, [fetchRecentActivities]);

  return {
    activities,
    loading,
    error,
    refresh
  };
}