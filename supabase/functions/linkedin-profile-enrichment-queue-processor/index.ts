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
    console.log('🔄 [LinkedIn Profile Queue Processor] Starting queue processing...');
    
    // Initialize Supabase client with service role key for privileged operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch queued records (limit to 10 to avoid overwhelming the system)
    const { data: queuedRecords, error: fetchError } = await supabase
      .from('deal2_enrichment_linkedin_profile_export')
      .select('id, deal_id, founder_name, first_name, last_name')
      .eq('processing_status', 'queued')
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      throw new Error(`Failed to fetch queued records: ${fetchError.message}`);
    }

    if (!queuedRecords || queuedRecords.length === 0) {
      console.log('📋 [LinkedIn Profile Queue Processor] No queued records found');
      return new Response(JSON.stringify({ 
        message: 'No queued records to process',
        processed: 0,
        errors: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`📋 [LinkedIn Profile Queue Processor] Found ${queuedRecords.length} queued records to process`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each queued record
    for (const record of queuedRecords) {
      try {
        console.log(`🚀 [LinkedIn Profile Queue Processor] Processing record ${record.id} for deal ${record.deal_id}`);
        
        // Update status to processing
        await supabase
          .from('deal2_enrichment_linkedin_profile_export')
          .update({ 
            processing_status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id);

        // Call the LinkedIn profile enrichment V2 function (now handles complete workflow)
        const { data: enrichmentResult, error: enrichmentError } = await supabase.functions.invoke(
          'brightdata-linkedin-profile-enrichment-v2',
          {
            body: {
              dealId: record.deal_id,
              firstName: record.first_name,
              lastName: record.last_name,
            },
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (enrichmentError) {
          throw enrichmentError;
        }

        if (!enrichmentResult?.success) {
          throw new Error(enrichmentResult?.error || 'Enrichment failed without specific error');
        }

        console.log(`✅ [LinkedIn Profile Queue Processor] Complete enrichment workflow succeeded for record ${record.id}`);
        processedCount++;

      } catch (error) {
        console.error(`❌ [LinkedIn Profile Queue Processor] Enrichment failed for record ${record.id}:`, error);
        errorCount++;

        // Update record status to failed with error details
        await supabase
          .from('deal2_enrichment_linkedin_profile_export')
          .update({
            processing_status: 'failed',
            error_details: error.message || 'Unknown error during enrichment',
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.id);
      }

      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`🏁 [LinkedIn Profile Queue Processor] Processing complete. Processed: ${processedCount}, Errors: ${errorCount}`);

    // Log activity if any records were processed
    if (queuedRecords.length > 0) {
      try {
        await supabase
          .from('activity_events')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000', // System user
            fund_id: '00000000-0000-0000-0000-000000000000', // Will be populated by trigger if needed
            activity_type: 'enrichment_batch_processed',
            title: 'LinkedIn Profile Enrichment Batch Processed',
            description: `Processed ${processedCount} LinkedIn profile enrichment requests, ${errorCount} errors`,
            context_data: {
              processor: 'linkedin-profile-enrichment-queue-processor',
              total_records: queuedRecords.length,
              successful: processedCount,
              failed: errorCount,
              timestamp: new Date().toISOString(),
            },
          });
      } catch (activityError) {
        console.error('❌ [LinkedIn Profile Queue Processor] Failed to log activity:', activityError);
        // Don't throw here - activity logging failure shouldn't break the main process
      }
    }

    return new Response(JSON.stringify({
      message: `LinkedIn Profile enrichment batch complete`,
      total_records: queuedRecords.length,
      processed: processedCount,
      errors: errorCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ [LinkedIn Profile Queue Processor] Queue processing error:', error);
    
    return new Response(JSON.stringify({
      error: 'Queue processing failed',
      details: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});