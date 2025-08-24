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

interface FeatureExtractionRequest {
  org_id: string;
  fund_id: string;
  deal_id: string;
  deal_data: any;
  documents?: any[];
  context_chunks?: any[];
}

interface ExtractedFeature {
  feature_type: 'kpi' | 'risk' | 'category' | 'entity';
  feature_name: string;
  feature_value: any;
  confidence_score: number;
  source_references: any[];
  extraction_method: string;
}

serve(async (req) => {
  // 🚫 HARDCODED KILL SWITCH - FEATURE EXTRACTION ENGINE DISABLED
  console.log('🚫 FEATURE EXTRACTION ENGINE DISABLED - Kill switch active');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      success: false,
      message: 'Feature extraction engine is currently disabled by hardcoded kill switch',
      disabled: true,
      timestamp: new Date().toISOString()
    }),
    {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );

  try {
    const request: FeatureExtractionRequest = await req.json();
    
    // 🚨 EMERGENCY HARDCODED BLOCK FOR KERNEL & ASTRO DEALS
    const BLOCKED_DEALS = ['7ac26a5f-34c9-4d30-b09c-c05d1d1df81d', '98c22f44-87c7-4808-be1c-31929c3da52f'];
    if (BLOCKED_DEALS.includes(request.deal_id)) {
      console.log(`🛑 EMERGENCY BLOCK: Feature extraction terminated for blocked deal: ${request.deal_id}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'EMERGENCY_SHUTDOWN_ACTIVE',
        message: 'Deal processing blocked by emergency shutdown protocol',
        deal_id: request.deal_id,
        timestamp: new Date().toISOString()
      }), {
        status: 423, // Locked status
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`🔬 [Feature Extraction] Starting extraction for deal: ${request.deal_id}`);

    // Step 1: Extract structured data from tables/documents
    const table_features = await extractTableFeatures(request);
    
    // Step 2: Extract KPIs and metrics
    const kpi_features = await extractKPIFeatures(request);
    
    // Step 3: Identify risk factors
    const risk_features = await extractRiskFeatures(request);
    
    // Step 4: Categorize business aspects
    const category_features = await extractCategoryFeatures(request);
    
    // Step 5: Extract and canonicalize entities
    const entity_features = await extractEntityFeatures(request);

    // Combine all features
    const all_features = [
      ...table_features,
      ...kpi_features,
      ...risk_features,
      ...category_features,
      ...entity_features
    ];

    console.log(`✅ [Feature Extraction] Extracted ${all_features.length} features total`);

    // Store features in database
    if (all_features.length > 0) {
      await persistFeatures(request.org_id, request.fund_id, request.deal_id, all_features);
    }

    return new Response(JSON.stringify({
      success: true,
      deal_id: request.deal_id,
      features_extracted: all_features.length,
      features: all_features,
      extraction_stats: {
        table_features: table_features.length,
        kpi_features: kpi_features.length,
        risk_features: risk_features.length,
        category_features: category_features.length,
        entity_features: entity_features.length
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [Feature Extraction] Failed:', error);
    
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

async function extractTableFeatures(request: FeatureExtractionRequest): Promise<ExtractedFeature[]> {
  console.log('📊 [Feature Extraction] Extracting table features...');
  
  const features: ExtractedFeature[] = [];
  
  // Look for structured data in deal documents
  const { data: documents } = await supabase
    .from('deal_documents')
    .select('parsed_data, document_type')
    .eq('deal_id', request.deal_id)
    .not('parsed_data', 'is', null);

  for (const doc of documents || []) {
    if (doc.parsed_data?.tables) {
      for (const table of doc.parsed_data.tables) {
        // Extract financial metrics from tables
        const financial_metrics = extractFinancialMetricsFromTable(table);
        features.push(...financial_metrics.map(metric => ({
          feature_type: 'kpi' as const,
          feature_name: metric.name,
          feature_value: metric.value,
          confidence_score: 90,
          source_references: [{ doc_type: doc.document_type, table_index: table.index }],
          extraction_method: 'table_parser'
        })));
      }
    }
  }
  
  return features;
}

async function extractKPIFeatures(request: FeatureExtractionRequest): Promise<ExtractedFeature[]> {
  console.log('📈 [Feature Extraction] Extracting KPI features...');
  
  const context_text = (request.context_chunks || [])
    .map(chunk => chunk.content)
    .join('\n\n')
    .slice(0, 8000); // Limit context

  if (!context_text.trim()) {
    return [];
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `Extract key performance indicators (KPIs) from the provided context. Return a JSON array of objects with:
            - name: KPI name
            - value: extracted value (number or string)
            - unit: unit of measurement if applicable
            - confidence: confidence score 0-100
            - source_quote: exact quote from context
            
            Focus on: revenue, growth rate, market size, customer metrics, financial ratios, team size, funding amounts.`
          },
          {
            role: 'user',
            content: `Company: ${request.deal_data.company_name}\n\nContext:\n${context_text}\n\nExtract KPIs:`
          }
        ],
        max_completion_tokens: 2000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const extracted_kpis = JSON.parse(data.choices[0].message.content || '[]');
    
    return extracted_kpis.map((kpi: any) => ({
      feature_type: 'kpi' as const,
      feature_name: kpi.name,
      feature_value: {
        value: kpi.value,
        unit: kpi.unit,
        source_quote: kpi.source_quote
      },
      confidence_score: kpi.confidence || 75,
      source_references: [{ method: 'text_extraction', quote: kpi.source_quote }],
      extraction_method: 'llm_extraction'
    }));

  } catch (error) {
    console.error('KPI extraction failed:', error);
    return [];
  }
}

async function extractRiskFeatures(request: FeatureExtractionRequest): Promise<ExtractedFeature[]> {
  console.log('⚠️ [Feature Extraction] Extracting risk features...');
  
  const context_text = (request.context_chunks || [])
    .map(chunk => chunk.content)
    .join('\n\n')
    .slice(0, 8000);

  if (!context_text.trim()) {
    return [];
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `Identify risk factors from the provided context. Return a JSON array of objects with:
            - name: Risk factor name
            - category: market/financial/operational/team/technology/regulatory
            - severity: low/medium/high
            - description: risk description
            - confidence: confidence score 0-100
            - source_quote: exact quote from context
            
            Focus on: competitive threats, market risks, financial risks, operational challenges, regulatory issues.`
          },
          {
            role: 'user',
            content: `Company: ${request.deal_data.company_name}\n\nContext:\n${context_text}\n\nIdentify risks:`
          }
        ],
        max_completion_tokens: 2000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const extracted_risks = JSON.parse(data.choices[0].message.content || '[]');
    
    return extracted_risks.map((risk: any) => ({
      feature_type: 'risk' as const,
      feature_name: risk.name,
      feature_value: {
        category: risk.category,
        severity: risk.severity,
        description: risk.description,
        source_quote: risk.source_quote
      },
      confidence_score: risk.confidence || 75,
      source_references: [{ method: 'risk_analysis', quote: risk.source_quote }],
      extraction_method: 'llm_risk_analysis'
    }));

  } catch (error) {
    console.error('Risk extraction failed:', error);
    return [];
  }
}

async function extractCategoryFeatures(request: FeatureExtractionRequest): Promise<ExtractedFeature[]> {
  console.log('🏷️ [Feature Extraction] Extracting category features...');
  
  // Basic categorization based on deal data
  const features: ExtractedFeature[] = [];
  
  if (request.deal_data.industry) {
    features.push({
      feature_type: 'category',
      feature_name: 'industry',
      feature_value: request.deal_data.industry,
      confidence_score: 95,
      source_references: [{ field: 'industry', source: 'deal_data' }],
      extraction_method: 'structured_data'
    });
  }
  
  if (request.deal_data.company_stage) {
    features.push({
      feature_type: 'category',
      feature_name: 'company_stage',
      feature_value: request.deal_data.company_stage,
      confidence_score: 95,
      source_references: [{ field: 'company_stage', source: 'deal_data' }],
      extraction_method: 'structured_data'
    });
  }
  
  if (request.deal_data.funding_stage) {
    features.push({
      feature_type: 'category',
      feature_name: 'funding_stage',
      feature_value: request.deal_data.funding_stage,
      confidence_score: 95,
      source_references: [{ field: 'funding_stage', source: 'deal_data' }],
      extraction_method: 'structured_data'
    });
  }
  
  return features;
}

async function extractEntityFeatures(request: FeatureExtractionRequest): Promise<ExtractedFeature[]> {
  console.log('🏢 [Feature Extraction] Extracting entity features...');
  
  const features: ExtractedFeature[] = [];
  
  // Extract canonical entities
  if (request.deal_data.company_name) {
    features.push({
      feature_type: 'entity',
      feature_name: 'company_name',
      feature_value: request.deal_data.company_name,
      confidence_score: 100,
      source_references: [{ field: 'company_name', source: 'deal_data' }],
      extraction_method: 'structured_data'
    });
  }
  
  if (request.deal_data.founder) {
    features.push({
      feature_type: 'entity',
      feature_name: 'founder',
      feature_value: request.deal_data.founder,
      confidence_score: 95,
      source_references: [{ field: 'founder', source: 'deal_data' }],
      extraction_method: 'structured_data'
    });
  }
  
  if (request.deal_data.location) {
    features.push({
      feature_type: 'entity',
      feature_name: 'location',
      feature_value: request.deal_data.location,
      confidence_score: 95,
      source_references: [{ field: 'location', source: 'deal_data' }],
      extraction_method: 'structured_data'
    });
  }
  
  return features;
}

function extractFinancialMetricsFromTable(table: any): Array<{name: string, value: any}> {
  const metrics: Array<{name: string, value: any}> = [];
  
  // Simple table parsing - could be enhanced
  if (table.headers && table.rows) {
    const revenue_col = table.headers.findIndex((h: string) => 
      h.toLowerCase().includes('revenue') || h.toLowerCase().includes('sales')
    );
    
    if (revenue_col >= 0) {
      table.rows.forEach((row: any[], index: number) => {
        if (row[revenue_col] && !isNaN(parseFloat(row[revenue_col]))) {
          metrics.push({
            name: `revenue_${index}`,
            value: parseFloat(row[revenue_col])
          });
        }
      });
    }
  }
  
  return metrics;
}

async function persistFeatures(
  org_id: string,
  fund_id: string, 
  deal_id: string,
  features: ExtractedFeature[]
): Promise<void> {
  
  console.log(`💾 [Feature Extraction] Persisting ${features.length} features...`);
  
  const feature_records = features.map(feature => ({
    org_id,
    fund_id,
    deal_id,
    feature_type: feature.feature_type,
    feature_name: feature.feature_name,
    feature_value: feature.feature_value,
    confidence_score: feature.confidence_score,
    source_references: feature.source_references,
    extraction_method: feature.extraction_method,
    validation_status: 'pending'
  }));

  const { error } = await supabase
    .from('deal_features')
    .upsert(feature_records, {
      onConflict: 'org_id,fund_id,deal_id,feature_type,feature_name'
    });

  if (error) {
    console.error('Failed to persist features:', error);
    throw error;
  }

  console.log('✅ [Feature Extraction] Features persisted successfully');
}