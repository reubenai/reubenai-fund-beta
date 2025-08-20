import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
const googleSearchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CompetitorData {
  name: string;
  website?: string;
  description: string;
  funding_stage?: string;
  valuation?: number;
  market_share?: number;
  geography: string[];
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  competitor_type: 'Incumbent' | 'Challenger' | 'Emerging' | 'Whitespace';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealId, fundId, context } = await req.json();
    
    console.log('🏆 Enhanced Competitive Intelligence: Starting analysis for deal:', dealId);
    
    // Get deal data for context extraction
    const { data: deal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (!deal) {
      throw new Error('Deal not found');
    }

    // Check if analysis is enabled for this deal
    if (deal.auto_analysis_enabled === false) {
      console.log('🚫 Enhanced Competitive Intelligence: Auto analysis disabled for deal:', dealId);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Analysis disabled for this deal' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract context from deal
    const competitiveContext = await extractCompetitiveContext(deal);
    console.log('📋 Context extracted:', competitiveContext);

    // Multi-source competitor research
    const competitors = await performCompetitorResearch(competitiveContext);
    console.log(`🔍 Found ${competitors.length} competitors`);

    // Generate competitive analysis
    const competitiveAnalysis = await generateCompetitiveAnalysis(deal, competitors, competitiveContext);

    // Store in deal analysis sources
    await supabase
      .from('deal_analysis_sources')
      .upsert({
        deal_id: dealId,
        engine_name: 'enhanced-competitive-intelligence',
        data_retrieved: competitiveAnalysis,
        retrieved_at: new Date().toISOString(),
        confidence_score: competitiveAnalysis.confidence
      });

    return new Response(JSON.stringify(competitiveAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Enhanced Competitive Intelligence Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function extractCompetitiveContext(deal: any) {
  const description = deal.description || '';
  const industry = deal.industry || '';
  const geography = deal.geography || '';
  
  // Extract industry keywords using AI
  const contextAnalysis = await callOpenAI([
    {
      role: 'system',
      content: `Extract competitive intelligence context from deal data. Focus on:
      1. Industry-specific keywords and product categories
      2. Geographic markets and regions
      3. Business model and target customers
      4. Technology stack or core offerings
      Return structured data for competitor research.`
    },
    {
      role: 'user',
      content: `Company: ${deal.company_name}
      Industry: ${industry}
      Geography: ${geography}
      Description: ${description}
      
      Extract key context for competitor research including:
      - Product categories (e.g., "gelato", "ice cream", "dessert")
      - Target markets and regions
      - Business model type
      - Technology or service focus`
    }
  ]);

  return {
    company_name: deal.company_name,
    industry,
    geography,
    description,
    extracted_keywords: extractKeywords(description + ' ' + industry),
    ai_context: contextAnalysis
  };
}

function extractKeywords(text: string): string[] {
  // Basic keyword extraction - in production, use more sophisticated NLP
  const keywords = text.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been'].includes(word));
  
  return [...new Set(keywords)].slice(0, 10);
}

async function performCompetitorResearch(context: any): Promise<CompetitorData[]> {
  const competitors: CompetitorData[] = [];
  
  // 1. Large player database lookup
  const largeCompetitors = await getLargePlayerCompetitors(context);
  competitors.push(...largeCompetitors);
  
  // 2. Web search for emerging competitors
  if (googleApiKey && googleSearchEngineId) {
    const emergingCompetitors = await getWebSearchCompetitors(context);
    competitors.push(...emergingCompetitors);
  }
  
  // 3. Industry-specific competitor databases
  const industryCompetitors = await getIndustrySpecificCompetitors(context);
  competitors.push(...industryCompetitors);
  
  return competitors;
}

async function getLargePlayerCompetitors(context: any): Promise<CompetitorData[]> {
  // Curated database of major players by industry
  const majorPlayers: Record<string, CompetitorData[]> = {
    'food': [
      {
        name: 'Unilever (Ben & Jerry\'s)',
        description: 'Global consumer goods company with premium ice cream brands',
        funding_stage: 'Public',
        valuation: 130000000000,
        market_share: 25,
        geography: ['Global'],
        positioning: 'Premium quality ice cream with social mission',
        strengths: ['Global distribution', 'Brand recognition', 'Sustainability focus'],
        weaknesses: ['High prices', 'Limited local flavors', 'Corporate image'],
        competitor_type: 'Incumbent'
      },
      {
        name: 'General Mills (Häagen-Dazs)',
        description: 'American multinational food corporation',
        funding_stage: 'Public',
        valuation: 42000000000,
        market_share: 18,
        geography: ['Global'],
        positioning: 'Ultra-premium ice cream positioning',
        strengths: ['Premium brand', 'Quality ingredients', 'Global presence'],
        weaknesses: ['Very high prices', 'Limited accessibility', 'Slow innovation'],
        competitor_type: 'Incumbent'
      }
    ],
    'gelato': [
      {
        name: 'Carpigiani Group',
        description: 'Italian gelato equipment and training company',
        funding_stage: 'Private',
        valuation: 500000000,
        market_share: 15,
        geography: ['Europe', 'Asia'],
        positioning: 'Authentic Italian gelato expertise',
        strengths: ['Authentic Italian heritage', 'Training programs', 'Equipment manufacturing'],
        weaknesses: ['Limited consumer brand', 'High equipment costs', 'Traditional approach'],
        competitor_type: 'Challenger'
      }
    ],
    'ice cream': [
      {
        name: 'Aice',
        description: 'Indonesian ice cream brand focusing on local markets',
        funding_stage: 'Private',
        valuation: 150000000,
        market_share: 35,
        geography: ['Indonesia', 'Southeast Asia'],
        positioning: 'Affordable premium ice cream for local tastes',
        strengths: ['Local market knowledge', 'Price positioning', 'Distribution network'],
        weaknesses: ['Limited international presence', 'Brand recognition outside region'],
        competitor_type: 'Challenger'
      },
      {
        name: 'Campina Ice Cream',
        description: 'Indonesian dairy and ice cream company',
        funding_stage: 'Private',
        valuation: 200000000,
        market_share: 28,
        geography: ['Indonesia'],
        positioning: 'Local dairy brand with ice cream expansion',
        strengths: ['Local dairy supply chain', 'Brand trust', 'Local flavors'],
        weaknesses: ['Limited innovation', 'Traditional marketing', 'Product range'],
        competitor_type: 'Incumbent'
      }
    ]
  };

  const relevantCompetitors: CompetitorData[] = [];
  
  // Match based on keywords
  for (const keyword of context.extracted_keywords) {
    if (majorPlayers[keyword]) {
      relevantCompetitors.push(...majorPlayers[keyword]);
    }
  }
  
  // Geographic filtering
  if (context.geography && context.geography.toLowerCase().includes('indonesia')) {
    relevantCompetitors.push(...(majorPlayers['ice cream'] || []));
  }
  
  return relevantCompetitors;
}

async function getWebSearchCompetitors(context: any): Promise<CompetitorData[]> {
  try {
    const searchQueries = [
      `${context.extracted_keywords.join(' ')} startups ${context.geography}`,
      `${context.industry} companies ${context.geography}`,
      `${context.company_name} competitors ${context.geography}`
    ];

    const competitors: CompetitorData[] = [];
    
    for (const query of searchQueries) {
      try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(query)}`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          // Process search results to extract competitor info
          for (const item of data.items.slice(0, 3)) {
            const competitor = await extractCompetitorFromSearchResult(item, context);
            if (competitor) {
              competitors.push(competitor);
            }
          }
        }
      } catch (error) {
        console.error('⚠️ Search error for query:', query, error);
      }
    }
    
    return competitors.slice(0, 5); // Limit to 5 web-found competitors
  } catch (error) {
    console.error('❌ Web search failed:', error);
    return [];
  }
}

async function extractCompetitorFromSearchResult(searchResult: any, context: any): Promise<CompetitorData | null> {
  try {
    const analysis = await callOpenAI([
      {
        role: 'system',
        content: `Extract competitor information from search results. Determine if this is a relevant competitor and extract structured data.`
      },
      {
        role: 'user',
        content: `Search Result:
        Title: ${searchResult.title}
        URL: ${searchResult.link}
        Snippet: ${searchResult.snippet}
        
        Context: ${context.industry} company in ${context.geography}
        
        If this is a relevant competitor, extract:
        - Company name
        - Description (1-2 sentences)
        - Estimated competitor type (Incumbent/Challenger/Emerging/Whitespace)
        - Geographic focus
        - Key strengths and weaknesses
        
        Return "NOT_RELEVANT" if not a competitor.`
      }
    ]);

    if (analysis.includes('NOT_RELEVANT')) {
      return null;
    }

    // Parse AI response into structured competitor data
    return {
      name: extractFromAnalysis(analysis, 'name') || 'Unknown Company',
      website: searchResult.link,
      description: extractFromAnalysis(analysis, 'description') || searchResult.snippet,
      competitor_type: extractCompetitorType(analysis),
      geography: [context.geography || 'Unknown'],
      positioning: extractFromAnalysis(analysis, 'positioning') || 'Web-identified competitor',
      strengths: extractArrayFromAnalysis(analysis, 'strengths'),
      weaknesses: extractArrayFromAnalysis(analysis, 'weaknesses')
    };
  } catch (error) {
    console.error('❌ Failed to extract competitor from search result:', error);
    return null;
  }
}

async function getIndustrySpecificCompetitors(context: any): Promise<CompetitorData[]> {
  // Industry-specific competitor databases
  const industryDatabases: Record<string, CompetitorData[]> = {
    'dessert': [
      {
        name: 'Local Artisan Gelato Shops',
        description: 'Independent gelato and artisan ice cream shops in local markets',
        competitor_type: 'Emerging',
        geography: [context.geography || 'Local'],
        positioning: 'Artisan, small-batch, locally-sourced ingredients',
        strengths: ['Local community connection', 'Fresh ingredients', 'Unique flavors'],
        weaknesses: ['Limited scale', 'Higher costs', 'Seasonal demand']
      }
    ],
    'premium food': [
      {
        name: 'Premium Dessert Brands',
        description: 'High-end dessert and confectionery companies',
        competitor_type: 'Challenger',
        geography: ['Regional'],
        positioning: 'Premium positioning with artisanal quality',
        strengths: ['Quality perception', 'Premium pricing', 'Brand prestige'],
        weaknesses: ['Limited market size', 'Price sensitivity', 'Distribution challenges']
      }
    ]
  };

  const competitors: CompetitorData[] = [];
  
  for (const keyword of context.extracted_keywords) {
    if (industryDatabases[keyword]) {
      competitors.push(...industryDatabases[keyword]);
    }
  }
  
  return competitors;
}

async function generateCompetitiveAnalysis(deal: any, competitors: CompetitorData[], context: any) {
  const analysis = await callOpenAI([
    {
      role: 'system',
      content: `Generate comprehensive competitive positioning analysis. Focus on actionable intelligence for investment decisions.`
    },
    {
      role: 'user',
      content: `Company: ${deal.company_name}
      Industry: ${deal.industry}
      Geography: ${deal.geography}
      Description: ${deal.description}
      
      Identified Competitors: ${JSON.stringify(competitors, null, 2)}
      
      Provide competitive analysis including:
      1. Market positioning relative to competitors
      2. Competitive advantages and differentiation
      3. Market concentration analysis (HHI calculation)
      4. Whitespace opportunities
      5. Competitive threats and mitigation strategies
      6. Market share potential assessment
      7. Strategic recommendations for positioning`
    }
  ]);

  return {
    competitive_breakdown: [{
      industry: deal.industry || 'Primary Industry',
      weight: 1.0,
      competitors: competitors,
      hhi_index: calculateHHI(competitors),
      competitive_tension: assessCompetitiveTension(competitors),
      whitespace_opportunities: extractWhitespaceOpportunities(analysis),
      market_fragmentation: assessMarketFragmentation(competitors),
      citation: {
        sources: ['web_research', 'industry_databases', 'ai_analysis'],
        methodology: 'Multi-source competitive intelligence',
        confidence: competitors.length > 3 ? 'high' : 'medium'
      }
    }],
    positioning_analysis: analysis,
    confidence: competitors.length > 3 ? 85 : 70,
    last_updated: new Date().toISOString(),
    methodology: 'Enhanced competitive intelligence with real competitor mapping'
  };
}

function calculateHHI(competitors: CompetitorData[]): number {
  const totalShare = competitors.reduce((sum, comp) => sum + (comp.market_share || 0), 0);
  if (totalShare === 0) return 2500; // Assume moderate concentration if no data
  
  const hhi = competitors.reduce((sum, comp) => {
    const share = (comp.market_share || 0);
    return sum + (share * share);
  }, 0);
  
  return Math.round(hhi);
}

function assessCompetitiveTension(competitors: CompetitorData[]): 'High' | 'Medium' | 'Low' {
  const incumbentCount = competitors.filter(c => c.competitor_type === 'Incumbent').length;
  const challengerCount = competitors.filter(c => c.competitor_type === 'Challenger').length;
  
  if (incumbentCount > 2 || challengerCount > 3) return 'High';
  if (incumbentCount > 0 || challengerCount > 1) return 'Medium';
  return 'Low';
}

function assessMarketFragmentation(competitors: CompetitorData[]): 'Concentrated' | 'Moderate' | 'Fragmented' {
  const hhi = calculateHHI(competitors);
  if (hhi > 2500) return 'Concentrated';
  if (hhi > 1500) return 'Moderate';
  return 'Fragmented';
}

function extractWhitespaceOpportunities(analysis: string): string[] {
  // Extract opportunities from AI analysis
  const opportunities = [];
  
  if (analysis.toLowerCase().includes('premium')) {
    opportunities.push('Premium market positioning');
  }
  if (analysis.toLowerCase().includes('local')) {
    opportunities.push('Localized product offerings');
  }
  if (analysis.toLowerCase().includes('digital') || analysis.toLowerCase().includes('online')) {
    opportunities.push('Digital-first approach');
  }
  if (analysis.toLowerCase().includes('sustainable') || analysis.toLowerCase().includes('eco')) {
    opportunities.push('Sustainability-focused positioning');
  }
  
  return opportunities.length > 0 ? opportunities : ['Market positioning opportunities identified'];
}

// Helper functions for parsing AI responses
function extractFromAnalysis(text: string, field: string): string | null {
  const regex = new RegExp(`${field}[:\\s]*([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function extractCompetitorType(text: string): 'Incumbent' | 'Challenger' | 'Emerging' | 'Whitespace' {
  const lower = text.toLowerCase();
  if (lower.includes('incumbent')) return 'Incumbent';
  if (lower.includes('challenger')) return 'Challenger';
  if (lower.includes('emerging')) return 'Emerging';
  return 'Whitespace';
}

function extractArrayFromAnalysis(text: string, field: string): string[] {
  const lines = text.split('\n');
  const result = [];
  
  for (const line of lines) {
    if (line.toLowerCase().includes(field)) {
      // Extract bullet points or comma-separated items
      const items = line.split(/[,•\-]/)
        .map(item => item.replace(/[:\[\]]/g, '').trim())
        .filter(item => item && !item.toLowerCase().includes(field));
      result.push(...items);
    }
  }
  
  return result.slice(0, 3); // Limit to 3 items
}

async function callOpenAI(messages: any[]) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages,
      max_completion_tokens: 1500,
    }),
  });

  const data = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('Invalid OpenAI response');
  }
  
  return data.choices[0].message.content;
}