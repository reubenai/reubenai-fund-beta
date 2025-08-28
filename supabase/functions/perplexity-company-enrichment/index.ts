import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface for the incoming request
interface PerplexityCompanyRequest {
  dealId: string;
  companyName: string;
  additionalContext?: {
    industry?: string;
    website?: string;
    description?: string;
  };
}

// Interface for the processed response
interface PerplexityCompanyResponse {
  success: boolean;
  data?: any;
  error?: string;
  snapshot_id?: string;
  data_quality_score?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Perplexity Company Enrichment - Starting request processing');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { dealId, companyName, additionalContext }: PerplexityCompanyRequest = await req.json();

    if (!dealId || !companyName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Deal ID and Company Name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the deal's fund is venture capital only
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        fund_id,
        funds!inner(
          id,
          fund_type
        )
      `)
      .eq('id', dealId)
      .single();

    if (dealError) {
      console.error('❌ Error fetching deal data:', dealError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch deal information' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only process if fund type is venture_capital
    if (dealData.funds.fund_type !== 'venture_capital') {
      console.log(`🚫 Skipping Perplexity enrichment for ${companyName} - Fund type is ${dealData.funds.fund_type}, not venture_capital`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Perplexity company enrichment is only available for venture capital deals',
          fund_type: dealData.funds.fund_type
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Deal ${dealId} confirmed as venture capital - proceeding with enrichment`);

    // Check for Perplexity API key
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Perplexity API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique snapshot ID
    const timestamp = Date.now();
    const snapshotId = `company_${dealId}_${timestamp}`;
    console.log(`📝 Generated snapshot ID: ${snapshotId}`);

    console.log(`📊 Processing company enrichment for: ${companyName}`);

    // Build context-aware query
    let queryContext = `company ${companyName}`;
    if (additionalContext?.industry) {
      queryContext += ` in the ${additionalContext.industry} industry`;
    }
    if (additionalContext?.website) {
      queryContext += ` (website: ${additionalContext.website})`;
    }
    if (additionalContext?.description) {
      queryContext += ` - ${additionalContext.description}`;
    }

    const perplexityQuery = `
Research ${queryContext} and provide comprehensive market analysis and business intelligence. 
Focus on quantitative data and specific metrics where available. Return the information in the following JSON structure:

{
  "tam": "Total Addressable Market size with specific dollar amounts",
  "sam": "Serviceable Addressable Market size with specific dollar amounts", 
  "som": "Serviceable Obtainable Market size with specific dollar amounts",
  "cagr": "Compound Annual Growth Rate percentage for the market",
  "growth_drivers": ["List of key factors driving market growth"],
  "market_share_distribution": {
    "leader": "Market leader name and percentage",
    "competitors": ["Key competitors with market share percentages"]
  },
  "key_market_players": ["Top 5-10 companies in this market space"],
  "whitespace_opportunities": ["Unexploited market opportunities or gaps"],
  "addressable_customers": "Number or description of target customers",
  "cac_trend": "Customer Acquisition Cost trends and benchmarks",
  "ltv_cac_ratio": "Lifetime Value to Customer Acquisition Cost ratio trends",
  "retention_rate": "Industry average customer retention rates",
  "channel_effectiveness": {
    "digital": "Effectiveness of digital marketing channels",
    "direct_sales": "Effectiveness of direct sales approach",
    "partnerships": "Partner channel effectiveness"
  },
  "strategic_advisors": ["Notable advisors or board members if known"],
  "investor_network": ["Current investors, VCs, or funding sources"],
  "partnership_ecosystem": {
    "technology_partners": ["Key technology partnerships"],
    "distribution_partners": ["Distribution or channel partners"],
    "strategic_alliances": ["Strategic business alliances"]
  },
  "data_sources": ["URLs or sources where this information was found"],
  "last_updated": "Current date",
  "confidence_level": "High/Medium/Low based on data availability"
}`;

    console.log('🔍 Calling Perplexity API with structured query...');

