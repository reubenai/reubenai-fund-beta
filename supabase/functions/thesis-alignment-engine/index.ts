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

interface ThesisAnalysisRequest {
  dealData: any;
  strategyData: any;
  documentData?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealData, strategyData, documentData }: ThesisAnalysisRequest = await req.json();
    
    console.log('🎯 Investment Thesis Alignment Engine: Analyzing deal:', dealData.company_name);
    
    // Analyze alignment with fund strategy
    const alignmentResult = await analyzeThesisAlignment(dealData, strategyData, documentData);
    
    // Store source tracking
    await storeSources(dealData.id, 'thesis-alignment-engine', alignmentResult.sources);
    
    return new Response(JSON.stringify(alignmentResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Thesis Alignment Engine Error:', error);
    return new Response(JSON.stringify({
      score: 50,
      analysis: `Investment thesis alignment analysis failed: ${error.message}`,
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

async function analyzeThesisAlignment(dealData: any, strategyData: any, documentData: any = null) {
  // Validate available data
  const validatedDeal = validateDealData(dealData);
  const validatedStrategy = validateStrategyData(strategyData);
  
  // Enhance deal data with Google Search validation if API keys are available
  let webValidationData = null;
  let enhancedSources = [
    { type: 'database', source: 'investment_strategies', validated: true },
    { type: 'database', source: 'deals', validated: true }
  ];
  
  if (googleSearchApiKey && googleSearchEngineId && validatedDeal.company_name !== 'N/A') {
    try {
      console.log('🔍 Enhancing thesis alignment analysis with Google Search validation');
      webValidationData = await validateCompanyWithGoogleSearch(validatedDeal);
      if (webValidationData && webValidationData.sources) {
        enhancedSources = [...enhancedSources, ...webValidationData.sources];
      }
    } catch (error) {
      console.warn('Google Search validation failed, continuing with database analysis:', error.message);
    }
  }
  
  // Calculate alignment scores with web validation data if available
  const sectorAlignment = calculateSectorAlignment(validatedDeal, validatedStrategy, webValidationData);
  const geographyAlignment = calculateGeographyAlignment(validatedDeal, validatedStrategy, webValidationData);
  const sizeAlignment = calculateSizeAlignment(validatedDeal, validatedStrategy);
  const stageAlignment = calculateStageAlignment(validatedDeal, validatedStrategy);
  
  // Generate detailed analysis using AI with web validation context
  const aiAnalysis = await generateAIAnalysis(validatedDeal, validatedStrategy, {
    sectorAlignment,
    geographyAlignment,
    sizeAlignment,
    stageAlignment
  }, webValidationData);
  
  // Calculate overall alignment score
  const overallScore = calculateOverallAlignmentScore({
    sectorAlignment,
    geographyAlignment,
    sizeAlignment,
    stageAlignment
  });
  
  // Determine confidence level based on data availability and web validation
  const confidence = calculateConfidence(validatedDeal, validatedStrategy, webValidationData);
  
  return {
    score: overallScore,
    analysis: aiAnalysis,
    confidence: confidence,
    sources: enhancedSources,
    data: {
      sector_alignment: sectorAlignment,
      geography_alignment: geographyAlignment,
      size_alignment: sizeAlignment,
      stage_alignment: stageAlignment,
      web_validation: webValidationData?.companyValidation || null,
      key_alignment_points: extractKeyAlignmentPoints({
        sectorAlignment,
        geographyAlignment,
        sizeAlignment,
        stageAlignment
      })
    },
    validation_status: confidence >= 70 ? 'validated' : confidence >= 50 ? 'partial' : 'unvalidated'
  };
}

function validateDealData(dealData: any) {
  return {
    company_name: dealData.company_name || 'N/A',
    industry: dealData.industry || 'N/A',
    location: dealData.location || 'N/A',
    deal_size: dealData.deal_size || null,
    valuation: dealData.valuation || null,
    stage: inferStageFromData(dealData),
    description: dealData.description || 'N/A'
  };
}

function validateStrategyData(strategyData: any) {
  if (!strategyData) {
    return {
      industries: [],
      geography: [],
      min_investment_amount: null,
      max_investment_amount: null,
      key_signals: [],
      hasStrategy: false
    };
  }
  
  return {
    industries: strategyData.industries || [],
    geography: strategyData.geography || [],
    min_investment_amount: strategyData.min_investment_amount || null,
    max_investment_amount: strategyData.max_investment_amount || null,
    key_signals: strategyData.key_signals || [],
    hasStrategy: true
  };
}

function calculateSectorAlignment(dealData: any, strategyData: any, webValidationData: any = null): { score: number, details: string } {
  if (!strategyData.hasStrategy || !strategyData.industries.length) {
    return { score: 50, details: "No sector preferences defined in fund strategy" };
  }
  
  if (dealData.industry === 'N/A') {
    return { score: 40, details: "Company industry not specified" };
  }
  
  // Check for exact match
  const exactMatch = strategyData.industries.some((industry: string) => 
    dealData.industry.toLowerCase().includes(industry.toLowerCase()) ||
    industry.toLowerCase().includes(dealData.industry.toLowerCase())
  );
  
  if (exactMatch) {
    return { score: 95, details: `Strong sector alignment - ${dealData.industry} matches fund focus` };
  }
  
  // Check for adjacent sectors (simplified logic)
  const adjacentMatch = strategyData.industries.some((industry: string) => {
    const industryKeywords = industry.toLowerCase().split(/[\s&,]+/);
    const dealKeywords = dealData.industry.toLowerCase().split(/[\s&,]+/);
    return industryKeywords.some(keyword => dealKeywords.includes(keyword));
  });
  
  if (adjacentMatch) {
    return { score: 70, details: `Moderate sector alignment - ${dealData.industry} adjacent to fund focus` };
  }
  
  return { score: 25, details: `Poor sector alignment - ${dealData.industry} outside fund focus areas` };
}

function calculateGeographyAlignment(dealData: any, strategyData: any, webValidationData: any = null): { score: number, details: string } {
  if (!strategyData.hasStrategy || !strategyData.geography.length) {
    return { score: 50, details: "No geographic preferences defined in fund strategy" };
  }
  
  if (dealData.location === 'N/A') {
    return { score: 40, details: "Company location not specified" };
  }
  
  // Check for geographic match (simplified)
  const geoMatch = strategyData.geography.some((geo: string) => 
    dealData.location.toLowerCase().includes(geo.toLowerCase()) ||
    geo.toLowerCase().includes(dealData.location.toLowerCase())
  );
  
  if (geoMatch) {
    return { score: 90, details: `Strong geographic alignment - ${dealData.location} within fund geography` };
  }
  
  return { score: 30, details: `Geographic misalignment - ${dealData.location} outside target regions` };
}

function calculateSizeAlignment(dealData: any, strategyData: any): { score: number, details: string } {
  if (!strategyData.hasStrategy || (!strategyData.min_investment_amount && !strategyData.max_investment_amount)) {
    return { score: 50, details: "No deal size preferences defined in fund strategy" };
  }
  
  if (!dealData.deal_size) {
    return { score: 40, details: "Deal size not specified" };
  }
  
  const minCheck = !strategyData.min_investment_amount || dealData.deal_size >= strategyData.min_investment_amount;
  const maxCheck = !strategyData.max_investment_amount || dealData.deal_size <= strategyData.max_investment_amount;
  
  if (minCheck && maxCheck) {
    return { score: 95, details: `Perfect size alignment - ${formatCurrency(dealData.deal_size)} within target range` };
  } else if (minCheck && !maxCheck) {
    return { score: 60, details: `Deal size ${formatCurrency(dealData.deal_size)} above maximum preference` };
  } else if (!minCheck && maxCheck) {
    return { score: 60, details: `Deal size ${formatCurrency(dealData.deal_size)} below minimum preference` };
  }
  
  return { score: 25, details: `Deal size ${formatCurrency(dealData.deal_size)} outside target range` };
}

function calculateStageAlignment(dealData: any, strategyData: any): { score: number, details: string } {
  const inferredStage = dealData.stage;
  
  if (inferredStage === 'unknown') {
    return { score: 40, details: "Company stage could not be determined from available data" };
  }
  
  // Simplified stage matching - in reality this would be more sophisticated
  return { score: 70, details: `Estimated company stage: ${inferredStage}` };
}

function inferStageFromData(dealData: any): string {
  // Simple heuristics to infer stage from available data
  if (dealData.valuation && dealData.valuation > 100000000) {
    return "growth";
  } else if (dealData.deal_size && dealData.deal_size > 10000000) {
    return "series-b+";
  } else if (dealData.deal_size && dealData.deal_size > 3000000) {
    return "series-a";
  } else if (dealData.deal_size && dealData.deal_size > 500000) {
    return "seed";
  }
  
  return "unknown";
}

function calculateOverallAlignmentScore(alignmentScores: any): number {
  const weights = {
    sectorAlignment: 0.4,
    geographyAlignment: 0.25,
    sizeAlignment: 0.25,
    stageAlignment: 0.1
  };
  
  return Math.round(
    alignmentScores.sectorAlignment.score * weights.sectorAlignment +
    alignmentScores.geographyAlignment.score * weights.geographyAlignment +
    alignmentScores.sizeAlignment.score * weights.sizeAlignment +
    alignmentScores.stageAlignment.score * weights.stageAlignment
  );
}

function calculateConfidence(dealData: any, strategyData: any, webValidationData: any = null): number {
  let confidence = 0;
  let factors = 0;
  
  // Data completeness factors
  if (dealData.industry !== 'N/A') { confidence += 25; factors++; }
  if (dealData.location !== 'N/A') { confidence += 25; factors++; }
  if (dealData.deal_size) { confidence += 25; factors++; }
  if (strategyData.hasStrategy) { confidence += 25; factors++; }
  
  return factors > 0 ? Math.round(confidence / factors) : 30;
}

function extractKeyAlignmentPoints(alignmentScores: any): string[] {
  const points: string[] = [];
  
  Object.entries(alignmentScores).forEach(([key, value]: [string, any]) => {
    if (value.score >= 80) {
      points.push(`✅ ${value.details}`);
    } else if (value.score <= 40) {
      points.push(`❌ ${value.details}`);
    } else {
      points.push(`⚠️ ${value.details}`);
    }
  });
  
  return points;
}

async function generateAIAnalysis(dealData: any, strategyData: any, alignmentScores: any, webValidationData: any = null): Promise<string> {
  const hasStrategy = strategyData.hasStrategy;
  const enhancedCriteria = strategyData.enhanced_criteria || {};
  
  // Extract subcategory requirements for deeper analysis
  const strategicRequirements: string[] = [];
  if (enhancedCriteria.categories) {
    enhancedCriteria.categories.forEach((category: any) => {
      if (category.subcategories) {
        category.subcategories.forEach((sub: any) => {
          if (sub.requirements && sub.enabled) {
            strategicRequirements.push(`${category.name} - ${sub.name}: ${sub.requirements}`);
          }
        });
      }
    });
  }
  
  const prompt = `Analyze investment thesis alignment for this deal:

DEAL INFORMATION:
- Company: ${dealData.company_name}
- Industry: ${dealData.industry}
- Location: ${dealData.location}  
- Deal Size: ${dealData.deal_size ? formatCurrency(dealData.deal_size) : 'N/A'}
- Estimated Stage: ${dealData.stage}

${hasStrategy ? `FUND STRATEGY:
- Target Industries: ${strategyData.industries.join(', ') || 'N/A'}
- Target Geography: ${strategyData.geography.join(', ') || 'N/A'}
- Investment Range: ${strategyData.min_investment_amount ? formatCurrency(strategyData.min_investment_amount) : 'N/A'} - ${strategyData.max_investment_amount ? formatCurrency(strategyData.max_investment_amount) : 'N/A'}
- Key Signals: ${strategyData.key_signals.join(', ') || 'N/A'}
- Investment Philosophy: ${strategyData.investment_philosophy || 'N/A'}

DETAILED INVESTMENT CRITERIA:
${strategicRequirements.length > 0 ? strategicRequirements.join('\n') : 'No detailed criteria requirements defined'}` : 'No fund strategy defined - using general investment criteria'}

ALIGNMENT ANALYSIS:
- Sector Alignment: ${alignmentScores.sectorAlignment.score}/100
- Geography Alignment: ${alignmentScores.geographyAlignment.score}/100  
- Size Alignment: ${alignmentScores.sizeAlignment.score}/100
- Stage Alignment: ${alignmentScores.stageAlignment.score}/100

Provide a focused analysis (2-3 sentences) on how well this deal aligns with the ${hasStrategy ? 'fund strategy and detailed investment criteria' : 'general investment criteria'}. Include specific alignment strengths or concerns based on the detailed requirements.`;

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
            content: 'You are an investment analyst focused on thesis alignment. Analyze ONLY the provided data. Use "N/A" when data is missing. Be concise and specific about alignment factors.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 300
      }),
    });

    if (!response.ok) throw new Error('OpenAI API error');
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    
    // Fallback analysis based on scores
    const overallScore = calculateOverallAlignmentScore(alignmentScores);
    if (overallScore >= 80) {
      return `Strong thesis alignment (${overallScore}/100). Deal matches key fund criteria across sector, geography, and size parameters.`;
    } else if (overallScore >= 60) {
      return `Moderate thesis alignment (${overallScore}/100). Deal shows alignment in some areas but may have mismatches in others.`;
    } else {
      return `Limited thesis alignment (${overallScore}/100). Deal appears to fall outside core fund investment criteria.`;
    }
  }
}

