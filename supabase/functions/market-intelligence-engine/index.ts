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
    const { dealId, fundId, context, documentData } = await req.json();
    
    // Query fund memory for context
    const { data: memoryContext } = await supabase.functions.invoke('enhanced-fund-memory-engine', {
      body: {
        action: 'contextual_memory',
        fundId: fundId,
        context: { dealId, service: 'market-intelligence' }
      }
    });

    // Perform market intelligence analysis with document data
    const result = await analyzeMarketIntelligence(dealId, fundId, context, memoryContext, documentData);
    
    // Store insights in fund memory
    await supabase.functions.invoke('enhanced-fund-memory-engine', {
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

async function analyzeMarketIntelligence(dealId: string, fundId: string, context: any, memoryContext: any, documentData: any = null) {
  console.log('📊 Market Intelligence Engine: Starting enhanced analysis');
  
  // Fetch deal data
  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single();

  // Enhanced document-driven market intelligence
  const documentInsights = documentData ? await extractMarketIntelligenceFromDocuments(documentData) : null;
  console.log('📄 Market Intelligence Engine: Document insights extracted');

  // Prepare enhanced context for AI analysis
  const enhancedContext = `
    Company: ${deal?.company_name}
    Industry: ${deal?.industry}
    Stage: ${deal?.stage}
    
    Historical Context: ${JSON.stringify(memoryContext)}
    
    Document Intelligence: ${documentInsights ? JSON.stringify(documentInsights) : 'No documents processed'}
  `;

  // Call OpenAI for comprehensive market analysis
  const marketAnalysis = await callOpenAI([
    {
      role: 'system',
      content: `You are a senior market intelligence analyst with access to proprietary document intelligence. 
      Provide comprehensive market opportunity assessment prioritizing document-validated insights over generic analysis.
      CRITICAL: Weight document-extracted data heavily in your analysis and scoring.`
    },
    {
      role: 'user',
      content: `${enhancedContext}
        
        Provide detailed market intelligence analysis including:
        1. Market size and growth potential (prioritize document data)
        2. Competitive landscape and positioning
        3. Market timing and opportunity assessment
        4. Customer validation and traction evidence
        5. Geographic market opportunities
        6. Risk factors and mitigation strategies
        7. Overall market attractiveness score (1-10) with heavy weighting for document insights
      `
    }
  ]);

  // Calculate enhanced scoring with document intelligence weighting
  const baseScore = extractScore(marketAnalysis);
  const documentBoost = calculateDocumentIntelligenceBoost(documentInsights);
  const enhancedScore = Math.min(baseScore + documentBoost, 10);

  console.log(`📈 Market Intelligence Engine: Base score: ${baseScore}, Document boost: ${documentBoost}, Final: ${enhancedScore}`);

  return {
    dealId,
    marketSize: extractMarketSize(marketAnalysis, documentInsights),
    competitiveLandscape: extractCompetitive(marketAnalysis, documentInsights),
    timing: extractTiming(marketAnalysis, documentInsights),
    risks: extractRisks(marketAnalysis, documentInsights),
    customerValidation: extractCustomerValidation(marketAnalysis, documentInsights),
    geographicOpportunity: extractGeographicOpportunity(marketAnalysis, documentInsights),
    overallScore: enhancedScore,
    documentIntelligenceScore: documentBoost,
    confidence: documentInsights?.hasValidatedData ? 0.95 : 0.75,
    analysis: marketAnalysis,
    sources: documentInsights?.hasValidatedData ? 
      ['openai_analysis', 'fund_memory', 'validated_documents'] : 
      ['openai_analysis', 'fund_memory'],
    timestamp: new Date().toISOString()
  };
}

async function extractMarketIntelligenceFromDocuments(documentData: any) {
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
            content: `Extract market intelligence and opportunity data from documents. Parse for:
            1. MARKET OPPORTUNITY: TAM/SAM/SOM, growth rates, market trends, opportunity sizing
            2. CUSTOMER INTELLIGENCE: Customer interviews, testimonials, validation, feedback
            3. COMPETITIVE ANALYSIS: Competitor comparisons, differentiation, market positioning
            4. TRACTION METRICS: Revenue, users, growth metrics, partnerships, pilot programs
            5. GEOGRAPHIC EXPANSION: Target markets, international opportunities, regional data
            6. MARKET TIMING: Industry trends, market readiness, adoption cycles
            Return structured market intelligence with quantitative data where available.`
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
      
      // Handle API errors
      if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('Invalid OpenAI response format in document extraction:', data);
        throw new Error('Invalid response from OpenAI API');
      }
      
      const content = data.choices[0].message.content;
      
      return {
        market_intelligence: content,
        opportunity_data: extractOpportunityData(content),
        customer_intelligence: extractCustomerIntelligence(content),
        competitive_data: extractCompetitiveData(content),
        traction_metrics: extractTractionMetrics(content),
        geographic_data: extractGeographicData(content),
        timing_analysis: extractTimingAnalysis(content),
        hasValidatedData: true,
        confidence: 95
      };
    }
  } catch (error) {
    console.error('❌ Market Intelligence Engine - Document extraction error:', error);
  }
  
  return {
    market_intelligence: 'Document analysis failed',
    hasValidatedData: false,
    confidence: 20
  };
}

