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
    console.log('🔄 [Crunchbase Queue Processor] Starting Crunchbase enrichment queue processing...');

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Fetch queued records (limit to 10 for this batch)
    const { data: queuedRecords, error: fetchError } = await supabaseClient
      .from('deal2_enrichment_crunchbase_export')
      .select('*')
      .eq('processing_status', 'queued')
      .limit(10);

    if (fetchError) {
      console.log(`❌ [Crunchbase Queue Processor] Error fetching queued records: ${fetchError.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch queued records: ${fetchError.message}`,
          processed: 0
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!queuedRecords || queuedRecords.length === 0) {
      console.log('📋 [Crunchbase Queue Processor] No queued records found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No queued records to process',
          processed: 0
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    console.log(`📋 [Crunchbase Queue Processor] Found ${queuedRecords.length} queued records to process`);

    let processedCount = 0;
    let errorCount = 0;

    // Step 2: Process each record
    for (const record of queuedRecords) {
      try {
        console.log(`🚀 [Crunchbase Queue Processor] Processing record ${record.id} for deal ${record.deal_id}`);

        // Step 2a: Update status to 'processing'
        await supabaseClient
          .from('deal2_enrichment_crunchbase_export')
          .update({ 
            processing_status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id);

        // Step 2b: Call BrightData API
        const brightDataPayload = JSON.stringify([{
          "url": record.crunchbase_url
        }]);

        console.log(`📡 [Crunchbase Queue Processor] Calling BrightData API for ${record.crunchbase_url}`);

        const brightDataResponse = await fetch(
          'https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l1vijqt9jfj7olije&include_errors=true',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('BRIGHTDATA_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: brightDataPayload
          }
        );

        if (!brightDataResponse.ok) {
          throw new Error(`BrightData API error: ${brightDataResponse.status} - ${brightDataResponse.statusText}`);
        }

        const brightDataResult = await brightDataResponse.json();
        console.log(`📊 [Crunchbase Queue Processor] BrightData response:`, brightDataResult);

        // Step 2c: Extract snapshot_id from response
        const snapshotId = brightDataResult.snapshot_id;

        if (!snapshotId) {
          throw new Error('No snapshot_id received from BrightData API');
        }

        // Step 2d: Update record with snapshot_id and set status to 'triggered'
        const { error: updateError } = await supabaseClient
          .from('deal2_enrichment_crunchbase_export')
          .update({
            snapshot_id: snapshotId,
            processing_status: 'triggered',
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id);

        if (updateError) {
          throw new Error(`Failed to update record with snapshot_id: ${updateError.message}`);
        }

        console.log(`✅ [Crunchbase Queue Processor] Successfully processed record ${record.id}, snapshot_id: ${snapshotId}`);
        processedCount++;

      } catch (processingError) {
        console.log(`❌ [Crunchbase Queue Processor] Processing error for record ${record.id}: ${processingError.message}`);
        
        // Update record status to failed
        await supabaseClient
          .from('deal2_enrichment_crunchbase_export')
          .update({ 
            processing_status: 'failed',
            error_details: processingError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id);
        
        errorCount++;
      }

      // Add a small delay between processing to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`🏁 [Crunchbase Queue Processor] Processing complete. Processed: ${processedCount}, Errors: ${errorCount}`);

    // Log activity if any records were processed
    if (processedCount > 0 || errorCount > 0) {
      try {
        await supabaseClient
          .from('activity_events')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000', // System user
            fund_id: '00000000-0000-0000-0000-000000000000', // System fund
            activity_type: 'crunchbase_enrichment_batch_processed',
            title: 'Crunchbase Enrichment Batch Processed',
            description: `Processed ${processedCount} records successfully, ${errorCount} errors`,
            context_data: {
              processor: 'crunchbase-enrichment-queue-processor',
              processed_count: processedCount,
              error_count: errorCount,
              total_records: queuedRecords.length
            },
            priority: 'low',
            occurred_at: new Date().toISOString()
          });
      } catch (activityError) {
        console.log(`⚠️ [Crunchbase Queue Processor] Failed to log activity: ${activityError.message}`);
        // Don't fail the whole operation for logging issues
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        errors: errorCount,
        total_records: queuedRecords.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.log(`❌ [Crunchbase Queue Processor] Fatal error: ${error.message}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        processed: 0
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});