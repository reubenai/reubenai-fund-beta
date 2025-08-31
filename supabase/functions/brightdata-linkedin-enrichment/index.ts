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
      { linkedin_url: linkedinUrl }
    ]);

    const triggerResponse = await fetch(
      'https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l7q9zka38m5alp2y9j&include_errors=true&type=discover_new&discover_by=url',
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
    
    // Update existing record with snapshot_id
    console.log(`🔍 [LinkedIn Enrichment] Updating record for dealId: ${dealId}`);
    
    const updateResult = await supabase
      .from('deal2_enrichment_linkedin_export')
      .update({
        snapshot_id: actualSnapshotId,
        processing_status: 'triggered',
        error_details: null,
        updated_at: new Date().toISOString(),
      })
      .eq('deal_id', dealId);

    if (updateResult.error) {
      console.error(`❌ [LinkedIn Enrichment] Failed to store trigger:`, updateResult.error);
      throw new Error(`Failed to store trigger: ${updateResult.error.message}`);
    }

    console.log(`✅ [LinkedIn Enrichment] Trigger stored successfully`);

    const response: BrightdataResponse = {
      success: true,
      data: { snapshot_id: actualSnapshotId, status: 'triggered' },
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