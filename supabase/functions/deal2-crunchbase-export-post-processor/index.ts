import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostProcessingResult {
  recordId: string;
  companyName: string;
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

    const { dealId, crunchbaseExportId } = await req.json();
    console.log('🔄 Processing deal2_enrichment_crunchbase_export records', { dealId, crunchbaseExportId });

    // Build query to fetch records to process
    let query = supabase
      .from('deal2_enrichment_crunchbase_export')
      .select('*')
      .eq('processing_status', 'completed')
      .not('raw_brightdata_response', 'is', null);

    if (dealId) {
      query = query.eq('deal_id', dealId);
    }

    if (crunchbaseExportId) {
      query = query.eq('id', crunchbaseExportId);
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

    for (const record of records) {
      console.log(`🔄 Processing ${record.company_name} (${record.id})`);
      
      try {
        // Process the raw Crunchbase data
        const processedData = await processCrunchbaseData(record, supabase);
        
        results.push({
          recordId: record.id,
          companyName: record.company_name,
          success: true
        });

        console.log(`✅ Successfully processed ${record.company_name}`);
      } catch (error) {
        console.error(`❌ Error processing ${record.company_name}:`, error);
        results.push({
          recordId: record.id,
          companyName: record.company_name,
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

    console.log('✅ Post-processing completed:', response);

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

async function processCrunchbaseData(record: any, supabase: any) {
  const rawData = record.raw_brightdata_response;
  
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    throw new Error('No valid Crunchbase data found');
  }

  const companyData = rawData[0]; // Get first item from array
  console.log('📊 Processing company data for:', companyData.name);

  // Get deal information to determine fund type
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .select(`
      id,
      fund_id,
      funds!inner(
        fund_type,
        organization_id
      )
    `)
    .eq('id', record.deal_id)
    .single();

  if (dealError) {
    throw new Error(`Failed to fetch deal: ${dealError.message}`);
  }

  const fundType = deal.funds.fund_type;
  const organizationId = deal.funds.organization_id;

  console.log(`📋 Fund type: ${fundType}, Organization: ${organizationId}`);

  // Extract and update deal fields if they're missing or empty
  await updateDealFields(record.deal_id, companyData, supabase);

  // Process datapoints based on fund type
  if (fundType === 'venture_capital' || fundType === 'vc') {
    await processVCDatapoints(record.deal_id, organizationId, companyData, supabase);
  } else if (fundType === 'private_equity' || fundType === 'pe') {
    await processPEDatapoints(record.deal_id, organizationId, companyData, supabase);
  }

  // Update the export record status
  await supabase
    .from('deal2_enrichment_crunchbase_export')
    .update({
      processing_status: 'processed',
      updated_at: new Date().toISOString()
    })
    .eq('id', record.id);

  console.log(`✅ Updated record status to processed for ${record.company_name}`);
}

async function updateDealFields(dealId: string, companyData: any, supabase: any) {
  const updates: any = {};

  // Extract founding year
  if (companyData.founded_date && !updates.founding_year) {
    const foundingYear = new Date(companyData.founded_date).getFullYear();
    if (!isNaN(foundingYear)) {
      updates.founding_year = foundingYear;
    }
  }

  // Extract employee count
  if (companyData.num_employees) {
    const employeeRange = companyData.num_employees;
    let employeeCount = null;
    
    // Parse employee ranges like "101-250", "51-100", etc.
    if (typeof employeeRange === 'string') {
      const match = employeeRange.match(/(\d+)-(\d+)/);
      if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        employeeCount = Math.floor((min + max) / 2); // Use average
      } else if (employeeRange.includes('+')) {
        const num = employeeRange.replace('+', '').replace(',', '');
        employeeCount = parseInt(num);
      }
    }
    
    if (employeeCount) {
      updates.employee_count = employeeCount;
    }
  }

  // Extract industry if not set
  if (companyData.industries && Array.isArray(companyData.industries) && companyData.industries.length > 0) {
    updates.industry = companyData.industries[0].value;
  }

  // Extract location
  if (companyData.address || (companyData.location && Array.isArray(companyData.location))) {
    let location = companyData.address;
    if (!location && companyData.location && companyData.location.length > 0) {
      location = companyData.location.map((loc: any) => loc.name).join(', ');
    }
    if (location) {
      updates.location = location;
    }
  }

  // Extract website
  if (companyData.website) {
    updates.website = companyData.website;
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();
    
    console.log('📝 Updating deal fields:', updates);
    
    const { error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', dealId);

    if (error) {
      console.error('❌ Error updating deal fields:', error);
    } else {
      console.log('✅ Deal fields updated successfully');
    }
  }
}

async function processVCDatapoints(dealId: string, organizationId: string, companyData: any, supabase: any) {
  console.log('📊 Processing VC datapoints');

  // Check if VC datapoints record exists
  const { data: existingDatapoints } = await supabase
    .from('deal_analysis_datapoints_vc')
    .select('id')
    .eq('deal_id', dealId)
    .maybeSingle();

  const vcData: any = {
    deal_id: dealId,
    fund_id: companyData.fund_id || null,
    organization_id: organizationId,
    
    // Basic company info
    employee_count: extractEmployeeCount(companyData.num_employees),
    founding_year: companyData.founded_date ? new Date(companyData.founded_date).getFullYear() : null,
    website: companyData.website,
    
    // Technology and competitive data
    technology_stack: companyData.builtwith_tech ? 
      companyData.builtwith_tech.map((tech: any) => tech.name) : [],
    competitors: companyData.similar_companies ? 
      companyData.similar_companies.map((comp: any) => comp.name) : [],
    
    // Market and industry data
    industry_focus: companyData.industries ? 
      companyData.industries.map((ind: any) => ind.value) : [],
    
    // Traffic and traction metrics
    monthly_traffic: companyData.monthly_visits || companyData.semrush_visits_latest_month,
    traffic_growth_rate: companyData.monthly_visits_growth || companyData.semrush_visits_mom_pct,
    
    // App data if available
    mobile_downloads: companyData.apptopia_total_downloads,
    
    // Heat score (market activity indicator)
    market_activity_score: companyData.heat_score,
    
    // Update metadata
    source_engines: ['crunchbase_export'],
    data_completeness_score: calculateDataCompleteness(companyData),
    updated_at: new Date().toISOString()
  };

  if (existingDatapoints) {
    console.log('📝 Updating existing VC datapoints');
    const { error } = await supabase
      .from('deal_analysis_datapoints_vc')
      .update(vcData)
      .eq('id', existingDatapoints.id);
    
    if (error) {
      console.error('❌ Error updating VC datapoints:', error);
      throw error;
    }
  } else {
    console.log('📝 Creating new VC datapoints');
    vcData.created_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('deal_analysis_datapoints_vc')
      .insert(vcData);
    
    if (error) {
      console.error('❌ Error creating VC datapoints:', error);
      throw error;
    }
  }

  console.log('✅ VC datapoints processed successfully');
}

async function processPEDatapoints(dealId: string, organizationId: string, companyData: any, supabase: any) {
  console.log('📊 Processing PE datapoints');

  // Check if PE datapoints record exists
  const { data: existingDatapoints } = await supabase
    .from('deal_analysis_datapoints_pe')
    .select('id')
    .eq('deal_id', dealId)
    .maybeSingle();

  const peData: any = {
    deal_id: dealId,
    fund_id: companyData.fund_id || null,
    organization_id: organizationId,
    
    // Basic company info
    employee_count: extractEmployeeCount(companyData.num_employees),
    founding_year: companyData.founded_date ? new Date(companyData.founded_date).getFullYear() : null,
    website: companyData.website,
    
    // Technology and operational data
    technology_stack: companyData.builtwith_tech ? 
      companyData.builtwith_tech.map((tech: any) => tech.name) : [],
    
    // Competitive landscape
    competitors: companyData.similar_companies ? 
      companyData.similar_companies.map((comp: any) => comp.name) : [],
    
    // Market presence
    countries_of_operation: companyData.headquarters_regions ? 
      companyData.headquarters_regions.map((region: any) => region.value) : [],
    
    // Key customers (if leadership info available)
    key_customers: companyData.contacts ? 
      companyData.contacts.map((contact: any) => contact.name) : [],
    
    // Operational metrics
    monthly_traffic: companyData.monthly_visits || companyData.semrush_visits_latest_month,
    market_activity_score: companyData.heat_score,
    
    // Update metadata
    source_engines: ['crunchbase_export'],
    data_completeness_score: calculateDataCompleteness(companyData),
    updated_at: new Date().toISOString()
  };

  if (existingDatapoints) {
    console.log('📝 Updating existing PE datapoints');
    const { error } = await supabase
      .from('deal_analysis_datapoints_pe')
      .update(peData)
      .eq('id', existingDatapoints.id);
    
    if (error) {
      console.error('❌ Error updating PE datapoints:', error);
      throw error;
    }
  } else {
    console.log('📝 Creating new PE datapoints');
    peData.created_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('deal_analysis_datapoints_pe')
      .insert(peData);
    
    if (error) {
      console.error('❌ Error creating PE datapoints:', error);
      throw error;
    }
  }

  console.log('✅ PE datapoints processed successfully');
}

function extractEmployeeCount(employeeRange: string | null): number | null {
  if (!employeeRange) return null;
  
  // Parse employee ranges like "101-250", "51-100", etc.
  if (typeof employeeRange === 'string') {
    const match = employeeRange.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return Math.floor((min + max) / 2); // Use average
    } else if (employeeRange.includes('+')) {
      const num = employeeRange.replace('+', '').replace(',', '');
      return parseInt(num);
    }
  }
  
  return null;
}

function calculateDataCompleteness(companyData: any): number {
  let score = 0;
  const maxScore = 100;
  
  // Key fields for completeness scoring
  if (companyData.name) score += 10;
  if (companyData.about || companyData.full_description) score += 10;
  if (companyData.founded_date) score += 10;
  if (companyData.num_employees) score += 10;
  if (companyData.website) score += 10;
  if (companyData.industries && companyData.industries.length > 0) score += 10;
  if (companyData.location && companyData.location.length > 0) score += 10;
  if (companyData.similar_companies && companyData.similar_companies.length > 0) score += 10;
  if (companyData.builtwith_tech && companyData.builtwith_tech.length > 0) score += 10;
  if (companyData.monthly_visits || companyData.semrush_visits_latest_month) score += 10;
  
  return Math.min(score, maxScore);
}