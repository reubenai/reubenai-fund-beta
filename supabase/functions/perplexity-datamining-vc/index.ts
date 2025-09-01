import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VC Data Categories for Perplexity Mining
const VC_DATA_CATEGORIES = [
  'tam', 'sam', 'som', 'cagr', 'business_model', 'revenue_model',
  'funding_stage', 'funding_history', 'valuation', 'burn_rate',
  'runway_months', 'growth_rate', 'customer_acquisition_cost',
  'ltv_cac_ratio', 'retention_rate', 'competitors', 'key_customers',
  'employee_count'
];

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
      .select('company_name, industry, description')
      .eq('id', dealId)
      .single();

    if (dealError) {
      throw new Error(`Failed to fetch deal data: ${dealError.message}`);
    }

    const companyName = dealData.company_name;
    const industry = dealData.industry || 'Unknown';
    const description = dealData.description || '';

    console.log(`🏢 [VC Datamining] Processing company: ${companyName} in ${industry}`);

    // Process each data category with Perplexity
    const results: Record<string, any> = {};
    const processingErrors: string[] = [];

    for (const category of VC_DATA_CATEGORIES) {
      try {
        console.log(`📈 [VC Datamining] Processing category: ${category}`);
        
        const prompt = generatePromptForCategory(category, companyName, industry, description);
        const result = await callPerplexityAPI(perplexityApiKey, prompt);
        
        results[category] = {
          data: result.data,
          confidence: result.confidence || 50,
          sources: result.sources || []
        };

        console.log(`✅ [VC Datamining] Completed ${category} for ${companyName}`);
        
        // Small delay between API calls to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ [VC Datamining] Error processing ${category}:`, error);
        processingErrors.push(`${category}: ${error.message}`);
        
        results[category] = {
          data: null,
          confidence: 0,
          sources: [],
          error: error.message
        };
      }
    }

    // Calculate overall data quality score
    const successfulCategories = Object.values(results).filter(r => r.data !== null).length;
    const dataQualityScore = Math.round((successfulCategories / VC_DATA_CATEGORIES.length) * 100);

    // Update the record with all results
    const updateData = {
      processing_status: processingErrors.length > VC_DATA_CATEGORIES.length / 2 ? 'failed' : 'completed',
      processing_completed_at: new Date().toISOString(),
      data_quality_score: dataQualityScore,
      raw_perplexity_response: results,
      processing_errors: processingErrors.length > 0 ? processingErrors : null,
      
      // Individual data fields
      tam: results.tam?.data || null,
      sam: results.sam?.data || null,
      som: results.som?.data || null,
      cagr: results.cagr?.data || null,
      business_model: results.business_model?.data || null,
      revenue_model: results.revenue_model?.data || null,
      funding_stage: results.funding_stage?.data || null,
      funding_history: results.funding_history?.data || null,
      valuation: results.valuation?.data || null,
      burn_rate: results.burn_rate?.data || null,
      runway_months: results.runway_months?.data || null,
      growth_rate: results.growth_rate?.data || null,
      customer_acquisition_cost: results.customer_acquisition_cost?.data || null,
      ltv_cac_ratio: results.ltv_cac_ratio?.data || null,
      retention_rate: results.retention_rate?.data || null,
      competitors: results.competitors?.data || null,
      key_customers: results.key_customers?.data || null,
      employee_count: results.employee_count?.data || null,
      
      // Confidence scores
      subcategory_confidence: Object.fromEntries(
        VC_DATA_CATEGORIES.map(cat => [cat, results[cat]?.confidence || 0])
      ),
      
      // Sources
      subcategory_sources: Object.fromEntries(
        VC_DATA_CATEGORIES.map(cat => [cat, results[cat]?.sources || []])
      )
    };

    const { error: updateError } = await supabase
      .from('perplexity_datamining_vc')
      .update(updateData)
      .eq('deal_id', dealId);

    if (updateError) {
      throw new Error(`Failed to update record: ${updateError.message}`);
    }

    const status = updateData.processing_status;
    console.log(`🎉 [VC Datamining] ${status === 'completed' ? 'Successfully completed' : 'Completed with errors'} processing for ${companyName}`);
    console.log(`📊 [VC Datamining] Data quality score: ${dataQualityScore}%`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `VC datamining ${status} for ${companyName}`,
        data_quality_score: dataQualityScore,
        categories_processed: successfulCategories,
        total_categories: VC_DATA_CATEGORIES.length,
        errors: processingErrors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

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

function generatePromptForCategory(category: string, companyName: string, industry: string, description: string): string {
  const baseContext = `Company: ${companyName}\nIndustry: ${industry}\nDescription: ${description}\n\n`;
  
  const prompts: Record<string, string> = {
    tam: `${baseContext}What is the Total Addressable Market (TAM) for ${companyName}? Provide a specific dollar amount and explain the methodology. Be concise and factual.`,
    
    sam: `${baseContext}What is the Serviceable Addressable Market (SAM) for ${companyName}? Provide a specific dollar amount and methodology. Focus on the realistic market they can capture.`,
    
    som: `${baseContext}What is the Serviceable Obtainable Market (SOM) for ${companyName}? Provide a specific dollar amount representing their realistic market share potential.`,
    
    cagr: `${baseContext}What is the Compound Annual Growth Rate (CAGR) for the ${industry} industry that ${companyName} operates in? Provide a percentage and timeframe.`,
    
    business_model: `${baseContext}Describe ${companyName}'s business model in 2-3 sentences. How do they create, deliver, and capture value?`,
    
    revenue_model: `${baseContext}How does ${companyName} generate revenue? List their primary revenue streams and monetization strategy.`,
    
    funding_stage: `${baseContext}What funding stage is ${companyName} currently at? (e.g., Pre-seed, Seed, Series A, B, C, etc.)`,
    
    funding_history: `${baseContext}What is ${companyName}'s funding history? List previous rounds, amounts, and lead investors if available.`,
    
    valuation: `${baseContext}What is ${companyName}'s latest valuation? Provide the amount and funding round when it was established.`,
    
    burn_rate: `${baseContext}What is ${companyName}'s estimated monthly burn rate? Provide amount in dollars and basis for estimate.`,
    
    runway_months: `${baseContext}How many months of runway does ${companyName} have based on current funding and burn rate? Provide number and calculation basis.`,
    
    growth_rate: `${baseContext}What is ${companyName}'s revenue or user growth rate? Provide percentage and timeframe (monthly/yearly).`,
    
    customer_acquisition_cost: `${baseContext}What is ${companyName}'s estimated Customer Acquisition Cost (CAC)? Provide amount and methodology.`,
    
    ltv_cac_ratio: `${baseContext}What is ${companyName}'s LTV/CAC ratio? Provide the ratio and explain how it was calculated.`,
    
    retention_rate: `${baseContext}What is ${companyName}'s customer retention rate? Provide percentage and timeframe (monthly/annual).`,
    
    competitors: `${baseContext}Who are ${companyName}'s top 5 direct competitors? List company names and brief differentiation.`,
    
    key_customers: `${baseContext}Who are ${companyName}'s key customers or customer segments? List notable clients or target demographics.`,
    
    employee_count: `${baseContext}How many employees does ${companyName} currently have? Provide current headcount and recent growth.`
  };
  
  return prompts[category] || `${baseContext}Analyze ${category} for ${companyName}.`;
}

async function callPerplexityAPI(apiKey: string, prompt: string) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a venture capital analyst. Provide specific, factual data with numbers when possible. If exact data is not available, clearly state it as an estimate and explain your reasoning. Be concise and structured.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 800,
      return_images: false,
      return_related_questions: false,
      search_recency_filter: 'month',
      frequency_penalty: 1,
      presence_penalty: 0
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status} - ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.choices || result.choices.length === 0) {
    throw new Error('No response from Perplexity API');
  }

  const content = result.choices[0].message?.content;
  
  if (!content) {
    throw new Error('Empty response from Perplexity API');
  }

  // Extract confidence level from response (basic heuristic)
  const hasSpecificNumbers = /\$[\d,.]+(M|B|K)?|\d+%|\d+:\d+/.test(content);
  const hasHedging = /estimate|approximately|around|roughly|uncertain/i.test(content);
  
  let confidence = 50;
  if (hasSpecificNumbers && !hasHedging) {
    confidence = 85;
  } else if (hasSpecificNumbers && hasHedging) {
    confidence = 70;
  } else if (!hasSpecificNumbers && !hasHedging) {
    confidence = 60;
  }

  return {
    data: content.trim(),
    confidence: confidence,
    sources: [] // Perplexity doesn't return structured sources in this response
  };
}