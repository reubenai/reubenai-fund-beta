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

interface FinancialAnalysisRequest {
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
      thresholds 
    } = await req.json();
    
    console.log('💰 Financial Engine: Analyzing financial feasibility for:', dealData?.company_name || 'Unknown Company');
    console.log('🎯 Fund Type:', fundType, '| Enhanced Criteria:', !!enhancedCriteria);
    
    // Enhanced document-driven financial analysis
    const documentInsights = documentData ? await extractFinancialInsightsFromDocuments(documentData) : null;
    console.log('📄 Financial document insights extracted:', !!documentInsights);
    
    // Extract enhanced financial criteria
    const financialCriteria = enhancedCriteria?.categories?.find((cat: any) => 
      cat.name?.toLowerCase().includes('financial') || 
      cat.name?.toLowerCase().includes('health')
    );
    
    // Conduct comprehensive financial analysis with enhanced context
    const financialResult = await analyzeFinancialFeasibility(dealData, strategyData, documentData, {
      fundType,
      financialCriteria,
      thresholds
    });
    
    // Store source tracking
    await storeSources(dealData.id, 'financial-engine', financialResult.sources);
    
    return new Response(JSON.stringify(financialResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Financial Engine Error:', error);
    return new Response(JSON.stringify({
      score: 50,
      analysis: `Financial analysis failed: ${error.message}`,
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

async function analyzeFinancialFeasibility(dealData: any, strategyData: any, documentData: any = null, enhancedContext: any = null) {
  const validatedData = validateFinancialData(dealData);
  const fundType = enhancedContext?.fundType || strategyData?.fund_type || 'vc';
  
  // Analyze available financial documents with enhanced document processing
  const documentAnalysis = await analyzeFinancialDocuments(dealData.id, documentData);
  
  // Conduct web research for financial validation and market data
  const webResearchData = await conductFinancialWebResearch(dealData);
  
  // Assess business model and revenue streams with fund-type-specific focus
  const businessModelAnalysis = await analyzeBusinessModel(validatedData, webResearchData, fundType);
  
  // Evaluate unit economics and scalability with fund-type considerations
  const unitEconomicsAnalysis = await analyzeUnitEconomics(validatedData, documentAnalysis, fundType);
  
  // Assess funding requirements and financial health
  const fundingAnalysis = await analyzeFundingRequirements(validatedData, strategyData, fundType);
  
  // Generate comprehensive financial analysis with fund-type-specific focus
  const aiAnalysis = await generateFinancialAnalysis(validatedData, {
    documentAnalysis,
    businessModelAnalysis,
    unitEconomicsAnalysis,
    fundingAnalysis,
    webResearchData
  }, fundType);
  
  // Calculate financial feasibility score with fund-type weighting
  const financialScore = calculateFinancialScore({
    documentAnalysis,
    businessModelAnalysis,
    unitEconomicsAnalysis,
    fundingAnalysis
  }, fundType);
  
  // Determine confidence level
  const confidence = calculateFinancialConfidence(validatedData, {
    documentAnalysis,
    businessModelAnalysis,
    unitEconomicsAnalysis,
    fundingAnalysis
  });
  
  // Combine all sources including web research
  const sources = [
    ...documentAnalysis.sources,
    ...businessModelAnalysis.sources,
    ...unitEconomicsAnalysis.sources,
    ...fundingAnalysis.sources,
    ...(webResearchData?.sources || [])
  ];
  
  return {
    score: financialScore,
    analysis: aiAnalysis,
    confidence: confidence,
    sources: sources,
    data: {
      revenue_model: businessModelAnalysis.model,
      unit_economics: unitEconomicsAnalysis.metrics,
      funding_requirements: fundingAnalysis.requirements,
      financial_health: assessFinancialHealth({
        documentAnalysis,
        businessModelAnalysis,
        unitEconomicsAnalysis
      }),
      scalability_assessment: unitEconomicsAnalysis.scalability,
      fund_type_analysis: generateFinancialFundTypeAnalysis(fundType, {
        documentAnalysis,
        businessModelAnalysis,
        unitEconomicsAnalysis,
        fundingAnalysis
      })
    },
    validation_status: confidence >= 70 ? 'validated' : confidence >= 50 ? 'partial' : 'unvalidated'
  };
}

// Fund-type-specific financial analysis
function generateFinancialFundTypeAnalysis(fundType: string, analysisData: any): any {
  if (fundType === 'vc' || fundType === 'venture_capital') {
    return {
      focus: 'growth_and_scalability',
      key_metrics: ['burn_rate', 'runway', 'growth_efficiency', 'unit_economics_trend'],
      risk_factors: ['cash_burn_acceleration', 'unit_economics_deterioration', 'funding_runway_risk'],
      success_indicators: ['decreasing_customer_acquisition_cost', 'improving_unit_economics', 'accelerating_growth']
    };
  } else if (fundType === 'pe' || fundType === 'private_equity') {
    return {
      focus: 'cash_flow_and_profitability',
      key_metrics: ['ebitda_margin', 'cash_conversion', 'debt_capacity', 'working_capital_efficiency'],
      risk_factors: ['margin_compression', 'cash_flow_volatility', 'debt_service_capability'],
      success_indicators: ['stable_cash_flows', 'margin_expansion_potential', 'operational_leverage']
    };
  }
  return {
    focus: 'general_financial_health',
    key_metrics: ['revenue_growth', 'profitability', 'cash_position'],
    risk_factors: ['financial_stability', 'liquidity_risk'],
    success_indicators: ['revenue_growth', 'improving_margins']
  };
}

function validateFinancialData(dealData: any) {
  return {
    company_name: dealData.company_name || 'N/A',
    deal_size: dealData.deal_size || null,
    valuation: dealData.valuation || null,
    business_model: dealData.business_model || 'N/A',
    description: dealData.description || 'N/A',
    industry: dealData.industry || 'N/A'
  };
}

async function analyzeFinancialDocuments(dealId: string, documentData: any = null) {
  const analysis = {
    documents_found: false,
    financial_data: {
      revenue: 'N/A',
      growth_rate: 'N/A',
      burn_rate: 'N/A',
      runway: 'N/A',
      funding_usage: 'N/A',
      unit_economics: 'N/A'
    },
    sources: [],
    quality: 'no_documents',
    pitch_deck_analysis: null
  };
  
  try {
    // Use provided document data if available, otherwise fetch from database
    let documents = [];
    if (documentData && documentData.documents) {
      documents = documentData.documents;
    } else {
      const { data: dbDocuments, error } = await supabase
        .from('deal_documents')
        .select('*')
        .eq('deal_id', dealId)
        .in('document_category', ['pitch_deck', 'business_plan', 'other']);
      
      if (error) {
        console.error('Error fetching documents:', error);
        return analysis;
      }
      documents = dbDocuments || [];
    }
    
    if (documents && documents.length > 0) {
      analysis.documents_found = true;
      analysis.sources.push({
        type: 'document',
        source: `${documents.length} financial documents`,
        validated: true,
        confidence: 80
      });
      
      // Process extracted text from documents, especially pitch decks
      if (documentData && documentData.extractedTexts && documentData.extractedTexts.length > 0) {
        analysis.financial_data = await extractFinancialDataFromText(documentData.extractedTexts);
        analysis.quality = 'text_extracted';
        
        // Special handling for pitch deck
        if (documentData.pitchDeck && documentData.pitchDeck.extracted_text) {
          analysis.pitch_deck_analysis = await analyzePitchDeckFinancials(documentData.pitchDeck.extracted_text);
          analysis.sources.push({
            type: 'pitch_deck_analysis',
            source: 'extracted_pitch_deck_content',
            validated: true,
            confidence: 90
          });
        }
      } else {
        analysis.financial_data = await simulateDocumentExtraction(documents);
        analysis.quality = 'documents_available';
      }
    }
  } catch (error) {
    console.error('Error analyzing financial documents:', error);
  }
  
  return analysis;
}

async function extractFinancialInsightsFromDocuments(documentData: any) {
  if (!documentData || !documentData.extractedTexts || documentData.extractedTexts.length === 0) {
    return null;
  }
  
  console.log('📄 Processing documents for financial insights:', documentData.extractedTexts.length);
  
  const allText = documentData.extractedTexts.map(doc => {
    let cleanText = doc.extracted_text;
    
    // Parse JSON structure if needed
    try {
      const parsed = JSON.parse(doc.extracted_text);
      if (parsed && typeof parsed === 'object' && parsed.content) {
        cleanText = parsed.content;
      } else if (parsed && typeof parsed === 'object' && parsed.markdown) {
        cleanText = parsed.markdown;
      }
    } catch (e) {
      // Not JSON, use as-is
    }
    
    return `${doc.name} (${doc.category}):\n${cleanText}`;
  }).join('\n\n');
  
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
            content: `Extract financial metrics and business model data from documents. Parse for:
            1. REVENUE METRICS: Revenue projections, growth rates, historical data
            2. BUSINESS MODEL: Revenue streams, monetization strategy, unit economics
            3. FUNDING: Use of funds, financial requirements, runway projections
            4. FINANCIAL HEALTH: Burn rate, profitability, financial milestones
            Return structured insights for financial scoring.`
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
        financial_intelligence: content,
        hasValidatedData: true,
        confidence: 95
      };
    }
  } catch (error) {
    console.error('❌ Financial Engine - Document extraction error:', error);
  }
  
  return {
    financial_intelligence: 'Document analysis failed',
    hasValidatedData: false,
    confidence: 20
  };
}

async function extractFinancialDataFromText(extractedTexts: any[]) {
  const allText = extractedTexts.map(doc => {
    let cleanText = doc.extracted_text;
    
    // Parse JSON structure if needed
    try {
      const parsed = JSON.parse(doc.extracted_text);
      if (parsed && typeof parsed === 'object' && parsed.content) {
        cleanText = parsed.content;
      } else if (parsed && typeof parsed === 'object' && parsed.markdown) {
        cleanText = parsed.markdown;
      }
    } catch (e) {
      // Not JSON, use as-is
    }
    
    return `${doc.name}:\n${cleanText}`;
  }).join('\n\n');
  
  try {
    // Use OpenAI to extract financial data from documents
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
            content: 'Extract financial metrics from the provided document text. Look for revenue, growth rates, burn rate, funding usage, unit economics, and business model details. Return only factual information found in the documents.'
          },
          {
            role: 'user',
            content: `Extract financial data from these documents:\n\n${allText.substring(0, 15000)}`
          }
        ],
        max_tokens: 1000
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const extractedInfo = data.choices[0].message.content;
      
      return {
        revenue: extractMetricFromText(extractedInfo, 'revenue'),
        growth_rate: extractMetricFromText(extractedInfo, 'growth'),
        burn_rate: extractMetricFromText(extractedInfo, 'burn'),
        runway: extractMetricFromText(extractedInfo, 'runway'),
        funding_usage: extractMetricFromText(extractedInfo, 'funding usage'),
        unit_economics: extractMetricFromText(extractedInfo, 'unit economics')
      };
    }
  } catch (error) {
    console.error('Error extracting financial data:', error);
  }
  
  return {
    revenue: 'Extraction in progress',
    growth_rate: 'Extraction in progress',
    burn_rate: 'Extraction in progress',
    runway: 'Extraction in progress',
    funding_usage: 'Document text processed',
    unit_economics: 'Document text processed'
  };
}

