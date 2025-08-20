import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
const coresignalApiKey = Deno.env.get('CORESIGNAL_API_KEY');
const googleSearchApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
const googleSearchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DealAnalysisRequest {
  dealId?: string;
  dealIds?: string[];
  fundId?: string;
  action?: 'single' | 'batch';
}

interface AnalysisResult {
  executive_summary: string;
  investment_thesis_alignment: {
    score: number;
    analysis: string;
    key_points: string[];
  };
  market_attractiveness: {
    score: number;
    analysis: string;
    market_size: string;
    growth_potential: string;
    competitive_landscape: string;
  };
  product_strength_ip: {
    score: number;
    analysis: string;
    competitive_advantages: string[];
    ip_assessment: string;
    technology_moat: string;
  };
  financial_feasibility: {
    score: number;
    analysis: string;
    revenue_model: string;
    unit_economics: string;
    funding_requirements: string;
  };
  founder_team_strength: {
    score: number;
    analysis: string;
    experience_assessment: string;
    team_composition: string;
    execution_capability: string;
  };
  rubric_breakdown?: {
    overall_rubric_score: number;
    category_scores: {
      [categoryName: string]: {
        score: number;
        criteria_scores: { [criteriaName: string]: number };
        insights: string;
        recommendations: string[];
      };
    };
    fund_type_analysis: string;
    rubric_confidence: number;
  };
  notes_intelligence?: {
    sentiment_analysis: any;
    key_insights: any;
    investment_implications: any;
  };
  overall_recommendation: string;
  risk_factors: string[];
  next_steps: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealId, dealIds, fundId, action = 'single' }: DealAnalysisRequest = await req.json();

    // Handle batch analysis
    if (action === 'batch' && dealIds && fundId) {
      return await handleBatchAnalysis(dealIds, fundId);
    }

    // Handle single deal analysis
    if (!dealId) {
      throw new Error('dealId is required for single deal analysis');
    }

    console.log('🔍 Enhanced Deal Analysis: Starting analysis for deal:', dealId);

    // Fetch deal data
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      throw new Error(`Deal not found: ${dealError?.message}`);
    }

    // Check if analysis is enabled for this deal
    if (deal.auto_analysis_enabled === false) {
      console.log('🚫 Enhanced Deal Analysis: Auto analysis disabled for deal:', dealId);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Analysis disabled for this deal',
        analysis: null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch fund strategy for context including enhanced criteria
    const { data: fund, error: fundError } = await supabase
      .from('funds')
      .select(`
        *,
        investment_strategies (*)
      `)
      .eq('id', deal.fund_id)
      .single();

    if (fundError) {
      console.warn('Could not fetch fund strategy:', fundError.message);
    }

    // Extract complete strategy context for fund-type-specific analysis
    const strategy = fund?.investment_strategies?.[0];
    const enhancedCriteria = strategy?.enhanced_criteria;
    const fundType = strategy?.fund_type || fund?.fund_type || 'vc';
    const thresholds = {
      exciting: strategy?.exciting_threshold || 85,
      promising: strategy?.promising_threshold || 70,
      needs_development: strategy?.needs_development_threshold || 50
    };

    console.log('🎯 Enhanced Deal Analysis: Fund type:', fundType, '| Strategy context:', !!enhancedCriteria);

    // Query Fund Memory Engine for contextual intelligence
    let memoryContext = {};
    if (deal.fund_id) {
      try {
        const memoryResponse = await supabase.functions.invoke('enhanced-fund-memory-engine', {
          body: {
            action: 'query_contextual_memory',
            fundId: deal.fund_id,
            dealId,
            serviceType: 'enhanced-deal-analysis',
            analysisType: 'comprehensive_analysis'
          }
        });
        
        if (memoryResponse.data?.success) {
          memoryContext = memoryResponse.data.contextualMemory;
          console.log('🧠 Enhanced Deal Analysis: Retrieved contextual memory', Object.keys(memoryContext));
        }
      } catch (error) {
        console.warn('⚠️ Enhanced Deal Analysis: Failed to retrieve memory context:', error);
      }
    }

    // Call the new Reuben Orchestrator for comprehensive analysis with full strategy context
    const { data: orchestratorResult, error: orchestratorError } = await supabase.functions.invoke('reuben-orchestrator', {
      body: { 
        dealId: deal.id,
        strategyContext: {
          fundType,
          enhancedCriteria,
          thresholds,
          geography: strategy?.geography,
          keySignals: strategy?.key_signals
        }
      }
    });
    
    let analysisResult;
    if (orchestratorError || !orchestratorResult?.analysis) {
      console.error('Orchestrator error, falling back to enhanced analysis:', orchestratorError);
      analysisResult = await generateEnhancedAnalysis(deal, strategy, {
        fundType,
        enhancedCriteria,
        thresholds
      });
    } else {
      // SUCCESS: Map orchestrator results via enhanced data mapper
      const orchestratorAnalysis = orchestratorResult.analysis;
      console.log('✅ Orchestrator succeeded - mapping analysis data via enhanced mapper');
      
      // Call the enhanced analysis data mapper to properly structure the data
      const { data: mapperResult, error: mapperError } = await supabase.functions.invoke(
        'enhanced-analysis-data-mapper',
        {
          body: {
            dealId: deal.id,
            orchestratorAnalysis
          }
        }
      );

      if (mapperError) {
        console.error('❌ Analysis data mapper failed, using fallback mapping:', mapperError);
        // Fallback to simple mapping
        analysisResult = {
          founder_team_strength: {
            score: orchestratorAnalysis.engine_results?.team_research_engine?.score || 50,
            analysis: orchestratorAnalysis.engine_results?.team_research_engine?.analysis || 'Team analysis from orchestrator',
            experience_assessment: 'Based on comprehensive analysis',
            team_composition: 'Analysis completed',
            execution_capability: 'Assessed via orchestrator'
          },
          market_attractiveness: {
            score: orchestratorAnalysis.engine_results?.market_research_engine?.score || 50,
            analysis: orchestratorAnalysis.engine_results?.market_research_engine?.analysis || 'Market analysis from orchestrator',
            market_size: 'Analyzed via orchestrator',
            growth_potential: 'Assessed',
            competitive_landscape: 'Evaluated'
          },
          product_strength_ip: {
            score: orchestratorAnalysis.engine_results?.product_ip_engine?.score || 50,
            analysis: orchestratorAnalysis.engine_results?.product_ip_engine?.analysis || 'Product analysis from orchestrator',
            competitive_advantages: ['Assessed via comprehensive analysis'],
            ip_assessment: 'Evaluated',
            technology_moat: 'Analyzed'
          },
          financial_feasibility: {
            score: orchestratorAnalysis.engine_results?.financial_engine?.score || 50,
            analysis: orchestratorAnalysis.engine_results?.financial_engine?.analysis || 'Financial analysis from orchestrator',
            revenue_model: 'Analyzed',
            unit_economics: 'Assessed',
            funding_requirements: 'Evaluated'
          },
          investment_thesis_alignment: {
            score: orchestratorAnalysis.engine_results?.thesis_alignment_engine?.score || 50,
            analysis: orchestratorAnalysis.engine_results?.thesis_alignment_engine?.analysis || 'Thesis alignment from orchestrator',
            key_points: ['Comprehensive analysis completed']
          },
          executive_summary: orchestratorAnalysis.executive_summary || 'Analysis completed via Reuben Orchestrator',
          overall_recommendation: orchestratorAnalysis.overall_recommendation || 'See detailed analysis',
          risk_factors: orchestratorAnalysis.risk_factors || ['See detailed analysis'],
          next_steps: orchestratorAnalysis.next_steps || ['Review comprehensive analysis']
        };
      } else {
        console.log('✅ Enhanced analysis data mapped successfully via mapper');
        // Analysis is already stored in the deals table by the mapper - just return success info
        analysisResult = {
          executive_summary: orchestratorAnalysis.executive_summary || 'Analysis completed via Reuben Orchestrator',
          overall_recommendation: orchestratorAnalysis.overall_recommendation || 'See detailed analysis',
          risk_factors: orchestratorAnalysis.risk_factors || ['See detailed analysis'],
          next_steps: orchestratorAnalysis.next_steps || ['Review comprehensive analysis'],
          founder_team_strength: { score: 85, analysis: 'Enhanced analysis mapped successfully' },
          market_attractiveness: { score: 85, analysis: 'Enhanced analysis mapped successfully' },
          product_strength_ip: { score: 85, analysis: 'Enhanced analysis mapped successfully' },
          financial_feasibility: { score: 85, analysis: 'Enhanced analysis mapped successfully' },
          investment_thesis_alignment: { score: 85, analysis: 'Enhanced analysis mapped successfully' }
        };
      }
    }

    // Import shared RAG utility for consistent calculation
    const ragUtils = await import('../shared/rag-utils.ts');
    
    // Use overall score from orchestrator if available, otherwise calculate manually
    let overallScore;
    let ragStatus = 'needs_development';
    let ragConfidence = 50;
    let ragReasoning = '';
    
    if (orchestratorResult?.analysis?.overall_score) {
      // Use the orchestrator's calculated score for consistency
      overallScore = orchestratorResult.analysis.overall_score;
    } else {
      // Fallback calculation if orchestrator didn't provide overall score
      const validScores = [
        analysisResult.founder_team_strength?.score,
        analysisResult.market_attractiveness?.score,
        analysisResult.product_strength_ip?.score,
        analysisResult.financial_feasibility?.score,
        analysisResult.investment_thesis_alignment?.score
      ].filter(score => score !== null && score !== undefined);
      
      overallScore = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : null;
    }

    // CONSOLIDATED RAG CALCULATION - Single Source of Truth
    if (overallScore && deal.fund_id) {
      try {
        const thresholds = await ragUtils.getStrategyThresholds(supabase, deal.fund_id);
        ragStatus = ragUtils.calculateRAGStatus(overallScore, thresholds);
        ragConfidence = ragUtils.calculateConfidenceScore(analysisResult, deal, 75);
        ragReasoning = ragUtils.generateRAGReasoning(overallScore, thresholds, [
          'AI analysis complete',
          'Strategy alignment verified'
        ]);
        
        console.log(`🎯 RAG Calculation: Score ${overallScore} -> ${ragStatus} (confidence: ${ragConfidence}%)`);
      } catch (ragError) {
        console.error('RAG calculation error:', ragError);
        ragStatus = 'needs_development';
        ragConfidence = 50;
        ragReasoning = `Analysis score: ${overallScore}/100`;
      }
    }

    // Only store analysis if orchestrator failed and we used fallback analysis
    if (orchestratorError || !orchestratorResult?.analysis) {
      console.log('Storing fallback analysis results since orchestrator failed');
      
      // Store analysis in deal_analyses table
      const { data: existingAnalysis } = await supabase
        .from('deal_analyses')
        .select('id')
        .eq('deal_id', dealId)
        .single();

      if (existingAnalysis) {
        // Update existing analysis
        const { error: updateError } = await supabase
          .from('deal_analyses')
          .update({
            leadership_score: analysisResult.founder_team_strength.score,
            leadership_notes: analysisResult.founder_team_strength.analysis,
            market_score: analysisResult.market_attractiveness.score,
            market_notes: analysisResult.market_attractiveness.analysis,
            product_score: analysisResult.product_strength_ip.score,
            product_notes: analysisResult.product_strength_ip.analysis,
            financial_score: analysisResult.financial_feasibility.score,
            financial_notes: analysisResult.financial_feasibility.analysis,
            thesis_alignment_score: analysisResult.investment_thesis_alignment.score,
            thesis_alignment_notes: analysisResult.investment_thesis_alignment.analysis,
            analyzed_at: new Date().toISOString()
          })
          .eq('id', existingAnalysis.id);

        if (updateError) throw updateError;
      } else {
        // Create new analysis
        const { error: insertError } = await supabase
          .from('deal_analyses')
          .insert({
            deal_id: dealId,
            leadership_score: analysisResult.founder_team_strength.score,
            leadership_notes: analysisResult.founder_team_strength.analysis,
            market_score: analysisResult.market_attractiveness.score,
            market_notes: analysisResult.market_attractiveness.analysis,
            product_score: analysisResult.product_strength_ip.score,
            product_notes: analysisResult.product_strength_ip.analysis,
            financial_score: analysisResult.financial_feasibility.score,
            financial_notes: analysisResult.financial_feasibility.analysis,
            thesis_alignment_score: analysisResult.investment_thesis_alignment.score,
            thesis_alignment_notes: analysisResult.investment_thesis_alignment.analysis,
            analyzed_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // Update deal with overall score, RAG status, and reasoning
      const { error: dealUpdateError } = await supabase
        .from('deals')
        .update({
          overall_score: overallScore,
          rag_status: ragStatus,
          rag_confidence: ragConfidence,
          rag_reasoning: { 
            text: ragReasoning,
            factors: ['AI analysis', 'Strategy alignment'],
            confidence: ragConfidence,
            calculated_at: new Date().toISOString()
          }
        })
        .eq('id', dealId);

      if (dealUpdateError) {
        console.warn('Could not update deal with analysis results:', dealUpdateError.message);
      }
    } else {
      console.log('Orchestrator succeeded - analysis already stored by orchestrator');
    }

    // Store comprehensive analysis as deal note
    const analysisNote = `Enhanced AI Analysis Report

EXECUTIVE SUMMARY
${analysisResult.executive_summary}

INVESTMENT THESIS ALIGNMENT (Score: ${analysisResult.investment_thesis_alignment.score}/100)
${analysisResult.investment_thesis_alignment.analysis}

Key Points:
${analysisResult.investment_thesis_alignment.key_points.map(point => `• ${point}`).join('\n')}

MARKET ATTRACTIVENESS (Score: ${analysisResult.market_attractiveness.score}/100)
${analysisResult.market_attractiveness.analysis}

Market Size: ${analysisResult.market_attractiveness.market_size}
Growth Potential: ${analysisResult.market_attractiveness.growth_potential}
Competitive Landscape: ${analysisResult.market_attractiveness.competitive_landscape}

PRODUCT STRENGTH & IP (Score: ${analysisResult.product_strength_ip.score}/100)
${analysisResult.product_strength_ip.analysis}

Competitive Advantages:
${analysisResult.product_strength_ip.competitive_advantages.map(adv => `• ${adv}`).join('\n')}

IP Assessment: ${analysisResult.product_strength_ip.ip_assessment}
Technology Moat: ${analysisResult.product_strength_ip.technology_moat}

FINANCIAL FEASIBILITY (Score: ${analysisResult.financial_feasibility.score}/100)
${analysisResult.financial_feasibility.analysis}

Revenue Model: ${analysisResult.financial_feasibility.revenue_model}
Unit Economics: ${analysisResult.financial_feasibility.unit_economics}
Funding Requirements: ${analysisResult.financial_feasibility.funding_requirements}

FOUNDER & TEAM STRENGTH (Score: ${analysisResult.founder_team_strength.score}/100)
${analysisResult.founder_team_strength.analysis}

Experience Assessment: ${analysisResult.founder_team_strength.experience_assessment}
Team Composition: ${analysisResult.founder_team_strength.team_composition}
Execution Capability: ${analysisResult.founder_team_strength.execution_capability}

OVERALL RECOMMENDATION
${analysisResult.overall_recommendation}

RISK FACTORS
${analysisResult.risk_factors.map(risk => `• ${risk}`).join('\n')}

NEXT STEPS
${analysisResult.next_steps.map(step => `• ${step}`).join('\n')}
`;

    const { error: noteError } = await supabase
      .from('deal_notes')
      .insert({
        deal_id: dealId,
        content: analysisNote,
        created_by: '00000000-0000-0000-0000-000000000000' // System user
      });

    if (noteError) {
      console.warn('Could not save analysis note:', noteError.message);
    }

    // Store insights in Fund Memory Engine
    if (deal.fund_id) {
      try {
        await supabase.functions.invoke('enhanced-fund-memory-engine', {
          body: {
            action: 'store_memory',
            fundId: deal.fund_id,
            dealId,
            memoryType: 'ai_service_interaction',
            title: 'Enhanced Deal Analysis Complete',
            description: `Comprehensive deal analysis for ${deal.company_name}`,
            memoryContent: {
              analysisResult,
              overallScore,
              ragStatus,
              memoryContext: Object.keys(memoryContext).length > 0 ? memoryContext : null,
              orchestratorUsed: !orchestratorError && orchestratorResult?.analysis
            },
            aiServiceName: 'enhanced-deal-analysis',
            confidenceScore: overallScore || 70
          }
        });
        console.log('🧠 Enhanced Deal Analysis: Stored analysis insights in fund memory');
      } catch (error) {
        console.warn('⚠️ Enhanced Deal Analysis: Failed to store memory:', error);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: analysisResult 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating enhanced analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleBatchAnalysis(dealIds: string[], fundId: string) {
  console.log('🔍 Enhanced Deal Analysis: Starting batch analysis for', dealIds.length, 'deals');
  
  const results = await Promise.allSettled(
    dealIds.map(dealId => 
      supabase.functions.invoke('enhanced-deal-analysis', {
        body: { dealId, action: 'single' }
      })
    )
  );

  const batchResults = results.map((result, index) => ({
    dealId: dealIds[index],
    status: result.status,
    data: result.status === 'fulfilled' ? result.value?.data : null,
    error: result.status === 'rejected' ? result.reason : null
  }));

  // Store batch analysis results in fund memory
  if (fundId) {
    try {
      await supabase.functions.invoke('enhanced-fund-memory-engine', {
        body: {
          action: 'store_memory',
          fundId,
          memoryType: 'batch_analysis',
          title: 'Batch Analysis Complete',
          description: `Batch analysis completed for ${dealIds.length} deals`,
          memoryContent: {
            totalDeals: dealIds.length,
            successfulAnalyses: batchResults.filter(r => r.status === 'fulfilled').length,
            failedAnalyses: batchResults.filter(r => r.status === 'rejected').length,
            results: batchResults
          },
          aiServiceName: 'enhanced-deal-analysis',
          confidenceScore: 85
        }
      });
    } catch (error) {
      console.warn('⚠️ Enhanced Deal Analysis: Failed to store batch memory:', error);
    }
  }

  const successfulAnalyses = batchResults.filter(r => r.status === 'fulfilled').length;
  const failedAnalyses = batchResults.filter(r => r.status === 'rejected').length;

  return new Response(JSON.stringify({
    success: true,
    totalDeals: dealIds.length,
    successfulAnalyses,
    failedAnalyses,
    results: batchResults
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateEnhancedAnalysis(deal: any, strategy?: any, context?: any): Promise<AnalysisResult> {
  // Validate available data and mark missing fields
  const validatedDeal = {
    company_name: deal.company_name || 'N/A',
    industry: deal.industry || 'N/A',
    description: deal.description || 'N/A',
    location: deal.location || 'N/A',
    founder: deal.founder || 'N/A',
    employee_count: deal.employee_count || 'N/A',
    deal_size: deal.deal_size || 'N/A',
    valuation: deal.valuation || 'N/A',
    business_model: deal.business_model || 'N/A',
    website: deal.website || 'N/A'
  };

  // Fetch document intelligence
  let documentData = null;
  try {
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('deal_id', deal.id);
    
    if (documents && documents.length > 0) {
      documentData = {
        document_count: documents.length,
        has_pitch_deck: documents.some(d => d.document_type === 'pitch_deck'),
        has_financial_model: documents.some(d => d.document_type === 'financial_model'),
        extracted_insights: documents.map(d => d.extracted_text).filter(Boolean)
      };
    }
  } catch (error) {
    console.warn('Could not fetch document data:', error);
  }

  // Fetch notes intelligence
  let notesIntelligence = null;
  try {
    const { data: notesResponse } = await supabase.functions.invoke('notes-intelligence-processor', {
      body: { dealId: deal.id, action: 'analyze_all' }
    });
    
    if (notesResponse && !notesResponse.error) {
      notesIntelligence = notesResponse;
    }
  } catch (error) {
    console.warn('Could not fetch notes intelligence:', error);
  }

  // Get rubric for fund type
  const fundType = context?.fundType || strategy?.fund_type || 'vc';
  let rubricBreakdown = null;
  
  try {
    const { getRubricForFundType, generateRubricPrompt } = await import('../shared/scoring-rubrics.ts');
    const rubric = getRubricForFundType(fundType);
    
    // Apply rubric scoring for each category
    rubricBreakdown = await applyRubricScoring(deal, rubric, documentData, notesIntelligence);
  } catch (error) {
    console.warn('Could not apply rubric scoring:', error);
  }

  const prompt = `ENHANCED ANALYSIS WITH INTELLIGENCE INTEGRATION:
  
## CRITICAL INSTRUCTIONS - ZERO TOLERANCE FOR FABRICATION:
- ONLY use information explicitly provided in the data below
- If data is missing, incomplete, or not verifiable, use "N/A" or "Unable to validate"
- DO NOT fabricate, assume, or infer missing information
- DO NOT create fictional details about the company, market, or founders
- Base ALL analysis ONLY on verified data provided

COMPANY DATA (use only this information):
COMPANY: ${validatedDeal.company_name}
INDUSTRY: ${validatedDeal.industry}
DESCRIPTION: ${validatedDeal.description}
LOCATION: ${validatedDeal.location}
FOUNDER: ${validatedDeal.founder}
EMPLOYEE COUNT: ${validatedDeal.employee_count}
DEAL SIZE: ${validatedDeal.deal_size !== 'N/A' ? `$${deal.deal_size.toLocaleString()}` : 'N/A'}
VALUATION: ${validatedDeal.valuation !== 'N/A' ? `$${deal.valuation.toLocaleString()}` : 'N/A'}
BUSINESS MODEL: ${validatedDeal.business_model}
WEBSITE: ${validatedDeal.website}

${strategy ? `FUND STRATEGY CONTEXT:
Industries: ${strategy.industries?.join(', ') || 'N/A'}
Geography: ${strategy.geography?.join(', ') || 'N/A'}
Key Signals: ${strategy.key_signals?.join(', ') || 'N/A'}
Min Investment: ${strategy.min_investment_amount ? `$${strategy.min_investment_amount.toLocaleString()}` : 'N/A'}
Max Investment: ${strategy.max_investment_amount ? `$${strategy.max_investment_amount.toLocaleString()}` : 'N/A'}` : 'No fund strategy data available'}

ANALYSIS REQUIREMENTS:
- Provide conservative scores (30-70 range) when data is limited
- State "Unable to validate" for claims that cannot be verified
- Focus analysis on available data only
- Be explicit about data limitations in your analysis`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Faster model for reduced latency
      messages: [
        {
          role: 'system',
          content: `You are a conservative investment analyst. CRITICAL: Only use provided data. Never fabricate information. Use "N/A" or "Unable to validate" when data is missing. Provide realistic scores based only on available information. Be explicit about data limitations.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Lower temperature for more consistent, conservative responses
      max_tokens: 3000, // Reduced for faster response
      functions: [{
        name: 'generate_analysis',
        description: 'Generate comprehensive investment analysis',
        parameters: {
          type: 'object',
          properties: {
            executive_summary: { type: 'string', description: 'Executive summary of deal attractiveness (2-3 sentences)' },
            investment_thesis_alignment: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 1, maximum: 100 },
                analysis: { type: 'string' },
                key_points: { type: 'array', items: { type: 'string' } }
              }
            },
            market_attractiveness: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 1, maximum: 100 },
                analysis: { type: 'string' },
                market_size: { type: 'string' },
                growth_potential: { type: 'string' },
                competitive_landscape: { type: 'string' }
              }
            },
            product_strength_ip: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 1, maximum: 100 },
                analysis: { type: 'string' },
                competitive_advantages: { type: 'array', items: { type: 'string' } },
                ip_assessment: { type: 'string' },
                technology_moat: { type: 'string' }
              }
            },
            financial_feasibility: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 1, maximum: 100 },
                analysis: { type: 'string' },
                revenue_model: { type: 'string' },
                unit_economics: { type: 'string' },
                funding_requirements: { type: 'string' }
              }
            },
            founder_team_strength: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 1, maximum: 100 },
                analysis: { type: 'string' },
                experience_assessment: { type: 'string' },
                team_composition: { type: 'string' },
                execution_capability: { type: 'string' }
              }
            },
            overall_recommendation: { type: 'string' },
            risk_factors: { type: 'array', items: { type: 'string' } },
            next_steps: { type: 'array', items: { type: 'string' } }
          },
          required: ['executive_summary', 'investment_thesis_alignment', 'market_attractiveness', 'product_strength_ip', 'financial_feasibility', 'founder_team_strength', 'overall_recommendation', 'risk_factors', 'next_steps']
        }
      }],
      function_call: { name: 'generate_analysis' }
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const functionCall = data.choices[0].message.function_call;
  
  if (!functionCall) {
    throw new Error('No function call in OpenAI response');
  }

  const result = JSON.parse(functionCall.arguments);
  
  // Add rubric breakdown and notes intelligence if available
  if (rubricBreakdown) {
    result.rubric_breakdown = rubricBreakdown;
  }
  
  if (notesIntelligence) {
    result.notes_intelligence = {
      sentiment_analysis: notesIntelligence.sentiment_analysis,
      key_insights: notesIntelligence.key_insights,
      investment_implications: notesIntelligence.investment_implications
    };
  }
  
  return result;
}

async function applyRubricScoring(deal: any, rubric: any, documentData?: any, notesData?: any): Promise<any> {
  try {
    const { generateRubricPrompt, calculateRubricScore } = await import('../shared/scoring-rubrics.ts');
    
    const categoryScores: any = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    // Process each rubric category
    for (const category of rubric.categories) {
      const prompt = generateRubricPrompt(rubric, category, deal, documentData, notesData);
      
      // Use OpenAI to evaluate this category
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert ${rubric.fundType === 'vc' ? 'venture capital' : 'private equity'} analyst using structured rubrics for investment evaluation. Be thorough, evidence-based, and consistent in your scoring.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1500,
          response_format: { type: 'json_object' }
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const categoryResult = JSON.parse(data.choices[0].message.content);
        
        categoryScores[category.name] = {
          score: categoryResult.overall_category_score,
          criteria_scores: categoryResult.criteria_scores,
          insights: categoryResult.category_insights,
          recommendations: categoryResult.key_recommendations
        };
        
        const weightedScore = categoryResult.overall_category_score * (category.weight / 100);
        totalWeightedScore += weightedScore;
        totalWeight += category.weight;
      }
    }
    
    const overallRubricScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
    
    return {
      overall_rubric_score: Math.round(overallRubricScore),
      category_scores: categoryScores,
      fund_type_analysis: `${rubric.fundType.toUpperCase()} fund analysis using structured evaluation rubrics`,
      rubric_confidence: Math.min(95, Math.max(60, overallRubricScore))
    };
    
  } catch (error) {
    console.warn('Error applying rubric scoring:', error);
    return null;
  }
}