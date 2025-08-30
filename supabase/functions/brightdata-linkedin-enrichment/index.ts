import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrightdataRequest {
  dealId: string;
  companyName: string;
  linkedinUrl?: string;
}

interface BrightdataResponse {
  success: boolean;
  data?: any;
  error?: string;
  dataSource: 'brightdata';
  trustScore: number;
  dataQuality: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create service role client for internal operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { dealId, companyName, linkedinUrl }: BrightdataRequest = await req.json();
    
    if (!linkedinUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'LinkedIn URL is required for Brightdata enrichment',
        dataSource: 'brightdata'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 [Brightdata] Enriching company: ${companyName} with LinkedIn: ${linkedinUrl}`);

    const brightdataApiKey = Deno.env.get('BRIGHTDATA_API_KEY');
    if (!brightdataApiKey) {
      throw new Error('Brightdata API key not configured');
    }

    // Step 1: Trigger Brightdata data collection
    console.log(`🚀 [Brightdata] Triggering data collection for: ${linkedinUrl}`);
    const triggerResponse = await fetch('https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l1vikfnt1wgvvqz95w&include_errors=true', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${brightdataApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ url: linkedinUrl }])
    });

    if (!triggerResponse.ok) {
      const errorText = await triggerResponse.text();
      console.error(`❌ [Brightdata] Trigger Error: ${triggerResponse.status} - ${errorText}`);
      
      return new Response(JSON.stringify({
        success: false,
        error: `Brightdata trigger error: ${triggerResponse.status} - ${errorText}`,
        dataSource: 'brightdata'
      }), {
        status: triggerResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const triggerData = await triggerResponse.json();
    console.log(`✅ [Brightdata] Trigger response:`, JSON.stringify(triggerData, null, 2));
    
    const snapshotId = triggerData.snapshot_id;
    if (!snapshotId) {
      throw new Error('No snapshot_id returned from Brightdata trigger');
    }

    // Step 2: Poll for actual data using the snapshot_id
    console.log(`🔄 [Brightdata] Polling for data with snapshot_id: ${snapshotId}`);
    const brightdataData = await pollBrightdataSnapshot(snapshotId, brightdataApiKey);
    console.log(`✅ [Brightdata] Final data retrieved:`, JSON.stringify(brightdataData, null, 2));

    // Check if record exists before updating
    console.log(`🔍 [Brightdata] Checking for existing record with dealId: ${dealId}`);
    const { data: existingRecord, error: selectError } = await supabaseClient
      .from('deal2_enrichment_linkedin_export')
      .select('id, processing_status')
      .eq('deal_id', dealId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ [Brightdata] Error checking for existing record:', selectError);
      throw new Error(`Failed to check for existing record: ${selectError.message}`);
    }

    // Store the raw Brightdata response using upsert pattern
    if (existingRecord) {
      console.log(`📝 [Brightdata] Updating existing record (id: ${existingRecord.id}, status: ${existingRecord.processing_status})`);
      const { data: updatedData, error: updateError } = await supabaseClient
        .from('deal2_enrichment_linkedin_export')
        .update({
          raw_brightdata_response: brightdataData,
          processing_status: 'completed',
          snapshot_id: snapshotId,
          timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('deal_id', dealId)
        .select();

      if (updateError) {
        console.error('❌ [Brightdata] Failed to update LinkedIn response:', updateError);
        throw new Error(`Failed to update LinkedIn response: ${updateError.message}`);
      }

      console.log(`✅ [Brightdata] Updated ${updatedData?.length || 0} record(s)`);
    } else {
      console.log(`📝 [Brightdata] No existing record found, creating new record`);
      const { data: insertedData, error: insertError } = await supabaseClient
        .from('deal2_enrichment_linkedin_export')
        .insert({
          deal_id: dealId,
          company_name: companyName,
          linkedin_url: linkedinUrl,
          raw_brightdata_response: brightdataData,
          processing_status: 'completed',
          snapshot_id: snapshotId,
          timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (insertError) {
        console.error('❌ [Brightdata] Failed to insert LinkedIn response:', insertError);
        throw new Error(`Failed to insert LinkedIn response: ${insertError.message}`);
      }

      console.log(`✅ [Brightdata] Inserted new record with id: ${insertedData?.[0]?.id}`);
    }

    console.log('✅ [Brightdata] Raw LinkedIn response stored successfully');

    return new Response(JSON.stringify({
      success: true,
      data: { stored: true, snapshot_id: snapshotId },
      dataSource: 'brightdata',
      trustScore: 95,
      dataQuality: 85
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [Brightdata] Enrichment error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      dataSource: 'brightdata'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Remove the complex processing function - we're storing raw data only

async function pollBrightdataSnapshot(snapshotId: string, apiKey: string, maxAttempts: number = 10): Promise<any> {
  console.log(`🔄 [Brightdata] Polling snapshot ${snapshotId}...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`📊 [Brightdata] Poll attempt ${attempt}/${maxAttempts}`);
    
    try {
      const response = await fetch(`https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if data is ready
        if (data && data.length > 0 && data[0] && Object.keys(data[0]).length > 1) {
          console.log(`✅ [Brightdata] Data ready for snapshot ${snapshotId}`);
          return data;
        }
      }
      
      // Wait before next attempt (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
      console.log(`⏱️ [Brightdata] Waiting ${waitTime}ms before next poll...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
    } catch (error) {
      console.log(`❌ [Brightdata] Poll attempt ${attempt} failed:`, error.message);
      if (attempt === maxAttempts) {
        throw new Error(`Failed to retrieve data after ${maxAttempts} attempts: ${error.message}`);
      }
    }
  }
  
  throw new Error(`Snapshot data not ready after ${maxAttempts} attempts`);
}