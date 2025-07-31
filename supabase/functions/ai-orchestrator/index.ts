import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = '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';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    console.log('AI Orchestrator called with action:', action);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'score_deal':
        systemPrompt = `You are an expert AI investment analyst for venture capital and private equity. 
        Analyze deals against 5 key dimensions: Investment Thesis Alignment, Founder & Leadership Team Strength, 
        Market Attractiveness, Product Advantage & IP, Financial Feasibility, and Traction.
        
        Score each dimension 0-100 and provide detailed reasoning. Be objective and thorough.
        Return JSON with this structure:
        {
          "overall_score": number,
          "dimensions": {
            "thesis_alignment": {"score": number, "notes": "string"},
            "leadership": {"score": number, "notes": "string"},
            "market": {"score": number, "notes": "string"},
            "product": {"score": number, "notes": "string"},
            "financial": {"score": number, "notes": "string"},
            "traction": {"score": number, "notes": "string"}
          }
        }`;
        userPrompt = `Analyze this deal:
        Company: ${data.company_name}
        Industry: ${data.industry}
        Description: ${data.description}
        Deal Size: ${data.deal_size}
        Investment Strategy Context: ${JSON.stringify(data.strategy)}`;
        break;

      case 'generate_memo':
        systemPrompt = `You are an expert investment committee memo writer. Create professional, 
        comprehensive investment memorandums that clearly present the investment opportunity, 
        risks, and recommendation. Use a structured format suitable for IC review.`;
        userPrompt = `Generate an investment memo for:
        ${JSON.stringify(data)}`;
        break;

      case 'market_research':
        systemPrompt = `You are a market research expert. Provide detailed market analysis 
        including size, growth trends, competitive landscape, and key market dynamics.`;
        userPrompt = `Research the market for: ${data.query}`;
        break;

      default:
        throw new Error('Invalid action specified');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const result = await response.json();
    const aiResponse = result.choices[0].message.content;

    console.log('AI Orchestrator response generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      response: aiResponse,
      action: action 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI Orchestrator:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});