    // Call Perplexity API with structured JSON schema
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a market research specialist that returns structured JSON data about companies and their market landscape. Always return valid JSON format with comprehensive market intelligence.'
          },
          {
            role: 'user',
            content: perplexityQuery
          }
        ],
        max_tokens: 4000,
        top_p: 0.9,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0,
        response_format: {
          type: 'json_schema',
          json_schema: {
            schema: {
              type: 'object',
              properties: {
                tam: { type: 'string' },
                sam: { type: 'string' },
                som: { type: 'string' },
                cagr: { type: 'string' },
                growth_drivers: { type: 'array', items: { type: 'string' } },
                market_share_distribution: { 
                  type: 'object',
                  properties: {
                    leader: { type: 'string' },
                    competitors: { type: 'array', items: { type: 'string' } }
                  }
                },
                key_market_players: { type: 'array', items: { type: 'string' } },
                whitespace_opportunities: { type: 'array', items: { type: 'string' } },
                addressable_customers: { type: 'string' },
                cac_trend: { type: 'string' },
                ltv_cac_ratio: { type: 'string' },
                retention_rate: { type: 'string' },
                channel_effectiveness: {
                  type: 'object',
                  properties: {
                    digital: { type: 'string' },
                    direct_sales: { type: 'string' },
                    partnerships: { type: 'string' }
                  }
                },
                strategic_advisors: { type: 'array', items: { type: 'string' } },
                investor_network: { type: 'array', items: { type: 'string' } },
                partnership_ecosystem: {
                  type: 'object',
                  properties: {
                    technology_partners: { type: 'array', items: { type: 'string' } },
                    distribution_partners: { type: 'array', items: { type: 'string' } },
                    strategic_alliances: { type: 'array', items: { type: 'string' } }
                  }
                },
                data_sources: { type: 'array', items: { type: 'string' } },
                last_updated: { type: 'string' },
                confidence_level: { type: 'string' }
              },
              required: ['tam', 'sam', 'som', 'company_name']
            }
          }
        }
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('❌ Perplexity API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Perplexity API request failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const perplexityData = await perplexityResponse.json();
    console.log('✅ Perplexity API response received');

    // Extract the content from Perplexity response
    let companyData;
    try {
      const content = perplexityData.choices[0].message.content;
      console.log('📥 Raw Perplexity content:', content);
      
      // Try to parse JSON directly, or extract from markdown if needed
      try {
        companyData = JSON.parse(content);
      } catch (parseError) {
        // Fallback: extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          companyData = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      }
      
      console.log('✅ Successfully parsed company data from Perplexity response');
    } catch (parseError) {
      console.error('❌ Failed to parse Perplexity response:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse Perplexity response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Processing Perplexity company response...');

    // Process and store the company data
    const processedData = await processPerplexityCompanyResponse(
      supabase,
      dealId,
      snapshotId,
      companyName,
      companyData,
      perplexityData
    );

    // Insert audit record into deal_analysis_sources
    await supabase.from('deal_analysis_sources').insert({
      deal_id: dealId,
      engine_name: 'perplexity-company-intelligence',
      source_type: 'market_research',
      source_url: 'https://api.perplexity.ai',
      data_retrieved: processedData,
      confidence_score: calculateCompanyDataQuality(companyData),
      validated: true
    });

    console.log('✅ Perplexity company enrichment completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: processedData,
        snapshot_id: snapshotId,
        data_quality_score: calculateCompanyDataQuality(companyData)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in perplexity-company-enrichment function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to process and store company data
async function processPerplexityCompanyResponse(
  supabase: any,
  dealId: string,
  snapshotId: string,
  companyName: string,
  companyData: any,
  rawResponse: any
) {
  console.log('💾 Inserting processed company data into database...');

  const processedCompanyData = {
    deal_id: dealId,
    snapshot_id: snapshotId,
    company_name: companyName,
    
    // Market Size Data
    tam: companyData.tam || null,
    sam: companyData.sam || null,
    som: companyData.som || null,
    cagr: companyData.cagr || null,
    growth_drivers: companyData.growth_drivers || [],
    
    // Market Analysis
    market_share_distribution: companyData.market_share_distribution || {},
    key_market_players: companyData.key_market_players || [],
    whitespace_opportunities: companyData.whitespace_opportunities || [],
    
    // Customer & Business Metrics
    addressable_customers: companyData.addressable_customers || null,
    cac_trend: companyData.cac_trend || null,
    ltv_cac_ratio: companyData.ltv_cac_ratio || null,
    retention_rate: companyData.retention_rate || null,
    channel_effectiveness: companyData.channel_effectiveness || {},
    
    // Strategic Network
    strategic_advisors: companyData.strategic_advisors || [],
    investor_network: companyData.investor_network || [],
    partnership_ecosystem: companyData.partnership_ecosystem || {},
    
    // System fields
    raw_perplexity_response: rawResponse,
    processing_status: 'processed',
    data_quality_score: calculateCompanyDataQuality(companyData),
    processed_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('deal_enrichment_perplexity_company_export_vc')
    .insert(processedCompanyData)
    .select()
    .single();

  if (error) {
    console.error('❌ Database insertion error:', error);
    // Fallback: try to insert with minimal data
    const fallbackData = {
      deal_id: dealId,
      snapshot_id: snapshotId,
      company_name: companyName,
      raw_perplexity_response: rawResponse,
      processing_status: 'failed',
      data_quality_score: 0
    };
    
    const { data: fallbackResult } = await supabase
      .from('deal_enrichment_perplexity_company_export_vc')
      .insert(fallbackData)
      .select()
      .single();
    
    return fallbackResult;
  }

  console.log('✅ Processed company data inserted successfully');
  return data;
}

// Helper function to calculate data quality score
function calculateCompanyDataQuality(companyData: any): number {
  let score = 0;
  const maxScore = 16; // Total number of data points

  // Market Size Data (4 points)
  if (companyData.tam) score += 1;
  if (companyData.sam) score += 1;
  if (companyData.som) score += 1;
  if (companyData.cagr) score += 1;

  // Market Analysis (3 points)
  if (companyData.growth_drivers && companyData.growth_drivers.length > 0) score += 1;
  if (companyData.key_market_players && companyData.key_market_players.length > 0) score += 1;
  if (companyData.whitespace_opportunities && companyData.whitespace_opportunities.length > 0) score += 1;

  // Customer & Business Metrics (4 points)
  if (companyData.addressable_customers) score += 1;
  if (companyData.cac_trend) score += 1;
  if (companyData.ltv_cac_ratio) score += 1;
  if (companyData.retention_rate) score += 1;

  // Strategic Network (3 points)
  if (companyData.strategic_advisors && companyData.strategic_advisors.length > 0) score += 1;
  if (companyData.investor_network && companyData.investor_network.length > 0) score += 1;
  if (companyData.partnership_ecosystem && Object.keys(companyData.partnership_ecosystem).length > 0) score += 1;

  // Additional factors (2 points)
  if (companyData.market_share_distribution && Object.keys(companyData.market_share_distribution).length > 0) score += 1;
  if (companyData.channel_effectiveness && Object.keys(companyData.channel_effectiveness).length > 0) score += 1;

  return Math.round((score / maxScore) * 100);
}