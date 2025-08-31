import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SYSTEM_PROMPT = `SYSTEM
You are a precise data aggregator. Your job is to read multiple source payloads, apply a fixed source priority (waterfall), and return a single JSON object with ALL required keys populated. Do NOT fabricate data. If a field is NULL/missing or states "Not Listed" / "Not Available" / "N/A" / "-" (case-insensitive), output the string "Data Not Available" for that field. Always return valid JSON.

INPUT
You will receive a JSON object with these keys (objects or null):
{
  "deal_id": "<string or number>",
  "documents_data_points_vc": { ... } | null,
  "deal_enrichment_crunchbase_export": { ... } | null,
  "deal_enrichment_linkedin_export": { ... } | null,
  "deal_enrichment_linkedin_profile_export": { ... } | null,
  "deal_enrichment_perplexity_company_export_vc": { ... } | null,
  "deal_enrichment_perplexity_founder_export_vc": { ... } | null,
  "deal_enrichment_perplexity_market_export_vc": { ... } | null
}

SOURCE PRIORITY (Waterfall)
Use the first non-missing, non-"not listed/not available" value in this order:
1) documents_data_points_vc  (highest priority)
2) deal_enrichment_crunchbase_export
3) deal_enrichment_linkedin_export
4) deal_enrichment_linkedin_profile_export
5) ANY of the three Perplexity exports (company/founder/market) — same priority; pick the first available among them
If nothing qualifies, output "Data Not Available".

GENERAL RULES
- NO fabrication. Only extract what is explicitly present.
- "Do NOT extract type annotations": Never output phrases like "bigint null", "numeric null", etc. Only output the actual values.
- Treat "", null, "not listed", "not available", "n/a", "-", "(blank)" (any case) as missing.
- If a source contains multiple synonymous keys, pick the best match (see Field Hints). If duplicates disagree, still obey source priority (do not merge conflicting values across sources).
- Keep units consistent and numeric where requested. If a numeric is given with units/symbols, normalize (see Normalization Rules). If you cannot get a numeric value, return "Data Not Available".
- Arrays: return JSON arrays of strings unless a field requests JSON objects.
- JSONB fields: return structured JSON (object or array). If nothing usable, return the JSON string "Data Not Available" (still valid JSON).
- Also return \`source_engines\`: a de-duplicated array of source names actually used for ANY populated field (from the list of input keys). If all fields are unavailable, return an empty array [].
- Set \`data_completeness_score\` = integer percentage of fields (below list) that are NOT "Data Not Available". Round to nearest integer. Do not count \`deal_id\`, \`last_updated_by\`, \`source_engines\`, \`created_at\`, \`updated_at\`.

NORMALIZATION RULES
- Integers (bigint fields: tam, sam, som, addressable_customers, capital_requirements, employee_count):
  * Remove currency symbols and separators (e.g., "$1.2B" → 1200000000).
  * Accept suffixes: K/k=1e3, M/m=1e6, B/b=1e9.
  * Ranges like "50-200": use midpoint rounded to nearest integer (→ 125).
  * Open-ended "200+": use the lower bound (→ 200).
  * If ambiguous or not numeric → "Data Not Available".
- Numerics (cagr, cac_trend, ltv_cac_ratio, retention_rate, technology_readiness_level, ip_strength_scoring):
  * If percentage strings like "25%" → 25 (as number).
  * Ratios like "3:1" or "3x" → 3 (number).
  * Keep as plain numbers (no % sign).
- Arrays (text[]):
  * Split on semicolons, bullet points, or commas only if the source clearly lists multiple items.
  * Trim whitespace; remove duplicates; preserve original casing except for trivial fixes.
- JSONB (objects/arrays):
  * market_share_distribution: object mapping { "entity": numberPercent } where percent is numeric 0–100. Only include entries with explicit numeric values.
  * channel_effectiveness: object mapping { "channel": number } ONLY if a numeric score or percent is clearly provided. Otherwise "Data Not Available".
  * previous_roles, exit_history, skill_coverage, diversity_metrics, market_differentiation_analysis, competitive_moat_assessment, revenue_statements, cash_flow_analysis, unit_economics_breakdown, customer_acquisition_metrics, growth_rate_analysis, profitability_metrics, capital_efficiency_ratios, market_traction_indicators, patent_portfolio_analysis, ip_landscape_mapping, competitive_positioning_studies:
    - Use structured arrays/objects only if clearly present; otherwise "Data Not Available".
- Countries:
  * countries_of_operation: array of country names (e.g., ["Indonesia","Singapore"]). If only headquarters country is present, you may use that as a single-entry array. If only cities like "Jakarta, Indonesia", extract the country.
- Dates/Years:
  * founding_year: prefer a 4-digit year (e.g., 2019). If a full date exists, extract the year.

FIELD HINTS (non-exhaustive)
- employee_count: keys may look like employees_in_linkedin, employee_count, company_size, staff_count_range (ranges → midpoint).
- founding_year: founded_in_linkedin, founded_year, founded_date (extract year).
- funding_stage: funding_stage, last_funding_type.
- competitors: competitors (list); if only "Key Market Players" is present (company Perplexity), you may use those as competitors.
- technology_stack: technology_stack, specialties, stack, tech.

OUTPUT
Return EXACTLY ONE JSON object with ALL of the following keys (every key must be present):

{
  "deal_id": <string or number>,
  "tam": <number | "Data Not Available">,
  "sam": <number | "Data Not Available">,
  "som": <number | "Data Not Available">,
  "cagr": <number | "Data Not Available">,
  "growth_drivers": <array-of-strings | "Data Not Available">,
  "market_share_distribution": <object | "Data Not Available">,
  "key_market_players": <array-of-strings | "Data Not Available">,
  "whitespace_opportunities": <array-of-strings | "Data Not Available">,
  "market_cycle": <string | "Data Not Available">,
  "economic_sensitivity": <string | "Data Not Available">,
  "investment_climate": <string | "Data Not Available">,
  "regulatory_timeline": <string | "Data Not Available">,
  "competitive_window": <string | "Data Not Available">,
  "addressable_customers": <number | "Data Not Available">,
  "cac_trend": <number | "Data Not Available">,
  "ltv_cac_ratio": <number | "Data Not Available">,
  "retention_rate": <number | "Data Not Available">,
  "channel_effectiveness": <object | "Data Not Available">,
  "regulatory_requirements": <array-of-strings | "Data Not Available">,
  "capital_requirements": <number | "Data Not Available">,
  "technology_moats": <array-of-strings | "Data Not Available">,
  "distribution_challenges": <array-of-strings | "Data Not Available">,
  "geographic_constraints": <array-of-strings | "Data Not Available">,
  "previous_roles": <array | "Data Not Available">,
  "leadership_experience": <array-of-strings | "Data Not Available">,
  "technical_skills": <array-of-strings | "Data Not Available">,
  "market_knowledge": <array-of-strings | "Data Not Available">,
  "innovation_record": <array-of-strings | "Data Not Available">,
  "academic_background": <array-of-strings | "Data Not Available">,
  "certifications": <array-of-strings | "Data Not Available">,
  "thought_leadership": <array-of-strings | "Data Not Available">,
  "exit_history": <array | "Data Not Available">,
  "value_creation": <array-of-strings | "Data Not Available">,
  "team_building": <array-of-strings | "Data Not Available">,
  "skill_coverage": <object | "Data Not Available">,
  "diversity_metrics": <object | "Data Not Available">,
  "scalability_readiness": <string | "Data Not Available">,
  "strategic_advisors": <array-of-strings | "Data Not Available">,
  "investor_network": <array-of-strings | "Data Not Available">,
  "partnership_ecosystem": <array-of-strings | "Data Not Available">,
  "patent_portfolio_analysis": <array | object | "Data Not Available">,
  "trade_secret_documentation": <array-of-strings | "Data Not Available">,
  "ip_landscape_mapping": <array | object | "Data Not Available">,
  "competitive_positioning_studies": <array | object | "Data Not Available">,
  "ip_strength_scoring": <number | "Data Not Available">,
  "market_differentiation_analysis": <array | object | "Data Not Available">,
  "competitive_moat_assessment": <array | object | "Data Not Available">,
  "technology_readiness_level": <number | "Data Not Available">,
  "revenue_statements": <array | object | "Data Not Available">,
  "cash_flow_analysis": <array | object | "Data Not Available">,
  "unit_economics_breakdown": <array | object | "Data Not Available">,
  "customer_acquisition_metrics": <array | object | "Data Not Available">,
  "growth_rate_analysis": <array | object | "Data Not Available">,
  "profitability_metrics": <array | object | "Data Not Available">,
  "capital_efficiency_ratios": <array | object | "Data Not Available">,
  "market_traction_indicators": <array | object | "Data Not Available">,
  "founding_year": <number | "Data Not Available">,
  "employee_count": <number | "Data Not Available">,
  "business_model": <string | "Data Not Available">,
  "target_market": <string | "Data Not Available">,
  "funding_stage": <string | "Data Not Available">,
  "countries_of_operation": <array-of-strings | "Data Not Available">,
  "competitors": <array-of-strings | "Data Not Available">,
  "key_customers": <array-of-strings | "Data Not Available">,
  "technology_stack": <array-of-strings | "Data Not Available">,

  "data_completeness_score": <integer>,
  "last_updated_by": null,
  "source_engines": <array-of-strings>
}

HOW TO DECIDE EACH FIELD
For each field above:
1) Look through sources in the exact waterfall order.
2) For each source, search reasonable synonymous keys (e.g., employee_count ~ employees_in_linkedin/company_size).
3) Normalize using the rules. If a clean value is found, use it and STOP (do not look at lower-priority sources).
4) If nothing found after all sources, output "Data Not Available".

FINAL CHECKS BEFORE RETURN
- The JSON must be valid and include EVERY key listed above.
- Numbers must be plain numbers (no quotes) unless unavailable.
- Arrays/objects must be well-formed.
- Compute data_completeness_score as defined, and include source_engines based on the sources you actually used.
- Do not include explanations—return ONLY the JSON object.`;

