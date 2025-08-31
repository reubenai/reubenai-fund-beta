import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompanyTestResult {
  success: boolean;
  data?: any;
  error?: string;
  snapshot_id?: string;
  data_quality_score?: number;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'critical';
  statistics: {
    processed: number;
    failed: number;
    pending: number;
    retry_needed: number;
    total: number;
    success_rate: string;
    recent_activity_24h: number;
  };
  warnings: string[];
  api_key_configured: boolean;
}

interface BatchRecoveryResult {
  success: boolean;
  processed: number;
  failed: number;
  total_attempted: number;
  results: Array<{
    deal_id: string;
    company_name: string;
    status: string;
    error?: string;
    data_quality_score?: number;
  }>;
}

export const usePerplexityCompanyTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [testResult, setTestResult] = useState<CompanyTestResult | null>(null);
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [recoveryResult, setRecoveryResult] = useState<BatchRecoveryResult | null>(null);

  const testCompanyEnrichment = async (
    dealId: string,
    companyName: string,
    additionalContext?: {
      industry?: string;
      website?: string;
      description?: string;
    }
  ): Promise<CompanyTestResult | null> => {
    setIsTesting(true);
    
    try {
      console.log('🧪 Testing Perplexity company enrichment for:', companyName);
      
      const { data, error } = await supabase.functions.invoke('perplexity-company-enrichment', {
        body: {
          dealId,
          companyName,
          additionalContext
        }
      });

      if (error) {
        console.error('❌ Company enrichment test error:', error);
        toast.error('Company enrichment test failed');
        const errorResult = { success: false, error: error.message };
        setTestResult(errorResult);
        return errorResult;
      }

      if (!data.success) {
        console.error('❌ Company enrichment test failed:', data.error);
        toast.error(data.error || 'Company enrichment test failed');
        setTestResult(data);
        return data;
      }

      console.log('✅ Company enrichment test completed successfully');
      toast.success(`Company enrichment test completed for ${companyName}`);
      setTestResult(data);
      return data;

    } catch (error) {
      console.error('❌ Unexpected error during company enrichment test:', error);
      toast.error('An unexpected error occurred during company enrichment test');
      const errorResult = { success: false, error: 'Unexpected error occurred' };
      setTestResult(errorResult);
      return errorResult;
    } finally {
      setIsTesting(false);
    }
  };

  const checkHealth = async (): Promise<HealthCheckResult | null> => {
    setIsCheckingHealth(true);
    
    try {
      console.log('🏥 Checking Perplexity company enrichment health...');
      
      const { data, error } = await supabase.functions.invoke('perplexity-company-health-check');

      if (error) {
        console.error('❌ Health check error:', error);
        toast.error('Health check failed');
        return null;
      }

      console.log('✅ Health check completed');
      setHealthResult(data);
      
      // Show appropriate toast based on health status
      if (data.status === 'healthy') {
        toast.success('System is healthy');
      } else if (data.status === 'degraded') {
        toast.warning('System is degraded - check warnings');
      } else {
        toast.error('System is in critical state');
      }
      
      return data;

    } catch (error) {
      console.error('❌ Unexpected error during health check:', error);
      toast.error('An unexpected error occurred during health check');
      return null;
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const runBatchRecovery = async (
    processingType: 'failed' | 'retry_needed' | 'pending' | 'all' = 'failed',
    maxRecords: number = 10,
    dryRun: boolean = false
  ): Promise<BatchRecoveryResult | null> => {
    setIsRecovering(true);
    
    try {
      console.log('🔄 Starting batch recovery...');
      
      const { data, error } = await supabase.functions.invoke('perplexity-company-batch-recovery', {
        body: {
          processingType,
          maxRecords,
          dryRun
        }
      });

      if (error) {
        console.error('❌ Batch recovery error:', error);
        toast.error('Batch recovery failed');
        return null;
      }

      if (!data.success) {
        console.error('❌ Batch recovery failed:', data.error);
        toast.error(data.error || 'Batch recovery failed');
        return null;
      }

      console.log('✅ Batch recovery completed');
      setRecoveryResult(data);
      
      if (dryRun) {
        toast.success(`Dry run: Would process ${data.would_process} records`);
      } else {
        toast.success(`Recovery completed: ${data.processed} processed, ${data.failed} failed`);
      }
      
      return data;

    } catch (error) {
      console.error('❌ Unexpected error during batch recovery:', error);
      toast.error('An unexpected error occurred during batch recovery');
      return null;
    } finally {
      setIsRecovering(false);
    }
  };

  return {
    isTesting,
    isCheckingHealth,
    isRecovering,
    testResult,
    healthResult,
    recoveryResult,
    testCompanyEnrichment,
    checkHealth,
    runBatchRecovery
  };
};