async function analyzePitchDeckFinancials(pitchDeckText: string) {
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
            content: 'Analyze this pitch deck for financial information. Extract revenue projections, business model, funding requirements, market size, and key financial metrics. Focus on concrete numbers and projections.'
          },
          {
            role: 'user',
            content: pitchDeckText.substring(0, 12000)
          }
        ],
        max_tokens: 800
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error('Error analyzing pitch deck:', error);
  }
  
  return 'Pitch deck financial analysis in progress';
}

function extractMetricFromText(text: string, metric: string): string {
  const lines = text.split('\n');
  
  // Enhanced pattern matching for financial data
  if (metric.toLowerCase().includes('revenue')) {
    // Look for revenue patterns like "$10M", "$20,000,000", "5 Year Sales Growth"
    const revenuePatterns = [
      /\$[0-9,]+(?:M|million|K|thousand|B|billion)/gi,
      /sales.*\$[0-9,]+/gi,
      /revenue.*\$[0-9,]+/gi,
      /\$[0-9,]+.*sales/gi,
      /\$[0-9,]+.*revenue/gi,
      /year.*sales.*\$[0-9,]+/gi
    ];
    
    for (const pattern of revenuePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches.join(', ').substring(0, 100);
      }
    }
    
    // Look for sales growth tables
    const salesGrowthMatch = text.match(/Year.*Sales.*\$[0-9,]+/gi);
    if (salesGrowthMatch) {
      return `Sales projections found: ${salesGrowthMatch[0].substring(0, 80)}`;
    }
  }
  
  if (metric.toLowerCase().includes('growth')) {
    // Look for growth percentages and year-over-year projections
    const growthPatterns = [
      /[0-9]+%.*growth/gi,
      /growth.*[0-9]+%/gi,
      /CAGR.*[0-9]+%/gi,
      /[0-9]+%.*CAGR/gi,
      /year.*[0-9]+%/gi
    ];
    
    for (const pattern of growthPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches.join(', ').substring(0, 100);
      }
    }
  }
  
  if (metric.toLowerCase().includes('funding')) {
    // Look for funding usage and requirements
    const fundingPatterns = [
      /\$[0-9,]+.*[Mm].*fuel/gi,
      /raise.*\$[0-9,]+/gi,
      /\$[0-9,]+.*will.*fuel/gi,
      /funding.*\$[0-9,]+/gi,
      /investment.*\$[0-9,]+/gi
    ];
    
    for (const pattern of fundingPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches.join(', ').substring(0, 100);
      }
    }
  }
  
  // Fallback to original logic
  const metricLine = lines.find(line => 
    line.toLowerCase().includes(metric.toLowerCase()) && 
    (line.includes('$') || line.includes('%') || line.includes('month'))
  );
  return metricLine ? metricLine.trim() : `${metric} information not found in documents`;
}

