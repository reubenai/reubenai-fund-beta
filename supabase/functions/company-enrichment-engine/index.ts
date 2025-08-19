
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const coresignalApiKey = Deno.env.get('CORESIGNAL_API_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EnrichmentRequest {
  dealId: string;
  companyName: string;
  website?: string;
  linkedinUrl?: string;
  crunchbaseUrl?: string;
  triggerReanalysis?: boolean;
}

interface CompanyEnrichmentData {
  employeeCount?: number;
  growthRate?: number;
  fundingHistory?: any[];
  keyPersonnel?: any[];
  competitors?: string[];
  marketSize?: number;
  revenueEstimate?: number;
  trustScore?: number;
  dataQuality?: number;
  source?: string;
  companyId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Company Enrichment: Processing request');
    
    const request: EnrichmentRequest = await req.json();
    console.log('Enrichment request:', request);

    // Validate inputs
    if (!request.dealId || !request.companyName) {
      throw new Error('Missing required fields: dealId and companyName');
    }

    // Fetch existing deal data
    const { data: deal } = await supabase
      .from('deals')
      .select('*, enhanced_analysis')
      .eq('id', request.dealId)
      .single();

    if (!deal) {
      throw new Error('Deal not found');
    }

    let enrichmentData: CompanyEnrichmentData = {};

    // Enrichment priority: 1. Brightdata (if LinkedIn URL), 2. Coresignal, 3. Google Search
    if (request.linkedinUrl && Deno.env.get('BRIGHTDATA_API_KEY')) {
      console.log('🌟 Enriching with Brightdata (LinkedIn URL available)...');
      try {
        enrichmentData = await enrichWithBrightdata(request);
      } catch (error) {
        console.log('❌ Brightdata failed, falling back to Coresignal...', error.message);
        try {
          enrichmentData = await enrichWithCoresignal(request);
        } catch (coresignalError) {
          console.log('❌ Coresignal also failed, trying Google Custom Search...', coresignalError.message);
          enrichmentData = await enrichWithGoogleSearch(request);
        }
      }
    } else if (coresignalApiKey) {
      console.log('📊 Enriching with Coresignal API...');
      try {
        enrichmentData = await enrichWithCoresignal(request);
      } catch (error) {
        console.log('❌ Coresignal failed, trying Google Custom Search...', error.message);
        enrichmentData = await enrichWithGoogleSearch(request);
      }
    } else {
      console.log('🔍 No premium APIs available - using Google Custom Search...');
      enrichmentData = await enrichWithGoogleSearch(request);
    }

    // Update deal fields selectively (only NULL fields) and store enrichment data
    const updatedFields = await updateDealFieldsSelectively(request.dealId, enrichmentData);
    
    const updatedEnhancedAnalysis = {
      ...deal.enhanced_analysis,
      company_enrichment: {
        ...enrichmentData,
        last_enriched: new Date().toISOString(),
        source: enrichmentData.source || (enrichmentData.trustScore >= 70 ? 'coresignal_api' : 'google_custom_search'),
        fields_updated: updatedFields
      }
    };

