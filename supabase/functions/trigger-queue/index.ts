const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [Trigger] Manually calling LinkedIn queue processor...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Make direct HTTP call to the queue processor
    const queueProcessorUrl = `${supabaseUrl}/functions/v1/linkedin-profile-enrichment-queue-processor`;
    
    console.log('📞 [Trigger] Calling:', queueProcessorUrl);
    
    const response = await fetch(queueProcessorUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    const responseText = await response.text();
    console.log('📋 [Trigger] Response status:', response.status);
    console.log('📋 [Trigger] Response body:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { message: responseText };
    }
    
    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      response: responseData,
      message: 'Queue processor manually triggered'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 [Trigger] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});