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
    const { industry, company_name, target_market, geographic_scope, context, deal_location, fund_geographies } = await req.json();

    console.log(`🔍 Researching market sizing for: ${industry} - ${company_name} in ${deal_location || 'Global'}`);

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      console.log('⚠️ PERPLEXITY_API_KEY not configured, using fallback data');
      return new Response(JSON.stringify({
        success: true,
        industry,
        market_sizing: generateFallbackMarketSizing(industry, deal_location, fund_geographies),
        research_content: `Fallback market sizing for ${industry}`,
        sources: ['Industry research estimates'],
        research_quality: 'medium',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Enhanced research queries for global, regional, and local analysis
    const globalQuery = `What is the Total Addressable Market (TAM) for ${industry} industry globally in 2024-2025? 
    
    Focus on ${target_market || industry} sector specifically. Provide:
    1. Specific global TAM value with currency and year
    2. Global market growth rate (CAGR)
    3. Key global market drivers
    4. Data source citations
    
    Company context: ${company_name} operates in ${industry}`;

    const regionalQuery = deal_location ? `What is the regional market opportunity for ${industry} in ${deal_location} region/country in 2024-2025?
    
    Provide:
    1. Regional market size for ${industry} in ${deal_location}
    2. Regional growth rate vs global market
    3. Regional market drivers and dynamics
    4. Market maturity in this region
    
    Context: ${company_name} operates in ${industry} and is based in ${deal_location}` : '';

    const localQuery = deal_location ? `What are the local market dynamics for ${industry} companies in ${deal_location}?
    
    Focus on:
    1. Local market penetration opportunities
    2. Country-specific growth factors vs global trends
    3. Regulatory environment impact
    4. Local competitive landscape
    
    Context: Assessing ${company_name} in ${industry} sector located in ${deal_location}` : '';

    // Call Perplexity API for global market data
    const globalResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
            content: globalQuery
          }
        ],
        temperature: 0.2,
        max_tokens: 1200,
        return_related_questions: false,
        search_recency_filter: 'month'
      })
    });

    if (!globalResponse.ok) {
      console.error('Perplexity API error:', await globalResponse.text());
      throw new Error('Failed to fetch global market research data');
    }

    const globalData = await globalResponse.json();
    const globalContent = globalData.choices[0].message.content;

    // Regional and local analysis (only if location is provided)
    let regionalContent = '';
    let localContent = '';
    
    if (deal_location && regionalQuery) {
      try {
        const regionalResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
                content: 'You are a regional market analyst. Focus on regional market dynamics, growth rates, and opportunities compared to global trends.'
              },
              {
                role: 'user',
                content: regionalQuery
              }
            ],
            temperature: 0.2,
            max_tokens: 800,
            return_related_questions: false,
            search_recency_filter: 'month'
          })
        });

        if (regionalResponse.ok) {
          const regionalData = await regionalResponse.json();
          regionalContent = regionalData.choices[0].message.content;
        }
      } catch (error) {
        console.log('Regional analysis failed, using fallback');
      }

      try {
        const localResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
                content: 'You are a local market analyst. Focus on country-specific market opportunities, local growth factors, and market penetration strategies.'
              },
              {
                role: 'user',
                content: localQuery
              }
            ],
            temperature: 0.2,
            max_tokens: 600,
            return_related_questions: false,
            search_recency_filter: 'month'
          })
        });

        if (localResponse.ok) {
          const localData = await localResponse.json();
          localContent = localData.choices[0].message.content;
        }
      } catch (error) {
        console.log('Local analysis failed, using fallback');
      }
    }

    console.log(`📊 Market research completed for ${industry} (Global + ${deal_location || 'No location'})`);

    // Parse the research to extract structured data with regional/local insights
    const marketSizing = parseEnhancedMarketResearch(globalContent, regionalContent, localContent, industry, deal_location, fund_geographies);

    return new Response(JSON.stringify({
      success: true,
      industry,
      market_sizing: marketSizing,
      research_content: globalContent,
      regional_content: regionalContent,
      local_content: localContent,
      sources: extractSources(globalContent + ' ' + regionalContent + ' ' + localContent),
      research_quality: assessResearchQuality(globalContent + ' ' + regionalContent),
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

function parseEnhancedMarketResearch(globalContent: string, regionalContent: string, localContent: string, industry: string, location?: string, fundGeographies?: string[]) {
  const globalData = parseMarketResearch(globalContent, industry);
  
  // Regional analysis
  let regionalAnalysis = null;
  if (regionalContent && location) {
    const regionalGrowth = extractRegionalGrowthRate(regionalContent);
    const globalGrowth = globalData.cagr.value;
    const growthComparison = regionalGrowth > globalGrowth ? 'faster' : 
                           regionalGrowth < globalGrowth ? 'slower' : 'in-line';
    
    regionalAnalysis = {
      region_name: location,
      market_size: extractRegionalMarketSize(regionalContent, industry),
      growth_rate: regionalGrowth,
      vs_global_comparison: `The ${location} region is growing ${growthComparison} with global market trends`,
      regional_drivers: extractRegionalDrivers(regionalContent),
      market_maturity: extractMarketMaturity(regionalContent),
      fund_alignment: assessFundGeographyAlignment(location, fundGeographies)
    };
  }

  // Local analysis  
  let localAnalysis = null;
  if (localContent && location) {
    localAnalysis = {
      country_name: location,
      market_size: extractLocalMarketSize(localContent, industry),
      growth_rate: extractLocalGrowthRate(localContent),
      local_opportunities: extractLocalOpportunities(localContent),
      regulatory_environment: extractRegulatoryFactors(localContent),
      competitive_dynamics: extractLocalCompetition(localContent)
    };
  }

  return {
    ...globalData,
    regional_analysis: regionalAnalysis,
    local_analysis: localAnalysis,
    enhanced_insights: generateEnhancedInsights(globalData, regionalAnalysis, localAnalysis)
  };
}

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

// Regional/Local analysis helper functions
function extractRegionalGrowthRate(content: string): number {
  const cagrMatch = content.match(/(\d+(?:\.\d+)?)\s*%.*(?:CAGR|growth|growing)/i);
  return cagrMatch ? parseFloat(cagrMatch[1]) : 8.5;
}

function extractRegionalMarketSize(content: string, industry: string): string {
  const sizeMatch = content.match(/\$(\d+(?:\.\d+)?)\s*(billion|million|trillion|B|M|T)/i);
  if (sizeMatch) {
    return `$${sizeMatch[1]}${sizeMatch[2].charAt(0).toUpperCase()}`;
  }
  const defaultTam = getIndustryDefaultTAM(industry);
  const regionalSize = Math.round(defaultTam * 0.15 / 1000000000);
  return `$${regionalSize}B`;
}

function extractLocalMarketSize(content: string, industry: string): string {
  const sizeMatch = content.match(/\$(\d+(?:\.\d+)?)\s*(billion|million|trillion|B|M|T)/i);
  if (sizeMatch) {
    const number = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toLowerCase();
    const localSize = unit.includes('billion') ? Math.round(number * 0.3) : 
                     unit.includes('million') ? Math.round(number * 0.1) : number;
    return `$${localSize}${sizeMatch[2].charAt(0).toUpperCase()}`;
  }
  const defaultTam = getIndustryDefaultTAM(industry);
  const localSize = Math.round(defaultTam * 0.05 / 1000000000);
  return `$${localSize}B`;
}

function extractLocalGrowthRate(content: string): number {
  const growthMatch = content.match(/(\d+(?:\.\d+)?)\s*%.*(?:growth|growing|increase)/i);
  return growthMatch ? parseFloat(growthMatch[1]) : 7.5;
}

function extractRegionalDrivers(content: string): string[] {
  const drivers = [];
  const sentences = content.split('.').filter(s => s.trim().length > 30);
  
  for (const sentence of sentences.slice(0, 3)) {
    if (sentence.toLowerCase().includes('driver') || 
        sentence.toLowerCase().includes('growth') || 
        sentence.toLowerCase().includes('opportunity')) {
      drivers.push(sentence.trim());
    }
  }
  
  return drivers.length > 0 ? drivers : ['Regional digital adoption trends', 'Government regulatory support'];
}

function extractLocalOpportunities(content: string): string[] {
  const opportunities = [];
  const sentences = content.split('.').filter(s => s.trim().length > 20);
  
  for (const sentence of sentences.slice(0, 2)) {
    if (sentence.toLowerCase().includes('opportunity') || 
        sentence.toLowerCase().includes('potential') ||
        sentence.toLowerCase().includes('market')) {
      opportunities.push(sentence.trim());
    }
  }
  
  return opportunities.length > 0 ? opportunities : ['Local market penetration potential'];
}

function extractMarketMaturity(content: string): string {
  if (content.toLowerCase().includes('emerging') || content.toLowerCase().includes('early')) return 'Emerging';
  if (content.toLowerCase().includes('mature') || content.toLowerCase().includes('established')) return 'Mature';
  if (content.toLowerCase().includes('growth') || content.toLowerCase().includes('expanding')) return 'Growth';
  return 'Growth';
}

function extractRegulatoryFactors(content: string): string[] {
  const factors = [];
  const sentences = content.split('.').filter(s => s.trim().length > 20);
  
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes('regulat') || 
        sentence.toLowerCase().includes('policy') ||
        sentence.toLowerCase().includes('compliance')) {
      factors.push(sentence.trim());
      if (factors.length >= 2) break;
    }
  }
  
  return factors.length > 0 ? factors : ['Standard regulatory environment'];
}

function extractLocalCompetition(content: string): string[] {
  const competition = [];
  const sentences = content.split('.').filter(s => s.trim().length > 20);
  
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes('compet') || 
        sentence.toLowerCase().includes('player') ||
        sentence.toLowerCase().includes('market share')) {
      competition.push(sentence.trim());
      if (competition.length >= 2) break;
    }
  }
  
  return competition.length > 0 ? competition : ['Competitive landscape analysis needed'];
}

