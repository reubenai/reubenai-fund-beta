import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerplexityDataMiningRequest {
  deal_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [VC Datamining] Function started');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!perplexityApiKey) {
      throw new Error('Missing Perplexity API key');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let dealId: string;

    if (req.method === 'POST') {
      const requestData: PerplexityDataMiningRequest = await req.json();
      dealId = requestData.deal_id;
    } else {
      throw new Error('Invalid request method');
    }

    console.log(`📊 [VC Datamining] Processing deal: ${dealId}`);

    // Get the queued record from perplexity_datamining_vc
    const { data: queuedRecord, error: fetchError } = await supabase
      .from('perplexity_datamining_vc')
      .select('*')
      .eq('deal_id', dealId)
      .eq('processing_status', 'queued')
      .single();

    if (fetchError || !queuedRecord) {
      console.log(`❌ [VC Datamining] No queued record found for deal ${dealId}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No queued record found or already processed'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update status to processing
    await supabase
      .from('perplexity_datamining_vc')
      .update({ 
        processing_status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('deal_id', dealId);

    console.log(`🔄 [VC Datamining] Updated status to processing for ${queuedRecord.company_name}`);

    // Get deal information for context
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select('company_name, industry, description, website, linkedin_url, crunchbase_url, location, founders')
      .eq('id', dealId)
      .single();

    if (dealError) {
      throw new Error(`Failed to fetch deal data: ${dealError.message}`);
    }

    const companyName = dealData.company_name;
    const industry = dealData.industry || 'Unknown';
    const description = dealData.description || '';
    const website = dealData.website || '';
    const linkedinUrl = dealData.linkedin_url || '';
    const crunchbaseUrl = dealData.crunchbase_url || '';
    const location = dealData.location || '';
    const founders = dealData.founders || '';

    console.log(`🏢 [VC Datamining] Processing company: ${companyName} in ${industry}`);

    try {
      // Generate comprehensive prompt using the user's template
      const prompt = generateComprehensivePrompt(companyName, website, linkedinUrl, crunchbaseUrl, industry, location, founders);
      
      console.log(`📊 [VC Datamining] Making single comprehensive API call to Perplexity`);
      
      // Make single API call to Perplexity
      const rawResponse = await callPerplexityAPI(perplexityApiKey, prompt);
      
      console.log(`✅ [VC Datamining] Received comprehensive response from Perplexity`);
      
      // Stage 2: Clean and structure the JSON response
      const cleanedJson = buildPerplexityVCDataminingJSON(rawResponse);
      
      // Stage 3: Extract individual data fields for database columns
      const extractedData = extractIndividualDataFields(cleanedJson);
      
      // Calculate data quality score based on populated fields
      const dataQualityScore = calculateDataQualityScore(cleanedJson);
      
      // Update the record with comprehensive results
      const updateData = {
        processing_status: 'completed',
        processing_completed_at: new Date().toISOString(),
        data_quality_score: dataQualityScore,
        raw_perplexity_response: rawResponse,
        perplexity_datamining_vc_json: cleanedJson,
        processing_errors: null,
        
        // Individual data fields extracted from comprehensive response
        ...extractedData
      };

      const { error: updateError } = await supabase
        .from('perplexity_datamining_vc')
        .update(updateData)
        .eq('deal_id', dealId);

      if (updateError) {
        throw new Error(`Failed to update record: ${updateError.message}`);
      }

      console.log(`🎉 [VC Datamining] Successfully completed comprehensive processing for ${companyName}`);
      console.log(`📊 [VC Datamining] Data quality score: ${dataQualityScore}%`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `VC datamining completed for ${companyName}`,
          data_quality_score: dataQualityScore,
          comprehensive_analysis: true,
          subcategories_processed: 21
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (error) {
      console.error(`❌ [VC Datamining] Error during comprehensive processing:`, error);
      
      // Update status to failed
      await supabase
        .from('perplexity_datamining_vc')
        .update({ 
          processing_status: 'failed',
          processing_completed_at: new Date().toISOString(),
          processing_errors: [error.message]
        })
        .eq('deal_id', dealId);

      return new Response(
        JSON.stringify({
          success: false,
          message: `VC datamining failed for ${companyName}`,
          error: error.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('❌ [VC Datamining] Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateComprehensivePrompt(companyName: string, website: string, linkedinUrl: string, crunchbaseUrl: string, industry: string, location: string, founders: string): string {
  const systemContent = `You are Perplexity, a cautious data search engine and market research analyst. You return only verifiable facts with citations. Never fabricate numbers or entities. If data cannot be verified from credible sources, return null (or an empty array) and add a short reason in the notes field. Respond in pure JSON that strictly matches the provided schema.`;

  const userContent = `Research the target: company=${companyName}; website=${website}; LinkedIn=${linkedinUrl}, Crunchbase=${crunchbaseUrl}, industry=${industry}; country=${location}; founders=${founders}. Answer the rubric below. For each subcriterion: (1) answer the guiding questions, (2) populate the structured fields, (3) include sources as [{title, url}], (4) set confidence to High/Medium/Low based on source quality and agreement.

General rules:

Use primary sources where possible (stat filings, regulator data, official releases), then reputable analysts/press.

Prefer data from the last 24 months; allow older for TAM/SAM/SOM or foundational market sizing.

Currency: USD unless the source is clearly another currency (then convert and note).

No markdown; return JSON only.

Rubric & guiding questions to answer:

TEAM & LEADERSHIP

1. Founder Experience — What prior startups and roles are verifiably linked to the founders? Outcomes (IPO, acquisition, shutdown), years active?

2. Domain Expertise — What evidence shows deep, relevant expertise (education, prior roles, publications, patents)?

3. Execution Track Record — Which milestones shipped on time/quality? Any case studies, deployments, or measurable delivery examples?

MARKET OPPORTUNITY
4) Market Size/TAM/SAM/SOM — What is the verifiable size of the total/serviceable/obtainable market? Methodology and year?
5) Market Growth Rate — What CAGR and growth drivers are supported by credible sources?
6) Market Timing — Why now? Adoption/readiness signals, regulatory catalysts, macro drivers?
7) Competitive Landscape — Who are key competitors; how is the target differentiated; any share estimates?

