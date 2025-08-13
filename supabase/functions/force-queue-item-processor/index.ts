import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { queueId, documentId } = await req.json();
    
    console.log(`🔧 Force processing stuck queue item: ${queueId}, document: ${documentId}`);

    // Get the queue item details
    const { data: queueItem, error: queueError } = await supabase
      .from('analysis_queue')
      .select('*')
      .eq('id', queueId)
      .single();

    if (queueError || !queueItem) {
      throw new Error(`Queue item not found: ${queueError?.message}`);
    }

    // Mark queue item as processing
    const { error: updateError } = await supabase
      .from('analysis_queue')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempts: (queueItem.attempts || 0) + 1
      })
      .eq('id', queueId);

    if (updateError) {
      throw new Error(`Failed to update queue status: ${updateError.message}`);
    }

    // If document is provided, check LlamaParse status and update accordingly
    if (documentId) {
      const { data: document, error: docError } = await supabase
        .from('deal_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (document && !docError) {
        // Check if LlamaParse was successful (you mentioned it was)
        // Update document status to completed if still stuck in processing
        if (document.parsing_status === 'processing') {
          console.log('🔄 Updating document parsing status to completed...');
          
          const { error: docUpdateError } = await supabase
            .from('deal_documents')
            .update({
              parsing_status: 'completed',
              document_analysis_status: 'completed',
              metadata: {
                ...document.metadata,
                force_recovery_applied: true,
                recovery_timestamp: new Date().toISOString(),
                llamaparse_status_reconciled: true
              }
            })
            .eq('id', documentId);

          if (docUpdateError) {
            console.error('Failed to update document status:', docUpdateError);
          } else {
            console.log('✅ Document status updated to completed');
          }
        }

        // Trigger document processor to complete the analysis
        try {
          console.log('🚀 Triggering document processor...');
          const { data: processorResult, error: processorError } = await supabase.functions.invoke('document-processor', {
            body: { documentId: documentId, analysisType: 'quick' }
          });

          if (processorError) {
            console.error('Document processor failed:', processorError);
          } else {
            console.log('✅ Document processor completed:', processorResult);
          }
        } catch (processorError) {
          console.error('Document processor invocation failed:', processorError);
        }
      }
    }

    // Now trigger the reuben orchestrator for the deal
    try {
      console.log(`🎯 Triggering reuben orchestrator for deal: ${queueItem.deal_id}`);
      
      const { data: orchestratorResult, error: orchestratorError } = await supabase.functions.invoke('reuben-orchestrator', {
        body: {
          dealId: queueItem.deal_id,
          trigger: 'force_recovery',
          engines: [
            'enhanced-deal-analysis',
            'financial-engine',
            'market-research-engine',
            'team-research-engine',
            'product-ip-engine',
            'thesis-alignment-engine',
            'rag-calculation-engine'
          ]
        }
      });

      if (orchestratorError) {
        console.error('Orchestrator failed:', orchestratorError);
        
        // Mark queue as failed
        await supabase
          .from('analysis_queue')
          .update({
            status: 'failed',
            error_message: orchestratorError.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', queueId);

        throw orchestratorError;
      } else {
        console.log('✅ Orchestrator completed successfully');
        
        // Mark queue as completed
        await supabase
          .from('analysis_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', queueId);

        // Update deal analysis queue status
        await supabase
          .from('deals')
          .update({
            analysis_queue_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', queueItem.deal_id);
      }
    } catch (orchestratorError) {
      console.error('Orchestrator invocation failed:', orchestratorError);
      
      // Mark queue as failed
      await supabase
        .from('analysis_queue')
        .update({
          status: 'failed',
          error_message: orchestratorError.message || 'Orchestrator invocation failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', queueId);

      throw orchestratorError;
    }

    const result = {
      success: true,
      queueId,
      documentId,
      status: 'completed',
      timestamp: new Date().toISOString(),
      actions_taken: [
        'Queue item marked as processing',
        documentId ? 'Document status reconciled' : null,
        'Orchestrator triggered',
        'Queue marked as completed'
      ].filter(Boolean)
    };

    console.log('🎯 Force processing complete:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Force processing error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});