    await supabase
      .from('deals')
      .update({ 
        enhanced_analysis: updatedEnhancedAnalysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.dealId);

    // Trigger reanalysis if requested
    if (request.triggerReanalysis) {
      await triggerDealReanalysis(request.dealId);
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        enrichment_data: enrichmentData,
        confidence_score: enrichmentData.dataQuality || 80,
        next_reanalysis_recommended: true
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Company Enrichment Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function enrichWithBrightdata(request: EnrichmentRequest): Promise<CompanyEnrichmentData> {
  // Call the dedicated Brightdata function for async processing
  const { data, error } = await supabase.functions.invoke('brightdata-linkedin-enrichment', {
    body: {
      dealId: request.dealId,
      companyName: request.companyName,
      linkedinUrl: request.linkedinUrl
    }
  });

  if (error) {
    console.error('❌ Brightdata function error:', error);
    throw new Error(`Brightdata enrichment failed: ${error.message}`);
  }

  if (!data?.success) {
    throw new Error(`Brightdata enrichment failed: ${data?.error || 'Unknown error'}`);
  }

  // Try to read from the structured LinkedIn export table
  const { data: linkedinExports, error: exportError } = await supabase
    .from('deal_enrichment_linkedin_export')
    .select('*')
    .eq('deal_id', request.dealId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (exportError || !linkedinExports || linkedinExports.length === 0) {
    console.log('⚠️ [Brightdata] No structured LinkedIn export found, using legacy data');
    const enrichmentData = data.data;
  
  // Enhanced data extraction from Brightdata response
  const extractEmployeeCount = (teamData: any): number | undefined => {
    if (Array.isArray(teamData)) return teamData.length;
    if (typeof teamData === 'number') return teamData;
    if (typeof teamData === 'string') {
      const match = teamData.match(/(\d+)/);
      return match ? parseInt(match[1]) : undefined;
    }
    return undefined;
  };

  const extractWebsite = (rawResponse: any): string | undefined => {
    // Try multiple possible website fields from Brightdata
    return rawResponse?.website || 
           rawResponse?.company_website || 
           rawResponse?.url ||
           undefined;
  };

  const extractDescription = (rawResponse: any): string | undefined => {
    return rawResponse?.about || 
           rawResponse?.description || 
           rawResponse?.summary ||
           undefined;
  };

    // Transform the enrichment data with intelligent extraction (legacy format)
    return {
      employeeCount: extractEmployeeCount(enrichmentData['Team Size'] || enrichmentData.employees),
      website: extractWebsite(enrichmentData.raw_response?.[0] || enrichmentData),
      foundingYear: enrichmentData.Founded || enrichmentData.founded,
      location: enrichmentData.Headquarters || enrichmentData.headquarters || enrichmentData.location,
      keyPersonnel: enrichmentData.key_personnel || [],
      competitors: enrichmentData.competitors || [],
      trustScore: data.trustScore || 95,
      dataQuality: data.dataQuality || 85,
      source: 'brightdata_linkedin',
      revenueEstimate: enrichmentData.revenue_estimate || 
                      (extractEmployeeCount(enrichmentData['Team Size']) ? 
                       estimateRevenue(extractEmployeeCount(enrichmentData['Team Size'])!, enrichmentData.specialties) : 
                       undefined),
      fundingHistory: enrichmentData.funding_rounds || [],
      rawData: enrichmentData.raw_response?.[0] || enrichmentData // Store the actual Brightdata response
    };
  }

  // Use structured LinkedIn export data
  const linkedinData = linkedinExports[0];
  console.log('✅ [Brightdata] Using structured LinkedIn data for deal:', request.dealId);

  return {
    employeeCount: linkedinData.employees?.length || linkedinData.employees_in_linkedin,
    website: linkedinData.website,
    foundingYear: linkedinData.founded,
    location: linkedinData.headquarters || linkedinData.locations?.[0],
    keyPersonnel: linkedinData.employees?.slice(0, 4) || [],
    competitors: linkedinData.similar_companies?.map((comp: any) => comp.title || comp.name) || [],
    trustScore: 95,
    dataQuality: calculateBrightdataQuality(linkedinData),
    source: 'brightdata_linkedin',
    revenueEstimate: estimateRevenue(linkedinData.employees?.length || 0, linkedinData.industries),
    fundingHistory: linkedinData.funding || [],
    rawData: linkedinData // Store the structured LinkedIn data
  };
}

async function updateDealFieldsSelectively(dealId: string, enrichmentData: any): Promise<string[]> {
  console.log('🔄 [Selective Update] Checking fields to update for deal:', dealId);
  
  // Get current deal data with more fields
  const { data: deal } = await supabase
    .from('deals')
    .select('website, founding_year, employee_count, location, description, industry, fund_id')
    .eq('id', dealId)
    .single();
    
  if (!deal) {
    throw new Error('Deal not found for selective update');
  }

  const updates: any = {};
  const updatedFields: string[] = [];
  
  // Try to get structured LinkedIn data first
  const { data: linkedinExports } = await supabase
    .from('deal_enrichment_linkedin_export')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
    .limit(1);

  let rawData = enrichmentData.rawData;
  
  // Use structured LinkedIn data if available
  if (linkedinExports && linkedinExports.length > 0) {
    rawData = linkedinExports[0];
    console.log('✅ [Selective Update] Using structured LinkedIn export data');
  } else if (!rawData) {
    console.log('⚠️ [Selective Update] No structured or raw data available for field mapping');
    return updatedFields;
  }

  // Enhanced field mappings with proper data processing
  const fieldMappings = [
    { 
      sourceField: 'website', 
      targetField: 'website', 
      currentValue: deal.website,
      processor: (value: any) => typeof value === 'string' ? value : null
    },
    { 
      sourceField: 'founded', 
      targetField: 'founding_year', 
      currentValue: deal.founding_year,
      processor: (value: any) => typeof value === 'number' ? value : parseInt(value)
    },
    { 
      sourceField: 'employees', 
      targetField: 'employee_count', 
      currentValue: deal.employee_count,
      processor: (value: any) => {
        // Handle different Brightdata formats for employee count
        if (Array.isArray(value)) return value.length;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          if (value.includes('-')) {
            // Handle ranges like "51-200 employees"
            const match = value.match(/(\d+)-(\d+)/);
            if (match) return parseInt(match[1]); // Use lower bound
          }
          // Try to extract number from string
          const numMatch = value.match(/\d+/);
          if (numMatch) return parseInt(numMatch[0]);
        }
        return null;
      }
    },
    { 
      sourceField: 'headquarters', 
      targetField: 'location', 
      currentValue: deal.location,
      processor: (value: any) => typeof value === 'string' ? value : null
    },
    { 
      sourceField: 'about', 
      targetField: 'description', 
      currentValue: deal.description,
      processor: (value: any) => typeof value === 'string' ? value.substring(0, 1000) : null
    },
    { 
      sourceField: 'industries', 
      targetField: 'industry', 
      currentValue: deal.industry,
      processor: (value: any) => {
        if (typeof value === 'string') return value;
        if (Array.isArray(value) && value.length > 0) return value[0];
        return null;
      }
    }
  ];

  // Check each field mapping with intelligent processing
  for (const mapping of fieldMappings) {
    // Try multiple source field variations
    const possibleSources = [
      mapping.sourceField,
      mapping.sourceField.charAt(0).toUpperCase() + mapping.sourceField.slice(1), // Capitalize
      mapping.sourceField.replace('_', ' '), // Space instead of underscore
      mapping.sourceField.replace(/([A-Z])/g, ' $1').toLowerCase().trim() // camelCase to words
    ];
    
    let sourceValue = null;
    for (const source of possibleSources) {
      if (rawData[source] !== undefined && rawData[source] !== null) {
        sourceValue = rawData[source];
        break;
      }
    }
    
    // Process the value if found
    if (sourceValue !== null && !mapping.currentValue) {
      const processedValue = mapping.processor(sourceValue);
      
      if (processedValue !== null && processedValue !== undefined) {
        updates[mapping.targetField] = processedValue;
        updatedFields.push(mapping.targetField);
        console.log(`✅ [Selective Update] Will update ${mapping.targetField}: ${processedValue}`);
      } else {
        console.log(`⏭️ [Selective Update] Skipping ${mapping.targetField} (processing failed for: ${sourceValue})`);
      }
    } else if (mapping.currentValue) {
      console.log(`⏭️ [Selective Update] Skipping ${mapping.targetField} (has value: ${mapping.currentValue})`);
    } else {
      console.log(`⏭️ [Selective Update] Skipping ${mapping.targetField} (no source data)`);
    }
  }

  // Perform the update if we have fields to update
  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', dealId);
      
    if (error) {
      console.error('❌ [Selective Update] Failed to update deal:', error);
      throw new Error(`Failed to update deal fields: ${error.message}`);
    }
    
    console.log(`✅ [Selective Update] Updated ${updatedFields.length} fields:`, updatedFields);
  } else {
    console.log('ℹ️ [Selective Update] No fields needed updating');
  }

  // Generate and store vector embeddings for the enrichment data
  if (deal.fund_id) {
    await generateVectorEmbeddings(dealId, deal.fund_id, rawData);
  }

  return updatedFields;
}

async function generateVectorEmbeddings(dealId: string, fundId: string, rawData: any): Promise<void> {
  try {
    console.log('🔮 [Vector Storage] Generating embeddings for enrichment data...');
    
    // Create comprehensive text for embedding from Brightdata data
    const embeddingTexts = [];
    
    // Company description embedding
    if (rawData.about || rawData.description) {
      const description = rawData.about || rawData.description;
      embeddingTexts.push({
        text: description,
        contentType: 'company_description',
        metadata: {
          source: 'brightdata',
          industry: rawData.industries || rawData.specialties,
          founded: rawData.founded,
          employee_count: Array.isArray(rawData.employees) ? rawData.employees.length : rawData.employees_in_linkedin
        }
      });
    }
    
    // Team and personnel embedding
    if (rawData.employees && Array.isArray(rawData.employees)) {
      const teamText = rawData.employees
        .map(emp => `${emp.title || ''} ${emp.subtitle || ''} - ${emp.title || 'Employee'}`)
        .join('. ');
      
      if (teamText.trim()) {
        embeddingTexts.push({
          text: teamText,
          contentType: 'team_personnel',
          metadata: {
            source: 'brightdata',
            team_size: rawData.employees.length,
            key_roles: rawData.employees.map(emp => emp.subtitle).filter(Boolean)
          }
        });
      }
    }
    
    // Company updates and insights embedding
    if (rawData.updates && Array.isArray(rawData.updates) && rawData.updates.length > 0) {
      const updatesText = rawData.updates
        .slice(0, 3) // Latest 3 updates
        .map(update => update.text || update.title || '')
        .filter(Boolean)
        .join('. ');
      
      if (updatesText.trim()) {
        embeddingTexts.push({
          text: updatesText,
          contentType: 'company_updates',
          metadata: {
            source: 'brightdata',
            updates_count: rawData.updates.length,
            latest_update: rawData.updates[0]?.time || rawData.updates[0]?.date
          }
        });
      }
    }
    
    // Generate embeddings for each text
    for (const embeddingData of embeddingTexts) {
      try {
        const { data, error } = await supabase.functions.invoke('vector-embedding-generator', {
          body: {
            text: embeddingData.text,
            contentType: embeddingData.contentType,
            contentId: dealId,
            fundId: fundId,
            metadata: {
              ...embeddingData.metadata,
              brightdata_enrichment: true,
              generated_at: new Date().toISOString()
            }
          }
        });
        
        if (error) {
          console.error(`❌ [Vector Storage] Failed to generate ${embeddingData.contentType} embedding:`, error);
        } else {
          console.log(`✅ [Vector Storage] Generated ${embeddingData.contentType} embedding with ${data?.dimensions || 'unknown'} dimensions`);
        }
      } catch (error) {
        console.error(`❌ [Vector Storage] Error generating ${embeddingData.contentType} embedding:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ [Vector Storage] Error in vector embedding generation:', error.message);
    // Don't fail the main process if vector generation fails
  }
}

function calculateBrightdataQuality(data: any): number {
  let score = 0;
  const fields = ['company_name', 'employee_count', 'industry', 'location', 'description', 'website', 'founded'];
  
  fields.forEach(field => {
    if (data[field] && data[field] !== null && data[field] !== '') {
      score += 1;
    }
  });
  
  return Math.round((score / fields.length) * 100);
}

async function enrichWithCoresignal(request: EnrichmentRequest): Promise<CompanyEnrichmentData> {
  try {
    console.log(`Enriching ${request.companyName} with Coresignal...`);
    
    let searchPayload: any;
    let searchUrl: string;
    
    // Priority 1: Use LinkedIn URL if available (your preferred method)
    if (request.linkedinUrl) {
      console.log('Searching by LinkedIn URL:', request.linkedinUrl);
      searchUrl = 'https://api.coresignal.com/cdapi/v1/linkedin/company/search';
      searchPayload = {
        query: {
          bool: {
            should: [
              {
                match: {
                  "websites_linkedin": request.linkedinUrl
                }
              },
              {
                match: {
                  "websites_linkedin_canonical": request.linkedinUrl
                }
              }
            ]
          }
        }
      };
    } else {
      // Fallback: Search by company name
      console.log('Searching by company name:', request.companyName);
      searchUrl = 'https://api.coresignal.com/cdapi/v1/linkedin/company/search';
      searchPayload = {
        query: {
          bool: {
            must: [
              {
                match: {
                  "name": request.companyName
                }
              }
            ]
          }
        }
      };
    }

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${coresignalApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchPayload)
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.log(`Coresignal search failed (${searchResponse.status}): ${errorText}`);
      throw new Error(`Coresignal search failed: ${searchResponse.status} - ${errorText}`);
    }

    const searchData = await searchResponse.json();
    console.log('Coresignal search response:', JSON.stringify(searchData, null, 2));
    
    if (!searchData.hits || searchData.hits.hits.length === 0) {
      console.log('No company found in Coresignal');
      return { 
        trustScore: 60, 
        dataQuality: 40, 
        source: 'coresignal_api_no_results' 
      };
    }

    const company = searchData.hits.hits[0]._source;
    console.log('Found company:', company.name || company.title);

    // Get detailed company data if we have an ID
    let companyDetails = company;
    if (company.id) {
      try {
        const detailResponse = await fetch(`https://api.coresignal.com/cdapi/v1/linkedin/company/collect/${company.id}`, {
          headers: {
            'Authorization': `Bearer ${coresignalApiKey}`,
          }
        });

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          companyDetails = { ...company, ...detailData };
        }
      } catch (error) {
        console.log('Failed to get company details, using search data:', error.message);
      }
    }

    // Get employee data if we have company ID
    let employeeCount = 0;
    let keyPersonnel: any[] = [];

    if (company.id) {
      try {
        const employeeResponse = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/member/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${coresignalApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: {
              bool: {
                must: [
                  {
                    term: {
                      "company_id": company.id
                    }
                  }
                ]
              }
            },
            size: 100
          })
        });

