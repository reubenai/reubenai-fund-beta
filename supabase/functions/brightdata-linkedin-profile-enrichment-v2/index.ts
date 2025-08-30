import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrightdataProfileRequest {
  dealId: string;
  firstName: string;
  lastName: string;
}

interface BrightdataProfileResponse {
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
    console.log('🚀 [LinkedIn Profile V2] Starting enrichment request processing');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { dealId, firstName, lastName }: BrightdataProfileRequest = await req.json();
    
    if (!dealId || !firstName || !lastName) {
      throw new Error('Missing required fields: dealId, firstName, lastName');
    }

    console.log(`🔍 [LinkedIn Profile V2] Enriching profile: ${firstName} ${lastName}`);

    // Get BrightData API key from environment
    const brightdataApiKey = Deno.env.get('BRIGHTDATA_API_KEY');
    if (!brightdataApiKey) {
      throw new Error('BrightData API key not configured');
    }

    // Generate unique snapshot ID
    const snapshotId = `profile_${dealId}_${Date.now()}`;
    console.log(`📝 [LinkedIn Profile V2] Generated snapshot ID: ${snapshotId}`);

    // Trigger BrightData profile search
    console.log(`🚀 [LinkedIn Profile V2] Triggering profile search for: ${firstName} ${lastName}`);
    
    const triggerData = JSON.stringify([
      { first_name: firstName, last_name: lastName }
    ]);

    const triggerResponse = await fetch(
      'https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l1viktl72bvl7bjuj0&include_errors=true&type=discover_new&discover_by=name',
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
    console.log(`✅ [LinkedIn Profile V2] Trigger response:`, triggerResult);

    const actualSnapshotId = triggerResult.snapshot_id;
    
    // Poll for data
    console.log(`🔄 [LinkedIn Profile V2] Polling for data with snapshot_id: ${actualSnapshotId}`);
    const snapshotData = await pollBrightdataSnapshot(actualSnapshotId, brightdataApiKey);
    console.log(`✅ [LinkedIn Profile V2] Data ready for snapshot ${actualSnapshotId}`);
    console.log(`✅ [LinkedIn Profile V2] Final data retrieved:`, snapshotData);

    // Check for existing record
    console.log(`🔍 [LinkedIn Profile V2] Checking for existing profile record with dealId: ${dealId}`);
    const { data: existingRecord } = await supabase
      .from('deal2_enrichment_linkedin_profile_export')
      .select('id, processing_status')
      .eq('deal_id', dealId)
      .single();

    let upsertResult;
    
    if (existingRecord) {
      // Update existing record
      console.log(`📝 [LinkedIn Profile V2] Updating existing record (id: ${existingRecord.id}, status: ${existingRecord.processing_status})`);
      
      upsertResult = await supabase
        .from('deal2_enrichment_linkedin_profile_export')
        .update({
          snapshot_id: actualSnapshotId,
          raw_brightdata_response: snapshotData,
          processing_status: 'completed',
          error_details: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRecord.id);
        
    } else {
      // Create new record
      console.log(`📝 [LinkedIn Profile V2] Creating new profile record`);
      
      upsertResult = await supabase
        .from('deal2_enrichment_linkedin_profile_export')
        .insert({
          deal_id: dealId,
          founder_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
          snapshot_id: actualSnapshotId,
          raw_brightdata_response: snapshotData,
          processing_status: 'completed',
        });
    }

    if (upsertResult.error) {
      console.error(`❌ [LinkedIn Profile V2] Failed to store LinkedIn profile response:`, upsertResult.error);
      throw new Error(`Failed to store LinkedIn profile response: ${upsertResult.error.message}`);
    }

    console.log(`✅ [LinkedIn Profile V2] Raw LinkedIn profile response stored successfully`);
    console.log(`✅ [LinkedIn Profile V2] Updated ${upsertResult.data?.length || 1} record(s)`);

    const response: BrightdataProfileResponse = {
      success: true,
      data: snapshotData,
      dataSource: 'brightdata_linkedin_profile',
      trustScore: 95,
      dataQuality: 90,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`❌ [LinkedIn Profile V2] Enrichment error:`, error);
    
    const response: BrightdataProfileResponse = {
      success: false,
      error: error.message,
      dataSource: 'brightdata_linkedin_profile',
      trustScore: 0,
      dataQuality: 0,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function pollBrightdataSnapshot(snapshotId: string, apiKey: string): Promise<any> {
  const maxAttempts = 10;
  let attempt = 1;
  
  console.log(`🔄 [LinkedIn Profile V2] Polling snapshot ${snapshotId}...`);

  while (attempt <= maxAttempts) {
    console.log(`📊 [LinkedIn Profile V2] Poll attempt ${attempt}/${maxAttempts}`);
    
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
      console.log(`✅ [LinkedIn Profile V2] Data ready for snapshot ${snapshotId}`);
      return data;
    }

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
    console.log(`⏱️ [LinkedIn Profile V2] Waiting ${delay}ms before next poll...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    attempt++;
  }

  throw new Error(`Timeout: Data not ready after ${maxAttempts} attempts`);
}