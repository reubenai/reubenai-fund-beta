import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SYSTEM KILL SWITCH - Check if analysis system is globally disabled
async function isSystemDisabled(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('ops_control_switches')
      .select('switch_value')
      .eq('switch_name', 'analysis_system_enabled')
      .single();
    
    if (error) {
      console.log('⚠️ Kill switch check failed, assuming system disabled for safety');
      return true; // Fail safe - disable if we can't check
    }
    
    const systemEnabled = data?.switch_value === true;
    if (!systemEnabled) {
      console.log('🚫 ANALYSIS SYSTEM DISABLED via ops control switch');
    }
    return !systemEnabled;
  } catch (error) {
    console.log('⚠️ Kill switch error, assuming system disabled for safety:', error);
    return true; // Fail safe
  }
}

interface QueueItem {
  id: string;
  deal_id: string;
  fund_id: string;
  priority: string;
  trigger_reason: string;
  attempts: number;
  max_attempts: number;
  metadata: any;
  scheduled_for: string;
}


async function processQueueItem(item: QueueItem): Promise<{ success: boolean; error?: string; processingTime: number }> {
  const startTime = Date.now();
  const traceId = crypto.randomUUID();
  
  console.log(`🧠 [${traceId}] Processing ${item.trigger_reason} for deal: ${item.deal_id}`);
  
  try {
    // Enhanced metadata without vector context
    const enhancedMetadata = {
      ...item.metadata,
      traceId,
      processingStarted: new Date().toISOString()
    };
    
    let analysisResult: any;
    let analysisError: any;
    
    // Route to appropriate analysis engine based on trigger reason
    switch (item.trigger_reason) {
      case 'document_upload':
      case 'document_parsed':
        console.log(`📄 [${traceId}] Processing document-triggered analysis...`);
        const docResponse = await supabase.functions.invoke('document-processor', {
          body: { 
            dealId: item.deal_id, 
            fundId: item.fund_id,
            metadata: enhancedMetadata
          }
        });
        analysisResult = docResponse.data;
        analysisError = docResponse.error;
        break;
        
      case 'force_refresh':
      case 'manual_immediate':
        console.log(`⚡ [${traceId}] Processing high-priority analysis...`);
        const forceResponse = await supabase.functions.invoke('reuben-orchestrator', {
          body: { 
            dealId: item.deal_id,
            fundId: item.fund_id,
            engines: ['market-intelligence-engine', 'financial-engine', 'team-research-engine', 'product-ip-engine'],
            triggerReason: 'force_refresh',
            metadata: enhancedMetadata
          }
        });
        analysisResult = forceResponse.data;
        analysisError = forceResponse.error;
        break;
        
      case 'new_deal':
      case 'manual':
      case 'strategy_change':
      default:
        console.log(`🔄 [${traceId}] Processing standard comprehensive analysis...`);
        const standardResponse = await supabase.functions.invoke('enhanced-deal-analysis', {
          body: { 
            dealId: item.deal_id,
            fundId: item.fund_id,
            analysisType: 'comprehensive',
            priority: item.priority,
            triggerReason: item.trigger_reason,
            metadata: enhancedMetadata
          }
        });
        analysisResult = standardResponse.data;
        analysisError = standardResponse.error;
        break;
    }
    
    if (analysisError) {
      throw new Error(`Analysis engine failed: ${analysisError.message || JSON.stringify(analysisError)}`);
    }
    
    if (!analysisResult?.success) {
      throw new Error(`Analysis returned failure: ${analysisResult?.error || 'Unknown analysis error'}`);
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ [${traceId}] Analysis completed successfully in ${processingTime}ms`);
    
    return { success: true, processingTime };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [${traceId}] Analysis failed after ${processingTime}ms:`, error);
    return { success: false, error: error.message, processingTime };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // CHECK SYSTEM KILL SWITCH FIRST
    if (await isSystemDisabled()) {
      console.log('🚫 Universal Analysis Processor: SYSTEM DISABLED - Exiting immediately');
      return new Response(JSON.stringify({
        success: true,
        message: 'Analysis system disabled via kill switch',
        processed: 0,
        systemDisabled: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🚀 Universal Analysis Processor: Starting enhanced queue processing...');
    const overallStartTime = Date.now();

    // Get queue health status
    const { data: healthData, error: healthError } = await supabase.rpc('get_queue_health_status');
    if (healthError) {
      console.warn('⚠️ Queue health check failed:', healthError);
    }

    // First, handle any orphaned "processing" items (reset to queued)
    const { error: resetError } = await supabase
      .from('analysis_queue')
      .update({ 
        status: 'queued',
        scheduled_for: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('status', 'processing')
      .lt('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Reset items stuck processing for >10 minutes

    if (resetError) {
      console.warn('⚠️ Failed to reset orphaned items:', resetError);
    }

    // Get items ready for processing
    const { data: queueItems, error: queueError } = await supabase
      .from('analysis_queue')
      .select('*')
      .eq('status', 'queued')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(8); // Process up to 8 items at once

    if (queueError) {
      throw new Error(`Queue fetch error: ${queueError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('📭 No items ready for processing');
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        message: 'No items ready for processing',
        queueHealth: healthData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📦 Processing ${queueItems.length} queue items...`);

    let successCount = 0;
    let failureCount = 0;
    const results: any[] = [];

    // Process items sequentially to respect API limits
    for (const item of queueItems) {
      try {
        // Mark as processing
        const { error: updateError } = await supabase
          .from('analysis_queue')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
            attempts: item.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (updateError) {
          throw new Error(`Failed to mark as processing: ${updateError.message}`);
        }

        // Process the item
        const result = await processQueueItem(item);

        if (result.success) {
          // Mark as completed
          await supabase.rpc('complete_analysis_queue_item', {
            queue_id_param: item.id,
            success: true
          });

          // Update deal status
          await supabase
            .from('deals')
            .update({
              analysis_queue_status: 'completed',
              last_analysis_trigger: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', item.deal_id);

          successCount++;
          results.push({
            queueItemId: item.id,
            dealId: item.deal_id,
            status: 'completed',
            processingTime: result.processingTime
          });

        } else {
          // Handle failure with retry logic
          const shouldRetry = item.attempts + 1 < item.max_attempts;
          const newStatus = shouldRetry ? 'queued' : 'failed';
          const nextScheduled = shouldRetry 
            ? new Date(Date.now() + Math.pow(2, item.attempts) * 60000).toISOString()
            : null;

          await supabase
            .from('analysis_queue')
            .update({
              status: newStatus,
              error_message: result.error,
              scheduled_for: nextScheduled,
              updated_at: new Date().toISOString(),
              ...(newStatus === 'failed' && { completed_at: new Date().toISOString() })
            })
            .eq('id', item.id);

          // Update deal status for failed items
          if (newStatus === 'failed') {
            await supabase
              .from('deals')
              .update({
                analysis_queue_status: 'failed',
                updated_at: new Date().toISOString()
              })
              .eq('id', item.deal_id);
          }

          failureCount++;
          results.push({
            queueItemId: item.id,
            dealId: item.deal_id,
            status: newStatus,
            error: result.error,
            willRetry: shouldRetry,
            processingTime: result.processingTime
          });
        }

        // Record metrics
        await supabase
          .from('analysis_queue_metrics')
          .insert({
            metric_type: 'processing_time',
            metric_value: result.processingTime / 1000 / 60, // Convert to minutes
            fund_id: item.fund_id,
            deal_id: item.deal_id,
            metadata: {
              priority: item.priority,
              trigger_reason: item.trigger_reason,
              attempts: item.attempts + 1,
              success: result.success
            }
          });

        // Brief pause between items to respect API limits
        if (queueItems.indexOf(item) < queueItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ Unexpected error processing item ${item.id}:`, error);
        
        // Mark as failed
        await supabase.rpc('complete_analysis_queue_item', {
          queue_id_param: item.id,
          success: false,
          error_message_param: error.message || 'Unexpected processing error'
        });

        failureCount++;
        results.push({
          queueItemId: item.id,
          dealId: item.deal_id,
          status: 'failed',
          error: error.message
        });
      }
    }

    const totalTime = Date.now() - overallStartTime;

    // Record throughput metric
    await supabase
      .from('analysis_queue_metrics')
      .insert({
        metric_type: 'throughput',
        metric_value: successCount,
        metadata: {
          total_items: queueItems.length,
          failed_items: failureCount,
          processing_time_ms: totalTime,
          processor_version: 'universal-v1.0'
        }
      });

    // Cleanup old entries
    await supabase
      .from('analysis_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const summary = {
      success: true,
      message: 'Universal analysis processing completed',
      processed: successCount,
      failed: failureCount,
      totalItems: queueItems.length,
      processingTimeMs: totalTime,
      queueHealth: healthData,
      results,
      timestamp: new Date().toISOString()
    };

    console.log('🏁 Universal Processing Summary:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Universal processor error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      processed: 0,
      failed: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});