        if (employeeResponse.ok) {
          const employees = await employeeResponse.json();
          employeeCount = employees.hits?.total?.value || employees.hits?.hits?.length || 0;
          
          // Extract key personnel (leadership roles)
          if (employees.hits?.hits) {
            keyPersonnel = employees.hits.hits
              .filter((emp: any) => {
                const title = emp._source?.title?.toLowerCase() || '';
                return title.includes('ceo') ||
                       title.includes('founder') ||
                       title.includes('cto') ||
                       title.includes('cfo') ||
                       title.includes('president') ||
                       title.includes('director');
              })
              .slice(0, 5)
              .map((emp: any) => ({
                name: emp._source?.name,
                title: emp._source?.title,
                linkedin_url: emp._source?.linkedin_url
              }));
          }
        }
      } catch (error) {
        console.log('Failed to get employee data:', error.message);
      }
    }

    return {
      employeeCount: employeeCount || companyDetails.employee_count || undefined,
      keyPersonnel,
      trustScore: 95,
      dataQuality: 90,
      source: 'coresignal_api',
      companyId: company.id,
      revenueEstimate: employeeCount ? estimateRevenue(employeeCount, companyDetails.industry) : undefined,
      competitors: extractCompetitors(companyDetails.description || companyDetails.summary || ''),
      fundingHistory: companyDetails.funding_rounds || []
    };

  } catch (error) {
    console.error('Coresignal enrichment error:', error);
    throw error; // Re-throw to trigger fallback
  }
}

