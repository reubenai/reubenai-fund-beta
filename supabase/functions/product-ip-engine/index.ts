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

interface ProductIPRequest {
  dealData: any;
  strategyData: any;
  documentData?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealData, strategyData, documentData }: ProductIPRequest = await req.json();
    
    console.log('🔬 Product & IP Engine: Analyzing product strength for:', dealData.company_name);
    
    // Analyze product strength and IP
    const productResult = await analyzeProductAndIP(dealData, strategyData, documentData);
    
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

async function analyzeProductAndIP(dealData: any, strategyData: any, documentData: any = null) {
  const validatedData = validateProductData(dealData);
  
  // Enhanced document-driven analysis
  const documentInsights = documentData ? await extractProductInsightsFromDocuments(documentData) : null;
  
  // Research IP and competitive advantages with document context
  const ipResearch = await conductIPResearch(validatedData, documentInsights);
  const competitiveAnalysis = await analyzeCompetitiveAdvantage(validatedData, documentInsights);
  const technologyAssessment = await assessTechnology(validatedData, documentInsights);
  
  // Generate comprehensive analysis
  const aiAnalysis = await generateProductAnalysis(validatedData, {
    ipResearch,
    competitiveAnalysis,
    technologyAssessment,
    documentInsights
  });
  
  // Calculate overall product strength score with heavy document weighting
  const productScore = calculateProductScore({
    ipResearch,
    competitiveAnalysis,
    technologyAssessment,
    documentInsights
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

async function extractProductInsightsFromDocuments(documentData: any) {
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
            content: `Extract structured product and IP intelligence from these documents. Parse for:
            1. PRODUCT: Features, capabilities, technology stack, architecture, platforms
            2. IP ASSETS: Patents filed/pending, trademarks, copyrights, trade secrets
            3. COMPETITIVE MOAT: Unique technology, barriers to entry, defensibility
            4. INNOVATION: Technical breakthroughs, R&D pipeline, innovation metrics
            5. TECHNICAL DEPTH: Algorithm details, data advantages, technical complexity
            Return structured insights with confidence scores for scoring.`
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
        product_features: content,
        ip_mentions: extractIPMentions(content),
        technology_depth: extractTechnologyDepth(content),
        competitive_advantages: extractCompetitiveAdvantages(content),
        innovation_metrics: extractInnovationMetrics(content),
        source: 'extracted_documents',
        confidence: 90,
        hasValidatedData: true
      };
    }
  } catch (error) {
    console.error('❌ Product Engine - Document extraction error:', error);
  }
  
  return {
    product_features: 'Document analysis failed',
    source: 'extracted_documents',
    confidence: 20,
    hasValidatedData: false
  };
}

function extractIPMentions(content: string): any {
  const ipKeywords = ['patent', 'trademark', 'copyright', 'proprietary', 'intellectual property'];
  const hasIP = ipKeywords.some(keyword => content.toLowerCase().includes(keyword));
  
  return {
    hasIPMentions: hasIP,
    patentReferences: (content.match(/patent[s]?/gi) || []).length,
    proprietaryTech: content.toLowerCase().includes('proprietary'),
    trademarkMentions: (content.match(/trademark[s]?/gi) || []).length
  };
}

function extractTechnologyDepth(content: string): any {
  const techTerms = ['algorithm', 'machine learning', 'artificial intelligence', 'blockchain', 'api', 'platform', 'architecture'];
  const techMentions = techTerms.filter(term => content.toLowerCase().includes(term));
  
  return {
    technologyTerms: techMentions,
    technicalComplexity: techMentions.length > 3 ? 'high' : techMentions.length > 1 ? 'medium' : 'low',
    hasTechnicalDetails: techMentions.length > 0
  };
}

function extractCompetitiveAdvantages(content: string): any {
  const advantageKeywords = ['unique', 'first', 'only', 'exclusive', 'innovative', 'breakthrough', 'revolutionary'];
  const advantages = advantageKeywords.filter(keyword => content.toLowerCase().includes(keyword));
  
  return {
    claimedAdvantages: advantages,
    advantageStrength: advantages.length > 3 ? 'strong' : advantages.length > 1 ? 'moderate' : 'weak',
    hasAdvantagesClaimed: advantages.length > 0
  };
}

