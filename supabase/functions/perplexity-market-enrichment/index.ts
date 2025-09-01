import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketEnrichmentRequest {
  dealId: string;
  primaryIndustry: string;
  location: string;
}

interface PerplexityMarketResponse {
  market_assessment: {
    data: {
      market_cycle: string;
      economic_sensitivity: string;
      investment_climate: string;
    };
    sources: string[];
    confidence: string;
  };
  regulatory_competitive: {
    data: {
      regulatory_timeline: string;
      competitive_window: string;
      regulatory_requirements: string;
    };
    sources: string[];
    confidence: string;
  };
  capital_technology: {
    data: {
      capital_requirements: string;
      technology_moats: string;
    };
    sources: string[];
    confidence: string;
  };
  operational_challenges: {
    data: {
      distribution_challenges: string;
      geographic_constraints: string;
    };
    sources: string[];
    confidence: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Perplexity Market Enrichment - Starting request processing');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { dealId, primaryIndustry, location }: MarketEnrichmentRequest = await req.json();

    console.log(`📊 Processing market enrichment for: ${primaryIndustry} in ${location}`);

    // Verify this is a venture capital deal
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        fund_id,
        funds!deals_fund_id_fkey(fund_type)
      `)
      .eq('id', dealId)
      .single();

    if (dealError || !dealData) {
      console.error('❌ Deal not found:', dealError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Deal not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if fund is venture capital
    if (dealData.funds.fund_type !== 'venture_capital') {
      console.log(`🚫 Skipping Perplexity market enrichment for ${primaryIndustry} - Fund type is ${dealData.funds.fund_type}, not venture_capital`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Market enrichment only available for venture capital deals',
        data: null 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Deal ${dealId} confirmed as venture capital - proceeding with market enrichment`);

    // Generate unique snapshot ID
    const snapshotId = `market_${dealId}_${Date.now()}`;
    console.log(`📝 Generated snapshot ID: ${snapshotId}`);

    // Construct structured search query
    const searchQuery = `Research ${primaryIndustry} industry in ${location}, and return the information in the following JSON structure organized by venture capital market evaluation subcategories:

{
  "market_assessment": {
    "data": {
      "market_cycle": "Current market cycle stage for ${primaryIndustry} industry in ${location}",
      "economic_sensitivity": "Economic sensitivity analysis for ${primaryIndustry} industry",
      "investment_climate": "Current investment climate assessment for ${primaryIndustry} in ${location}"
    },
    "sources": ["URL sources used for market assessment"],
    "confidence": "High/Medium/Low confidence level"
  },
  "regulatory_competitive": {
    "data": {
      "regulatory_timeline": "Regulatory development timeline for ${primaryIndustry}",
      "competitive_window": "Competitive opportunity window analysis",
      "regulatory_requirements": "Key regulatory requirements for ${primaryIndustry} in ${location}"
    },
    "sources": ["URL sources for regulatory and competitive analysis"],
    "confidence": "High/Medium/Low confidence level"
  },
  "capital_technology": {
    "data": {
      "capital_requirements": "Capital requirement analysis for ${primaryIndustry}",
      "technology_moats": "Technology barrier and moat analysis"
    },
    "sources": ["URL sources for capital and technology analysis"],
    "confidence": "High/Medium/Low confidence level"
  },
  "operational_challenges": {
    "data": {
      "distribution_challenges": "Distribution challenge assessment for ${primaryIndustry}",
      "geographic_constraints": "Geographic limitation analysis for ${location}"
    },
    "sources": ["URL sources for operational challenges"],
    "confidence": "High/Medium/Low confidence level"
  }
}

Focus on venture capital investment perspectives and recent market data.`;

