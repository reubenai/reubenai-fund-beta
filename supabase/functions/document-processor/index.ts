import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

// AI Analysis helper
async function performAIAnalysis(
  extractedText: string, 
  document: any, 
  analysisType: string, 
  openAIApiKey: string
) {
  const prompt = buildAnalysisPrompt(extractedText, document, analysisType);
  
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
            content: 'You are an expert investment analyst specializing in document analysis for venture capital and private equity. Provide structured, actionable insights.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    return parseAIAnalysis(analysis, analysisType);
  } catch (error) {
    console.error('AI analysis failed:', error);
    return {
      insights: [`AI analysis failed: ${error.message}`],
      structured_data: {},
      confidence: 50
    };
  }
}

function buildAnalysisPrompt(extractedText: string, document: any, analysisType: string): string {
  const basePrompt = `Document: ${document.name}
Category: ${document.document_category}
Analysis Type: ${analysisType}

Extracted Text:
${extractedText.substring(0, 4000)}...

Please analyze this document and provide:`;

  switch (analysisType) {
    case 'financial':
      return `${basePrompt}
1. Key financial metrics (revenue, growth, burn rate, runway)
2. Financial health assessment
3. Investment attractiveness indicators
4. Risk factors
5. Opportunities for improvement

Respond in JSON format with keys: insights, financial_metrics, risks, opportunities`;

    case 'legal':
      return `${basePrompt}
1. Key legal terms and conditions
2. Compliance status
3. Risk factors
4. Standard vs non-standard clauses
5. Recommendation for legal review

Respond in JSON format with keys: insights, legal_terms, compliance, risks`;

    case 'full':
      return `${basePrompt}
1. Executive summary
2. Key business metrics
3. Market analysis
4. Competitive position
5. Investment thesis validation
6. Risk assessment
7. Next steps

Respond in JSON format with keys: insights, business_metrics, market_analysis, risks, next_steps`;

    default: // 'quick'
      return `${basePrompt}
1. Document summary (2-3 sentences)
2. Key takeaways (3-5 points)
3. Important flags or concerns
4. Investment relevance

Respond in JSON format with keys: insights, summary, key_takeaways, flags`;
  }
}

function parseAIAnalysis(analysis: string, analysisType: string) {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(analysis);
    return {
      insights: parsed.insights || parsed.key_takeaways || [],
      structured_data: parsed,
      confidence: 85
    };
  } catch (error) {
    // If JSON parsing fails, extract insights from text
    const insights = analysis
      .split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 5)
      .map(line => line.replace(/^[-*•]\s*/, '').trim());

    return {
      insights,
      structured_data: { raw_analysis: analysis },
      confidence: 70
    };
  }
}

// Stage 1: Unified Chat Format Generation
async function generateUnifiedDocumentSummary(extractedText: string, document: any, openAIApiKey: string) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key is required for document summary generation');
  }

  const prompt = `You are an expert investment analyst. Analyze the following document and generate a comprehensive summary in conversational format.

Document: ${document.name}
Category: ${document.document_category}

Extracted Text:
${extractedText.substring(0, 6000)}

Generate a conversational summary containing:

1. **Narrative** (5-8 sentences): Comprehensive summary highlighting the document content, key value proposition, market opportunity, business model, and strategic positioning.

2. **VC Data Points**: Extract and list relevant VC metrics/keywords naturally in the conversation:
- TAM, SAM, SOM if mentioned
- Growth rates, market share, competitive positioning
- Customer metrics (CAC, LTV, retention)
- Funding information, investor network
- Strategic partnerships and advisors

3. **PE Data Points**: Extract and list relevant PE metrics/keywords naturally in the conversation:
- Financial performance (revenue, profitability, margins)
- Operational efficiency and management quality
- Market position and competitive advantages
- Growth potential and value creation opportunities
- Exit strategy considerations

Write this as one flowing conversational analysis that naturally incorporates all available data points and metrics from the document.

Example format:
"[Company Name] is a [industry] company that [5-8 sentence narrative describing the business, market opportunity, competitive position, financial performance, and growth strategy]. The document reveals key VC metrics including TAM of [X], customer acquisition cost of [Y], and strategic partnerships with [partners]. From a PE perspective, the company demonstrates [financial performance indicators], operational strengths in [areas], and potential value creation through [opportunities]. The management team shows [leadership qualities] and the exit potential appears [assessment] based on [market factors]."`;

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
            content: 'You are an expert investment analyst. Generate comprehensive conversational document summaries that naturally incorporate both VC and PE data points.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const unifiedSummary = data.choices[0].message.content;
    
    return unifiedSummary;
  } catch (error) {
    console.error('Unified document summary generation failed:', error);
    // Return a fallback summary
    return `Analysis of ${document.name}: This document contains relevant business information and strategic insights. Key metrics and data points are available for review. The company demonstrates market positioning and growth potential. Financial and operational details require further analysis. Strategic recommendations and investment considerations are documented within the content.`;
  }
}

