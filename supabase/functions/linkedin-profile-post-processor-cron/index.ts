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
    console.log('🔄 [LinkedIn Profile Post-Processor Cron] Starting automated post-processing...');
    
    // Initialize Supabase client with service role key for privileged operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch triggered records that need post-processing (limit to 20 to avoid overwhelming the system)
    const { data: triggeredRecords, error: fetchError } = await supabase
      .from('deal2_enrichment_linkedin_profile_export')
      .select('id, deal_id, founder_name, snapshot_id, created_at')
      .eq('processing_status', 'triggered')
      .not('snapshot_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(20);

    if (fetchError) {
      throw new Error(`Failed to fetch triggered records: ${fetchError.message}`);
    }

    if (!triggeredRecords || triggeredRecords.length === 0) {
      console.log('📋 [LinkedIn Profile Post-Processor Cron] No triggered records found');
      return new Response(JSON.stringify({ 
        message: 'No triggered records to post-process',
        processed: 0,
        errors: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`📋 [LinkedIn Profile Post-Processor Cron] Found ${triggeredRecords.length} triggered records to post-process`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each triggered record
    for (const record of triggeredRecords) {
      try {
        console.log(`🚀 [LinkedIn Profile Post-Processor Cron] Post-processing record ${record.id} for deal ${record.deal_id}`);
        
        // Update status to processing to avoid double-processing
        await supabase
          .from('deal2_enrichment_linkedin_profile_export')
          .update({ 
            processing_status: 'post_processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id);

        // Call the post-processor function
        const { data: postProcessResult, error: postProcessError } = await supabase.functions.invoke(
          'deal2-linkedin-profile-export-post-processor',
          {
            body: {
              dealId: record.deal_id,
              linkedinProfileExportId: record.id,
            },
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (postProcessError) {
          throw postProcessError;
        }

        if (!postProcessResult?.success) {
          throw new Error(postProcessResult?.error || 'Post-processing failed without specific error');
        }

        console.log(`✅ [LinkedIn Profile Post-Processor Cron] Successfully post-processed record ${record.id}`);
        processedCount++;

      } catch (error) {
        console.error(`❌ [LinkedIn Profile Post-Processor Cron] Post-processing failed for record ${record.id}:`, error);
        errorCount++;

        // Revert status back to triggered so it can be retried later
        await supabase
          .from('deal2_enrichment_linkedin_profile_export')
          .update({
            processing_status: 'triggered',
            error_details: `Cron post-processing failed: ${error.message || 'Unknown error'}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.id);
      }

      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`🏁 [LinkedIn Profile Post-Processor Cron] Processing complete. Processed: ${processedCount}, Errors: ${errorCount}`);

    // Log activity if any records were processed
    if (triggeredRecords.length > 0) {
      try {
        await supabase
          .from('activity_events')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000', // System user
            fund_id: '00000000-0000-0000-0000-000000000000', // Will be populated by trigger if needed
            activity_type: 'enrichment_batch_processed',
            title: 'LinkedIn Profile Post-Processing Batch Completed',
            description: `Auto-processed ${processedCount} LinkedIn profile post-processing requests, ${errorCount} errors`,
            context_data: {
              processor: 'linkedin-profile-post-processor-cron',
              total_records: triggeredRecords.length,
              successful: processedCount,
              failed: errorCount,
              timestamp: new Date().toISOString(),
            },
          });
      } catch (activityError) {
        console.error('❌ [LinkedIn Profile Post-Processor Cron] Failed to log activity:', activityError);
        // Don't throw here - activity logging failure shouldn't break the main process
      }
    }

    return new Response(JSON.stringify({
      message: `LinkedIn Profile post-processing batch complete`,
      total_records: triggeredRecords.length,
      processed: processedCount,
      errors: errorCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ [LinkedIn Profile Post-Processor Cron] Cron processing error:', error);
    
    return new Response(JSON.stringify({
      error: 'Cron post-processing failed',
      details: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});