async function storeSources(dealId: string, engineName: string, sources: any[]) {
  try {
    const sourceRecords = sources.map(source => ({
      deal_id: dealId,
      engine_name: engineName,
      source_type: source.type,
      source_url: source.source,
      confidence_score: source.validated ? 90 : 60,
      validated: source.validated,
      data_retrieved: {},
      retrieved_at: new Date().toISOString()
    }));
    
    await supabase
      .from('deal_analysis_sources')
      .insert(sourceRecords);
  } catch (error) {
    console.error('Error storing sources:', error);
  }
}

async function validateCompanyWithGoogleSearch(dealData: any) {
  if (!googleSearchApiKey || !googleSearchEngineId) {
    return null;
  }

  try {
    // Perform targeted company validation searches
    const searchQueries = [
      `"${dealData.company_name}" ${dealData.industry}`,
      `"${dealData.company_name}" company ${dealData.location}`,
      `"${dealData.company_name}" funding website`
    ];

    const searchResults = await performGoogleSearches(searchQueries.slice(0, 2)); // Limit to 2 searches
    
    const sources = searchResults.map(result => ({
      type: 'web_search',
      source: result.link || 'google_search',
      title: result.title || 'Search Result',
      validated: true,
      confidence: calculateSearchResultConfidence(result, dealData)
    }));

    // Basic company validation based on search results
    const hasStrongWebPresence = searchResults.length >= 2;
    const hasRelevantContent = searchResults.some(result => 
      result.title?.toLowerCase().includes(dealData.company_name.toLowerCase()) ||
      result.snippet?.toLowerCase().includes(dealData.company_name.toLowerCase())
    );

    return {
      companyValidation: {
        web_presence_confirmed: hasStrongWebPresence,
        relevant_content_found: hasRelevantContent,
        search_result_count: searchResults.length
      },
      sources: sources
    };
  } catch (error) {
    console.error('Google Search validation error:', error);
    return null;
  }
}

async function performGoogleSearches(queries: string[]) {
  const results: any[] = [];
  
  for (const query of queries) {
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      const searchResult = await performSingleGoogleSearch(query);
      if (searchResult && searchResult.items) {
        results.push(...searchResult.items.slice(0, 3)); // Top 3 results per query
      }
    } catch (error) {
      console.warn(`Search failed for query "${query}":`, error.message);
    }
  }
  
  return results;
}

async function performSingleGoogleSearch(query: string) {
  try {
    const cleanQuery = query.replace(/[^\w\s".-]/g, '').trim();
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleSearchApiKey}&cx=${googleSearchEngineId}&q=${encodeURIComponent(cleanQuery)}&num=3&safe=active`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Single Google search error:', error);
    return null;
  }
}

function calculateSearchResultConfidence(result: any, dealData: any): number {
  let confidence = 50;
  
  if (result.title?.toLowerCase().includes(dealData.company_name.toLowerCase())) {
    confidence += 30;
  }
  
  if (result.snippet?.toLowerCase().includes(dealData.company_name.toLowerCase())) {
    confidence += 20;
  }
  
  return Math.min(confidence, 90);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: amount >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: 0,
  }).format(amount);
}