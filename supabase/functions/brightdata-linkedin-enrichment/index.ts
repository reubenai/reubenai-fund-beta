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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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

    // Call Brightdata API with the exact format from the curl command
    const brightdataResponse = await fetch('https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l1vikfnt1wgvvqz95w&include_errors=true', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${brightdataApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ url: linkedinUrl }])
    });

    if (!brightdataResponse.ok) {
      const errorText = await brightdataResponse.text();
      console.error(`❌ [Brightdata] API Error: ${brightdataResponse.status} - ${errorText}`);
      
      return new Response(JSON.stringify({
        success: false,
        error: `Brightdata API error: ${brightdataResponse.status} - ${errorText}`,
        dataSource: 'brightdata'
      }), {
        status: brightdataResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const brightdataData = await brightdataResponse.json();
    console.log(`✅ [Brightdata] Raw response:`, JSON.stringify(brightdataData, null, 2));

    // Process and structure the Brightdata response
    const processedData = await processBrightdataResponse(brightdataData, companyName);
    
    // Store the enrichment result in deal_analysis_sources
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

async function processBrightdataResponse(rawData: any, companyName: string): Promise<any> {
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

  // Extract key information from Brightdata response
  const processed = {
    company_name: companyData.company_name || companyData.name || companyName,
    employee_count: companyData.employee_count || companyData.employees || null,
    industry: companyData.industry || companyData.sector || null,
    location: companyData.location || companyData.headquarters || null,
    description: companyData.description || companyData.about || null,
    website: companyData.website || companyData.company_website || null,
    founded_year: companyData.founded || companyData.founded_year || null,
    company_size: companyData.company_size || null,
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