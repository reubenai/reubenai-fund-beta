import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketEnrichmentRequest {
  dealId: string;
  companyName: string;
  additionalContext?: {
    website?: string;
    linkedin?: string;
    crunchbase?: string;
    primaryIndustries?: string[];
    industry?: string;
    location?: string;
    founders?: string[];
    founder?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Perplexity Market Enrichment - Starting request processing');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { dealId, companyName, additionalContext }: MarketEnrichmentRequest = await req.json();

    console.log(`🔍 Processing market research for: ${companyName}`);

    // Fetch comprehensive deal data for enhanced market research
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        fund_id,
        company_name,
        website,
        linkedin_url,
        crunchbase_url,
        primary_industry,
        specialized_sectors,
        location,
        headquarters,
        countries_of_operation,
        founder,
        co_founders,
        founding_year,
        business_model,
        revenue_model,
        target_market,
        technology_stack,
        competitors,
        key_customers,
        employee_count,
        company_stage,
        funding_stage,
        deal_size,
        valuation,
        funds!deals_fund_id_fkey(fund_type)
      `)
      .eq('id', dealId)
      .single();

    if (dealError || !dealData) {
      console.error('❌ Deal not found:', dealError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Deal not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if fund is venture capital
    if (dealData.funds.fund_type !== 'venture_capital') {
      console.log(`🚫 Skipping VC research for ${companyName} - Fund type is ${dealData.funds.fund_type}, not venture_capital`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'VC research only available for venture capital deals',
        data: null 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Deal ${dealId} confirmed as venture capital - proceeding with market research`);

    // Simplified input data - Company Name, Location, Founder Name, and Primary Industry
    const location = dealData.location || dealData.headquarters || 
      (dealData.countries_of_operation && Array.isArray(dealData.countries_of_operation) 
        ? dealData.countries_of_operation.join(", ") 
        : "") || 
      additionalContext?.location || "Not specified";
    
    // Handle founders - combine founder and co_founders from deal data
    let founderName = "Not specified";
    const foundersArray = [];
    if (dealData.founder) foundersArray.push(dealData.founder);
    if (dealData.co_founders && Array.isArray(dealData.co_founders)) {
      foundersArray.push(...dealData.co_founders);
    }
    if (foundersArray.length > 0) {
      founderName = foundersArray.join(", ");
    } else if (Array.isArray(additionalContext?.founders)) {
      founderName = additionalContext.founders.join(", ");
    } else if (additionalContext?.founder) {
      founderName = additionalContext.founder;
    }
    
    // Handle primary industry
    const primaryIndustry = dealData.primary_industry || 
      (Array.isArray(additionalContext?.primaryIndustries) 
        ? additionalContext.primaryIndustries[0] 
        : additionalContext?.industry) || 
      "Not specified";

    // Generate unique snapshot ID
    const snapshotId = `vc_research_${dealId}_${Date.now()}`;
    console.log(`📝 Generated snapshot ID: ${snapshotId}`);

    // Comprehensive VC investment analysis prompt - JSON format with evidence
    const userContent = `
VENTURE CAPITAL INVESTMENT ANALYSIS - JSON OUTPUT REQUIRED

Company: ${companyName}
Location: ${location}
Founder(s): ${founderName}
Primary Industry: ${primaryIndustry}

INSTRUCTIONS:
- Search using ALL available data sources
- Prioritize PRIMARY SOURCES: SEC filings, regulatory data, official company releases, financial statements
- Use SECONDARY SOURCES: reputable analysts, established financial media, verified industry reports
- Provide EVIDENCE and SOURCES for every data point

OUTPUT FORMAT: Return ONLY valid JSON with this exact structure:

{
  "founder_experience": {
    "value": "detailed assessment of founder background, prior roles, outcomes",
    "evidence": ["specific examples of experience, previous companies, roles"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "team_composition": {
    "value": "team size, key roles, backgrounds, diversity",
    "evidence": ["team member backgrounds, LinkedIn profiles, bios"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary", 
    "confidence": "high|medium|low"
  },
  "vision_communication": {
    "value": "leadership style, vision clarity, communication effectiveness",
    "evidence": ["interviews, pitch decks, public statements"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "market_size": {
    "value": "TAM/SAM/SOM figures with calculation methodology",
    "evidence": ["market research reports, industry analysis, calculation methods"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "market_timing": {
    "value": "why-now factors, market readiness, catalysts",
    "evidence": ["market trends, adoption rates, regulatory changes"],
    "sources": ["source 1", "source 2"], 
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "competitive_landscape": {
    "value": "key competitors, market positioning, differentiation",
    "evidence": ["competitor analysis, market share data, feature comparisons"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "product_innovation": {
    "value": "product uniqueness, innovation level, IP position",
    "evidence": ["patent filings, product demos, technical publications"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "technology_advantage": {
    "value": "technical moats, scalability, architecture strengths",
    "evidence": ["technical documentation, architecture reviews, performance metrics"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "product_market_fit": {
    "value": "PMF evidence, retention rates, NPS scores, customer satisfaction",
    "evidence": ["retention metrics, NPS data, customer testimonials"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "revenue_growth": {
    "value": "ARR/MRR, growth rates, revenue trends",
    "evidence": ["financial statements, SEC filings, revenue disclosures"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "customer_metrics": {
    "value": "CAC, LTV, LTV/CAC ratio, churn rates, customer count",
    "evidence": ["unit economics data, customer acquisition costs, lifetime value calculations"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "market_validation": {
    "value": "customer adoption, market penetration, validation signals",
    "evidence": ["adoption metrics, market share data, customer case studies"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "financial_performance": {
    "value": "profitability, margins, financial health indicators",
    "evidence": ["financial statements, margin analysis, profitability metrics"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "capital_efficiency": {
    "value": "capital deployed vs results, burn rate, runway",
    "evidence": ["funding amounts, burn rate data, milestone achievements"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "financial_planning": {
    "value": "financial projections, planning quality, milestone tracking",
    "evidence": ["financial models, projections accuracy, milestone delivery"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "portfolio_synergies": {
    "value": "potential synergies with existing portfolio companies",
    "evidence": ["partnership opportunities, technology synergies, market overlap"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "investment_thesis_alignment": {
    "value": "alignment with typical VC investment thesis",
    "evidence": ["sector fit, stage appropriateness, scalability potential"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  },
  "value_creation_potential": {
    "value": "specific value creation opportunities and upside potential",
    "evidence": ["growth opportunities, market expansion potential, exit scenarios"],
    "sources": ["source 1", "source 2"],
    "source_quality": "primary|secondary|tertiary",
    "confidence": "high|medium|low"
  }
}

CRITICAL: Return ONLY the JSON object above. No additional text, explanations, or formatting.
`.trim();

    console.log('🔍 Calling Perplexity API...');

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not found');
    }

    // Call Perplexity API
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: 'You are a market research analyst. Provide comprehensive and accurate research with sources.' },
          { role: 'user', content: userContent }
        ],
        max_tokens: 4000,
        top_p: 0.9,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 0,
        presence_penalty: 0
      }),
    });

    console.log('✅ Perplexity API response received');

    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API error: ${perplexityResponse.status} ${perplexityResponse.statusText}`);
    }

    const perplexityData = await perplexityResponse.json();
    const rawContent = perplexityData.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error('No content received from Perplexity API');
    }

    console.log(`📥 Raw Perplexity content received (${rawContent.length} characters)`);

    // Parse JSON immediately (following working reference pattern)
    let parsedData: any;
    try {
      console.log('📊 Starting JSON parsing and data extraction...');
      // Try direct JSON parse first
      parsedData = JSON.parse(rawContent);
      console.log('✅ JSON parsing successful');
    } catch (parseError) {
      console.log('⚠️ Direct JSON parse failed, trying to extract from markdown...');
      // Try to extract JSON from markdown code blocks
      const jsonMatch = rawContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[1]);
          console.log('✅ Successfully extracted JSON from markdown');
        } catch (markdownParseError) {
          console.error('❌ Failed to parse JSON from markdown block:', markdownParseError);
          throw new Error('Failed to parse JSON from response');
        }
      } else {
        console.error('❌ No valid JSON found in response');
        throw new Error('No valid JSON found in response');
      }
    }

    // Process and store all data in one operation (following working reference pattern)
    console.log('🔄 Processing and storing market research data...');
    const processedData = await processPerplexityMarketResponse(
      supabase, 
      dealId, 
      snapshotId, 
      companyName, 
      parsedData, 
      {
        query: userContent,
        response: rawContent,
        api_metadata: {
          model: 'sonar',
          timestamp: new Date().toISOString()
        }
      }
    );

    if (!processedData) {
      throw new Error('Failed to process and store market data');
    }

    console.log('✅ Market enrichment data processed and stored successfully');

    return new Response(JSON.stringify({
      success: true,
      snapshot_id: snapshotId,
      message: 'Market research completed and structured data populated',
      data_quality_score: processedData.dataQualityScore,
      data_points_populated: processedData.dataPointsPopulated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in perplexity-market-enrichment function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to process and store market data (following working reference pattern)
async function processPerplexityMarketResponse(
  supabase: any, 
  dealId: string, 
  snapshotId: string, 
  companyName: string, 
  parsedData: any, 
  rawResponse: any
) {
  console.log('💾 Processing and inserting market data into database...');
  
  // Check for existing record and assess data completeness
  const { data: existingRecord } = await supabase
    .from('deal_enrichment_perplexity_market_export_vc')
    .select('*')
    .eq('deal_id', dealId)
    .maybeSingle();

  // Check if 18 key data points are already populated (not just processing status)
  if (existingRecord) {
    const keyDataPoints = [
      'founder_experience', 'team_composition', 'vision_communication',
      'market_size', 'market_timing', 'competitive_landscape',
      'product_innovation', 'technology_advantage', 'product_market_fit',
      'revenue_growth', 'customer_metrics', 'market_validation',
      'financial_performance', 'capital_efficiency', 'financial_planning',
      'portfolio_synergies', 'investment_thesis_alignment', 'value_creation_potential'
    ];
    
    const populatedCount = keyDataPoints.filter(field => 
      existingRecord[field] && existingRecord[field].trim() !== ''
    ).length;
    
    if (populatedCount >= 15) { // 15 out of 18 fields populated = sufficient data
      console.log(`⚠️ Deal already has ${populatedCount}/18 market enrichment data points, skipping...`);
      return {
        dataQualityScore: Math.round((populatedCount / 18) * 100),
        dataPointsPopulated: populatedCount,
        avgConfidenceScore: existingRecord.data_quality_score || 2.5,
        structuredJSON: existingRecord.deal_enrichment_perplexity_market_export_vc_json || {}
      };
    }
    
    console.log(`🔄 Existing record has only ${populatedCount}/18 data points, enriching missing fields...`);
  }

  // Define the 18 data points mapping
  const dataPointsMapping = [
    'founder_experience',
    'team_composition', 
    'vision_communication',
    'market_size',
    'market_timing',
    'competitive_landscape',
    'product_innovation',
    'technology_advantage',
    'product_market_fit',
    'revenue_growth',
    'customer_metrics',
    'market_validation',
    'financial_performance',
    'capital_efficiency',
    'financial_planning',
    'portfolio_synergies',
    'investment_thesis_alignment',
    'value_creation_potential'
  ];

  // Extract and process each data point
  const processedFields: any = {};
  const structuredJSON: any = {};
  let dataPointsPopulated = 0;
  let totalConfidenceScore = 0;

  console.log('🔍 Processing individual data points...');
  
  for (const dataPoint of dataPointsMapping) {
    const dataPointData = parsedData[dataPoint];
    
    if (dataPointData && typeof dataPointData === 'object') {
      // Build comprehensive text entry combining value + evidence + sources
      const value = dataPointData.value || 'No data available';
      const evidence = Array.isArray(dataPointData.evidence) ? dataPointData.evidence : [];
      const sources = Array.isArray(dataPointData.sources) ? dataPointData.sources : [];
      const confidence = dataPointData.confidence || 'low';
      const sourceQuality = dataPointData.source_quality || 'tertiary';

      // Create comprehensive text content
      let textContent = value;
      if (evidence.length > 0) {
        textContent += `\n\nEvidence: ${evidence.join('; ')}`;
      }
      if (sources.length > 0) {
        textContent += `\n\nSources: ${sources.join('; ')}`;
      }
      textContent += `\n\nConfidence: ${confidence} | Source Quality: ${sourceQuality}`;

      // Store processed field for database update
      processedFields[dataPoint] = textContent;
      
      // Store structured data for JSON column
      structuredJSON[dataPoint] = {
        value,
        evidence,
        sources,
        source_quality: sourceQuality,
        confidence
      };

      dataPointsPopulated++;
      
      // Calculate confidence score (high=3, medium=2, low=1)
      const confidenceValue = confidence.toLowerCase() === 'high' ? 3 : 
                             confidence.toLowerCase() === 'medium' ? 2 : 1;
      totalConfidenceScore += confidenceValue;
      
      console.log(`✅ Processed ${dataPoint}: ${confidence} confidence`);
    } else {
      console.log(`⚠️ No data found for ${dataPoint}`);
      processedFields[dataPoint] = 'No data available';
      structuredJSON[dataPoint] = {
        value: 'No data available',
        evidence: [],
        sources: [],
        source_quality: 'tertiary',
        confidence: 'low'
      };
    }
  }

  // Calculate data quality score
  const dataQualityScore = Math.round((dataPointsPopulated / dataPointsMapping.length) * 100);
  const avgConfidenceScore = totalConfidenceScore / dataPointsMapping.length;
  
  console.log(`📊 Data Quality: ${dataQualityScore}% (${dataPointsPopulated}/${dataPointsMapping.length} fields populated)`);

  // Add metadata to structured JSON
  structuredJSON.metadata = {
    last_updated: new Date().toISOString(),
    data_completeness_percentage: dataQualityScore,
    average_confidence_score: avgConfidenceScore,
    source: 'perplexity_api',
    version: '1.0',
    company_name: companyName,
    snapshot_id: snapshotId
  };

  // Prepare UPSERT data (only populate missing fields for existing records)
  const upsertData: any = {
    deal_id: dealId,
    snapshot_id: snapshotId,
    company_name: companyName,
    
    // JSON structured data column
    deal_enrichment_perplexity_market_export_vc_json: structuredJSON,
    
    // Metadata and system fields
    raw_perplexity_response: rawResponse,
    data_quality_score: dataQualityScore,
    confidence_level: avgConfidenceScore > 2.5 ? 'high' : avgConfidenceScore > 1.5 ? 'medium' : 'low',
    processed_at: new Date().toISOString()
  };

  // For new records, set processing_status to 'processed'
  // For existing records, preserve the existing processing_status
  if (!existingRecord) {
    upsertData.processing_status = 'processed';
  }

  // Only add data points that are missing or empty in existing record
  const dataPointFields = [
    'founder_experience', 'team_composition', 'vision_communication',
    'market_size', 'market_timing', 'competitive_landscape',
    'product_innovation', 'technology_advantage', 'product_market_fit',
    'revenue_growth', 'customer_metrics', 'market_validation',
    'financial_performance', 'capital_efficiency', 'financial_planning',
    'portfolio_synergies', 'investment_thesis_alignment', 'value_creation_potential'
  ];

  dataPointFields.forEach(field => {
    const shouldUpdate = !existingRecord || 
                        !existingRecord[field] || 
                        existingRecord[field].trim() === '' ||
                        existingRecord[field] === 'No data available';
    
    if (shouldUpdate && processedFields[field]) {
      upsertData[field] = processedFields[field];
    }
  });

  const { data, error } = await supabase
    .from('deal_enrichment_perplexity_market_export_vc')
    .upsert(upsertData, { 
      onConflict: 'deal_id,snapshot_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Database insertion error:', error);
    // Fallback: try to insert with minimal data
    const fallbackData = {
      deal_id: dealId,
      snapshot_id: snapshotId,
      company_name: companyName,
      raw_perplexity_response: rawResponse,
      processing_status: 'failed',
      data_quality_score: 0
    };
    const { data: fallbackResult } = await supabase
      .from('deal_enrichment_perplexity_market_export_vc')
      .insert(fallbackData)
      .select()
      .single();
    return fallbackResult;
  }

  console.log('✅ Processed market data inserted successfully');

  // Update deal_analysis_datapoints_vc table with market data
  console.log('🎯 Updating deal_analysis_datapoints_vc with market enrichment data...');
  try {
    await updateDealAnalysisDatapointsVCFromMarket(supabase, dealId, processedFields);
    console.log('✅ Successfully updated deal_analysis_datapoints_vc');
  } catch (datapointsError) {
    console.error('❌ Failed to update deal_analysis_datapoints_vc:', datapointsError);
    // Don't fail the entire process, just log the error
  }

  return {
    dataQualityScore,
    dataPointsPopulated,
    avgConfidenceScore,
    structuredJSON
  };
}

// Helper function to update deal_analysis_datapoints_vc table with market data
async function updateDealAnalysisDatapointsVCFromMarket(supabase: any, dealId: string, processedFields: any) {
  console.log('📋 Mapping market enrichment data to deal_analysis_datapoints_vc...');

  // Get deal and fund information
  const { data: dealData, error: dealError } = await supabase
    .from('deals')
    .select(`
      id,
      fund_id,
      funds!deals_fund_id_fkey(
        id,
        organization_id
      )
    `)
    .eq('id', dealId)
    .single();

  if (dealError) {
    throw new Error(`Failed to fetch deal data: ${dealError.message}`);
  }

  // Prepare the mapped data for deal_analysis_datapoints_vc (all 18 market data points)
  const mappedData = {
    deal_id: dealId,
    fund_id: dealData.fund_id,
    organization_id: dealData.funds.organization_id,
    
    // Map all 18 data points from market enrichment
    founder_experience: processedFields.founder_experience,
    team_composition: processedFields.team_composition,
    vision_communication: processedFields.vision_communication,
    market_size: processedFields.market_size,
    market_timing: processedFields.market_timing,
    competitive_landscape: processedFields.competitive_landscape,
    product_innovation: processedFields.product_innovation,
    technology_advantage: processedFields.technology_advantage,
    product_market_fit: processedFields.product_market_fit,
    revenue_growth: processedFields.revenue_growth,
    customer_metrics: processedFields.customer_metrics,
    market_validation: processedFields.market_validation,
    financial_performance: processedFields.financial_performance,
    capital_efficiency: processedFields.capital_efficiency,
    financial_planning: processedFields.financial_planning,
    portfolio_synergies: processedFields.portfolio_synergies,
    investment_thesis_alignment: processedFields.investment_thesis_alignment,
    value_creation_potential: processedFields.value_creation_potential,
    
    // Source tracking and metadata
    source_engines: ['perplexity_market'],
    updated_at: new Date().toISOString()
  };

  // Calculate data completeness score for all 18 fields
  let completenessScore = 0;
  const fields = [
    'founder_experience',
    'team_composition',
    'vision_communication',
    'market_size',
    'market_timing',
    'competitive_landscape',
    'product_innovation',
    'technology_advantage',
    'product_market_fit',
    'revenue_growth',
    'customer_metrics',
    'market_validation',
    'financial_performance',
    'capital_efficiency',
    'financial_planning',
    'portfolio_synergies',
    'investment_thesis_alignment',
    'value_creation_potential'
  ];

  fields.forEach((field) => {
    const value = mappedData[field];
    if (value && value !== 'No data available' && value.trim().length > 0) {
      completenessScore += 6;
    }
  });

  mappedData['data_completeness_score'] = completenessScore;

  // Perform UPSERT operation
  console.log('🔄 Performing UPSERT on deal_analysis_datapoints_vc...');
  
  // Check if record exists
  const { data: existingRecord } = await supabase
    .from('deal_analysis_datapoints_vc')
    .select('id, source_engines')
    .eq('deal_id', dealId)
    .maybeSingle();

  if (existingRecord) {
    // Update existing record, merge source_engines
    const existingEngines = existingRecord.source_engines || [];
    const updatedEngines = [...new Set([...existingEngines, 'perplexity_market'])];

    const { error: updateError } = await supabase
      .from('deal_analysis_datapoints_vc')
      .update({
        ...mappedData,
        source_engines: updatedEngines
      })
      .eq('deal_id', dealId);

    if (updateError) {
      throw new Error(`Failed to update deal_analysis_datapoints_vc: ${updateError.message}`);
    }
    console.log('✅ Updated existing record in deal_analysis_datapoints_vc');
  } else {
    // Insert new record
    const { error: insertError } = await supabase
      .from('deal_analysis_datapoints_vc')
      .insert(mappedData);

    if (insertError) {
      throw new Error(`Failed to insert into deal_analysis_datapoints_vc: ${insertError.message}`);
    }
    console.log('✅ Inserted new record into deal_analysis_datapoints_vc');
  }

  console.log(`📊 Mapped ${Object.keys(mappedData).length} fields with ${completenessScore}% data completeness`);
}