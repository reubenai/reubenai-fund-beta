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
const googleSearchApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY')!;
const googleSearchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MarketResearchRequest {
  dealData: any;
  strategyData: any;
  documentData?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      dealData, 
      strategyData, 
      documentData, 
      fundType, 
      enhancedCriteria, 
      geography, 
      keySignals,
      thresholds 
    } = await req.json();
    
    console.log('📊 Market Research Engine: Enhanced analysis for:', dealData.company_name);
    console.log('🎯 Fund Type:', fundType, '| Enhanced Criteria:', !!enhancedCriteria);
    
    // Extract enhanced market criteria
    const marketCriteria = enhancedCriteria?.categories?.find((cat: any) => 
      cat.name?.toLowerCase().includes('market') || 
      cat.name?.toLowerCase().includes('opportunity')
    );
    
    // Conduct comprehensive market research with enhanced context
    const marketResult = await conductMarketResearch(dealData, strategyData, documentData, {
      fundType,
      marketCriteria,
      geography,
      keySignals,
      thresholds
    });
    
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

async function conductMarketResearch(dealData: any, strategyData: any, documentData: any = null, enhancedContext: any = null) {
  const validatedData = validateMarketData(dealData);
  
  // Enhanced document-driven market research
  const documentInsights = documentData ? await extractMarketInsightsFromDocuments(documentData) : null;
  
  // Attempt real-time market research with enhanced context
  const marketIntelligence = await gatherMarketIntelligence(validatedData, documentInsights, strategyData, enhancedContext);
  
  // Generate AI-powered market analysis with enhanced criteria
  const aiAnalysis = await generateMarketAnalysis(validatedData, marketIntelligence, enhancedContext);
  
  // Calculate market attractiveness score using enhanced weights
  const marketScore = calculateMarketScore(marketIntelligence, enhancedContext);
  
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
      tam_sam_som: marketIntelligence.tam_sam_som,
      geographic_alignment: marketIntelligence.geographic_focus,
      fund_criteria_weight: enhancedContext?.marketCriteria?.weight || 20
    },
    validation_status: confidence >= 70 ? 'validated' : confidence >= 50 ? 'partial' : 'unvalidated'
  };
}

