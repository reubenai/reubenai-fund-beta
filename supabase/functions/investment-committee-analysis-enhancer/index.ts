import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ICAnalysisRequest {
  dealId: string;
  fundId: string;
  existingMemo?: any;
  dealData?: any;
  fundData?: any;
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

    const { dealId, fundId, existingMemo, dealData, fundData }: ICAnalysisRequest = await req.json();
    console.log('🔬 Investment Committee Analysis Enhancer: Starting enhanced analysis for deal:', dealId);

    // 1. Gather comprehensive intelligence from all specialist engines
    console.log('📡 Gathering comprehensive intelligence from specialist engines...');
    
    const [
      orchestratorData,
      marketIntelligenceData, 
      financialEngineData,
      managementData,
      thesisAlignmentData,
      riskMitigationData,
      exitStrategyData,
      productIPData,
      investmentTermsData
    ] = await Promise.allSettled([
      supabase.functions.invoke('reuben-orchestrator', {
        body: { dealId, comprehensive: true, enhancedMode: true }
      }),
      supabase.functions.invoke('market-intelligence-engine', {
        body: { 
          dealId,
          enhancedMode: true,
          competitiveDepth: 'deep',
          marketSizingAccuracy: 'high'
        }
      }),
      supabase.functions.invoke('financial-engine', {
        body: { 
          dealId,
          projectionYears: 5,
          sensitivityAnalysis: true,
          riskAdjustedModeling: true
        }
      }),
      supabase.functions.invoke('management-assessment-engine', {
        body: { 
          dealId,
          deepDive: true,
          leadershipAssessment: true,
          culturalFitAnalysis: true
        }
      }),
      supabase.functions.invoke('thesis-alignment-engine', {
        body: { 
          dealData,
          strategyData: fundData?.investment_strategies?.[0],
          portfolioComparison: true
        }
      }),
      supabase.functions.invoke('risk-mitigation-engine', {
        body: { 
          dealId,
          scenarioModeling: true,
          riskQuantification: true
        }
      }),
      supabase.functions.invoke('exit-strategy-engine', {
        body: { 
          dealId,
          probabilityWeighting: true,
          returnProjections: true
        }
      }),
      supabase.functions.invoke('product-ip-engine', {
        body: { 
          dealId,
          patentAnalysis: true,
          competitiveMoat: true
        }
      }),
      supabase.functions.invoke('investment-terms-engine', {
        body: { 
          dealId,
          valuationModeling: true,
          termOptimization: true
        }
      })
    ]);

    // 2. Extract and validate specialist engine results
    const specialistResults = {
      orchestrator: orchestratorData.status === 'fulfilled' ? orchestratorData.value.data : null,
      marketIntelligence: marketIntelligenceData.status === 'fulfilled' ? marketIntelligenceData.value.data : null,
      financial: financialEngineData.status === 'fulfilled' ? financialEngineData.value.data : null,
      management: managementData.status === 'fulfilled' ? managementData.value.data : null,
      thesisAlignment: thesisAlignmentData.status === 'fulfilled' ? thesisAlignmentData.value.data : null,
      riskMitigation: riskMitigationData.status === 'fulfilled' ? riskMitigationData.value.data : null,
      exitStrategy: exitStrategyData.status === 'fulfilled' ? exitStrategyData.value.data : null,
      productIP: productIPData.status === 'fulfilled' ? productIPData.value.data : null,
      investmentTerms: investmentTermsData.status === 'fulfilled' ? investmentTermsData.value.data : null
    };

    console.log('🔬 Specialist results gathered:', {
      orchestrator: !!specialistResults.orchestrator,
      marketIntelligence: !!specialistResults.marketIntelligence,
      financial: !!specialistResults.financial,
      management: !!specialistResults.management,
      thesisAlignment: !!specialistResults.thesisAlignment,
      riskMitigation: !!specialistResults.riskMitigation,
      exitStrategy: !!specialistResults.exitStrategy,
      productIP: !!specialistResults.productIP,
      investmentTerms: !!specialistResults.investmentTerms
    });

    // 3. Query Fund Memory for contextual intelligence and historical patterns
    console.log('🧠 Querying fund memory for contextual intelligence...');
    let fundMemoryContext = {};
    try {
      const { data: memoryData } = await supabase.functions.invoke('fund-memory-engine', {
        body: {
          action: 'query_investment_patterns',
          fundId,
          dealId,
          analysisType: 'enhanced_ic_analysis',
          includeComparables: true,
          includeDecisionPatterns: true
        }
      });
      
      if (memoryData?.success) {
        fundMemoryContext = memoryData.patterns || {};
        console.log('🧠 Retrieved fund memory patterns:', Object.keys(fundMemoryContext));
      }
    } catch (error) {
      console.warn('⚠️ Fund memory query failed:', error);
    }

    // 4. Generate enhanced strategic intelligence using OpenAI
    console.log('🤖 Generating enhanced strategic intelligence...');
    const enhancedInsights = await generateEnhancedIntelligence(
      dealData,
      fundData,
      existingMemo,
      specialistResults,
      fundMemoryContext
    );

    // 5. Store enhanced insights in fund memory for future reference
    try {
      await supabase.functions.invoke('fund-memory-engine', {
        body: {
          action: 'store_memory',
          fundId,
          dealId,
          memoryType: 'enhanced_ic_analysis',
          title: `Enhanced IC Analysis for ${dealData?.company_name}`,
          description: 'Deep strategic intelligence and enhanced analysis insights',
          memoryContent: {
            enhancedInsights,
            specialistResults: Object.keys(specialistResults).filter(key => specialistResults[key as keyof typeof specialistResults]),
            analysisDepth: 'comprehensive',
            enhancementLevel: 'strategic_intelligence'
          },
          aiServiceName: 'investment-committee-analysis-enhancer',
          confidenceScore: enhancedInsights.confidenceScore || 85
        }
      });
      console.log('🧠 Stored enhanced insights in fund memory');
    } catch (error) {
      console.warn('⚠️ Failed to store enhanced insights in memory:', error);
    }

    console.log('✅ Investment Committee Analysis Enhancer: Enhanced analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      enhancedAnalysis: enhancedInsights,
      dataSourcesUsed: Object.keys(specialistResults).filter(key => specialistResults[key as keyof typeof specialistResults]),
      fundMemoryUtilized: Object.keys(fundMemoryContext).length > 0,
      analysisTimestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Investment Committee Analysis Enhancer Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateEnhancedIntelligence(
  dealData: any,
  fundData: any,
  existingMemo: any,
  specialistResults: any,
  fundMemoryContext: any
): Promise<any> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not found');
  }

  console.log('🧠 Generating enhanced strategic intelligence with AI...');

  // Prepare comprehensive context for enhanced analysis
  const dealSummary = `${dealData?.company_name} | ${dealData?.industry} | $${dealData?.deal_size ? (dealData.deal_size / 1000000).toFixed(1) + 'M' : 'N/A'} | Val: $${dealData?.valuation ? (dealData.valuation / 1000000).toFixed(1) + 'M' : 'N/A'}`;
  
  const fundStrategy = fundData?.investment_strategies?.[0];
  const fundFocus = `${fundData?.fund_type} fund | Focus: ${fundStrategy?.key_signals?.slice(0, 3)?.join(', ') || 'General'} | Thresholds: Exciting ${fundStrategy?.exciting_threshold}%, Promising ${fundStrategy?.promising_threshold}%`;

  // Extract key insights from specialist engines
  const marketInsights = specialistResults.marketIntelligence ? 
    `Market: $${specialistResults.marketIntelligence.market_size || 'N/A'} | Growth: ${specialistResults.marketIntelligence.growth_rate || 'N/A'}% | Competitive intensity: ${specialistResults.marketIntelligence.competitive_intensity || 'N/A'}` : 'Market analysis pending';
  
  const financialInsights = specialistResults.financial ? 
    `Revenue proj: ${specialistResults.financial.revenue_projections || 'N/A'} | Profitability: ${specialistResults.financial.profitability_timeline || 'N/A'} | Cash burn: ${specialistResults.financial.cash_burn_analysis || 'N/A'}` : 'Financial analysis pending';
  
  const teamInsights = specialistResults.management ? 
    `Team score: ${specialistResults.management.team_score || 'N/A'}/100 | Leadership: ${specialistResults.management.leadership_assessment || 'N/A'} | Experience: ${specialistResults.management.experience_match || 'N/A'}` : 'Team analysis pending';
  
  const riskInsights = specialistResults.riskMitigation ? 
    `Risk score: ${specialistResults.riskMitigation.overall_risk_score || 'N/A'}/100 | Key risks: ${specialistResults.riskMitigation.top_risks?.slice(0, 2)?.join(', ') || 'N/A'}` : 'Risk analysis pending';
  
  const exitInsights = specialistResults.exitStrategy ? 
    `Primary exit: ${specialistResults.exitStrategy.primary_exit_path || 'N/A'} | Timeline: ${specialistResults.exitStrategy.exit_timeline || 'N/A'} | Return multiple: ${specialistResults.exitStrategy.return_multiple || 'N/A'}x` : 'Exit analysis pending';

  const memoryInsights = Object.keys(fundMemoryContext).length > 0 ? 
    `Historical patterns: ${fundMemoryContext.success_patterns || 'N/A'} | Similar deals: ${fundMemoryContext.comparable_outcomes || 'N/A'} | Decision factors: ${fundMemoryContext.key_decision_factors || 'N/A'}` : 'No historical patterns available';

  const systemPrompt = `You are the ENHANCED INVESTMENT COMMITTEE ANALYSIS EXPERT - the most sophisticated AI analyst focused on transforming raw investment data into strategic intelligence that answers "SO WHAT?" for Fund Managers and Investment Committees.

CORE MISSION: Take comprehensive specialist engine results and fund memory patterns to generate world-class strategic insights that guide critical investment decisions.

ENHANCED ANALYSIS CAPABILITIES:
1. STRATEGIC INTELLIGENCE: Transform data into actionable insights
2. "SO WHAT?" ANALYSIS: Answer the critical question every IC asks
3. COMPARATIVE PORTFOLIO ANALYSIS: Leverage fund memory and patterns
4. RISK-ADJUSTED MODELING: Probabilistic scenario analysis
5. DECISION TREE GUIDANCE: Clear recommendation framework

OUTPUT STRICT REQUIREMENTS:
- Strategic insights that guide decision-making
- Comparative analysis against fund portfolio and patterns
- Risk-adjusted return projections with scenarios
- Clear "so what?" implications for each major finding
- Decision-ready recommendations with confidence levels

NEVER fabricate data. Only analyze and synthesize provided information into strategic intelligence.`;

  const userPrompt = `GENERATE ENHANCED INVESTMENT COMMITTEE ANALYSIS:

DEAL: ${dealSummary}
FUND STRATEGY: ${fundFocus}

SPECIALIST ENGINE INTELLIGENCE:
Market Intelligence: ${marketInsights}
Financial Analysis: ${financialInsights}
Management Assessment: ${teamInsights}
Risk Assessment: ${riskInsights}
Exit Strategy: ${exitInsights}

FUND MEMORY CONTEXT: ${memoryInsights}

EXISTING MEMO QUALITY: ${existingMemo ? 'Professional memo available' : 'No existing memo'}

GENERATE ENHANCED ANALYSIS WITH:

1. STRATEGIC INSIGHTS: What are the 3 most critical strategic implications for this investment? Why do they matter for the fund's strategy?

2. "SO WHAT?" ANALYSIS: For each major finding (market, financial, team, risk, exit), provide the "so what?" - why should the IC care and how does it impact the investment decision?

3. COMPARATIVE PORTFOLIO ANALYSIS: How does this deal compare to fund's historical patterns and portfolio companies? What can we learn from similar investments?

4. RISK-ADJUSTED RETURN PROJECTIONS: Based on specialist analysis, what are the probabilistic return scenarios (bull, base, bear) with confidence levels?

5. SCENARIO ANALYSIS: What are the 3 most likely scenarios for this investment and their probability-weighted outcomes?

Provide clear, actionable intelligence that transforms data into decision-ready insights.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedAnalysisText = data.choices[0].message.content;

    // Parse the enhanced analysis into structured sections
    const sections = parseEnhancedAnalysis(enhancedAnalysisText);

    return {
      strategicInsights: sections.strategicInsights,
      soWhatAnalysis: sections.soWhatAnalysis,
      comparativeAnalysis: sections.comparativeAnalysis,
      riskAdjustedReturns: sections.riskAdjustedReturns,
      scenarioAnalysis: sections.scenarioAnalysis,
      confidenceScore: calculateConfidenceScore(specialistResults),
      enhancementLevel: 'strategic_intelligence',
      generatedAt: new Date().toISOString(),
      dataSourcesCount: Object.keys(specialistResults).filter(key => specialistResults[key as keyof typeof specialistResults]).length
    };

  } catch (error) {
    console.error('❌ Enhanced intelligence generation failed:', error);
    
    // Fallback to structured analysis without AI
    return generateFallbackEnhancedAnalysis(dealData, specialistResults, fundMemoryContext);
  }
}

function parseEnhancedAnalysis(analysisText: string): any {
  const sections = {
    strategicInsights: '',
    soWhatAnalysis: '',
    comparativeAnalysis: '',
    riskAdjustedReturns: '',
    scenarioAnalysis: ''
  };

  try {
    // Simple parsing logic to extract sections
    const lines = analysisText.split('\n');
    let currentSection = '';
    let content = '';

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('strategic insights') || lowerLine.includes('1.')) {
        if (currentSection && content) sections[currentSection as keyof typeof sections] = content.trim();
        currentSection = 'strategicInsights';
        content = '';
      } else if (lowerLine.includes('so what') || lowerLine.includes('2.')) {
        if (currentSection && content) sections[currentSection as keyof typeof sections] = content.trim();
        currentSection = 'soWhatAnalysis';
        content = '';
      } else if (lowerLine.includes('comparative') || lowerLine.includes('portfolio') || lowerLine.includes('3.')) {
        if (currentSection && content) sections[currentSection as keyof typeof sections] = content.trim();
        currentSection = 'comparativeAnalysis';
        content = '';
      } else if (lowerLine.includes('risk-adjusted') || lowerLine.includes('return') || lowerLine.includes('4.')) {
        if (currentSection && content) sections[currentSection as keyof typeof sections] = content.trim();
        currentSection = 'riskAdjustedReturns';
        content = '';
      } else if (lowerLine.includes('scenario') || lowerLine.includes('5.')) {
        if (currentSection && content) sections[currentSection as keyof typeof sections] = content.trim();
        currentSection = 'scenarioAnalysis';
        content = '';
      } else if (currentSection && line.trim()) {
        content += line + '\n';
      }
    }

    // Add the last section
    if (currentSection && content) {
      sections[currentSection as keyof typeof sections] = content.trim();
    }

    return sections;
  } catch (error) {
    console.warn('⚠️ Failed to parse enhanced analysis, using full text');
    return {
      strategicInsights: analysisText,
      soWhatAnalysis: '',
      comparativeAnalysis: '',
      riskAdjustedReturns: '',
      scenarioAnalysis: ''
    };
  }
}

function calculateConfidenceScore(specialistResults: any): number {
  const availableEngines = Object.keys(specialistResults).filter(key => specialistResults[key as keyof typeof specialistResults]);
  const baseScore = Math.min(availableEngines.length * 10, 70); // Up to 70 from data availability
  
  // Add bonus for critical engines
  let bonus = 0;
  if (specialistResults.financial) bonus += 10;
  if (specialistResults.marketIntelligence) bonus += 10;
  if (specialistResults.management) bonus += 5;
  if (specialistResults.riskMitigation) bonus += 5;
  
  return Math.min(baseScore + bonus, 95); // Cap at 95%
}

function generateFallbackEnhancedAnalysis(dealData: any, specialistResults: any, fundMemoryContext: any): any {
  console.log('🔄 Generating fallback enhanced analysis...');
  
  return {
    strategicInsights: `Based on available data for ${dealData?.company_name}, key strategic considerations include market positioning in ${dealData?.industry}, financial structure with ${dealData?.deal_size ? '$' + (dealData.deal_size / 1000000).toFixed(1) + 'M' : 'undisclosed'} deal size, and operational scalability potential.`,
    soWhatAnalysis: `The critical implications focus on alignment with fund investment thesis, risk-return profile assessment, and market timing considerations. Enhanced analysis pending specialist engine completion.`,
    comparativeAnalysis: `Portfolio comparison analysis requires additional fund memory data. Initial assessment suggests evaluation against similar ${dealData?.industry} investments within the fund's portfolio.`,
    riskAdjustedReturns: `Return projections pending comprehensive financial analysis. Risk-adjusted modeling requires completion of specialist engine analysis for accurate scenario planning.`,
    scenarioAnalysis: `Scenario planning analysis pending comprehensive risk assessment and market intelligence. Multiple outcome scenarios will be evaluated upon specialist engine completion.`,
    confidenceScore: 60,
    enhancementLevel: 'basic_fallback',
    generatedAt: new Date().toISOString(),
    dataSourcesCount: Object.keys(specialistResults).filter(key => specialistResults[key as keyof typeof specialistResults]).length
  };
}