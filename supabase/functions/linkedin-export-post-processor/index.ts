import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostProcessRequest {
  dealId?: string;
  linkedinExportId?: string;
  forceReprocess?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { dealId, linkedinExportId, forceReprocess = false }: PostProcessRequest = await req.json();

    console.log(`🔄 [Post-Processor] Starting post-processing...`);
    console.log(`📊 [Post-Processor] Deal ID: ${dealId}, Export ID: ${linkedinExportId}, Force: ${forceReprocess}`);

    // Build query to find records to process
    let query = supabase
      .from('deal2_enrichment_linkedin_export')
      .select('*')
      .eq('processing_status', 'raw');

    if (dealId) {
      query = query.eq('deal_id', dealId);
    }
    if (linkedinExportId) {
      query = query.eq('id', linkedinExportId);
    }

    const { data: rawRecords, error: fetchError } = await query;

    if (fetchError) {
      console.error(`❌ [Post-Processor] Error fetching raw records:`, fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 [Post-Processor] Found ${rawRecords?.length || 0} raw records to process`);

    const results = [];

    for (const record of rawRecords || []) {
      try {
        console.log(`🔄 [Post-Processor] Processing record ${record.id} for ${record.company_name}`);

        // Update processing status
        await supabase
          .from('deal2_enrichment_linkedin_export')
          .update({ processing_status: 'processing' })
          .eq('id', record.id);

        // Extract data from raw_brightdata_response
        const rawData = record.raw_brightdata_response;
        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
          console.log(`⚠️ [Post-Processor] No raw data found for record ${record.id}`);
          continue;
        }

        const firstRecord = rawData[0];

        // Helper function to convert string to array
        const stringToArray = (value: string | null): string[] => {
          if (!value) return [];
          if (typeof value === 'string') {
            return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
          }
          return [];
        };

        // Extract and update structured data
        const updateData = {
          company_name: firstRecord?.name || record.company_name,
          website: firstRecord?.website || null,
          founded: firstRecord?.founded || null,
          team_size: firstRecord?.employees || [],
          headquarters: firstRecord?.headquarters || null,
          industry: firstRecord?.industries || null,
          description: firstRecord?.about || null,
          specialties: firstRecord?.specialties ? stringToArray(firstRecord.specialties) : [],
          linkedin_followers: firstRecord?.followers || null,
          linkedin_updates: firstRecord?.updates || [],
          key_personnel: firstRecord?.employees || [],
          processing_status: 'processed',
          updated_at: new Date().toISOString()
        };

        console.log(`📊 [Post-Processor] Updating record with:`, updateData);

        const { error: updateError } = await supabase
          .from('deal2_enrichment_linkedin_export')
          .update(updateData)
          .eq('id', record.id);

        if (updateError) {
          console.error(`❌ [Post-Processor] Error updating record ${record.id}:`, updateError);
          
          // Mark as failed
          await supabase
            .from('deal2_enrichment_linkedin_export')
            .update({ processing_status: 'failed' })
            .eq('id', record.id);

          results.push({
            id: record.id,
            company_name: record.company_name,
            success: false,
            error: updateError.message
          });
        } else {
          console.log(`✅ [Post-Processor] Successfully processed ${record.company_name}`);
          results.push({
            id: record.id,
            company_name: record.company_name,
            success: true
          });
        }

      } catch (recordError) {
        console.error(`❌ [Post-Processor] Error processing record ${record.id}:`, recordError);
        
        // Mark as failed
        await supabase
          .from('deal2_enrichment_linkedin_export')
          .update({ processing_status: 'failed' })
          .eq('id', record.id);

        results.push({
          id: record.id,
          company_name: record.company_name,
          success: false,
          error: recordError.message
        });
      }
    }

    console.log(`✅ [Post-Processor] Completed processing ${results.length} records`);

    return new Response(
      JSON.stringify({
        success: true,
        processed_count: results.length,
        results: results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ [Post-Processor] Fatal error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});