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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DealAnalysisRequest {
  dealId: string;
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
    const { dealId }: DealAnalysisRequest = await req.json();

    console.log('Generating enhanced analysis for deal:', dealId);

    // Fetch deal data
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      throw new Error(`Deal not found: ${dealError?.message}`);
    }

    // Fetch fund strategy for context
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

    // Call the new Reuben Orchestrator for comprehensive analysis
    const { data: orchestratorResult, error: orchestratorError } = await supabase.functions.invoke('reuben-orchestrator', {
      body: { dealId: deal.id }
    });
    
    if (orchestratorError) {
      console.error('Orchestrator error, falling back to basic analysis:', orchestratorError);
      const analysisResult = await generateEnhancedAnalysis(deal, fund?.investment_strategies?.[0]);
    } else {
      // Use orchestrator results
      const analysisResult = orchestratorResult.analysis;
    }

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

    return new Response(JSON.stringify(analysisResult), {
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

async function generateEnhancedAnalysis(deal: any, strategy?: any): Promise<AnalysisResult> {
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

  const prompt = `CRITICAL INSTRUCTIONS - ZERO TOLERANCE FOR FABRICATION:
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

  return JSON.parse(functionCall.arguments);
}