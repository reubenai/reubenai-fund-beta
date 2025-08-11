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
    console.log('🛡️ Safe Mode Processor: Starting controlled processing...');

    // Check safe mode configuration
    const { data: config, error: configError } = await supabase
      .from('analysis_environment_config')
      .select('config_key, config_value')
      .eq('enabled', true);

    if (configError) throw configError;

    const configMap = Object.fromEntries(
      config?.map(c => [c.config_key, c.config_value]) || []
    );

    // Verify safe mode is enabled
    if (configMap.ANALYSIS_SAFE_MODE !== 'on') {
      throw new Error('Safe mode is not enabled');
    }

    const maxConcurrency = parseInt(configMap.MAX_CONCURRENCY || '1');
    console.log(`🛡️ Safe mode enabled with max concurrency: ${maxConcurrency}`);

    // Use safe queue processing
    const { data: processResult, error: processError } = await supabase
      .rpc('process_analysis_queue_safe', { 
        batch_size: 2,
        max_concurrent: maxConcurrency
      });

    if (processError) throw processError;

    console.log('📊 Safe queue processing result:', processResult);

    if (processResult?.status === 'throttled') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Safe mode processing throttled',
        result: processResult,
        safe_mode: true
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get allowlisted items that are processing
    const { data: processingItems, error: fetchError } = await supabase
      .from('analysis_queue')
      .select(`
        *,
        allowlist:analysis_allowlist!inner(deal_id, test_phase)
      `)
      .eq('status', 'processing')
      .order('started_at', { ascending: true });

    if (fetchError) throw fetchError;

    console.log(`🔍 Found ${processingItems?.length || 0} allowlisted items to analyze`);

    let successCount = 0;
    let failureCount = 0;
    const processingDetails: any[] = [];

    // Process each allowlisted item
    for (const item of processingItems || []) {
      const traceId = crypto.randomUUID();
      const startTime = new Date();
      
      console.log(`🛡️ [${traceId}] Processing allowlisted deal: ${item.deal_id}`);
      
      try {
        // Heartbeat for long-running processes
        const heartbeat = setInterval(async () => {
          await supabase
            .from('analysis_queue')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', item.id);
          console.log(`💓 [${traceId}] Safe mode heartbeat for: ${item.id}`);
        }, 30000);

        // Use ONLY safe-mode-analysis (no enhanced analysis)
        console.log(`🛡️ [${traceId}] Running SAFE MODE analysis only...`);
        const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
          'safe-mode-analysis',
          {
            body: {
              dealId: item.deal_id,
              queueId: item.id,
              triggerReason: item.trigger_reason,
              traceId
            }
          }
        );

        clearInterval(heartbeat);

        const endTime = new Date();
        const processingTimeMs = endTime.getTime() - startTime.getTime();

        const detail = {
          deal_id: item.deal_id,
          queue_id: item.id,
          trace_id: traceId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          processing_time_ms: processingTimeMs,
          success: false,
          error: null,
          safe_mode: true
        };

        if (analysisError) {
          console.error(`❌ [${traceId}] Safe mode analysis failed:`, analysisError);
          
          detail.error = analysisError.message || 'Safe mode analysis failed';
          detail.success = false;

          await supabase.rpc('complete_analysis_queue_item', {
            queue_id_param: item.id,
            success: false,
            error_message_param: detail.error
          });
          
          failureCount++;
        } else if (analysisResult?.success) {
          console.log(`✅ [${traceId}] Safe mode analysis completed for: ${item.deal_id}`);
          
          detail.success = true;
          detail.analysis_data = {
            safe_mode: analysisResult.safe_mode,
            overall_score: analysisResult.analysis?.overallScore,
            thesis_score: analysisResult.analysis?.thesisScore,
            thesis_status: analysisResult.analysis?.thesisStatus,
            rationale: analysisResult.analysis?.rationale
          };

          await supabase.rpc('complete_analysis_queue_item', {
            queue_id_param: item.id,
            success: true
          });
          
          successCount++;
        } else {
          detail.error = 'Safe mode analysis returned no success flag';
          detail.success = false;

          await supabase.rpc('complete_analysis_queue_item', {
            queue_id_param: item.id,
            success: false,
            error_message_param: detail.error
          });
          
          failureCount++;
        }

        processingDetails.push(detail);

        // Brief delay between analyses
        if (processingItems.indexOf(item) < processingItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

      } catch (error) {
        console.error(`❌ [${traceId}] Unexpected error:`, error);
        
        const detail = {
          deal_id: item.deal_id,
          queue_id: item.id,
          trace_id: traceId,
          success: false,
          error: error.message || 'Unexpected processing error',
          safe_mode: true
        };
        
        processingDetails.push(detail);

        await supabase.rpc('complete_analysis_queue_item', {
          queue_id_param: item.id,
          success: false,
          error_message_param: detail.error
        });
        
        failureCount++;
      }
    }

    const result = {
      success: true,
      safe_mode: true,
      message: 'Safe mode processing completed',
      processed: successCount + failureCount,
      successful: successCount,
      failed: failureCount,
      dlq_rate: failureCount / Math.max(1, successCount + failureCount),
      processing_details: processingDetails,
      config: configMap,
      timestamp: new Date().toISOString()
    };

    console.log('🏁 Safe mode processing summary:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Safe mode processor error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      safe_mode: true,
      error: error.message || 'Safe mode processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});