async function collectDealData(dealId: string) {
  console.log(`🔍 Collecting data for deal: ${dealId}`);
  
  try {
    // Get all enrichment data from single query to deal_analysis_datapoints_vc
    const { data: vcData, error } = await supabase
      .from('deal_analysis_datapoints_vc')
      .select(`
        documents_data_points_vc,
        deal_enrichment_crunchbase_export,
        deal_enrichment_linkedin_export,
        deal_enrichment_linkedin_profile_export,
        deal_enrichment_perplexity_company_export_vc,
        deal_enrichment_perplexity_founder_export_vc,
        deal_enrichment_perplexity_market_export_vc
      `)
      .eq('deal_id', dealId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    const structuredData = {
      deal_id: dealId,
      documents_data_points_vc: vcData?.documents_data_points_vc || null,
      deal_enrichment_crunchbase_export: vcData?.deal_enrichment_crunchbase_export || null,
      deal_enrichment_linkedin_export: vcData?.deal_enrichment_linkedin_export || null,
      deal_enrichment_linkedin_profile_export: vcData?.deal_enrichment_linkedin_profile_export || null,
      deal_enrichment_perplexity_company_export_vc: vcData?.deal_enrichment_perplexity_company_export_vc || null,
      deal_enrichment_perplexity_founder_export_vc: vcData?.deal_enrichment_perplexity_founder_export_vc || null,
      deal_enrichment_perplexity_market_export_vc: vcData?.deal_enrichment_perplexity_market_export_vc || null
    };

    const sourcesFound = Object.entries(structuredData)
      .filter(([key, value]) => key !== 'deal_id' && value !== null)
      .map(([key]) => key);

    console.log(`✅ Data collection completed. Sources found: ${sourcesFound.join(', ')}`);
    
    return structuredData;
  } catch (error) {
    console.error('❌ Error collecting deal data:', error);
    throw error;
  }
}

async function aggregateWithGPT(inputData: any) {
  console.log('🤖 Sending data to GPT-4o Mini for aggregation...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(inputData) }
        ],
        max_tokens: 4000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const aggregatedResult = data.choices[0].message.content;
    
    console.log('✅ GPT-4o Mini aggregation completed');
    
    // Parse and validate JSON
    try {
      const parsedResult = JSON.parse(aggregatedResult);
      return parsedResult;
    } catch (parseError) {
      console.error('❌ Failed to parse GPT response as JSON:', parseError);
      throw new Error('Invalid JSON response from GPT');
    }
  } catch (error) {
    console.error('❌ Error in GPT aggregation:', error);
    throw error;
  }
}

