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
    console.log('🚀 Manual VC Comprehensive Research Trigger - Starting...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { batchSize = 10, dryRun = true, dealId } = await req.json();

    console.log(`📊 Manual VC trigger - batch size: ${batchSize}, dry run: ${dryRun}, specific deal: ${dealId || 'none'}`);

    // If specific dealId provided, validate it's a VC deal
    if (dealId) {
      const { data: specificRequest, error: requestError } = await supabase
        .from('perplexity_datamining_vc')
        .select(`
          id, company_name, processing_status,
          deals!inner(
            fund_id,
            funds!inner(fund_type)
          )
        `)
        .eq('deal_id', dealId)
        .eq('deals.funds.fund_type', 'venture_capital')
        .maybeSingle();

      if (requestError) {
        throw new Error(`Failed to check VC deal: ${requestError.message}`);
      }

      if (!specificRequest) {
        return new Response(JSON.stringify({
          success: false,
          error: `No VC research request found for deal ID: ${dealId} or deal is not from a venture capital fund`
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (specificRequest.processing_status !== 'queued') {
        return new Response(JSON.stringify({
          success: false,
          error: `VC Deal ${dealId} (${specificRequest.company_name}) has status: ${specificRequest.processing_status}. Only 'queued' requests can be processed.`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`🎯 Targeting specific VC deal: ${specificRequest.company_name} (${dealId})`);
    }

    // Call the VC processor function
    console.log('🔄 Invoking VC comprehensive research processor...');
    
    const { data: processorResult, error: processorError } = await supabase.functions.invoke(
      'perplexity-vc-comprehensive-research-processor',
      {
        body: { batchSize, dryRun }
      }
    );

    if (processorError) {
      console.error('❌ VC Processor invocation error:', processorError);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to invoke VC processor: ${processorError.message}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ VC Processor completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: dealId ? 
        `Manual VC processing triggered for deal ${dealId}` : 
        `Manual VC batch processing triggered (${batchSize} items, dry run: ${dryRun})`,
      processor_result: processorResult,
      manual_trigger: true,
      fund_type: 'venture_capital',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Manual VC trigger error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      fund_type: 'venture_capital'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});