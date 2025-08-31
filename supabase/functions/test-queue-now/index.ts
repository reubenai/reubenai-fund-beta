import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔥 [TEST QUEUE] Starting manual LinkedIn profile queue test...');
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Step 1: Check current queue status
    console.log('📊 [TEST] Checking queue status...');
    const { data: beforeQueue } = await supabase
      .from('deal2_enrichment_linkedin_profile_export')
      .select('id, founder_name, processing_status')
      .eq('processing_status', 'queued');

    console.log('📋 [TEST] Queued records before processing:', beforeQueue?.length || 0);

    // Step 2: Fetch one queued record to process manually
    const { data: testRecord } = await supabase
      .from('deal2_enrichment_linkedin_profile_export')
      .select('*')
      .eq('processing_status', 'queued')
      .limit(1)
      .single();

    if (!testRecord) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No queued records found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🎯 [TEST] Testing with: ${testRecord.founder_name}`);

    // Step 3: Update record to processing status
    console.log('🔄 [TEST] Setting record to processing...');
    await supabase
      .from('deal2_enrichment_linkedin_profile_export')
      .update({ 
        processing_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', testRecord.id);

    // Step 4: Call BrightData API directly
    console.log('🚀 [TEST] Calling BrightData API...');
    const brightDataKey = Deno.env.get('BRIGHTDATA_API_KEY');
    console.log('🔑 [TEST] API Key available:', !!brightDataKey);

    if (!brightDataKey) {
      throw new Error('BRIGHTDATA_API_KEY not found');
    }

    const requestData = JSON.stringify([{
      "first_name": testRecord.first_name,
      "last_name": testRecord.last_name
    }]);

    console.log('📤 [TEST] BrightData request:', requestData);

    const brightDataResponse = await fetch(
      "https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l1viktl72bvl7bjuj0&include_errors=true&type=discover_new&discover_by=name",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${brightDataKey}`,
          "Content-Type": "application/json"
        },
        body: requestData
      }
    );

    const brightDataResult = await brightDataResponse.text();
    console.log('📥 [TEST] BrightData response status:', brightDataResponse.status);
    console.log('📥 [TEST] BrightData response:', brightDataResult);

    let parsedResult;
    try {
      parsedResult = JSON.parse(brightDataResult);
    } catch (e) {
      parsedResult = { raw: brightDataResult };
    }

    // Step 5: Update record with result
    if (brightDataResponse.ok && parsedResult.snapshot_id) {
      console.log('✅ [TEST] Got snapshot_id:', parsedResult.snapshot_id);
      
      await supabase
        .from('deal2_enrichment_linkedin_profile_export')
        .update({
          snapshot_id: parsedResult.snapshot_id,
          processing_status: 'triggered',
          updated_at: new Date().toISOString()
        })
        .eq('id', testRecord.id);

      console.log('✅ [TEST] Record updated with snapshot_id');
    } else {
      console.log('❌ [TEST] BrightData call failed');
      
      await supabase
        .from('deal2_enrichment_linkedin_profile_export')
        .update({
          processing_status: 'failed',
          error_details: `BrightData API error: ${brightDataResult}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', testRecord.id);
    }

    return new Response(JSON.stringify({
      success: brightDataResponse.ok,
      testRecord: testRecord.founder_name,
      brightDataStatus: brightDataResponse.status,
      brightDataResult: parsedResult,
      message: 'Manual queue test completed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 [TEST] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});