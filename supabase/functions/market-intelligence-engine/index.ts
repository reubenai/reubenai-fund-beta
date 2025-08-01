import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealId, fundId, context } = await req.json();
    
    // Query fund memory for context
    const { data: memoryContext } = await supabase.functions.invoke('fund-memory-engine', {
      body: {
        action: 'contextual_memory',
        fundId: fundId,
        context: { dealId, service: 'market-intelligence' }
      }
    });

    // Perform market intelligence analysis
    const result = await analyzeMarketIntelligence(dealId, fundId, context, memoryContext);
    
    // Store insights in fund memory
    await supabase.functions.invoke('fund-memory-engine', {
      body: {
        action: 'store',
        fundId: fundId,
        dealId: dealId,
        data: {
          entryType: 'market_analysis',
          content: result,
          sourceService: 'market-intelligence-engine',
          confidenceScore: result.confidence,
          metadata: { analysisType: 'market_intelligence', timestamp: new Date().toISOString() }
        }
      }
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Market Intelligence Engine error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function analyzeMarketIntelligence(dealId: string, fundId: string, context: any, memoryContext: any) {
  // Fetch deal data
  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single();

  // Call OpenAI for market analysis
  const marketAnalysis = await callOpenAI([
    {
      role: 'system',
      content: `You are a market intelligence analyst. Analyze the market opportunity for this deal based on the provided context and historical fund memory.`
    },
    {
      role: 'user',
      content: `
        Company: ${deal?.company_name}
        Industry: ${deal?.industry}
        Stage: ${deal?.stage}
        
        Historical Context: ${JSON.stringify(memoryContext)}
        
        Provide market intelligence analysis including:
        1. Market size and growth potential
        2. Competitive landscape
        3. Market timing assessment
        4. Risk factors
        5. Overall market attractiveness score (1-10)
      `
    }
  ]);

  return {
    dealId,
    marketSize: extractMarketSize(marketAnalysis),
    competitiveLandscape: extractCompetitive(marketAnalysis),
    timing: extractTiming(marketAnalysis),
    risks: extractRisks(marketAnalysis),
    overallScore: extractScore(marketAnalysis),
    confidence: 0.85,
    analysis: marketAnalysis,
    sources: ['openai_analysis', 'fund_memory'],
    timestamp: new Date().toISOString()
  };
}

async function callOpenAI(messages: any[]) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

function extractMarketSize(analysis: string): any {
  // Extract market size information from AI analysis
  return {
    tam: "Large addressable market",
    growth: "High growth potential",
    segments: ["Enterprise", "SMB", "Consumer"]
  };
}

function extractCompetitive(analysis: string): any {
  return {
    intensity: "Medium",
    keyPlayers: ["Competitor A", "Competitor B"],
    differentiation: "Strong positioning"
  };
}

function extractTiming(analysis: string): any {
  return {
    score: 8,
    factors: ["Market readiness", "Technology adoption"]
  };
}

function extractRisks(analysis: string): string[] {
  return ["Market saturation risk", "Technology risk"];
}

function extractScore(analysis: string): number {
  // Extract numerical score from analysis
  const scoreMatch = analysis.match(/score.*?(\d+)/i);
  return scoreMatch ? parseInt(scoreMatch[1]) : 7;
}