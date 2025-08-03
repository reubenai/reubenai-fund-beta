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
  const teamData = analysisData?.engine_results?.team_engine || {};
  const productData = analysisData?.engine_results?.product_engine || {};
  const financialData = analysisData?.engine_results?.financial_engine || {};

  console.log('🔍 Generating memo content with zero-fabrication policy...');
  
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ Retrying OpenAI call (attempt ${attempt}/${maxRetries}) after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Create optimized prompt with smart context filtering
      const coreDataSummary = `Company: ${dealData.company_name} | Industry: ${dealData.industry || 'N/A'} | Deal: $${dealData.deal_size ? (dealData.deal_size / 1000000).toFixed(1) + 'M' : 'N/A'} | Val: $${dealData.valuation ? (dealData.valuation / 1000000).toFixed(1) + 'M' : 'N/A'}`;
      
      const analysisScores = analysisData ? `Market: ${analysisData.market_score || 'N/A'} | Financial: ${analysisData.financial_score || 'N/A'} | Product: ${analysisData.product_score || 'N/A'} | Team: ${analysisData.leadership_score || 'N/A'} | Traction: ${analysisData.traction_score || 'N/A'}` : 'Scores unavailable';
      
      // Extract key insights efficiently
      const keyInsights = {
        rag: ragData?.ragStatus || 'needs_review',
        confidence: ragData?.confidence || 'N/A',
        thesisScore: thesisData?.alignment_score || 'N/A',
        keyRisks: orchestratorData?.risks?.slice(0, 3) || [],
        keyOpportunities: orchestratorData?.opportunities?.slice(0, 3) || []
      };

      const strategyFocus = fundData?.investment_strategies?.[0]?.key_signals?.slice(0, 5)?.join(', ') || 'General investment criteria';
      
      const recentNotes = dealNotes.slice(0, 3).map(note => note.content.slice(0, 100)).join(' | ') || 'No notes';

      const prompt = `Generate Investment Committee memo for ${dealData.company_name}.

ZERO FABRICATION: Only use provided data. State "N/A" if data missing.

CORE DATA: ${coreDataSummary}
LOCATION: ${dealData.location || 'N/A'} | EMPLOYEES: ${dealData.employee_count || 'N/A'}
BUSINESS MODEL: ${dealData.business_model || 'N/A'}

SCORES: ${analysisScores}
RAG STATUS: ${keyInsights.rag} (${keyInsights.confidence}% confidence)
THESIS ALIGNMENT: ${keyInsights.thesisScore}/100

FUND STRATEGY: ${fundData?.fund_type || 'N/A'} fund focusing on: ${strategyFocus}

KEY INSIGHTS:
Risks: ${keyInsights.keyRisks.join(', ') || 'None identified'}
Opportunities: ${keyInsights.keyOpportunities.join(', ') || 'None identified'}

NOTES: ${recentNotes}

Generate sections: ${sections.map(s => s.title).join(', ')}.

Focus on thesis alignment, validated scores, clear recommendation.`;

      const systemMessage = `Expert investment analyst generating IC memos. Requirements:
1. FACTUAL: Use only provided data, never fabricate
2. CONCISE: Professional VC/PE format 
3. ANALYTICAL: Clear reasoning for assessments
4. HONEST: State when data missing
5. STRATEGIC: Focus on thesis alignment and recommendation

Tone: Professional, suitable for investment committee.`;

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
          // Try switching to gpt-4o-mini if using gpt-4.1 and rate limited
          if (attempt === 1) {
            console.log('⚡ Switching to gpt-4o-mini due to rate limits...');
            // Continue with retry which will use the already set gpt-4o-mini model
          }
          if (attempt === maxRetries) {
            throw new Error('OpenAI API rate limit exceeded after multiple retries. Please try again in a few minutes.');
          }
          continue; // Retry with backoff
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
      
      console.log('✅ Successfully generated memo content');
      
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
      console.error(`Error on attempt ${attempt}:`, error);
      
      if (attempt === maxRetries) {
        console.error('All retry attempts failed');
        // Return fallback memo structure if AI generation completely fails
        console.log('🔄 Generating fallback memo structure...');
        return {
          content: {
            sections: generateFallbackMemo(dealData, analysisData, ragData),
            generated_at: new Date().toISOString(),
            fallback_mode: true,
            data_sources: {
              deal_analysis: !!analysisData,
              rag_assessment: !!ragData,
              deal_notes: dealNotes.length
            }
          },
          executive_summary: `Investment opportunity in ${dealData.company_name}, a ${dealData.industry || 'technology'} company. Deal size: ${dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M` : 'TBD'}. Overall score: ${dealData.overall_score || 'Pending'}/100. Requires detailed review and analysis.`,
          investment_recommendation: `Further due diligence required for ${dealData.company_name}. Initial assessment shows ${dealData.rag_status || 'mixed'} indicators. Recommend deeper analysis of market opportunity, financial metrics, and team capabilities before making final investment decision.`
        };
      }
      
      // Continue to next retry attempt
    }
  }
}

function generateFallbackMemo(dealData: any, analysisData: any, ragData: any): any {
  return {
    executive_summary: `Investment opportunity analysis for ${dealData.company_name}, a ${dealData.industry || 'technology'} company based in ${dealData.location || 'undisclosed location'}. Deal involves ${dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M` : 'undisclosed amount'} at ${dealData.valuation ? `$${(dealData.valuation / 1000000).toFixed(1)}M` : 'undisclosed'} valuation.`,
    
    company_overview: `${dealData.company_name} operates in the ${dealData.industry || 'technology'} sector. ${dealData.description || 'Company description not available.'} ${dealData.business_model ? `Business model: ${dealData.business_model}.` : ''} ${dealData.employee_count ? `Team size: ${dealData.employee_count} employees.` : ''}`,
    
    market_analysis: `Market analysis for ${dealData.industry || 'the company\'s'} sector requires further research. ${dealData.location ? `Geographic focus: ${dealData.location}.` : ''} Competitive landscape assessment pending detailed market research.`,
    
    financial_analysis: `Financial metrics: ${analysisData?.financial_score ? `Financial score: ${analysisData.financial_score}/100.` : 'Financial analysis pending.'} ${dealData.deal_size ? `Investment amount: $${(dealData.deal_size / 1000000).toFixed(1)}M.` : ''} ${dealData.valuation ? `Valuation: $${(dealData.valuation / 1000000).toFixed(1)}M.` : ''}`,
    
    team_assessment: `Leadership team evaluation: ${analysisData?.leadership_score ? `Team score: ${analysisData.leadership_score}/100.` : 'Team assessment pending.'} Further due diligence required on founder background and management capabilities.`,
    
    product_technology: `Product and technology assessment: ${analysisData?.product_score ? `Product score: ${analysisData.product_score}/100.` : 'Technology evaluation pending.'} ${dealData.website ? `Company website: ${dealData.website}` : 'Online presence requires review.'}`,
    
    business_model: `Business model analysis: ${dealData.business_model || 'Business model details not available.'} Revenue model and scalability assessment required.`,
    
    traction_metrics: `Traction and growth metrics: ${analysisData?.traction_score ? `Traction score: ${analysisData.traction_score}/100.` : 'Growth metrics pending analysis.'} Customer acquisition and retention data needed.`,
    
    competitive_landscape: `Competitive positioning assessment pending. Market differentiation and competitive advantages require detailed analysis.`,
    
    thesis_alignment: `Investment thesis alignment: ${analysisData?.thesis_alignment_score ? `Alignment score: ${analysisData.thesis_alignment_score}/100.` : 'Thesis alignment evaluation pending.'} Strategic fit assessment with fund objectives required.`,
    
    risk_analysis: `Risk assessment: ${ragData?.ragStatus ? `Current status: ${ragData.ragStatus}.` : 'Risk evaluation pending.'} Key risks include market timing, competitive pressure, execution risk, and funding requirements.`,
    
    deal_terms: `Deal structure: ${dealData.deal_size ? `Investment: $${(dealData.deal_size / 1000000).toFixed(1)}M` : 'Investment amount TBD'} ${dealData.valuation ? ` at $${(dealData.valuation / 1000000).toFixed(1)}M valuation` : ', valuation TBD'}. Terms and conditions require detailed review.`,
    
    recommendation: `Investment recommendation: REQUIRES FURTHER ANALYSIS. ${dealData.company_name} presents potential opportunity pending comprehensive due diligence. Recommend detailed financial review, market analysis, and team assessment before investment decision.`,
    
    next_steps: `Immediate next steps: 1) Complete financial due diligence, 2) Conduct management presentations, 3) Analyze market opportunity, 4) Review legal documentation, 5) Assess technical capabilities and IP position.`
  };
}