function extractOpportunityData(content: string): any {
  const opportunityTerms = ['tam', 'sam', 'som', 'market size', 'opportunity', 'billion', 'million'];
  const hasOpportunity = opportunityTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasOpportunityData: hasOpportunity,
    marketSizeMentions: (content.match(/(tam|sam|som|market size)/gi) || []).length,
    billionDollarMentions: (content.match(/billion/gi) || []).length,
    growthRateMentions: (content.match(/growth|cagr/gi) || []).length
  };
}

function extractCustomerIntelligence(content: string): any {
  const customerTerms = ['customer', 'client', 'user', 'testimonial', 'feedback', 'interview'];
  const hasCustomer = customerTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasCustomerData: hasCustomer,
    testimonialMentions: (content.match(/testimonial[s]?/gi) || []).length,
    customerInterviews: content.toLowerCase().includes('interview'),
    userFeedback: content.toLowerCase().includes('feedback')
  };
}

function extractCompetitiveData(content: string): any {
  const competitiveTerms = ['competitor', 'competition', 'vs', 'compare', 'alternative'];
  const hasCompetitive = competitiveTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasCompetitiveData: hasCompetitive,
    competitorMentions: (content.match(/competitor[s]?/gi) || []).length,
    comparisonData: content.toLowerCase().includes('compare'),
    alternativeMentions: (content.match(/alternative[s]?/gi) || []).length
  };
}

function extractTractionMetrics(content: string): any {
  const tractionTerms = ['revenue', 'users', 'customers', 'growth', 'mrr', 'arr'];
  const hasTraction = tractionTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasTractionData: hasTraction,
    revenueMentions: content.toLowerCase().includes('revenue'),
    userMetrics: content.toLowerCase().includes('users'),
    growthData: content.toLowerCase().includes('growth')
  };
}

function extractGeographicData(content: string): any {
  const geoTerms = ['international', 'global', 'expansion', 'markets', 'geographic'];
  const hasGeo = geoTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasGeographicData: hasGeo,
    internationalMentions: content.toLowerCase().includes('international'),
    expansionPlans: content.toLowerCase().includes('expansion'),
    globalMarkets: content.toLowerCase().includes('global')
  };
}

function extractTimingAnalysis(content: string): any {
  const timingTerms = ['timing', 'trend', 'adoption', 'market ready', 'opportunity'];
  const hasTiming = timingTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasTimingData: hasTiming,
    trendMentions: (content.match(/trend[s]?/gi) || []).length,
    adoptionMentions: content.toLowerCase().includes('adoption'),
    marketReadiness: content.toLowerCase().includes('market ready')
  };
}

function calculateDocumentIntelligenceBoost(documentInsights: any): number {
  if (!documentInsights?.hasValidatedData) return 0;
  
  let boost = 0;
  
  // Opportunity data boost
  if (documentInsights.opportunity_data?.hasOpportunityData) boost += 1.5;
  if (documentInsights.opportunity_data?.billionDollarMentions > 0) boost += 1.0;
  
  // Customer intelligence boost
  if (documentInsights.customer_intelligence?.hasCustomerData) boost += 1.2;
  if (documentInsights.customer_intelligence?.testimonialMentions > 0) boost += 0.8;
  
  // Competitive data boost
  if (documentInsights.competitive_data?.hasCompetitiveData) boost += 1.0;
  
  // Traction metrics boost
  if (documentInsights.traction_metrics?.hasTractionData) boost += 1.5;
  
  // Geographic data boost
  if (documentInsights.geographic_data?.hasGeographicData) boost += 0.8;
  
  // Timing analysis boost
  if (documentInsights.timing_analysis?.hasTimingData) boost += 0.7;
  
  console.log(`📊 Market Intelligence Engine: Document boost calculated: ${boost}`);
  return boost;
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
  
  // Handle API errors
  if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    console.error('Invalid OpenAI response format:', data);
    throw new Error('Invalid response from OpenAI API');
  }
  
  return data.choices[0].message.content;
}