function assessFundGeographyAlignment(dealLocation: string, fundGeographies?: string[]): string {
  if (!fundGeographies || fundGeographies.length === 0) {
    return 'Fund geography preferences not specified';
  }
  
  const isAligned = fundGeographies.some(geo => 
    dealLocation.toLowerCase().includes(geo.toLowerCase()) ||
    geo.toLowerCase().includes(dealLocation.toLowerCase())
  );
  
  return isAligned ? 
    `Strong alignment with fund's target geography (${fundGeographies.join(', ')})` :
    `Limited alignment with fund's target geographies (${fundGeographies.join(', ')})`;
}

function generateEnhancedInsights(globalData: any, regionalData: any, localData: any): string[] {
  const insights = [];
  
  if (regionalData) {
    insights.push(`Regional opportunity: ${regionalData.region_name} shows ${regionalData.vs_global_comparison.toLowerCase()} (${regionalData.growth_rate}% vs ${globalData.cagr.value}% globally)`);
  }
  
  if (localData) {
    insights.push(`Local market: ${localData.country_name} represents ${localData.market_size} addressable opportunity with specific local dynamics`);
  }
  
  if (regionalData && regionalData.fund_alignment) {
    insights.push(`Strategic fit: ${regionalData.fund_alignment}`);
  }
  
  return insights;
}

