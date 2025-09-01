import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Manual Comprehensive Research Trigger - Starting...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { batchSize = 10, dryRun = true, dealId } = await req.json();

    console.log(`📊 Manual trigger - batch size: ${batchSize}, dry run: ${dryRun}, specific deal: ${dealId || 'none'}`);

    // Build the request payload for the processor
    const processorPayload = {
      batchSize,
      dryRun
    };

    // If specific dealId provided, first check if it exists and is queued
    if (dealId) {
      const { data: specificRequest, error: requestError } = await supabase
        .from('perplexity_datamining_vc')
        .select('id, company_name, processing_status')
        .eq('deal_id', dealId)
        .maybeSingle();

      if (requestError) {
        throw new Error(`Failed to check deal: ${requestError.message}`);
      }

      if (!specificRequest) {
        return new Response(JSON.stringify({
          success: false,
          error: `No research request found for deal ID: ${dealId}`
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (specificRequest.processing_status !== 'queued') {
        return new Response(JSON.stringify({
          success: false,
          error: `Deal ${dealId} (${specificRequest.company_name}) has status: ${specificRequest.processing_status}. Only 'queued' requests can be processed.`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`🎯 Targeting specific deal: ${specificRequest.company_name} (${dealId})`);
      
      // For specific deal, force batch size of 1 and ensure it's processed
      processorPayload.batchSize = 1;
      
      // Temporarily update the created_at to ensure it's first in queue
      await supabase
        .from('perplexity_datamining_vc')
        .update({ created_at: new Date().toISOString() })
        .eq('id', specificRequest.id);
    }

    // Call the processor function
    console.log('🔄 Invoking comprehensive research processor...');
    
    const { data: processorResult, error: processorError } = await supabase.functions.invoke(
      'perplexity-comprehensive-research-processor',
      {
        body: processorPayload
      }
    );

    if (processorError) {
      console.error('❌ Processor invocation error:', processorError);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to invoke processor: ${processorError.message}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Processor completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: dealId ? 
        `Manual processing triggered for deal ${dealId}` : 
        `Manual batch processing triggered (${batchSize} items, dry run: ${dryRun})`,
      processor_result: processorResult,
      manual_trigger: true,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Manual trigger error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});