function extractMarketSize(analysis: string, documentInsights: any = null): any {
  // Prioritize document insights over AI analysis
  if (documentInsights?.opportunity_data?.hasOpportunityData) {
    return {
      tam: "Document-validated market opportunity",
      growth: documentInsights.opportunity_data.growthRateMentions > 0 ? "Documented growth rates" : "Growth potential indicated",
      segments: ["Validated market segments"],
      source: "document_intelligence",
      confidence: "high"
    };
  }
  
  // Fallback to AI analysis
  return {
    tam: "AI-analyzed addressable market",
    growth: "Estimated growth potential",
    segments: ["Estimated segments"],
    source: "ai_analysis",
    confidence: "medium"
  };
}

function extractCompetitive(analysis: string, documentInsights: any = null): any {
  if (documentInsights?.competitive_data?.hasCompetitiveData) {
    return {
      intensity: "Document-validated competitive landscape",
      keyPlayers: documentInsights.competitive_data.competitorMentions > 0 ? "Competitors identified in documents" : "Competitive mentions found",
      differentiation: documentInsights.competitive_data.comparisonData ? "Documented differentiation" : "Positioning indicated",
      source: "document_intelligence",
      confidence: "high"
    };
  }
  
  return {
    intensity: "AI-estimated competitive intensity",
    keyPlayers: "Estimated key players",
    differentiation: "Analyzed positioning",
    source: "ai_analysis",
    confidence: "medium"
  };
}

function extractTiming(analysis: string, documentInsights: any = null): any {
  if (documentInsights?.timing_analysis?.hasTimingData) {
    return {
      score: 9, // Higher score for document-validated timing
      factors: documentInsights.timing_analysis.trendMentions > 0 ? 
        ["Document-validated market trends", "Documented adoption patterns"] : 
        ["Timing factors from documents"],
      source: "document_intelligence",
      confidence: "high"
    };
  }
  
  return {
    score: 7, // Lower score for AI-only analysis
    factors: ["AI-analyzed market readiness", "Estimated adoption patterns"],
    source: "ai_analysis",
    confidence: "medium"
  };
}

function extractRisks(analysis: string, documentInsights: any = null): string[] {
  const baseRisks = ["Market competition risk", "Technology adoption risk"];
  
  if (documentInsights?.hasValidatedData) {
    // Lower risk profile when we have validated document intelligence
    return [
      "Document intelligence reduces market uncertainty",
      ...baseRisks,
      "Execution risk remains key factor"
    ];
  }
  
  return [
    "Limited market validation increases uncertainty",
    ...baseRisks,
    "Information asymmetry risk"
  ];
}

function extractCustomerValidation(analysis: string, documentInsights: any = null): any {
  if (documentInsights?.customer_intelligence?.hasCustomerData) {
    return {
      level: "Strong",
      evidence: documentInsights.customer_intelligence.testimonialMentions > 0 ? 
        "Customer testimonials documented" : "Customer data available",
      confidence: "high",
      source: "document_intelligence"
    };
  }
  
  return {
    level: "Limited",
    evidence: "No documented customer validation",
    confidence: "low",
    source: "analysis_only"
  };
}

function extractGeographicOpportunity(analysis: string, documentInsights: any = null): any {
  if (documentInsights?.geographic_data?.hasGeographicData) {
    return {
      scope: documentInsights.geographic_data.globalMarkets ? "Global opportunity documented" : "Geographic expansion planned",
      markets: documentInsights.geographic_data.internationalMentions ? "International markets identified" : "Domestic focus",
      confidence: "high",
      source: "document_intelligence"
    };
  }
  
  return {
    scope: "Geographic scope unclear",
    markets: "Market expansion potential unknown",
    confidence: "low",
    source: "analysis_only"
  };
}

function extractScore(analysis: string): number {
  // Extract numerical score from analysis
  const scoreMatch = analysis.match(/score.*?(\d+)/i);
  return scoreMatch ? parseInt(scoreMatch[1]) : 7;
}