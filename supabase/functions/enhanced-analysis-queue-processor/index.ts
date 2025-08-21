import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Enhanced Analysis Queue Processor Starting...');
    const startTime = Date.now();

    // Get queue health status first
    const { data: healthData, error: healthError } = await supabase.rpc('get_queue_health_status');
    
    if (healthError) {
      console.error('❌ Failed to get queue health:', healthError);
    } else {
      console.log('📊 Current Queue Health:', healthData);
    }

    // Get items ready for processing (ordered by priority and scheduled time)
    const { data: queueItems, error: queueError } = await supabase
      .from('analysis_queue')
      .select(`
        id,
        deal_id,
        fund_id,
        priority,
        trigger_reason,
        scheduled_for,
        attempts,
        max_attempts,
        metadata
      `)
      .eq('status', 'queued')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false }) // high, normal, low
      .order('scheduled_for', { ascending: true })
      .limit(10); // Process max 10 items at once

    if (queueError) {
      throw new Error(`Queue fetch error: ${queueError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('📭 No items ready for processing');
      return new Response(
        JSON.stringify({ 
          processed: 0, 
          message: 'No items ready for processing',
          queueHealth: healthData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📦 Found ${queueItems.length} items ready for processing`);

    let processedCount = 0;
    let failedCount = 0;
    const results: any[] = [];

    // Process each item
    for (const item of queueItems) {
      const itemStartTime = Date.now();
      
      try {
        // 🚨 EMERGENCY HARDCODED BLOCK FOR KERNEL & ASTRO DEALS
        const BLOCKED_DEALS = ['7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'];
        if (BLOCKED_DEALS.includes(item.deal_id)) {
          console.log(`🛑 EMERGENCY BLOCK: Queue processor skipping blocked deal: ${item.deal_id}`);
          
          // Mark as failed with emergency block reason
          await supabase
            .from('analysis_queue')
            .update({
              status: 'failed',
              error_message: 'EMERGENCY_SHUTDOWN_ACTIVE: Deal processing blocked by emergency protocol',
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
            
          failedCount++;
          continue; // Skip to next item
        }
        
        console.log(`🔄 Processing queue item ${item.id} for deal ${item.deal_id}`);

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

        // Trigger the appropriate analysis based on trigger reason
        let analysisResult;
        
        switch (item.trigger_reason) {
          case 'document_upload':
            analysisResult = await supabase.functions.invoke('document-processor', {
              body: { dealId: item.deal_id, fundId: item.fund_id }
            });
            break;
          case 'new_deal':
          case 'manual':
          case 'manual_immediate':
          default:
            analysisResult = await supabase.functions.invoke('enhanced-deal-analysis', {
              body: { 
                dealId: item.deal_id, 
                fundId: item.fund_id,
                priority: item.priority,
                triggerReason: item.trigger_reason
              }
            });
            break;
        }

        if (analysisResult.error) {
          throw new Error(`Analysis failed: ${analysisResult.error.message}`);
        }

        // Mark as completed
        const { error: completeError } = await supabase
          .from('analysis_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (completeError) {
          console.error(`❌ Failed to mark as completed: ${completeError.message}`);
        }

        // Update deal status
        const { error: dealUpdateError } = await supabase
          .from('deals')
          .update({
            analysis_queue_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', item.deal_id);

        if (dealUpdateError) {
          console.error(`❌ Failed to update deal status: ${dealUpdateError.message}`);
        }

        const processingTime = Date.now() - itemStartTime;
        
        // Record processing time metric
        await supabase
          .from('analysis_queue_metrics')
          .insert({
            metric_type: 'processing_time',
            metric_value: processingTime / 1000 / 60, // Convert to minutes
            fund_id: item.fund_id,
            deal_id: item.deal_id,
            metadata: {
              priority: item.priority,
              trigger_reason: item.trigger_reason,
              attempts: item.attempts + 1
            }
          });

        processedCount++;
        results.push({
          queueItemId: item.id,
          dealId: item.deal_id,
          priority: item.priority,
          processingTimeMs: processingTime,
          status: 'completed'
        });

        console.log(`✅ Successfully processed queue item ${item.id} in ${processingTime}ms`);

      } catch (error) {
        console.error(`❌ Failed to process queue item ${item.id}:`, error);
        
        // Mark as failed or retry
        const shouldRetry = item.attempts + 1 < item.max_attempts;
        const newStatus = shouldRetry ? 'queued' : 'failed';
        const nextScheduled = shouldRetry 
          ? new Date(Date.now() + Math.pow(2, item.attempts) * 60000).toISOString() // Exponential backoff
          : null;

        const { error: failError } = await supabase
          .from('analysis_queue')
          .update({
            status: newStatus,
            error_message: error.message,
            scheduled_for: nextScheduled,
            updated_at: new Date().toISOString(),
            ...(newStatus === 'failed' && { completed_at: new Date().toISOString() })
          })
          .eq('id', item.id);

        if (failError) {
          console.error(`❌ Failed to update failed item: ${failError.message}`);
        }

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

        failedCount++;
        results.push({
          queueItemId: item.id,
          dealId: item.deal_id,
          priority: item.priority,
          status: newStatus,
          error: error.message,
          willRetry: shouldRetry
        });
      }
    }

    const totalTime = Date.now() - startTime;
    
    // Record throughput metric
    await supabase
      .from('analysis_queue_metrics')
      .insert({
        metric_type: 'throughput',
        metric_value: processedCount,
        metadata: {
          total_items: queueItems.length,
          failed_items: failedCount,
          processing_time_ms: totalTime
        }
      });

    console.log(`🎯 Enhanced Queue Processing Complete:`);
    console.log(`   ✅ Processed: ${processedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   ⏱️  Total Time: ${totalTime}ms`);

    return new Response(
      JSON.stringify({
        processed: processedCount,
        failed: failedCount,
        totalItems: queueItems.length,
        processingTimeMs: totalTime,
        results,
        queueHealth: healthData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Enhanced queue processor error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        processed: 0,
        failed: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});