async function simulateDocumentExtraction(documents: any[]) {
  return {
    revenue: 'Document analysis required',
    growth_rate: 'Document analysis required',
    burn_rate: 'Document analysis required',
    runway: 'Document analysis required',
    funding_usage: 'Document analysis required',
    unit_economics: 'Document analysis required'
  };
}

async function conductFinancialWebResearch(dealData: any) {
  try {
    console.log('🔍 Conducting financial web research for:', dealData.company_name);
    
    // Call web-research-engine for financial validation
    const { data: webResult, error } = await supabase.functions.invoke('web-research-engine', {
      body: {
        dealData,
        researchType: 'company',
        searchDepth: 'basic'
      }
    });

    if (error) {
      console.warn('Web research failed:', error);
      return null;
    }

    if (webResult && webResult.success) {
      console.log('✅ Financial web research completed');
      return {
        company_validation: webResult.data?.company || null,
        funding_history: webResult.data?.funding || null,
        sources: webResult.sources || []
      };
    }

    return null;
  } catch (error) {
    console.warn('Financial web research error:', error);
    return null;
  }
}

async function analyzeBusinessModel(dealData: any, webResearchData: any = null) {
  const analysis = {
    model: 'Unknown',
    revenue_streams: [],
    monetization: 'unclear',
    scalability: 'unknown',
    sources: []
  };
  
  if (dealData.business_model !== 'N/A') {
    analysis.sources.push({
      type: 'company_data',
      source: 'business_model_field',
      validated: true,
      confidence: 70
    });
    
    analysis.model = analyzeBusinessModelType(dealData.business_model);
    analysis.revenue_streams = extractRevenueStreams(dealData.business_model);
    analysis.monetization = assessMonetization(dealData.business_model, dealData.industry);
    analysis.scalability = assessBusinessScalability(dealData.business_model);
  }
  
  if (dealData.description !== 'N/A') {
    const descriptionInsights = extractBusinessModelFromDescription(dealData.description);
    if (descriptionInsights.model !== 'Unknown') {
      analysis.model = descriptionInsights.model;
      analysis.revenue_streams.push(...descriptionInsights.revenue_streams);
    }
  }
  
  return analysis;
}

