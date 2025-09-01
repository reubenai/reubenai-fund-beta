import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 VC Comprehensive Research Processor - Starting batch processing...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { batchSize = 10, dryRun = false } = await req.json();

    console.log(`📊 VC Processing batch - size: ${batchSize}, dry run: ${dryRun}`);

    // Fetch queued VC research requests with fund type validation
    const { data: queuedRequests, error: queueError } = await supabase
      .from('perplexity_datamining_vc')
      .select(`
        id, deal_id, company_name, processing_status, created_at,
        deals!inner(
          fund_id,
          funds!inner(fund_type)
        )
      `)
      .eq('processing_status', 'queued')
      .eq('deals.funds.fund_type', 'venture_capital')
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (queueError) {
      throw new Error(`Failed to fetch queued VC requests: ${queueError.message}`);
    }

    if (!queuedRequests || queuedRequests.length === 0) {
      console.log('📭 No queued VC research requests found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No queued VC research requests to process',
        processed: 0,
        failed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Found ${queuedRequests.length} queued VC research requests`);

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true,
        message: `Dry run - would process ${queuedRequests.length} VC requests`,
        requests: queuedRequests.map(req => ({
          id: req.id,
          company_name: req.company_name,
          deal_id: req.deal_id,
          created_at: req.created_at,
          fund_type: 'venture_capital'
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    let processedCount = 0;
    let failedCount = 0;

    // Process each VC request
    for (const request of queuedRequests) {
      try {
        console.log(`🔄 Processing VC research for: ${request.company_name} (ID: ${request.id})`);
        
        // Mark as processing
        await supabase
          .from('perplexity_datamining_vc')
          .update({ 
            processing_status: 'processing',
            processing_started_at: new Date().toISOString()
          })
          .eq('id', request.id);

        // Get VC deal context with datapoints
        const { data: dealData } = await supabase
          .from('deals')
          .select(`
            *,
            funds!inner(fund_type, name),
            deal_analysis_datapoints_vc(*)
          `)
          .eq('id', request.deal_id)
          .single();

        let additionalContext = '';
        if (dealData) {
          const vcDatapoints = dealData.deal_analysis_datapoints_vc?.[0];
          additionalContext = `
Additional VC Deal Context:
- Fund Type: Venture Capital
- Fund: ${dealData.funds?.name || 'Not specified'}
- Industry: ${dealData.industry || 'Not specified'}
- Funding Stage: ${vcDatapoints?.funding_stage || dealData.stage || 'Not specified'}  
- Deal Size: ${dealData.deal_size ? '$' + dealData.deal_size.toLocaleString() : 'Not specified'}
- Previous Funding: ${vcDatapoints?.previous_funding_amount ? '$' + vcDatapoints.previous_funding_amount.toLocaleString() : 'Not available'}
- Location: ${dealData.location || 'Not specified'}
- Key Metrics: ${vcDatapoints?.ltv_cac_ratio ? `LTV/CAC: ${vcDatapoints.ltv_cac_ratio}` : 'Metrics pending'}
          `;
        }

        // Perform VC research with enhanced prompt
        console.log(`🧠 Calling Perplexity API for VC research: ${request.company_name}`);
        const researchResult = await performVCResearch(request.company_name, additionalContext, perplexityApiKey);

        if (researchResult.success) {
          await supabase
            .from('perplexity_datamining_vc')
            .update({ 
              processing_status: 'processed',
              processing_completed_at: new Date().toISOString(),
              research_data: researchResult.data,
              quality_score: researchResult.qualityScore
            })
            .eq('id', request.id);

          console.log(`✅ Successfully processed VC research: ${request.company_name}`);
          processedCount++;
        } else {
          await supabase
            .from('perplexity_datamining_vc')
            .update({ 
              processing_status: 'failed',
              processing_completed_at: new Date().toISOString(),
              error_message: researchResult.error || 'Unknown error'
            })
            .eq('id', request.id);
          
          failedCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing VC research ${request.company_name}:`, error);
        
        await supabase
          .from('perplexity_datamining_vc')
          .update({ 
            processing_status: 'failed',
            processing_completed_at: new Date().toISOString(),
            error_message: error.message
          })
          .eq('id', request.id);
        
        failedCount++;
      }

      // Rate limiting delay
      if (queuedRequests.indexOf(request) < queuedRequests.length - 1) {
        console.log('⏱️ Waiting 2 seconds before next VC request...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`🏁 VC Batch processing complete. Processed: ${processedCount}, Failed: ${failedCount}`);

    return new Response(JSON.stringify({
      success: true,
      message: `VC Batch processing completed`,
      processed: processedCount,
      failed: failedCount,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ VC Processor error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// VC-specific research function with enhanced prompts
async function performVCResearch(companyName: string, additionalContext: string, perplexityApiKey: string) {
  const systemPrompt = `You are a senior venture capital analyst conducting comprehensive due diligence research specifically for VC investment decisions.

Focus on VENTURE CAPITAL investment criteria including:
- Market opportunity size (TAM/SAM/SOM) and growth rates
- Scalable business model and recurring revenue potential  
- Technology moats, IP portfolio, and competitive advantages
- Founding team experience in scaling venture-backed companies
- Unit economics (LTV/CAC, retention rates, gross margins)
- Funding rounds, investor quality, and growth trajectory
- Exit potential and path to IPO or strategic acquisition

Prioritize scalability metrics over traditional profitability measures and focus on 5-10 year exit scenarios.`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Conduct comprehensive VC due diligence research on: ${companyName}\n${additionalContext}` }
        ],
        temperature: 0.2,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    return {
      success: true,
      data: { research: content },
      qualityScore: 75 // Default VC quality score
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}