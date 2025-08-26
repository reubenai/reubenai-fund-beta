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

  // 🚫 HARD CODED KILL SWITCH - ENGINE PERMANENTLY DISABLED
  console.log('🚫 Force Analysis Queue Processor: PERMANENTLY DISABLED');
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Analysis queue processing permanently disabled',
    message: 'This engine has been shut down permanently'
  }), {
    status: 503,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

  try {
    console.log('🚀 Force Analysis Queue Processor: Starting manual queue processing...');

    // Get count of stuck deals
    const { data: queueStats, error: statsError } = await supabase
      .from('analysis_queue')
      .select('status, priority')
      .eq('status', 'queued');

    if (statsError) throw statsError;

    console.log(`📊 Found ${queueStats?.length || 0} deals in queue:`, {
      total: queueStats?.length || 0,
      high_priority: queueStats?.filter(q => q.priority === 'high').length || 0,
      normal_priority: queueStats?.filter(q => q.priority === 'normal').length || 0,
      low_priority: queueStats?.filter(q => q.priority === 'low').length || 0
    });

    // Force process the queue multiple times to handle all stuck deals
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    while (iterations < maxIterations) {
      iterations++;
      console.log(`🔄 Processing iteration ${iterations}/${maxIterations}...`);

      // Call the analysis queue processor
      const { data: processResult, error: processError } = await supabase.functions.invoke(
        'analysis-queue-processor',
        { body: {} }
      );

      if (processError) {
        console.error(`❌ Error in iteration ${iterations}:`, processError);
        break;
      }

      console.log(`📊 Iteration ${iterations} result:`, processResult);

      if (processResult?.processed === 0) {
        console.log('✅ No more deals to process - breaking loop');
        break;
      }

      totalProcessed += processResult?.processed || 0;
      totalSuccessful += processResult?.successful || 0;
      totalFailed += processResult?.failed || 0;

      // Add delay between iterations to respect API limits
      if (iterations < maxIterations) {
        console.log('⏳ Waiting 15 seconds before next iteration...');
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    }

    // Get final queue status
    const { data: finalStats, error: finalStatsError } = await supabase
      .from('analysis_queue')
      .select('status')
      .eq('status', 'queued');

    if (finalStatsError) throw finalStatsError;

    const result = {
      success: true,
      message: 'Force analysis queue processing completed',
      summary: {
        iterations_run: iterations,
        total_processed: totalProcessed,
        total_successful: totalSuccessful,
        total_failed: totalFailed,
        remaining_queued: finalStats?.length || 0
      },
      timestamp: new Date().toISOString()
    };

    console.log('🏁 Force processing summary:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Force queue processor error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});