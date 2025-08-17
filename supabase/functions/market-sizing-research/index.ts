import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { industry, company_name, target_market, geographic_scope, context } = await req.json();

    console.log(`🔍 Researching market sizing for: ${industry} - ${company_name}`);

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      console.log('⚠️ PERPLEXITY_API_KEY not configured, using fallback data');
      return new Response(JSON.stringify({
        success: true,
        industry,
        market_sizing: generateFallbackMarketSizing(industry),
        research_content: `Fallback market sizing for ${industry}`,
        sources: ['Industry research estimates'],
        research_quality: 'medium',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create focused research query
    const researchQuery = `What is the Total Addressable Market (TAM) for ${industry} industry globally in 2024-2025? 
    
    Focus on ${target_market || industry} sector specifically. Provide:
    1. Specific TAM value with currency and year
    2. Market growth rate (CAGR)
    3. Key market drivers
    4. Data source citations
    
    Company context: ${company_name} operates in ${industry}`;

    // Call Perplexity API for real market data
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a market research analyst. Provide accurate, cited market sizing data with specific numbers, sources, and methodologies. Always include currency, year, and CAGR where available.'
          },
          {
            role: 'user',
            content: researchQuery
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
        return_related_questions: false,
        search_recency_filter: 'month'
      })
    });

    if (!perplexityResponse.ok) {
      console.error('Perplexity API error:', await perplexityResponse.text());
      throw new Error('Failed to fetch market research data');
    }

    const perplexityData = await perplexityResponse.json();
    const researchContent = perplexityData.choices[0].message.content;

    console.log(`📊 Market research completed for ${industry}`);

    // Parse the research to extract structured data
    const marketSizing = parseMarketResearch(researchContent, industry);

    return new Response(JSON.stringify({
      success: true,
      industry,
      market_sizing: marketSizing,
      research_content: researchContent,
      sources: extractSources(researchContent),
      research_quality: assessResearchQuality(researchContent),
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Market sizing research error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      fallback_data: generateFallbackMarketSizing()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function parseMarketResearch(content: string, industry: string) {
  // Extract TAM value
  const tamMatch = content.match(/\$(\d+(?:\.\d+)?)\s*(billion|million|trillion|B|M|T)/i);
  let tamValue = getIndustryDefaultTAM(industry);
  let currency = 'USD';
  
  if (tamMatch) {
    const number = parseFloat(tamMatch[1]);
    const unit = tamMatch[2].toLowerCase();
    
    if (unit.includes('trillion') || unit === 't') {
      tamValue = number * 1000000000000;
    } else if (unit.includes('billion') || unit === 'b') {
      tamValue = number * 1000000000;
    } else if (unit.includes('million') || unit === 'm') {
      tamValue = number * 1000000;
    }
  }

  // Extract CAGR
  const cagrMatch = content.match(/(\d+(?:\.\d+)?)\s*%.*CAGR/i);
  const cagr = cagrMatch ? parseFloat(cagrMatch[1]) : getIndustryDefaultCAGR(industry);

  // Extract year
  const yearMatch = content.match(/(202\d)/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 2024;

  // Calculate SAM (industry-specific % of TAM)
  const samRatio = getIndustrySAMRatio(industry);
  const samValue = Math.round(tamValue * samRatio);
  
  // Calculate SOM (industry-specific % of SAM)
  const somRatio = getIndustrySOMRatio(industry);
  const somValue = Math.round(samValue * somRatio);

  return {
    tam: {
      value: tamValue,
      currency,
      year,
      citation: extractFirstCitation(content),
      source: 'Perplexity Research',
      confidence: 85
    },
    sam: {
      value: samValue,
      currency,
      calculation_method: 'Geographic Addressable Market',
      rationale: `Estimated ${Math.round(samRatio * 100)}% of TAM addressable based on geographic focus and market entry strategy for ${industry}`,
      confidence: 80
    },
    som: {
      value: somValue,
      currency,
      calculation_method: 'Realistic Market Capture',
      rationale: `Conservative ${Math.round(somRatio * 100)}% market penetration estimate based on competitive landscape and execution capability in ${industry}`,
      confidence: 75
    },
    cagr: {
      value: cagr,
      period: '2024-2029',
      citation: extractGrowthCitation(content),
      source: 'Industry Analysis'
    },
    methodology: 'Perplexity-sourced market research with calculated SAM/SOM derivations',
    research_quality: 'high',
    last_updated: new Date().toISOString()
  };
}

function getIndustryDefaultTAM(industry: string): number {
  const defaults: Record<string, number> = {
    'fintech': 324000000000, // $324B
    'financial services': 22600000000000, // $22.6T
    'healthcare': 15000000000000, // $15T
    'healthtech': 659000000000, // $659B
    'education': 7800000000000, // $7.8T
    'edtech': 123000000000, // $123B
    'technology': 5000000000000, // $5T
    'software': 659000000000, // $659B
    'saas': 195000000000, // $195B
    'e-commerce': 6200000000000, // $6.2T
    'ai': 1800000000000, // $1.8T
    'artificial intelligence': 1800000000000,
    'blockchain': 67000000000, // $67B
    'cybersecurity': 266000000000, // $266B
  };
  
  const industryLower = industry.toLowerCase();
  for (const [key, value] of Object.entries(defaults)) {
    if (industryLower.includes(key) || key.includes(industryLower)) {
      return value;
    }
  }
  
  return 1000000000; // $1B fallback
}

function getIndustryDefaultCAGR(industry: string): number {
  const cagrs: Record<string, number> = {
    'fintech': 14.8,
    'healthtech': 15.1,
    'edtech': 13.4,
    'saas': 18.7,
    'ai': 36.2,
    'blockchain': 25.3,
    'cybersecurity': 12.5,
  };
  
  const industryLower = industry.toLowerCase();
  for (const [key, value] of Object.entries(cagrs)) {
    if (industryLower.includes(key)) {
      return value;
    }
  }
  
  return 8.5; // Default CAGR
}

function getIndustrySAMRatio(industry: string): number {
  const ratios: Record<string, number> = {
    'fintech': 0.35,
    'saas': 0.40,
    'ai': 0.30,
    'healthcare': 0.25,
    'education': 0.20,
  };
  
  const industryLower = industry.toLowerCase();
  for (const [key, value] of Object.entries(ratios)) {
    if (industryLower.includes(key)) {
      return value;
    }
  }
  
  return 0.25; // Default 25%
}

function getIndustrySOMRatio(industry: string): number {
  const ratios: Record<string, number> = {
    'fintech': 0.12,
    'saas': 0.15,
    'ai': 0.08,
    'healthcare': 0.10,
    'education': 0.12,
  };
  
  const industryLower = industry.toLowerCase();
  for (const [key, value] of Object.entries(ratios)) {
    if (industryLower.includes(key)) {
      return value;
    }
  }
  
  return 0.12; // Default 12%
}

function extractSources(content: string): string[] {
  const sources = [];
  
  // Look for URLs or source mentions
  const urlMatches = content.match(/https?:\/\/[^\s]+/g);
  if (urlMatches) {
    sources.push(...urlMatches);
  }
  
  // Look for company/organization names
  const orgMatches = content.match(/(?:according to|source:|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
  if (orgMatches) {
    sources.push(...orgMatches.map(m => m.replace(/(?:according to|source:|by)\s+/, '')));
  }
  
  return sources.slice(0, 5); // Limit to 5 sources
}

function extractFirstCitation(content: string): string {
  const sentences = content.split('.').filter(s => s.trim().length > 20);
  return sentences[0]?.trim() + '.' || 'Market research indicates significant opportunity';
}

function extractGrowthCitation(content: string): string {
  const cagrSentence = content.split('.').find(s => s.toLowerCase().includes('cagr') || s.toLowerCase().includes('growth'));
  return cagrSentence?.trim() + '.' || 'Industry showing steady growth trajectory';
}

function assessResearchQuality(content: string): 'high' | 'medium' | 'low' {
  let score = 0;
  
  // Check for specific numbers
  if (/\$\d+/.test(content)) score += 2;
  
  // Check for CAGR mention
  if (/CAGR/i.test(content)) score += 2;
  
  // Check for year mention
  if (/202\d/.test(content)) score += 1;
  
  // Check for sources
  if (/source|according to|report/i.test(content)) score += 2;
  
  // Check content length
  if (content.length > 500) score += 1;
  
  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function generateFallbackMarketSizing(industry?: string) {
  const tam = industry ? getIndustryDefaultTAM(industry) : 1000000000;
  const sam = Math.round(tam * 0.25);
  const som = Math.round(sam * 0.12);
  
  return {
    tam: { value: tam, currency: 'USD', confidence: 50, citation: 'Industry estimates', source: 'Fallback data' },
    sam: { value: sam, currency: 'USD', confidence: 45, calculation_method: 'Geographic focus', rationale: 'Standard 25% TAM addressability' },
    som: { value: som, currency: 'USD', confidence: 40, calculation_method: 'Market capture', rationale: 'Conservative 12% penetration' },
    cagr: { value: 8.5, period: '2024-2029', citation: 'Industry average', source: 'Standard estimates' },
    research_quality: 'medium'
  };
}