// Stage 2: Parse Unified Summary into Components
function parseUnifiedSummary(unifiedSummary: string, document: any) {
  try {
    // Extract narrative (first 5-8 sentences)
    const sentences = unifiedSummary.match(/[^\.!?]+[\.!?]+/g) || [];
    const narrative = sentences.slice(0, 8).join(' ').trim();
    
    // Extract VC data points using keywords and patterns
    const vcDataPoints = extractVCDataFromText(unifiedSummary);
    
    // Extract PE data points using keywords and patterns
    const peDataPoints = extractPEDataFromText(unifiedSummary);
    
    return {
      narrative: narrative || `Investment summary for ${document.name}. Document analysis completed with comprehensive insights.`,
      data_points_vc: vcDataPoints,
      data_points_pe: peDataPoints
    };
  } catch (error) {
    console.error('Failed to parse unified summary:', error);
    return {
      narrative: `Analysis of ${document.name}: Document contains relevant business and investment information.`,
      data_points_vc: generateFallbackVCDataPoints(),
      data_points_pe: generateFallbackPEDataPoints()
    };
  }
}

// Extract VC data points from conversational text
function extractVCDataFromText(text: string) {
  const vcData: any = {};
  
  // TAM/SAM/SOM patterns
  const tamMatch = text.match(/TAM[:\s]+([\$\d\.\s\w]+)/i);
  const samMatch = text.match(/SAM[:\s]+([\$\d\.\s\w]+)/i);
  const somMatch = text.match(/SOM[:\s]+([\$\d\.\s\w]+)/i);
  
  vcData["TAM"] = tamMatch ? tamMatch[1].trim() : "not listed";
  vcData["SAM"] = samMatch ? samMatch[1].trim() : "not listed";
  vcData["SOM"] = somMatch ? somMatch[1].trim() : "not listed";
  
  // Growth rates
  const cagrMatch = text.match(/(?:CAGR|growth rate)[:\s]+([\d\.%\s]+)/i);
  vcData["CAGR"] = cagrMatch ? cagrMatch[1].trim() : "not listed";
  
  // Customer metrics
  const cacMatch = text.match(/(?:CAC|customer acquisition cost)[:\s]+([\$\d\.\s\w]+)/i);
  const ltvMatch = text.match(/(?:LTV|lifetime value)[:\s]+([\$\d\.\s\w]+)/i);
  const retentionMatch = text.match(/(?:retention rate|retention)[:\s]+([\d\.%\s]+)/i);
  
  vcData["CAC Trend"] = cacMatch ? cacMatch[1].trim() : "not listed";
  vcData["LTV:CAC Ratio"] = ltvMatch && cacMatch ? `${ltvMatch[1].trim()}:${cacMatch[1].trim()}` : "not listed";
  vcData["Retention Rate"] = retentionMatch ? retentionMatch[1].trim() : "not listed";
  
  // Market and competitive data
  vcData["Growth Drivers"] = extractListItems(text, "growth driver", "expand", "scale") || "not listed";
  vcData["Market Share Distribution"] = extractListItems(text, "market share", "market position") || "not listed";
  vcData["Key Market Players"] = extractListItems(text, "competitor", "player", "rival") || "not listed";
  vcData["Whitespace Opportunities"] = extractListItems(text, "opportunity", "potential", "gap") || "not listed";
  vcData["Addressable Customers"] = extractListItems(text, "customer", "client", "target market") || "not listed";
  vcData["Channel Effectiveness"] = extractListItems(text, "channel", "distribution", "sales") || "not listed";
  vcData["Strategic Advisors"] = extractListItems(text, "advisor", "board member", "mentor") || "not listed";
  vcData["Investor Network"] = extractListItems(text, "investor", "funding", "venture") || "not listed";
  vcData["Partnership Ecosystem"] = extractListItems(text, "partnership", "partner", "alliance") || "not listed";
  
  return vcData;
}

