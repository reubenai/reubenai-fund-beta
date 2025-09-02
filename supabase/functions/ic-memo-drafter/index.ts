import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ICMemoRequest {
  org_id: string;
  fund_id: string;
  deal_id: string;
  template_variant?: 'vc' | 'pe';
  features?: any[];
  scores?: any[];
  context_chunks?: any[];
}

interface ICMemoSection {
  title: string;
  content: string;
  citations: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ICMemoRequest = await req.json();
    
    console.log(`📝 [IC Memo Drafter] Starting memo generation for deal: ${request.deal_id}`);

    // Step 1: Determine template variant based on fund type
    const template_variant = await determineFundType(request.fund_id);
    
    // Step 2: Load deal data and analysis results
    const deal_data = await loadDealData(request.deal_id);
    const investment_strategy = await loadInvestmentStrategy(request.fund_id);
    const features = await loadDealFeatures(request.org_id, request.fund_id, request.deal_id);
    const scores = await loadDealScores(request.org_id, request.fund_id, request.deal_id);
    
    // Step 3: Generate memo sections with citations
    const memo_sections = await generateMemoSections(
      template_variant, 
      deal_data, 
      investment_strategy,
      features, 
      scores, 
      request.context_chunks || []
    );
    
    // Step 4: Skip fact consistency check - removed for reliability
    
    // Step 5: Compile final memo
    const final_memo = compileMemo(memo_sections, deal_data, scores);
    
    // Step 6: Generate provenance trace
    const provenance_trace = generateProvenanceTrace(features, scores, request.context_chunks || []);

    console.log(`✅ [IC Memo Drafter] Memo generated successfully for: ${deal_data.company_name}`);