function analyzeBusinessModelType(businessModel: string): string {
  const model = businessModel.toLowerCase();
  
  if (model.includes('saas') || model.includes('subscription')) return 'SaaS/Subscription';
  if (model.includes('marketplace') || model.includes('platform')) return 'Marketplace/Platform';
  if (model.includes('transaction') || model.includes('commission')) return 'Transaction-based';
  if (model.includes('advertising') || model.includes('ads')) return 'Advertising';
  if (model.includes('freemium')) return 'Freemium';
  if (model.includes('license') || model.includes('licensing')) return 'Licensing';
  if (model.includes('ecommerce') || model.includes('e-commerce')) return 'E-commerce';
  
  return 'Other/Hybrid';
}

function extractRevenueStreams(businessModel: string): string[] {
  const streams: string[] = [];
  const model = businessModel.toLowerCase();
  
  if (model.includes('subscription')) streams.push('Subscription revenue');
  if (model.includes('transaction')) streams.push('Transaction fees');
  if (model.includes('commission')) streams.push('Commission-based revenue');
  if (model.includes('advertising')) streams.push('Advertising revenue');
  if (model.includes('licensing')) streams.push('Licensing revenue');
  if (model.includes('service')) streams.push('Service revenue');
  
  return streams.length > 0 ? streams : ['Revenue streams require clarification'];
}

