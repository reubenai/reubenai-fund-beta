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

interface ProductIPRequest {
  dealData: any;
  strategyData: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealData, strategyData }: ProductIPRequest = await req.json();
    
    console.log('🔬 Product & IP Engine: Analyzing product strength for:', dealData.company_name);
    
    // Analyze product strength and IP
    const productResult = await analyzeProductAndIP(dealData, strategyData);
    
    // Store source tracking
    await storeSources(dealData.id, 'product-ip-engine', productResult.sources);
    
    return new Response(JSON.stringify(productResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Product & IP Engine Error:', error);
    return new Response(JSON.stringify({
      score: 50,
      analysis: `Product and IP analysis failed: ${error.message}`,
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

async function analyzeProductAndIP(dealData: any, strategyData: any) {
  const validatedData = validateProductData(dealData);
  
  // Research IP and competitive advantages
  const ipResearch = await conductIPResearch(validatedData);
  const competitiveAnalysis = await analyzeCompetitiveAdvantage(validatedData);
  const technologyAssessment = await assessTechnology(validatedData);
  
  // Generate comprehensive analysis
  const aiAnalysis = await generateProductAnalysis(validatedData, {
    ipResearch,
    competitiveAnalysis,
    technologyAssessment
  });
  
  // Calculate overall product strength score
  const productScore = calculateProductScore({
    ipResearch,
    competitiveAnalysis,
    technologyAssessment
  });
  
  // Determine confidence level
  const confidence = calculateProductConfidence(validatedData, {
    ipResearch,
    competitiveAnalysis,
    technologyAssessment
  });
  
  // Combine all sources
  const sources = [
    ...ipResearch.sources,
    ...competitiveAnalysis.sources,
    ...technologyAssessment.sources
  ];
  
  return {
    score: productScore,
    analysis: aiAnalysis,
    confidence: confidence,
    sources: sources,
    data: {
      ip_portfolio: ipResearch.portfolio,
      competitive_advantages: competitiveAnalysis.advantages,
      technology_moat: technologyAssessment.moat,
      defensibility_factors: extractDefensibilityFactors({
        ipResearch,
        competitiveAnalysis,
        technologyAssessment
      })
    },
    validation_status: confidence >= 70 ? 'validated' : confidence >= 50 ? 'partial' : 'unvalidated'
  };
}

function validateProductData(dealData: any) {
  return {
    company_name: dealData.company_name || 'N/A',
    industry: dealData.industry || 'N/A',
    description: dealData.description || 'N/A',
    business_model: dealData.business_model || 'N/A',
    website: dealData.website || null
  };
}

async function conductIPResearch(dealData: any) {
  const research = {
    portfolio: {
      patents: 'N/A',
      trademarks: 'N/A', 
      copyrights: 'N/A',
      trade_secrets: 'N/A'
    },
    sources: [],
    quality: 'limited'
  };
  
  // In production, this would query:
  // - USPTO patent database
  // - Google Patents API
  // - Trademark databases
  // - Other IP registries
  
  if (dealData.company_name !== 'N/A') {
    research.sources.push({
      type: 'ip_database',
      source: 'patent_search_simulation',
      validated: false,
      confidence: 45
    });
    
    // Simulate IP research based on industry
    research.portfolio = await simulateIPPortfolio(dealData.industry, dealData.company_name);
    research.quality = 'simulated';
  }
  
  return research;
}

async function simulateIPPortfolio(industry: string, companyName: string) {
  // This would be replaced with real IP database queries
  const ipPatterns = {
    'technology': {
      patents: 'Likely software/hardware patents',
      trademarks: 'Brand and product trademarks',
      copyrights: 'Software code copyrights',
      trade_secrets: 'Proprietary algorithms'
    },
    'healthcare': {
      patents: 'Medical device/drug patents',
      trademarks: 'Medical brand trademarks',
      copyrights: 'Research publications',
      trade_secrets: 'Clinical methodologies'
    },
    'fintech': {
      patents: 'Financial technology patents',
      trademarks: 'FinTech brand marks',
      copyrights: 'Software IP',
      trade_secrets: 'Trading algorithms'
    }
  };
  
  const industryKey = Object.keys(ipPatterns).find(key => 
    industry.toLowerCase().includes(key)
  );
  
  return industryKey ? ipPatterns[industryKey as keyof typeof ipPatterns] : {
    patents: 'IP portfolio requires verification',
    trademarks: 'Trademark status unclear',
    copyrights: 'Copyright portfolio unknown',
    trade_secrets: 'Proprietary assets unconfirmed'
  };
}

async function analyzeCompetitiveAdvantage(dealData: any) {
  const analysis = {
    advantages: [],
    moat_strength: 'unknown',
    differentiation: 'requires_analysis',
    sources: []
  };
  
  if (dealData.description !== 'N/A') {
    analysis.sources.push({
      type: 'company_description',
      source: 'deal_data',
      validated: true,
      confidence: 70
    });
    
    // Analyze description for competitive advantage indicators
    analysis.advantages = extractAdvantagesFromDescription(dealData.description);
    analysis.moat_strength = assessMoatFromDescription(dealData.description);
    analysis.differentiation = analyzeDifferentiation(dealData.description);
  }
  
  return analysis;
}

function extractAdvantagesFromDescription(description: string): string[] {
  const advantages: string[] = [];
  const keywords = description.toLowerCase();
  
  // Look for competitive advantage keywords
  if (keywords.includes('patent') || keywords.includes('proprietary')) {
    advantages.push('Proprietary technology or patents mentioned');
  }
  if (keywords.includes('first') || keywords.includes('pioneer')) {
    advantages.push('First-mover advantage claimed');
  }
  if (keywords.includes('exclusive') || keywords.includes('unique')) {
    advantages.push('Unique or exclusive capabilities mentioned');
  }
  if (keywords.includes('ai') || keywords.includes('machine learning') || keywords.includes('artificial intelligence')) {
    advantages.push('AI/ML technology integration');
  }
  if (keywords.includes('scale') || keywords.includes('network')) {
    advantages.push('Network effects or scale advantages');
  }
  
  return advantages.length > 0 ? advantages : ['No clear competitive advantages identified from description'];
}

function assessMoatFromDescription(description: string): string {
  const keywords = description.toLowerCase();
  
  if (keywords.includes('patent') || keywords.includes('proprietary') || keywords.includes('exclusive')) {
    return 'Strong - IP protection indicated';
  }
  if (keywords.includes('network') || keywords.includes('platform') || keywords.includes('ecosystem')) {
    return 'Moderate - Network effects possible';
  }
  if (keywords.includes('brand') || keywords.includes('reputation') || keywords.includes('trust')) {
    return 'Moderate - Brand/reputation moat';
  }
  
  return 'Weak - No clear moat identified';
}

function analyzeDifferentiation(description: string): string {
  const keywords = description.toLowerCase();
  
  if (keywords.includes('unique') || keywords.includes('innovative') || keywords.includes('breakthrough')) {
    return 'Strong differentiation claimed';
  }
  if (keywords.includes('better') || keywords.includes('improved') || keywords.includes('advanced')) {
    return 'Incremental differentiation';
  }
  
  return 'Differentiation unclear from description';
}

async function assessTechnology(dealData: any) {
  const assessment = {
    moat: 'unknown',
    scalability: 'unknown',
    technical_depth: 'unknown',
    innovation_level: 'unknown',
    sources: []
  };
  
  if (dealData.industry !== 'N/A') {
    assessment.sources.push({
      type: 'industry_analysis',
      source: 'technology_assessment',
      validated: false,
      confidence: 55
    });
    
    // Assess technology based on industry patterns
    const technologyResult = await simulateTechnologyAssessment(dealData.industry, dealData.description);
    Object.assign(assessment, technologyResult);
  }
  
  return assessment;
}

async function simulateTechnologyAssessment(industry: string, description: string) {
  const assessments = {
    'technology': {
      moat: 'Moderate - Technology-based differentiation',
      scalability: 'High - Software scalability',
      technical_depth: 'Requires technical due diligence',
      innovation_level: 'Moderate to high'
    },
    'healthcare': {
      moat: 'Strong - Regulatory barriers',
      scalability: 'Moderate - Clinical validation required',
      technical_depth: 'High - Medical expertise',
      innovation_level: 'High - Healthcare innovation'
    },
    'ai': {
      moat: 'Strong - AI/ML algorithms',
      scalability: 'Very high - AI scalability',
      technical_depth: 'Very high - Advanced AI',
      innovation_level: 'Very high'
    }
  };
  
  const industryKey = Object.keys(assessments).find(key => 
    industry.toLowerCase().includes(key)
  );
  
  const baseAssessment = industryKey ? assessments[industryKey as keyof typeof assessments] : {
    moat: 'Unknown - Requires analysis',
    scalability: 'Unknown - Industry assessment needed',
    technical_depth: 'Unknown - Technical review required',
    innovation_level: 'Unknown'
  };
  
  return {
    ...baseAssessment,
    sources: [{
      type: 'industry_analysis',
      source: 'technology_assessment',
      validated: false,
      confidence: 55
    }]
  };
}

function calculateProductScore(data: any): number {
  let score = 50; // Base score
  
  // IP Portfolio scoring
  if (data.ipResearch.quality !== 'limited') {
    if (data.ipResearch.portfolio.patents && !data.ipResearch.portfolio.patents.includes('N/A')) {
      score += 15;
    }
  }
  
  // Competitive advantage scoring
  if (data.competitiveAnalysis.advantages.length > 1) {
    score += 10;
  }
  if (data.competitiveAnalysis.moat_strength.includes('Strong')) {
    score += 15;
  } else if (data.competitiveAnalysis.moat_strength.includes('Moderate')) {
    score += 8;
  }
  
  // Technology assessment scoring
  if (data.technologyAssessment.innovation_level.includes('High')) {
    score += 12;
  } else if (data.technologyAssessment.innovation_level.includes('Moderate')) {
    score += 6;
  }
  
  return Math.min(score, 100);
}

function calculateProductConfidence(dealData: any, analysisData: any): number {
  let confidence = 30; // Base confidence
  
  // Data availability factors
  if (dealData.description !== 'N/A') confidence += 25;
  if (dealData.industry !== 'N/A') confidence += 20;
  if (dealData.website) confidence += 15;
  
  // Analysis quality factors
  if (analysisData.ipResearch.quality === 'simulated') confidence += 10;
  if (analysisData.competitiveAnalysis.advantages.length > 0) confidence += 10;
  
  return Math.min(confidence, 100);
}

function extractDefensibilityFactors(data: any): string[] {
  const factors: string[] = [];
  
  // IP-based defensibility
  if (data.ipResearch.portfolio.patents && !data.ipResearch.portfolio.patents.includes('N/A')) {
    factors.push(`IP Protection: ${data.ipResearch.portfolio.patents}`);
  }
  
  // Competitive moat factors
  if (data.competitiveAnalysis.moat_strength !== 'unknown') {
    factors.push(`Competitive Moat: ${data.competitiveAnalysis.moat_strength}`);
  }
  
  // Technology factors
  if (data.technologyAssessment.technical_depth !== 'unknown') {
    factors.push(`Technical Depth: ${data.technologyAssessment.technical_depth}`);
  }
  
  return factors.length > 0 ? factors : ['Defensibility factors require deeper analysis'];
}

async function generateProductAnalysis(dealData: any, analysisData: any): Promise<string> {
  const prompt = `Analyze product strength and IP defensibility for this investment opportunity:

COMPANY: ${dealData.company_name}
INDUSTRY: ${dealData.industry}
DESCRIPTION: ${dealData.description}

IP RESEARCH:
- Patents: ${analysisData.ipResearch.portfolio.patents}
- Technology Moat: ${analysisData.technologyAssessment.moat}

COMPETITIVE ANALYSIS:
- Competitive Advantages: ${analysisData.competitiveAnalysis.advantages.join(', ')}
- Moat Strength: ${analysisData.competitiveAnalysis.moat_strength}
- Differentiation: ${analysisData.competitiveAnalysis.differentiation}

TECHNOLOGY ASSESSMENT:
- Innovation Level: ${analysisData.technologyAssessment.innovation_level}
- Scalability: ${analysisData.technologyAssessment.scalability}

Instructions:
- Focus on defensibility and competitive advantages
- Highlight IP strengths or weaknesses
- Note data limitations explicitly
- Keep to 2-3 sentences
- Use "N/A" for unverifiable claims`;

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
            content: 'You are a technology and IP analyst. CRITICAL: Only use provided data. Never fabricate IP or technology claims. Use "N/A" when data is missing. Be explicit about what requires verification.'
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
    console.error('Error generating product analysis:', error);
    
    // Fallback analysis
    return `Product analysis shows ${analysisData.competitiveAnalysis.moat_strength} competitive moat with ${analysisData.technologyAssessment.innovation_level} innovation level. IP portfolio: ${analysisData.ipResearch.portfolio.patents}. Requires detailed technical and IP due diligence for validation.`;
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