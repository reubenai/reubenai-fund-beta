import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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

    const { dealId, firstName, lastName }: BrightdataProfileRequest = await req.json();
    
    if (!firstName || !lastName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'First name and last name are required for LinkedIn profile enrichment',
        dataSource: 'brightdata'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 [Brightdata Profile] Enriching profile: ${firstName} ${lastName}`);

    const brightdataApiKey = Deno.env.get('BRIGHTDATA_API_KEY');
    if (!brightdataApiKey) {
      throw new Error('Brightdata API key not configured');
    }

    // Step 1: Trigger Brightdata profile data collection
    console.log(`🚀 [Brightdata Profile] Triggering profile search for: ${firstName} ${lastName}`);
    const triggerResponse = await fetch('https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l1viktl72bvl7bjuj0&include_errors=true&type=discover_new&discover_by=name', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${brightdataApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ first_name: firstName, last_name: lastName }])
    });

    if (!triggerResponse.ok) {
      const errorText = await triggerResponse.text();
      console.error(`❌ [Brightdata Profile] Trigger Error: ${triggerResponse.status} - ${errorText}`);
      
      return new Response(JSON.stringify({
        success: false,
        error: `Brightdata profile trigger error: ${triggerResponse.status} - ${errorText}`,
        dataSource: 'brightdata'
      }), {
        status: triggerResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const triggerData = await triggerResponse.json();
    console.log(`✅ [Brightdata Profile] Trigger response:`, JSON.stringify(triggerData, null, 2));
    
    const snapshotId = triggerData.snapshot_id;
    if (!snapshotId) {
      throw new Error('No snapshot_id returned from Brightdata profile trigger');
    }

    // Step 2: Poll for actual data using the snapshot_id
    console.log(`🔄 [Brightdata Profile] Polling for data with snapshot_id: ${snapshotId}`);
    const brightdataData = await pollBrightdataSnapshot(snapshotId, brightdataApiKey);
    console.log(`✅ [Brightdata Profile] Final data retrieved:`, JSON.stringify(brightdataData, null, 2));

    // Process and structure the Brightdata response
    const processedData = await processBrightdataProfileResponse(brightdataData, firstName, lastName, dealId, snapshotId, supabaseClient);
    
    // Store the enrichment result in deal_analysis_sources for backward compatibility
    await supabaseClient.from('deal_analysis_sources').insert({
      deal_id: dealId,
      engine_name: 'brightdata-linkedin-profile-enrichment',
      source_type: 'linkedin_profile_api',
      data_retrieved: processedData,
      confidence_score: processedData.dataQuality || 85,
      validated: true,
      source_url: processedData.url || null
    });

    console.log(`✅ [Brightdata Profile] Profile enrichment completed for ${firstName} ${lastName}`);

    return new Response(JSON.stringify({
      success: true,
      data: processedData,
      dataSource: 'brightdata',
      trustScore: 95,
      dataQuality: processedData.dataQuality || 85
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [Brightdata Profile] Enrichment error:', error);
    
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

async function processBrightdataProfileResponse(rawData: any, firstName: string, lastName: string, dealId: string, snapshotId: string, supabaseClient: any): Promise<any> {
  console.log(`🔄 [Brightdata Profile] Processing response for ${firstName} ${lastName}`);
  
  // Handle different response formats from Brightdata
  let profileData = rawData;
  
  // If response is an array, take the first item
  if (Array.isArray(rawData) && rawData.length > 0) {
    profileData = rawData[0];
  }
  
  // If response has a data property, use that
  if (rawData.data) {
    profileData = rawData.data;
  }

  // Extract from raw response structure - use direct field mapping where possible
  let sourceData = profileData;
  
  // If raw_response exists and has data, extract from it
  if (rawData.raw_response && Array.isArray(rawData.raw_response) && rawData.raw_response.length > 0) {
    sourceData = rawData.raw_response[0];
  } else if (Array.isArray(rawData) && rawData.length > 0) {
    sourceData = rawData[0];
  }
  
  // Store structured LinkedIn profile export data with proper field mapping
  const linkedinProfileExportData = {
    deal_id: dealId,
    snapshot_id: snapshotId,
    timestamp: new Date().toISOString(),
    
    // Profile identification
    url: sourceData.url || null,
    name: sourceData.name || `${firstName} ${lastName}`,
    first_name: sourceData.first_name || firstName,
    last_name: sourceData.last_name || lastName,
    
    // Profile details
    about: sourceData.about || sourceData.description || null,
    followers: sourceData.followers || null,
    connections: sourceData.connections || null,
    position: sourceData.position || sourceData.current_position || null,
    
    // Current role and company
    current_company: sourceData.current_company || null,
    current_company_name: sourceData.current_company_name || null,
    current_company_company_id: sourceData.current_company_company_id || null,
    
    // Experience and background
    experience: sourceData.experience || [],
    education: sourceData.education || [],
    educations_details: sourceData.educations_details || sourceData.education_details || [],
    
    // Professional development
    courses: sourceData.courses || [],
    certifications: sourceData.certifications || [],
    honors_and_awards: sourceData.honors_and_awards || sourceData.awards || [],
    volunteer_experience: sourceData.volunteer_experience || [],
    organizations: sourceData.organizations || [],
    
    // Activity and content
    posts: sourceData.posts || [],
    activity: sourceData.activity || [],
    
    // Professional network
    recommendations_count: sourceData.recommendations_count || null,
    recommendations: sourceData.recommendations || [],
    
    // Skills and expertise
    languages: sourceData.languages || [],
    projects: sourceData.projects || [],
    patents: sourceData.patents || [],
    publications: sourceData.publications || [],
    
    // Raw data and processing
    raw_brightdata_response: rawData,
    processing_status: 'processed'
  };

  // Insert into the LinkedIn profile export table with detailed error handling
  console.log('🔄 [Brightdata Profile] Attempting to insert LinkedIn profile export data...');
  console.log('📋 [Brightdata Profile] Data to insert:', JSON.stringify({
    deal_id: linkedinProfileExportData.deal_id,
    snapshot_id: linkedinProfileExportData.snapshot_id,
    name: linkedinProfileExportData.name,
    url: linkedinProfileExportData.url,
    has_raw_data: !!linkedinProfileExportData.raw_brightdata_response
  }, null, 2));

  const { data: insertData, error: insertError } = await supabaseClient
    .from('deal_enrichment_linkedin_profile_export')
    .insert(linkedinProfileExportData)
    .select();

  if (insertError) {
    console.error('❌ [Brightdata Profile] Failed to insert LinkedIn profile export:', {
      error: insertError,
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });
    
    // Try a simpler insert with just required fields
    console.log('🔄 [Brightdata Profile] Attempting simplified insert...');
    const simplifiedData = {
      deal_id: dealId,
      snapshot_id: snapshotId,
      raw_brightdata_response: rawData,
      name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      processing_status: 'raw'
    };
    
    const { error: simpleInsertError } = await supabaseClient
      .from('deal_enrichment_linkedin_profile_export')
      .insert(simplifiedData);
    
    if (simpleInsertError) {
      console.error('❌ [Brightdata Profile] Simplified insert also failed:', simpleInsertError);
    } else {
      console.log('✅ [Brightdata Profile] Simplified LinkedIn profile export saved');
    }
  } else {
    console.log('✅ [Brightdata Profile] Full LinkedIn profile export saved successfully:', insertData);
  }

  // Return legacy format for backward compatibility
  const processed = {
    name: sourceData.name || `${firstName} ${lastName}`,
    first_name: firstName,
    last_name: lastName,
    url: sourceData.url || null,
    position: sourceData.position || sourceData.current_position || null,
    current_company: sourceData.current_company || null,
    about: sourceData.about || sourceData.description || null,
    
    // Profile metrics
    followers: sourceData.followers || null,
    connections: sourceData.connections || null,
    
    // Professional background
    experience: sourceData.experience || [],
    education: sourceData.education || [],
    certifications: sourceData.certifications || [],
    skills: sourceData.skills || [],
    
    // Activity indicators
    posts_count: Array.isArray(sourceData.posts) ? sourceData.posts.length : 0,
    activity_level: calculateActivityLevel(sourceData),
    
    // Metadata
    dataQuality: calculateProfileDataQuality(sourceData),
    lastUpdated: new Date().toISOString(),
    source: 'brightdata',
    raw_response: rawData // Store full response for debugging
  };

  console.log(`✅ [Brightdata Profile] Processed data for ${firstName} ${lastName}:`, JSON.stringify(processed, null, 2));
  return processed;
}

async function pollBrightdataSnapshot(snapshotId: string, apiKey: string, maxAttempts: number = 10): Promise<any> {
  console.log(`🔄 [Brightdata Profile] Polling snapshot ${snapshotId}...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`📊 [Brightdata Profile] Poll attempt ${attempt}/${maxAttempts}`);
    
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
          console.log(`✅ [Brightdata Profile] Data ready for snapshot ${snapshotId}`);
          return data;
        }
      }
      
      // Wait before next attempt (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
      console.log(`⏱️ [Brightdata Profile] Waiting ${waitTime}ms before next poll...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
    } catch (error) {
      console.log(`❌ [Brightdata Profile] Poll attempt ${attempt} failed:`, error.message);
      if (attempt === maxAttempts) {
        throw new Error(`Failed to retrieve profile data after ${maxAttempts} attempts: ${error.message}`);
      }
    }
  }
  
  throw new Error(`Profile snapshot data not ready after ${maxAttempts} attempts`);
}

function calculateActivityLevel(data: any): string {
  const postsCount = Array.isArray(data.posts) ? data.posts.length : 0;
  const activityCount = Array.isArray(data.activity) ? data.activity.length : 0;
  const totalActivity = postsCount + activityCount;
  
  if (totalActivity > 20) return 'high';
  if (totalActivity > 5) return 'medium';
  return 'low';
}

function calculateProfileDataQuality(data: any): number {
  let score = 0;
  const fields = [
    'name', 'position', 'current_company', 'about', 
    'experience', 'education', 'url'
  ];
  
  fields.forEach(field => {
    if (data[field] && data[field] !== null && data[field] !== '') {
      score += 1;
    }
  });
  
  // Bonus points for rich data
  if (Array.isArray(data.experience) && data.experience.length > 0) score += 1;
  if (Array.isArray(data.education) && data.education.length > 0) score += 1;
  if (data.followers && data.followers > 100) score += 1;
  
  // Convert to percentage
  return Math.round((score / 10) * 100);
}