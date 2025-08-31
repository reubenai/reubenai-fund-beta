import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 [Cron] Starting periodic Crunchbase post-processor...');

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if there are any triggered records to process
    const { data: triggeredRecords, error: checkError } = await supabaseClient
      .from('deal2_enrichment_crunchbase_export')
      .select('id, deal_id, company_name, processing_status, snapshot_id, created_at')
      .eq('processing_status', 'triggered')
      .not('snapshot_id', 'is', null);

    if (checkError) {
      console.log(`❌ [Cron] Error checking triggered records: ${checkError.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to check triggered records: ${checkError.message}`,
          processed: 0
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!triggeredRecords || triggeredRecords.length === 0) {
      console.log('📋 [Cron] No triggered records found to process');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No triggered records to process',
          processed: 0
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    console.log(`📋 [Cron] Found ${triggeredRecords.length} triggered records, invoking post-processor...`);

    // Call the actual post-processor function
    const postProcessorResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/deal2-crunchbase-export-post-processor`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      }
    );

    const postProcessorResult = await postProcessorResponse.json();

    if (!postProcessorResponse.ok) {
      throw new Error(`Post-processor failed: ${postProcessorResult.error || 'Unknown error'}`);
    }

    console.log(`✅ [Cron] Post-processor completed successfully. Processed: ${postProcessorResult.processed}, Errors: ${postProcessorResult.errors || 0}`);

    // Log the cron activity
    try {
      await supabaseClient
        .from('activity_events')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // System user
          fund_id: '00000000-0000-0000-0000-000000000000', // System fund
          activity_type: 'crunchbase_post_processing_cron_completed',
          title: 'Crunchbase Post-Processing Cron Completed',
          description: `Cron job processed ${postProcessorResult.processed} records successfully, ${postProcessorResult.errors || 0} errors`,
          context_data: {
            cron_trigger: 'automated',
            processed_count: postProcessorResult.processed,
            error_count: postProcessorResult.errors || 0,
            triggered_records_found: triggeredRecords.length
          },
          priority: 'low',
          occurred_at: new Date().toISOString()
        });
    } catch (activityError) {
      console.log(`⚠️ [Cron] Failed to log activity: ${activityError.message}`);
      // Don't fail the whole operation for logging issues
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: postProcessorResult.processed,
        errors: postProcessorResult.errors || 0,
        triggered_records_found: triggeredRecords.length,
        cron_execution: 'completed'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.log(`❌ [Cron] Fatal error: ${error.message}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        processed: 0,
        cron_execution: 'failed'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});