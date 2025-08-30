import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create service role client for internal operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 [Queue Processor] Starting LinkedIn enrichment queue processing...');

    // Step 1: Fetch all queued LinkedIn enrichment records
    const { data: queuedRecords, error: fetchError } = await supabaseClient
      .from('deal_enrichment_linkedin_export')
      .select('*')
      .eq('processing_status', 'queued')
      .order('created_at', { ascending: true })
      .limit(10); // Process up to 10 records at a time

    if (fetchError) {
      console.error('❌ [Queue Processor] Error fetching queued records:', fetchError);
      throw new Error(`Failed to fetch queued records: ${fetchError.message}`);
    }

    if (!queuedRecords || queuedRecords.length === 0) {
      console.log('✅ [Queue Processor] No queued LinkedIn enrichment records found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No records in queue',
        processedCount: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 [Queue Processor] Found ${queuedRecords.length} queued records to process`);

    let processedCount = 0;
    let errorCount = 0;

    // Step 2: Process each queued record
    for (const record of queuedRecords) {
      try {
        console.log(`🚀 [Queue Processor] Processing record ${record.id} for deal ${record.deal_id}`);

        // Update status to 'processing'
        await supabaseClient
          .from('deal_enrichment_linkedin_export')
          .update({ 
            processing_status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id);

        // Step 3: Call the brightdata-linkedin-enrichment function
        const enrichmentResponse = await supabaseClient.functions.invoke('brightdata-linkedin-enrichment', {
          body: {
            dealId: record.deal_id,
            companyName: record.company_name,
            linkedinUrl: record.linkedin_url
          }
        });

        if (enrichmentResponse.error) {
          console.error(`❌ [Queue Processor] Enrichment failed for record ${record.id}:`, enrichmentResponse.error);
          
          // Update status to 'failed'
          await supabaseClient
            .from('deal_enrichment_linkedin_export')
            .update({ 
              processing_status: 'failed',
              error_details: enrichmentResponse.error.message || 'Enrichment API call failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', record.id);
          
          errorCount++;
        } else {
          console.log(`✅ [Queue Processor] Successfully processed record ${record.id}`);
          
          // The brightdata-linkedin-enrichment function handles updating the record
          // so we don't need to update it here - it will be updated with 'processed' status
          processedCount++;
        }

        // Add small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (recordError) {
        console.error(`💥 [Queue Processor] Error processing record ${record.id}:`, recordError);
        
        // Update status to 'failed'
        await supabaseClient
          .from('deal_enrichment_linkedin_export')
          .update({ 
            processing_status: 'failed',
            error_details: recordError.message || 'Unknown processing error',
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id);
        
        errorCount++;
      }
    }

    console.log(`🏁 [Queue Processor] Processing complete. Processed: ${processedCount}, Errors: ${errorCount}`);

    // Step 4: Log activity for queue processing
    if (processedCount > 0) {
      // Get a sample deal_id for activity logging
      const sampleDealId = queuedRecords[0].deal_id;
      
      try {
        // Get deal info for activity logging
        const { data: dealInfo } = await supabaseClient
          .from('deals')
          .select('fund_id, created_by')
          .eq('id', sampleDealId)
          .single();

        if (dealInfo) {
          await supabaseClient
            .from('activity_events')
            .insert({
              user_id: dealInfo.created_by,
              fund_id: dealInfo.fund_id,
              activity_type: 'enrichment_batch_processed',
              title: 'LinkedIn Enrichment Queue Processed',
              description: `Processed ${processedCount} LinkedIn enrichment requests from queue`,
              context_data: {
                processed_count: processedCount,
                error_count: errorCount,
                total_records: queuedRecords.length,
                processor: 'linkedin-enrichment-queue-processor'
              },
              priority: 'low'
            });
        }
      } catch (activityError) {
        console.error('⚠️ [Queue Processor] Failed to log activity:', activityError);
        // Don't fail the entire operation for activity logging errors
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Queue processing complete`,
      processedCount,
      errorCount,
      totalRecords: queuedRecords.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 [Queue Processor] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'LinkedIn enrichment queue processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});