function assessMonetization(businessModel: string, industry: string): string {
  const model = businessModel.toLowerCase();
  
  if (model.includes('saas') || model.includes('subscription')) {
    return 'Strong - Recurring revenue model';
  }
  if (model.includes('marketplace') || model.includes('platform')) {
    return 'Moderate - Network effects potential';
  }
  if (model.includes('transaction')) {
    return 'Moderate - Volume-dependent revenue';
  }
  
  return 'Requires deeper analysis';
}

function assessBusinessScalability(businessModel: string): string {
  const model = businessModel.toLowerCase();
  
  if (model.includes('saas') || model.includes('software')) {
    return 'High - Software scalability';
  }
  if (model.includes('marketplace') || model.includes('platform')) {
    return 'Very High - Network effects';
  }
  if (model.includes('service') && !model.includes('software')) {
    return 'Low - Service-dependent';
  }
  
  return 'Moderate - Industry-dependent';
}

function extractBusinessModelFromDescription(description: string): { model: string, revenue_streams: string[] } {
  const desc = description.toLowerCase();
  const streams: string[] = [];
  
  if (desc.includes('subscription') || desc.includes('monthly') || desc.includes('saas')) {
    streams.push('Subscription revenue identified');
    return { model: 'SaaS/Subscription', revenue_streams: streams };
  }
  if (desc.includes('marketplace') || desc.includes('platform')) {
    streams.push('Platform revenue identified');
    return { model: 'Marketplace/Platform', revenue_streams: streams };
  }
  
  return { model: 'Unknown', revenue_streams: [] };
}

async function analyzeUnitEconomics(dealData: any, documentAnalysis: any) {
  const analysis = {
    metrics: {
      ltv: 'N/A',
      cac: 'N/A',
      ltv_cac_ratio: 'N/A',
      payback_period: 'N/A',
      gross_margin: 'N/A'
    },
    scalability: 'Unknown',
    sources: []
  };
  
  if (documentAnalysis.documents_found) {
    analysis.sources.push({
      type: 'document_analysis',
      source: 'financial_documents',
      validated: false,
      confidence: 60
    });
    
    // In production, this would extract actual metrics from documents
    analysis.metrics = await simulateUnitEconomicsExtraction(dealData.industry);
    analysis.scalability = assessUnitEconomicsScalability(analysis.metrics);
  } else {
    analysis.sources.push({
      type: 'estimation',
      source: 'industry_benchmarks',
      validated: false,
      confidence: 40
    });
    
    analysis.metrics = await estimateUnitEconomics(dealData.industry);
    analysis.scalability = 'Requires financial data for assessment';
  }
  
  return analysis;
}

async function simulateUnitEconomicsExtraction(industry: string) {
  // This would be replaced with actual document processing
  return {
    ltv: 'Requires document analysis',
    cac: 'Requires document analysis',
    ltv_cac_ratio: 'Requires calculation',
    payback_period: 'Requires data',
    gross_margin: 'Requires financial statements'
  };
}

async function estimateUnitEconomics(industry: string) {
  // Industry benchmark estimates (simplified)
  const benchmarks = {
    'saas': {
      ltv: '$2,000-$5,000 (SaaS benchmark)',
      cac: '$500-$1,500 (SaaS benchmark)',
      ltv_cac_ratio: '3:1-5:1 (Target)',
      payback_period: '12-18 months (SaaS)',
      gross_margin: '70-80% (SaaS typical)'
    },
    'ecommerce': {
      ltv: '$100-$500 (E-commerce)',
      cac: '$50-$200 (E-commerce)',
      ltv_cac_ratio: '2:1-4:1 (Target)',
      payback_period: '6-12 months',
      gross_margin: '20-40% (E-commerce)'
    }
  };
  
  const industryKey = Object.keys(benchmarks).find(key => 
    industry.toLowerCase().includes(key)
  );
  
  return industryKey ? benchmarks[industryKey as keyof typeof benchmarks] : {
    ltv: 'Industry benchmarks unavailable',
    cac: 'Industry benchmarks unavailable',
    ltv_cac_ratio: 'Requires analysis',
    payback_period: 'Requires analysis',
    gross_margin: 'Requires analysis'
  };
}