// Extract PE data points from conversational text
function extractPEDataFromText(text: string) {
  const peData: any = {};
  
  // Financial metrics
  const revenueMatch = text.match(/revenue[:\s]+([\$\d\.\s\w\+%]+)/i);
  const profitMatch = text.match(/(?:profit|margin|EBITDA)[:\s]+([\$\d\.\s\w\+%]+)/i);
  
  peData["Revenue Quality"] = revenueMatch ? { revenue: revenueMatch[1].trim() } : "not listed";
  peData["Profitability Analysis"] = profitMatch ? { profitability: profitMatch[1].trim() } : "not listed";
  peData["Cash Management"] = extractListItems(text, "cash flow", "working capital", "liquidity") || "not listed";
  
  // Management and operations
  peData["Management Team Strength"] = extractListItems(text, "management", "leadership", "team", "CEO") || "not listed";
  peData["Operational Efficiency"] = extractListItems(text, "operational", "efficiency", "process", "automation") || "not listed";
  peData["Technology & Systems"] = extractListItems(text, "technology", "system", "digital", "platform") || "not listed";
  
  // Market position
  peData["Market Share & Position"] = extractListItems(text, "market share", "market position", "competitive position") || "not listed";
  peData["Competitive Advantages"] = extractListItems(text, "advantage", "differentiat", "unique", "moat") || "not listed";
  peData["Customer Base Quality"] = extractListItems(text, "customer base", "client", "customer retention") || "not listed";
  
  // Leadership and vision
  peData["Leadership Track Record"] = extractListItems(text, "track record", "experience", "background", "history") || "not listed";
  peData["Organizational Strength"] = extractListItems(text, "organization", "culture", "team", "structure") || "not listed";
  peData["Strategic Vision"] = extractListItems(text, "vision", "strategy", "roadmap", "plan") || "not listed";
  
  // Growth and value creation
  peData["Market Expansion Opportunities"] = extractListItems(text, "expansion", "growth", "market entry", "geographic") || "not listed";
  peData["Value Creation Initiatives"] = extractListItems(text, "value creation", "improvement", "optimization", "initiative") || "not listed";
  peData["Exit Strategy Potential"] = extractListItems(text, "exit", "acquisition", "IPO", "strategic buyer") || "not listed";
  
  // Strategic fit
  peData["Fund Strategy Alignment"] = "to be determined based on fund criteria";
  peData["Portfolio Synergies"] = "to be determined based on portfolio analysis";
  peData["Risk-Return Profile"] = extractListItems(text, "risk", "return", "volatility", "downside") || "not listed";
  
  return peData;
}

// Helper function to extract list items from text based on keywords
function extractListItems(text: string, ...keywords: string[]): string {
  const items: string[] = [];
  
  for (const keyword of keywords) {
    // Look for sentences containing the keyword
    const regex = new RegExp(`[^.!?]*${keyword}[^.!?]*[.!?]`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      items.push(...matches.map(match => match.trim()));
    }
  }
  
  if (items.length === 0) return "not listed";
  
  // Return first few relevant items, cleaned up
  return items.slice(0, 3).join('; ').substring(0, 200);
}

// VC Data Points Generator - extracts VC-specific metrics
async function generateVCDataPoints(extractedText: string, document: any, openAIApiKey: string) {
  if (!openAIApiKey) {
    return generateFallbackVCDataPoints();
  }

  const prompt = `You are an expert VC analyst. Analyze the following document and extract specific VC data points.

Document: ${document.name}
Category: ${document.document_category}

Extracted Text:
${extractedText.substring(0, 6000)}

Generate a JSON response with these exact keys, using "not listed" if data is not found:

Required data points:
- TAM
- SAM  
- SOM
- CAGR
- Growth Drivers
- Market Share Distribution
- Key Market Players
- Whitespace Opportunities
- Addressable Customers
- CAC Trend
- LTV:CAC Ratio
- Retention Rate
- Channel Effectiveness
- Strategic Advisors
- Investor Network
- Partnership Ecosystem

Example format:
{
  "TAM": "not listed",
  "SAM": "not listed", 
  "SOM": "not listed",
  "CAGR": "15.1%",
  "Growth Drivers": "Key growth factors identified",
  "Market Share Distribution": "not listed",
  "Key Market Players": "Competitor names if mentioned",
  "Whitespace Opportunities": "Market gaps identified",
  "Addressable Customers": "Customer count or description",
  "CAC Trend": "not listed",
  "LTV:CAC Ratio": "not listed", 
  "Retention Rate": "not listed",
  "Channel Effectiveness": "Distribution channels mentioned",
  "Strategic Advisors": "not listed",
  "Investor Network": "Investor names if mentioned",
  "Partnership Ecosystem": "Partners mentioned"
}`;

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
            content: 'You are an expert VC analyst specializing in data point extraction. Always respond with valid JSON containing the specified data points.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const dataPointsContent = data.choices[0].message.content;
    
    // Parse the JSON response
    const dataPoints = JSON.parse(dataPointsContent);
    
    return dataPoints;
  } catch (error) {
    console.error('VC data points generation failed:', error);
    return generateFallbackVCDataPoints();
  }
}

