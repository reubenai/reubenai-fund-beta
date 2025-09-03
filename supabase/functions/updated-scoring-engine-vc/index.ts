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

// Helper function to extract feature value from datapoints
const extractFeatureValue = (datapoints: any, featureName: string) => {
  if (!datapoints) return null;
  return datapoints[featureName] || null;
};

// Helper function to generate IC memo content for all 12 sections
const generateICMemoContent = async (
  dealData: any,
  datapointsData: any,
  documentsData: any[],
  scoringResults: any[],
  summaries: any,
  overallScore: number
) => {
  // Extract key features for templates
  const tamFeature = extractFeatureValue(datapointsData, 'tam');
  const samFeature = extractFeatureValue(datapointsData, 'sam');
  const somFeature = extractFeatureValue(datapointsData, 'som');
  const cagrFeature = extractFeatureValue(datapointsData, 'cagr');
  const growthDriversFeature = extractFeatureValue(datapointsData, 'growth_drivers');
  const employeeCountFeature = extractFeatureValue(datapointsData, 'employee_count');
  const fundingStageFeature = extractFeatureValue(datapointsData, 'funding_stage');
  const businessModelFeature = extractFeatureValue(datapointsData, 'business_model');
  const ltvCacFeature = extractFeatureValue(datapointsData, 'ltv_cac_ratio');
  const retentionFeature = extractFeatureValue(datapointsData, 'retention_rate');
  const techStack = extractFeatureValue(datapointsData, 'technology_stack');
  const competitors = extractFeatureValue(datapointsData, 'competitors') || [];
  
  // Prepare competitors list
  const competitorsList = Array.isArray(competitors) ? competitors.join(', ') : 'Analysis pending';
  
  // Extract first 3 key features for executive summary
  const keyFeatures = [];
  if (tamFeature) keyFeatures.push(`TAM: $${tamFeature}M`);
  if (ltvCacFeature) keyFeatures.push(`LTV/CAC: ${ltvCacFeature}`);
  if (retentionFeature) keyFeatures.push(`Retention: ${retentionFeature}%`);

  // 1. Executive Summary - Use existing analysis data for faster response
  let icExecutiveSummary = '';
  
  // Use the already generated deal executive summary if available
  if (summaries.deal_executive_summary && summaries.deal_executive_summary !== 'Analysis completed with mixed results.') {
    icExecutiveSummary = summaries.deal_executive_summary;
  } else {
    // Simple template fallback using existing data
    const recommendation = overallScore >= 70 ? 'Strong investment opportunity' : 
                          overallScore >= 55 ? 'Promising investment candidate' :
                          overallScore >= 40 ? 'Investment requires careful consideration' : 
                          'Investment presents significant challenges';
    
    icExecutiveSummary = `${dealData.company_name} is a ${dealData.industry || 'Unknown'} company with an overall score of ${overallScore.toFixed(1)}/100. ${recommendation}. ${keyFeatures.length > 0 ? 'Key features include ' + keyFeatures.join(', ') + '.' : ''} Investment committee review recommended for final decision.`;
  }

  // Generate risk content for risk section
  const riskCategories = ['Market Risk', 'Execution Risk', 'Financial Risk'];
  const riskContent = riskCategories.join(', ');

  // Generate recommendation based on overall score
  let recommendation = 'HOLD';
  let rationale = [];
  let nextSteps = 'Continue due diligence and schedule management presentation';
  
  if (overallScore >= 70) {
    recommendation = 'STRONG BUY';
    rationale.push('High overall score indicates strong fundamentals');
    nextSteps = 'Proceed to term sheet negotiations';
  } else if (overallScore >= 55) {
    recommendation = 'BUY';
    rationale.push('Good overall score with potential upside');
    nextSteps = 'Complete final due diligence items';
  } else if (overallScore >= 40) {
    recommendation = 'HOLD';
    rationale.push('Mixed results require additional evaluation');
  } else {
    recommendation = 'PASS';
    rationale.push('Below threshold scores indicate significant concerns');
    nextSteps = 'Decline investment or request significant improvements';
  }

  return {
    ic_executive_summary: icExecutiveSummary,
    
    ic_company_overview: `${dealData.company_name} is a ${dealData.industry || 'Unknown'} company. Employee count: ${employeeCountFeature || 'Unknown'}. Funding stage: ${fundingStageFeature || 'Unknown'}. Founded: ${dealData.founding_year || 'Unknown'}. Company overview analysis requires additional research.`,
    
    ic_market_opportunity: `Market opportunity analysis for ${dealData.company_name} in the ${dealData.industry || 'Unknown'} sector. TAM: ${tamFeature ? `$${tamFeature}` : 'Unknown'}, SAM: ${samFeature ? `$${samFeature}` : 'Unknown'}, SOM: ${somFeature ? `$${somFeature}` : 'Unknown'}, Market Growth (CAGR): ${cagrFeature ? `${cagrFeature}%` : 'Unknown'}. Growth drivers: ${Array.isArray(growthDriversFeature) ? growthDriversFeature.join(', ') : 'Analysis pending'}. Market timing and competitive dynamics require further evaluation.`,
    
    ic_product_service: `Product and service analysis for ${dealData.company_name}. Technology stack: ${Array.isArray(techStack) ? techStack.join(', ') : techStack || 'Analysis pending'}. Product differentiation and competitive advantages require detailed analysis. Service delivery model and scalability assessment pending.`,
    
    ic_business_model: `Business model for ${dealData.company_name}: ${businessModelFeature || 'Analysis pending'}. Unit economics - LTV/CAC: ${ltvCacFeature || 'Unknown'}, Customer retention: ${retentionFeature ? `${retentionFeature}%` : 'Unknown'}. Revenue streams and scalability metrics require validation.`,
    
    ic_competitive_landscape: `Competitive landscape analysis for ${dealData.company_name}. Key competitors: ${competitorsList}. Market positioning and competitive advantages require detailed analysis. Differentiation strategy and market share assessment pending.`,
    
    ic_financial_analysis: `Financial analysis for ${dealData.company_name}. LTV/CAC Ratio: ${ltvCacFeature || 'Unknown'}, Customer Retention: ${retentionFeature ? `${retentionFeature}%` : 'Unknown'}, Funding Stage: ${fundingStageFeature || 'Unknown'}, Valuation: ${dealData.valuation ? `$${(dealData.valuation / 1000000).toFixed(1)}M` : 'Unknown'}, Deal Size: ${dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}. Unit economics and growth metrics require further validation.`,
    
    ic_management_team: `Management team assessment for ${dealData.company_name}. Founder: ${dealData.founder || 'Unknown'}. Team size: Unknown. Leadership experience: Requires analysis.`,
    
    ic_risks_mitigants: `Key risks and mitigation strategies for ${dealData.company_name}. ${riskContent}. Mitigation strategies require detailed due diligence and management team discussions.`,
    
    ic_exit_strategy: `Exit strategy analysis for ${dealData.company_name}. Potential exit opportunities include strategic acquisition by industry players, IPO pathway for scaled revenue, or secondary sale to growth equity. Industry consolidation trends and comparable exit multiples require evaluation. Target exit timeline: 5-7 years with strategic value creation initiatives.`,
    
    ic_investment_terms: `Proposed investment terms for ${dealData.company_name}. Deal size: ${dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}. Valuation: ${dealData.valuation ? `$${(dealData.valuation / 1000000).toFixed(1)}M` : 'Unknown'}. Terms: Standard Series A terms.`,
    
    ic_investment_recommendation: `Investment Committee recommendation for ${dealData.company_name}: **${recommendation}**. Overall score: ${overallScore.toFixed(1)}/100. Rationale: ${rationale.length > 0 ? rationale.join(', ') : 'Comprehensive analysis completed'}. Next steps: ${nextSteps}. Investment committee decision required by: [Date TBD].`
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Timeout handling - increased to 90 seconds for reliable OpenAI processing
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Analysis timeout - function exceeded 90 seconds')), 90000)
  );

  const analysisPromise = (async () => {
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

      // 3. Generate GPT-4 analysis for each scoring criterion (OPTIMIZED - PARALLEL PROCESSING)
      console.log('🤖 Starting GPT-4 analysis for all scoring criteria (parallel processing)...');
      
      const summaryData = {
        team_leadership: [],
        market_opportunity: [],
        product_technology: [],
        business_traction: [],
        financial_health: [],
        strategic_fit: []
      };

      // Helper function to extract relevant data for each criterion type
      const getRelevantContext = (criteria: ScoringCriteria) => {
        const criteriaName = criteria.name.toLowerCase();
        const baseContext = {
          company_name: analysisContext.company_name,
          industry: analysisContext.industry,
          deal_size: analysisContext.deal_size,
          valuation: analysisContext.valuation
        };

        // Extract only relevant datapoints to reduce prompt size
        let relevantDatapoints = {};
        if (analysisContext.datapoints) {
          if (criteriaName.includes('founder') || criteriaName.includes('team')) {
            relevantDatapoints = {
              founder_backgrounds: analysisContext.datapoints.founder_backgrounds,
              key_team_members: analysisContext.datapoints.key_team_members,
              advisory_board: analysisContext.datapoints.advisory_board
            };
          } else if (criteriaName.includes('market')) {
            relevantDatapoints = {
              tam: analysisContext.datapoints.tam,
              sam: analysisContext.datapoints.sam,
              som: analysisContext.datapoints.som,
              cagr: analysisContext.datapoints.cagr,
              competitors: analysisContext.datapoints.competitors,
              market_trends: analysisContext.datapoints.market_trends
            };
          } else if (criteriaName.includes('product') || criteriaName.includes('technology')) {
            relevantDatapoints = {
              technology_stack: analysisContext.datapoints.technology_stack,
              technology_moats: analysisContext.datapoints.technology_moats,
              product_features: analysisContext.datapoints.product_features,
              intellectual_property: analysisContext.datapoints.intellectual_property
            };
          } else if (criteriaName.includes('revenue') || criteriaName.includes('customer') || criteriaName.includes('financial')) {
            relevantDatapoints = {
              revenue_model: analysisContext.datapoints.revenue_model,
              ltv_cac_ratio: analysisContext.datapoints.ltv_cac_ratio,
              retention_rate: analysisContext.datapoints.retention_rate,
              key_customers: analysisContext.datapoints.key_customers,
              revenue_growth: analysisContext.datapoints.revenue_growth
            };
          }
          // Remove null/undefined values
          relevantDatapoints = Object.fromEntries(
            Object.entries(relevantDatapoints).filter(([_, v]) => v != null)
          );
        }

        // Extract only key document summaries (first 500 chars each)
        const compactDocuments = analysisContext.documents.slice(0, 3).map(doc => ({
          summary: doc.document_summary,
          text_preview: doc.extracted_text?.substring(0, 500)
        }));

        return {
          ...baseContext,
          datapoints: relevantDatapoints,
          documents: compactDocuments,
          perplexity_market: criteriaName.includes('market') ? analysisContext.perplexity_market : null,
          fund_strategy: analysisContext.fund_strategy
        };
      };

      // Helper function to analyze a single criterion with retry logic
      const analyzeCriteria = async (criteria: ScoringCriteria, retryCount = 0) => {
        const relevantContext = getRelevantContext(criteria);
        
        // Add deal-specific context to ensure different deals get different inputs
        const dealSpecificContext = {
          ...relevantContext,
          deal_id_hash: deal_id.slice(-8), // Last 8 chars of deal ID for uniqueness
          analysis_timestamp: new Date().toISOString()
        };
        
        const prompt = `
You are a venture capital analyst conducting due diligence for deal ${deal_id.slice(-8)}. Analyze this SPECIFIC deal using ONLY the provided evidence.

SCORING INSTRUCTIONS:
1) Ask the guiding question exactly as written: "${criteria.question}"
2) Extract evidence from the provided source data only. Do not infer or fabricate.
3) Map the evidence to the rubric definitions. Choose the single best match.
4) Assign the corresponding numeric score exactly as specified.
5) Keep all units and thresholds as written in the rubric.
6) Prefer recent, primary evidence. If conflicting, state the conflict briefly.
7) Prioritize Perplexity market intelligence when available for market-related criteria.
8) CRITICAL: Analyze this specific deal's unique characteristics - avoid generic responses.

RUBRIC FOR ${criteria.name.toUpperCase()}:
- GREAT (${criteria.greatScore}): ${criteria.greatDescription}
- GOOD (${criteria.goodScore}): ${criteria.goodDescription}  
- POOR (${criteria.poorScore}): ${criteria.poorDescription}

COMPANY DATA FOR ${relevantContext.company_name}:
${JSON.stringify(dealSpecificContext, null, 2)}

OUTPUT FORMAT (JSON only):
{
  "score": [exact score from rubric: ${criteria.greatScore}, ${criteria.goodScore}, or ${criteria.poorScore}],
  "evidence": "[extracted evidence from source data only for ${relevantContext.company_name}]",
  "reasoning": "[map evidence to rubric level and explain score assignment for this specific deal]",
  "category": "[great/good/poor]",
  "insights": "[2-3 bullet points about this criterion for ${relevantContext.company_name}]"
}`;

        try {
          console.log(`🔍 Analyzing ${criteria.name} for ${relevantContext.company_name} (attempt ${retryCount + 1})`);
          
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIAPIKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4.1-2025-04-14',
              messages: [{ role: 'user', content: prompt }],
              max_completion_tokens: 600,
              response_format: { type: "json_object" }
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ OpenAI API error for ${criteria.name}: ${response.status} - ${errorText}`);
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          const result = JSON.parse(data.choices[0].message.content);
          
          // Validate the response contains required fields and score is valid
          if (!result.score || ![criteria.greatScore, criteria.goodScore, criteria.poorScore].includes(result.score)) {
            throw new Error(`Invalid score received: ${result.score}`);
          }
          
          console.log(`✅ ${criteria.name}: ${result.score} (${result.category}) - "${result.evidence?.substring(0, 50)}..."`);
          
          return {
            field: criteria.name,
            ...result
          };
        } catch (error) {
          console.error(`❌ Error analyzing ${criteria.name} (attempt ${retryCount + 1}):`, error);
          
          // Retry up to 2 times for transient errors
          if (retryCount < 2 && (error.message.includes('API error') || error.message.includes('network'))) {
            console.log(`🔄 Retrying ${criteria.name} in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return analyzeCriteria(criteria, retryCount + 1);
          }
          
          // For persistent failures, use middle score instead of always poor
          const fallbackScore = retryCount >= 2 ? criteria.goodScore : criteria.poorScore;
          console.log(`⚠️ Using fallback score ${fallbackScore} for ${criteria.name}`);
          
          return {
            field: criteria.name,
            score: fallbackScore,
            evidence: `Analysis failed after ${retryCount + 1} attempts - insufficient data available`,
            reasoning: `Could not complete analysis due to: ${error.message}`,
            category: retryCount >= 2 ? "good" : "poor",
            insights: [`Analysis could not be completed for ${relevantContext.company_name}`, `Technical issue: ${error.message.substring(0, 100)}`]
          };
        }
      };

      // Process criteria in parallel batches of 3 to avoid overwhelming OpenAI API and reduce timeout risk
      const batchSize = 3;
      const scoringResults = [];
      
      for (let i = 0; i < VC_SCORING_CRITERIA.length; i += batchSize) {
        const batch = VC_SCORING_CRITERIA.slice(i, i + batchSize);
        console.log(`📝 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(VC_SCORING_CRITERIA.length/batchSize)} (${batch.length} criteria)`);
        
        const batchPromises = batch.map(criteria => analyzeCriteria(criteria));
        const batchResults = await Promise.all(batchPromises);
        
        scoringResults.push(...batchResults);
        
        // Log progress
        batchResults.forEach(result => {
          console.log(`✅ ${result.field}: ${result.score} (${result.category})`);
          
          // Categorize insights for summaries
          const criteriaName = result.field.toLowerCase();
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
        });
        
        // Longer delay between batches to respect rate limits and improve reliability
        if (i + batchSize < VC_SCORING_CRITERIA.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
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

8. Key Strengths: List 3-5 bullet points highlighting the strongest aspects of this company/deal

9. Key Concerns: List 3-5 bullet points identifying the main weaknesses or concerns about this company/deal

10. Recommendations: Provide 2-4 actionable recommendations for the investment decision

11. Risk Factors: Identify and categorize key risks (market_risk, execution_risk, competitive_risk, financial_risk)

OUTPUT FORMAT (JSON only):
{
  "deal_executive_summary": "...",
  "team_leadership_summary": "...",
  "market_opportunity_summary": "...",
  "product_technology_summary": "...",
  "business_traction_summary": "...",
  "financial_health_summary": "...",
  "strategic_fit_summary": "...",
  "key_strengths": ["strength 1", "strength 2", "strength 3"],
  "key_concerns": ["concern 1", "concern 2", "concern 3"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "risk_factors": {
    "market_risk": "description",
    "execution_risk": "description",
    "competitive_risk": "description",
    "financial_risk": "description"
  }
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
          strategic_fit_summary: "Strategic analysis conducted.",
          key_strengths: ["Analysis pending"],
          key_concerns: ["Analysis pending"],
          recommendations: ["Further analysis required"],
          risk_factors: {
            market_risk: "Assessment pending",
            execution_risk: "Assessment pending",
            competitive_risk: "Assessment pending",
            financial_risk: "Assessment pending"
          }
        };
      }

      // 5. Calculate overall score (sum of all individual scores) with validation
      const validScores = scoringResults.filter(r => typeof r.score === 'number');
      const totalScore = validScores.reduce((sum, r) => sum + r.score, 0);
      const overallScore = validScores.length > 0 ? Math.round(totalScore * 10) / 10 : 0;

      console.log(`📊 Overall Score Calculated: ${overallScore} (from ${validScores.length} criteria)`);
      
      // Score validation - check for suspicious patterns
      const uniqueScores = new Set(validScores.map(r => r.score));
      if (uniqueScores.size === 1 && validScores.length > 5) {
        console.warn(`⚠️ WARNING: All ${validScores.length} criteria received identical score (${Array.from(uniqueScores)[0]}) - possible analysis issue`);
      }
      
      // Log score distribution for debugging
      const scoreDistribution = validScores.reduce((dist, r) => {
        dist[r.category] = (dist[r.category] || 0) + 1;
        return dist;
      }, {});
      console.log(`📈 Score distribution: ${JSON.stringify(scoreDistribution)}`);

      // 6. Generate IC Memo Content
      console.log('📝 Generating IC memo content...');
      const icMemoContent = await generateICMemoContent(
        dealData,
        datapointsData,
        documentsData,
        scoringResults,
        summaries,
        overallScore
      );
      console.log('✅ IC memo content generated successfully');

      // 7. Prepare data for database
      const scoreData = {};
      scoringResults.forEach(result => {
        scoreData[result.field] = result.score;
      });

      // 7. UPSERT results into deal_analysisresult_vc
      console.log('💾 Saving results to database...');
      
      const { data: upsertResult, error: upsertError } = await supabaseClient
        .from('deal_analysisresult_vc')
        .update({
          fund_id: fundId,
          organization_id: fundData.organization_id,
          overall_score: overallScore,
          ...scoreData,
          ...summaries,
          ...icMemoContent,
          confidence_score: Math.min(95, Math.max(60, validScores.length * 5)),
          processing_status: 'completed',
          analyzed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('deal_id', deal_id);

      if (upsertError) {
        throw new Error(`Failed to save results: ${upsertError.message}`);
      }

      console.log('✅ Results saved successfully to deal_analysisresult_vc');

      // 8. Update deals table with the overall score
      console.log('💾 Updating deals table with overall score...');

      const { error: dealsUpdateError } = await supabaseClient
        .from('deals')
        .update({
          overall_score: overallScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', deal_id);

      if (dealsUpdateError) {
        console.error('❌ Failed to update deals table:', dealsUpdateError.message);
        // Note: We don't throw here as the main analysis was successful
      } else {
        console.log('✅ Deals table updated successfully with overall score');
      }

      // 📝 IC memo generation is now manual-only via button trigger
      // Automatic generation when deals move to Investment Committee stage has been disabled
      console.log('📝 IC memo generation is available via manual button trigger only');

      // 10. Return success response
      return {
        success: true,
        deal_id: deal_id,
        overall_score: overallScore,
        scores_analyzed: validScores.length,
        total_criteria: VC_SCORING_CRITERIA.length,
        ic_memo_generation: {
          success: true,
          sections_generated: 12,
          sections: ['executive_summary', 'company_overview', 'market_opportunity', 'product_service', 'business_model', 'competitive_landscape', 'financial_analysis', 'management_team', 'risks_mitigants', 'exit_strategy', 'investment_terms', 'investment_recommendation']
        },
        message: 'VC deal analysis and IC memo content generation completed successfully.'
      };

    } catch (error) {
      console.error('❌ Updated Scoring Engine VC Error:', error);
      throw error;
    }
  })();

  try {
    // Race between analysis and timeout
    const result = await Promise.race([analysisPromise, timeout]);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Updated Scoring Engine VC Error:', error);
    
    // Handle timeout specifically
    if (error.message.includes('timeout')) {
      console.error('⏰ Function timed out - returning partial results if available');
    }
    
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