import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface FeatureFlag {
  flag_name: string;
  flag_value: boolean;
  flag_config: any;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [flagConfigs, setFlagConfigs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadFeatureFlags();
  }, [user]);

  const loadFeatureFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('flag_name, flag_value, flag_config')
        .order('flag_name');

      if (error) throw error;

      const flagMap: Record<string, boolean> = {};
      const configMap: Record<string, any> = {};

      data?.forEach((flag: FeatureFlag) => {
        flagMap[flag.flag_name] = flag.flag_value;
        configMap[flag.flag_name] = flag.flag_config || {};
      });

      setFlags(flagMap);
      setFlagConfigs(configMap);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagName: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .upsert({
          flag_name: flagName,
          flag_value: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'org_id,flag_name'
        });

      if (error) throw error;

      setFlags(prev => ({ ...prev, [flagName]: value }));
    } catch (error) {
      console.error('Failed to toggle feature flag:', error);
      throw error;
    }
  };

  const isEnabled = (flagName: string): boolean => {
    return flags[flagName] || false;
  };

  const getConfig = (flagName: string): any => {
    return flagConfigs[flagName] || {};
  };

  return {
    flags,
    flagConfigs,
    loading,
    isEnabled,
    getConfig,
    toggleFlag,
    reload: loadFeatureFlags
  };
}