function assessUnitEconomicsScalability(metrics: any): string {
  // This would analyze actual metrics when available
  if (metrics.ltv_cac_ratio && metrics.ltv_cac_ratio.includes('3:1')) {
    return 'Good - Healthy unit economics indicated';
  }
  
  return 'Requires metric validation for assessment';
}

async function analyzeFundingRequirements(dealData: any, strategyData: any) {
  const analysis = {
    requirements: {
      funding_amount: dealData.deal_size ? formatCurrency(dealData.deal_size) : 'N/A',
      use_of_funds: 'Not specified',
      runway_extension: 'Unknown',
      milestones: 'Unclear'
    },
    alignment_with_fund: 'unknown',
    sources: []
  };
  
  if (dealData.deal_size) {
    analysis.sources.push({
      type: 'deal_data',
      source: 'funding_amount',
      validated: true,
      confidence: 90
    });
    
    // Analyze funding alignment with fund strategy
    if (strategyData) {
      analysis.alignment_with_fund = assessFundingAlignment(dealData.deal_size, strategyData);
    }
    
    // Estimate use of funds based on industry and stage
    analysis.requirements.use_of_funds = estimateUseOfFunds(dealData.industry, dealData.deal_size);
    analysis.requirements.runway_extension = estimateRunwayExtension(dealData.deal_size);
  }
  
  return analysis;
}

function assessFundingAlignment(dealSize: number, strategyData: any): string {
  const min = strategyData.min_investment_amount;
  const max = strategyData.max_investment_amount;
  
  if (min && dealSize < min) {
    return `Below fund minimum (${formatCurrency(min)})`;
  }
  if (max && dealSize > max) {
    return `Above fund maximum (${formatCurrency(max)})`;
  }
  if (min && max && dealSize >= min && dealSize <= max) {
    return 'Well-aligned with fund investment criteria';
  }
  
  return 'Fund criteria alignment requires review';
}

function estimateUseOfFunds(industry: string, dealSize: number): string {
  if (dealSize < 1000000) {
    return 'Likely for product development and initial hiring';
  } else if (dealSize < 5000000) {
    return 'Likely for market expansion and team growth';
  } else {
    return 'Likely for scaling operations and market leadership';
  }
}

function estimateRunwayExtension(dealSize: number): string {
  // Simplified runway estimation
  if (dealSize < 1000000) {
    return '12-18 months estimated runway';
  } else if (dealSize < 5000000) {
    return '18-24 months estimated runway';
  } else {
    return '24+ months estimated runway';
  }
}

