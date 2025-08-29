import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DataEnhancementRequest {
  dealId: string;
  fundType: 'vc' | 'pe';
  enhancementType: 'waterfall_processing' | 'data_consolidation';
}

interface EnhancementResult {
  success: boolean;
  enhancedFields: string[];
  confidence: number;
  processingTime: number;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const { dealId, fundType, enhancementType }: DataEnhancementRequest = await req.json();
    
    console.log(`🤖 Starting AI data enhancement for deal ${dealId}, type: ${enhancementType}`);
    
    // Get existing deal data from waterfall processing
    const dealData = await collectDealData(dealId, fundType);
    
    // Get current datapoints for comparison
    const existingDatapoints = await getCurrentDatapoints(dealId, fundType);
    
    // Generate AI enhancement using GPT-4o-mini
    const enhancement = await generateAIEnhancement(dealData, existingDatapoints, fundType);
    
    // Apply enhancements to datapoints
    const updateResult = await applyEnhancements(dealId, fundType, enhancement, existingDatapoints);
    
    const processingTime = Date.now() - startTime;
    
    const result: EnhancementResult = {
      success: true,
      enhancedFields: updateResult.enhancedFields,
      confidence: enhancement.confidence,
      processingTime,
    };
    
    console.log(`✨ AI enhancement completed in ${processingTime}ms for deal ${dealId}`);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ AI enhancement error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      enhancedFields: [],
      confidence: 0,
      processingTime: 0,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function collectDealData(dealId: string, fundType: string) {
  console.log(`📊 Collecting deal data for ${dealId}`);
  
  const [
    documents,
    crunchbase,
    linkedinProfile,
    linkedinExport,
    perplexityCompany,
    perplexityFounder,
    perplexityMarket
  ] = await Promise.allSettled([
    // Documents
    supabase.from('deal_documents')
      .select('extracted_text, parsed_data, document_summary')
      .eq('deal_id', dealId)
      .eq('processing_status', 'completed'),
    
    // Crunchbase
    supabase.from('deal_enrichment_crunchbase_export')
      .select('*')
      .eq('deal_id', dealId),
    
    // LinkedIn Profile
    supabase.from('deal_enrichment_linkedin_profile_export')
      .select('*')
      .eq('deal_id', dealId),
    
    // LinkedIn Export
    supabase.from('deal_enrichment_linkedin_export')
      .select('*')
      .eq('deal_id', dealId),
    
    // Perplexity Company (VC/PE specific)
    supabase.from(`deal_enrichment_perplexity_company_export_${fundType}`)
      .select('*')
      .eq('deal_id', dealId),
    
    // Perplexity Founder (VC/PE specific)
    supabase.from(`deal_enrichment_perplexity_founder_export_${fundType}`)
      .select('*')
      .eq('deal_id', dealId),
    
    // Perplexity Market (VC/PE specific)
    supabase.from(`deal_enrichment_perplexity_market_export_${fundType}`)
      .select('*')
      .eq('deal_id', dealId)
  ]);
  
  return {
    documents: documents.status === 'fulfilled' ? documents.value.data || [] : [],
    crunchbase: crunchbase.status === 'fulfilled' ? crunchbase.value.data || [] : [],
    linkedinProfile: linkedinProfile.status === 'fulfilled' ? linkedinProfile.value.data || [] : [],
    linkedinExport: linkedinExport.status === 'fulfilled' ? linkedinExport.value.data || [] : [],
    perplexityCompany: perplexityCompany.status === 'fulfilled' ? perplexityCompany.value.data || [] : [],
    perplexityFounder: perplexityFounder.status === 'fulfilled' ? perplexityFounder.value.data || [] : [],
    perplexityMarket: perplexityMarket.status === 'fulfilled' ? perplexityMarket.value.data || [] : []
  };
}

async function getCurrentDatapoints(dealId: string, fundType: string) {
  const tableName = fundType === 'vc' ? 'deal_analysis_datapoints_vc' : 'deal_analysis_datapoints_pe';
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('deal_id', dealId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // Not found is ok
    throw new Error(`Failed to get current datapoints: ${error.message}`);
  }
  
  return data || {};
}

async function generateAIEnhancement(dealData: any, existingDatapoints: any, fundType: string) {
  console.log(`🧠 Generating AI enhancement using GPT-4o-mini`);
  
  const systemPrompt = `You are an expert ${fundType.toUpperCase()} data analyst. Your task is to analyze deal data from multiple sources and provide intelligent enhancements, consolidation, and gap-filling.

Focus areas for ${fundType.toUpperCase()}:
${fundType === 'vc' 
  ? '- Market opportunity and scalability\n- Product innovation and differentiation\n- Team expertise and execution capability\n- Growth metrics and traction\n- Competitive positioning'
  : '- Operational efficiency and margin improvement\n- Market position and competitive advantages\n- Management quality and execution track record\n- Cash flow generation and financial stability\n- Value creation opportunities'
}

Provide enhancements in JSON format with confidence scores (0-100) for each field.`

  const userPrompt = `Analyze this deal data and provide intelligent enhancements:

EXISTING DATAPOINTS:
${JSON.stringify(existingDatapoints, null, 2)}

SOURCE DATA:
Documents: ${JSON.stringify(dealData.documents, null, 2)}
Crunchbase: ${JSON.stringify(dealData.crunchbase, null, 2)}
LinkedIn Profile: ${JSON.stringify(dealData.linkedinProfile, null, 2)}
LinkedIn Export: ${JSON.stringify(dealData.linkedinExport, null, 2)}
Perplexity Company: ${JSON.stringify(dealData.perplexityCompany, null, 2)}
Perplexity Founder: ${JSON.stringify(dealData.perplexityFounder, null, 2)}
Perplexity Market: ${JSON.stringify(dealData.perplexityMarket, null, 2)}

Provide enhancements for missing or incomplete fields, resolve conflicts between sources, and add intelligent defaults. Return JSON with:
- enhancements: object with field names and enhanced values
- confidence: overall confidence score (0-100)
- reasoning: brief explanation of key enhancements made
- conflictsResolved: array of conflicts resolved between sources`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;
  
  console.log(`🤖 AI Response length: ${aiResponse.length} characters`);
  
  try {
    return JSON.parse(aiResponse);
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', aiResponse);
    throw new Error('Invalid JSON response from AI');
  }
}

async function applyEnhancements(dealId: string, fundType: string, enhancement: any, existingDatapoints: any) {
  const tableName = fundType === 'vc' ? 'deal_analysis_datapoints_vc' : 'deal_analysis_datapoints_pe';
  
  // Merge enhancements with existing datapoints
  const enhancedDatapoints = {
    ...existingDatapoints,
    ...enhancement.enhancements,
    // Add AI enhancement metadata
    ai_enhancement_applied: true,
    ai_confidence_score: enhancement.confidence,
    ai_enhancement_reasoning: enhancement.reasoning,
    ai_conflicts_resolved: enhancement.conflictsResolved,
    ai_enhanced_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Ensure required fields are present
  if (!enhancedDatapoints.deal_id) {
    enhancedDatapoints.deal_id = dealId;
  }
  
  // Upsert enhanced datapoints
  const { error } = await supabase
    .from(tableName)
    .upsert(enhancedDatapoints, {
      onConflict: 'deal_id',
      ignoreDuplicates: false
    });
  
  if (error) {
    throw new Error(`Failed to update datapoints: ${error.message}`);
  }
  
  console.log(`✅ Applied ${Object.keys(enhancement.enhancements).length} enhancements`);
  
  return {
    enhancedFields: Object.keys(enhancement.enhancements)
  };
}