import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrightdataRequest {
  dealId: string;
  companyName: string;
  linkedinUrl: string;
}

interface BrightdataResponse {
  success: boolean;
  data?: any;
  error?: string;
  dataSource: string;
  trustScore: number;
  dataQuality: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [LinkedIn Enrichment] Starting enrichment request processing');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { dealId, companyName, linkedinUrl }: BrightdataRequest = await req.json();
    
    if (!dealId || !companyName || !linkedinUrl) {
      throw new Error('Missing required fields: dealId, companyName, linkedinUrl');
    }

    console.log(`🔍 [LinkedIn Enrichment] Enriching: ${companyName} (${linkedinUrl})`);

    // Get BrightData API key from environment
    const brightdataApiKey = Deno.env.get('BRIGHTDATA_API_KEY');
    if (!brightdataApiKey) {
      throw new Error('BrightData API key not configured');
    }

    // Trigger BrightData LinkedIn company search
    console.log(`🚀 [LinkedIn Enrichment] Triggering BrightData for: ${companyName}`);
    
    const triggerData = JSON.stringify([
      { url: linkedinUrl }
    ]);

    const triggerResponse = await fetch(
      'https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l1vikfnt1wgvvqz95w&include_errors=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${brightdataApiKey}`,
          'Content-Type': 'application/json',
        },
        body: triggerData,
      }
    );

    if (!triggerResponse.ok) {
      throw new Error(`BrightData trigger failed: ${triggerResponse.status} ${triggerResponse.statusText}`);
    }

    const triggerResult = await triggerResponse.json();
    console.log(`✅ [LinkedIn Enrichment] Trigger response:`, triggerResult);

    const actualSnapshotId = triggerResult.snapshot_id;
    
    // Poll for data collection completion
    console.log(`🔄 [LinkedIn Enrichment] Polling for data completion...`);
    const collectedData = await pollBrightdataSnapshot(actualSnapshotId, brightdataApiKey);
    
    // Check if record already exists in the table
    console.log(`🔍 [LinkedIn Enrichment] Checking for existing record with dealId: ${dealId}`);
    const { data: existingRecords, error: checkError } = await supabase
      .from('deal2_enrichment_linkedin_export')
      .select('id')
      .eq('deal_id', dealId);

    if (checkError) {
      console.error(`❌ [LinkedIn Enrichment] Error checking existing records:`, checkError);
      throw new Error(`Database check failed: ${checkError.message}`);
    }

    let dbResult;
    if (existingRecords && existingRecords.length > 0) {
      // Update existing record
      console.log(`🔄 [LinkedIn Enrichment] Updating existing record for dealId: ${dealId}`);
      dbResult = await supabase
        .from('deal2_enrichment_linkedin_export')
        .update({
          company_name: companyName,
          linkedin_url: linkedinUrl,
          snapshot_id: actualSnapshotId,
          raw_brightdata_response: collectedData,
          processing_status: 'raw',
          error_details: null,
          updated_at: new Date().toISOString(),
        })
        .eq('deal_id', dealId);
    } else {
      // Insert new record
      console.log(`➕ [LinkedIn Enrichment] Creating new record for dealId: ${dealId}`);
      dbResult = await supabase
        .from('deal2_enrichment_linkedin_export')
        .insert({
          deal_id: dealId,
          company_name: companyName,
          linkedin_url: linkedinUrl,
          snapshot_id: actualSnapshotId,
          raw_brightdata_response: collectedData,
          processing_status: 'raw',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    if (dbResult.error) {
      console.error(`❌ [LinkedIn Enrichment] Failed to store data:`, dbResult.error);
      throw new Error(`Failed to store data: ${dbResult.error.message}`);
    }

    console.log(`✅ [LinkedIn Enrichment] Data stored successfully with raw status`);

    const response: BrightdataResponse = {
      success: true,
      data: { 
        snapshot_id: actualSnapshotId, 
        status: 'raw',
        records_count: collectedData?.length || 0
      },
      dataSource: 'brightdata_linkedin',
      trustScore: 95,
      dataQuality: 90,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`❌ [LinkedIn Enrichment] Enrichment error:`, error);
    
    const response: BrightdataResponse = {
      success: false,
      error: error.message,
      dataSource: 'brightdata_linkedin',
      trustScore: 0,
      dataQuality: 0,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Helper function to poll BrightData for snapshot completion
async function pollBrightdataSnapshot(snapshotId: string, apiKey: string, maxAttempts = 10): Promise<any> {
  console.log(`🔄 [LinkedIn Enrichment] Starting to poll snapshot: ${snapshotId}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`📡 [LinkedIn Enrichment] Poll attempt ${attempt}/${maxAttempts} for snapshot ${snapshotId}`);
    
    try {
      const response = await fetch(
        `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      console.log(`📡 [LinkedIn Enrichment] Poll response status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 [LinkedIn Enrichment] Received data length: ${data?.length || 0}`);
        
        if (data && data.length > 0) {
          console.log(`✅ [LinkedIn Enrichment] Data ready for snapshot ${snapshotId}`);
          return data;
        } else {
          console.log(`⏳ [LinkedIn Enrichment] Data not ready yet for snapshot ${snapshotId}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ [LinkedIn Enrichment] Poll response error: ${response.status} - ${errorText}`);
        
        // If it's a 404, the snapshot might not exist or be ready yet
        if (response.status === 404) {
          console.log(`🔍 [LinkedIn Enrichment] Snapshot ${snapshotId} not found yet, continuing...`);
        } else {
          console.log(`❌ [LinkedIn Enrichment] Non-404 error, will retry: ${response.status}`);
        }
      }

      // Wait before next poll (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
      console.log(`⏱️ [LinkedIn Enrichment] Waiting ${waitTime}ms before next poll...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
    } catch (pollError) {
      console.error(`❌ [LinkedIn Enrichment] Poll attempt ${attempt} failed:`, pollError);
      if (attempt === maxAttempts) {
        throw pollError;
      }
    }
  }
  
  throw new Error(`Failed to get data after ${maxAttempts} attempts`);
}