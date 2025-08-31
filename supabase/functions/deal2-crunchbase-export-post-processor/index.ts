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
    console.log('🔄 [Crunchbase Post Processor] Starting Crunchbase post-processing...');

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Fetch records with 'triggered' status that have snapshot_id
    const { data: triggeredRecords, error: fetchError } = await supabaseClient
      .from('deal2_enrichment_crunchbase_export')
      .select('*')
      .eq('processing_status', 'triggered')
      .not('snapshot_id', 'is', null)
      .limit(10);

    if (fetchError) {
      console.log(`❌ [Crunchbase Post Processor] Error fetching triggered records: ${fetchError.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch triggered records: ${fetchError.message}`,
          processed: 0
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!triggeredRecords || triggeredRecords.length === 0) {
      console.log('📋 [Crunchbase Post Processor] No triggered records found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No triggered records to process',
          processed: 0
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    console.log(`📋 [Crunchbase Post Processor] Found ${triggeredRecords.length} triggered records to process`);

    let processedCount = 0;
    let errorCount = 0;

    // Step 2: Process each record
    for (const record of triggeredRecords) {
      try {
        console.log(`🚀 [Crunchbase Post Processor] Processing record ${record.id} with snapshot_id ${record.snapshot_id}`);

        // Step 2a: Update status to 'processing'
        await supabaseClient
          .from('deal2_enrichment_crunchbase_export')
          .update({ 
            processing_status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id);

        // Step 2b: Poll BrightData for results
        const snapshotUrl = `https://api.brightdata.com/datasets/v3/snapshot/${record.snapshot_id}?format=json`;
        
        console.log(`📡 [Crunchbase Post Processor] Polling BrightData for snapshot ${record.snapshot_id}`);

        const snapshotResponse = await fetch(snapshotUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('BRIGHTDATA_API_KEY')}`,
          }
        });

        if (!snapshotResponse.ok) {
          if (snapshotResponse.status === 202) {
            // Data not ready yet, reset to 'triggered' status
            console.log(`⏳ [Crunchbase Post Processor] Data not ready for snapshot ${record.snapshot_id}, will retry later`);
            await supabaseClient
              .from('deal2_enrichment_crunchbase_export')
              .update({ 
                processing_status: 'triggered',
                updated_at: new Date().toISOString()
              })
              .eq('id', record.id);
            continue;
          } else {
            throw new Error(`BrightData snapshot error: ${snapshotResponse.status} - ${snapshotResponse.statusText}`);
          }
        }

        // Step 2c: Get the data
        const snapshotData = await snapshotResponse.json();
        console.log(`📊 [Crunchbase Post Processor] Received data for record ${record.id}`);

        // Step 2d: Update record with data and set status to 'completed'
        const { error: updateError } = await supabaseClient
          .from('deal2_enrichment_crunchbase_export')
          .update({
            raw_brightdata_response: snapshotData,
            processing_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id);

        if (updateError) {
          throw new Error(`Failed to update record with data: ${updateError.message}`);
        }

        console.log(`✅ [Crunchbase Post Processor] Successfully processed record ${record.id}`);
        processedCount++;

      } catch (processingError) {
        console.log(`❌ [Crunchbase Post Processor] Processing error for record ${record.id}: ${processingError.message}`);
        
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

    console.log(`🏁 [Crunchbase Post Processor] Processing complete. Processed: ${processedCount}, Errors: ${errorCount}`);

    // Log activity if any records were processed
    if (processedCount > 0 || errorCount > 0) {
      try {
        await supabaseClient
          .from('activity_events')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000', // System user
            fund_id: '00000000-0000-0000-0000-000000000000', // System fund
            activity_type: 'crunchbase_post_processing_batch_completed',
            title: 'Crunchbase Post-Processing Batch Completed',
            description: `Post-processed ${processedCount} records successfully, ${errorCount} errors`,
            context_data: {
              processor: 'deal2-crunchbase-export-post-processor',
              processed_count: processedCount,
              error_count: errorCount,
              total_records: triggeredRecords.length
            },
            priority: 'low',
            occurred_at: new Date().toISOString()
          });
      } catch (activityError) {
        console.log(`⚠️ [Crunchbase Post Processor] Failed to log activity: ${activityError.message}`);
        // Don't fail the whole operation for logging issues
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        errors: errorCount,
        total_records: triggeredRecords.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.log(`❌ [Crunchbase Post Processor] Fatal error: ${error.message}`);
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