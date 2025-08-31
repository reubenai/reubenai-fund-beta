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
    console.log('🧪 [Test LinkedIn Profile] Starting test...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test the LinkedIn profile enrichment with a queued record
    console.log('🔍 [Test] Fetching a queued LinkedIn profile record...');
    
    const { data: queuedRecord } = await supabase
      .from('deal2_enrichment_linkedin_profile_export')
      .select('*')
      .eq('processing_status', 'queued')
      .limit(1)
      .single();

    if (!queuedRecord) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No queued records found to test' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🧪 [Test] Testing with record: ${queuedRecord.founder_name}`);

    // Test the enrichment function
    const { data: result, error } = await supabase.functions.invoke(
      'brightdata-linkedin-profile-enrichment-v2',
      {
        body: {
          dealId: queuedRecord.deal_id,
          firstName: queuedRecord.first_name,
          lastName: queuedRecord.last_name,
        }
      }
    );

    console.log('✅ [Test] Enrichment result:', result);
    console.log('❌ [Test] Enrichment error:', error);

    return new Response(JSON.stringify({
      success: !error,
      testRecord: queuedRecord.founder_name,
      result: result,
      error: error?.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 [Test] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});