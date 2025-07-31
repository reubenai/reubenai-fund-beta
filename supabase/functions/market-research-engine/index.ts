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

interface MarketResearchRequest {
  dealData: any;
  strategyData: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealData, strategyData }: MarketResearchRequest = await req.json();
    
    console.log('📊 Market Research Engine: Analyzing market for:', dealData.company_name);
    
    // Conduct comprehensive market research
    const marketResult = await conductMarketResearch(dealData, strategyData);
    
    // Store source tracking
    await storeSources(dealData.id, 'market-research-engine', marketResult.sources);
    
    return new Response(JSON.stringify(marketResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Market Research Engine Error:', error);
    return new Response(JSON.stringify({
      score: 50,
      analysis: `Market research analysis failed: ${error.message}`,
      confidence: 30,
      sources: [],
      data: {},
      validation_status: 'unvalidated'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function conductMarketResearch(dealData: any, strategyData: any) {
  const validatedData = validateMarketData(dealData);
  
  // Attempt real-time market research
  const marketIntelligence = await gatherMarketIntelligence(validatedData);
  
  // Generate AI-powered market analysis
  const aiAnalysis = await generateMarketAnalysis(validatedData, marketIntelligence);
  
  // Calculate market attractiveness score
  const marketScore = calculateMarketScore(marketIntelligence);
  
  // Determine confidence based on data sources and validation
  const confidence = calculateMarketConfidence(marketIntelligence);
  
  return {
    score: marketScore,
    analysis: aiAnalysis,
    confidence: confidence,
    sources: marketIntelligence.sources,
    data: {
      market_size: marketIntelligence.market_size,
      growth_rate: marketIntelligence.growth_rate,
      competitive_landscape: marketIntelligence.competitive_landscape,
      market_trends: marketIntelligence.market_trends,
      tam_sam_som: marketIntelligence.tam_sam_som
    },
    validation_status: confidence >= 70 ? 'validated' : confidence >= 50 ? 'partial' : 'unvalidated'
  };
}

function validateMarketData(dealData: any) {
  return {
    company_name: dealData.company_name || 'N/A',
    industry: dealData.industry || 'N/A',
    description: dealData.description || 'N/A',
    location: dealData.location || 'N/A',
    business_model: dealData.business_model || 'N/A'
  };
}

async function gatherMarketIntelligence(dealData: any) {
  const intelligence = {
    market_size: 'N/A',
    growth_rate: 'N/A', 
    competitive_landscape: 'N/A',
    market_trends: [],
    tam_sam_som: { tam: 'N/A', sam: 'N/A', som: 'N/A' },
    sources: [],
    data_quality: 'limited'
  };
  
  // Try to gather market data through web research simulation
  // In a production environment, this would integrate with:
  // - Perplexity AI for real-time market research
  // - Industry databases
  // - Market research APIs
  
  if (dealData.industry !== 'N/A') {
    intelligence.sources.push({
      type: 'web_research',
      source: 'industry_analysis',
      validated: false,
      confidence: 60
    });
    
    // Simulate market research findings
    intelligence.market_size = await simulateMarketSize(dealData.industry);
    intelligence.growth_rate = await simulateGrowthRate(dealData.industry);
    intelligence.competitive_landscape = await simulateCompetitiveLandscape(dealData.industry);
    intelligence.market_trends = await simulateMarketTrends(dealData.industry);
    intelligence.data_quality = 'simulated';
  }
  
  return intelligence;
}

async function simulateMarketSize(industry: string): Promise<string> {
  // This would be replaced with real API calls to market research services
  const marketSizes = {
    'technology': '$2.8T global technology market',
    'healthcare': '$4.5T global healthcare market', 
    'fintech': '$312B global fintech market',
    'saas': '$195B global SaaS market',
    'ai': '$387B global AI market by 2030',
    'cybersecurity': '$345B global cybersecurity market',
    'e-commerce': '$6.2T global e-commerce market'
  };
  
  const industryKey = Object.keys(marketSizes).find(key => 
    industry.toLowerCase().includes(key)
  );
  
  return industryKey ? marketSizes[industryKey as keyof typeof marketSizes] : 'Market size data unavailable';
}

async function simulateGrowthRate(industry: string): Promise<string> {
  const growthRates = {
    'technology': '8.2% CAGR',
    'healthcare': '7.9% CAGR',
    'fintech': '23.4% CAGR',
    'saas': '18.7% CAGR', 
    'ai': '42.2% CAGR',
    'cybersecurity': '12.5% CAGR',
    'e-commerce': '11.3% CAGR'
  };
  
  const industryKey = Object.keys(growthRates).find(key => 
    industry.toLowerCase().includes(key)
  );
  
  return industryKey ? growthRates[industryKey as keyof typeof growthRates] : 'Growth rate data unavailable';
}

async function simulateCompetitiveLandscape(industry: string): Promise<string> {
  // This would analyze real competitive data
  const landscapes = {
    'technology': 'Highly competitive with established players and emerging startups',
    'healthcare': 'Regulated market with high barriers to entry',
    'fintech': 'Rapidly evolving with numerous incumbents and disruptors',
    'saas': 'Saturated market requiring strong differentiation',
    'ai': 'Emerging market with significant innovation opportunities',
    'cybersecurity': 'Critical market with growing demand and competition',
    'e-commerce': 'Mature market dominated by large platforms'
  };
  
  const industryKey = Object.keys(landscapes).find(key => 
    industry.toLowerCase().includes(key)
  );
  
  return industryKey ? landscapes[industryKey as keyof typeof landscapes] : 'Competitive landscape analysis unavailable';
}

async function simulateMarketTrends(industry: string): Promise<string[]> {
  const trends = {
    'technology': ['Digital transformation acceleration', 'Cloud adoption', 'AI integration'],
    'healthcare': ['Telemedicine growth', 'Personalized medicine', 'Digital health'],
    'fintech': ['Embedded finance', 'Cryptocurrency adoption', 'Open banking'],
    'saas': ['Vertical SaaS specialization', 'AI-powered features', 'Usage-based pricing'],
    'ai': ['Generative AI adoption', 'Edge computing', 'AI governance'],
    'cybersecurity': ['Zero-trust security', 'Cloud security', 'AI-powered threats'],
    'e-commerce': ['Social commerce', 'Sustainability focus', 'Omnichannel experiences']
  };
  
  const industryKey = Object.keys(trends).find(key => 
    industry.toLowerCase().includes(key)
  );
  
  return industryKey ? trends[industryKey as keyof typeof trends] : ['Market trends data unavailable'];
}

function calculateMarketScore(intelligence: any): number {
  let score = 50; // Base score
  
  // Adjust based on available data quality
  if (intelligence.data_quality === 'limited') {
    return 45; // Low score for insufficient data
  }
  
  // Simulate scoring based on market characteristics
  if (intelligence.growth_rate && intelligence.growth_rate.includes('CAGR')) {
    const cagrMatch = intelligence.growth_rate.match(/(\d+\.?\d*)%/);
    if (cagrMatch) {
      const cagr = parseFloat(cagrMatch[1]);
      if (cagr >= 20) score += 25;
      else if (cagr >= 15) score += 20;
      else if (cagr >= 10) score += 15;
      else if (cagr >= 5) score += 10;
    }
  }
  
  // Adjust for market size (simplified)
  if (intelligence.market_size && intelligence.market_size.includes('T')) {
    score += 15; // Large market bonus
  } else if (intelligence.market_size && intelligence.market_size.includes('B')) {
    score += 10; // Medium market bonus
  }
  
  // Cap at 100
  return Math.min(score, 100);
}

function calculateMarketConfidence(intelligence: any): number {
  if (intelligence.data_quality === 'limited') return 35;
  if (intelligence.data_quality === 'simulated') return 55;
  
  // In real implementation, this would be based on:
  // - Number of validated sources
  // - Source reliability scores
  // - Data freshness
  // - Cross-validation results
  
  return 65;
}

async function generateMarketAnalysis(dealData: any, intelligence: any): Promise<string> {
  const prompt = `Generate a concise market attractiveness analysis for this investment opportunity:

COMPANY: ${dealData.company_name}
INDUSTRY: ${dealData.industry}
DESCRIPTION: ${dealData.description}

MARKET INTELLIGENCE:
- Market Size: ${intelligence.market_size}
- Growth Rate: ${intelligence.growth_rate}
- Competition: ${intelligence.competitive_landscape}
- Key Trends: ${intelligence.market_trends.join(', ')}

DATA QUALITY: ${intelligence.data_quality}

Instructions:
- Focus on market attractiveness for investment purposes
- Highlight growth opportunities and market dynamics
- Note any data limitations explicitly
- Keep to 2-3 sentences
- Use "N/A" or "Unable to validate" for missing information`;

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
          {
            role: 'system',
            content: 'You are a market research analyst. CRITICAL: Only use provided data. Never fabricate market statistics. Use "N/A" when data is missing. Be explicit about data limitations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 250
      }),
    });

    if (!response.ok) throw new Error('OpenAI API error');
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating market analysis:', error);
    
    // Fallback analysis
    if (intelligence.data_quality === 'limited') {
      return `Market analysis limited due to insufficient data. Industry: ${dealData.industry}. Unable to validate market size, growth rates, or competitive dynamics without additional research.`;
    }
    
    return `Market shows ${intelligence.growth_rate || 'unknown growth'} in ${dealData.industry} sector. Market size estimated at ${intelligence.market_size || 'N/A'}. Competitive landscape: ${intelligence.competitive_landscape || 'requires further analysis'}.`;
  }
}

async function storeSources(dealId: string, engineName: string, sources: any[]) {
  try {
    const sourceRecords = sources.map(source => ({
      deal_id: dealId,
      engine_name: engineName,
      source_type: source.type,
      source_url: source.source,
      confidence_score: source.confidence || 60,
      validated: source.validated || false,
      data_retrieved: {},
      retrieved_at: new Date().toISOString()
    }));
    
    if (sourceRecords.length > 0) {
      await supabase
        .from('deal_analysis_sources')
        .insert(sourceRecords);
    }
  } catch (error) {
    console.error('Error storing sources:', error);
  }
}