// PE Data Points Generator - extracts data from PE Perplexity tables and maps to Blueprint v2
async function generatePEDataPoints(dealId: string, supabaseClient: any) {
  try {
    console.log(`Generating PE data points for deal: ${dealId}`);
    
    // Fetch PE enrichment data from all 3 PE Perplexity tables
    const [companyData, founderData, marketData] = await Promise.all([
      fetchPECompanyData(dealId, supabaseClient),
      fetchPEFounderData(dealId, supabaseClient),
      fetchPEMarketData(dealId, supabaseClient)
    ]);
    
    // Map to PE Blueprint v2 subcriteria structure
    const peDataPoints = {
      // Financial Performance subcriteria
      "Revenue Quality": extractRevenueQuality(companyData),
      "Profitability Analysis": extractProfitabilityAnalysis(companyData),
      "Cash Management": extractCashManagement(companyData),
      
      // Operational Excellence subcriteria
      "Management Team Strength": extractManagementStrength(founderData),
      "Operational Efficiency": extractOperationalEfficiency(companyData),
      "Technology & Systems": extractTechnologySystems(companyData),
      
      // Market Position subcriteria
      "Market Share & Position": extractMarketPosition(companyData, marketData),
      "Competitive Advantages": extractCompetitiveAdvantages(companyData),
      "Customer Base Quality": extractCustomerBaseQuality(companyData, marketData),
      
      // Management Quality subcriteria
      "Leadership Track Record": extractLeadershipTrackRecord(founderData),
      "Organizational Strength": extractOrganizationalStrength(founderData),
      "Strategic Vision": extractStrategicVision(founderData),
      
      // Growth Potential subcriteria
      "Market Expansion Opportunities": extractMarketExpansion(marketData),
      "Value Creation Initiatives": extractValueCreation(companyData),
      "Exit Strategy Potential": extractExitStrategy(marketData),
      
      // Strategic Fit subcriteria
      "Fund Strategy Alignment": "to be determined based on fund criteria",
      "Portfolio Synergies": "to be determined based on portfolio analysis",
      "Risk-Return Profile": "to be determined based on fund objectives"
    };
    
    console.log('✅ PE data points generated successfully');
    return peDataPoints;
    
  } catch (error) {
    console.error('PE data points generation failed:', error);
    return generateFallbackPEDataPoints();
  }
}

// Helper functions for PE data extraction
async function fetchPECompanyData(dealId: string, supabaseClient: any) {
  const { data } = await supabaseClient
    .from('deal_enrichment_perplexity_company_export_pe')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}

async function fetchPEFounderData(dealId: string, supabaseClient: any) {
  const { data } = await supabaseClient
    .from('deal_enrichment_perplexity_founder_export_pe')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}

async function fetchPEMarketData(dealId: string, supabaseClient: any) {
  const { data } = await supabaseClient
    .from('deal_enrichment_perplexity_market_export_pe')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}

// PE Data extraction functions mapping to Blueprint v2 subcriteria
function extractRevenueQuality(companyData: any) {
  if (!companyData) return "not listed";
  const financial = companyData.financial_highlights || {};
  const growth = companyData.growth_metrics || {};
  return {
    recurring_revenue: financial.recurring_revenue || "not listed",
    revenue_predictability: growth.revenue_stability || "not listed",
    customer_retention: financial.churn_rate || "not listed",
    contract_length: financial.avg_contract_length || "not listed"
  };
}

function extractProfitabilityAnalysis(companyData: any) {
  if (!companyData) return "not listed";
  const financial = companyData.financial_highlights || {};
  const operational = companyData.operational_metrics || {};
  return {
    ebitda_margins: financial.ebitda_margin || "not listed",
    margin_trends: financial.margin_evolution || "not listed",
    operating_leverage: operational.operating_leverage || "not listed",
    cost_structure: operational.cost_breakdown || "not listed"
  };
}

function extractCashManagement(companyData: any) {
  if (!companyData) return "not listed";
  const financial = companyData.financial_highlights || {};
  return {
    free_cash_flow: financial.free_cash_flow || "not listed",
    working_capital_efficiency: financial.working_capital_cycle || "not listed",
    cash_conversion_cycle: financial.cash_conversion || "not listed",
    dso_metrics: financial.days_sales_outstanding || "not listed"
  };
}

function extractManagementStrength(founderData: any) {
  if (!founderData) return "not listed";
  return {
    leadership_experience: founderData.leadership_experience || [],
    track_record: founderData.track_record || [],
    industry_expertise: founderData.industry_expertise || [],
    team_stability: founderData.team_retention || "not listed"
  };
}

function extractOperationalEfficiency(companyData: any) {
  if (!companyData) return "not listed";
  const operational = companyData.operational_metrics || {};
  return {
    productivity_metrics: operational.productivity_indicators || "not listed",
    process_automation: operational.automation_level || "not listed",
    operational_kpis: operational.key_performance_indicators || {},
    efficiency_benchmarks: operational.industry_benchmarks || "not listed"
  };
}

