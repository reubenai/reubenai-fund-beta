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

interface MemoGenerationRequest {
  dealId: string;
  templateId?: string;
  fundId?: string;
}

const STANDARD_SECTIONS = [
  'Opportunity Overview',
  'Executive Summary', 
  'Company Overview',
  'Market Opportunity',
  'Product/Service',
  'Business Model',
  'Competitive Landscape',
  'Management Team',
  'Financial Analysis',
  'Investment Terms',
  'Risks & Mitigants',
  'Exit Strategy',
  'Investment Recommendation',
  'Appendices'
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealId, templateId, fundId }: MemoGenerationRequest = await req.json();

    console.log('🤖 AI Memo Generator: Starting memo generation for deal:', dealId);

    // Fetch deal data with analysis
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        *,
        deal_analyses (*)
      `)
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      throw new Error(`Deal not found: ${dealError?.message}`);
    }

    // Fetch fund and strategy data
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

    // Fetch memo template
    const { data: template } = await supabase
      .from('ic_memo_templates')
      .select('*')
      .eq('id', templateId || '')
      .single();

    // Use default template if none specified or found
    const sections = template?.sections || STANDARD_SECTIONS.map((title, index) => ({
      id: title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      title,
      order: index + 1,
      required: index < 13 // First 13 sections are required
    }));

    // Call Reuben Orchestrator for comprehensive analysis
    const { data: orchestratorResult } = await supabase.functions.invoke('reuben-orchestrator', {
      body: { dealId: deal.id }
    });

    // Generate memo content using OpenAI
    const memoContent = await generateMemoContent(deal, fund, sections, orchestratorResult);

    // Calculate overall score and RAG status
    const overallScore = deal.overall_score || 0;
    let ragStatus = 'needs_development';
    const strategy = fund?.investment_strategies?.[0];
    
    if (strategy) {
      if (overallScore >= (strategy.exciting_threshold || 85)) {
        ragStatus = 'exciting';
      } else if (overallScore >= (strategy.promising_threshold || 70)) {
        ragStatus = 'promising';
      }
    }

    // Store memo in database
    const { data: memo, error: memoError } = await supabase
      .from('ic_memos')
      .insert({
        deal_id: dealId,
        fund_id: deal.fund_id,
        template_id: templateId,
        title: `IC Memo: ${deal.company_name}`,
        memo_content: memoContent,
        executive_summary: memoContent.sections?.find(s => s.id === 'executive_summary')?.content || '',
        investment_recommendation: memoContent.sections?.find(s => s.id === 'investment_recommendation')?.content || '',
        rag_status: ragStatus,
        overall_score: overallScore,
        status: 'draft',
        created_by: '00000000-0000-0000-0000-000000000000' // System user
      })
      .select()
      .single();

    if (memoError) {
      throw new Error(`Failed to save memo: ${memoError.message}`);
    }

    console.log('✅ AI Memo Generator: Memo generated successfully for:', deal.company_name);

    return new Response(JSON.stringify({
      success: true,
      memo,
      memoContent
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

async function generateMemoContent(deal: any, fund: any, sections: any[], analysisData?: any) {
  const strategy = fund?.investment_strategies?.[0];
  const analysis = deal.deal_analyses?.[0];
  
  const prompt = `Generate a comprehensive Investment Committee memo for the following deal:

COMPANY: ${deal.company_name}
INDUSTRY: ${deal.industry || 'N/A'}
DESCRIPTION: ${deal.description || 'N/A'}
DEAL SIZE: ${deal.deal_size ? `$${deal.deal_size.toLocaleString()}` : 'N/A'}
VALUATION: ${deal.valuation ? `$${deal.valuation.toLocaleString()}` : 'N/A'}
LOCATION: ${deal.location || 'N/A'}
FOUNDER: ${deal.founder || 'N/A'}
WEBSITE: ${deal.website || 'N/A'}
RAG STATUS: ${deal.rag_status?.toUpperCase() || 'NEEDS DEVELOPMENT'}

FUND STRATEGY CONTEXT:
${strategy ? `
Industries: ${strategy.industries?.join(', ') || 'N/A'}
Geography: ${strategy.geography?.join(', ') || 'N/A'}
Min Investment: ${strategy.min_investment_amount ? `$${strategy.min_investment_amount.toLocaleString()}` : 'N/A'}
Max Investment: ${strategy.max_investment_amount ? `$${strategy.max_investment_amount.toLocaleString()}` : 'N/A'}
` : 'No strategy data available'}

AI ANALYSIS SCORES:
${analysis ? `
Leadership: ${analysis.leadership_score}/100
Market: ${analysis.market_score}/100
Product: ${analysis.product_score}/100
Financial: ${analysis.financial_score}/100
Thesis Alignment: ${analysis.thesis_alignment_score}/100
Overall Score: ${deal.overall_score}/100
` : 'No analysis data available'}

ORCHESTRATOR INSIGHTS:
${analysisData ? JSON.stringify(analysisData, null, 2) : 'No orchestrator data available'}

Please generate professional content for each of the following memo sections. Be comprehensive but concise, focusing on investment decision-making criteria:

SECTIONS TO GENERATE:
${sections.map(s => `- ${s.title}`).join('\n')}

Generate structured, professional content suitable for an Investment Committee review. Include specific recommendations and risk assessments based on the RAG status and analysis scores.`;

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
          content: 'You are an expert investment analyst creating professional Investment Committee memos. Generate comprehensive, actionable content for each section.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      functions: [{
        name: 'generate_memo_sections',
        description: 'Generate content for IC memo sections',
        parameters: {
          type: 'object',
          properties: {
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string' }
                }
              }
            },
            executive_summary: { type: 'string' },
            investment_recommendation: { type: 'string' },
            key_metrics: {
              type: 'object',
              properties: {
                recommended_investment: { type: 'string' },
                expected_return: { type: 'string' },
                risk_level: { type: 'string' },
                time_horizon: { type: 'string' }
              }
            }
          },
          required: ['sections', 'executive_summary', 'investment_recommendation']
        }
      }],
      function_call: { name: 'generate_memo_sections' }
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