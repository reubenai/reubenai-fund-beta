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
        funds!deals_fund_id_fkey(
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
Focus on quantitative data and specific metrics where available. For each category, provide specific sources and citations for the data points. Return the information in the following JSON structure grouped by VC analysis subcategories:

{
  "market_size": {
    "data": {
      "tam": "Total Addressable Market size with specific dollar amounts",
      "sam": "Serviceable Addressable Market size with specific dollar amounts", 
      "som": "Serviceable Obtainable Market size with specific dollar amounts"
    },
    "sources": ["Specific URLs or sources for market size data"],
    "confidence": "High/Medium/Low based on data availability"
  },
  "market_growth_rate": {
    "data": {
      "cagr": "Compound Annual Growth Rate percentage for the market",
      "growth_drivers": ["List of key factors driving market growth"]
    },
    "sources": ["Specific URLs or sources for growth rate data"],
    "confidence": "High/Medium/Low based on data availability"
  },
  "competitive_position": {
    "data": {
      "market_share_distribution": {
        "leader": "Market leader name and percentage",
        "competitors": ["Key competitors with market share percentages"]
      },
      "key_market_players": ["Top 5-10 companies in this market space"],
      "whitespace_opportunities": ["Unexploited market opportunities or gaps"]
    },
    "sources": ["Specific URLs or sources for competitive analysis data"],
    "confidence": "High/Medium/Low based on data availability"
  },
  "customer_acquisition": {
    "data": {
      "addressable_customers": "Number or description of target customers",
      "cac_trend": "Customer Acquisition Cost trends and benchmarks",
      "ltv_cac_ratio": "Lifetime Value to Customer Acquisition Cost ratio trends",
      "retention_rate": "Industry average customer retention rates",
      "channel_effectiveness": {
        "digital": "Effectiveness of digital marketing channels",
        "direct_sales": "Effectiveness of direct sales approach",
        "partnerships": "Partner channel effectiveness"
      }
    },
    "sources": ["Specific URLs or sources for customer acquisition data"],
    "confidence": "High/Medium/Low based on data availability"
  },
  "network_advisors": {
    "data": {
      "strategic_advisors": ["Notable advisors or board members if known"],
      "investor_network": ["Current investors, VCs, or funding sources"],
      "partnership_ecosystem": {
        "technology_partners": ["Key technology partnerships"],
        "distribution_partners": ["Distribution or channel partners"],
        "strategic_alliances": ["Strategic business alliances"]
      }
    },
    "sources": ["Specific URLs or sources for network and advisor data"],
    "confidence": "High/Medium/Low based on data availability"
  },
  "metadata": {
    "last_updated": "Current date",
    "overall_confidence": "High/Medium/Low based on overall data availability"
  }
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
                market_size: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        tam: { type: 'string' },
                        sam: { type: 'string' },
                        som: { type: 'string' }
                      }
                    },
                    sources: { type: 'array', items: { type: 'string' } },
                    confidence: { type: 'string' }
                  }
                },
                market_growth_rate: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        cagr: { type: 'string' },
                        growth_drivers: { type: 'array', items: { type: 'string' } }
                      }
                    },
                    sources: { type: 'array', items: { type: 'string' } },
                    confidence: { type: 'string' }
                  }
                },
                competitive_position: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        market_share_distribution: { 
                          type: 'object',
                          properties: {
                            leader: { type: 'string' },
                            competitors: { type: 'array', items: { type: 'string' } }
                          }
                        },
                        key_market_players: { type: 'array', items: { type: 'string' } },
                        whitespace_opportunities: { type: 'array', items: { type: 'string' } }
                      }
                    },
                    sources: { type: 'array', items: { type: 'string' } },
                    confidence: { type: 'string' }
                  }
                },
                customer_acquisition: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
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
                        }
                      }
                    },
                    sources: { type: 'array', items: { type: 'string' } },
                    confidence: { type: 'string' }
                  }
                },
                network_advisors: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        strategic_advisors: { type: 'array', items: { type: 'string' } },
                        investor_network: { type: 'array', items: { type: 'string' } },
                        partnership_ecosystem: {
                          type: 'object',
                          properties: {
                            technology_partners: { type: 'array', items: { type: 'string' } },
                            distribution_partners: { type: 'array', items: { type: 'string' } },
                            strategic_alliances: { type: 'array', items: { type: 'string' } }
                          }
                        }
                      }
                    },
                    sources: { type: 'array', items: { type: 'string' } },
                    confidence: { type: 'string' }
                  }
                },
                metadata: {
                  type: 'object',
                  properties: {
                    last_updated: { type: 'string' },
                    overall_confidence: { type: 'string' }
                  }
                }
              },
              required: ['market_size', 'market_growth_rate', 'competitive_position', 'customer_acquisition', 'network_advisors']
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

    // Store raw response using upsert pattern to handle potential conflicts
    const { error: rawInsertError } = await supabase
      .from('deal_enrichment_perplexity_company_export_vc')
      .upsert({
        deal_id: dealId,
        snapshot_id: snapshotId,
        company_name: companyName,
        raw_perplexity_response: perplexityData,
        processing_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'deal_id'
      });

    if (rawInsertError) {
      console.error('❌ Failed to store raw Perplexity response:', rawInsertError);
      throw new Error('Failed to store raw Perplexity response');
    }

    console.log('✅ Raw Perplexity response stored, processing will be triggered automatically');

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
    tam: companyData.market_size?.data?.tam || null,
    sam: companyData.market_size?.data?.sam || null,
    som: companyData.market_size?.data?.som || null,
    cagr: companyData.market_growth_rate?.data?.cagr || null,
    growth_drivers: companyData.market_growth_rate?.data?.growth_drivers || [],
    
    // Market Analysis
    market_share_distribution: companyData.competitive_position?.data?.market_share_distribution || {},
    key_market_players: companyData.competitive_position?.data?.key_market_players || [],
    whitespace_opportunities: companyData.competitive_position?.data?.whitespace_opportunities || [],
    
    // Customer & Business Metrics
    addressable_customers: companyData.customer_acquisition?.data?.addressable_customers || null,
    cac_trend: companyData.customer_acquisition?.data?.cac_trend || null,
    ltv_cac_ratio: companyData.customer_acquisition?.data?.ltv_cac_ratio || null,
    retention_rate: companyData.customer_acquisition?.data?.retention_rate || null,
    channel_effectiveness: companyData.customer_acquisition?.data?.channel_effectiveness || {},
    
    // Strategic Network
    strategic_advisors: companyData.network_advisors?.data?.strategic_advisors || [],
    investor_network: companyData.network_advisors?.data?.investor_network || [],
    partnership_ecosystem: companyData.network_advisors?.data?.partnership_ecosystem || {},
    
    // Subcategory Sources (NEW)
    subcategory_sources: {
      market_size: companyData.market_size?.sources || [],
      market_growth_rate: companyData.market_growth_rate?.sources || [],
      competitive_position: companyData.competitive_position?.sources || [],
      customer_acquisition: companyData.customer_acquisition?.sources || [],
      network_advisors: companyData.network_advisors?.sources || []
    },
    
    // Subcategory Confidence (NEW)
    subcategory_confidence: {
      market_size: companyData.market_size?.confidence || 'Unknown',
      market_growth_rate: companyData.market_growth_rate?.confidence || 'Unknown',
      competitive_position: companyData.competitive_position?.confidence || 'Unknown',
      customer_acquisition: companyData.customer_acquisition?.confidence || 'Unknown',
      network_advisors: companyData.network_advisors?.confidence || 'Unknown'
    },
    
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
  if (companyData.market_size?.data?.tam) score += 1;
  if (companyData.market_size?.data?.sam) score += 1;
  if (companyData.market_size?.data?.som) score += 1;
  if (companyData.market_growth_rate?.data?.cagr) score += 1;

  // Market Analysis (3 points)
  if (companyData.market_growth_rate?.data?.growth_drivers && companyData.market_growth_rate.data.growth_drivers.length > 0) score += 1;
  if (companyData.competitive_position?.data?.key_market_players && companyData.competitive_position.data.key_market_players.length > 0) score += 1;
  if (companyData.competitive_position?.data?.whitespace_opportunities && companyData.competitive_position.data.whitespace_opportunities.length > 0) score += 1;

  // Customer & Business Metrics (4 points)
  if (companyData.customer_acquisition?.data?.addressable_customers) score += 1;
  if (companyData.customer_acquisition?.data?.cac_trend) score += 1;
  if (companyData.customer_acquisition?.data?.ltv_cac_ratio) score += 1;
  if (companyData.customer_acquisition?.data?.retention_rate) score += 1;

  // Strategic Network (3 points)
  if (companyData.network_advisors?.data?.strategic_advisors && companyData.network_advisors.data.strategic_advisors.length > 0) score += 1;
  if (companyData.network_advisors?.data?.investor_network && companyData.network_advisors.data.investor_network.length > 0) score += 1;
  if (companyData.network_advisors?.data?.partnership_ecosystem && Object.keys(companyData.network_advisors.data.partnership_ecosystem).length > 0) score += 1;

  // Additional factors (2 points)
  if (companyData.competitive_position?.data?.market_share_distribution && Object.keys(companyData.competitive_position.data.market_share_distribution).length > 0) score += 1;
  if (companyData.customer_acquisition?.data?.channel_effectiveness && Object.keys(companyData.customer_acquisition.data.channel_effectiveness).length > 0) score += 1;

  return Math.round((score / maxScore) * 100);
}