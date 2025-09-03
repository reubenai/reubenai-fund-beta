import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Helper function to extract feature value from datapoints
const extractFeatureValue = (datapoints: any, featureName: string): any | null => {
  if (!datapoints) return null;
  return datapoints[featureName] || null;
};

// Helper function to get first N characters safely
const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + '...';
};

// Aggregate comprehensive context data from all tables
const aggregateICContextData = async (dealId: string, supabaseClient: any) => {
  console.log('📊 Aggregating comprehensive context data...');
  
  // Parallel data extraction from all 5 tables
  const [
    dealDataResult,
    fundDataResult,
    documentsResult,
    investmentStrategyResult,
    perplexityResult
  ] = await Promise.all([
    // 1. Deal basic info
    supabaseClient.from('deals').select('*').eq('id', dealId).single(),
    
    // 2. Fund data  
    supabaseClient.from('funds').select('*').eq('id', dealId).single()
      .then((result: any) => {
        if (result.error) {
          // If direct lookup fails, get via deals table
          return supabaseClient.from('deals')
            .select('fund_id')
            .eq('id', dealId)
            .single()
            .then((dealResult: any) => {
              if (dealResult.data?.fund_id) {
                return supabaseClient.from('funds')
                  .select('*')
                  .eq('id', dealResult.data.fund_id)
                  .single();
              }
              return result;
            });
        }
        return result;
      }),
    
    // 3. Documents (limited to 10 for context)
    supabaseClient.from('deal_documents')
      .select('extracted_text, document_summary, name, document_type')
      .eq('deal_id', dealId)
      .order('updated_at', { ascending: false })
      .limit(10),
    
    // 4. Investment strategy
    supabaseClient.from('investment_strategies')
      .select('*')
      .eq('fund_id', dealId)
      .maybeSingle()
      .then((result: any) => {
        if (result.error || !result.data) {
          // Get fund_id from deals table first
          return supabaseClient.from('deals')
            .select('fund_id')
            .eq('id', dealId)
            .single()
            .then((dealResult: any) => {
              if (dealResult.data?.fund_id) {
                return supabaseClient.from('investment_strategies')
                  .select('*')
                  .eq('fund_id', dealResult.data.fund_id)
                  .maybeSingle();
              }
              return result;
            });
        }
        return result;
      }),
    
    // 5. Perplexity market intelligence
    supabaseClient.from('deal_enrichment_perplexity_market_export_vc')
      .select('*')
      .eq('deal_id', dealId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  // Extract data with error handling
  const dealData = dealDataResult.data;
  const fundData = fundDataResult.data;
  const documentsData = documentsResult.data || [];
  const investmentStrategy = investmentStrategyResult.data;
  const perplexityData = perplexityResult.data;

  if (!dealData) {
    throw new Error('Deal data not found');
  }

  console.log(`📋 Context aggregated - Fund: ${fundData ? 'Found' : 'Missing'}, Documents: ${documentsData.length}, Strategy: ${investmentStrategy ? 'Found' : 'Missing'}, Perplexity: ${perplexityData ? 'Found' : 'Missing'}`);

  return {
    dealData,
    fundData,
    documentsData,
    investmentStrategy,
    perplexityData
  };
};

// AI-powered content generation using GPT-4o-mini
const generateAIContent = async (sectionType: string, contextData: any, openAIKey: string): Promise<string> => {
  const { dealData, fundData, documentsData, investmentStrategy, perplexityData } = contextData;

  // Build comprehensive context string for AI
  const buildContextString = () => {
    let context = `Company: ${dealData.company_name}\n`;
    context += `Industry: ${dealData.industry || 'Unknown'}\n`;
    context += `Overall Score: ${dealData.overall_score || 'Unknown'}\n`;
    context += `Valuation: ${dealData.valuation ? `$${(dealData.valuation / 1000000).toFixed(1)}M` : 'Unknown'}\n`;
    context += `Deal Size: ${dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}\n`;

    if (fundData) {
      context += `Fund Type: ${fundData.fund_type}\n`;
      context += `Fund Name: ${fundData.name}\n`;
    }

    if (perplexityData) {
      context += `\nMarket Intelligence:\n`;
      if (perplexityData.growth_drivers && Array.isArray(perplexityData.growth_drivers)) {
        context += `Growth Drivers: ${perplexityData.growth_drivers.join(', ')}\n`;
      }
      if (perplexityData.key_market_players && Array.isArray(perplexityData.key_market_players)) {
        context += `Market Players: ${perplexityData.key_market_players.join(', ')}\n`;
      }
    }

    if (investmentStrategy) {
      context += `\nInvestment Criteria:\n`;
      if (investmentStrategy.enhanced_criteria) {
        context += `Strategy: ${JSON.stringify(investmentStrategy.enhanced_criteria).substring(0, 500)}\n`;
      }
      context += `Thresholds - Exciting: ${investmentStrategy.exciting_threshold}, Promising: ${investmentStrategy.promising_threshold}\n`;
    }

    if (documentsData.length > 0) {
      context += `\nDocument Context:\n`;
      const docContext = documentsData
        .slice(0, 3)
        .map((doc: any) => doc.extracted_text || doc.document_summary)
        .filter((text: string) => text)
        .join('\n')
        .substring(0, 2000);
      context += docContext;
    }

    return context;
  };

  const contextString = buildContextString();
  
  // Section-specific prompts for new content creation
  const sectionPrompts: { [key: string]: string } = {
    ic_executive_summary: `Generate a professional executive summary for this investment opportunity. Focus on key investment highlights, financial metrics, market opportunity, and overall assessment. Be concise but comprehensive, highlighting the most compelling aspects of the deal.`,
    ic_company_overview: `Create a detailed company overview covering the business fundamentals, operational status, team size, funding history, and current position in the market. Focus on factual information and company positioning.`,
    ic_market_opportunity: `Analyze the market opportunity including market size (TAM/SAM/SOM), growth rates, market trends, competitive dynamics, and timing. Assess the addressable market and growth potential.`,
    ic_product_service: `Evaluate the product/service offering, technology differentiation, competitive advantages, scalability, and market fit. Focus on what makes this solution unique and defensible.`,
    ic_business_model: `Assess the business model sustainability, unit economics, revenue streams, customer acquisition, retention metrics, and scalability. Focus on financial viability and growth potential.`,
    ic_competitive_landscape: `Analyze the competitive environment, key players, market positioning, differentiation factors, and competitive advantages. Evaluate barriers to entry and competitive moats.`,
    ic_financial_analysis: `Provide financial analysis covering key metrics, unit economics, growth trajectories, capital efficiency, and financial health. Focus on quantitative assessment of the investment opportunity.`,
    ic_management_team: `Evaluate the management team's experience, track record, relevant expertise, and execution capability. Assess leadership strength and team composition.`,
    ic_risks_mitigants: `Identify key investment risks including market, execution, financial, regulatory, and competitive risks. Provide potential mitigation strategies for each major risk category.`,
    ic_exit_strategy: `Analyze potential exit opportunities, timeline, valuation scenarios, strategic acquirers, IPO potential, and value creation path. Focus on realistic exit strategies and value realization.`,
    ic_investment_terms: `Structure appropriate investment terms based on the deal characteristics, valuation, funding needs, and risk profile. Include deal size, valuation, and key terms.`,
    ic_investment_recommendation: `Provide a clear investment committee recommendation with rationale based on the overall analysis. Include recommendation (STRONG BUY/BUY/HOLD/PASS), supporting reasons, and next steps.`
  };

  const systemPrompt = `You are an expert investment analyst generating professional Investment Committee memo content. Create comprehensive new analysis based on available data. Create detailed, analytical content based on the provided data context. Focus on insights, implications, and actionable intelligence. Format your response as professional investment analysis suitable for IC review. Be specific, use data points when available, and provide clear reasoning.`;

  const userPrompt = `${sectionPrompts[sectionType]}

Context Data:
${contextString}

Generate professional investment committee content for the ${sectionType} section:`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`AI generation failed for ${sectionType}:`, error);
    // Fallback to basic template if AI fails
    return generateFallbackContent(sectionType, contextData);
  }
};

// Fallback content generation if AI fails
const generateFallbackContent = (sectionType: string, contextData: any): string => {
  const { dealData } = contextData;

  const fallbackTemplates: { [key: string]: string } = {
    ic_executive_summary: `Executive Summary for ${dealData.company_name}. Industry: ${dealData.industry || 'Unknown'}. Overall Score: ${dealData.overall_score || 'Unknown'}. Analysis pending AI generation.`,
    ic_company_overview: `${dealData.company_name} is a ${dealData.industry || 'Unknown'} company. Additional company details require further analysis.`,
    ic_market_opportunity: `Market opportunity analysis for ${dealData.company_name} in the ${dealData.industry || 'Unknown'} sector. Market sizing and competitive analysis pending.`,
    ic_product_service: `Product and service analysis for ${dealData.company_name}. Product differentiation and competitive advantages require detailed analysis.`,
    ic_business_model: `Business model analysis for ${dealData.company_name}. Unit economics and scalability metrics require validation.`,
    ic_competitive_landscape: `Competitive landscape analysis for ${dealData.company_name}. Market positioning and competitive advantages require detailed analysis.`,
    ic_financial_analysis: `Financial analysis for ${dealData.company_name}. Key financial metrics and growth trajectories require further evaluation.`,
    ic_management_team: `Management team assessment for ${dealData.company_name}. Leadership experience and team composition require analysis.`,
    ic_risks_mitigants: `Risk analysis for ${dealData.company_name}. Key risks include market, execution, and financial factors. Mitigation strategies require detailed due diligence.`,
    ic_exit_strategy: `Exit strategy analysis for ${dealData.company_name}. Multiple exit pathways available. Market timing and industry trends require evaluation.`,
    ic_investment_terms: `Investment terms for ${dealData.company_name}. Deal size: ${dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}. Valuation: ${dealData.valuation ? `$${(dealData.valuation / 1000000).toFixed(1)}M` : 'Unknown'}.`,
    ic_investment_recommendation: `Investment recommendation for ${dealData.company_name}. Comprehensive analysis required for final recommendation.`
  };

  return fallbackTemplates[sectionType] || 'Content generation pending.';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { deal_id, manual_trigger = false } = await req.json();
    
    if (!deal_id) {
      throw new Error('deal_id is required');
    }

    console.log(`🎯 IC Datapoint Sourcing (AI-Powered) - Starting analysis for deal: ${deal_id}`);

    // 1. Aggregate comprehensive context data from all 5 tables
    console.log('📊 Gathering comprehensive context data...');
    const contextData = await aggregateICContextData(deal_id, supabaseClient);
    const { dealData, fundData } = contextData;
    
    const fundId = dealData.fund_id;
    if (!fundId) {
      throw new Error('Deal does not have a fund_id');
    }

    // 2. Define all IC memo sections to generate
    const sectionTypes = [
      'ic_executive_summary',
      'ic_company_overview',
      'ic_market_opportunity',
      'ic_product_service',
      'ic_business_model',
      'ic_competitive_landscape',
      'ic_financial_analysis',
      'ic_management_team',
      'ic_risks_mitigants',
      'ic_exit_strategy',
      'ic_investment_terms',
      'ic_investment_recommendation'
    ];

    // 3. Generate AI-powered content for all sections in parallel
    console.log('🤖 Generating AI-powered IC memo content...');
    const contentPromises = sectionTypes.map(sectionType => 
      generateAIContent(sectionType, contextData, openAIKey)
        .then(content => ({ [sectionType]: content }))
        .catch(error => {
          console.error(`Failed to generate ${sectionType}:`, error);
          return { [sectionType]: generateFallbackContent(sectionType, contextData) };
        })
    );

    const contentResults = await Promise.all(contentPromises);
    
    // Combine all generated content
    const icMemoContent = contentResults.reduce((acc, result) => ({ ...acc, ...result }), {});
    
    console.log(`✅ Generated ${Object.keys(icMemoContent).length} IC memo sections`);
    
    console.log('📝 Content strategy: creation (creating new IC memo content)');

    // 4. Enhanced Investment Committee Memo Population Step
    console.log('📋 Step 4: Populating Investment Committee Memo sections...');
    
    // Define comprehensive IC memo section mapping
    const icMemoMapping = {
      ic_company_overview: 'Company Overview',
      ic_executive_summary: 'Executive Summary', 
      ic_market_opportunity: 'Market Opportunity',
      ic_product_service: 'Product & Service Analysis',
      ic_business_model: 'Business Model Assessment',
      ic_competitive_landscape: 'Competitive Landscape',
      ic_financial_analysis: 'Financial Analysis',
      ic_management_team: 'Management Team Evaluation',
      ic_risks_mitigants: 'Risks & Mitigants',
      ic_exit_strategy: 'Exit Strategy',
      ic_investment_terms: 'Investment Terms',
      ic_investment_recommendation: 'Investment Recommendation'
    };

    // Validate all required sections are present
    const missingSections = Object.keys(icMemoMapping).filter(section => !icMemoContent[section]);
    if (missingSections.length > 0) {
      console.warn(`⚠️ Missing IC memo sections: ${missingSections.join(', ')}`);
      
      // Generate fallback content for missing sections
      for (const section of missingSections) {
        console.log(`🔄 Generating fallback content for: ${icMemoMapping[section]}`);
        icMemoContent[section] = generateFallbackContent(section, contextData);
      }
    }

    // Calculate content quality metrics
    const totalWordCount = Object.values(icMemoContent).join(' ').split(/\s+/).filter(w => w.length > 0).length;
    const avgSectionLength = totalWordCount / Object.keys(icMemoContent).length;
    const contentQualityScore = Math.min(100, Math.max(0, Math.round((avgSectionLength / 150) * 100))); // Target ~150 words per section

    console.log(`📊 IC Memo Quality Metrics:
    - Sections Generated: ${Object.keys(icMemoContent).length}/${Object.keys(icMemoMapping).length}
    - Total Word Count: ${totalWordCount}
    - Average Section Length: ${Math.round(avgSectionLength)} words
    - Content Quality Score: ${contentQualityScore}%`);

    // 5. Check if deal_analysisresult_vc record exists
    const existingResult = await supabaseClient
      .from('deal_analysisresult_vc')
      .select('id, created_at')
      .eq('deal_id', deal_id)
      .maybeSingle();

    // 6. Create comprehensive result data with enhanced metadata
    const resultData = {
      deal_id: deal_id,
      fund_id: fundId,
      organization_id: fundData?.organization_id,
      // Map all IC memo sections
      ...icMemoContent,
      // Enhanced metadata
      processing_status: 'processed',
      analyzed_at: new Date().toISOString(),
      confidence_score: Math.round((contentQualityScore + (contextData.dataCompleteness || 50)) / 2),
      model_executions: {
        ic_memo_generation: {
          model: 'gpt-4o-mini',
          timestamp: new Date().toISOString(),
          sections_generated: Object.keys(icMemoContent).length,
          total_word_count: totalWordCount,
          quality_score: contentQualityScore,
          data_sources_used: ['deals', 'funds', 'documents', 'investment_strategies', 'perplexity_vc']
        }
      },
      updated_at: new Date().toISOString()
    };

    // 7. Populate Investment Committee Memo in database
    let updateResult;
    if (existingResult.data) {
      console.log(`🔄 Updating existing IC memo record (created: ${existingResult.data.created_at})`);
      updateResult = await supabaseClient
        .from('deal_analysisresult_vc')
        .update(resultData)
        .eq('id', existingResult.data.id);
    } else {
      console.log('🆕 Creating new IC memo record');
      updateResult = await supabaseClient
        .from('deal_analysisresult_vc')
        .insert({
          ...resultData,
          created_at: new Date().toISOString()
        });
    }

    if (updateResult.error) {
      throw new Error(`Failed to populate Investment Committee Memo: ${updateResult.error.message}`);
    }

    console.log(`✅ Investment Committee Memo successfully populated with ${Object.keys(icMemoContent).length} sections`);

    // 8. Copy content to IC Memo tables for display in UI
    console.log('📋 Step 8: Copying content to IC Memo tables...');
    
    // Transform IC content to memo format using proper mapping
    const memoContentMapping = {
      'ic_executive_summary': 'executive_summary',
      'ic_company_overview': 'company_overview', 
      'ic_market_opportunity': 'market_opportunity',
      'ic_product_service': 'product_service',
      'ic_business_model': 'business_model',
      'ic_competitive_landscape': 'competitive_landscape',
      'ic_financial_analysis': 'financial_analysis',
      'ic_management_team': 'management_team',
      'ic_risks_mitigants': 'risks_mitigants',
      'ic_exit_strategy': 'exit_strategy',
      'ic_investment_terms': 'investment_terms',
      'ic_investment_recommendation': 'investment_recommendation'
    };

    // Build memo content JSON structure
    const memoContent = {};
    Object.entries(icMemoContent).forEach(([key, value]) => {
      const memoKey = memoContentMapping[key];
      if (memoKey) {
        memoContent[memoKey] = value;
      }
    });

    console.log(`📝 Transformed ${Object.keys(memoContent).length} sections for memo display`);

    // Check if ic_memo record exists for this deal
    const existingMemo = await supabaseClient
      .from('ic_memos')
      .select('id, version')
      .eq('deal_id', deal_id)
      .maybeSingle();

    const memoData = {
      deal_id: deal_id,
      fund_id: fundId,
      title: `IC Memo - ${dealData.company_name}`,
      status: 'draft',
      memo_content: memoContent,
      executive_summary: icMemoContent.ic_executive_summary || null,
      investment_recommendation: icMemoContent.ic_investment_recommendation || null,
      rag_status: dealData.rag_status || 'GREEN',
      overall_score: dealData.overall_score || null,
      content_quality_score: contentQualityScore,
      content_word_count: totalWordCount,
      data_richness_score: Math.min(100, Object.keys(memoContent).length * 8),
      generation_metadata: {
        model_used: 'gpt-4o-mini',
        generated_at: new Date().toISOString(),
        sections_generated: Object.keys(memoContent).length,
        word_count: totalWordCount,
        ai_powered: true
      },
      workflow_state: 'generated',
      created_by: '00000000-0000-0000-0000-000000000000' // System user
    };

    let memoResult;
    if (existingMemo.data) {
      console.log(`🔄 Updating existing IC memo record`);
      memoResult = await supabaseClient
        .from('ic_memos')
        .update({
          ...memoData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMemo.data.id)
        .select()
        .single();
    } else {
      console.log('🆕 Creating new IC memo record');
      memoResult = await supabaseClient
        .from('ic_memos')
        .insert({
          ...memoData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
    }

    if (memoResult.error) {
      console.error('Failed to create/update IC memo:', memoResult.error);
    } else {
      console.log(`✅ IC memo record ${existingMemo.data ? 'updated' : 'created'} successfully`);
      
      // Create version entry in ic_memo_versions
      const nextVersion = (existingMemo.data?.version || 0) + 1;
      
      const versionResult = await supabaseClient
        .from('ic_memo_versions')
        .insert({
          deal_id: deal_id,
          fund_id: fundId,
          version: nextVersion,
          content: memoContent,
          description: `AI-generated memo v${nextVersion} using GPT-4o-mini`,
          created_by: '00000000-0000-0000-0000-000000000000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (versionResult.error) {
        console.error('Failed to create memo version:', versionResult.error);
      } else {
        console.log(`✅ Created memo version ${nextVersion} successfully`);
      }
    }

    // 9. Log activity with enhanced tracking
    await supabaseClient.from('activity_events').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      fund_id: fundId,
      deal_id: deal_id,
      activity_type: 'ic_analysis_completed',
      title: 'AI-Powered IC Analysis Generated',
      description: `IC memo sections generated using GPT-4o-mini AI analysis${manual_trigger ? ' (manual trigger)' : ' (automatic trigger)'}`,
      context_data: {
        trigger_type: manual_trigger ? 'manual' : 'automatic',
        sections_generated: Object.keys(icMemoContent).length,
        deal_company_name: dealData.company_name,
        ai_powered: true,
        model_used: 'gpt-4o-mini',
        content_strategy: 'creation'
      },
      priority: 'high'
    });

    console.log(`✅ AI-Powered IC Analysis completed for deal: ${deal_id}`);

    // Calculate word count from generated content
    const wordCount = Object.values(icMemoContent).join('\n').split(/\s+/).filter(word => word.length > 0).length;
    const sectionsGenerated = Object.keys(icMemoContent).length;

    return new Response(JSON.stringify({
      success: true,
      deal_id: deal_id,
      sections_generated: sectionsGenerated,
      memo_generation: {
        success: true,
        sections_generated: sectionsGenerated,
        word_count: wordCount,
        error: null,
        ai_powered: true,
        model_used: 'gpt-4o-mini'
      },
      message: 'AI-powered IC analysis completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AI-Powered IC Datapoint Sourcing:', error);
    return new Response(JSON.stringify({
      success: false,
      deal_id: 'unknown',
      sections_generated: 0,
      memo_generation: {
        success: false,
        sections_generated: 0,
        word_count: 0,
        error: error.message,
        ai_powered: false
      },
      message: 'AI-powered IC analysis failed',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});