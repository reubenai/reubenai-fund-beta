import { useCallback, useState } from 'react';
import { QueueManager } from '@/lib/queue/QueueManager';
import { useToast } from '@/hooks/use-toast';
import { useResilienceProtection } from './useResilienceProtection';

interface QueueJobOptions {
  source?: 'user' | 'scheduler' | 'event';
  delayMinutes?: number;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Hook for managing isolated job queues
 * Provides safe job queuing with engine-specific configurations
 */
export function useQueueManager() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { executeProtectedOperation } = useResilienceProtection();

  /**
   * Queue a deal analysis job
   */
  const queueDealAnalysis = useCallback(async (
    dealId: string,
    tenantId: string,
    triggerReason: string,
    options: QueueJobOptions = {}
  ) => {
    const result = await executeProtectedOperation(
      'queue_deal_analysis',
      async () => {
        return await QueueManager.queueJob(
          'deal_analysis',
          tenantId,
          triggerReason,
          { deal_id: dealId },
          { deal_id: dealId, trigger_reason: triggerReason },
          options
        );
      },
      { showToasts: false }
    );

    if (result.success && 'result' in result && result.result?.success) {
      toast({
        title: "Analysis Queued",
        description: "Deal analysis has been queued for processing",
        variant: "default"
      });
      return { success: true, jobId: result.result.jobId };
    } else {
      const error = ('result' in result && result.result?.error) || result.error || 'Failed to queue analysis';
      toast({
        title: "Queue Error",
        description: error,
        variant: "destructive"
      });
      return { success: false, error };
    }
  }, [executeProtectedOperation, toast]);

  /**
   * Queue a document analysis job
   */
  const queueDocumentAnalysis = useCallback(async (
    documentId: string,
    dealId: string,
    tenantId: string,
    triggerReason: string = 'document_uploaded',
    options: QueueJobOptions = {}
  ) => {
    const result = await executeProtectedOperation(
      'queue_document_analysis',
      async () => {
        return await QueueManager.queueJob(
          'document_analysis',
          tenantId,
          triggerReason,
          { document_id: documentId, deal_id: dealId },
          { document_id: documentId, deal_id: dealId, trigger_reason: triggerReason },
          options
        );
      },
      { showToasts: false }
    );

    if (result.success && 'result' in result && result.result?.success) {
      toast({
        title: "Document Analysis Queued",
        description: "Document analysis has been queued for processing",
        variant: "default"
      });
      return { success: true, jobId: result.result.jobId };
    } else {
      const error = ('result' in result && result.result?.error) || result.error || 'Failed to queue document analysis';
      toast({
        title: "Queue Error", 
        description: error,
        variant: "destructive"
      });
      return { success: false, error };
    }
  }, [executeProtectedOperation, toast]);

  /**
   * Queue a strategy change job
   */
  const queueStrategyChange = useCallback(async (
    strategyId: string,
    fundId: string,
    tenantId: string,
    triggerReason: string = 'strategy_updated',
    options: QueueJobOptions = {}
  ) => {
    const result = await executeProtectedOperation(
      'queue_strategy_change',
      async () => {
        return await QueueManager.queueJob(
          'strategy_change',
          tenantId,
          triggerReason,
          { strategy_id: strategyId },
          { strategy_id: strategyId, fund_id: fundId, trigger_reason: triggerReason },
          options
        );
      },
      { showToasts: false }
    );

    if (result.success && 'result' in result && result.result?.success) {
      toast({
        title: "Strategy Change Queued",
        description: "Strategy changes have been queued for processing",
        variant: "default"
      });
      return { success: true, jobId: result.result.jobId };
    } else {
      const error = ('result' in result && result.result?.error) || result.error || 'Failed to queue strategy change';
      toast({
        title: "Queue Error",
        description: error, 
        variant: "destructive"
      });
      return { success: false, error };
    }
  }, [executeProtectedOperation, toast]);

  /**
   * Queue a note analysis job
   */
  const queueNoteAnalysis = useCallback(async (
    noteId: string,
    dealId: string,
    tenantId: string,
    triggerReason: string = 'note_created',
    options: QueueJobOptions = {}
  ) => {
    const result = await executeProtectedOperation(
      'queue_note_analysis',
      async () => {
        return await QueueManager.queueJob(
          'note_analysis',
          tenantId,
          triggerReason,
          { note_id: noteId, deal_id: dealId },
          { note_id: noteId, deal_id: dealId, trigger_reason: triggerReason },
          options
        );
      },
      { showToasts: false }
    );

    if (result.success && 'result' in result && result.result?.success) {
      toast({
        title: "Note Analysis Queued",
        description: "Note analysis has been queued for processing",
        variant: "default"
      });
      return { success: true, jobId: result.result.jobId };
    } else {
      const error = ('result' in result && result.result?.error) || result.error || 'Failed to queue note analysis';
      toast({
        title: "Queue Error",
        description: error,
        variant: "destructive"
      });
      return { success: false, error };
    }
  }, [executeProtectedOperation, toast]);

  /**
   * Process a specific queue
   */
  const processQueue = useCallback(async (queueName: string, workerId?: string) => {
    try {
      setIsProcessing(true);

      const result = await executeProtectedOperation(
        `process_${queueName}`,
        async () => {
          return await QueueManager.processQueue(queueName, workerId);
        },
        { showToasts: false }
      );

      if (result.success && 'result' in result && result.result?.success) {
        const { processed, failed } = result.result;
        if (processed > 0 || failed > 0) {
          toast({
            title: "Queue Processed",
            description: `Processed ${processed} jobs, ${failed} failures`,
            variant: processed > 0 ? "default" : "destructive"
          });
        }
        return result.result;
      } else {
        const error = result.error || 'Failed to process queue';
        toast({
          title: "Processing Error",
          description: error,
          variant: "destructive"
        });
        return { success: false, processed: 0, failed: 0 };
      }
    } finally {
      setIsProcessing(false);
    }
  }, [executeProtectedOperation, toast]);

  /**
   * Cleanup expired jobs
   */
  const cleanupQueues = useCallback(async () => {
    try {
      await QueueManager.cleanup();
      toast({
        title: "Queues Cleaned",
        description: "Expired jobs and locks have been cleaned up",
        variant: "default"
      });
      return true;
    } catch (error) {
      toast({
        title: "Cleanup Error",
        description: "Failed to cleanup queues",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return {
    isProcessing,
    queueDealAnalysis,
    queueDocumentAnalysis,
    queueStrategyChange,
    queueNoteAnalysis,
    processQueue,
    cleanupQueues
  };
}