async function updateVCDatapoints(dealId: string, aggregatedData: any) {
  console.log(`💾 Updating deal_analysis_datapoints_vc with aggregated data for deal: ${dealId}`);
  
  try {
    const { error } = await supabase
      .from('deal_analysis_datapoints_vc')
      .update({
        engine_integration: aggregatedData,
        updated_at: new Date().toISOString()
      })
      .eq('deal_id', dealId);

    if (error) {
      throw error;
    }
    
    console.log('✅ Successfully updated deal_analysis_datapoints_vc');
  } catch (error) {
    console.error('❌ Error updating VC datapoints:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { deal_id } = await req.json();
    
    if (!deal_id) {
      throw new Error('deal_id is required');
    }

    console.log(`🚀 Starting VC data aggregation for deal: ${deal_id}`);

    // Step 1: Collect data from all sources
    const inputData = await collectDealData(deal_id);
    
    // Step 2: Aggregate with GPT-4o Mini
    const aggregatedData = await aggregateWithGPT(inputData);
    
    // Step 3: Update the database
    await updateVCDatapoints(deal_id, aggregatedData);
    
    console.log(`🎉 VC data aggregation completed successfully for deal: ${deal_id}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        deal_id,
        data_completeness_score: aggregatedData.data_completeness_score,
        source_engines: aggregatedData.source_engines
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error in VC data aggregator:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'VC data aggregation failed'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});