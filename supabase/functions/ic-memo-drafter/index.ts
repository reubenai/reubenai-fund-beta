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
  fact_check_status: 'pending' | 'passed' | 'failed';
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
    const features = await loadDealFeatures(request.org_id, request.fund_id, request.deal_id);
    const scores = await loadDealScores(request.org_id, request.fund_id, request.deal_id);
    
    // Step 3: Generate memo sections with citations
    const memo_sections = await generateMemoSections(
      template_variant, 
      deal_data, 
      features, 
      scores, 
      request.context_chunks || []
    );
    
    // Step 4: Fact consistency check
    const fact_check_results = await performFactConsistencyCheck(memo_sections, features);
    
    // Step 5: Block memo if fact check fails
    if (fact_check_results.overall_status === 'failed') {
      throw new Error(`Fact consistency check failed: ${fact_check_results.failure_reason}`);
    }
    
    // Step 6: Compile final memo
    const final_memo = compileMemo(memo_sections, deal_data, scores);
    
    // Step 7: Generate provenance trace
    const provenance_trace = generateProvenanceTrace(features, scores, request.context_chunks || []);
    
    // Step 8: Skip artifact persistence (removed per user request)

    console.log(`✅ [IC Memo Drafter] Memo generated successfully for: ${deal_data.company_name}`);

    return new Response(JSON.stringify({
      success: true,
      deal_id: request.deal_id,
      memo: final_memo,
      fact_check_status: fact_check_results.overall_status,
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
    .select('*')
    .eq('id', deal_id)
    .single();
    
  if (error || !deal) {
    throw new Error('Deal not found');
  }
  
  return deal;
}

async function loadDealFeatures(org_id: string, fund_id: string, deal_id: string): Promise<any[]> {
  // Load from deal_analysis_datapoints_vc and deal_documents
  const { data: datapoints } = await supabase
    .from('deal_analysis_datapoints_vc')
    .select('*')
    .eq('deal_id', deal_id)
    .single();
    
  const { data: documents } = await supabase
    .from('deal_documents')
    .select('name, document_type, data_points_vc, data_points_pe')
    .eq('deal_id', deal_id);
    
  const features = [];
  
  if (datapoints) {
    // Convert datapoints to feature format
    Object.entries(datapoints).forEach(([key, value]) => {
      if (value !== null && key !== 'id' && key !== 'deal_id' && key !== 'created_at' && key !== 'updated_at') {
        features.push({
          feature_name: key,
          feature_value: { value },
          feature_type: 'datapoint',
          extraction_method: 'vc_aggregator'
        });
      }
    });
  }
  
  // Add document data points
  if (documents) {
    documents.forEach(doc => {
      if (doc.data_points_vc) {
        features.push({
          feature_name: `document_${doc.name}`,
          feature_value: doc.data_points_vc,
          feature_type: 'document',
          extraction_method: 'document_processor'
        });
      }
    });
  }
    
  return features;
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
  features: any[],
  scores: any[],
  context_chunks: any[]
): Promise<ICMemoSection[]> {
  
  console.log(`📑 [IC Memo] Generating sections for ${template_variant.toUpperCase()} template...`);
  
  const sections: ICMemoSection[] = [];
  
  // Executive Summary
  sections.push(await generateExecutiveSummary(deal_data, features, scores, context_chunks));
  
  // Investment Thesis
  sections.push(await generateInvestmentThesis(template_variant, deal_data, features, scores, context_chunks));
  
  // Market Analysis
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
- Every factual claim MUST include a citation [1], [2], etc.
- Use "Unknown" for any unavailable data - never fabricate
- 200-300 words
- Include: company overview, key metrics, investment highlights, overall assessment

Return JSON: {"content": "...", "citations": [{"id": 1, "source": "...", "quote": "..."}]}`
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
    const result = JSON.parse(data.choices[0].message.content || '{"content": "Executive summary unavailable", "citations": []}');
    
    return {
      title: 'Executive Summary',
      content: result.content,
      citations: result.citations || [],
      fact_check_status: 'pending'
    };

  } catch (error) {
    console.error('Executive summary generation failed:', error);
    return {
      title: 'Executive Summary',
      content: `${deal_data.company_name} is a ${deal_data.industry || 'Unknown'} company. Overall score: ${overall_score?.toFixed(1) || 'Unknown'}. Additional analysis required.`,
      citations: [],
      fact_check_status: 'failed'
    };
  }
}

async function generateInvestmentThesis(
  template_variant: 'vc' | 'pe',
  deal_data: any,
  features: any[],
  scores: any[],
  context_chunks: any[]
): Promise<ICMemoSection> {
  
  const market_score = scores.find(s => s.category === 'Market Opportunity')?.raw_score;
  const product_score = scores.find(s => s.category.includes('Product') || s.category.includes('Technology'))?.raw_score;
  
  const supporting_context = context_chunks
    .slice(0, 4)
    .map(chunk => chunk.content)
    .join('\n\n')
    .slice(0, 3000);

  const thesis_prompt = template_variant === 'vc' 
    ? 'Focus on growth potential, market opportunity, scalability, and team execution capability.'
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
- Every factual claim MUST include a citation [1], [2], etc.
- Use "Unknown" for unavailable data
- 300-400 words
- Clear investment rationale

Return JSON: {"content": "...", "citations": [{"id": 1, "source": "...", "quote": "..."}]}`
          },
          {
            role: 'user',
            content: `Company: ${deal_data.company_name}
Market Score: ${market_score?.toFixed(1) || 'Unknown'}
Product Score: ${product_score?.toFixed(1) || 'Unknown'}

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
    const result = JSON.parse(data.choices[0].message.content || '{"content": "Investment thesis analysis pending", "citations": []}');
    
    return {
      title: 'Investment Thesis',
      content: result.content,
      citations: result.citations || [],
      fact_check_status: 'pending'
    };

  } catch (error) {
    console.error('Investment thesis generation failed:', error);
    return {
      title: 'Investment Thesis',
      content: `Investment thesis for ${deal_data.company_name} requires additional analysis. Market score: ${market_score?.toFixed(1) || 'Unknown'}.`,
      citations: [],
      fact_check_status: 'failed'
    };
  }
}

// Implement remaining section generators with similar pattern...
async function generateMarketAnalysis(deal_data: any, features: any[], scores: any[], context_chunks: any[]): Promise<ICMemoSection> {
  return {
    title: 'Market Analysis',
    content: `Market analysis for ${deal_data.company_name} in the ${deal_data.industry || 'Unknown'} sector. TAM: Unknown. Growth rate: Unknown. Competitive landscape: Requires analysis.`,
    citations: [],
    fact_check_status: 'pending'
  };
}

async function generateFinancialAnalysis(template_variant: 'vc' | 'pe', deal_data: any, features: any[], scores: any[], context_chunks: any[]): Promise<ICMemoSection> {
  const revenue_features = features.filter(f => f.feature_name.toLowerCase().includes('revenue'));
  const revenue_info = revenue_features.length > 0 ? 
    `Revenue: ${revenue_features[0].feature_value.value || 'Unknown'}` : 
    'Revenue: Unknown';
    
  return {
    title: 'Financial Analysis',
    content: `Financial analysis for ${deal_data.company_name}. ${revenue_info}. Valuation: ${deal_data.valuation ? `$${(deal_data.valuation / 1000000).toFixed(1)}M` : 'Unknown'}. Deal size: ${deal_data.deal_size ? `$${(deal_data.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}.`,
    citations: revenue_features.map((f, i) => ({ id: i + 1, source: f.extraction_method, quote: f.feature_value.source_quote || '' })),
    fact_check_status: 'pending'
  };
}

async function generateTeamAnalysis(deal_data: any, features: any[], scores: any[], context_chunks: any[]): Promise<ICMemoSection> {
  return {
    title: 'Management Team',
    content: `Management team assessment for ${deal_data.company_name}. Founder: ${deal_data.founder || 'Unknown'}. Team size: Unknown. Leadership experience: Requires analysis.`,
    citations: [],
    fact_check_status: 'pending'
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
    citations: risk_features.map((f, i) => ({ id: i + 1, source: f.extraction_method, quote: f.feature_value.source_quote || '' })),
    fact_check_status: 'pending'
  };
}

async function generateInvestmentTerms(deal_data: any, features: any[], scores: any[], context_chunks: any[]): Promise<ICMemoSection> {
  return {
    title: 'Investment Terms',
    content: `Proposed investment terms for ${deal_data.company_name}. Deal size: ${deal_data.deal_size ? `$${(deal_data.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}. Valuation: ${deal_data.valuation ? `$${(deal_data.valuation / 1000000).toFixed(1)}M` : 'Unknown'}. Terms: Standard Series A terms.`,
    citations: [],
    fact_check_status: 'pending'
  };
}

async function generateValueCreationPlan(deal_data: any, features: any[], scores: any[], context_chunks: any[]): Promise<ICMemoSection> {
  return {
    title: 'Value Creation Plan',
    content: `Value creation strategy for ${deal_data.company_name}. Operational improvements: Identify efficiency gains. Market expansion: Explore new segments. Technology enhancement: Upgrade systems. Timeline: 24-36 months.`,
    citations: [],
    fact_check_status: 'pending'
  };
}

async function generateRecommendation(deal_data: any, features: any[], scores: any[], context_chunks: any[]): Promise<ICMemoSection> {
  const overall_score = scores.reduce((sum, s) => sum + (s.weighted_score || 0), 0) / scores.length;
  const recommendation = overall_score >= 75 ? 'PROCEED' : overall_score >= 60 ? 'PROCEED WITH CAUTION' : 'PASS';
  
  return {
    title: 'Recommendation',
    content: `Investment recommendation for ${deal_data.company_name}: ${recommendation}. Overall score: ${overall_score.toFixed(1)}. Next steps: ${recommendation === 'PROCEED' ? 'Due diligence' : 'Additional analysis required'}.`,
    citations: [],
    fact_check_status: 'pending'
  };
}

async function performFactConsistencyCheck(sections: ICMemoSection[], features: any[]): Promise<any> {
  console.log('🔍 [IC Memo] Performing fact consistency check...');
  
  // Simple fact checking - could be enhanced
  const total_claims = sections.reduce((sum, s) => sum + s.citations.length, 0);
  const cited_claims = sections.filter(s => s.citations.length > 0).length;
  
  const consistency_ratio = total_claims > 0 ? cited_claims / sections.length : 0;
  
  return {
    overall_status: consistency_ratio >= 0.6 ? 'passed' : 'failed',
    consistency_ratio,
    failure_reason: consistency_ratio < 0.6 ? 'Insufficient citations for factual claims' : null,
    details: {
      total_sections: sections.length,
      sections_with_citations: cited_claims,
      total_citations: total_claims
    }
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
      template_version: 'v2_feature_first',
      fact_check_status: sections.every(s => s.fact_check_status === 'passed') ? 'passed' : 'pending'
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