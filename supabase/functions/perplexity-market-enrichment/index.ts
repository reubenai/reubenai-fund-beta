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

    // Basic context extraction
    const companyWebsite = additionalContext?.website ?? "Not Provided";
    const companyLinkedIn = additionalContext?.linkedin ?? "Not Provided";
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

    // Generate unique snapshot ID
    const snapshotId = `vc_research_${dealId}_${Date.now()}`;
    console.log(`📝 Generated snapshot ID: ${snapshotId}`);

    // Simple research prompt
    const userContent = `
Research company: ${companyName} (website: ${companyWebsite}, LinkedIn: ${companyLinkedIn}, industry: ${industries}, location: ${country}, founders: ${founders}).

Provide comprehensive market research about this company covering market size, competition, business model, funding, and key metrics. Include sources for all data points.
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
        timestamp: new Date().toISOString()
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