import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface WebhookConfig {
  id: string;
  organization_id: string;
  fund_id?: string;
  service_name: string;
  webhook_url: string;
  is_active: boolean;
  config_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  config_id: string;
  deal_id: string;
  request_payload: Record<string, any>;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  attempt_number: number;
  created_at: string;
}

export interface CreateWebhookConfig {
  fund_id?: string;
  service_name: string;
  webhook_url: string;
  is_active?: boolean;
  config_data?: Record<string, any>;
}

export function useWebhookConfigs() {
  const [configs, setConfigs] = useState<WebhookConfig[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch webhook configurations
  const fetchConfigs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs((data || []).map(config => ({
        ...config,
        config_data: (config.config_data as Record<string, any>) || {}
      })));
    } catch (error) {
      console.error('Error fetching webhook configs:', error);
      toast.error('Failed to fetch webhook configurations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch webhook logs
  const fetchLogs = async (configId?: string, limit = 50) => {
    if (!user) return;

    try {
      let query = supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (configId) {
        query = query.eq('config_id', configId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data || []).map(log => ({
        ...log,
        request_payload: (log.request_payload as Record<string, any>) || {}
      })));
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
      toast.error('Failed to fetch webhook logs');
    }
  };

  // Create webhook configuration
  const createConfig = async (config: CreateWebhookConfig): Promise<WebhookConfig | null> => {
    if (!user) return null;

    try {
      // Get user's profile to get organization_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        throw new Error('Unable to get organization information');
      }

      const { data, error } = await supabase
        .from('webhook_configs')
        .insert({
          ...config,
          organization_id: profile.organization_id,
          service_name: config.service_name || 'dify',
          is_active: config.is_active ?? true,
          config_data: (config.config_data || {}) as Json
        })
        .select()
        .single();

      if (error) throw error;

      const newConfig = {
        ...data,
        config_data: (data.config_data as Record<string, any>) || {}
      };

      setConfigs(prev => [newConfig, ...prev]);
      toast.success('Webhook configuration created successfully');
      return newConfig;
    } catch (error) {
      console.error('Error creating webhook config:', error);
      toast.error('Failed to create webhook configuration');
      return null;
    }
  };

  // Update webhook configuration
  const updateConfig = async (id: string, updates: Partial<CreateWebhookConfig>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('webhook_configs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setConfigs(prev => prev.map(config => 
        config.id === id ? { ...config, ...updates } : config
      ));
      toast.success('Webhook configuration updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating webhook config:', error);
      toast.error('Failed to update webhook configuration');
      return false;
    }
  };

  // Delete webhook configuration
  const deleteConfig = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('webhook_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConfigs(prev => prev.filter(config => config.id !== id));
      toast.success('Webhook configuration deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting webhook config:', error);
      toast.error('Failed to delete webhook configuration');
      return false;
    }
  };

  // Test webhook
  const testWebhook = async (id: string): Promise<boolean> => {
    const config = configs.find(c => c.id === id);
    if (!config) {
      toast.error('Webhook configuration not found');
      return false;
    }

    setTestingWebhook(id);
    try {
      // Create test payload
      const testPayload = {
        company_name: 'Test Company',
        industry: 'Technology',
        fund_type: 'vc' as const,
        fund_name: 'Test Fund',
        deal_size: 1000000,
        valuation: 10000000,
        location: 'San Francisco, CA',
        founder: 'Test Founder',
        created_at: new Date().toISOString(),
        deal_id: 'test-deal-id',
        organization_id: config.organization_id,
        fund_id: config.fund_id || 'test-fund-id',
        status: 'active',
        event_type: 'test_webhook'
      };

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Dify-Webhook-Test/1.0',
        ...config.config_data.headers
      };

      if (config.config_data.auth_token) {
        headers['Authorization'] = `Bearer ${config.config_data.auth_token}`;
      }

      if (config.config_data.api_key) {
        headers['X-API-Key'] = config.config_data.api_key;
      }

      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      toast.success('Webhook test successful!');
      return true;
    } catch (error) {
      console.error('Webhook test failed:', error);
      toast.error(`Webhook test failed: ${error.message}`);
      return false;
    } finally {
      setTestingWebhook(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConfigs();
    }
  }, [user]);

  return {
    configs,
    logs,
    loading,
    testingWebhook,
    fetchConfigs,
    fetchLogs,
    createConfig,
    updateConfig,
    deleteConfig,
    testWebhook
  };
}