async function enrichWithGoogleSearch(request: EnrichmentRequest): Promise<CompanyEnrichmentData> {
  const googleApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
  const googleSearchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');
  
  if (!googleApiKey || !googleSearchEngineId) {
    console.log('No Google Custom Search API credentials - minimal data');
    return { 
      trustScore: 40, 
      dataQuality: 20, 
      source: 'google_fallback_no_credentials' 
    };
  }
  
  try {
    console.log(`Google Custom Search enriching ${request.companyName}...`);

    // Search for company information
    const searchQuery = `${request.companyName} company employees funding revenue`;
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(searchQuery)}`;

    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`Google Search API error: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      console.log('No results found via Google Custom Search');
      return { 
        trustScore: 30, 
        dataQuality: 25, 
        source: 'google_custom_search_no_results' 
      };
    }

    // Extract basic company data from search results
    const results = searchData.items.slice(0, 5);
    const snippets = results.map(item => item.snippet).join(' ');
    
    // Use pattern matching to extract employee count
    let employeeCount = 0;
    const employeePatterns = [
      /(\d+)\s+employees?/i,
      /team\s+of\s+(\d+)/i,
      /(\d+)\s+people/i
    ];
    
    for (const pattern of employeePatterns) {
      const match = snippets.match(pattern);
      if (match) {
        employeeCount = parseInt(match[1]);
        break;
      }
    }

    return {
      employeeCount: employeeCount || undefined,
      trustScore: 70,
      dataQuality: 65,
      source: 'google_custom_search',
      revenueEstimate: employeeCount ? estimateRevenue(employeeCount) : undefined,
      keyPersonnel: [],
      competitors: []
    };

  } catch (error) {
    console.error('Google Custom Search enrichment error:', error);
    return { 
      trustScore: 30, 
      dataQuality: 20, 
      source: 'google_custom_search_error' 
    };
  }
}

