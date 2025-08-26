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
  console.log('🚫 Force Analysis Queue Processor Fix: PERMANENTLY DISABLED');
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Analysis queue processing permanently disabled',
    message: 'This engine has been shut down permanently'
  }), {
    status: 503,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

  try {
    console.log('🔧 Force processing stuck analysis queue items...');

    // First, get all stuck queued items
    const { data: stuckItems, error: fetchError } = await supabase
      .from('analysis_queue')
      .select('id, deal_id, trigger_reason')
      .eq('status', 'queued');

    if (fetchError) {
      console.error('❌ Failed to fetch stuck items:', fetchError);
      throw fetchError;
    }

    console.log(`📋 Found ${stuckItems?.length || 0} stuck queue items`);

    let processedCount = 0;
    let failedCount = 0;

    // Process each stuck item by invoking the orchestrator directly
    for (const item of stuckItems || []) {
      try {
        console.log(`🔄 Processing deal ${item.deal_id} (queue: ${item.id})`);

        // Mark as processing
        await supabase
          .from('analysis_queue')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
            attempts: 1
          })
          .eq('id', item.id);

        // Trigger orchestrator for this deal
        const { data: orchestratorResult, error: orchestratorError } = await supabase.functions.invoke('reuben-orchestrator', {
          body: {
            dealId: item.deal_id,
            trigger: 'queue_processor',
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
          console.error(`❌ Orchestrator failed for deal ${item.deal_id}:`, orchestratorError);
          // Mark as failed
          await supabase
            .from('analysis_queue')
            .update({
              status: 'failed',
              error_message: orchestratorError.message,
              completed_at: new Date().toISOString()
            })
            .eq('id', item.id);
          failedCount++;
        } else {
          console.log(`✅ Orchestrator completed for deal ${item.deal_id}`);
          // Mark as completed
          await supabase
            .from('analysis_queue')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', item.id);
          processedCount++;
        }

      } catch (error) {
        console.error(`💥 Error processing queue item ${item.id}:`, error);
        // Mark as failed
        await supabase
          .from('analysis_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', item.id);
        failedCount++;
      }
    }

    const result = {
      success: true,
      total_stuck_items: stuckItems?.length || 0,
      processed: processedCount,
      failed: failedCount,
      remaining: (stuckItems?.length || 0) - processedCount - failedCount,
      timestamp: new Date().toISOString()
    };

    console.log('🎯 Force processing complete:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Force processor error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});