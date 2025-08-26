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

  // 🚫 HARD CODED KILL SWITCH - ENGINE PERMANENTLY DISABLED
  console.log('🚫 Market Research Engine: PERMANENTLY DISABLED');
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Market research engine permanently disabled',
    message: 'This engine has been shut down permanently'
  }), {
    status: 503,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

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
    
    // 🚨 EMERGENCY HARDCODED BLOCK FOR KERNEL & ASTRO DEALS
    const BLOCKED_DEALS = ['7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'];
    if (dealData?.id && BLOCKED_DEALS.includes(dealData.id)) {
      console.log(`🛑 EMERGENCY BLOCK: Market research engine terminated for blocked deal: ${dealData.id}`);
      return new Response(JSON.stringify({
        score: 0,
        analysis: 'EMERGENCY_SHUTDOWN_ACTIVE: Deal processing blocked by emergency protocol',
        confidence: 0,
        sources: [],
        data: { emergency_block: true },
        validation_status: 'emergency_blocked'
      }), {
        status: 423, // Locked status
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Validate required data with comprehensive error handling
    if (!dealData || typeof dealData !== 'object') {
      throw new Error('Invalid dealData: dealData must be provided as an object');
    }
    
    if (!dealData.company_name) {
      throw new Error('Invalid dealData: company_name is required');
    }
    
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
  
  // Generate AI-powered market analysis with fund-type-specific focus
  const aiAnalysis = await generateMarketAnalysis(validatedData, marketIntelligence, enhancedContext);
  
  // Calculate market attractiveness score using fund-type-specific criteria
  const marketScore = calculateMarketScore({
    ...marketIntelligence,
    documentInsights
  }, enhancedContext);
  
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
      fund_criteria_weight: enhancedContext?.marketCriteria?.weight || 20,
      fund_type_analysis: generateFundTypeAnalysis(enhancedContext?.fundType, marketIntelligence)
    },
    validation_status: confidence >= 70 ? 'validated' : confidence >= 50 ? 'partial' : 'unvalidated'
  };
}

// Fund-type-specific market analysis
function generateFundTypeAnalysis(fundType: string, marketIntelligence: any): any {
  if (fundType === 'vc' || fundType === 'venture_capital') {
    return {
      focus: 'growth_and_disruption',
      key_metrics: ['market_size_expansion', 'innovation_potential', 'disruptive_capability'],
      analysis_depth: 'tam_sam_som_growth_trajectory',
      competitive_focus: 'innovation_gaps_and_differentiation'
    };
  } else if (fundType === 'pe' || fundType === 'private_equity') {
    return {
      focus: 'market_position_and_stability',
      key_metrics: ['market_share', 'competitive_moat', 'market_maturity'],
      analysis_depth: 'addressable_market_penetration',
      competitive_focus: 'market_consolidation_opportunities'
    };
  }
  return {
    focus: 'general_analysis',
    key_metrics: ['market_size', 'growth_rate'],
    analysis_depth: 'basic_market_assessment',
    competitive_focus: 'standard_competitive_analysis'
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
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `Extract comprehensive market intelligence from documents. Parse for:
            1. MARKET SIZE: TAM/SAM/SOM data, market value, growth rates, CAGR
            2. CUSTOMER VALIDATION: Customer interviews, testimonials, traction metrics
            3. COMPETITIVE ANALYSIS: Competitor mentions, market share, positioning
            4. MARKET TRENDS: Industry trends, market dynamics, growth drivers
            5. GEOGRAPHIC MARKETS: Target regions, expansion plans, market penetration
            6. BUSINESS MODEL: Revenue streams, pricing, customer acquisition
            Return structured market insights with quantitative data where available.`
          },
          {
            role: 'user',
            content: allText.substring(0, 20000)
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return {
        market_info: content,
        market_size_data: extractMarketSizeData(content),
        customer_validation: extractCustomerValidation(content),
        competitive_intelligence: extractCompetitiveIntelligence(content),
        growth_metrics: extractGrowthMetrics(content),
        geographic_insights: extractGeographicInsights(content),
        source: 'extracted_documents',
        confidence: 90,
        hasValidatedData: true
      };
    }
  } catch (error) {
    console.error('❌ Market Research Engine - Document extraction error:', error);
  }
  
  return {
    market_info: 'Document analysis failed',
    source: 'extracted_documents',
    confidence: 20,
    hasValidatedData: false
  };
}

function extractMarketSizeData(content: string): any {
  const marketTerms = ['tam', 'sam', 'som', 'market size', 'billion', 'million', 'cagr', 'growth rate'];
  const hasMarketData = marketTerms.some(term => content.toLowerCase().includes(term));
  
  // Extract numerical market data
  const billionMatches = content.match(/\$?(\d+\.?\d*)\s*billion/gi) || [];
  const millionMatches = content.match(/\$?(\d+\.?\d*)\s*million/gi) || [];
  const cagrMatches = content.match(/(\d+\.?\d*)%\s*cagr/gi) || [];
  
  return {
    hasMarketSizeData: hasMarketData,
    billionDollarMarkets: billionMatches.length,
    millionDollarMarkets: millionMatches.length,
    growthRatesMentioned: cagrMatches.length,
    marketSizeConfidence: hasMarketData ? 'high' : 'low'
  };
}

