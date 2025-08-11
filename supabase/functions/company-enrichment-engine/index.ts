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

    if (coresignalApiKey) {
      console.log('Enriching with Coresignal API...');
      try {
        enrichmentData = await enrichWithCoresignal(request);
      } catch (error) {
        console.log('Coresignal failed, trying Google Custom Search...');
        enrichmentData = await enrichWithGoogleSearch(request);
      }
    } else {
      console.log('No Coresignal API key - using Google Custom Search...');
      enrichmentData = await enrichWithGoogleSearch(request);
    }

    // Store enrichment data
    const updatedEnhancedAnalysis = {
      ...deal.enhanced_analysis,
      company_enrichment: {
        ...enrichmentData,
        last_enriched: new Date().toISOString(),
        source: enrichmentData.trustScore >= 70 ? 'coresignal_api' : 'google_custom_search'
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

async function enrichWithCoresignal(request: EnrichmentRequest): Promise<CompanyEnrichmentData> {
  try {
    console.log(`Enriching ${request.companyName} with Coresignal...`);

    // Search for company
    const searchResponse = await fetch(`https://api.coresignal.com/cdapi/v1/linkedin/company/search/filter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${coresignalApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: request.companyName,
        limit: 5
      })
    });

    if (!searchResponse.ok) {
      console.log(`Coresignal search failed (${searchResponse.status}): ${searchResponse.statusText}`);
      throw new Error(`Coresignal search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData || searchData.length === 0) {
      console.log('No company found in Coresignal');
      return { trustScore: 60, dataQuality: 40 };
    }

    const company = searchData[0];
    console.log('Found company:', company.title);

    // Get detailed company data
    const detailResponse = await fetch(`https://api.coresignal.com/cdapi/v1/linkedin/company/collect/${company.id}`, {
      headers: {
        'Authorization': `Bearer ${coresignalApiKey}`,
      }
    });

    if (!detailResponse.ok) {
      throw new Error(`Coresignal detail fetch failed: ${detailResponse.statusText}`);
    }

    const companyDetails = await detailResponse.json();

    // Get employee data
    const employeeResponse = await fetch(`https://api.coresignal.com/cdapi/v1/linkedin/member/search/filter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${coresignalApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: company.id,
        limit: 100
      })
    });

    let employeeCount = 0;
    let keyPersonnel: any[] = [];

    if (employeeResponse.ok) {
      const employees = await employeeResponse.json();
      employeeCount = employees.length;
      
      // Extract key personnel (leadership roles)
      keyPersonnel = employees
        .filter((emp: any) => 
          emp.title?.toLowerCase().includes('ceo') ||
          emp.title?.toLowerCase().includes('founder') ||
          emp.title?.toLowerCase().includes('cto') ||
          emp.title?.toLowerCase().includes('cfo')
        )
        .slice(0, 5)
        .map((emp: any) => ({
          name: emp.name,
          title: emp.title,
          linkedin_url: emp.linkedin_url
        }));
    }

    return {
      employeeCount,
      keyPersonnel,
      trustScore: 95,
      dataQuality: 90,
      revenueEstimate: estimateRevenue(employeeCount, companyDetails.industry),
      competitors: extractCompetitors(companyDetails.description || '')
    };

  } catch (error) {
    console.error('Coresignal enrichment error:', error);
    return { trustScore: 50, dataQuality: 30 };
  }
}

async function enrichWithGoogleSearch(request: EnrichmentRequest): Promise<CompanyEnrichmentData> {
  const googleApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
  const googleSearchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');
  
  if (!googleApiKey || !googleSearchEngineId) {
    console.log('No Google Custom Search API credentials - minimal data');
    return { trustScore: 40, dataQuality: 20 };
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
      return { trustScore: 30, dataQuality: 25 };
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

    // Extract potential funding information
    const fundingKeywords = ['funding', 'raised', 'series', 'investment'];
    const hasFundingMention = fundingKeywords.some(keyword => 
      snippets.toLowerCase().includes(keyword)
    );

    return {
      employeeCount: employeeCount || undefined,
      trustScore: 70,
      dataQuality: 65,
      revenueEstimate: employeeCount ? estimateRevenue(employeeCount) : undefined,
      keyPersonnel: [],
      competitors: []
    };

  } catch (error) {
    console.error('Google Custom Search enrichment error:', error);
    return { trustScore: 30, dataQuality: 20 };
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