function estimateRevenue(employeeCount: number, industry?: string): number {
  // Revenue per employee estimates by industry
  const revenuePerEmployee: Record<string, number> = {
    'technology': 200000,
    'software': 250000,
    'fintech': 300000,
    'healthcare': 180000,
    'manufacturing': 150000,
    'default': 180000
  };

  const multiplier = industry ? 
    revenuePerEmployee[industry.toLowerCase()] || revenuePerEmployee.default :
    revenuePerEmployee.default;

  return employeeCount * multiplier;
}

function extractCompetitors(description: string): string[] {
  // Simple competitor extraction from description
  const competitorKeywords = ['competitor', 'alternative', 'similar to', 'like'];
  // This would be enhanced with more sophisticated NLP
  return [];
}

async function triggerDealReanalysis(dealId: string) {
  try {
    console.log(`Triggering reanalysis for deal ${dealId}...`);
    
    // Call the Reuben Orchestrator for comprehensive reanalysis
    const { data, error } = await supabase.functions.invoke('reuben-orchestrator', {
      body: {
        dealId,
        triggerReason: 'company_enrichment',
        priority: 'high'
      }
    });

    if (error) {
      console.error('Failed to trigger reanalysis:', error);
    } else {
      console.log('Reanalysis triggered successfully');
    }
  } catch (error) {
    console.error('Error triggering reanalysis:', error);
  }
}