PRODUCT & TECHNOLOGY
8) Product–Market Fit — What hard signals (NPS, retention, expansion, waitlists, case studies) exist?
9) Technology Differentiation — What defensible moats (IP, algorithms, data, integrations)?
10) Scalability — What are known bottlenecks and evidence of scaling (architecture notes, SLAs, volumes)?

BUSINESS TRACTION
11) Revenue Growth — Current ARR/MRR and YoY growth (if disclosed)?
12) Customer Metrics — CAC, LTV, LTV/CAC, churn, NDR, active customers (if disclosed)?
13) Partnership/Validation — Strategic partners, certifications, or third-party validations?

FINANCIAL HEALTH
14) Unit Economics — Gross margin, contribution margin, CAC, LTV, LTV/CAC.
15) Burn Rate/Runway — Monthly burn and runway months (if disclosed).
16) Funding History — Round details, amounts, dates, investors.

STRATEGIC TIMING
17) Market Entry Timing — What triggers make this an opportune entry point?
18) Competitive Timing — What competitor moves open a window (product sunsets, price hikes, regulatory actions)?

TRUST & TRANSPARENCY
19) Corporate Governance — Board composition, committees, auditor, key policies.
20) Stakeholder Relations — Investor updates cadence, customer satisfaction signals, employee sentiment.
21) ESG Compliance — Policies, certifications, and salient risks.

