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

    // Process and structure the Brightdata response
    const processedData = await processBrightdataResponse(brightdataData, companyName, dealId, snapshotId, supabaseClient);
    
    // Store the enrichment result in deal_analysis_sources for backward compatibility
    await supabaseClient.from('deal_analysis_sources').insert({
      deal_id: dealId,
      engine_name: 'brightdata-linkedin-enrichment',
      source_type: 'linkedin_api',
      data_retrieved: processedData,
      confidence_score: processedData.dataQuality || 85,
      validated: true,
      source_url: linkedinUrl
    });

    console.log(`✅ [Brightdata] Enrichment completed for ${companyName}`);

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

async function processBrightdataResponse(rawData: any, companyName: string, dealId: string, snapshotId: string, supabaseClient: any): Promise<any> {
  console.log(`🔄 [Brightdata] Processing response for ${companyName}`);
  
  // Handle different response formats from Brightdata
  let companyData = rawData;
  
  // If response is an array, take the first item
  if (Array.isArray(rawData) && rawData.length > 0) {
    companyData = rawData[0];
  }
  
  // If response has a data property, use that
  if (rawData.data) {
    companyData = rawData.data;
  }

  // Extract from raw response structure - use direct field mapping where possible
  let sourceData = companyData;
  
  // If raw_response exists and has data, extract from it
  if (rawData.raw_response && Array.isArray(rawData.raw_response) && rawData.raw_response.length > 0) {
    sourceData = rawData.raw_response[0];
  } else if (Array.isArray(rawData) && rawData.length > 0) {
    sourceData = rawData[0];
  }
  
  // Store structured LinkedIn export data with proper field mapping
  const linkedinExportData = {
    deal_id: dealId,
    snapshot_id: snapshotId,
    timestamp: new Date().toISOString(),
    
    // Company identification - direct mapping where field names match
    company_id: sourceData.company_id || sourceData.id || null,
    linkedin_url: sourceData.linkedin_url || 
      (sourceData.id || sourceData.company_id ? 
        `https://www.linkedin.com/company/${sourceData.id || sourceData.company_id}` : null),
    company_name: sourceData.company_name || sourceData.name || companyName,
    
    // Company description and details - direct mapping
    about: sourceData.about || null,
    description: sourceData.about || sourceData.description || null,
    organization_type: sourceData.organization_type || null,
    industries: sourceData.industries || null,
    specialties: sourceData.specialties || [],
    slogan: sourceData.slogan || null,
    
    // Metrics and following - direct mapping where possible
    followers: sourceData.followers || null,
    employees_in_linkedin: sourceData.employees_in_linkedin || null,
    company_size: sourceData.company_size || null,
    
    // Location information - direct mapping
    headquarters: sourceData.headquarters || null,
    country_code: sourceData.country_code || null,
    country_codes_array: sourceData.country_codes || [],
    locations: sourceData.locations || [],
    formatted_locations: sourceData.formatted_locations || [],
    get_directions_url: sourceData.get_directions_url || null,
    
    // Web presence - direct mapping
    website: sourceData.website || null,
    website_simplified: sourceData.website_simplified || null,
    crunchbase_url: sourceData.crunchbase_url || null,
    
    // Financial and company data - direct mapping
    founded: sourceData.founded || null,
    funding: sourceData.funding || {},
    investors: sourceData.investors || [],
    stock_info: sourceData.stock_info || {},
    
    // Social and network data - direct mapping
    employees: sourceData.employees || [],
    alumni: sourceData.alumni || [],
    alumni_information: sourceData.alumni_information || {},
    updates: sourceData.updates || [],
    similar_companies: sourceData.similar_companies || sourceData.similar || [],
    affiliated: sourceData.affiliated || [],
    
    // Visual assets - direct mapping
    image: sourceData.image || null,
    logo: sourceData.logo || null,
    
    // Raw data and processing
    raw_brightdata_response: rawData,
    unformatted_about: sourceData.about || null,
    processing_status: 'processed'
  };

  // Insert into the new LinkedIn export table with detailed error handling
  console.log('🔄 [Brightdata] Attempting to insert LinkedIn export data...');
  console.log('📋 [Brightdata] Data to insert:', JSON.stringify({
    deal_id: linkedinExportData.deal_id,
    snapshot_id: linkedinExportData.snapshot_id,
    company_name: linkedinExportData.company_name,
    linkedin_url: linkedinExportData.linkedin_url,
    has_raw_data: !!linkedinExportData.raw_brightdata_response
  }, null, 2));

  const { data: insertData, error: insertError } = await supabaseClient
    .from('deal_enrichment_linkedin_export')
    .insert(linkedinExportData)
    .select();

  if (insertError) {
    console.error('❌ [Brightdata] Failed to insert LinkedIn export:', {
      error: insertError,
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });
    
    // Try a simpler insert with just required fields
    console.log('🔄 [Brightdata] Attempting simplified insert...');
    const simplifiedData = {
      deal_id: dealId,
      snapshot_id: snapshotId,
      raw_brightdata_response: rawData,
      company_name: companyData.name || companyName,
      processing_status: 'raw'
    };
    
    const { error: simpleInsertError } = await supabaseClient
      .from('deal_enrichment_linkedin_export')
      .insert(simplifiedData);
    
    if (simpleInsertError) {
      console.error('❌ [Brightdata] Simplified insert also failed:', simpleInsertError);
    } else {
      console.log('✅ [Brightdata] Simplified LinkedIn export saved');
    }
  } else {
    console.log('✅ [Brightdata] Full LinkedIn export saved successfully:', insertData);
  }

  // Return legacy format for backward compatibility
  const processed = {
    company_name: companyData.company_name || companyData.name || companyName,
    website: companyData.website || companyData.company_website || null,
    Founded: companyData.founded || companyData.founded_year || null,
    'Team Size': companyData.employee_count || companyData.employees || companyData.company_size || null,
    Headquarters: companyData.location || companyData.headquarters || null,
    industry: companyData.industry || companyData.sector || null,
    description: companyData.description || companyData.about || null,
    specialties: companyData.specialties || [],
    
    // LinkedIn specific data
    linkedin_followers: companyData.followers || companyData.follower_count || null,
    linkedin_updates: companyData.recent_updates || [],
    
    // Key personnel
    key_personnel: companyData.employees || companyData.leadership || [],
    
    // Financial estimates
    revenue_estimate: estimateRevenue(companyData.employee_count || companyData.employees, companyData.industry),
    
    // Metadata
    dataQuality: calculateDataQuality(companyData),
    lastUpdated: new Date().toISOString(),
    source: 'brightdata',
    raw_response: rawData // Store full response for debugging
  };

  console.log(`✅ [Brightdata] Processed data for ${companyName}:`, JSON.stringify(processed, null, 2));
  return processed;
}

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

function estimateRevenue(employeeCount: number | null, industry: string | null): number | null {
  if (!employeeCount) return null;
  
  // Industry-specific revenue per employee estimates
  const industryMultipliers: Record<string, number> = {
    'technology': 250000,
    'software': 300000,
    'financial services': 400000,
    'consulting': 200000,
    'healthcare': 180000,
    'manufacturing': 150000,
    'retail': 120000,
    'default': 200000
  };
  
  const multiplier = industry ? 
    industryMultipliers[industry.toLowerCase()] || industryMultipliers.default :
    industryMultipliers.default;
    
  return employeeCount * multiplier;
}

function calculateDataQuality(data: any): number {
  let score = 0;
  const fields = [
    'company_name', 'employee_count', 'industry', 'location', 
    'description', 'website', 'founded'
  ];
  
  fields.forEach(field => {
    if (data[field] && data[field] !== null && data[field] !== '') {
      score += 1;
    }
  });
  
  // Convert to percentage
  return Math.round((score / fields.length) * 100);
}