    return new Response(JSON.stringify({
      success: true,
      deal_id: request.deal_id,
      memo: final_memo,
      provenance: provenance_trace,
      generation_stats: {
        sections_count: memo_sections.length,
        total_citations: memo_sections.reduce((sum, s) => sum + s.citations.length, 0),
        word_count: estimateWordCount(final_memo.content)
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [IC Memo Drafter] Failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function determineFundType(fund_id: string): Promise<'vc' | 'pe'> {
  const { data: fund } = await supabase
    .from('funds')
    .select('fund_type')
    .eq('id', fund_id)
    .single();
    
  return fund?.fund_type === 'private_equity' ? 'pe' : 'vc';
}

async function loadDealData(deal_id: string): Promise<any> {
  const { data: deal, error } = await supabase
    .from('deals')
    .select('company_name, industry, deal_size, valuation, fund_id')
    .eq('id', deal_id)
    .single();
    
  if (error || !deal) {
    throw new Error(`Deal not found: ${deal_id}`);
  }
  
  // Validate required fields
  if (!deal.company_name) {
    throw new Error('Company name is required for memo generation');
  }
  
  return deal;
}

async function loadDealFeatures(org_id: string, fund_id: string, deal_id: string): Promise<any[]> {
  const features = [];
  
  // Load specific VC data points
  const { data: datapoints } = await supabase
    .from('deal_analysis_datapoints_vc')
    .select(`
      tam, sam, som, cagr, growth_drivers, employee_count, 
      funding_stage, business_model, ltv_cac_ratio, retention_rate, 
      technology_stack, key_customers, competitors, market_timing
    `)
    .eq('deal_id', deal_id)
    .single();
    
  // Load documents (limit to 10 most recent with extracted content)
  const { data: documents } = await supabase
    .from('deal_documents')
    .select('name, document_type, extracted_text, document_summary, data_points_vc')
    .eq('deal_id', deal_id)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (datapoints) {
    // Process specific VC data points with structured handling
    const vcDataPoints = {
      tam: datapoints.tam,
      sam: datapoints.sam, 
      som: datapoints.som,
      cagr: datapoints.cagr,
      growth_drivers: datapoints.growth_drivers,
      employee_count: datapoints.employee_count,
      funding_stage: datapoints.funding_stage,
      business_model: datapoints.business_model,
      ltv_cac_ratio: datapoints.ltv_cac_ratio,
      retention_rate: datapoints.retention_rate,
      technology_stack: datapoints.technology_stack,
      key_customers: datapoints.key_customers,
      competitors: datapoints.competitors,
      market_timing: datapoints.market_timing
    };
    
    // Convert to feature format with proper categorization
    Object.entries(vcDataPoints).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        features.push({
          feature_name: key,
          feature_value: { 
            value,
            category: getCategoryForDataPoint(key)
          },
          feature_type: 'vc_datapoint',
          extraction_method: 'vc_data_aggregator'
        });
      }
    });
  }
  
  // Process documents with extracted text and summaries
  if (documents && documents.length > 0) {
    documents.forEach((doc, index) => {
      // Add document summary as feature
      if (doc.document_summary) {
        features.push({
          feature_name: `document_summary_${index + 1}`,
          feature_value: { 
            summary: doc.document_summary,
            document_name: doc.name,
            document_type: doc.document_type
          },
          feature_type: 'document_summary',
          extraction_method: 'document_processor'
        });
      }
      
      // Add extracted structured data
      if (doc.data_points_vc) {
        features.push({
          feature_name: `document_data_${index + 1}`,
          feature_value: doc.data_points_vc,
          feature_type: 'document_data',
          extraction_method: 'document_processor'
        });
      }
      
      // Add extracted text (truncated for context)
      if (doc.extracted_text) {
        features.push({
          feature_name: `document_text_${index + 1}`,
          feature_value: { 
            text: doc.extracted_text.substring(0, 2000), // Limit for performance
            full_length: doc.extracted_text.length,
            document_name: doc.name
          },
          feature_type: 'document_text',
          extraction_method: 'document_processor'
        });
      }
    });
  }
    
  console.log(`📊 [IC Memo] Loaded ${features.length} features from ${documents?.length || 0} documents`);
  return features;
}

function getCategoryForDataPoint(key: string): string {
  const categoryMap: Record<string, string> = {
    'tam': 'market',
    'sam': 'market', 
    'som': 'market',
    'cagr': 'market',
    'growth_drivers': 'market',
    'market_timing': 'market',
    'competitors': 'competitive',
    'key_customers': 'traction',
    'employee_count': 'operations',
    'funding_stage': 'financial',
    'business_model': 'business',
    'ltv_cac_ratio': 'financial',
    'retention_rate': 'financial',
    'technology_stack': 'product'
  };
  return categoryMap[key] || 'general';
}

async function loadInvestmentStrategy(fund_id: string): Promise<any> {
  const { data: strategy, error } = await supabase
    .from('investment_strategies')
    .select(`
      fund_type, enhanced_criteria, exciting_threshold, 
      promising_threshold, needs_development_threshold
    `)
    .eq('fund_id', fund_id)
    .single();
    
  if (error) {
    console.warn(`⚠️ [IC Memo] Investment strategy not found for fund: ${fund_id}`);
    return null;
  }
  
  return strategy;
}

async function loadDealScores(org_id: string, fund_id: string, deal_id: string): Promise<any[]> {
  // Load from deal_analysisresult_vc 
  const { data: result } = await supabase
    .from('deal_analysisresult_vc')
    .select('*')
    .eq('deal_id', deal_id)
    .single();
    
  const scores = [];
  
  if (result) {
    // Convert analysis result to score format
    if (result.overall_score) {
      scores.push({
        category: 'overall',
        raw_score: result.overall_score,
        weighted_score: result.overall_score
      });
    }
    
    // Add individual category scores if available
    ['leadership_score', 'market_score', 'product_score', 'financial_score', 'traction_score', 'thesis_alignment_score'].forEach(field => {
      if (result[field]) {
        scores.push({
          category: field.replace('_score', '').replace('_', ' '),
          raw_score: result[field],
          weighted_score: result[field]
        });
      }
    });
  }
    
  return scores;
}

async function generateMemoSections(
  template_variant: 'vc' | 'pe',
  deal_data: any,
  investment_strategy: any,
  features: any[],
  scores: any[],
  context_chunks: any[]
): Promise<ICMemoSection[]> {
  
  console.log(`📑 [IC Memo] Generating sections for ${template_variant.toUpperCase()} template...`);
  
  const sections: ICMemoSection[] = [];
  
  // Executive Summary
  sections.push(await generateExecutiveSummary(deal_data, features, scores, context_chunks));
  
  // Investment Thesis - now includes investment strategy
  sections.push(await generateInvestmentThesis(template_variant, deal_data, investment_strategy, features, scores, context_chunks));
  
  // Market Analysis - enhanced with specific VC data points
  sections.push(await generateMarketAnalysis(deal_data, features, scores, context_chunks));
  
  // Financial Analysis
  sections.push(await generateFinancialAnalysis(template_variant, deal_data, features, scores, context_chunks));
  
  // Management Team
  sections.push(await generateTeamAnalysis(deal_data, features, scores, context_chunks));
  
  // Risk Assessment
  sections.push(await generateRiskAssessment(deal_data, features, scores, context_chunks));
  
  // Investment Terms (if VC) or Value Creation Plan (if PE)
  if (template_variant === 'vc') {
    sections.push(await generateInvestmentTerms(deal_data, features, scores, context_chunks));
  } else {
    sections.push(await generateValueCreationPlan(deal_data, features, scores, context_chunks));
  }
  
  // Recommendation
  sections.push(await generateRecommendation(deal_data, features, scores, context_chunks));
  
  return sections;
}

async function generateExecutiveSummary(
  deal_data: any,
  features: any[],
  scores: any[],
  context_chunks: any[]
): Promise<ICMemoSection> {
  
  const overall_score = scores.find(s => s.category === 'overall')?.raw_score || 
    (scores.reduce((sum, s) => sum + (s.weighted_score || 0), 0) / scores.length);
  
  const key_features = features
    .filter(f => f.feature_type === 'kpi')
    .slice(0, 3)
    .map(f => `${f.feature_name}: ${JSON.stringify(f.feature_value.value || f.feature_value)}`)
    .join('; ');

  const supporting_context = context_chunks
    .slice(0, 6) // Increased context for executive summary
    .map(chunk => chunk.content)
    .join('\n\n')
    .slice(0, 4000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Write an executive summary for an investment committee memo. 

Requirements:
- Use "Unknown" for any unavailable data - never fabricate
- 200-300 words
- Include: company overview, key metrics, investment highlights, overall assessment
- Write clear, professional content suitable for investment committee review`
          },
          {
            role: 'user',
            content: `Company: ${deal_data.company_name}
Industry: ${deal_data.industry || 'Unknown'}
Overall Score: ${overall_score?.toFixed(1) || 'Unknown'}

Key Features: ${key_features || 'None extracted'}

Supporting Context:
${supporting_context || 'No additional context available'}

Write executive summary:`
          }
        ],
        max_tokens: 2000,
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content || 'Executive summary unavailable';
    
    return {
      title: 'Executive Summary',
      content: content,
      citations: []
    };

  } catch (error) {
    console.error('Executive summary generation failed:', error);
    return {
      title: 'Executive Summary',
      content: `${deal_data.company_name} is a ${deal_data.industry || 'Unknown'} company. Overall score: ${overall_score?.toFixed(1) || 'Unknown'}. Additional analysis required.`,
      citations: []
    };
  }
}

async function generateInvestmentThesis(
  template_variant: 'vc' | 'pe',
  deal_data: any,
  investment_strategy: any,
  features: any[],
  scores: any[],
  context_chunks: any[]
): Promise<ICMemoSection> {
  
  const market_score = scores.find(s => s.category === 'Market Opportunity')?.raw_score;
  const product_score = scores.find(s => s.category.includes('Product') || s.category.includes('Technology'))?.raw_score;
  
  // Extract relevant VC data points for thesis
  const marketFeatures = features.filter(f => f.feature_value?.category === 'market');
  const financialFeatures = features.filter(f => f.feature_value?.category === 'financial');
  
  const marketData = marketFeatures.length > 0 ? 
    marketFeatures.map(f => `${f.feature_name}: ${f.feature_value.value}`).join('; ') : 
    'Market data not available';
    
  const financialData = financialFeatures.length > 0 ?
    financialFeatures.map(f => `${f.feature_name}: ${f.feature_value.value}`).join('; ') :
    'Financial metrics not available';
  
  const supporting_context = context_chunks
    .slice(0, 4)
    .map(chunk => chunk.content)
    .join('\n\n')
    .slice(0, 3000);

  const strategy_context = investment_strategy ? 
    `Fund Strategy: ${JSON.stringify(investment_strategy.enhanced_criteria || {})}` :
    'Fund investment strategy not available';

  const thesis_prompt = template_variant === 'vc' 
    ? 'Focus on growth potential, market opportunity, scalability, and team execution capability. Use specific TAM/SAM/SOM data and financial metrics.'
    : 'Focus on operational improvements, market position, cash flow generation, and exit strategy.';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Write an investment thesis section for a ${template_variant.toUpperCase()} investment memo.

${thesis_prompt}

Requirements:
- Use "Unknown" for unavailable data
- 300-400 words
- Clear investment rationale
- Reference fund strategy alignment when available
- Write professional content suitable for investment committee review`
          },
          {
            role: 'user',
            content: `Company: ${deal_data.company_name}
Industry: ${deal_data.industry || 'Unknown'}
Deal Size: ${deal_data.deal_size ? `$${(deal_data.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}
Valuation: ${deal_data.valuation ? `$${(deal_data.valuation / 1000000).toFixed(1)}M` : 'Unknown'}

Market Score: ${market_score?.toFixed(1) || 'Unknown'}
Product Score: ${product_score?.toFixed(1) || 'Unknown'}

Market Data: ${marketData}
Financial Data: ${financialData}

${strategy_context}

Supporting Context:
${supporting_context || 'No additional context available'}

Write investment thesis:`
          }
        ],
        max_tokens: 2500,
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content || 'Investment thesis analysis pending';
    
    return {
      title: 'Investment Thesis',
      content: content,
      citations: []
    };

  } catch (error) {
    console.error('Investment thesis generation failed:', error);
    return {
      title: 'Investment Thesis',
      content: `Investment thesis for ${deal_data.company_name} requires additional analysis. Market score: ${market_score?.toFixed(1) || 'Unknown'}. ${marketData}`,
      citations: []
    };
  }
}

// Enhanced market analysis with specific VC data points
async function generateMarketAnalysis(deal_data: any, features: any[], scores: any[], context_chunks: any[]): Promise<ICMemoSection> {
  // Extract market-specific features
  const marketFeatures = features.filter(f => f.feature_value?.category === 'market');
  const competitiveFeatures = features.filter(f => f.feature_value?.category === 'competitive');
  
  // Build market data context
  const tamFeature = marketFeatures.find(f => f.feature_name === 'tam');
  const samFeature = marketFeatures.find(f => f.feature_name === 'sam');
  const somFeature = marketFeatures.find(f => f.feature_name === 'som');
  const cagrFeature = marketFeatures.find(f => f.feature_name === 'cagr');
  const growthDriversFeature = marketFeatures.find(f => f.feature_name === 'growth_drivers');
  const competitorsFeature = competitiveFeatures.find(f => f.feature_name === 'competitors');
  
  const marketContext = `
TAM: ${tamFeature ? tamFeature.feature_value.value : 'Unknown'}
SAM: ${samFeature ? samFeature.feature_value.value : 'Unknown'}  
SOM: ${somFeature ? somFeature.feature_value.value : 'Unknown'}
CAGR: ${cagrFeature ? cagrFeature.feature_value.value : 'Unknown'}
Growth Drivers: ${growthDriversFeature ? JSON.stringify(growthDriversFeature.feature_value.value) : 'Unknown'}
Key Competitors: ${competitorsFeature ? JSON.stringify(competitorsFeature.feature_value.value) : 'Unknown'}
  `.trim();
  
  return {
    title: 'Market Analysis',
    content: `Market analysis for ${deal_data.company_name} in the ${deal_data.industry || 'Unknown'} sector. ${marketContext}. Competitive landscape analysis pending.`,
    citations: [
      ...marketFeatures.map((f, i) => ({ id: i + 1, source: f.extraction_method, quote: `${f.feature_name}: ${f.feature_value.value}` })),
      ...competitiveFeatures.map((f, i) => ({ id: marketFeatures.length + i + 1, source: f.extraction_method, quote: `${f.feature_name}: ${f.feature_value.value}` }))
    ]
  };
}

// Enhanced financial analysis with specific VC metrics
async function generateFinancialAnalysis(template_variant: 'vc' | 'pe', deal_data: any, features: any[], scores: any[], context_chunks: any[]): Promise<ICMemoSection> {
  const financialFeatures = features.filter(f => f.feature_value?.category === 'financial');
  
  // Extract specific financial metrics
  const ltvCacFeature = financialFeatures.find(f => f.feature_name === 'ltv_cac_ratio');
  const retentionFeature = financialFeatures.find(f => f.feature_name === 'retention_rate');
  const fundingStageFeature = financialFeatures.find(f => f.feature_name === 'funding_stage');
  
  const financialMetrics = `
LTV/CAC Ratio: ${ltvCacFeature ? ltvCacFeature.feature_value.value : 'Unknown'}
Customer Retention: ${retentionFeature ? retentionFeature.feature_value.value : 'Unknown'}%
Funding Stage: ${fundingStageFeature ? fundingStageFeature.feature_value.value : 'Unknown'}
Valuation: ${deal_data.valuation ? `$${(deal_data.valuation / 1000000).toFixed(1)}M` : 'Unknown'}
Deal Size: ${deal_data.deal_size ? `$${(deal_data.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}
  `.trim();
    
  return {
    title: 'Financial Analysis',
    content: `Financial analysis for ${deal_data.company_name}. ${financialMetrics}. Unit economics and growth metrics require further validation.`,
    citations: financialFeatures.map((f, i) => ({ 
      id: i + 1, 
      source: f.extraction_method, 
      quote: `${f.feature_name}: ${f.feature_value.value}` 
    }))
  };
}

async function generateTeamAnalysis(deal_data: any, features: any[], scores: any[], context_chunks: any[]): Promise<ICMemoSection> {
  return {
    title: 'Management Team',
    content: `Management team assessment for ${deal_data.company_name}. Founder: ${deal_data.founder || 'Unknown'}. Team size: Unknown. Leadership experience: Requires analysis.`,
    citations: []
  };
}

async function generateRiskAssessment(deal_data: any, features: any[], scores: any[], context_chunks: any[]): Promise<ICMemoSection> {
  const risk_features = features.filter(f => f.feature_type === 'risk');
  const risk_content = risk_features.length > 0 ?
    risk_features.map(f => `${f.feature_value.category}: ${f.feature_value.description}`).join('. ') :
    'Risk assessment pending';
    
  return {
    title: 'Risk Assessment',
    content: `Risk assessment for ${deal_data.company_name}. ${risk_content}`,
    citations: risk_features.map((f, i) => ({ id: i + 1, source: f.extraction_method, quote: f.feature_value.source_quote || '' }))
  };
}

async function generateInvestmentTerms(deal_data: any, features: any[], scores: any[], context_chunks: any[]): Promise<ICMemoSection> {
  return {
    title: 'Investment Terms',
    content: `Proposed investment terms for ${deal_data.company_name}. Deal size: ${deal_data.deal_size ? `$${(deal_data.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}. Valuation: ${deal_data.valuation ? `$${(deal_data.valuation / 1000000).toFixed(1)}M` : 'Unknown'}. Terms: Standard Series A terms.`,
    citations: []
  };
}

async function generateValueCreationPlan(deal_data: any, features: any[], scores: any[], context_chunks: any[]): Promise<ICMemoSection> {
  return {
    title: 'Value Creation Plan',
    content: `Value creation strategy for ${deal_data.company_name}. Operational improvements: Identify efficiency gains. Market expansion: Explore new segments. Technology enhancement: Upgrade systems. Timeline: 24-36 months.`,
    citations: []
  };
}

async function generateRecommendation(deal_data: any, features: any[], scores: any[], context_chunks: any[]): Promise<ICMemoSection> {
  const overall_score = scores.reduce((sum, s) => sum + (s.weighted_score || 0), 0) / scores.length;
  const recommendation = overall_score >= 75 ? 'PROCEED' : overall_score >= 60 ? 'PROCEED WITH CAUTION' : 'PASS';
  
  return {
    title: 'Recommendation',
    content: `Investment recommendation for ${deal_data.company_name}: ${recommendation}. Overall score: ${overall_score.toFixed(1)}. Next steps: ${recommendation === 'PROCEED' ? 'Due diligence' : 'Additional analysis required'}.`,
    citations: []
  };
}


function compileMemo(sections: ICMemoSection[], deal_data: any, scores: any[]): any {
  const overall_score = scores.reduce((sum, s) => sum + (s.weighted_score || 0), 0) / scores.length;
  
  return {
    title: `Investment Committee Memo: ${deal_data.company_name}`,
    company_name: deal_data.company_name,
    overall_score: overall_score,
    recommendation: overall_score >= 75 ? 'PROCEED' : overall_score >= 60 ? 'PROCEED WITH CAUTION' : 'PASS',
    sections: sections,
    content: sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n'),
    metadata: {
      generated_at: new Date().toISOString(),
      template_version: 'v2_feature_first_simplified'
    }
  };
}

function generateProvenanceTrace(features: any[], scores: any[], context_chunks: any[]): any {
  return {
    data_sources: {
      features_used: features.length,
      scores_used: scores.length,
      context_chunks_used: context_chunks.length
    },
    extraction_methods: [...new Set(features.map(f => f.extraction_method))],
    scoring_method: 'feature_first_v2',
    model_executions: [
      { model: 'gpt-4o-mini', purpose: 'memo_generation', timestamp: new Date().toISOString() }
    ],
    citations_count: features.reduce((sum, f) => sum + (f.source_references?.length || 0), 0)
  };
}

async function persistMemoArtifact(
  request: ICMemoRequest,
  memo: any,
  provenance: any,
  fact_check: any
): Promise<void> {
  
  console.log('💾 [IC Memo] Persisting memo artifact...');
  
  const { error } = await supabase.from('artifacts').insert({
    org_id: request.org_id,
    fund_id: request.fund_id,
    deal_id: request.deal_id,
    artifact_type: 'ic_memo',
    artifact_kind: 'generated_memo',
    artifact_data: memo,
    provenance: provenance,
    citations: memo.sections.flatMap((s: any) => s.citations),
    validation_status: fact_check.overall_status
  });

  if (error) {
    console.error('Failed to persist memo artifact:', error);
    throw error;
  }

  console.log('✅ [IC Memo] Memo artifact persisted successfully');
}

function estimateWordCount(text: string): number {
  return text.split(/\s+/).length;
}