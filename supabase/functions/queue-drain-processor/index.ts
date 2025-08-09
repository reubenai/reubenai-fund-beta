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
    console.log('🚀 Queue Drain Processor: Starting emergency queue drain...');

    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    let iterations = 0;
    const maxIterations = 20; // Prevent infinite loops

    // Process in batches until queue is empty or max iterations reached
    while (iterations < maxIterations) {
      console.log(`🔄 Drain iteration ${iterations + 1}/${maxIterations}`);

      // Check for queued items
      const { data: queueCheck, error: checkError } = await supabase
        .from('analysis_queue')
        .select('id')
        .eq('status', 'queued')
        .limit(1);

      if (checkError) {
        console.error('❌ Queue check failed:', checkError);
        break;
      }

      if (!queueCheck || queueCheck.length === 0) {
        console.log('✅ Queue is empty - drain complete');
        break;
      }

      // Process next batch with higher concurrency for drain operation
      const { data: processResult, error: processError } = await supabase.functions.invoke(
        'analysis-queue-processor'
      );

      if (processError) {
        console.error('❌ Batch processing failed:', processError);
        break;
      }

      const batchProcessed = processResult?.processed || 0;
      const batchSuccessful = processResult?.successful || 0;
      const batchFailed = processResult?.failed || 0;

      totalProcessed += batchProcessed;
      totalSuccessful += batchSuccessful;
      totalFailed += batchFailed;

      console.log(`📊 Batch ${iterations + 1} results: ${batchProcessed} processed (${batchSuccessful} successful, ${batchFailed} failed)`);

      // If no items were processed, break to prevent infinite loop
      if (batchProcessed === 0) {
        console.log('⚠️ No items processed in this batch - stopping drain');
        break;
      }

      iterations++;

      // Add a small delay between batches to prevent overwhelming the system
      if (iterations < maxIterations) {
        console.log('⏳ Waiting 5 seconds before next drain batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Final queue status check
    const { data: finalStatus, error: statusError } = await supabase
      .from('analysis_queue')
      .select('status')
      .eq('status', 'queued');

    const remainingQueued = finalStatus?.length || 0;

    const result = {
      success: true,
      message: 'Queue drain completed',
      iterations,
      totalProcessed,
      totalSuccessful,
      totalFailed,
      remainingQueued,
      drainComplete: remainingQueued === 0,
      timestamp: new Date().toISOString()
    };

    console.log('🏁 Queue drain summary:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Queue drain processor error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});