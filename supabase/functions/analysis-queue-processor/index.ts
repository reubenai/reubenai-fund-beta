import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface QueueItem {
  id: string;
  deal_id: string;
  fund_id: string;
  priority: string;
  trigger_reason: string;
  attempts: number;
  metadata: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Analysis Queue Processor: Starting batch processing...');

    // Process the analysis queue with increased concurrency
    const { data: processResult, error: processError } = await supabase
      .rpc('process_analysis_queue', { 
        batch_size: 10,
        max_concurrent: 10  // Increased from 3 to 10 for better throughput
      });

    if (processError) {
      console.error('❌ Error processing queue:', processError);
      throw processError;
    }

    console.log('📊 Queue processing result:', processResult);

    // If throttled, return early
    if (processResult?.status === 'throttled') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Queue processing throttled - max concurrent reached',
        result: processResult
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get items that were marked as processing
    const { data: processingItems, error: fetchError } = await supabase
      .from('analysis_queue')
      .select('*')
      .eq('status', 'processing')
      .order('started_at', { ascending: true });

    if (fetchError) throw fetchError;

    console.log(`🔍 Found ${processingItems?.length || 0} items to analyze`);

    let successCount = 0;
    let failureCount = 0;

    // Process each item
    for (const item of processingItems || []) {
      try {
        console.log(`🧠 Processing analysis for deal: ${item.deal_id} (reason: ${item.trigger_reason})`);
        
        // Call the enhanced deal analysis function
        const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
          'enhanced-deal-analysis',
          {
            body: {
              dealId: item.deal_id,
              analysisType: 'comprehensive',
              queueId: item.id,
              triggerReason: item.trigger_reason,
              priority: item.priority
            }
          }
        );

        if (analysisError) {
          console.error(`❌ Analysis failed for deal ${item.deal_id}:`, analysisError);
          
          // Mark as failed
          await supabase.rpc('complete_analysis_queue_item', {
            queue_id_param: item.id,
            success: false,
            error_message_param: analysisError.message || 'Analysis function failed'
          });
          
          failureCount++;
          continue;
        }

        if (analysisResult?.success) {
          console.log(`✅ Analysis completed successfully for deal: ${item.deal_id}`);
          
          // Mark as completed
          await supabase.rpc('complete_analysis_queue_item', {
            queue_id_param: item.id,
            success: true
          });
          
          successCount++;
        } else {
          console.error(`❌ Analysis returned failure for deal ${item.deal_id}:`, analysisResult?.error);
          
          // Mark as failed
          await supabase.rpc('complete_analysis_queue_item', {
            queue_id_param: item.id,
            success: false,
            error_message_param: analysisResult?.error || 'Analysis returned failure'
          });
          
          failureCount++;
        }

        // Add delay between analyses to respect API limits
        if (processingItems.indexOf(item) < processingItems.length - 1) {
          console.log('⏳ Waiting 10 seconds before next analysis...');
          await new Promise(resolve => setTimeout(resolve, 10000));
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
      }
    }

    // Clean up old completed/failed entries (keep last 100 per deal)
    const { error: cleanupError } = await supabase
      .from('analysis_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Older than 7 days

    if (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError);
    }

    const result = {
      success: true,
      message: 'Analysis queue processing completed',
      processed: successCount + failureCount,
      successful: successCount,
      failed: failureCount,
      queueResult: processResult,
      timestamp: new Date().toISOString()
    };

    console.log('🏁 Queue processing summary:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Queue processor error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
