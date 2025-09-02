import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScoringCriteria {
  name: string;
  question: string;
  greatScore: number;
  goodScore: number;
  poorScore: number;
  greatDescription: string;
  goodDescription: string;
  poorDescription: string;
}

const VC_SCORING_CRITERIA: ScoringCriteria[] = [
  {
    name: "founder_experience_score",
    question: "What is the founder's track record in entrepreneurship or within this industry?",
    greatScore: 8.0,
    goodScore: 5.6,
    poorScore: 2.4,
    greatDescription: "Exited founder / 10+ years relevant industry expertise",
    goodDescription: "Some prior startup or industry experience, but not at scale",
    poorDescription: "First-time founder with little/no sector background"
  },
  {
    name: "team_composition_score",
    question: "Does the team include the core functions needed to scale this business?",
    greatScore: 7.0,
    goodScore: 4.9,
    poorScore: 2.1,
    greatDescription: "Balanced founding team covering tech, product, sales, and operations",
    goodDescription: "Some gaps in key functional areas but partially covered",
    poorDescription: "Solo founder or major capability gaps"
  },
  {
    name: "vision_communication_score",
    question: "How well does the founder articulate their vision and strategy?",
    greatScore: 5.0,
    goodScore: 3.5,
    poorScore: 1.5,
    greatDescription: "Founder is a visionary communicator; inspires confidence internally & externally",
    goodDescription: "Communicates adequately but lacks clarity or polish",
    poorDescription: "Vision unclear or inconsistent; poor communication skills"
  },
  {
    name: "market_size_score",
    question: "What is the estimated size of the target market (TAM, SAM, SOM)?",
    greatScore: 7.2,
    goodScore: 5.04,
    poorScore: 2.16,
    greatDescription: "TAM > $1B, clear large addressable market",
    goodDescription: "TAM $250M–$1B, with room to expand",
    poorDescription: "TAM < $250M, unclear or niche opportunity"
  },
  {
    name: "market_timing_score",
    question: "What macro or industry trends support adoption right now?",
    greatScore: 6.3,
    goodScore: 4.41,
    poorScore: 1.89,
    greatDescription: "Strong macro/industry tailwinds; adoption inflection point",
    goodDescription: "Moderate growth trends or steady adoption",
    poorDescription: "Declining or stagnant market; unclear timing advantage"
  },
  {
    name: "competitive_landscape_score",
    question: "Who are the main competitors, and how does this company differentiate?",
    greatScore: 4.5,
    goodScore: 3.15,
    poorScore: 1.35,
    greatDescription: "Clear whitespace or strong differentiation against incumbents",
    goodDescription: "Competitive but manageable with some differentiators",
    poorDescription: "Highly crowded market, dominated by incumbents"
  },
  {
    name: "product_innovation_score",
    question: "What makes this product innovative compared to alternatives?",
    greatScore: 6.8,
    goodScore: 4.76,
    poorScore: 2.04,
    greatDescription: "Novel, highly innovative product with strong IP or patents",
    goodDescription: "Some innovative elements but partly replicable",
    poorDescription: "Lacks innovation; commodity or \"me too\" product"
  },
  {
    name: "technology_advantage_score",
    question: "What is the company's technological edge?",
    greatScore: 6.0,
    goodScore: 4.2,
    poorScore: 1.8,
    greatDescription: "Proprietary tech, defensible, difficult to replicate",
    goodDescription: "Moderate differentiation but can be copied",
    poorDescription: "No meaningful tech advantage; easily replicable"
  },
  {
    name: "product_market_fit_score",
    question: "What evidence shows this product meets customer needs?",
    greatScore: 4.2,
    goodScore: 2.94,
    poorScore: 1.26,
    greatDescription: "Strong customer adoption, retention, and advocacy",
    goodDescription: "Early adoption with positive signals but not yet proven",
    poorDescription: "Weak or no evidence of product-market fit"
  },
  {
    name: "revenue_growth_score",
    question: "What has been the company's revenue growth trajectory?",
    greatScore: 6.4,
    goodScore: 4.48,
    poorScore: 1.92,
    greatDescription: ">50% YoY revenue growth, recurring revenue model",
    goodDescription: "20–50% YoY growth or early but steady traction",
    poorDescription: "<20% YoY growth or inconsistent revenue"
  },
  {
    name: "customer_metrics_score",
    question: "What are customer acquisition, retention, and unit economics?",
    greatScore: 5.6,
    goodScore: 3.92,
    poorScore: 1.68,
    greatDescription: "Strong acquisition, retention, and unit economics (CAC/LTV)",
    goodDescription: "Moderate metrics with some weaknesses",
    poorDescription: "High churn, weak or unsustainable metrics"
  },
  {
    name: "market_validation_score",
    question: "What external signals validate this company's market traction?",
    greatScore: 4.0,
    goodScore: 2.8,
    poorScore: 1.2,
    greatDescription: "Strong partnerships, marquee clients, industry recognition",
    goodDescription: "Early customers or pilots but not fully scaled",
    poorDescription: "No clear external validation yet"
  },
  {
    name: "financial_performance_score",
    question: "What are the company's current financial performance indicators?",
    greatScore: 6.0,
    goodScore: 4.2,
    poorScore: 1.8,
    greatDescription: "Strong revenue base, high margins, and predictable cash flow",
    goodDescription: "Growing revenues, mixed margins, some volatility",
    poorDescription: "Low or negative revenues, unsustainable cost structure"
  },
  {
    name: "capital_efficiency_score",
    question: "How efficiently does the company use capital to drive growth?",
    greatScore: 5.3,
    goodScore: 3.71,
    poorScore: 1.59,
    greatDescription: "Demonstrated ability to grow efficiently with minimal burn",
    goodDescription: "Moderate efficiency, some reliance on capital injections",
    poorDescription: "High burn, weak efficiency, heavy dependence on external capital"
  },
  {
    name: "financial_planning_score",
    question: "How robust and realistic is the company's financial planning?",
    greatScore: 3.7,
    goodScore: 2.59,
    poorScore: 1.11,
    greatDescription: "Robust financial plan, realistic forecasts, scenario planning",
    goodDescription: "Basic planning with some assumptions unclear",
    poorDescription: "No clear financial plan or unrealistic assumptions"
  },
  {
    name: "portfolio_synergies_score",
    question: "How does this investment align with the portfolio's existing assets?",
    greatScore: 5.6,
    goodScore: 3.92,
    poorScore: 1.68,
    greatDescription: "Strong synergies with existing portfolio or ecosystem",
    goodDescription: "Some indirect synergies, potential for collaboration",
    poorDescription: "Little or no synergy with current investments"
  },
  {
    name: "investment_thesis_alignment_score",
    question: "How well does this opportunity fit the fund's investment thesis?",
    greatScore: 4.9,
    goodScore: 3.43,
    poorScore: 1.47,
    greatDescription: "Direct match with fund's investment thesis",
    goodDescription: "Partial overlap with fund's thesis",
    poorDescription: "Weak or no alignment with thesis"
  },
  {
    name: "value_creation_potential_score",
    question: "What opportunities exist for value creation beyond funding?",
    greatScore: 3.5,
    goodScore: 2.45,
    poorScore: 1.05,
    greatDescription: "Clear levers for significant value creation post-investment",
    goodDescription: "Some value creation opportunities, moderate upside",
    poorDescription: "Limited ability to add value beyond capital"
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const openAIAPIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIAPIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { deal_id } = await req.json();
    
    if (!deal_id) {
      throw new Error('deal_id is required');
    }

    console.log(`🚀 Updated Scoring Engine VC - Starting analysis for deal: ${deal_id}`);

    // 1. Get deal data first to avoid relationship ambiguity
    console.log('📊 Gathering deal data from multiple sources...');
    
    // First, get the deal data which includes fund_id
    const dealDataResult = await supabaseClient
      .from('deals')
      .select('*')
      .eq('id', deal_id)
      .single();

    if (dealDataResult.error) {
      throw new Error(`Failed to fetch deal data: ${dealDataResult.error.message}`);
    }

    const dealData = dealDataResult.data;
    const fundId = dealData.fund_id;

    if (!fundId) {
      throw new Error('Deal does not have a fund_id');
    }

    // Now use the fund_id to get all other data in parallel
    const [fundDataResult, datapointsResult, documentsResult, strategyResult, perplexityMarketResult] = await Promise.all([
      supabaseClient
        .from('funds')
        .select('fund_type, organization_id')
        .eq('id', fundId)
        .single(),
      
      supabaseClient
        .from('deal_analysis_datapoints_vc')
        .select('*')
        .eq('deal_id', deal_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      
      supabaseClient
        .from('deal_documents')
        .select('extracted_text, document_summary')
        .eq('deal_id', deal_id)
        .limit(10),
      
      supabaseClient
        .from('investment_strategies')
        .select('*')
        .eq('fund_id', fundId)
        .maybeSingle(),
      
      supabaseClient
        .from('deal_enrichment_perplexity_market_export_vc')
        .select('*')
        .eq('deal_id', deal_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    if (fundDataResult.error) {
      throw new Error(`Failed to fetch fund data: ${fundDataResult.error.message}`);
    }

    const fundData = fundDataResult.data;
    const datapointsData = datapointsResult.data;
    const documentsData = documentsResult.data || [];
    const strategyData = strategyResult.data;
    const perplexityMarketData = perplexityMarketResult.data;

    console.log(`✅ Data gathered: Deal found, ${datapointsData ? '1' : '0'} datapoints, ${documentsData.length} documents, ${perplexityMarketData ? '1' : '0'} perplexity market data`);

    // 2. Prepare analysis context
    const analysisContext = {
      company_name: dealData.company_name,
      industry: dealData.industry,
      deal_size: dealData.deal_size,
      valuation: dealData.valuation,
      datapoints: datapointsData,
      documents: documentsData,
      fund_strategy: strategyData?.enhanced_criteria || {},
      fund_type: fundData.fund_type,
      perplexity_market: perplexityMarketData,
      data_quality_score: perplexityMarketData?.data_quality_score || 0,
      confidence_level: perplexityMarketData?.confidence_level || 'medium'
    };

    // 3. Generate GPT-4 analysis for each scoring criterion
    console.log('🤖 Starting GPT-4 analysis for all scoring criteria...');
    
    const scoringResults = [];
    const summaryData = {
      team_leadership: [],
      market_opportunity: [],
      product_technology: [],
      business_traction: [],
      financial_health: [],
      strategic_fit: []
    };

    for (const criteria of VC_SCORING_CRITERIA) {
      console.log(`📝 Analyzing: ${criteria.name}`);
      
      const prompt = `
You are a venture capital analyst conducting due diligence. Analyze the following deal using ONLY the provided evidence.

SCORING INSTRUCTIONS:
1) Ask the guiding question exactly as written: "${criteria.question}"
2) Extract evidence from the provided source data only. Do not infer or fabricate.
3) Map the evidence to the rubric definitions. Choose the single best match.
4) Assign the corresponding numeric score exactly as specified.
5) Keep all units and thresholds as written in the rubric.
6) Prefer recent, primary evidence. If conflicting, state the conflict briefly.
7) Prioritize Perplexity market intelligence when available for market-related criteria.

RUBRIC FOR ${criteria.name.toUpperCase()}:
- GREAT (${criteria.greatScore}): ${criteria.greatDescription}
- GOOD (${criteria.goodScore}): ${criteria.goodDescription}  
- POOR (${criteria.poorScore}): ${criteria.poorDescription}

COMPANY DATA:
Company: ${analysisContext.company_name}
Industry: ${analysisContext.industry}
Deal Size: $${analysisContext.deal_size?.toLocaleString() || 'N/A'}
Valuation: $${analysisContext.valuation?.toLocaleString() || 'N/A'}

DATAPOINTS: ${JSON.stringify(analysisContext.datapoints || {}, null, 2)}

PERPLEXITY MARKET INTELLIGENCE: ${JSON.stringify(analysisContext.perplexity_market || {}, null, 2)}

DOCUMENTS: ${analysisContext.documents.map(doc => `
Document Summary: ${JSON.stringify(doc.document_summary || {})}
Text: ${doc.extracted_text?.substring(0, 2000) || 'No text available'}
`).join('\n---\n')}

FUND STRATEGY: ${JSON.stringify(analysisContext.fund_strategy, null, 2)}

OUTPUT FORMAT (JSON only):
{
  "score": [exact score from rubric: ${criteria.greatScore}, ${criteria.goodScore}, or ${criteria.poorScore}],
  "evidence": "[extracted evidence from source data only]",
  "reasoning": "[map evidence to rubric level and explain score assignment]",
  "category": "[great/good/poor]",
  "insights": "[2-3 bullet points about this criterion]"
}`;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIAPIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            messages: [{ role: 'user', content: prompt }],
            max_completion_tokens: 800,
            response_format: { type: "json_object" }
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);
        
        scoringResults.push({
          field: criteria.name,
          ...result
        });

        // Categorize insights for summaries
        const criteriaName = criteria.name.toLowerCase();
        if (criteriaName.includes('founder') || criteriaName.includes('team') || criteriaName.includes('vision')) {
          summaryData.team_leadership.push(result.insights);
        } else if (criteriaName.includes('market') && !criteriaName.includes('product')) {
          summaryData.market_opportunity.push(result.insights);
        } else if (criteriaName.includes('product') || criteriaName.includes('technology') || criteriaName.includes('innovation')) {
          summaryData.product_technology.push(result.insights);
        } else if (criteriaName.includes('revenue') || criteriaName.includes('customer') || criteriaName.includes('validation')) {
          summaryData.business_traction.push(result.insights);
        } else if (criteriaName.includes('financial') || criteriaName.includes('capital')) {
          summaryData.financial_health.push(result.insights);
        } else if (criteriaName.includes('portfolio') || criteriaName.includes('thesis') || criteriaName.includes('value')) {
          summaryData.strategic_fit.push(result.insights);
        }

        console.log(`✅ ${criteria.name}: ${result.score} (${result.category})`);
      } catch (error) {
        console.error(`❌ Error analyzing ${criteria.name}:`, error);
        scoringResults.push({
          field: criteria.name,
          score: criteria.poorScore,
          evidence: "Analysis failed - insufficient data",
          reasoning: "Could not complete analysis due to technical error",
          category: "poor",
          insights: ["Analysis could not be completed"]
        });
      }
    }

    // 4. Generate detailed summaries
    console.log('📝 Generating comprehensive summaries...');
    
    const summaryPrompt = `
Based on the venture capital analysis conducted, generate comprehensive summaries for each category.

ANALYSIS RESULTS: ${JSON.stringify(scoringResults, null, 2)}

COMPANY: ${analysisContext.company_name}
INDUSTRY: ${analysisContext.industry}

Generate summaries with specific sentence requirements:

1. Deal Executive Summary: Write exactly 2-3 sentences about the whole deal, overall investment recommendation and key highlights

2. Team & Leadership Summary: Write exactly 1-2 sentences covering Founder Experience, Team Composition, and Vision & Communication

3. Market Opportunity Summary: Write exactly 1-2 sentences covering Market Size, Market Timing, and Competitive Landscape

4. Product & Technology Summary: Write exactly 1-2 sentences covering Product Innovation, Technology Advantage, and Product-Market Fit

5. Business Traction Summary: Write exactly 1-2 sentences covering Revenue Growth, Customer Metrics, and Market Validation

6. Financial Health Summary: Write exactly 1-2 sentences covering Financial Performance, Capital Efficiency, and Financial Planning

7. Strategic Fit Summary: Write exactly 1-2 sentences covering Portfolio Synergies, Investment Thesis Alignment, and Value Creation Potential

OUTPUT FORMAT (JSON only):
{
  "deal_executive_summary": "...",
  "team_leadership_summary": "...",
  "market_opportunity_summary": "...",
  "product_technology_summary": "...",
  "business_traction_summary": "...",
  "financial_health_summary": "...",
  "strategic_fit_summary": "..."
}`;

    let summaries = {};
    try {
      const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIAPIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [{ role: 'user', content: summaryPrompt }],
          max_completion_tokens: 1200,
          response_format: { type: "json_object" }
        }),
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        summaries = JSON.parse(summaryData.choices[0].message.content);
        console.log('✅ Summaries generated successfully');
      }
    } catch (error) {
      console.error('❌ Error generating summaries:', error);
      summaries = {
        deal_executive_summary: "Analysis completed with mixed results.",
        team_leadership_summary: "Team analysis conducted.",
        market_opportunity_summary: "Market analysis conducted.",
        product_technology_summary: "Product analysis conducted.",
        business_traction_summary: "Traction analysis conducted.",
        financial_health_summary: "Financial analysis conducted.",
        strategic_fit_summary: "Strategic analysis conducted."
      };
    }

    // 5. Calculate overall score
    const validScores = scoringResults.filter(r => typeof r.score === 'number');
    const totalScore = validScores.reduce((sum, r) => sum + r.score, 0);
    const overallScore = validScores.length > 0 ? Math.round((totalScore / validScores.length) * 10) / 10 : 0;

    console.log(`📊 Overall Score Calculated: ${overallScore} (from ${validScores.length} criteria)`);

    // 6. Prepare data for database
    const scoreData = {};
    scoringResults.forEach(result => {
      scoreData[result.field] = result.score;
    });

    // 7. UPSERT results into deal_analysisresult_vc
    console.log('💾 Saving results to database...');
    
    const { data: upsertResult, error: upsertError } = await supabaseClient
      .from('deal_analysisresult_vc')
      .upsert({
        deal_id: deal_id,
        fund_id: fundId,
        organization_id: fundData.organization_id,
        overall_score: overallScore,
        ...scoreData,
        ...summaries,
        confidence_score: Math.min(95, Math.max(60, validScores.length * 5)),
        processing_status: 'completed',
        analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      throw new Error(`Failed to save results: ${upsertError.message}`);
    }

    console.log('✅ Results saved successfully to deal_analysisresult_vc');

    // 8. Return success response
    return new Response(JSON.stringify({
      success: true,
      deal_id: deal_id,
      overall_score: overallScore,
      scores_analyzed: validScores.length,
      total_criteria: VC_SCORING_CRITERIA.length,
      message: 'VC deal analysis completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Updated Scoring Engine VC Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Analysis failed',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});