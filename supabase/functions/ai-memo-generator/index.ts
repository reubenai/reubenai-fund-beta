import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateEnhancedFallbackMemo } from './enhanced-fallback.ts';

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
      { key: 'market_opportunity', title: 'Market Opportunity' },
      { key: 'financial_analysis', title: 'Financial Analysis' },
      { key: 'management_team', title: 'Management Team' },
      { key: 'product_service', title: 'Product & Service' },
      { key: 'business_model', title: 'Business Model' },
      { key: 'competitive_landscape', title: 'Competitive Landscape' },
      { key: 'investment_terms', title: 'Investment Terms' },
      { key: 'risks_mitigants', title: 'Risks & Mitigants' },
      { key: 'exit_strategy', title: 'Exit Strategy' },
      { key: 'investment_recommendation', title: 'Investment Recommendation' }
    ];

    // 4. Invoke Reuben Orchestrator for comprehensive analysis
    console.log('🎯 Calling Reuben Orchestrator for comprehensive analysis...');
    const { data: orchestratorData, error: orchestratorError } = await supabase.functions.invoke('reuben-orchestrator', {
      body: { dealId, comprehensive: true }
    });

    if (orchestratorError) {
      console.warn('⚠️ Orchestrator warning:', orchestratorError);
    }

    // 4.5. Call enhanced Investment Committee Analysis Enhancer for deeper insights
    console.log('🔬 Calling Investment Committee Analysis Enhancer for enhanced insights...');
    let enhancedInsights = null;
    try {
      const { data: enhancedData } = await supabase.functions.invoke('investment-committee-analysis-enhancer', {
        body: {
          dealId,
          fundId,
          dealData,
          fundData: dealData.funds
        }
      });
      
      if (enhancedData?.success) {
        enhancedInsights = enhancedData.enhancedAnalysis;
        console.log('✅ Enhanced insights generated for memo enhancement');
      }
    } catch (error) {
      console.warn('⚠️ Enhanced analysis failed, proceeding with standard analysis:', error);
    }

    // 4.6. Call specialist AI engines for memo sections
    console.log('🔬 Calling specialist AI engines for detailed analysis...');
    
    const [marketResearchData, managementData, investmentTermsData, riskMitigationData, exitStrategyData] = await Promise.allSettled([
      supabase.functions.invoke('market-research-engine', {
        body: { 
          dealId,
          dealData: {
            company_name: dealData.company_name,
            industry: dealData.industry,
            location: dealData.location,
            website: dealData.website,
            description: dealData.description,
            business_model: dealData.business_model
          }
        }
      }),
      supabase.functions.invoke('management-assessment-engine', {
        body: { 
          dealId,
          companyData: {
            name: dealData.company_name,
            founder: dealData.founder,
            industry: dealData.industry,
            employee_count: dealData.employee_count
          }
        }
      }),
      supabase.functions.invoke('investment-terms-engine', {
        body: { 
          dealId,
          dealData: {
            deal_size: dealData.deal_size,
            valuation: dealData.valuation,
            business_model: dealData.business_model,
            stage: dealData.status
          }
        }
      }),
      supabase.functions.invoke('risk-mitigation-engine', {
        body: { 
          dealId,
          allEngineResults: orchestratorData || {},
          dealData: {
            industry: dealData.industry,
            stage: dealData.status,
            valuation: dealData.valuation
          }
        }
      }),
      supabase.functions.invoke('exit-strategy-engine', {
        body: { 
          dealId,
          companyData: {
            name: dealData.company_name,
            industry: dealData.industry,
            valuation: dealData.valuation,
            deal_size: dealData.deal_size
          }
        }
      })
    ]);

    // Extract specialist engine results
    const specialistEngines = {
      marketResearch: marketResearchData.status === 'fulfilled' ? marketResearchData.value.data : null,
      management: managementData.status === 'fulfilled' ? managementData.value.data : null,
      investmentTerms: investmentTermsData.status === 'fulfilled' ? investmentTermsData.value.data : null,
      riskMitigation: riskMitigationData.status === 'fulfilled' ? riskMitigationData.value.data : null,
      exitStrategy: exitStrategyData.status === 'fulfilled' ? exitStrategyData.value.data : null
    };

    console.log('🔬 Specialist engines results:', {
      marketResearch: !!specialistEngines.marketResearch,
      management: !!specialistEngines.management,
      investmentTerms: !!specialistEngines.investmentTerms,
      riskMitigation: !!specialistEngines.riskMitigation,
      exitStrategy: !!specialistEngines.exitStrategy
    });

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

    // 7. Generate memo content with improved fallback strategy
    console.log('🔍 Generating memo content...');
    let memoContent;
    
    try {
      console.log('🔍 Generating memo content with zero-fabrication policy...');
      
      // Check if we should skip OpenAI generation due to recent quota issues
      const shouldUseEnhancedFallback = await checkOpenAIQuotaStatus();
      
      if (shouldUseEnhancedFallback) {
        console.log('⚡ Using enhanced fallback due to OpenAI quota management');
        throw new Error('OpenAI quota management - using enhanced fallback');
      }
      
      // First try AI generation
      memoContent = await generateMemoContent(
        dealData, 
        dealData.funds, 
        sections, 
        dealData.deal_analyses?.[0], 
        orchestratorData,
        ragData,
        thesisData,
        enhancedCriteria,
        dealData.deal_notes || [],
        specialistEngines,
        enhancedInsights
      );
      
      // Validate memo content structure
      if (!validateMemoContent(memoContent)) {
        throw new Error('Generated memo content is incomplete');
      }
    } catch (aiError) {
      console.log('⚠️ AI generation failed, using enhanced fallback:', aiError.message);
      console.log('🔄 Generating fallback memo structure...');
      
      // Use enhanced fallback memo generation with available data
      try {
        console.log('🚀 Generating ENHANCED fallback memo with rich specialist data...');
        
        // Validate specialist engines data first
        console.log('📊 Specialist engine data validation:', {
          marketData: !!specialistEngines?.marketResearch,
          managementData: !!specialistEngines?.management,
          investmentTermsData: !!specialistEngines?.investmentTerms,
          riskData: !!specialistEngines?.riskMitigation,
          exitData: !!specialistEngines?.exitStrategy
        });
        
        memoContent = generateEnhancedFallbackMemo(
          dealData, 
          dealData.funds, 
          sections, 
          dealData.deal_analyses?.[0], 
          ragData, 
          thesisData, 
          specialistEngines,
          orchestratorData,
          enhancedInsights
        );
      } catch (fallbackError) {
        console.error('❌ Enhanced fallback also failed:', fallbackError.message);
        
        // Generate a minimal but functional fallback
        memoContent = {
          content: generateMinimalFallbackContent(dealData, sections),
          executive_summary: generateMinimalExecutiveSummary(dealData),
          investment_recommendation: generateMinimalRecommendation(dealData)
        };
      }
    }

    // 8. Determine RAG status from validated data with proper constraint validation
    let finalRagStatus = 'needs_development'; // Default safe value
    
    // Validate RAG status against actual database constraints
    const validRagStatuses = ['exciting', 'promising', 'needs_development'];
    const proposedRagStatus = ragData?.ragStatus || dealData.rag_status || 'needs_development';
    
    if (typeof proposedRagStatus === 'string' && validRagStatuses.includes(proposedRagStatus.toLowerCase())) {
      finalRagStatus = proposedRagStatus.toLowerCase();
    } else {
      console.warn('⚠️ Invalid RAG status detected, using default:', proposedRagStatus);
      finalRagStatus = 'needs_development';
    }
    
    // 9. Store generated memo with comprehensive error handling
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
        overall_score: dealData.overall_score || null, // Use null when no valid score available
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
  dealNotes: any[],
  specialistEngines: any,
  enhancedInsights?: any
): Promise<{ content: any; executive_summary: string; investment_recommendation: string }> {
  
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not found');
  }

  // Prepare validated data sources including specialist engines
  const marketData = specialistEngines?.marketResearch?.data || analysisData?.engine_results?.market_engine || {};
  const teamData = specialistEngines?.management?.data || analysisData?.engine_results?.team_engine || {};
  const productData = analysisData?.engine_results?.product_engine || {};
  const financialData = analysisData?.engine_results?.financial_engine || {};
  const investmentTermsData = specialistEngines?.investmentTerms?.data || {};
  const riskMitigationData = specialistEngines?.riskMitigation?.data || {};
  const exitStrategyData = specialistEngines?.exitStrategy?.data || {};

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

      const enhancedContext = enhancedInsights ? `
ENHANCED STRATEGIC INTELLIGENCE:
Strategic Insights: ${enhancedInsights.strategicInsights || 'N/A'}
"So What?" Analysis: ${enhancedInsights.soWhatAnalysis || 'N/A'}
Comparative Analysis: ${enhancedInsights.comparativeAnalysis || 'N/A'}
Risk-Adjusted Returns: ${enhancedInsights.riskAdjustedReturns || 'N/A'}
Scenario Analysis: ${enhancedInsights.scenarioAnalysis || 'N/A'}
Enhancement Level: ${enhancedInsights.enhancementLevel || 'N/A'}
` : '';

      const prompt = `Generate Investment Committee memo for ${dealData.company_name}.

${enhancedContext}

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

SPECIALIST ANALYSIS:
Market: ${marketData.market_size ? `$${marketData.market_size} market` : 'Market sizing pending'} | Growth: ${marketData.growth_rate || 'N/A'}
Management: ${teamData.founder_score ? `Founder score: ${teamData.founder_score}/100` : 'Team assessment pending'}
Investment Terms: ${investmentTermsData.recommended_structure || 'Terms analysis pending'}
Risk Factors: ${riskMitigationData.risk_score ? `Risk score: ${riskMitigationData.risk_score}/100` : 'Risk assessment pending'}
Exit Strategy: ${exitStrategyData.primary_exit_path || 'Exit path analysis pending'}

NOTES: ${recentNotes}

Generate sections: ${sections.map(s => s.title).join(', ')}.

Focus on thesis alignment, validated scores, clear recommendation.

${enhancedInsights ? 'INCORPORATE ENHANCED INSIGHTS: Use the strategic intelligence and "so what?" analysis to enrich memo content with deeper insights and comparative analysis.' : ''}`;

      const systemMessage = `ZERO FABRICATION IC MEMO ANALYST: Expert investment analyst with strict anti-fabrication protocols. CRITICAL REQUIREMENTS:
1. FACTUAL ONLY: Use only provided data, never fabricate metrics, financials, or market data
2. VALIDATION: Every claim must be traceable to provided data sources
3. TRANSPARENCY: Explicitly state "N/A", "Data unavailable", or "Unable to validate" for missing information
4. CONFIDENCE LEVELS: Include confidence indicators for all assessments
5. CONSERVATIVE SCORING: Use lower scores when data is incomplete or unvalidated
6. SOURCE ATTRIBUTION: Reference specific data sources for each section
7. LIMITATION AWARENESS: Highlight data gaps and analysis limitations
8. PROFESSIONAL FORMAT: Maintain VC/PE memo standards while prioritizing accuracy

Generate comprehensive IC memos that investment committees can trust for decision-making.`;

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
      
      // Return flat structure that frontend expects
      return {
        content: {
          ...memoData.sections,
          key_metrics: memoData.key_metrics,
          data_quality_assessment: memoData.data_quality_assessment,
          generated_at: new Date().toISOString(),
          data_sources: {
            deal_analysis: !!analysisData,
            orchestrator: !!orchestratorData,
            rag_assessment: !!ragData,
            thesis_alignment: !!thesisData,
            deal_notes: dealNotes.length,
            market_research: !!specialistEngines?.marketResearch,
            management_assessment: !!specialistEngines?.management,
            investment_terms: !!specialistEngines?.investmentTerms,
            risk_mitigation: !!specialistEngines?.riskMitigation,
            exit_strategy: !!specialistEngines?.exitStrategy
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

// Minimal fallback generation functions
function generateMinimalFallbackContent(dealData: any, sections: any[]): any {
  const content: any = {};
  
  sections.forEach(section => {
    content[section.key] = `${section.title} analysis for ${dealData.company_name}: Comprehensive evaluation pending. This section will be populated with detailed analysis based on validated market data and due diligence findings.`;
  });
  
  return {
    ...content,
    generated_at: new Date().toISOString(),
    minimal_fallback_mode: true,
    company_name: dealData.company_name
  };
}

function generateMinimalExecutiveSummary(dealData: any): string {
  return `Investment Analysis: ${dealData.company_name}, ${dealData.industry || 'technology'} company. Deal Structure: ${dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M` : 'TBD'} investment at ${dealData.valuation ? `$${(dealData.valuation / 1000000).toFixed(1)}M` : 'TBD'} valuation. Assessment: ${dealData.overall_score || 'Pending'}/100 overall score. Recommendation: Requires comprehensive evaluation before proceeding.`;
}

function generateMinimalRecommendation(dealData: any): string {
  return `INVESTMENT RECOMMENDATION: HOLD - REQUIRES DETAILED ANALYSIS. ${dealData.company_name} presents an investment opportunity requiring comprehensive due diligence. Recommend detailed evaluation of market opportunity, financial metrics, and team capabilities before making final investment decision.`;
}

// Simple quota management to prevent excessive API calls
async function checkOpenAIQuotaStatus(): Promise<boolean> {
  try {
    // Simple heuristic: if we've had recent quota errors, use fallback for a period
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.log('⚠️ No OpenAI API key available, using enhanced fallback');
      return true;
    }
    
    // For now, always attempt OpenAI but with better error handling
    return false;
  } catch (error) {
    console.warn('⚠️ Quota check failed, using enhanced fallback:', error);
    return true;
  }
}

// Validation function to check memo content structure
function validateMemoContent(memoContent: any): boolean {
  if (!memoContent || !memoContent.content) {
    return false;
  }
  
  // Check if sections object exists and has content
  const sections = memoContent.content.sections;
  if (!sections || typeof sections !== 'object') {
    return false;
  }
  
  // Check if we have at least 3 populated sections
  const populatedSections = Object.values(sections).filter(section => 
    section && typeof section === 'string' && section.trim().length > 20
  );
  
  return populatedSections.length >= 3;
}

// Reliable fallback memo generation
function generateReliableFallbackMemo(dealData: any, fundData: any, sections: any[], analysisData: any, ragData: any, thesisData: any, specialistEngines?: any): any {
  console.log('🔄 Generating reliable fallback memo with complete sections...');
  
  const memoSections: any = {};
  
  // Generate content for each section based on available data
  sections.forEach(section => {
    switch (section.key) {
      case 'executive_summary':
        memoSections[section.key] = `Investment opportunity analysis for ${dealData.company_name}, a ${dealData.industry || 'technology'} company. Deal size: ${dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M` : 'TBD'}. Valuation: ${dealData.valuation ? `$${(dealData.valuation / 1000000).toFixed(1)}M` : 'TBD'}. Overall score: ${dealData.overall_score || 'Pending'}/100. Status: ${dealData.rag_status || 'Under review'}. This memo provides a comprehensive analysis based on available data and requires further due diligence for final investment decision.`;
        break;
      
      case 'company_overview':
        memoSections[section.key] = `${dealData.company_name} is a ${dealData.industry || 'technology'} company ${dealData.location ? `based in ${dealData.location}` : 'with undisclosed location'}. ${dealData.description || 'Company description to be provided during due diligence.'} ${dealData.business_model ? `Business model: ${dealData.business_model}.` : 'Business model analysis pending.'} ${dealData.employee_count ? `Current team size: ${dealData.employee_count} employees.` : 'Team size information to be confirmed.'} ${dealData.website ? `Website: ${dealData.website}` : 'Company website information pending.'}`;
        break;
      
      case 'market_opportunity':
        memoSections[section.key] = `Market analysis for the ${dealData.industry || 'technology'} sector. ${analysisData?.market_score ? `Market assessment score: ${analysisData.market_score}/100.` : 'Detailed market assessment pending.'} Geographic market focus ${dealData.location ? `includes ${dealData.location}` : 'to be determined'}. Competitive landscape analysis and market sizing require further research to validate opportunity size and growth potential.`;
        break;
      
      case 'financial_analysis':
        memoSections[section.key] = `Financial overview: ${dealData.deal_size ? `Requested investment: $${(dealData.deal_size / 1000000).toFixed(1)}M.` : 'Investment amount to be confirmed.'} ${dealData.valuation ? `Company valuation: $${(dealData.valuation / 1000000).toFixed(1)}M.` : 'Valuation pending assessment.'} ${analysisData?.financial_score ? `Financial health score: ${analysisData.financial_score}/100.` : 'Financial metrics under review.'} Detailed financial statements, revenue projections, and unit economics require comprehensive analysis during due diligence phase.`;
        break;
      
      case 'management_team':
        memoSections[section.key] = `Leadership and team evaluation: ${analysisData?.leadership_score ? `Team assessment score: ${analysisData.leadership_score}/100.` : 'Management team evaluation pending.'} ${dealData.founder ? `Founder: ${dealData.founder}.` : 'Founder background to be reviewed.'} Team experience, track record, and cultural fit assessment require detailed management presentations and reference checks.`;
        break;
      
      case 'product_service':
        memoSections[section.key] = `Product and technology assessment: ${analysisData?.product_score ? `Product evaluation score: ${analysisData.product_score}/100.` : 'Technology stack and product differentiation under review.'} Product development stage, technical capabilities, intellectual property position, and competitive technological advantages require detailed technical due diligence.`;
        break;
      
      case 'business_model':
        memoSections[section.key] = `Business model analysis: ${dealData.business_model || 'Revenue model and go-to-market strategy pending detailed review.'} Scalability assessment, customer acquisition costs, lifetime value metrics, and path to profitability require comprehensive business model validation.`;
        break;
      
      case 'investment_terms':
        memoSections[section.key] = `Investment terms and structure: ${dealData.deal_size ? `Deal size: $${(dealData.deal_size / 1000000).toFixed(1)}M.` : 'Investment amount TBD.'} ${dealData.valuation ? `Valuation: $${(dealData.valuation / 1000000).toFixed(1)}M.` : 'Valuation TBD.'} ${specialistEngines?.investmentTerms?.data ? 'Detailed terms analysis available.' : 'Investment terms structure, equity stake, board composition, liquidation preferences, and investor rights require detailed negotiation and legal review.'}`;
        break;
      
      case 'risks_mitigants':
        memoSections[section.key] = `Risk assessment and mitigation strategies: ${specialistEngines?.riskMitigation?.data ? 'Comprehensive risk analysis completed.' : 'Market risks, execution risks, financial risks, regulatory risks, and competitive risks require detailed assessment.'} Mitigation strategies and contingency planning to be developed based on identified risk factors.`;
        break;
      
      case 'exit_strategy':
        memoSections[section.key] = `Exit strategy analysis: ${specialistEngines?.exitStrategy?.data ? 'Exit scenarios evaluated.' : 'Potential exit paths including strategic acquisition, IPO timeline, and industry consolidation trends require market analysis.'} Expected returns, exit multiples, and timeline assessment pending market conditions and company performance metrics.`;
        break;
      
      case 'competitive_landscape':
        memoSections[section.key] = `Competitive analysis: Market positioning and competitive differentiation assessment pending. Direct and indirect competitors, competitive advantages, market share analysis, and sustainable competitive moats require comprehensive market research and analysis.`;
        break;
      
      case 'competitive_landscape':
        memoSections[section.key] = `Competitive analysis: Market positioning and competitive differentiation assessment pending. Direct and indirect competitors, competitive advantages, market share analysis, and sustainable competitive moats require comprehensive market research and analysis.`;
        break;
      
      case 'recommendation':
      case 'investment_recommendation':
        memoSections[section.key] = `Investment recommendation: FURTHER DUE DILIGENCE REQUIRED. ${dealData.company_name} presents a potential investment opportunity with ${dealData.overall_score ? `current assessment score of ${dealData.overall_score}/100` : 'assessment pending'}. Recommendation: Proceed to detailed due diligence phase including financial review, management presentations, technical assessment, and market validation before final investment decision.`;
        break;
      
      case 'next_steps':
        memoSections[section.key] = `Recommended next steps: 1) Schedule management presentation and Q&A session, 2) Conduct comprehensive financial due diligence and review audited statements, 3) Perform technical due diligence and IP assessment, 4) Complete market research and competitive analysis, 5) Review legal documentation and deal terms, 6) Conduct reference checks with customers and partners, 7) Present findings to investment committee for final decision.`;
        break;
      
      default:
        memoSections[section.key] = `${section.title} analysis for ${dealData.company_name} requires detailed evaluation during the due diligence process. This section will be populated with comprehensive analysis based on validated data and expert assessment.`;
    }
  });
  
  // Return flat structure that frontend expects
  return {
    content: {
      ...memoSections,
      generated_at: new Date().toISOString(),
      fallback_mode: true,
      data_sources: {
        deal_analysis: !!analysisData,
        rag_assessment: !!ragData,
        thesis_alignment: !!thesisData
      }
    },
    executive_summary: `Investment opportunity in ${dealData.company_name}, a ${dealData.industry || 'technology'} company. Deal size: ${dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M` : 'TBD'}. Overall assessment score: ${dealData.overall_score || 'Pending'}/100. Status: ${dealData.rag_status || 'Under review'}. Comprehensive due diligence recommended.`,
    investment_recommendation: `RECOMMENDATION: PROCEED TO DUE DILIGENCE. ${dealData.company_name} warrants further investigation based on initial assessment. Comprehensive evaluation of financials, market opportunity, team capabilities, and strategic fit required before final investment decision.`
  };
}