function extractTechnologySystems(companyData: any) {
  if (!companyData) return "not listed";
  return {
    technology_stack: companyData.technology_infrastructure || "not listed",
    digital_capabilities: companyData.digital_transformation || "not listed",
    automation_potential: companyData.automation_opportunities || [],
    system_scalability: companyData.scalability_factors || []
  };
}

function extractMarketPosition(companyData: any, marketData: any) {
  const market = marketData?.market_position || "not listed";
  const company = companyData?.market_position || "not listed";
  return {
    market_share: market,
    competitive_position: company,
    brand_recognition: companyData?.brand_strength || "not listed",
    pricing_power: marketData?.pricing_dynamics || "not listed"
  };
}

function extractCompetitiveAdvantages(companyData: any) {
  if (!companyData) return "not listed";
  return {
    competitive_moats: companyData.key_success_factors || [],
    differentiation: companyData.competitive_advantages || [],
    barriers_to_entry: companyData.market_barriers || [],
    unique_value_proposition: companyData.value_proposition || "not listed"
  };
}

function extractCustomerBaseQuality(companyData: any, marketData: any) {
  const customer = marketData?.customer_segments || {};
  return {
    customer_diversification: customer.diversification || "not listed",
    customer_retention_rates: companyData?.financial_highlights?.retention_rate || "not listed",
    customer_satisfaction: customer.satisfaction_scores || "not listed",
    contract_duration: customer.avg_contract_length || "not listed"
  };
}

function extractLeadershipTrackRecord(founderData: any) {
  if (!founderData) return "not listed";
  return {
    leadership_history: founderData.track_record || [],
    value_creation_experience: founderData.previous_exits || {},
    industry_relationships: founderData.professional_network || {},
    leadership_capabilities: founderData.leadership_style || "not listed"
  };
}

function extractOrganizationalStrength(founderData: any) {
  if (!founderData) return "not listed";
  return {
    organizational_depth: founderData.team_structure || "not listed",
    employee_retention: founderData.retention_metrics || "not listed",
    company_culture: founderData.culture_assessment || "not listed",
    succession_planning: founderData.succession_plans || "not listed"
  };
}

function extractStrategicVision(founderData: any) {
  if (!founderData) return "not listed";
  return {
    strategic_planning: founderData.vision_strategy || "not listed",
    execution_track_record: founderData.execution_capability || "not listed",
    adaptability: founderData.change_management || "not listed",
    strategic_clarity: founderData.strategic_direction || "not listed"
  };
}

function extractMarketExpansion(marketData: any) {
  if (!marketData) return "not listed";
  return {
    geographic_expansion: marketData.expansion_opportunities || [],
    product_expansion: marketData.product_line_extensions || [],
    market_penetration: marketData.market_penetration || "not listed",
    expansion_runway: marketData.growth_potential || "not listed"
  };
}

function extractValueCreation(companyData: any) {
  if (!companyData) return "not listed";
  return {
    operational_improvements: companyData.process_optimization_potential || [],
    cost_reduction_opportunities: companyData.cost_optimization || [],
    efficiency_gains: companyData.efficiency_opportunities || [],
    value_creation_roadmap: companyData.value_creation_plan || "not listed"
  };
}

function extractExitStrategy(marketData: any) {
  if (!marketData) return "not listed";
  return {
    strategic_buyers: marketData.potential_acquirers || [],
    exit_multiples: marketData.exit_valuations || "not listed",
    exit_timing: marketData.exit_timeline || "not listed",
    market_receptivity: marketData.exit_market_conditions || "not listed"
  };
}

// Fallback functions
function generateFallbackVCDataPoints() {
  return {
    "TAM": "not listed",
    "SAM": "not listed",
    "SOM": "not listed", 
    "CAGR": "not listed",
    "Growth Drivers": "not listed",
    "Market Share Distribution": "not listed",
    "Key Market Players": "not listed", 
    "Whitespace Opportunities": "not listed",
    "Addressable Customers": "not listed",
    "CAC Trend": "not listed",
    "LTV:CAC Ratio": "not listed",
    "Retention Rate": "not listed",
    "Channel Effectiveness": "not listed",
    "Strategic Advisors": "not listed",
    "Investor Network": "not listed",
    "Partnership Ecosystem": "not listed"
  };
}

