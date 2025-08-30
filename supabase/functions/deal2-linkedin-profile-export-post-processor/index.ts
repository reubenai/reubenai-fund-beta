import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostProcessingResult {
  recordId: string;
  founderName: string;
  success: boolean;
  error?: string;
}

interface PostProcessingResponse {
  success: boolean;
  processed: number;
  results: PostProcessingResult[];
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

    const { dealId, linkedinProfileExportId } = await req.json();
    console.log('🔄 Processing deal2_enrichment_linkedin_profile_export records', { dealId, linkedinProfileExportId });

    // Build query to fetch records to process
    let query = supabase
      .from('deal2_enrichment_linkedin_profile_export')
      .select('*')
      .eq('processing_status', 'triggered')
      .not('snapshot_id', 'is', null);

    if (dealId) {
      query = query.eq('deal_id', dealId);
    }

    if (linkedinProfileExportId) {
      query = query.eq('id', linkedinProfileExportId);
    }

    const { data: records, error: fetchError } = await query;

    if (fetchError) {
      console.error('❌ Error fetching records:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!records || records.length === 0) {
      console.log('ℹ️ No records found to process');
      return new Response(
        JSON.stringify({ success: true, processed: 0, results: [] }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const results: PostProcessingResult[] = [];
    const brightdataApiKey = Deno.env.get('BRIGHTDATA_API_KEY');
    if (!brightdataApiKey) {
      throw new Error('BrightData API key not configured');
    }

    for (const record of records) {
      console.log(`🔄 Processing ${record.founder_name} (${record.id})`);
      
      try {
        // Poll BrightData for the data using stored snapshot_id
        console.log(`🔄 [LinkedIn Profile Post-Processor] Polling for data with snapshot_id: ${record.snapshot_id}`);
        const snapshotData = await pollBrightdataSnapshot(record.snapshot_id, brightdataApiKey);
        console.log(`✅ [LinkedIn Profile Post-Processor] Data ready for snapshot ${record.snapshot_id}`);
        
        // Update record with retrieved data
        const { error: updateError } = await supabase
          .from('deal2_enrichment_linkedin_profile_export')
          .update({
            raw_brightdata_response: snapshotData,
            processing_status: 'completed',
            error_details: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.id);

        if (updateError) {
          throw new Error(`Failed to update record: ${updateError.message}`);
        }

        console.log(`✅ [LinkedIn Profile Post-Processor] Raw LinkedIn profile response stored for ${record.founder_name}`);
        
        results.push({
          recordId: record.id,
          founderName: record.founder_name,
          success: true
        });

        console.log(`✅ Successfully processed ${record.founder_name}`);
      } catch (error) {
        console.error(`❌ Error processing ${record.founder_name}:`, error);
        
        // Update record with error status
        await supabase
          .from('deal2_enrichment_linkedin_profile_export')
          .update({
            processing_status: 'failed',
            error_details: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.id);
        
        results.push({
          recordId: record.id,
          founderName: record.founder_name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const response: PostProcessingResponse = {
      success: true,
      processed: results.filter(r => r.success).length,
      results
    };

    console.log('✅ LinkedIn Profile Post-processing completed:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function pollBrightdataSnapshot(snapshotId: string, apiKey: string): Promise<any> {
  const maxAttempts = 10;
  let attempt = 1;
  
  console.log(`🔄 [LinkedIn Profile Post-Processor] Polling snapshot ${snapshotId}...`);

  while (attempt <= maxAttempts) {
    console.log(`📊 [LinkedIn Profile Post-Processor] Poll attempt ${attempt}/${maxAttempts}`);
    
    const response = await fetch(
      `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Snapshot polling failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data && Array.isArray(data) && data.length > 0) {
      console.log(`✅ [LinkedIn Profile Post-Processor] Data ready for snapshot ${snapshotId}`);
      return data;
    }

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
    console.log(`⏱️ [LinkedIn Profile Post-Processor] Waiting ${delay}ms before next poll...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    attempt++;
  }

  throw new Error(`Timeout: Data not ready after ${maxAttempts} attempts`);
}