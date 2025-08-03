import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemoGenerationRequest {
  dealId: string;
  templateId?: string;
  fundId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { dealId, templateId, fundId }: MemoGenerationRequest = await req.json();
    console.log('🤖 AI Memo Generator: Starting memo generation for deal:', dealId);
    
    // Query Fund Memory Engine for contextual intelligence
    let memoryContext = {};
    if (fundId && dealId) {
      try {
        const memoryResponse = await supabase.functions.invoke('fund-memory-engine', {
          body: {
            action: 'query_contextual_memory',
            fundId,
            dealId,
            serviceType: 'ai-memo-generator',
            analysisType: 'memo_generation'
          }
        });
        
        if (memoryResponse.data?.success) {
          memoryContext = memoryResponse.data.contextualMemory;
          console.log('🧠 AI Memo Generator: Retrieved contextual memory', Object.keys(memoryContext));
        }
      } catch (error) {
        console.warn('⚠️ AI Memo Generator: Failed to retrieve memory context:', error);
      }
    }

    // 1. Fetch comprehensive deal data with analysis and notes
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select(`
        *,
        deal_analyses (*),
        deal_notes (content, created_at),
        funds (
          name,
          fund_type,
          investment_strategies (*)
        )
      `)
      .eq('id', dealId)
      .single();

    if (dealError || !dealData) {
      throw new Error('Deal not found or error fetching deal data');
    }

    console.log('📊 Retrieved deal data for:', dealData.company_name);

    // 2. Fetch fund strategy and enhanced criteria for thesis alignment
    const strategy = dealData.funds?.investment_strategies?.[0];
    const enhancedCriteria = strategy?.enhanced_criteria || {};
    
    // 3. Get memo template sections
    const { data: templateData } = await supabase
      .from('ic_memo_templates')
      .select('sections')
      .or(`id.eq.${templateId},is_default.eq.true`)
      .single();

    const sections = templateData?.sections || [
      { key: 'executive_summary', title: 'Executive Summary' },
      { key: 'company_overview', title: 'Company Overview' },
      { key: 'market_analysis', title: 'Market Analysis' },
      { key: 'financial_analysis', title: 'Financial Analysis' },
      { key: 'team_assessment', title: 'Team Assessment' },
      { key: 'product_technology', title: 'Product & Technology' },
      { key: 'business_model', title: 'Business Model' },
      { key: 'traction_metrics', title: 'Traction & Metrics' },
      { key: 'competitive_landscape', title: 'Competitive Landscape' },
      { key: 'thesis_alignment', title: 'Investment Thesis Alignment' },
      { key: 'risk_analysis', title: 'Risk Analysis' },
      { key: 'deal_terms', title: 'Deal Terms & Valuation' },
      { key: 'recommendation', title: 'Investment Recommendation' },
      { key: 'next_steps', title: 'Next Steps & Due Diligence' }
    ];

    // 4. Invoke Reuben Orchestrator for comprehensive analysis
    console.log('🎯 Calling Reuben Orchestrator for comprehensive analysis...');
    const { data: orchestratorData, error: orchestratorError } = await supabase.functions.invoke('reuben-orchestrator', {
      body: { dealId, comprehensive: true }
    });

    if (orchestratorError) {
      console.warn('⚠️ Orchestrator warning:', orchestratorError);
    }

    // 5. Calculate RAG status using RAG engine
    console.log('🚦 Calculating RAG status...');
    const { data: ragData, error: ragError } = await supabase.functions.invoke('rag-calculation-engine', {
      body: { 
        dealId,
        companyData: {
          name: dealData.company_name,
          industry: dealData.industry,
          location: dealData.location,
          website: dealData.website
        }
      }
    });

    if (ragError) {
      console.warn('⚠️ RAG calculation warning:', ragError);
    }

    // 6. Get thesis alignment analysis
    console.log('📈 Analyzing thesis alignment...');
    const { data: thesisData, error: thesisError } = await supabase.functions.invoke('thesis-alignment-engine', {
      body: {
        dealData: {
          company_name: dealData.company_name,
          industry: dealData.industry,
          deal_size: dealData.deal_size,
          valuation: dealData.valuation,
          location: dealData.location,
          employee_count: dealData.employee_count,
          business_model: dealData.business_model
        },
        strategyData: strategy
      }
    });

    if (thesisError) {
      console.warn('⚠️ Thesis alignment warning:', thesisError);
    }

    // 7. Generate memo content using OpenAI with strict no-fabrication instructions
    console.log('🔍 Generating memo content with zero-fabrication policy...');
    const memoContent = await generateMemoContent(
      dealData, 
      dealData.funds, 
      sections, 
      dealData.deal_analyses?.[0], 
      orchestratorData,
      ragData,
      thesisData,
      enhancedCriteria,
      dealData.deal_notes || []
    );

    // 8. Determine RAG status from validated data
    const finalRagStatus = ragData?.ragStatus || dealData.rag_status || 'needs_review';
    
    // 9. Store generated memo
    console.log('💾 Storing generated memo...');
    const { data: memo, error: memoError } = await supabase
      .from('ic_memos')
      .insert({
        deal_id: dealId,
        fund_id: dealData.fund_id,
        template_id: templateId,
        title: `Investment Memo - ${dealData.company_name}`,
        status: 'draft',
        memo_content: memoContent.content,
        executive_summary: memoContent.executive_summary,
        investment_recommendation: memoContent.investment_recommendation,
        rag_status: finalRagStatus,
        overall_score: dealData.overall_score,
        created_by: '00000000-0000-0000-0000-000000000000' // System user
      })
      .select()
      .single();

    if (memoError) {
      throw new Error('Failed to store memo: ' + memoError.message);
    }

    console.log('✅ AI Memo Generator: Memo generated successfully for:', dealData.company_name);

    // Store insights in Fund Memory Engine
    if (fundId) {
      try {
        await supabase.functions.invoke('fund-memory-engine', {
          body: {
            action: 'store_memory',
            fundId,
            dealId,
            memoryType: 'ai_service_interaction',
            title: 'IC Memo Generated',
            description: `Investment committee memo generated for ${dealData.company_name}`,
            memoryContent: {
              memo,
              templateUsed: templateId,
              dataQuality: {
                ragStatus: finalRagStatus,
                dataCompleteness: ragData?.confidence || dealData.rag_confidence || 0,
                sourcesValidated: ragData?.sources?.length || 0,
                thesisAlignment: thesisData?.alignment_score || 0
              },
              memoryContext: Object.keys(memoryContext).length > 0 ? memoryContext : null
            },
            aiServiceName: 'ai-memo-generator',
            confidenceScore: memo.overall_score || 75
          }
        });
        console.log('🧠 AI Memo Generator: Stored memo insights in fund memory');
      } catch (error) {
        console.warn('⚠️ AI Memo Generator: Failed to store memory:', error);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      memo,
      dataQuality: {
        ragStatus: finalRagStatus,
        dataCompleteness: ragData?.confidence || dealData.rag_confidence || 0,
        sourcesValidated: ragData?.sources?.length || 0,
        thesisAlignment: thesisData?.alignment_score || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ AI Memo Generator Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateMemoContent(
  dealData: any, 
  fundData: any, 
  sections: any[], 
  analysisData: any,
  orchestratorData: any,
  ragData: any,
  thesisData: any,
  enhancedCriteria: any,
  dealNotes: any[]
): Promise<{ content: any; executive_summary: string; investment_recommendation: string }> {
  
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not found');
  }

  // Prepare validated data sources
  const marketData = analysisData?.engine_results?.market_engine || {};
  const financialData = analysisData?.engine_results?.financial_engine || {};
  const orchestratorInsights = orchestratorData?.analysis || {};
  const ragAssessment = ragData || {};
  const thesisAlignment = thesisData || {};

  // Create comprehensive prompt with strict no-fabrication instructions
  const prompt = `You are generating an Investment Committee memo for ${dealData.company_name}. 

CRITICAL INSTRUCTIONS - ZERO FABRICATION POLICY:
- NEVER fabricate, estimate, or invent any data points
- If specific information is not provided in the source data, explicitly state "Data not available" or "N/A"
- Only use information directly provided in the source materials
- Mark any assumptions clearly as "Assumption based on available data"
- Include data confidence levels where available

COMPANY DATA (VALIDATED):
Company: ${dealData.company_name}
Industry: ${dealData.industry || 'N/A'}
Location: ${dealData.location || 'N/A'}
Business Model: ${dealData.business_model || 'N/A'}
Deal Size: ${dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M` : 'N/A'}
Valuation: ${dealData.valuation ? `$${(dealData.valuation / 1000000).toFixed(1)}M` : 'N/A'}
Employee Count: ${dealData.employee_count || 'N/A'}
Website: ${dealData.website || 'N/A'}
Description: ${dealData.description || 'N/A'}

FUND STRATEGY (THESIS CRITERIA):
Fund Type: ${fundData?.fund_type || 'N/A'}
Investment Focus: ${JSON.stringify(enhancedCriteria, null, 2)}
Key Investment Criteria: ${fundData?.investment_strategies?.[0]?.key_signals?.join(', ') || 'N/A'}

ANALYSIS SCORES (VALIDATED):
${analysisData ? `
Market Score: ${analysisData.market_score || 'N/A'}/100
Financial Score: ${analysisData.financial_score || 'N/A'}/100  
Product Score: ${analysisData.product_score || 'N/A'}/100
Leadership Score: ${analysisData.leadership_score || 'N/A'}/100
Traction Score: ${analysisData.traction_score || 'N/A'}/100
Thesis Alignment Score: ${analysisData.thesis_alignment_score || 'N/A'}/100
` : 'Analysis data not available'}

MARKET RESEARCH (VALIDATED):
${JSON.stringify(marketData, null, 2) || 'Market data not available'}

FINANCIAL ANALYSIS (VALIDATED):
${JSON.stringify(financialData, null, 2) || 'Financial data not available'}

RAG ASSESSMENT (VALIDATED):
Status: ${ragAssessment.ragStatus || 'N/A'}
Confidence: ${ragAssessment.confidence || 'N/A'}%
Data Quality: ${ragAssessment.dataQuality || 'N/A'}

THESIS ALIGNMENT (VALIDATED):
${JSON.stringify(thesisAlignment, null, 2) || 'Thesis alignment data not available'}

ORCHESTRATOR INSIGHTS (VALIDATED):
${JSON.stringify(orchestratorInsights, null, 2) || 'Orchestrator analysis not available'}

DEAL NOTES (VALIDATED):
${dealNotes.map(note => `- ${note.content}`).join('\n') || 'No deal notes available'}

Generate a comprehensive investment memo with the following sections: ${sections.map(s => s.title).join(', ')}.

For each section, use ONLY the validated data provided above. If information is missing, explicitly state "Data not available" or "Requires further due diligence". Include data source attribution where possible.

Focus on:
1. How well this investment aligns with the fund's thesis and criteria
2. Validated analysis scores and their implications  
3. Risk factors based on available data
4. Clear investment recommendation with rationale
5. Data quality assessment and areas requiring additional validation`;

  const systemMessage = `You are an expert investment analyst creating professional Investment Committee memos. Your responses must be:

1. FACTUAL: Only use information provided in the prompt - NEVER fabricate data
2. STRUCTURED: Follow professional VC/PE memo format
3. ANALYTICAL: Provide clear reasoning for assessments
4. HONEST: Explicitly note when data is missing or requires validation
5. STRATEGIC: Focus on fund thesis alignment and investment rationale

Use professional tone appropriate for investment committee presentation. Include data source attribution and confidence levels where available.`;

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
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        functions: [{
          name: 'generate_memo_content',
          description: 'Generate structured investment memo content',
          parameters: {
            type: 'object',
            properties: {
              sections: {
                type: 'object',
                description: 'Memo sections with content',
                additionalProperties: { type: 'string' }
              },
              executive_summary: {
                type: 'string',
                description: 'Executive summary of the investment opportunity'
              },
              investment_recommendation: {
                type: 'string',
                description: 'Final investment recommendation with rationale'
              },
              key_metrics: {
                type: 'object',
                description: 'Key validated metrics and scores'
              },
              data_quality_assessment: {
                type: 'string',
                description: 'Assessment of data completeness and validation status'
              }
            },
            required: ['sections', 'executive_summary', 'investment_recommendation']
          }
        }],
        function_call: { name: 'generate_memo_content' },
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`OpenAI API error ${response.status}:`, errorData);
      
      if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again in a few moments.');
      } else if (response.status === 401) {
        throw new Error('OpenAI API authentication failed. Please check API key.');
      } else {
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }
    }

    const data = await response.json();
    const functionCall = data.choices[0].message.function_call;
    
    if (!functionCall || !functionCall.arguments) {
      throw new Error('Invalid response from OpenAI');
    }

    const memoData = JSON.parse(functionCall.arguments);
    
    return {
      content: {
        sections: memoData.sections,
        key_metrics: memoData.key_metrics,
        data_quality_assessment: memoData.data_quality_assessment,
        generated_at: new Date().toISOString(),
        data_sources: {
          deal_analysis: !!analysisData,
          orchestrator: !!orchestratorData,
          rag_assessment: !!ragData,
          thesis_alignment: !!thesisData,
          deal_notes: dealNotes.length
        }
      },
      executive_summary: memoData.executive_summary,
      investment_recommendation: memoData.investment_recommendation
    };

  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error('Failed to generate memo content: ' + error.message);
  }
}