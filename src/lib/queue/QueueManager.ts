import { supabase } from '@/integrations/supabase/client';
import { ResilienceOrchestrator } from '@/lib/resilience/ResilienceOrchestrator';
import { v4 as uuidv4 } from 'uuid';

interface QueueJob {
  job_id: string;
  tenant_id: string;
  engine: string;
  source: 'user' | 'scheduler' | 'event';
  trigger_reason: string;
  related_ids: {
    deal_id?: string;
    strategy_id?: string;
    document_id?: string;
    note_id?: string;
  };
  retry_count: number;
  idempotency_key: string;
  job_payload: Record<string, any>;
  created_at: string;
}

interface EngineConfig {
  engine_id: string;
  queue_name: string;
  max_concurrency: number;
  job_ttl_minutes: number;
  enabled: boolean;
  feature_flag?: string;
}

/**
 * Unified Queue Manager with Isolation and TTL Enforcement
 * Handles all job queuing with engine-specific configurations
 */
export class QueueManager {
  private static engineConfigs: Map<string, EngineConfig> = new Map();
  private static configsLoaded = false;

  /**
   * Load engine configurations from database
   */
  private static async loadEngineConfigs(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('engine_registry' as any)
        .select('*')
        .eq('enabled', true);

      if (error) {
        console.error('Failed to load engine configs:', error);
        return;
      }

      this.engineConfigs.clear();
      data?.forEach((config: any) => {
        this.engineConfigs.set(config.engine_id, {
          engine_id: config.engine_id,
          queue_name: config.queue_name,
          max_concurrency: config.max_concurrency,
          job_ttl_minutes: config.job_ttl_minutes,
          enabled: config.enabled,
          feature_flag: config.feature_flag
        });
      });

      this.configsLoaded = true;
      console.log(`✅ Loaded ${this.engineConfigs.size} engine configurations`);
    } catch (error) {
      console.error('Error loading engine configs:', error);
    }
  }

  /**
   * Get engine configuration
   */
  private static async getEngineConfig(engineId: string): Promise<EngineConfig | null> {
    if (!this.configsLoaded) {
      await this.loadEngineConfigs();
    }

    return this.engineConfigs.get(engineId) || null;
  }

  /**
   * Queue a job with engine-specific configuration
   */
  static async queueJob(
    engineId: string,
    tenantId: string,
    triggerReason: string,
    relatedIds: QueueJob['related_ids'],
    payload: Record<string, any>,
    options: {
      source?: 'user' | 'scheduler' | 'event';
      delayMinutes?: number;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    const { source = 'user', delayMinutes = 0, priority = 'normal' } = options;

    try {
      // Get engine configuration
      const engineConfig = await this.getEngineConfig(engineId);
      if (!engineConfig) {
        return { success: false, error: `Engine ${engineId} not found or disabled` };
      }

      // Generate job details
      const jobId = uuidv4();
      const idempotencyKey = this.generateIdempotencyKey(engineId, tenantId, relatedIds, triggerReason);
      const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);
      const expiresAt = new Date(Date.now() + engineConfig.job_ttl_minutes * 60 * 1000);

      // Create job payload
      const jobData = {
        job_id: jobId,
        queue_name: engineConfig.queue_name,
        tenant_id: tenantId,
        engine: engineId,
        source,
        trigger_reason: triggerReason,
        related_ids: relatedIds,
        retry_count: 0,
        max_retries: 3,
        idempotency_key: idempotencyKey,
        job_payload: payload,
        status: 'queued',
        scheduled_for: scheduledFor.toISOString(),
        expires_at: expiresAt.toISOString()
      };

      // Use resilience orchestrator for safe operation
      const result = await ResilienceOrchestrator.executeSimpleOperation(
        `queue_${engineId}`,
        async () => {
          // Check for existing job with same idempotency key
          const { data: existing, error: checkError } = await supabase
            .from('job_queues' as any)
            .select('job_id, status')
            .eq('idempotency_key', idempotencyKey)
            .eq('status', 'queued')
            .maybeSingle();

          if (checkError) {
            throw new Error(`Queue check failed: ${checkError.message}`);
          }

          if (existing) {
            return { jobId: (existing as any).job_id, duplicate: true };
          }

          // Insert new job
          const { data, error } = await supabase
            .from('job_queues' as any)
            .insert(jobData)
            .select('job_id')
            .single();

          if (error) {
            throw new Error(`Failed to queue job: ${error.message}`);
          }

          return { jobId: (data as any).job_id, duplicate: false };
        }
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      console.log(`✅ Job queued: ${jobId} for engine ${engineId}`);
      return { success: true, jobId: result.result?.jobId };

    } catch (error) {
      console.error(`Failed to queue job for engine ${engineId}:`, error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Process jobs for a specific queue
   */
  static async processQueue(
    queueName: string,
    workerId: string = 'default'
  ): Promise<{ success: boolean; processed: number; failed: number }> {
    try {
      // Get engine configuration for the queue
      const engineConfig = Array.from(this.engineConfigs.values())
        .find(config => config.queue_name === queueName);

      if (!engineConfig) {
        throw new Error(`No engine configuration found for queue: ${queueName}`);
      }

      // Acquire processing lock
      const lockAcquired = await this.acquireProcessingLock(queueName, workerId);
      if (!lockAcquired) {
        return { success: true, processed: 0, failed: 0 };
      }

      try {
        // Get jobs to process (respecting concurrency)
        const { data: jobs, error } = await supabase
          .from('job_queues' as any)
          .select('*')
          .eq('queue_name', queueName)
          .eq('status', 'queued')
          .lte('scheduled_for', new Date().toISOString())
          .order('created_at', { ascending: true })
          .limit(engineConfig.max_concurrency);

        if (error) {
          throw new Error(`Failed to fetch jobs: ${error.message}`);
        }

        if (!jobs || jobs.length === 0) {
          return { success: true, processed: 0, failed: 0 };
        }

        let processed = 0;
        let failed = 0;

        // Process each job
        for (const job of jobs) {
          try {
            await this.processJob(job);
            processed++;
          } catch (error) {
            console.error(`Job ${(job as any).job_id} failed:`, error);
            await this.handleJobFailure(job, error);
            failed++;
          }
        }

        return { success: true, processed, failed };

      } finally {
        await this.releaseProcessingLock(queueName, workerId);
      }

    } catch (error) {
      console.error(`Queue processing failed for ${queueName}:`, error);
      return { success: false, processed: 0, failed: 0 };
    }
  }

  /**
   * Process individual job
   */
  private static async processJob(job: any): Promise<void> {
    // Mark as processing
    await supabase
      .from('job_queues' as any)
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('job_id', job.job_id);

    // Route to appropriate processor based on engine
    switch (job.engine) {
      case 'deal_analysis':
        await this.processDealAnalysis(job);
        break;
      case 'document_analysis':
        await this.processDocumentAnalysis(job);
        break;
      case 'strategy_change':
        await this.processStrategyChange(job);
        break;
      case 'note_analysis':
        await this.processNoteAnalysis(job);
        break;
      default:
        throw new Error(`Unknown engine: ${job.engine}`);
    }

    // Mark as completed
    await supabase
      .from('job_queues' as any)
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('job_id', job.job_id);
  }

  /**
   * Engine-specific processors (delegate to existing systems)
   */
  private static async processDealAnalysis(job: any): Promise<void> {
    // Delegate to existing enhanced-deal-analysis function
    const { error } = await supabase.functions.invoke('enhanced-deal-analysis', {
      body: {
        deal_id: job.related_ids.deal_id,
        trigger_reason: job.trigger_reason,
        job_id: job.job_id
      }
    });

    if (error) {
      throw error;
    }
  }

  private static async processDocumentAnalysis(job: any): Promise<void> {
    // Delegate to existing document-processor function  
    const { error } = await supabase.functions.invoke('document-processor', {
      body: {
        document_id: job.related_ids.document_id,
        deal_id: job.related_ids.deal_id,
        job_id: job.job_id
      }
    });

    if (error) {
      throw error;
    }
  }

  private static async processStrategyChange(job: any): Promise<void> {
    // Strategy changes don't trigger automatic re-analysis per requirements
    console.log(`Strategy change processed for ${job.related_ids.strategy_id}`);
  }

  private static async processNoteAnalysis(job: any): Promise<void> {
    // Future: implement note intelligence analysis
    console.log(`Note analysis queued for future implementation: ${job.related_ids.note_id}`);
  }

  /**
   * Handle job failure
   */
  private static async handleJobFailure(job: any, error: any): Promise<void> {
    const newRetryCount = job.retry_count + 1;
    const maxRetries = job.max_retries || 3;

    if (newRetryCount <= maxRetries) {
      // Retry with exponential backoff
      const backoffMinutes = Math.pow(2, newRetryCount); // 2, 4, 8 minutes
      const retryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await supabase
        .from('job_queues' as any)
        .update({
          status: 'queued',
          retry_count: newRetryCount,
          scheduled_for: retryAt.toISOString(),
          error_message: error.message
        })
        .eq('job_id', job.job_id);
    } else {
      // Send to dead letter queue
      await this.sendToDeadLetterQueue(job, error);
    }
  }

  /**
   * Send job to dead letter queue
   */
  private static async sendToDeadLetterQueue(job: any, error: any): Promise<void> {
    await Promise.all([
      // Insert into DLQ
      supabase.from('dead_letter_queue' as any).insert({
        original_job_id: job.job_id,
        queue_name: job.queue_name,
        tenant_id: job.tenant_id,
        engine: job.engine,
        failure_reason: error.message,
        original_payload: job.job_payload,
        failure_context: {
          retry_count: job.retry_count,
          last_error: error.message,
          failed_at: new Date().toISOString()
        }
      }),
      // Mark original job as failed
      supabase.from('job_queues' as any).update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message
      }).eq('job_id', job.job_id)
    ]);
  }

  /**
   * Queue processing lock management
   */
  private static async acquireProcessingLock(queueName: string, workerId: string): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minute lock

      const { error } = await supabase
        .from('queue_processing_locks' as any)
        .insert({
          queue_name: queueName,
          worker_id: workerId,
          expires_at: expiresAt.toISOString()
        });

      return !error;
    } catch (error) {
      return false;
    }
  }

  private static async releaseProcessingLock(queueName: string, workerId: string): Promise<void> {
    await supabase
      .from('queue_processing_locks' as any)
      .delete()
      .eq('queue_name', queueName)
      .eq('worker_id', workerId);
  }

  /**
   * Generate idempotency key
   */
  private static generateIdempotencyKey(
    engineId: string,
    tenantId: string,
    relatedIds: QueueJob['related_ids'],
    triggerReason: string
  ): string {
    const relatedIdString = Object.values(relatedIds).filter(Boolean).join(':');
    const timestamp = new Date().toISOString().split('T')[0]; // Daily granularity
    return `${engineId}:${tenantId}:${relatedIdString}:${triggerReason}:${timestamp}`;
  }

  /**
   * Cleanup expired jobs and locks
   */
  static async cleanup(): Promise<void> {
    try {
      const now = new Date().toISOString();

      await Promise.all([
        // Mark expired jobs as failed
        supabase.from('job_queues' as any)
          .update({ status: 'expired', completed_at: now })
          .eq('status', 'queued')
          .lt('expires_at', now),

        // Remove expired locks
        supabase.from('queue_processing_locks' as any)
          .delete()
          .lt('expires_at', now),

        // Clean up old completed jobs (older than 24 hours)
        supabase.from('job_queues' as any)
          .delete()
          .eq('status', 'completed')
          .lt('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      console.log('✅ Queue cleanup completed');
    } catch (error) {
      console.error('❌ Queue cleanup failed:', error);
    }
  }
}