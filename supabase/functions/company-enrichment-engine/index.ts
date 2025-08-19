
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

    // Store enrichment data
    const updatedEnhancedAnalysis = {
      ...deal.enhanced_analysis,
      company_enrichment: {
        ...enrichmentData,
        last_enriched: new Date().toISOString(),
        source: enrichmentData.source || (enrichmentData.trustScore >= 70 ? 'coresignal_api' : 'google_custom_search')
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
  const brightdataApiKey = Deno.env.get('BRIGHTDATA_API_KEY');
  if (!brightdataApiKey) {
    throw new Error('Brightdata API key not configured');
  }

  if (!request.linkedinUrl) {
    throw new Error('LinkedIn URL required for Brightdata enrichment');
  }

  console.log(`🌟 Brightdata enriching ${request.companyName} with LinkedIn: ${request.linkedinUrl}`);

  // Call Brightdata API
  const response = await fetch('https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l1vikfnt1wgvvqz95w&include_errors=true', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${brightdataApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{ url: request.linkedinUrl }])
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Brightdata API Error: ${response.status} - ${errorText}`);
    throw new Error(`Brightdata API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`✅ Brightdata raw response:`, JSON.stringify(data, null, 2));

  // Process Brightdata response
  let companyData = data;
  if (Array.isArray(data) && data.length > 0) {
    companyData = data[0];
  }
  if (data.data) {
    companyData = data.data;
  }

  // Extract and structure company information
  const employeeCount = companyData.employee_count || companyData.employees || companyData.company_size || 0;
  const industry = companyData.industry || companyData.sector || null;

  return {
    employeeCount: employeeCount || undefined,
    keyPersonnel: companyData.employees || companyData.leadership || [],
    competitors: [],
    trustScore: 95,
    dataQuality: calculateBrightdataQuality(companyData),
    source: 'brightdata_linkedin',
    companyId: companyData.id || companyData.company_id,
    revenueEstimate: employeeCount ? estimateRevenue(employeeCount, industry) : undefined,
    fundingHistory: companyData.funding_rounds || [],
    growthRate: companyData.growth_rate || undefined,
    marketSize: companyData.market_size || undefined
  };
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