function generateFallbackMarketSizing(industry?: string, location?: string, fundGeographies?: string[]) {
  const tam = industry ? getIndustryDefaultTAM(industry) : 1000000000;
  const sam = Math.round(tam * 0.25);
  const som = Math.round(sam * 0.12);
  
  const regionalAnalysis = location ? {
    region_name: location,
    market_size: `$${Math.round(tam * 0.15 / 1000000000)}B`,
    growth_rate: 8.5,
    vs_global_comparison: `The ${location} region is growing in-line with global market trends`,
    regional_drivers: ['Regional digital adoption trends', 'Government regulatory support'],
    market_maturity: 'Growth',
    fund_alignment: assessFundGeographyAlignment(location, fundGeographies)
  } : null;

  const localAnalysis = location ? {
    country_name: location,
    market_size: `$${Math.round(tam * 0.05 / 1000000000)}B`,
    growth_rate: 7.5,
    local_opportunities: ['Local market penetration potential', 'Direct customer access opportunities'],
    regulatory_environment: ['Standard regulatory environment'],
    competitive_dynamics: ['Competitive landscape analysis needed']
  } : null;

  return {
    tam: { value: tam, currency: 'USD', confidence: 50, citation: 'Industry estimates', source: 'Fallback data' },
    sam: { value: sam, currency: 'USD', confidence: 45, calculation_method: 'Geographic focus', rationale: 'Standard 25% TAM addressability' },
    som: { value: som, currency: 'USD', confidence: 40, calculation_method: 'Market capture', rationale: 'Conservative 12% penetration' },
    cagr: { value: 8.5, period: '2024-2029', citation: 'Industry average', source: 'Standard estimates' },
    research_quality: 'medium',
    regional_analysis: regionalAnalysis,
    local_analysis: localAnalysis,
    enhanced_insights: generateEnhancedInsights(
      { cagr: { value: 8.5 } }, 
      regionalAnalysis, 
      localAnalysis
    )
  };
}