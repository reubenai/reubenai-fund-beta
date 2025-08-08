import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ArchivalStats {
  active_activities: number;
  archived_activities: number;
  oldest_active_activity: string | null;
  newest_archived_activity: string | null;
  archival_configs: number;
  total_retention_configs: number;
  archive_size_estimate: {
    archived_count: number;
    size_mb: number;
  };
}

interface ArchivalConfig {
  id: string;
  activity_type: string;
  priority: string;
  retention_days: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useActivityArchival = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ArchivalStats | null>(null);
  const [configs, setConfigs] = useState<ArchivalConfig[]>([]);

  const getArchivalStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_archival_statistics');
      
      if (error) throw error;
      setStats(data as unknown as ArchivalStats);
      return data;
    } catch (error) {
      console.error('Error fetching archival stats:', error);
      toast.error('Failed to fetch archival statistics');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getArchivalConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_archival_config')
        .select('*')
        .order('activity_type', { ascending: true });
      
      if (error) throw error;
      setConfigs(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching archival configs:', error);
      toast.error('Failed to fetch archival configurations');
      return [];
    }
  };

  const updateArchivalConfig = async (
    id: string, 
    updates: Partial<Pick<ArchivalConfig, 'retention_days' | 'is_active' | 'description'>>
  ) => {
    try {
      const { error } = await supabase
        .from('activity_archival_config')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      await getArchivalConfigs();
      toast.success('Archival configuration updated');
      return true;
    } catch (error) {
      console.error('Error updating archival config:', error);
      toast.error('Failed to update archival configuration');
      return false;
    }
  };

  const runArchivalProcess = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('archive_old_activities');
      
      if (error) throw error;
      
      const archivedCount = data;
      if (archivedCount > 0) {
        toast.success(`Successfully archived ${archivedCount} activities`);
      } else {
        toast.info('No activities needed archiving');
      }
      
      // Refresh stats after archival
      await getArchivalStats();
      return archivedCount;
    } catch (error) {
      console.error('Error running archival process:', error);
      toast.error('Failed to run archival process');
      return 0;
    } finally {
      setLoading(false);
    }
  };

  const restoreArchivedActivities = async (
    activityIds?: string[],
    startDate?: string,
    endDate?: string
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('restore_archived_activities', {
        activity_ids: activityIds || null,
        start_date: startDate || null,
        end_date: endDate || null
      });
      
      if (error) throw error;
      
      const restoredCount = data;
      if (restoredCount > 0) {
        toast.success(`Successfully restored ${restoredCount} activities`);
      } else {
        toast.info('No activities to restore');
      }
      
      // Refresh stats after restoration
      await getArchivalStats();
      return restoredCount;
    } catch (error) {
      console.error('Error restoring archived activities:', error);
      toast.error('Failed to restore archived activities');
      return 0;
    } finally {
      setLoading(false);
    }
  };

  const createArchivalConfig = async (config: {
    activity_type: string;
    priority: string;
    retention_days: number;
    description?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('activity_archival_config')
        .insert(config);
      
      if (error) throw error;
      
      await getArchivalConfigs();
      toast.success('Archival configuration created');
      return true;
    } catch (error) {
      console.error('Error creating archival config:', error);
      toast.error('Failed to create archival configuration');
      return false;
    }
  };

  return {
    loading,
    stats,
    configs,
    getArchivalStats,
    getArchivalConfigs,
    updateArchivalConfig,
    runArchivalProcess,
    restoreArchivedActivities,
    createArchivalConfig
  };
};