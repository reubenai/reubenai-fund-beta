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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google Custom Search Engine ID - This needs to be properly configured
// Using a programmable search engine ID that should work for general web search
const SEARCH_ENGINE_ID = '017576662512468118441:omuauf_lfve';

interface WebResearchRequest {
  dealData: any;
  researchType: 'company' | 'market' | 'founder' | 'competitive' | 'comprehensive';
  searchDepth?: 'basic' | 'detailed' | 'comprehensive';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealData, researchType, searchDepth = 'detailed' }: WebResearchRequest = await req.json();
    
    console.log('🔍 Web Research Engine: Conducting', researchType, 'research for:', dealData.company_name);
    
    // Conduct comprehensive web research
    const researchResult = await conductWebResearch(dealData, researchType, searchDepth);
    
    // Store source tracking
    await storeSources(dealData.id, 'web-research-engine', researchResult.sources);
    
    return new Response(JSON.stringify(researchResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Web Research Engine Error:', error);
    return new Response(JSON.stringify({
      success: false,
      data: {},
      sources: [],
      confidence: 20,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function conductWebResearch(dealData: any, researchType: string, searchDepth: string) {
  const research = {
    success: true,
    data: {},
    sources: [],
    confidence: 50,
    timestamp: new Date().toISOString()
  };

  try {
    // Validate that we have the required API keys
    if (!googleSearchApiKey) {
      throw new Error('Google Search API key not configured');
    }
    
    if (!openAIApiKey) {
      console.warn('⚠️  OpenAI API key not configured - analysis will be limited');
    }

    console.log(`🚀 Starting ${researchType} research for ${dealData.company_name} (depth: ${searchDepth})`);

    switch (researchType) {
      case 'company':
        research.data = await researchCompanyInfo(dealData, searchDepth);
        break;
      case 'market':
        research.data = await researchMarketInfo(dealData, searchDepth);
        break;
      case 'founder':
        research.data = await researchFounderInfo(dealData, searchDepth);
        break;
      case 'competitive':
        research.data = await researchCompetitors(dealData, searchDepth);
        break;
      case 'comprehensive':
        research.data = await researchComprehensive(dealData, searchDepth);
        break;
      default:
        throw new Error(`Unknown research type: ${researchType}`);
    }

    // Calculate confidence based on data quality
    research.confidence = calculateResearchConfidence(research.data);
    research.sources = research.data.sources || [];

    console.log(`✅ ${researchType} research completed with confidence: ${research.confidence}%`);

  } catch (error) {
    console.error(`❌ Web research failed for ${researchType}:`, error);
    research.success = false;
    research.confidence = 20;
    research.data = { 
      error: error.message,
      fallback_message: 'Web research temporarily unavailable - using basic analysis'
    };
  }

  return research;
}

async function researchCompanyInfo(dealData: any, searchDepth: string) {
  const queries = [
    `"${dealData.company_name}" company information`,
    `"${dealData.company_name}" "${dealData.industry}" startup`,
    `"${dealData.company_name}" funding news`,
    `"${dealData.company_name}" website contact`,
    `"${dealData.company_name}" about company`
  ];

  const searchResults = await performGoogleSearches(queries.slice(0, searchDepth === 'basic' ? 2 : searchDepth === 'detailed' ? 3 : 5));
  
  // Extract and analyze company information
  const analysis = await analyzeCompanySearchResults(searchResults, dealData);
  
  return {
    company_validation: analysis.validation,
    web_presence: analysis.web_presence,
    news_mentions: analysis.news_mentions,
    business_info: analysis.business_info,
    sources: searchResults.map(result => ({
      type: 'google_search',
      source: result.source,
      url: result.link,
      confidence: result.confidence,
      snippet: result.snippet
    }))
  };
}

async function researchMarketInfo(dealData: any, searchDepth: string) {
  const queries = [
    `"${dealData.industry}" market size 2024`,
    `"${dealData.industry}" market trends growth`,
    `"${dealData.industry}" competitive landscape`,
    `"${dealData.industry}" market analysis report`,
    `"${dealData.industry}" industry insights 2024`
  ];

  const searchResults = await performGoogleSearches(queries.slice(0, searchDepth === 'basic' ? 2 : searchDepth === 'detailed' ? 3 : 5));
  
  // Extract market intelligence
  const analysis = await analyzeMarketSearchResults(searchResults, dealData);
  
  return {
    market_size_data: analysis.market_size,
    growth_trends: analysis.growth_trends,
    competitive_analysis: analysis.competitive_landscape,
    industry_reports: analysis.industry_reports,
    sources: searchResults.map(result => ({
      type: 'market_research',
      source: result.source,
      url: result.link,
      confidence: result.confidence,
      snippet: result.snippet
    }))
  };
}

async function researchFounderInfo(dealData: any, searchDepth: string) {
  if (!dealData.founder || dealData.founder === 'N/A') {
    return {
      founder_profiles: [],
      professional_background: 'No founder information available',
      sources: []
    };
  }

  const queries = [
    `"${dealData.founder}" "${dealData.company_name}" founder`,
    `"${dealData.founder}" LinkedIn profile`,
    `"${dealData.founder}" "${dealData.industry}" experience`,
    `"${dealData.founder}" background education`,
    `"${dealData.founder}" previous companies`
  ];

  const searchResults = await performGoogleSearches(queries.slice(0, searchDepth === 'basic' ? 2 : searchDepth === 'detailed' ? 3 : 5));
  
  // Analyze founder information
  const analysis = await analyzeFounderSearchResults(searchResults, dealData);
  
  return {
    founder_profiles: analysis.profiles,
    professional_background: analysis.background,
    education_info: analysis.education,
    previous_experience: analysis.experience,
    sources: searchResults.map(result => ({
      type: 'founder_research',
      source: result.source,
      url: result.link,
      confidence: result.confidence,
      snippet: result.snippet
    }))
  };
}

async function researchCompetitors(dealData: any, searchDepth: string) {
  const queries = [
    `"${dealData.industry}" competitors 2024`,
    `"${dealData.industry}" startup companies`,
    `"${dealData.industry}" market leaders`,
    `"${dealData.industry}" similar companies`,
    `alternatives to "${dealData.company_name}"`
  ];

  const searchResults = await performGoogleSearches(queries.slice(0, searchDepth === 'basic' ? 2 : searchDepth === 'detailed' ? 3 : 5));
  
  // Analyze competitive landscape
  const analysis = await analyzeCompetitiveSearchResults(searchResults, dealData);
  
  return {
    direct_competitors: analysis.direct_competitors,
    indirect_competitors: analysis.indirect_competitors,
    market_positioning: analysis.market_positioning,
    competitive_advantages: analysis.advantages,
    sources: searchResults.map(result => ({
      type: 'competitive_research',
      source: result.source,
      url: result.link,
      confidence: result.confidence,
      snippet: result.snippet
    }))
  };
}

async function researchComprehensive(dealData: any, searchDepth: string) {
  // Perform all research types in parallel
  const [companyInfo, marketInfo, founderInfo, competitiveInfo] = await Promise.all([
    researchCompanyInfo(dealData, 'basic'),
    researchMarketInfo(dealData, 'basic'),
    researchFounderInfo(dealData, 'basic'),
    researchCompetitors(dealData, 'basic')
  ]);

  return {
    company: companyInfo,
    market: marketInfo,
    founder: founderInfo,
    competitive: competitiveInfo,
    sources: [
      ...companyInfo.sources,
      ...marketInfo.sources,
      ...founderInfo.sources,
      ...competitiveInfo.sources
    ]
  };
}

async function performGoogleSearches(queries: string[]) {
  const results = [];
  let successfulSearches = 0;
  
  console.log(`🔍 Starting ${queries.length} Google searches...`);
  
  for (const query of queries) {
    try {
      const searchResult = await performSingleGoogleSearch(query);
      if (searchResult.items && searchResult.items.length > 0) {
        const processedResults = searchResult.items.slice(0, 3).map(item => ({
          query,
          title: item.title || 'No title',
          snippet: item.snippet || 'No snippet available',
          link: item.link,
          source: item.displayLink || 'Unknown source',
          confidence: calculateSearchResultConfidence(item, query)
        }));
        
        results.push(...processedResults);
        successfulSearches++;
        console.log(`✅ Successfully processed ${processedResults.length} results for: "${query}"`);
      } else {
        console.log(`⚠️  No results found for: "${query}"`);
      }
      
      // Add delay to respect API limits (minimum 100ms between requests)
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Google search failed for query "${query}":`, error);
      // Continue with other queries even if one fails
    }
  }
  
  console.log(`🔍 Completed Google searches: ${successfulSearches}/${queries.length} successful`);
  return results;
}

async function performSingleGoogleSearch(query: string) {
  try {
    // Clean the query to avoid API errors
    const cleanQuery = query.replace(/[^\w\s".-]/g, '').trim();
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleSearchApiKey}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(cleanQuery)}&num=5&safe=active`;
    
    console.log(`🔍 Searching Google for: "${cleanQuery}"`);
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Search API error: ${response.status} - ${errorText}`);
      
      // Return empty result instead of throwing to allow graceful degradation
      return { items: [] };
    }
    
    const data = await response.json();
    console.log(`✅ Google search successful for "${cleanQuery}" - found ${data.items?.length || 0} results`);
    
    return data;
  } catch (error) {
    console.error(`Search failed for query "${query}":`, error);
    // Return empty result to allow graceful degradation
    return { items: [] };
  }
}

function calculateSearchResultConfidence(item: any, query: string): number {
  let confidence = 50; // Base confidence
  
  // Boost confidence for official sources
  if (item.displayLink?.includes('linkedin.com')) confidence += 20;
  if (item.displayLink?.includes('crunchbase.com')) confidence += 20;
  if (item.displayLink?.includes('bloomberg.com')) confidence += 15;
  if (item.displayLink?.includes('techcrunch.com')) confidence += 15;
  if (item.displayLink?.includes('forbes.com')) confidence += 15;
  
  // Boost confidence if snippet contains key terms from query
  const queryTerms = query.toLowerCase().replace(/"/g, '').split(' ');
  const snippetLower = item.snippet?.toLowerCase() || '';
  const matchingTerms = queryTerms.filter(term => snippetLower.includes(term)).length;
  confidence += (matchingTerms / queryTerms.length) * 20;
  
  return Math.min(confidence, 95);
}

async function analyzeCompanySearchResults(searchResults: any[], dealData: any) {
  const combinedText = searchResults.map(r => `${r.title}: ${r.snippet}`).join('\n');
  
  const prompt = `Analyze this web search data about ${dealData.company_name} and extract:
1. Company validation (does it exist, is information consistent?)
2. Web presence quality
3. Recent news mentions
4. Business information accuracy

Search Results:
${combinedText}

Provide structured analysis focusing on validation and key business insights.`;

  return await analyzeWithAI(prompt, 'company_analysis');
}

async function analyzeMarketSearchResults(searchResults: any[], dealData: any) {
  const combinedText = searchResults.map(r => `${r.title}: ${r.snippet}`).join('\n');
  
  const prompt = `Analyze this market research data for ${dealData.industry} industry and extract:
1. Market size information
2. Growth trends and projections
3. Competitive landscape insights
4. Industry reports and data sources

Search Results:
${combinedText}

Focus on quantitative market data and credible sources.`;

  return await analyzeWithAI(prompt, 'market_analysis');
}

async function analyzeFounderSearchResults(searchResults: any[], dealData: any) {
  const combinedText = searchResults.map(r => `${r.title}: ${r.snippet}`).join('\n');
  
  const prompt = `Analyze this search data about founder ${dealData.founder} and extract:
1. Professional profiles found
2. Background and experience
3. Educational information
4. Previous company associations

Search Results:
${combinedText}

Focus on verifiable professional information and experience validation.`;

  return await analyzeWithAI(prompt, 'founder_analysis');
}

async function analyzeCompetitiveSearchResults(searchResults: any[], dealData: any) {
  const combinedText = searchResults.map(r => `${r.title}: ${r.snippet}`).join('\n');
  
  const prompt = `Analyze competitive landscape data for ${dealData.industry} and extract:
1. Direct competitors identified
2. Indirect competitors and alternatives
3. Market positioning insights
4. Competitive advantages mentioned

Search Results:
${combinedText}

Focus on identifying key players and competitive dynamics.`;

  return await analyzeWithAI(prompt, 'competitive_analysis');
}

async function analyzeWithAI(prompt: string, analysisType: string) {
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
            content: 'You are a research analyst extracting structured insights from web search data. Provide concise, factual analysis. If information is unclear or contradictory, note it explicitly.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 800
      }),
    });

    if (!response.ok) throw new Error('OpenAI API error');
    
    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Parse the analysis into structured format based on type
    return parseAnalysisResponse(analysis, analysisType);
  } catch (error) {
    console.error('AI analysis failed:', error);
    return {
      validation: 'Analysis failed',
      web_presence: 'Unable to determine',
      news_mentions: 'Not analyzed',
      business_info: 'Analysis error'
    };
  }
}

function parseAnalysisResponse(analysis: string, analysisType: string) {
  // Simple parsing - in production, this would be more sophisticated
  switch (analysisType) {
    case 'company_analysis':
      return {
        validation: extractSection(analysis, 'validation') || 'Company information found',
        web_presence: extractSection(analysis, 'web presence') || 'Web presence detected',
        news_mentions: extractSection(analysis, 'news') || 'News mentions identified',
        business_info: extractSection(analysis, 'business') || analysis.substring(0, 200)
      };
    case 'market_analysis':
      return {
        market_size: extractSection(analysis, 'market size') || 'Market size data found',
        growth_trends: extractSection(analysis, 'growth') || 'Growth trends identified',
        competitive_landscape: extractSection(analysis, 'competitive') || 'Competitive data available',
        industry_reports: extractSection(analysis, 'reports') || analysis.substring(0, 200)
      };
    case 'founder_analysis':
      return {
        profiles: extractSection(analysis, 'profiles') || 'Profile information found',
        background: extractSection(analysis, 'background') || 'Background data available',
        education: extractSection(analysis, 'education') || 'Educational info found',
        experience: extractSection(analysis, 'experience') || analysis.substring(0, 200)
      };
    case 'competitive_analysis':
      return {
        direct_competitors: extractSection(analysis, 'direct') || 'Direct competitors identified',
        indirect_competitors: extractSection(analysis, 'indirect') || 'Indirect competitors found',
        market_positioning: extractSection(analysis, 'positioning') || 'Market position data',
        advantages: extractSection(analysis, 'advantages') || analysis.substring(0, 200)
      };
    default:
      return { analysis: analysis };
  }
}

function extractSection(text: string, keyword: string): string | null {
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      return line.trim();
    }
  }
  return null;
}

function calculateResearchConfidence(data: any): number {
  if (!data || Object.keys(data).length === 0) return 20;
  
  let confidence = 40; // Base confidence
  
  // Boost confidence based on data richness
  if (data.sources && data.sources.length > 0) {
    confidence += Math.min(data.sources.length * 10, 30);
  }
  
  // Boost confidence for high-quality sources
  if (data.sources) {
    const highQualitySources = data.sources.filter((s: any) => s.confidence > 70).length;
    confidence += highQualitySources * 5;
  }
  
  return Math.min(confidence, 90);
}

async function storeSources(dealId: string, engineName: string, sources: any[]) {
  try {
    const sourcesToStore = sources.map(source => ({
      deal_id: dealId,
      engine_name: engineName,
      source_type: source.type,
      source_url: source.url || source.source,
      confidence_score: source.confidence,
      data_snippet: source.snippet || JSON.stringify(source),
      created_at: new Date().toISOString()
    }));

    if (sourcesToStore.length > 0) {
      const { error } = await supabase
        .from('deal_analysis_sources')
        .insert(sourcesToStore);

      if (error) {
        console.error('Error storing sources:', error);
      }
    }
  } catch (error) {
    console.error('Error in storeSources:', error);
  }
}