function extractCustomerValidation(content: string): any {
  const validationTerms = ['customer', 'testimonial', 'validation', 'feedback', 'interview', 'survey', 'traction'];
  const hasValidation = validationTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasCustomerValidation: hasValidation,
    testimonialMentions: (content.match(/testimonial[s]?/gi) || []).length,
    customerInterviews: content.toLowerCase().includes('interview'),
    tractionData: content.toLowerCase().includes('traction')
  };
}

function extractCompetitiveIntelligence(content: string): any {
  const competitorTerms = ['competitor', 'competition', 'versus', 'alternative', 'differentiation'];
  const hasCompetitive = competitorTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasCompetitiveAnalysis: hasCompetitive,
    competitorMentions: (content.match(/competitor[s]?/gi) || []).length,
    differentiationClaimed: content.toLowerCase().includes('differentiation'),
    competitiveAdvantage: content.toLowerCase().includes('advantage')
  };
}

function extractGrowthMetrics(content: string): any {
  const growthTerms = ['growth', 'increase', 'expansion', 'scaling', 'revenue'];
  const hasGrowth = growthTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasGrowthMetrics: hasGrowth,
    revenueGrowth: content.toLowerCase().includes('revenue'),
    expansionPlans: content.toLowerCase().includes('expansion'),
    scalingMentions: content.toLowerCase().includes('scaling')
  };
}

