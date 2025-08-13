import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useStuckDocumentRecovery() {
  const [isRecovering, setIsRecovering] = useState(false);
  const { toast } = useToast();

  const recoverStuckDocument = useCallback(async (documentId: string, queueId?: string, llamaParseId?: string) => {
    try {
      setIsRecovering(true);
      console.log(`🔧 Recovering stuck document: ${documentId}`);

      // Step 1: Check LlamaParse status if we have the ID
      if (llamaParseId) {
        console.log('📊 Checking LlamaParse status...');
        const { data: llamaStatus, error: llamaError } = await supabase.functions.invoke('llamaparse-status-checker', {
          body: { llamaParseId, documentId }
        });

        if (!llamaError && llamaStatus?.auto_fix_applied) {
          console.log('✅ LlamaParse status reconciled automatically');
          toast({
            title: "Document Status Fixed",
            description: "LlamaParse status has been reconciled with our system",
          });
        }
      }

      // Step 2: Force process the stuck queue item
      if (queueId) {
        console.log('🚀 Force processing queue item...');
        const { data: queueResult, error: queueError } = await supabase.functions.invoke('force-queue-item-processor', {
          body: { queueId, documentId }
        });

        if (queueError) {
          throw new Error(`Queue processing failed: ${queueError.message}`);
        }

        console.log('✅ Queue processing completed:', queueResult);
        toast({
          title: "Document Processing Completed",
          description: "The stuck document has been successfully processed",
        });
      }

      // Step 3: Check if document is now properly processed
      const { data: updatedDoc, error: checkError } = await supabase
        .from('deal_documents')
        .select('parsing_status, document_analysis_status, metadata')
        .eq('id', documentId)
        .single();

      if (!checkError && updatedDoc) {
        const isNowCompleted = updatedDoc.parsing_status === 'completed' && 
                              updatedDoc.document_analysis_status === 'completed';
        
        if (isNowCompleted) {
          toast({
            title: "Recovery Successful",
            description: "Document is now fully processed and available for analysis",
          });
        } else {
          toast({
            title: "Recovery In Progress",
            description: "Document recovery initiated, analysis may still be processing",
            variant: "default"
          });
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Document recovery failed:', error);
      toast({
        title: "Recovery Failed",
        description: error.message || "Could not recover the stuck document",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsRecovering(false);
    }
  }, [toast]);

  const checkStuckDocuments = useCallback(async (dealId?: string) => {
    try {
      // Find documents that are stuck in processing
      const query = supabase
        .from('deal_documents')
        .select('id, name, parsing_status, document_analysis_status, created_at, metadata')
        .or('parsing_status.eq.processing,document_analysis_status.eq.processing');

      if (dealId) {
        query.eq('deal_id', dealId);
      }

      const { data: stuckDocs, error } = await query
        .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Older than 10 minutes

      if (error) {
        throw error;
      }

      return stuckDocs || [];
    } catch (error) {
      console.error('❌ Error checking for stuck documents:', error);
      return [];
    }
  }, []);

  const getQueueItemForDocument = useCallback(async (dealId: string) => {
    try {
      const { data: queueItems, error } = await supabase
        .from('analysis_queue')
        .select('id, status, trigger_reason, created_at')
        .eq('deal_id', dealId)
        .eq('status', 'queued')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      return queueItems?.[0] || null;
    } catch (error) {
      console.error('❌ Error getting queue item:', error);
      return null;
    }
  }, []);

  return {
    isRecovering,
    recoverStuckDocument,
    checkStuckDocuments,
    getQueueItemForDocument
  };
}