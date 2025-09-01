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

    // Build comprehensive context from deal data with fallbacks to additionalContext
    const companyWebsite = dealData.website || additionalContext?.website || "Not Provided";
    const companyLinkedIn = dealData.linkedin_url || additionalContext?.linkedin || "Not Provided";
    const companyCrunchbase = dealData.crunchbase_url || additionalContext?.crunchbase || "Not Provided";
    
    // Handle industries - prioritize deal data, fallback to additionalContext
    let industries = "Not Provided";
    if (dealData.primary_industry) {
      industries = dealData.primary_industry;
      if (dealData.specialized_sectors && Array.isArray(dealData.specialized_sectors) && dealData.specialized_sectors.length > 0) {
        industries += `, ${dealData.specialized_sectors.join(", ")}`;
      }
    } else if (Array.isArray(additionalContext?.primaryIndustries)) {
      industries = additionalContext.primaryIndustries.join(", ");
    } else if (additionalContext?.industry) {
      industries = additionalContext.industry;
    }
    
    // Handle location/country
    const country = dealData.location || dealData.headquarters || 
      (dealData.countries_of_operation && Array.isArray(dealData.countries_of_operation) 
        ? dealData.countries_of_operation.join(", ") 
        : "") || 
      additionalContext?.location || "Not Provided";
    
    // Handle founders - combine founder and co_founders from deal data
    let founders = "Not Provided";
    const foundersArray = [];
    if (dealData.founder) foundersArray.push(dealData.founder);
    if (dealData.co_founders && Array.isArray(dealData.co_founders)) {
      foundersArray.push(...dealData.co_founders);
    }
    if (foundersArray.length > 0) {
      founders = foundersArray.join(", ");
    } else if (Array.isArray(additionalContext?.founders)) {
      founders = additionalContext.founders.join(", ");
    } else if (additionalContext?.founder) {
      founders = additionalContext.founder;
    }
    
    // Additional context from deal data
    const businessModel = dealData.business_model || "Not Specified";
    const fundingStage = dealData.funding_stage || dealData.company_stage || "Not Specified";
    const competitors = dealData.competitors && Array.isArray(dealData.competitors) 
      ? dealData.competitors.join(", ") : "Not Specified";
    const keyCustomers = dealData.key_customers && Array.isArray(dealData.key_customers)
      ? dealData.key_customers.join(", ") : "Not Specified";
    const technologyStack = dealData.technology_stack && Array.isArray(dealData.technology_stack)
      ? dealData.technology_stack.join(", ") : "Not Specified";
    const targetMarket = dealData.target_market || "Not Specified";
    
    // Format financial data
    const formatCurrency = (value: any) => {
      if (!value) return "Not Disclosed";
      if (typeof value === 'number') {
        return value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${value.toLocaleString()}`;
      }
      return value.toString();
    };
    const dealSize = formatCurrency(dealData.deal_size);
    const valuation = formatCurrency(dealData.valuation);

    // Generate unique snapshot ID
    const snapshotId = `vc_research_${dealId}_${Date.now()}`;
    console.log(`📝 Generated snapshot ID: ${snapshotId}`);

    // Comprehensive research prompt using expanded deal attributes
    const userContent = `
Research company: ${companyName}, website: ${companyWebsite}, LinkedIn: ${companyLinkedIn}, crunchbase: ${companyCrunchbase}, industries: ${industries}, country: ${country}, founders: ${founders}.

Additional company context:
- Business model: ${businessModel}
- Funding stage: ${fundingStage}
- Target market: ${targetMarket}
- Known competitors: ${competitors}
- Key customers: ${keyCustomers}
- Technology stack: ${technologyStack}
- Deal size: ${dealSize}
- Valuation: ${valuation}
- Founded: ${dealData.founding_year || "Not Specified"}
- Employee count: ${dealData.employee_count || "Not Specified"}
- Revenue model: ${dealData.revenue_model || "Not Specified"}

Provide comprehensive market research about this company covering:
1. Market size and growth potential (TAM, SAM, SOM, CAGR)
2. Competitive landscape and positioning
3. Business model viability and scalability
4. Funding environment and investor sentiment
5. Key performance metrics and benchmarks
6. Market timing and regulatory considerations
7. Risk factors and challenges
8. Growth opportunities and market trends

Include specific sources and citations for all data points. Focus on quantitative data, recent developments, and actionable insights.
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