function extractGeographicInsights(content: string): any {
  const regions = ['north america', 'europe', 'asia', 'global', 'international', 'regional'];
  const foundRegions = regions.filter(region => content.toLowerCase().includes(region));
  
  return {
    hasGeographicData: foundRegions.length > 0,
    targetRegions: foundRegions,
    globalMentions: content.toLowerCase().includes('global'),
    internationalFocus: content.toLowerCase().includes('international')
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
  
  // Attempt real-time market research using Google Search API
  try {
    const webResearchData = await conductWebResearch(dealData, enhancedContext);
    if (webResearchData.success) {
      intelligence.market_size = webResearchData.market_size || intelligence.market_size;
      intelligence.growth_rate = webResearchData.growth_rate || intelligence.growth_rate;
      intelligence.competitive_landscape = webResearchData.competitive_landscape || intelligence.competitive_landscape;
      intelligence.market_trends = webResearchData.market_trends || intelligence.market_trends;
      intelligence.data_quality = 'web_validated';
      intelligence.sources.push(...webResearchData.sources);
      console.log('✅ Market Research Engine: Successfully retrieved real market data');
    }
  } catch (error) {
    console.error('❌ Market Research Engine: Web research failed:', error.message);
    intelligence.sources.push({
      type: 'web_research_error',
      source: 'google_search_api',
      validated: false,
      confidence: 0,
      error: error.message
    });
    
    // Return explicit error state instead of simulated data
    intelligence.market_size = `Market research unavailable: ${error.message}`;
    intelligence.growth_rate = `Growth data unavailable: API access required`;
    intelligence.competitive_landscape = `Competitive analysis unavailable: ${error.message}`;
    intelligence.market_trends = [`Market research engine needs Google Search API configuration`];
    intelligence.data_quality = 'unavailable';
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
  
  // MASSIVE DOCUMENT BONUS - Document market intelligence is critical
  if (intelligence.documentInsights?.hasValidatedData) {
    console.log('🔥 Market Research Engine: Document insights detected - applying heavy scoring boost');
    
    // Market size data from documents (heavily weighted)
    if (intelligence.documentInsights.market_size_data?.hasMarketSizeData) {
      score += 25; // Major boost for validated market size data
      console.log('📊 Market Research Engine: Market size data found in documents (+25 points)');
      
      if (intelligence.documentInsights.market_size_data.billionDollarMarkets > 0) {
        score += 15; // Additional boost for billion-dollar market mentions
        console.log('💰 Market Research Engine: Billion-dollar market mentions (+15 points)');
      }
      
      if (intelligence.documentInsights.market_size_data.growthRatesMentioned > 0) {
        score += 12; // Growth rate data bonus
        console.log('📈 Market Research Engine: Growth rates mentioned (+12 points)');
      }
    }
    
    // Customer validation from documents
    if (intelligence.documentInsights.customer_validation?.hasCustomerValidation) {
      score += 20; // Strong validation is critical for market confidence
      console.log('✅ Market Research Engine: Customer validation found (+20 points)');
      
      if (intelligence.documentInsights.customer_validation.tractionData) {
        score += 10; // Traction data bonus
        console.log('🚀 Market Research Engine: Traction data mentioned (+10 points)');
      }
    }
    
    // Competitive intelligence from documents
    if (intelligence.documentInsights.competitive_intelligence?.hasCompetitiveAnalysis) {
      score += 15;
      console.log('🥊 Market Research Engine: Competitive analysis found (+15 points)');
    }
    
    // Growth metrics from documents
    if (intelligence.documentInsights.growth_metrics?.hasGrowthMetrics) {
      score += 12;
      console.log('📊 Market Research Engine: Growth metrics found (+12 points)');
    }
    
    // Geographic insights bonus
    if (intelligence.documentInsights.geographic_insights?.hasGeographicData) {
      score += 8;
      console.log('🌍 Market Research Engine: Geographic insights found (+8 points)');
    }
    
    // Base document analysis bonus
    score += 15; // Always reward document-driven analysis
    console.log('📄 Market Research Engine: Document analysis completed (+15 points)');
  } else {
    console.log('⚠️ Market Research Engine: No document insights - limited scoring potential');
  }
  
  // Adjust based on available data quality (lower weight if we have documents)
  if (intelligence.data_quality === 'limited' && !intelligence.documentInsights?.hasValidatedData) {
    return 45; // Low score for insufficient data
  }
  
  // Enhanced scoring using fund criteria weights
  const marketWeight = enhancedContext?.marketCriteria?.weight || 20;
  const weightMultiplier = marketWeight / 20; // Normalize to base weight of 20
  
  // Traditional growth rate scoring (lower weight if we have documents)
  if (intelligence.growth_rate && intelligence.growth_rate.includes('CAGR')) {
    const cagrMatch = intelligence.growth_rate.match(/(\d+\.?\d*)%/);
    if (cagrMatch) {
      const cagr = parseFloat(cagrMatch[1]);
      const growthBonus = cagr >= 20 ? 25 : cagr >= 15 ? 20 : cagr >= 10 ? 15 : cagr >= 5 ? 10 : 0;
      const adjustedBonus = intelligence.documentInsights?.hasValidatedData ? Math.round(growthBonus * 0.5) : growthBonus;
      score += Math.round(adjustedBonus * weightMultiplier);
    }
  }
  
  // Traditional market size scoring (lower weight if we have documents)  
  const sizeBonus = intelligence.market_size?.includes('T') ? 15 : 
                   intelligence.market_size?.includes('B') ? 10 : 0;
  const adjustedSizeBonus = intelligence.documentInsights?.hasValidatedData ? Math.round(sizeBonus * 0.5) : sizeBonus;
  score += Math.round(adjustedSizeBonus * weightMultiplier);
  
  // Enhanced fund alignment scoring
  if (intelligence.fund_alignment) {
    if (intelligence.fund_alignment.geographic_match) score += 15;
    if (intelligence.fund_alignment.signals_present.length > 0) {
      score += intelligence.fund_alignment.signals_present.length * 5;
    }
  }
  
  // Legacy document bonus (only if not already counted)
  if (intelligence.sources.some((s: any) => s.source === 'extracted_documents') && !intelligence.documentInsights?.hasValidatedData) {
    score += 10; // Legacy document analysis bonus
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
  
  console.log(`🎯 Market Research Engine: Final score calculated: ${Math.min(score, 100)}`);
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
            content: 'ZERO FABRICATION POLICY: You are a market research analyst with strict anti-fabrication protocols. CRITICAL RULES: 1) Only use provided data 2) Never fabricate market statistics, growth rates, or company details 3) Use "N/A" or "Unable to validate" for missing data 4) Be explicit about data limitations 5) State confidence level for each claim 6) Attribute all data to specific sources 7) Use conservative language for estimates'
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
    console.log('🔍 Market Research Engine: Attempting web research for', dealData.company_name);
    
    // Check if required API keys are available
    if (!googleSearchApiKey || !googleSearchEngineId) {
      throw new Error('Google Search API credentials not configured. Please add GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID to Supabase Edge Function secrets.');
    }
    
    const { data: webResult, error } = await supabase.functions.invoke('web-research-engine', {
      body: {
        dealData,
        researchType: 'market',
        searchDepth: 'detailed'
      }
    });

    if (error) {
      console.error('❌ Market Research Engine: Web research engine error:', error);
      throw new Error(`Web research failed: ${error.message}`);
    }

    if (webResult.success && webResult.data) {
      console.log('✅ Market Research Engine: Web research successful with real data');
      const marketData = webResult.data;
      
      return {
        success: true,
        market_size: extractMarketSize(marketData),
        growth_rate: extractGrowthRate(marketData),
        competitive_landscape: extractCompetitiveLandscape(marketData),
        market_trends: extractMarketTrends(marketData),
        sources: webResult.sources || [],
        data_quality: 'web_validated'
      };
    }

    throw new Error('Web research returned no usable data');
  } catch (error) {
    console.error('❌ Market Research Engine: Web research failed:', error.message);
    throw error; // Don't mask the error - let it bubble up
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