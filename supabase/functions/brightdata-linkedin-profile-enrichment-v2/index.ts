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

interface BrightDataSnapshot {
  status: string;
  data?: any[];
  error?: string;
}

// Polling function to check BrightData snapshot status
async function pollBrightdataSnapshot(snapshotId: string, apiKey: string, maxAttempts = 20): Promise<BrightDataSnapshot> {
  const baseDelay = 30000; // Start with 30 seconds
  const maxDelay = 300000; // Max 5 minutes
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔄 [LinkedIn Profile V2] Polling attempt ${attempt}/${maxAttempts} for snapshot: ${snapshotId}`);
    
    try {
      const response = await fetch(
        `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`⏳ [LinkedIn Profile V2] Snapshot not ready yet (404), waiting...`);
        } else {
          throw new Error(`BrightData API error: ${response.status} ${response.statusText}`);
        }
      } else {
        const data = await response.json();
        console.log(`📊 [LinkedIn Profile V2] Snapshot status:`, data);
        
        if (data && Array.isArray(data) && data.length > 0) {
          return { status: 'ready', data };
        } else {
          console.log(`⏳ [LinkedIn Profile V2] Data not ready yet, waiting...`);
        }
      }
    } catch (error) {
      console.error(`⚠️ [LinkedIn Profile V2] Polling error on attempt ${attempt}:`, error);
      
      if (attempt === maxAttempts) {
        throw new Error(`Failed to retrieve data after ${maxAttempts} attempts: ${error.message}`);
      }
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1), maxDelay);
    console.log(`⏳ [LinkedIn Profile V2] Waiting ${delay / 1000} seconds before next attempt...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw new Error(`Timeout: Failed to retrieve data after ${maxAttempts} attempts`);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [LinkedIn Profile V2] Starting complete enrichment workflow');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { dealId, firstName, lastName }: BrightdataProfileRequest = await req.json();
    
    if (!dealId || !firstName || !lastName) {
      throw new Error('Missing required fields: dealId, firstName, lastName');
    }

    console.log(`🔍 [LinkedIn Profile V2] Processing: ${firstName} ${lastName} (Deal: ${dealId})`);

    // Get BrightData API key from environment
    const brightdataApiKey = Deno.env.get('BRIGHTDATA_API_KEY');
    if (!brightdataApiKey) {
      throw new Error('BrightData API key not configured');
    }

    // Check for existing record to determine if this is recovery or new processing
    console.log(`🔍 [LinkedIn Profile V2] Checking for existing profile record`);
    const { data: existingRecord } = await supabase
      .from('deal2_enrichment_linkedin_profile_export')
      .select('id, processing_status, snapshot_id, first_name, last_name')
      .eq('deal_id', dealId)
      .single();

    let actualSnapshotId: string;
    let isRecovery = false;

    // Set processing status to 'processing'
    if (existingRecord) {
      console.log(`📝 [LinkedIn Profile V2] Found existing record (status: ${existingRecord.processing_status})`);
      
      if (existingRecord.snapshot_id && existingRecord.processing_status === 'triggered') {
        // Recovery mode: use existing snapshot_id
        actualSnapshotId = existingRecord.snapshot_id;
        isRecovery = true;
        console.log(`🔄 [LinkedIn Profile V2] Recovery mode: using existing snapshot_id: ${actualSnapshotId}`);
      } else {
        // Need to trigger new search
        console.log(`🚀 [LinkedIn Profile V2] Triggering new BrightData search`);
        const triggerResult = await triggerBrightDataSearch(firstName, lastName, brightdataApiKey);
        actualSnapshotId = triggerResult.snapshot_id;
      }

      // Update to processing status
      await supabase
        .from('deal2_enrichment_linkedin_profile_export')
        .update({
          snapshot_id: actualSnapshotId,
          processing_status: 'processing',
          error_details: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRecord.id);
        
    } else {
      // Create new record and trigger search
      console.log(`🚀 [LinkedIn Profile V2] Creating new record and triggering search`);
      const triggerResult = await triggerBrightDataSearch(firstName, lastName, brightdataApiKey);
      actualSnapshotId = triggerResult.snapshot_id;
      
      const insertResult = await supabase
        .from('deal2_enrichment_linkedin_profile_export')
        .insert({
          deal_id: dealId,
          founder_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
          snapshot_id: actualSnapshotId,
          processing_status: 'processing',
        });

      if (insertResult.error) {
        throw new Error(`Failed to create profile record: ${insertResult.error.message}`);
      }
    }

    // Poll for data completion
    console.log(`⏳ [LinkedIn Profile V2] Starting polling for snapshot: ${actualSnapshotId}`);
    const snapshotResult = await pollBrightdataSnapshot(actualSnapshotId, brightdataApiKey);

    if (!snapshotResult.data || snapshotResult.data.length === 0) {
      throw new Error('No LinkedIn profile data found');
    }

    // Extract and process the LinkedIn profile data
    const linkedinData = snapshotResult.data[0];
    console.log(`📊 [LinkedIn Profile V2] Retrieved LinkedIn data:`, {
      name: linkedinData.name,
      headline: linkedinData.headline,
      company: linkedinData.company,
      location: linkedinData.location
    });

    // Update record with complete data and set status to completed
    const updateResult = await supabase
      .from('deal2_enrichment_linkedin_profile_export')
      .update({
        processing_status: 'completed',
        linkedin_data: linkedinData,
        profile_url: linkedinData.profile_url || null,
        headline: linkedinData.headline || null,
        location: linkedinData.location || null,
        company: linkedinData.company || null,
        connections_count: linkedinData.connections_count || null,
        followers_count: linkedinData.followers_count || null,
        experience: linkedinData.experience || null,
        education: linkedinData.education || null,
        skills: linkedinData.skills || null,
        updated_at: new Date().toISOString(),
        error_details: null,
      })
      .eq('deal_id', dealId)
      .eq('snapshot_id', actualSnapshotId);

    if (updateResult.error) {
      throw new Error(`Failed to update profile with complete data: ${updateResult.error.message}`);
    }

    console.log(`✅ [LinkedIn Profile V2] Successfully completed enrichment for ${firstName} ${lastName}`);

    const response: BrightdataProfileResponse = {
      success: true,
      data: {
        snapshot_id: actualSnapshotId,
        status: 'completed',
        profile: {
          name: linkedinData.name,
          headline: linkedinData.headline,
          company: linkedinData.company,
          location: linkedinData.location,
          profile_url: linkedinData.profile_url,
        },
        isRecovery
      },
      dataSource: 'brightdata_linkedin_profile',
      trustScore: 95,
      dataQuality: 95,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`❌ [LinkedIn Profile V2] Complete enrichment error:`, error);
    
    // Try to update record with error status
    try {
      const { dealId } = await req.json().catch(() => ({}));
      if (dealId) {
        const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        await supabase
          .from('deal2_enrichment_linkedin_profile_export')
          .update({
            processing_status: 'failed',
            error_details: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq('deal_id', dealId);
      }
    } catch (updateError) {
      console.error(`❌ [LinkedIn Profile V2] Failed to update error status:`, updateError);
    }
    
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

// Helper function to trigger BrightData search
async function triggerBrightDataSearch(firstName: string, lastName: string, apiKey: string) {
  console.log(`🚀 [LinkedIn Profile V2] Triggering BrightData search for: ${firstName} ${lastName}`);
  
  const triggerData = JSON.stringify([
    { first_name: firstName, last_name: lastName }
  ]);

  const triggerResponse = await fetch(
    'https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l1viktl72bvl7bjuj0&include_errors=true&type=discover_new&discover_by=name',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: triggerData,
    }
  );

  if (!triggerResponse.ok) {
    throw new Error(`BrightData trigger failed: ${triggerResponse.status} ${triggerResponse.statusText}`);
  }

  const triggerResult = await triggerResponse.json();
  console.log(`✅ [LinkedIn Profile V2] Trigger successful, snapshot_id: ${triggerResult.snapshot_id}`);
  
  return triggerResult;
}