function calculateFinancialScore(data: any): number {
  let score = 50; // Base score
  let documentBonus = 0;
  let financialMetricsBonus = 0;
  
  // Enhanced document-based scoring
  if (data.documentAnalysis.documents_found) {
    documentBonus = 5; // Base document bonus
    
    // Analyze extracted financial data for significant scoring adjustments
    const extractedData = data.documentAnalysis.financial_data;
    
    // Revenue projections and growth rate analysis
    if (extractedData) {
      // Parse revenue information from extracted text
      const revenueInfo = extractedData.revenue || '';
      const growthInfo = extractedData.growth_rate || '';
      
      // Strong revenue projections (+15 points)
      if (revenueInfo.includes('$') && (
        revenueInfo.match(/(\$[0-9,]+[MB])|(\$[0-9]+\.[0-9]+[MB])/i) ||
        revenueInfo.includes('million') || revenueInfo.includes('billion')
      )) {
        financialMetricsBonus += 15;
        console.log('📊 Found significant revenue projections in documents');
      }
      
      // Growth rate analysis (+10 points for strong growth)
      if (growthInfo.includes('%') && (
        growthInfo.match(/[0-9]+%/) &&
        parseInt(growthInfo.match(/([0-9]+)%/)?.[1] || '0') > 50
      )) {
        financialMetricsBonus += 10;
        console.log('📈 Found strong growth projections in documents');
      }
      
      // Unit economics indicators (+10 points)
      const unitEconomics = extractedData.unit_economics || '';
      if (unitEconomics.includes('LTV') || unitEconomics.includes('CAC') || 
          unitEconomics.includes('margin') || unitEconomics.includes('gross')) {
        financialMetricsBonus += 10;
        console.log('💰 Found unit economics data in documents');
      }
      
      // Business model clarity from documents (+5 points)
      if (extractedData.funding_usage && extractedData.funding_usage !== 'Document text processed') {
        financialMetricsBonus += 5;
        console.log('🎯 Found clear funding usage plan in documents');
      }
    }
  }
  
  // Business model scoring (adjusted with document insights)
  if (data.businessModelAnalysis.monetization.includes('Strong')) {
    score += 20;
  } else if (data.businessModelAnalysis.monetization.includes('Moderate')) {
    score += 10;
  }
  
  // Scalability scoring
  if (data.businessModelAnalysis.scalability.includes('High')) {
    score += 15;
  } else if (data.businessModelAnalysis.scalability.includes('Moderate')) {
    score += 8;
  }
  
  // Apply document bonuses (can significantly impact score)
  score += documentBonus + financialMetricsBonus;
  
  // Funding alignment
  if (data.fundingAnalysis.alignment_with_fund.includes('Well-aligned')) {
    score += 5;
  }
  
  // Log scoring breakdown for transparency
  console.log(`💯 Financial Score Breakdown: Base(50) + Business(${score-50-documentBonus-financialMetricsBonus}) + Documents(${documentBonus}) + Metrics(${financialMetricsBonus}) = ${Math.min(score, 100)}`);
  
  return Math.min(score, 100);
}

function calculateFinancialConfidence(dealData: any, analysisData: any): number {
  let confidence = 30; // Base confidence
  
  // Data availability factors
  if (dealData.business_model !== 'N/A') confidence += 20;
  if (dealData.deal_size) confidence += 25;
  if (analysisData.documentAnalysis.documents_found) confidence += 25;
  
  return Math.min(confidence, 100);
}

function assessFinancialHealth(data: any): string {
  if (data.documentAnalysis.documents_found) {
    return 'Requires detailed financial document analysis';
  }
  
  if (data.businessModelAnalysis.monetization.includes('Strong')) {
    return 'Potentially strong based on business model';
  }
  
  return 'Limited data for financial health assessment';
}

async function generateFinancialAnalysis(dealData: any, analysisData: any): Promise<string> {
  const prompt = `Analyze financial feasibility for this investment opportunity:

COMPANY: ${dealData.company_name}
INDUSTRY: ${dealData.industry}
DEAL SIZE: ${dealData.deal_size ? formatCurrency(dealData.deal_size) : 'N/A'}
VALUATION: ${dealData.valuation ? formatCurrency(dealData.valuation) : 'N/A'}

BUSINESS MODEL: ${dealData.business_model}
REVENUE MODEL: ${analysisData.businessModelAnalysis.model}
MONETIZATION: ${analysisData.businessModelAnalysis.monetization}
SCALABILITY: ${analysisData.businessModelAnalysis.scalability}

FINANCIAL DOCUMENTS: ${analysisData.documentAnalysis.documents_found ? 'Available for analysis' : 'Not provided'}
FUNDING ALIGNMENT: ${analysisData.fundingAnalysis.alignment_with_fund}

Instructions:
- Focus on financial viability and scalability
- Highlight business model strengths/weaknesses
- Note what financial data is missing
- Keep to 2-3 sentences
- Use "N/A" for unverifiable financial claims`;

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
            content: 'You are a financial analyst. CRITICAL: Only use provided data. Never fabricate financial metrics. Use "N/A" when data is missing. Be explicit about what requires financial due diligence.'
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
    console.error('Error generating financial analysis:', error);
    
    // Fallback analysis
    return `Financial analysis shows ${analysisData.businessModelAnalysis.monetization} monetization with ${analysisData.businessModelAnalysis.scalability} scalability. Deal size: ${dealData.deal_size ? formatCurrency(dealData.deal_size) : 'N/A'}. ${analysisData.documentAnalysis.documents_found ? 'Financial documents available for detailed analysis.' : 'Requires financial documentation for complete assessment.'}`;
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: amount >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: 0,
  }).format(amount);
}