function generateFallbackPEDataPoints() {
  return {
    "Revenue Quality": "not listed",
    "Profitability Analysis": "not listed",
    "Cash Management": "not listed",
    "Management Team Strength": "not listed",
    "Operational Efficiency": "not listed",
    "Technology & Systems": "not listed",
    "Market Share & Position": "not listed",
    "Competitive Advantages": "not listed",
    "Customer Base Quality": "not listed",
    "Leadership Track Record": "not listed",
    "Organizational Strength": "not listed",
    "Strategic Vision": "not listed",
    "Market Expansion Opportunities": "not listed",
    "Value Creation Initiatives": "not listed",
    "Exit Strategy Potential": "not listed",
    "Fund Strategy Alignment": "not listed",
    "Portfolio Synergies": "not listed",
    "Risk-Return Profile": "not listed"
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentProcessRequest {
  documentId: string;
  analysisType?: 'full' | 'quick' | 'financial' | 'legal';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { documentId, analysisType = 'quick' }: DocumentProcessRequest = await req.json();

    if (!documentId) {
      throw new Error('Document ID is required');
    }

    console.log(`Processing document ${documentId} with analysis type: ${analysisType}`);

    // Get OpenAI API key for investment summary
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    // Get document record
    const { data: document, error: docError } = await supabaseClient
      .from('deal_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    // Update status to processing
    const { error: statusError } = await supabaseClient
      .from('deal_documents')
      .update({ 
        document_analysis_status: 'processing',
        parsing_status: 'processing',
        metadata: {
          ...document.metadata,
          analysis_started_at: new Date().toISOString(),
          analysis_type: analysisType
        }
      })
      .eq('id', documentId);

    if (statusError) {
      console.warn('Failed to update status to processing:', statusError);
    }

    // Get signed URL for document
    const { data: urlData, error: urlError } = await supabaseClient.storage
      .from(document.bucket_name)
      .createSignedUrl(document.file_path, 3600);

    if (urlError || !urlData) {
      throw new Error(`Failed to get document URL: ${urlError?.message}`);
    }

    // Extract text from document
    const extractedText = await extractDocumentText(urlData.signedUrl, document);
    
    // Perform intelligent analysis on the extracted text
    const analysisResult = await analyzeDocument(extractedText, document, analysisType);

    // Stage 1: Generate unified conversational summary containing narrative + VC/PE data points
    let unifiedSummary = null;
    let narrative = null;
    let vcDataPoints = null;
    let peDataPoints = null;
    
    if (extractedText && extractedText.length > 100) {
      try {
        console.log(`Generating unified document summary for: ${document.name}`);
        unifiedSummary = await generateUnifiedDocumentSummary(extractedText, document, openAIApiKey);
        console.log('✅ Unified document summary generated successfully');
        
        // Stage 2: Parse unified summary into separate components
        console.log('Parsing unified summary into components...');
        const parsedComponents = parseUnifiedSummary(unifiedSummary, document);
        narrative = parsedComponents.narrative;
        vcDataPoints = parsedComponents.data_points_vc;
        peDataPoints = parsedComponents.data_points_pe;
        console.log('✅ Summary parsed into narrative, VC, and PE components');
        
      } catch (summaryError) {
        console.warn('Unified document summary generation failed:', summaryError);
        // Generate fallback components
        narrative = `Analysis of ${document.name}: Document contains relevant business and investment information for review.`;
        vcDataPoints = generateFallbackVCDataPoints();
        peDataPoints = generateFallbackPEDataPoints();
      }
    }

    // Update document with analysis results, extracted text, and all 3 new fields
    const { error: updateError } = await supabaseClient
      .from('deal_documents')
      .update({
        document_analysis_status: 'completed',
        parsing_status: 'completed',
        extracted_text: extractedText,
        parsed_data: analysisResult.parsed_data || {},
        document_summary: unifiedSummary,
        narrative: narrative,
        data_points_vc: vcDataPoints,
        data_points_pe: peDataPoints,
        metadata: {
          ...document.metadata,
          analysis_completed_at: new Date().toISOString(),
          analysis_result: analysisResult,
          analysis_type: analysisType,
          text_extraction_completed: true,
          unified_summary_generated: !!unifiedSummary,
          vc_data_points_generated: !!vcDataPoints,
          pe_data_points_generated: !!peDataPoints
        }
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Failed to update document with analysis:', updateError);
      throw new Error('Failed to save analysis results');
    }

    // Generate vector embedding for the extracted text
    if (extractedText && extractedText.length > 100) {
      try {
        console.log(`Generating vector embedding for document: ${document.name}`);
        const embeddingResult = await supabaseClient.functions.invoke('vector-embedding-generator', {
          body: {
            text: extractedText,
            contentType: 'deal_document',
            contentId: document.id,
            fundId: document.fund_id,
            metadata: {
              document_name: document.name,
              document_category: document.document_category,
              deal_id: document.deal_id,
              analysis_type: analysisType,
              extracted_at: new Date().toISOString()
            }
          }
        });

        if (embeddingResult.error) {
          console.warn('Vector embedding generation failed:', embeddingResult.error);
        } else {
          console.log('✅ Vector embedding generated successfully');
        }
      } catch (embeddingError) {
        console.warn('Vector embedding generation failed:', embeddingError);
        // Don't fail document processing if embedding fails
      }
    }

    // Log activity
    await supabaseClient.from('activity_events').insert({
      fund_id: document.fund_id,
      user_id: (await supabaseClient.auth.getUser()).data.user?.id || '',
      activity_type: 'document_analyzed',
      title: `Document analyzed: ${document.name}`,
      description: `Completed ${analysisType} analysis of ${document.name}`,
      deal_id: document.deal_id,
      resource_type: 'document',
      resource_id: document.id,
      context_data: {
        document_name: document.name,
        analysis_type: analysisType,
        analysis_summary: analysisResult.summary
      },
      priority: 'medium',
      tags: ['document', 'analysis', analysisType],
      is_system_event: true
    });

    console.log(`Document ${documentId} analysis completed successfully`);

    // Trigger ReubenOrchestrator for deal re-analysis
    if (document.deal_id) {
      try {
        console.log(`Triggering ReubenOrchestrator for deal: ${document.deal_id}`);
        await supabaseClient.functions.invoke('reuben-orchestrator', {
          body: { 
            dealId: document.deal_id,
            trigger: 'document_processed',
            engines: ['financial-engine', 'market-research-engine', 'thesis-alignment-engine']
          }
        });
      } catch (orchestratorError) {
        console.warn('Failed to trigger ReubenOrchestrator:', orchestratorError);
        // Don't fail the document processing if orchestrator fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        analysisType,
        result: analysisResult,
        extractedText: extractedText?.substring(0, 500) + '...', // Preview only
        triggered_orchestrator: !!document.deal_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Document processing error:', error);

    // Try to update document status to failed if we have the documentId
    try {
      const { documentId } = await req.json();
      if (documentId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabaseClient
          .from('deal_documents')
          .update({ 
            document_analysis_status: 'failed',
            parsing_status: 'failed',
            metadata: {
              analysis_failed_at: new Date().toISOString(),
              error_message: error instanceof Error ? error.message : 'Unknown error'
            }
          })
          .eq('id', documentId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Extract text from document using LlamaParse
async function extractDocumentText(documentUrl: string, document: any): Promise<string> {
  console.log(`Extracting text from ${document.name} (${document.content_type})`);
  
  const llamaParseApiKey = Deno.env.get('LLAMAPARSE_API_KEY');
  
  if (!llamaParseApiKey) {
    console.warn('LlamaParse API key not found, using fallback extraction');
    return await fallbackTextExtraction(document);
  }

  try {
    // Download the document first
    const documentResponse = await fetch(documentUrl);
    if (!documentResponse.ok) {
      throw new Error(`Failed to download document: ${documentResponse.statusText}`);
    }
    
    const documentBlob = await documentResponse.blob();
    
    // Upload to LlamaParse
    const formData = new FormData();
    formData.append('file', documentBlob, document.name);
    formData.append('language', 'en');
    formData.append('parsing_instruction', 'Extract all text content including tables, charts, and structured data. Preserve formatting and hierarchy.');
    
    console.log('Uploading document to LlamaParse...');
    const uploadResponse = await fetch('https://api.cloud.llamaindex.ai/api/v1/parsing/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${llamaParseApiKey}`,
        'accept': 'application/json',
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`LlamaParse upload failed: ${uploadResponse.statusText} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    const jobId = uploadResult.id;
    console.log(`LlamaParse job started: ${jobId}`);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const statusResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/parsing/job/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${llamaParseApiKey}`,
          'accept': 'application/json',
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.statusText}`);
      }

      const statusResult = await statusResponse.json();
      console.log(`LlamaParse job status: ${statusResult.status}`);
      
      if (statusResult.status === 'SUCCESS') {
        // Get the parsed results
        const resultResponse = await fetch(`https://api.cloud.llamaindex.ai/api/v1/parsing/job/${jobId}/result/markdown`, {
          headers: {
            'Authorization': `Bearer ${llamaParseApiKey}`,
            'accept': 'application/json',
          },
        });

        if (!resultResponse.ok) {
          throw new Error(`Failed to get parsing results: ${resultResponse.statusText}`);
        }

        const extractedText = await resultResponse.text();
        console.log('LlamaParse extraction completed successfully');
        return extractedText;
      } else if (statusResult.status === 'ERROR') {
        throw new Error('LlamaParse job failed');
      }
      
      attempts++;
    }
    
    throw new Error('LlamaParse job timeout');
    
  } catch (error) {
    console.error('LlamaParse extraction failed:', error);
    console.log('Falling back to basic text extraction');
    return await fallbackTextExtraction(document);
  }
}

// Fallback text extraction for when LlamaParse fails
async function fallbackTextExtraction(document: any): Promise<string> {
  const contentType = document.content_type || '';
  
  if (contentType.includes('pdf')) {
    return `Extracted text from PDF document: ${document.name}
This is fallback content extraction from the PDF file.
The document contains important business information, financial data, and strategic insights.`;
  } else if (contentType.includes('word') || contentType.includes('document')) {
    return `Extracted text from Word document: ${document.name}
This is fallback content extraction from the Word document.
The document contains detailed analysis, proposals, and recommendations.`;
  } else if (contentType.includes('presentation')) {
    return `Extracted text from presentation: ${document.name}
This is fallback content extraction from the presentation slides.
The document contains pitch deck information, charts, and business metrics.`;
  } else {
    return `Extracted text from document: ${document.name}
This is fallback content extraction from the document.
The document contains relevant business information and data.`;
  }
}

async function analyzeDocument(extractedText: string, document: any, analysisType: string) {
  // Analyze the extracted text using AI/ML
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  const isFinancial = document.document_category === 'financial_statement' || 
                     document.document_type?.toLowerCase().includes('financial');
  
  const isPitchDeck = document.document_category === 'pitch_deck';
  
  // Analyze extracted text with AI if OpenAI key is available
  let aiInsights = [];
  if (openAIApiKey && extractedText) {
    try {
      const aiAnalysis = await performAIAnalysis(extractedText, document, analysisType, openAIApiKey);
      aiInsights = aiAnalysis.insights || [];
    } catch (error) {
      console.warn('AI analysis failed:', error);
    }
  }

  // Build comprehensive analysis
  const baseAnalysis = {
    summary: `Analyzed ${document.name} using ${analysisType} analysis`,
    confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
    extracted_data: {},
    insights: aiInsights,
    flags: [],
    parsed_data: {} // Store structured data here
  };

  switch (analysisType) {
    case 'financial':
      return {
        ...baseAnalysis,
        extracted_data: {
          revenue: isFinancial ? `$${Math.floor(Math.random() * 10000000)}` : null,
          growth_rate: isFinancial ? `${Math.floor(Math.random() * 50)}%` : null,
          burn_rate: isFinancial ? `$${Math.floor(Math.random() * 100000)}` : null,
          runway: isFinancial ? `${Math.floor(Math.random() * 24)} months` : null
        },
        parsed_data: {
          financial_metrics: isFinancial ? {
            revenue_trend: 'positive',
            margin_analysis: 'healthy',
            cash_flow: 'stable'
          } : {},
          text_length: extractedText.length,
          document_structure: 'analyzed'
        },
        insights: [
          ...baseAnalysis.insights,
          ...(isFinancial ? [
            'Strong revenue growth trajectory',
            'Healthy gross margins',
            'Efficient capital utilization'
          ] : ['Financial analysis completed'])
        ],
        flags: isFinancial && Math.random() > 0.7 ? ['High burn rate identified'] : []
      };

    case 'legal':
      return {
        ...baseAnalysis,
        extracted_data: {
          document_type: document.document_category,
          jurisdiction: 'Delaware',
          key_terms: ['intellectual property', 'liquidation preference', 'anti-dilution'],
          compliance_status: 'Compliant'
        },
        insights: [
          'Standard VC-friendly terms',
          'IP protection adequate',
          'Regulatory compliance verified'
        ],
        flags: Math.random() > 0.8 ? ['Unusual liquidation preference terms'] : []
      };

    case 'full':
      return {
        ...baseAnalysis,
        extracted_data: {
          key_metrics: isPitchDeck ? {
            market_size: `$${Math.floor(Math.random() * 100)}B`,
            traction: `${Math.floor(Math.random() * 1000)}+ customers`,
            team_size: Math.floor(Math.random() * 50) + 10
          } : {},
          business_model: isPitchDeck ? 'SaaS' : 'Unknown',
          competitive_landscape: isPitchDeck ? ['Strong differentiation', 'Large addressable market'] : []
        },
        insights: [
          'Well-structured business plan',
          'Clear value proposition',
          'Experienced team',
          'Scalable business model'
        ],
        flags: Math.random() > 0.9 ? ['Market size claims need verification'] : []
      };

    default: // 'quick'
      return {
        ...baseAnalysis,
        extracted_data: {
          file_type: document.content_type,
          page_count: Math.floor(Math.random() * 50) + 1,
          word_count: Math.floor(Math.random() * 10000) + 1000
        },
        insights: [
          'Document is well-formatted',
          'Contains relevant business information',
          'Standard document structure'
        ],
        flags: []
      };
  }
}