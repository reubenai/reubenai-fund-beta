import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketEnrichmentRequest {
  dealId: string;
  companyName: string;
  additionalContext?: {
    website?: string;
    linkedin?: string;
    crunchbase?: string;
    primaryIndustries?: string[];
    industry?: string;
    location?: string;
    founders?: string[];
    founder?: string;
  };
}

// Simplified VC Research Response (maps directly to database columns)
interface SimplifiedVCResponse {
  // Market data (18 database fields)
  tam?: string | null;
  sam?: string | null;
  som?: string | null;
  cagr?: string | null;
  growth_drivers?: string | null;
  competitors?: string | null;
  key_customers?: string | null;
  partnerships?: string | null;
  technology_stack?: string | null;
  technology_moats?: string | null;
  business_model?: string | null;
  unit_economics?: string | null;
  ltv_cac_ratio?: string | null;
  retention_rate?: string | null;
  leadership_experience?: string | null;
  funding_stage?: string | null;
  employee_count?: string | null;
  geographic_presence?: string | null;
  
  // Combined sources for all data points
  sources?: string | null;
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

    const { dealId, companyName, additionalContext }: MarketEnrichmentRequest = await req.json();

    console.log(`🔍 Processing comprehensive VC research for: ${companyName}`);

    // Pull richer context from `additionalContext`
    const companyWebsite = additionalContext?.website ?? "Not Provided";
    const companyLinkedIn = additionalContext?.linkedin ?? "Not Provided";
    const companyCrunchbase = additionalContext?.crunchbase ?? "Not Provided";
    const industries = 
      Array.isArray(additionalContext?.primaryIndustries)
        ? additionalContext.primaryIndustries.join(", ")
        : (additionalContext?.industry ?? "Not Provided");
    const country = additionalContext?.location ?? "Not Provided";
    const founders = 
      Array.isArray(additionalContext?.founders)
        ? additionalContext.founders.join(", ")
        : (additionalContext?.founder ?? "Not Provided");

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
      console.log(`🚫 Skipping comprehensive VC research for ${companyName} - Fund type is ${dealData.funds.fund_type}, not venture_capital`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'VC research only available for venture capital deals',
        data: null 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Deal ${dealId} confirmed as venture capital - proceeding with comprehensive VC research`);

    // Generate unique snapshot ID
    const snapshotId = `vc_research_${dealId}_${Date.now()}`;
    console.log(`📝 Generated snapshot ID: ${snapshotId}`);

    // Build the simplified prompt
    const systemContent = `
You are Perplexity, a market research analyst. Return only verifiable facts with sources. Never fabricate data. If data cannot be verified, return null. Respond in pure JSON that matches the provided schema.
`.trim();

    const userContent = `
Research company: ${companyName} (website: ${companyWebsite}, LinkedIn: ${companyLinkedIn}, industry: ${industries}, location: ${country}, founders: ${founders}).

Provide 1-2 sentence answers for each field. Only use verifiable data from credible sources. If no data found, return null.

Fields to research:
- tam: Total addressable market size in USD
- sam: Serviceable addressable market size in USD  
- som: Serviceable obtainable market size in USD
- cagr: Market growth rate percentage with time period
- growth_drivers: Key factors driving market growth
- competitors: Main competitors in the space
- key_customers: Notable customers or user base
- partnerships: Strategic partnerships or integrations
- technology_stack: Core technologies used
- technology_moats: Technological competitive advantages
- business_model: How the company makes money
- unit_economics: Key financial metrics (CAC, LTV, margins)
- ltv_cac_ratio: Customer lifetime value to acquisition cost ratio
- retention_rate: Customer or revenue retention percentage
- leadership_experience: Founder/leadership background and experience
- funding_stage: Current funding stage and amounts raised
- employee_count: Number of employees
- geographic_presence: Geographic markets served

Also provide:
- sources: List all sources used (title and URL) as a single text field

Return only valid JSON. Use null for missing data.
`.trim();

    console.log('🔍 Calling Perplexity API with structured query...');

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not found');
    }

    // Call Perplexity API with simplified schema
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userContent }
        ],
        max_tokens: 6000,
        temperature: 0.1,
        top_p: 0.9,
        frequency_penalty: 1,
        presence_penalty: 0,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'SimplifiedVCResearch',
            schema: {
              type: "object",
              properties: {
                tam: { type: ["string", "null"] },
                sam: { type: ["string", "null"] },
                som: { type: ["string", "null"] },
                cagr: { type: ["string", "null"] },
                growth_drivers: { type: ["string", "null"] },
                competitors: { type: ["string", "null"] },
                key_customers: { type: ["string", "null"] },
                partnerships: { type: ["string", "null"] },
                technology_stack: { type: ["string", "null"] },
                technology_moats: { type: ["string", "null"] },
                business_model: { type: ["string", "null"] },
                unit_economics: { type: ["string", "null"] },
                ltv_cac_ratio: { type: ["string", "null"] },
                retention_rate: { type: ["string", "null"] },
                leadership_experience: { type: ["string", "null"] },
                funding_stage: { type: ["string", "null"] },
                employee_count: { type: ["string", "null"] },
                geographic_presence: { type: ["string", "null"] },
                sources: { type: ["string", "null"] }
              },
              additionalProperties: true
            }
          }
        }
      }),
    });

    console.log('✅ Perplexity API response received');

    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API error: ${perplexityResponse.status} ${perplexityResponse.statusText}`);
    }

    const perplexityData = await perplexityResponse.json();
    const rawContent = perplexityData.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error('No content received from Perplexity API');
    }

    console.log('🔄 Processing Perplexity VC research response...');
    console.log(`📥 Raw Perplexity content: ${rawContent.slice(0, 500)}...`);

    let parsedResponse: SimplifiedVCResponse;

    try {
      parsedResponse = JSON.parse(rawContent);
      console.log('✅ Successfully parsed JSON response');
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.log(`Raw content length: ${rawContent.length}`);
      console.log(`Content preview: ${rawContent.slice(0, 500)}`);
      
      // Try to clean and parse again
      console.log('❌ First parse attempt failed, trying to clean JSON...');
      try {
        const cleanedContent = rawContent
          .replace(/\r?\n\s*/g, ' ')  // Remove newlines and extra whitespace
          .replace(/,\s*}/g, '}')     // Remove trailing commas
          .replace(/,\s*]/g, ']')     // Remove trailing commas in arrays
          .trim();
        
        parsedResponse = JSON.parse(cleanedContent);
        console.log('✅ Successfully parsed cleaned JSON response');
      } catch (cleanError) {
        console.error('❌ Failed to parse cleaned JSON:', cleanError);
        // Return a minimal response with error info
        parsedResponse = {
          tam: null,
          sam: null,
          som: null,
          cagr: null,
          growth_drivers: null,
          competitors: null,
          key_customers: null,
          partnerships: null,
          technology_stack: null,
          technology_moats: null,
          business_model: null,
          unit_economics: null,
          ltv_cac_ratio: null,
          retention_rate: null,
          leadership_experience: null,
          funding_stage: null,
          employee_count: null,
          geographic_presence: null,
          sources: `Error parsing Perplexity response: ${cleanError.message}`
        };
      }
    }

    // Extract VC research data from simplified flat response
    const vcResearchData = {
      // Team & Leadership 
      founder_experience: parsedResponse.leadership_experience || null,
      team_composition: null, 
      vision_communication: null,
      
      // Market Opportunity
      competitive_landscape: parsedResponse.competitors || null,
      market_size: parsedResponse.tam || null,
      market_timing: null,
      market_validation: null,
      
      // Product & Technology
      product_innovation: null,
      technology_advantage: parsedResponse.technology_moats || null,
      product_market_fit: null,
      
      // Business Traction
      revenue_growth: null,
      customer_metrics: parsedResponse.ltv_cac_ratio || null,
      
      // Financial Health
      financial_performance: parsedResponse.unit_economics || null,
      capital_efficiency: null,
      financial_planning: parsedResponse.funding_stage || null,
      
      // Strategic Timing
      portfolio_synergies: parsedResponse.partnerships || null,
      investment_thesis_alignment: null,
      value_creation_potential: null,

      // Legacy fields for backward compatibility (directly from simplified response)
      tam: parsedResponse.tam || null,
      sam: parsedResponse.sam || null,
      som: parsedResponse.som || null,
      cagr: parsedResponse.cagr || null,
      growth_drivers: parsedResponse.growth_drivers ? [parsedResponse.growth_drivers] : [],
      key_market_players: parsedResponse.competitors ? parsedResponse.competitors.split(',').map(c => c.trim()) : [],
      addressable_customers: parsedResponse.key_customers || null,
      whitespace_opportunities: [],
      ltv_cac_ratio: parsedResponse.ltv_cac_ratio || null,
      cac_trend: null,
      retention_rate: parsedResponse.retention_rate || null,
      strategic_advisors: [],
      investor_network: parsedResponse.funding_stage ? [parsedResponse.funding_stage] : [],
      market_share_distribution: {},
      channel_effectiveness: {},
      partnership_ecosystem: {}
    };

    // Since we simplified the schema, we'll create a simple sources structure
    const allSources = parsedResponse.sources || '';
    const sourcesArray = allSources ? allSources.split('\n').filter(s => s.trim()).map(s => ({ title: s.trim(), url: '' })) : [];
    
    const subcategorySources = {
      team_leadership: sourcesArray,
      market_opportunity: sourcesArray,
      product_technology: sourcesArray,
      business_traction: sourcesArray,
      financial_health: sourcesArray,
      strategic_timing: sourcesArray,
      trust_transparency: sourcesArray
    };

    const subcategoryConfidence = {
      team_leadership: parsedResponse.leadership_experience ? 'Medium' : 'Low',
      market_opportunity: parsedResponse.tam ? 'Medium' : 'Low',
      product_technology: parsedResponse.technology_stack ? 'Medium' : 'Low',
      business_traction: parsedResponse.ltv_cac_ratio ? 'Medium' : 'Low',
      financial_health: parsedResponse.unit_economics ? 'Medium' : 'Low',
      strategic_timing: parsedResponse.partnerships ? 'Medium' : 'Low',
      trust_transparency: 'Low'
    };

    // Calculate overall data quality score based on populated fields
    const totalSources = sourcesArray.length;
    const populatedFields = Object.values(parsedResponse).filter(v => v !== null && v !== undefined && v !== '').length;
    const highConfidenceCount = Object.values(subcategoryConfidence).filter(c => c === 'Medium' || c === 'High').length;
    const dataQualityScore = Math.min(100, (populatedFields * 5) + (totalSources * 2) + (highConfidenceCount * 10));

    console.log('💾 Inserting comprehensive VC research data into database...');

    // Insert into database with comprehensive data
    const { error: insertError } = await supabase
      .from('deal_enrichment_perplexity_market_export_vc')
      .insert({
        deal_id: dealId,
        snapshot_id: snapshotId,
        company_name: companyName,
        primary_industry: industries,
        location: country,
        ...vcResearchData,
        subcategory_sources: subcategorySources,
        subcategory_confidence: subcategoryConfidence,
        raw_perplexity_response: {
          query: userContent,
          response: rawContent,
          parsed_data: parsedResponse,
          api_metadata: {
            model: 'llama-3.1-sonar-large-128k-online',
            timestamp: new Date().toISOString(),
            sources_count: sourcesArray.length
          }
        },
        processing_status: 'completed',
        data_quality_score: dataQualityScore,
        confidence_level: highConfidenceCount >= 3 ? 'High' : highConfidenceCount >= 2 ? 'Medium' : 'Low',
        processed_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Database insertion failed:', insertError);
      throw insertError;
    }

    console.log('✅ Processed market data inserted successfully');

    const result = {
      success: true,
      data: {
        ...vcResearchData,
        subcategory_sources: subcategorySources,
        subcategory_confidence: subcategoryConfidence,
        data_quality_score: dataQualityScore,
        confidence_level: highConfidenceCount >= 3 ? 'High' : highConfidenceCount >= 2 ? 'Medium' : 'Low'
      },
      snapshot_id: snapshotId,
      data_quality_score: dataQualityScore
    };

    console.log('✅ Comprehensive VC research enrichment completed successfully');

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