    console.log('🔍 Calling Perplexity API with structured query...');

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not found');
    }

    // Call Perplexity API
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
            content: 'You are a venture capital market research analyst. Provide accurate, structured market intelligence in JSON format. Focus on recent data and cite sources.'
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        max_tokens: 3000,
        top_p: 0.9,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0,
        response_format: {
          type: "json_schema",
          json_schema: {
            schema: {
              type: "object",
              properties: {
                market_assessment: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        market_cycle: { type: "string" },
                        economic_sensitivity: { type: "string" },
                        investment_climate: { type: "string" }
                      }
                    },
                    sources: { type: "array", items: { type: "string" } },
                    confidence: { type: "string" }
                  }
                },
                regulatory_competitive: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        regulatory_timeline: { type: "string" },
                        competitive_window: { type: "string" },
                        regulatory_requirements: { type: "string" }
                      }
                    },
                    sources: { type: "array", items: { type: "string" } },
                    confidence: { type: "string" }
                  }
                },
                capital_technology: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        capital_requirements: { type: "string" },
                        technology_moats: { type: "string" }
                      }
                    },
                    sources: { type: "array", items: { type: "string" } },
                    confidence: { type: "string" }
                  }
                },
                operational_challenges: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        distribution_challenges: { type: "string" },
                        geographic_constraints: { type: "string" }
                      }
                    },
                    sources: { type: "array", items: { type: "string" } },
                    confidence: { type: "string" }
                  }
                }
              },
              required: ["market_assessment", "regulatory_competitive", "capital_technology", "operational_challenges"]
            }
          }
        }
      }),
    });

    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    console.log('✅ Perplexity API response received');

    const perplexityData = await perplexityResponse.json();
    const rawContent = perplexityData.choices[0].message.content;

    console.log(`📥 Raw Perplexity content: ${rawContent}`);

    // Process the response
    console.log('🔄 Processing Perplexity market response...');
    
    let parsedResponse: PerplexityMarketResponse;
    try {
      // Try to parse JSON from the response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
      console.log('✅ Successfully parsed market data from Perplexity response');
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      // Return error response but don't fail completely
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to parse market intelligence data',
        raw_response: rawContent
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract data points from structured response
    const marketData = {
      market_cycle: parsedResponse.market_assessment?.data?.market_cycle || 'Data not available',
      economic_sensitivity: parsedResponse.market_assessment?.data?.economic_sensitivity || 'Data not available',
      investment_climate: parsedResponse.market_assessment?.data?.investment_climate || 'Data not available',
      regulatory_timeline: parsedResponse.regulatory_competitive?.data?.regulatory_timeline || 'Data not available',
      competitive_window: parsedResponse.regulatory_competitive?.data?.competitive_window || 'Data not available',
      regulatory_requirements: parsedResponse.regulatory_competitive?.data?.regulatory_requirements || 'Data not available',
      capital_requirements: parsedResponse.capital_technology?.data?.capital_requirements || 'Data not available',
      technology_moats: parsedResponse.capital_technology?.data?.technology_moats || 'Data not available',
      distribution_challenges: parsedResponse.operational_challenges?.data?.distribution_challenges || 'Data not available',
      geographic_constraints: parsedResponse.operational_challenges?.data?.geographic_constraints || 'Data not available'
    };

    // Collect subcategory sources and confidence
    const subcategorySources = {
      market_assessment: parsedResponse.market_assessment?.sources || [],
      regulatory_competitive: parsedResponse.regulatory_competitive?.sources || [],
      capital_technology: parsedResponse.capital_technology?.sources || [],
      operational_challenges: parsedResponse.operational_challenges?.sources || []
    };

    const subcategoryConfidence = {
      market_assessment: parsedResponse.market_assessment?.confidence || 'Low',
      regulatory_competitive: parsedResponse.regulatory_competitive?.confidence || 'Low',
      capital_technology: parsedResponse.capital_technology?.confidence || 'Low',
      operational_challenges: parsedResponse.operational_challenges?.confidence || 'Low'
    };

    // Calculate overall data quality score
    const totalSources = Object.values(subcategorySources).flat().length;
    const highConfidenceCount = Object.values(subcategoryConfidence).filter(c => c === 'High').length;
    const dataQualityScore = Math.min(100, (totalSources * 10) + (highConfidenceCount * 15));

    console.log('💾 Inserting processed market data into database...');

    // Insert into database
    const { error: insertError } = await supabase
      .from('deal_enrichment_perplexity_market_export_vc')
      .insert({
        deal_id: dealId,
        snapshot_id: snapshotId,
        primary_industry: primaryIndustry,
        location: location,
        ...marketData,
        subcategory_sources: subcategorySources,
        subcategory_confidence: subcategoryConfidence,
        raw_perplexity_response: {
          query: searchQuery,
          response: rawContent,
          parsed_data: parsedResponse,
          api_metadata: {
            model: 'sonar',
            timestamp: new Date().toISOString(),
            sources_count: totalSources
          }
        },
        processing_status: 'completed',
        data_quality_score: dataQualityScore,
        confidence_level: highConfidenceCount >= 2 ? 'High' : highConfidenceCount >= 1 ? 'Medium' : 'Low',
        processed_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Database insertion failed:', insertError);
      throw insertError;
    }

    console.log('✅ Processed market data inserted successfully');

    // Build and update JSON column
    console.log('📊 Building market analysis JSON structure...');
    const marketAnalysisJSON = await buildMarketAnalysisJSON(supabase, dealId, marketData, subcategorySources, subcategoryConfidence);
    
    console.log('💾 Updating JSON column...');
    const { error: jsonUpdateError } = await supabase
      .from('deal_enrichment_perplexity_market_export_vc')
      .update({ 
        deal_enrichment_perplexity_market_export_vc_json: marketAnalysisJSON
      })
      .eq('deal_id', dealId)
      .eq('snapshot_id', snapshotId);

    if (jsonUpdateError) {
      console.error('⚠️ Failed to update JSON column:', jsonUpdateError);
      // Continue execution - don't fail the entire process for JSON update issues
    } else {
      console.log('✅ JSON column updated successfully');
    }

    const result = {
      success: true,
      data: {
        ...marketData,
        subcategory_sources: subcategorySources,
        subcategory_confidence: subcategoryConfidence,
        data_quality_score: dataQualityScore,
        confidence_level: highConfidenceCount >= 2 ? 'High' : highConfidenceCount >= 1 ? 'Medium' : 'Low'
      },
      snapshot_id: snapshotId,
      data_quality_score: dataQualityScore
    };

    console.log('✅ Perplexity market enrichment completed successfully');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in perplexity-market-enrichment function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to build Market Analysis JSON structure
async function buildMarketAnalysisJSON(supabase: any, dealId: string, marketData: any, subcategorySources: any, subcategoryConfidence: any) {
  try {
    console.log('🔧 Building market analysis JSON structure...');
    
    // Synthesize Market Timing insights from all subcategory sources
    const allSources = [
      ...(subcategorySources.market_assessment || []),
      ...(subcategorySources.regulatory_competitive || []),
      ...(subcategorySources.capital_technology || []),
      ...(subcategorySources.operational_challenges || [])
    ];
    
    const marketTiming = {
      timing_assessment: "Market timing analysis based on current market cycle, competitive window, and investment climate",
      key_factors: [
        marketData.market_cycle ? `Market Cycle: ${marketData.market_cycle.substring(0, 100)}...` : "Market cycle analysis pending",
        marketData.competitive_window ? `Competitive Window: ${marketData.competitive_window.substring(0, 100)}...` : "Competitive analysis pending",
        marketData.investment_climate ? `Investment Climate: ${marketData.investment_climate.substring(0, 100)}...` : "Investment climate assessment pending"
      ],
      sources: allSources.slice(0, 5), // Limit to top 5 sources
      confidence: subcategoryConfidence.market_assessment || "Medium"
    };
    
    // Synthesize Market Barriers & Regulation insights
    const marketBarriersRegulation = {
      regulatory_landscape: marketData.regulatory_requirements || "Regulatory requirements analysis pending",
      market_barriers: [
        marketData.distribution_challenges ? `Distribution: ${marketData.distribution_challenges.substring(0, 100)}...` : "Distribution analysis pending",
        marketData.geographic_constraints ? `Geographic: ${marketData.geographic_constraints.substring(0, 100)}...` : "Geographic analysis pending",
        marketData.capital_requirements ? `Capital: ${marketData.capital_requirements.substring(0, 100)}...` : "Capital analysis pending"
      ],
      regulatory_timeline: marketData.regulatory_timeline || "Timeline analysis pending",
      sources: allSources.slice(0, 5),
      confidence: subcategoryConfidence.regulatory_competitive || "Medium"
    };

    return {
      // Market Analysis Data Points (10 direct fields)
      "Market Cycle": marketData.market_cycle || null,
      "Economic Sensitivity": marketData.economic_sensitivity || null,
      "Investment Climate": marketData.investment_climate || null,
      "Regulatory Timeline": marketData.regulatory_timeline || null,
      "Competitive Window": marketData.competitive_window || null,
      "Regulatory Requirements": marketData.regulatory_requirements || null,
      "Capital Requirements": marketData.capital_requirements || null,
      "Technology Moats": marketData.technology_moats || null,
      "Distribution Challenges": marketData.distribution_challenges || null,
      "Geographic Constraints": marketData.geographic_constraints || null,
      
      // Subcategory Sources Data (4 categories)
      "Market Assessment Sources": subcategorySources.market_assessment || [],
      "Regulatory Competitive Sources": subcategorySources.regulatory_competitive || [],
      "Capital Technology Sources": subcategorySources.capital_technology || [],
      "Operational Challenges Sources": subcategorySources.operational_challenges || [],
      
      // Synthesized Insights (2 aggregate fields)
      "Market Timing": marketTiming,
      "Market Barriers & Regulation": marketBarriersRegulation,
      
      // Standard VC Metrics (set to null for market analysis)
      "TAM": null,
      "SAM": null,
      "SOM": null,
      "CAGR": null,
      "Growth Drivers": null,
      "Key Market Players": null,
      "Competitive Position": null,
      "Customer Acquisition Cost": null,
      "LTV/CAC Ratio": null,
      "Market Share": null,
      "Revenue Model": null,
      "Scalability Metrics": null,
      "Technology Readiness": null,
      "IP Portfolio": null,
      "Competitive Moats": null,
      "Scalability Moats": null,
      
      // Metadata
      "metadata": {
        "generated_at": new Date().toISOString(),
        "data_sources_count": allSources.length,
        "confidence_distribution": subcategoryConfidence,
        "analysis_type": "market_intelligence",
        "version": "1.0"
      }
    };

  } catch (error) {
    console.error('❌ Error building market analysis JSON:', error);
    return {
      error: "Failed to build market analysis JSON structure",
      timestamp: new Date().toISOString()
    };
  }
}