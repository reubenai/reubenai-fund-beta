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

    console.log(`🔍 Processing market research for: ${companyName}`);

    // Fetch comprehensive deal data for enhanced market research
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        fund_id,
        company_name,
        website,
        linkedin_url,
        crunchbase_url,
        primary_industry,
        specialized_sectors,
        location,
        headquarters,
        countries_of_operation,
        founder,
        co_founders,
        founding_year,
        business_model,
        revenue_model,
        target_market,
        technology_stack,
        competitors,
        key_customers,
        employee_count,
        company_stage,
        funding_stage,
        deal_size,
        valuation,
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
      console.log(`🚫 Skipping VC research for ${companyName} - Fund type is ${dealData.funds.fund_type}, not venture_capital`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'VC research only available for venture capital deals',
        data: null 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Deal ${dealId} confirmed as venture capital - proceeding with market research`);

    // Simplified input data - Company Name, Location, and Founder Name only
    const location = dealData.location || dealData.headquarters || 
      (dealData.countries_of_operation && Array.isArray(dealData.countries_of_operation) 
        ? dealData.countries_of_operation.join(", ") 
        : "") || 
      additionalContext?.location || "Not specified";
    
    // Handle founders - combine founder and co_founders from deal data
    let founderName = "Not specified";
    const foundersArray = [];
    if (dealData.founder) foundersArray.push(dealData.founder);
    if (dealData.co_founders && Array.isArray(dealData.co_founders)) {
      foundersArray.push(...dealData.co_founders);
    }
    if (foundersArray.length > 0) {
      founderName = foundersArray.join(", ");
    } else if (Array.isArray(additionalContext?.founders)) {
      founderName = additionalContext.founders.join(", ");
    } else if (additionalContext?.founder) {
      founderName = additionalContext.founder;
    }

    // Generate unique snapshot ID
    const snapshotId = `vc_research_${dealId}_${Date.now()}`;
    console.log(`📝 Generated snapshot ID: ${snapshotId}`);

    // Comprehensive VC investment analysis prompt - JSON format with evidence
    const userContent = `
VENTURE CAPITAL INVESTMENT ANALYSIS - JSON OUTPUT REQUIRED

Company: ${companyName}
Location: ${location}
Founder(s): ${founderName}

INSTRUCTIONS:
- Search using ALL available data sources
- Prioritize PRIMARY SOURCES: SEC filings, regulatory data, official company releases, financial statements
- Use SECONDARY SOURCES: reputable analysts, established financial media, verified industry reports
- Cross-reference multiple sources for accuracy
- Provide EVIDENCE and SOURCES for every data point

OUTPUT FORMAT: Return ONLY valid JSON with this exact structure:

{
  "founder_experience": {
    "value": "detailed assessment of founder background, prior roles, outcomes",
    "evidence": ["specific examples of experience, previous companies, roles"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "team_composition": {
    "value": "team size, key roles, backgrounds, diversity",
    "evidence": ["team member backgrounds, LinkedIn profiles, bios"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary", 
    "confidence": "high|medium|low"
  },
  "vision_communication": {
    "value": "leadership style, vision clarity, communication effectiveness",
    "evidence": ["interviews, pitch decks, public statements"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "market_size": {
    "value": "TAM/SAM/SOM figures with calculation methodology",
    "evidence": ["market research reports, industry analysis, calculation methods"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "market_timing": {
    "value": "why-now factors, market readiness, catalysts",
    "evidence": ["market trends, adoption rates, regulatory changes"],
    "sources": ["source 1", "source 2"], 
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "competitive_landscape": {
    "value": "key competitors, market positioning, differentiation",
    "evidence": ["competitor analysis, market share data, feature comparisons"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "product_innovation": {
    "value": "product uniqueness, innovation level, IP position",
    "evidence": ["patent filings, product demos, technical publications"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "technology_advantage": {
    "value": "technical moats, scalability, architecture strengths",
    "evidence": ["technical documentation, architecture reviews, performance metrics"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "product_market_fit": {
    "value": "PMF evidence, retention rates, NPS scores, customer satisfaction",
    "evidence": ["retention metrics, NPS data, customer testimonials"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "revenue_growth": {
    "value": "ARR/MRR, growth rates, revenue trends",
    "evidence": ["financial statements, SEC filings, revenue disclosures"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "customer_metrics": {
    "value": "CAC, LTV, LTV/CAC ratio, churn rates, customer count",
    "evidence": ["unit economics data, customer acquisition costs, lifetime value calculations"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "market_validation": {
    "value": "customer adoption, market penetration, validation signals",
    "evidence": ["adoption metrics, market share data, customer case studies"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "financial_performance": {
    "value": "profitability, margins, financial health indicators",
    "evidence": ["financial statements, margin analysis, profitability metrics"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "capital_efficiency": {
    "value": "capital deployed vs results, burn rate, runway",
    "evidence": ["funding amounts, burn rate data, milestone achievements"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "financial_planning": {
    "value": "financial projections, planning quality, milestone tracking",
    "evidence": ["financial models, projections accuracy, milestone delivery"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "portfolio_synergies": {
    "value": "potential synergies with existing portfolio companies",
    "evidence": ["partnership opportunities, technology synergies, market overlap"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "investment_thesis_alignment": {
    "value": "alignment with typical VC investment thesis",
    "evidence": ["sector fit, stage appropriateness, scalability potential"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "value_creation_potential": {
    "value": "specific value creation opportunities and upside potential",
    "evidence": ["growth opportunities, market expansion potential, exit scenarios"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  }
}

CRITICAL: Return ONLY the JSON object above. No additional text, explanations, or formatting.
`.trim();

    console.log('🔍 Calling Perplexity API...');

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
          { role: 'system', content: 'You are a market research analyst. Provide comprehensive and accurate research with sources.' },
          { role: 'user', content: userContent }
        ],
        max_tokens: 4000,
        top_p: 0.9,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 0,
        presence_penalty: 0
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

    console.log(`📥 Raw Perplexity content received (${rawContent.length} characters)`);

    // Store raw data only
    const { error: insertError } = await supabase
      .from('deal_enrichment_perplexity_market_export_vc')
      .insert({
        deal_id: dealId,
        snapshot_id: snapshotId,
        company_name: companyName,
        raw_perplexity_response: {
          query: userContent,
          response: rawContent,
          api_metadata: {
            model: 'sonar',
            timestamp: new Date().toISOString()
          }
        },
        processing_status: 'completed',
        processed_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Database insertion failed:', insertError);
      throw insertError;
    }

    console.log('✅ Raw market data stored successfully');

    return new Response(JSON.stringify({
      success: true,
      snapshot_id: snapshotId,
      message: 'Market research completed and raw data stored'
    }), {
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