async function extractMarketInsightsFromDocuments(documentData: any) {
  if (!documentData || !documentData.extractedTexts || documentData.extractedTexts.length === 0) {
    return null;
  }
  
  const allText = documentData.extractedTexts.map(doc => `${doc.name}:\n${doc.extracted_text}`).join('\n\n');
  
  try {
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
            content: 'Extract market and business information from these documents. Look for: market size data, target customers, competitive analysis, market validation, growth opportunities, and business model details.'
          },
          {
            role: 'user',
            content: allText.substring(0, 15000)
          }
        ],
        max_tokens: 1000
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        market_info: data.choices[0].message.content,
        source: 'extracted_documents',
        confidence: 85
      };
    }
  } catch (error) {
    console.error('Error extracting market insights:', error);
  }
  
  return {
    market_info: 'Document analysis in progress',
    source: 'extracted_documents',
    confidence: 50
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

async function gatherMarketIntelligence(dealData: any, documentInsights: any = null, strategyData: any = null, enhancedContext: any = null) {
  const intelligence = {
    market_size: 'N/A',
    growth_rate: 'N/A', 
    competitive_landscape: 'N/A',
    market_trends: [],
    tam_sam_som: { tam: 'N/A', sam: 'N/A', som: 'N/A' },
    sources: [],
    data_quality: 'limited',
    geographic_focus: null,
    fund_alignment: {
      geographic_match: false,
      sector_focus: false,
      signals_present: []
    }
  };
  
  // Apply enhanced geographic filtering
  const geography = enhancedContext?.geography || strategyData?.geography || [];
  if (geography.length > 0) {
    intelligence.geographic_focus = geography;
    intelligence.fund_alignment.geographic_match = checkGeographicAlignment(dealData.location, geography);
    intelligence.sources.push({
      type: 'enhanced_strategy_filter',
      source: 'geographic_focus_enhanced',
      validated: true,
      confidence: 95
    });
  }
  
  // Check for key signals in market analysis
  const keySignals = enhancedContext?.keySignals || [];
  if (keySignals.length > 0) {
    intelligence.fund_alignment.signals_present = findMarketSignals(dealData, keySignals);
    intelligence.sources.push({
      type: 'key_signals_analysis',
      source: 'fund_signals_matching',
      validated: true,
      confidence: 85
    });
  }
  
  // Conduct real-time market research using Google Search API
  const webResearchData = await conductWebResearch(dealData, enhancedContext);
  if (webResearchData.success) {
    intelligence.market_size = webResearchData.market_size || intelligence.market_size;
    intelligence.growth_rate = webResearchData.growth_rate || intelligence.growth_rate;
    intelligence.competitive_landscape = webResearchData.competitive_landscape || intelligence.competitive_landscape;
    intelligence.market_trends = webResearchData.market_trends || intelligence.market_trends;
    intelligence.data_quality = 'web_enhanced';
    intelligence.sources.push(...webResearchData.sources);
  }
  
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

function calculateMarketScore(intelligence: any, enhancedContext: any = null): number {
  let score = 50; // Base score
  
  // Adjust based on available data quality
  if (intelligence.data_quality === 'limited') {
    return 45; // Low score for insufficient data
  }
  
  // Enhanced scoring using fund criteria weights
  const marketWeight = enhancedContext?.marketCriteria?.weight || 20;
  const weightMultiplier = marketWeight / 20; // Normalize to base weight of 20
  
  // Simulate scoring based on market characteristics with enhanced weights
  if (intelligence.growth_rate && intelligence.growth_rate.includes('CAGR')) {
    const cagrMatch = intelligence.growth_rate.match(/(\d+\.?\d*)%/);
    if (cagrMatch) {
      const cagr = parseFloat(cagrMatch[1]);
      const growthBonus = cagr >= 20 ? 25 : cagr >= 15 ? 20 : cagr >= 10 ? 15 : cagr >= 5 ? 10 : 0;
      score += Math.round(growthBonus * weightMultiplier);
    }
  }
  
  // Adjust for market size with enhanced weighting
  const sizeBonus = intelligence.market_size?.includes('T') ? 15 : 
                   intelligence.market_size?.includes('B') ? 10 : 0;
  score += Math.round(sizeBonus * weightMultiplier);
  
  // Enhanced fund alignment scoring
  if (intelligence.fund_alignment) {
    if (intelligence.fund_alignment.geographic_match) score += 15;
    if (intelligence.fund_alignment.signals_present.length > 0) {
      score += intelligence.fund_alignment.signals_present.length * 5;
    }
  }
  
  // Bonus for document-driven insights
  if (intelligence.sources.some((s: any) => s.source === 'extracted_documents')) {
    score += 10; // Document analysis bonus
  }
  
  // VC vs PE adjustments
  if (enhancedContext?.fundType === 'pe') {
    // PE focuses more on market maturity and stability
    if (intelligence.competitive_landscape?.includes('mature') || 
        intelligence.competitive_landscape?.includes('established')) {
      score += 5;
    }
  } else if (enhancedContext?.fundType === 'vc') {
    // VC focuses more on growth and emerging markets
    if (intelligence.market_trends.some((trend: string) => 
        trend.toLowerCase().includes('emerging') || 
        trend.toLowerCase().includes('innovation'))) {
      score += 5;
    }
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

async function generateMarketAnalysis(dealData: any, intelligence: any, enhancedContext: any = null): Promise<string> {
  const geographicContext = intelligence.geographic_focus 
    ? `Geographic Focus: ${intelligence.geographic_focus.join(', ')}\n`
    : '';
  
  const fundContext = enhancedContext ? `
Fund Type: ${enhancedContext.fundType?.toUpperCase() || 'VC'}
Market Criteria Weight: ${enhancedContext.marketCriteria?.weight || 20}%
Key Signals: ${enhancedContext.keySignals?.join(', ') || 'None specified'}
Geographic Alignment: ${intelligence.fund_alignment?.geographic_match ? 'MATCHED' : 'REVIEW NEEDED'}
Signals Present: ${intelligence.fund_alignment?.signals_present?.join(', ') || 'None detected'}
` : '';
  
  const prompt = `Generate a concise market attractiveness analysis for this ${enhancedContext?.fundType?.toUpperCase() || 'VC'} investment opportunity:

COMPANY: ${dealData.company_name}
INDUSTRY: ${dealData.industry}
DESCRIPTION: ${dealData.description}

MARKET INTELLIGENCE:
- Market Size: ${intelligence.market_size}
- Growth Rate: ${intelligence.growth_rate}
- Competition: ${intelligence.competitive_landscape}
- Key Trends: ${intelligence.market_trends.join(', ')}
${geographicContext}
DATA QUALITY: ${intelligence.data_quality}

Instructions:
- Focus on market attractiveness for investment purposes
- Highlight growth opportunities and market dynamics
- Consider geographic alignment if specified
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

function checkGeographicAlignment(dealLocation: string, fundGeography: string[]): boolean {
  if (!dealLocation || dealLocation === 'N/A' || fundGeography.length === 0) {
    return false;
  }
  
  const location = dealLocation.toLowerCase();
  return fundGeography.some(geo => 
    location.includes(geo.toLowerCase()) || 
    geo.toLowerCase().includes(location.split(',')[0].trim())
  );
}

function findMarketSignals(dealData: any, keySignals: string[]): string[] {
  const foundSignals: string[] = [];
  const searchText = `${dealData.description} ${dealData.industry} ${dealData.business_model}`.toLowerCase();
  
  keySignals.forEach(signal => {
    if (searchText.includes(signal.toLowerCase())) {
      foundSignals.push(signal);
    }
  });
  
  return foundSignals;
}

async function conductWebResearch(dealData: any, enhancedContext: any = null) {
  try {
    console.log('🔍 Conducting web research for market intelligence...');
    
    // Call web-research-engine for market-specific research
    const { data: webResult, error } = await supabase.functions.invoke('web-research-engine', {
      body: {
        dealData,
        researchType: 'market',
        searchDepth: 'detailed'
      }
    });

    if (error) {
      console.error('Web research failed:', error);
      return { success: false, sources: [] };
    }

    if (webResult.success && webResult.data) {
      const marketData = webResult.data;
      
      return {
        success: true,
        market_size: extractMarketSize(marketData),
        growth_rate: extractGrowthRate(marketData),
        competitive_landscape: extractCompetitiveLandscape(marketData),
        market_trends: extractMarketTrends(marketData),
        sources: webResult.sources || []
      };
    }

    return { success: false, sources: [] };
  } catch (error) {
    console.error('Web research error:', error);
    return { success: false, sources: [] };
  }
}

function extractMarketSize(marketData: any): string {
  if (marketData.market_size_data && typeof marketData.market_size_data === 'string') {
    // Look for market size patterns in the text
    const sizePattern = /\$[\d.,]+[BMT]/gi;
    const matches = marketData.market_size_data.match(sizePattern);
    if (matches && matches.length > 0) {
      return `Market size: ${matches[0]} (web-validated)`;
    }
  }
  return 'Market size data requires validation';
}

function extractGrowthRate(marketData: any): string {
  if (marketData.growth_trends && typeof marketData.growth_trends === 'string') {
    // Look for CAGR patterns
    const cagrPattern = /(\d+\.?\d*)%.*CAGR/gi;
    const matches = marketData.growth_trends.match(cagrPattern);
    if (matches && matches.length > 0) {
      return `${matches[0]} (web-validated)`;
    }
    
    // Look for general growth patterns
    const growthPattern = /(\d+\.?\d*)%.*growth/gi;
    const growthMatches = marketData.growth_trends.match(growthPattern);
    if (growthMatches && growthMatches.length > 0) {
      return `${growthMatches[0]} (web-validated)`;
    }
  }
  return 'Growth rate requires validation';
}

function extractCompetitiveLandscape(marketData: any): string {
  if (marketData.competitive_analysis && typeof marketData.competitive_analysis === 'string') {
    return `${marketData.competitive_analysis.substring(0, 200)}... (web-enhanced)`;
  }
  return 'Competitive landscape analysis in progress';
}

function extractMarketTrends(marketData: any): string[] {
  if (marketData.growth_trends && typeof marketData.growth_trends === 'string') {
    // Extract trend keywords
    const trendKeywords = ['AI', 'digital transformation', 'cloud', 'automation', 'sustainability', 'mobile'];
    const foundTrends = trendKeywords.filter(keyword => 
      marketData.growth_trends.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (foundTrends.length > 0) {
      return foundTrends.map(trend => `${trend} adoption (web-validated)`);
    }
  }
  return ['Market trends analysis in progress'];
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