function extractInnovationMetrics(content: string): any {
  const innovationTerms = ['r&d', 'research', 'development', 'innovation', 'breakthrough', 'novel'];
  const hasInnovation = innovationTerms.some(term => content.toLowerCase().includes(term));
  
  return {
    hasInnovationMentions: hasInnovation,
    innovationFocus: hasInnovation ? 'documented' : 'unclear',
    rdInvestment: content.toLowerCase().includes('r&d') || content.toLowerCase().includes('research')
  };
}

async function conductIPResearch(dealData: any, documentInsights: any = null) {
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
    
    // Simulate IP research based on industry and document insights
    research.portfolio = await simulateIPPortfolio(dealData.industry, dealData.company_name, documentInsights);
    research.quality = documentInsights ? 'document_enhanced' : 'simulated';
  }
  
  return research;
}

async function simulateIPPortfolio(industry: string, companyName: string, documentInsights: any = null) {
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

async function analyzeCompetitiveAdvantage(dealData: any, documentInsights: any = null) {
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

async function assessTechnology(dealData: any, documentInsights: any = null) {
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
  
  // MASSIVE DOCUMENT BONUS - Document intelligence is critical
  if (data.documentInsights?.hasValidatedData) {
    console.log('🔥 Product Engine: Document insights detected - applying heavy scoring boost');
    
    // IP and Patent scoring from documents (heavily weighted)
    if (data.documentInsights.ip_mentions?.hasIPMentions) {
      score += 25; // Major boost for validated IP mentions
      console.log('💎 Product Engine: IP mentions found in documents (+25 points)');
    }
    
    if (data.documentInsights.ip_mentions?.patentReferences > 0) {
      score += 15; // Additional boost for patent references
      console.log('📜 Product Engine: Patent references found (+15 points)');
    }
    
    // Technology depth scoring from documents
    if (data.documentInsights.technology_depth?.technicalComplexity === 'high') {
      score += 20;
      console.log('🔧 Product Engine: High technical complexity (+20 points)');
    } else if (data.documentInsights.technology_depth?.technicalComplexity === 'medium') {
      score += 12;
      console.log('🔧 Product Engine: Medium technical complexity (+12 points)');
    }
    
    // Competitive advantages from documents
    if (data.documentInsights.competitive_advantages?.advantageStrength === 'strong') {
      score += 18;
      console.log('🏆 Product Engine: Strong competitive advantages claimed (+18 points)');
    } else if (data.documentInsights.competitive_advantages?.advantageStrength === 'moderate') {
      score += 10;
      console.log('🏆 Product Engine: Moderate competitive advantages (+10 points)');
    }
    
    // Innovation metrics from documents
    if (data.documentInsights.innovation_metrics?.hasInnovationMentions) {
      score += 12;
      console.log('💡 Product Engine: Innovation mentions found (+12 points)');
    }
    
    // Base document analysis bonus
    score += 15; // Always reward document-driven analysis
    console.log('📄 Product Engine: Document analysis completed (+15 points)');
  } else {
    console.log('⚠️ Product Engine: No document insights - limited scoring potential');
  }
  
  // Traditional IP Portfolio scoring (lower weight if we have documents)
  if (data.ipResearch.quality !== 'limited') {
    const ipBonus = data.documentInsights?.hasValidatedData ? 8 : 15; // Reduce if we have better data
    if (data.ipResearch.portfolio.patents && !data.ipResearch.portfolio.patents.includes('N/A')) {
      score += ipBonus;
    }
  }
  
  // Competitive advantage scoring (lower weight if we have documents)
  const competitiveBonus = data.documentInsights?.hasValidatedData ? 5 : 10;
  if (data.competitiveAnalysis.advantages.length > 1) {
    score += competitiveBonus;
  }
  if (data.competitiveAnalysis.moat_strength.includes('Strong')) {
    const moatBonus = data.documentInsights?.hasValidatedData ? 8 : 15;
    score += moatBonus;
  } else if (data.competitiveAnalysis.moat_strength.includes('Moderate')) {
    score += Math.round(competitiveBonus * 0.8);
  }
  
  // Technology assessment scoring (lower weight if we have documents)
  const techBonus = data.documentInsights?.hasValidatedData ? 6 : 12;
  if (data.technologyAssessment.innovation_level.includes('High')) {
    score += techBonus;
  } else if (data.technologyAssessment.innovation_level.includes('Moderate')) {
    score += Math.round(techBonus * 0.5);
  }
  
  console.log(`🎯 Product Engine: Final score calculated: ${Math.min(score, 100)}`);
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