Return only valid JSON according to the schema provided.`;

  return `${systemContent}\n\n${userContent}`;
}

function buildPerplexityVCDataminingJSON(rawResponse: any): any {
  try {
    // Try to parse the response content if it's a string
    let parsedResponse = rawResponse;
    if (typeof rawResponse === 'string') {
      parsedResponse = JSON.parse(rawResponse);
    }
    
    // If the response has a 'data' field containing the JSON, extract it
    if (parsedResponse.data && typeof parsedResponse.data === 'string') {
      parsedResponse = JSON.parse(parsedResponse.data);
    }
    
    // Structure the comprehensive response with all 21 subcategories
    const structuredData = {
      subject: parsedResponse.subject || null,
      team_leadership: {
        founder_experience: parsedResponse.team_leadership?.founder_experience || { data: null, sources: [], confidence: "Low", notes: "Data not available" },
        domain_expertise: parsedResponse.team_leadership?.domain_expertise || { data: null, sources: [], confidence: "Low", notes: "Data not available" },
        execution_track_record: parsedResponse.team_leadership?.execution_track_record || { data: null, sources: [], confidence: "Low", notes: "Data not available" }
      },
      market_opportunity: {
        market_size: parsedResponse.market_opportunity?.market_size || { data: { tam: null, sam: null, som: null }, sources: [], confidence: "Low", notes: "Data not available" },
        market_growth_rate: parsedResponse.market_opportunity?.market_growth_rate || { data: { cagr: null, growth_drivers: [] }, sources: [], confidence: "Low", notes: "Data not available" },
        market_timing: parsedResponse.market_opportunity?.market_timing || { data: { readiness_signals: [] }, sources: [], confidence: "Low", notes: "Data not available" },
        competitive_landscape: parsedResponse.market_opportunity?.competitive_landscape || { data: { competitors: [], differentiation: null }, sources: [], confidence: "Low", notes: "Data not available" }
      },
      product_technology: {
        product_market_fit: parsedResponse.product_technology?.product_market_fit || { data: null, sources: [], confidence: "Low", notes: "Data not available" },
        technology_differentiation: parsedResponse.product_technology?.technology_differentiation || { data: { moats: [] }, sources: [], confidence: "Low", notes: "Data not available" },
        scalability: parsedResponse.product_technology?.scalability || { data: null, sources: [], confidence: "Low", notes: "Data not available" }
      },
      business_traction: {
        revenue_growth: parsedResponse.business_traction?.revenue_growth || { data: { arr_mrr: null, yoy_growth: null }, sources: [], confidence: "Low", notes: "Data not available" },
        customer_metrics: parsedResponse.business_traction?.customer_metrics || { data: { cac: null, ltv: null, ltv_cac_ratio: null }, sources: [], confidence: "Low", notes: "Data not available" },
        partnership_validation: parsedResponse.business_traction?.partnership_validation || { data: { partners: [] }, sources: [], confidence: "Low", notes: "Data not available" }
      },
      financial_health: {
        unit_economics: parsedResponse.financial_health?.unit_economics || { data: null, sources: [], confidence: "Low", notes: "Data not available" },
        burn_rate_runway: parsedResponse.financial_health?.burn_rate_runway || { data: { burn_rate: null, runway_months: null }, sources: [], confidence: "Low", notes: "Data not available" },
        funding_history: parsedResponse.financial_health?.funding_history || { data: { rounds: [] }, sources: [], confidence: "Low", notes: "Data not available" }
      },
      strategic_timing: {
        market_entry_timing: parsedResponse.strategic_timing?.market_entry_timing || { data: { optimal_entry_rationale: [], trigger_events: [] }, sources: [], confidence: "Low", notes: "Data not available" },
        competitive_timing: parsedResponse.strategic_timing?.competitive_timing || { data: { recent_competitor_moves: [], window_of_opportunity: null }, sources: [], confidence: "Low", notes: "Data not available" }
      },
      trust_transparency: {
        corporate_governance: parsedResponse.trust_transparency?.corporate_governance || { data: { board_members: [], auditor: null, policies: [] }, sources: [], confidence: "Low", notes: "Data not available" },
        stakeholder_relations: parsedResponse.trust_transparency?.stakeholder_relations || { data: { investor_updates_frequency: null, customer_sentiment_summary: null }, sources: [], confidence: "Low", notes: "Data not available" },
        esg_compliance: parsedResponse.trust_transparency?.esg_compliance || { data: { policies: [], certifications: [], risks: [] }, sources: [], confidence: "Low", notes: "Data not available" }
      },
      metadata: {
        last_updated: new Date().toISOString(),
        overall_confidence: parsedResponse.metadata?.overall_confidence || "Low",
        origin: "perplexity_comprehensive_vc_analysis"
      }
    };
    
    return structuredData;
  } catch (error) {
    console.error('Error building comprehensive VC JSON:', error);
    // Return minimal structure if parsing fails
    return {
      subject: null,
      team_leadership: {},
      market_opportunity: {},
      product_technology: {},
      business_traction: {},
      financial_health: {},
      strategic_timing: {},
      trust_transparency: {},
      metadata: {
        last_updated: new Date().toISOString(),
        overall_confidence: "Low",
        origin: "perplexity_comprehensive_vc_analysis"
      },
      parsing_error: error.message
    };
  }
}

function extractIndividualDataFields(cleanedJson: any): any {
  // Extract individual fields from comprehensive JSON for database columns
  return {
    tam: cleanedJson.market_opportunity?.market_size?.data?.tam || null,
    sam: cleanedJson.market_opportunity?.market_size?.data?.sam || null,
    som: cleanedJson.market_opportunity?.market_size?.data?.som || null,
    cagr: cleanedJson.market_opportunity?.market_growth_rate?.data?.cagr || null,
    competitors: cleanedJson.market_opportunity?.competitive_landscape?.data?.competitors || null,
    ltv_cac_ratio: cleanedJson.business_traction?.customer_metrics?.data?.ltv_cac_ratio || null,
    burn_rate: cleanedJson.financial_health?.burn_rate_runway?.data?.burn_rate || null,
    runway_months: cleanedJson.financial_health?.burn_rate_runway?.data?.runway_months || null,
    funding_history: cleanedJson.financial_health?.funding_history?.data?.rounds || null,
    
    // Confidence scores for individual fields
    subcategory_confidence: {
      tam: cleanedJson.market_opportunity?.market_size?.confidence || "Low",
      sam: cleanedJson.market_opportunity?.market_size?.confidence || "Low",
      som: cleanedJson.market_opportunity?.market_size?.confidence || "Low",
      cagr: cleanedJson.market_opportunity?.market_growth_rate?.confidence || "Low",
      competitors: cleanedJson.market_opportunity?.competitive_landscape?.confidence || "Low",
      ltv_cac_ratio: cleanedJson.business_traction?.customer_metrics?.confidence || "Low",
      burn_rate: cleanedJson.financial_health?.burn_rate_runway?.confidence || "Low",
      runway_months: cleanedJson.financial_health?.burn_rate_runway?.confidence || "Low",
      funding_history: cleanedJson.financial_health?.funding_history?.confidence || "Low"
    },
    
    // Sources for individual fields
    subcategory_sources: {
      tam: cleanedJson.market_opportunity?.market_size?.sources || [],
      sam: cleanedJson.market_opportunity?.market_size?.sources || [],
      som: cleanedJson.market_opportunity?.market_size?.sources || [],
      cagr: cleanedJson.market_opportunity?.market_growth_rate?.sources || [],
      competitors: cleanedJson.market_opportunity?.competitive_landscape?.sources || [],
      ltv_cac_ratio: cleanedJson.business_traction?.customer_metrics?.sources || [],
      burn_rate: cleanedJson.financial_health?.burn_rate_runway?.sources || [],
      runway_months: cleanedJson.financial_health?.burn_rate_runway?.sources || [],
      funding_history: cleanedJson.financial_health?.funding_history?.sources || []
    }
  };
}

function calculateDataQualityScore(cleanedJson: any): number {
  let populatedFields = 0;
  let totalFields = 21; // Total number of subcategories
  
  // Count populated subcategories
  const subcategories = [
    cleanedJson.team_leadership?.founder_experience,
    cleanedJson.team_leadership?.domain_expertise,
    cleanedJson.team_leadership?.execution_track_record,
    cleanedJson.market_opportunity?.market_size,
    cleanedJson.market_opportunity?.market_growth_rate,
    cleanedJson.market_opportunity?.market_timing,
    cleanedJson.market_opportunity?.competitive_landscape,
    cleanedJson.product_technology?.product_market_fit,
    cleanedJson.product_technology?.technology_differentiation,
    cleanedJson.product_technology?.scalability,
    cleanedJson.business_traction?.revenue_growth,
    cleanedJson.business_traction?.customer_metrics,
    cleanedJson.business_traction?.partnership_validation,
    cleanedJson.financial_health?.unit_economics,
    cleanedJson.financial_health?.burn_rate_runway,
    cleanedJson.financial_health?.funding_history,
    cleanedJson.strategic_timing?.market_entry_timing,
    cleanedJson.strategic_timing?.competitive_timing,
    cleanedJson.trust_transparency?.corporate_governance,
    cleanedJson.trust_transparency?.stakeholder_relations,
    cleanedJson.trust_transparency?.esg_compliance
  ];
  
  subcategories.forEach(subcategory => {
    if (subcategory && subcategory.data && subcategory.confidence !== "Low") {
      populatedFields++;
    }
  });
  
  return Math.round((populatedFields / totalFields) * 100);
}

async function callPerplexityAPI(apiKey: string, prompt: string) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online', // Using larger model for comprehensive analysis
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      top_p: 0.9,
      max_tokens: 4000, // Increased for comprehensive response
      return_images: false,
      return_related_questions: false,
      search_recency_filter: 'month',
      frequency_penalty: 1,
      presence_penalty: 0
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.choices || result.choices.length === 0) {
    throw new Error('No response from Perplexity API');
  }

  const content = result.choices[0].message?.content;
  
  if (!content) {
    throw new Error('Empty response from Perplexity API');
  }

  // Return the full response for comprehensive processing
  return {
    data: content.trim(),
    raw_response: result,
    timestamp: new Date().toISOString()
  };
}