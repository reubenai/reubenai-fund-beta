import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔥 [Manual Test] Triggering LinkedIn profile queue processor...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Manually trigger the queue processor
    console.log('🚀 [Manual Test] Invoking linkedin-profile-enrichment-queue-processor...');
    
    const { data: result, error } = await supabase.functions.invoke(
      'linkedin-profile-enrichment-queue-processor',
      {
        body: {},
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ [Manual Test] Queue processor result:', result);
    
    if (error) {
      console.error('❌ [Manual Test] Queue processor error:', error);
    }

    return new Response(JSON.stringify({
      success: !error,
      result: result,
      error: error?.message,
      message: 'Queue processor triggered manually'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 [Manual Test] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});