import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`🚀 [Manual Founder Processor] Starting manual processing...`);

    // Call the perplexity-founder-post-processor function
    const { data, error } = await supabase.functions.invoke('perplexity-founder-post-processor', {
      body: { forceReprocess: true }
    });

    if (error) {
      console.error(`❌ [Manual Founder Processor] Error calling post-processor:`, error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ [Manual Founder Processor] Post-processor completed:`, data);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Manual founder enrichment processing triggered',
        result: data
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ [Manual Founder Processor] Fatal error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});