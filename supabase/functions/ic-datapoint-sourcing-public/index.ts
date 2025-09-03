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

// IC Memo Section Interface (from ic-memo-drafter)
interface ICMemoSection {
  title: string;
  content: string;
  citations: any[];
}

// Prepare features in ic-memo-drafter format
const prepareFeatures = (contextData: any): any[] => {
  const features = [];
  const { dealData, documentsData, perplexityData } = contextData;
  
  // Add deal-specific features
  if (dealData.company_name) {
    features.push({
      feature_name: 'company_name',
      feature_value: { value: dealData.company_name, category: 'general' },
      feature_type: 'deal_info',
      extraction_method: 'deal_data'
    });
  }
  
  if (dealData.industry) {
    features.push({
      feature_name: 'industry',
      feature_value: { value: dealData.industry, category: 'market' },
      feature_type: 'deal_info',
      extraction_method: 'deal_data'
    });
  }
  
  if (dealData.deal_size) {
    features.push({
      feature_name: 'deal_size',
      feature_value: { value: dealData.deal_size, category: 'financial' },
      feature_type: 'financial',
      extraction_method: 'deal_data'
    });
  }
  
  if (dealData.valuation) {
    features.push({
      feature_name: 'valuation',
      feature_value: { value: dealData.valuation, category: 'financial' },
      feature_type: 'financial',
      extraction_method: 'deal_data'
    });
  }
  
  // Add perplexity features if available
  if (perplexityData) {
    if (perplexityData.growth_drivers && Array.isArray(perplexityData.growth_drivers)) {
      features.push({
        feature_name: 'growth_drivers',
        feature_value: { value: perplexityData.growth_drivers, category: 'market' },
        feature_type: 'market_intelligence',
        extraction_method: 'perplexity_vc'
      });
    }
    
    if (perplexityData.key_market_players && Array.isArray(perplexityData.key_market_players)) {
      features.push({
        feature_name: 'competitors',
        feature_value: { value: perplexityData.key_market_players, category: 'competitive' },
        feature_type: 'market_intelligence',
        extraction_method: 'perplexity_vc'
      });
    }
  }
  
  // Add document features
  if (documentsData && documentsData.length > 0) {
    documentsData.slice(0, 3).forEach((doc: any, index: number) => {
      if (doc.document_summary) {
        features.push({
          feature_name: `document_summary_${index + 1}`,
          feature_value: {
            summary: doc.document_summary,
            document_name: doc.name,
            document_type: doc.document_type,
            category: 'general'
          },
          feature_type: 'document_summary',
          extraction_method: 'document_processor'
        });
      }
    });
  }
  
  return features;
};

// Prepare scores in ic-memo-drafter format
const prepareScores = (contextData: any): any[] => {
  const scores = [];
  const { dealData } = contextData;
  
  if (dealData.overall_score) {
    scores.push({
      category: 'overall',
      raw_score: dealData.overall_score,
      weighted_score: dealData.overall_score
    });
  }
  
  return scores;
};

// Generate structured memo sections with AI-powered content
const generateMemoSections = async (
  deal_data: any,
  features: any[],
  scores: any[],
  context_chunks: any[],
  contextData?: any,
  openAIKey?: string
): Promise<ICMemoSection[]> => {
  console.log(`📑 [IC Memo] Generating structured sections...`);
  console.log(`🔍 [IC Memo] Debug data - Features count: ${features.length}, Scores count: ${scores.length}`);
  
  const sections: ICMemoSection[] = [];
  
  // Executive Summary
  sections.push(await generateExecutiveSummary(deal_data, features, scores, context_chunks, contextData, openAIKey));
  
  // Company Overview
  sections.push(await generateCompanyOverview(deal_data, features, scores, context_chunks, contextData, openAIKey));
  
  // Market Opportunity
  sections.push(await generateMarketOpportunity(deal_data, features, scores, context_chunks, contextData, openAIKey));
  
  // Product & Service
  sections.push(await generateProductService(deal_data, features, scores, context_chunks, contextData, openAIKey));
  
  // Business Model
  sections.push(await generateBusinessModel(deal_data, features, scores, context_chunks, contextData, openAIKey));
  
  // Competitive Landscape
  sections.push(await generateCompetitiveLandscape(deal_data, features, scores, context_chunks, contextData, openAIKey));
  
  // Financial Analysis
  sections.push(await generateFinancialAnalysis(deal_data, features, scores, context_chunks, contextData, openAIKey));
  
  // Management Team
  sections.push(await generateTeamAnalysis(deal_data, features, scores, context_chunks, contextData, openAIKey));
  
  // Risks & Mitigants
  sections.push(await generateRisksAndMitigants(deal_data, features, scores, context_chunks, contextData, openAIKey));
  
  // Exit Strategy
  sections.push(await generateExitStrategy(deal_data, features, scores, context_chunks, contextData, openAIKey));
  
  // Investment Terms
  sections.push(await generateInvestmentTerms(deal_data, features, scores, context_chunks, contextData, openAIKey));
  
  // Investment Recommendation
  sections.push(await generateInvestmentRecommendation(deal_data, features, scores, context_chunks, contextData, openAIKey));
  
  console.log(`📋 [IC Memo] Generated ${sections.length} structured sections`);
  
  return sections;
};

// Compile memo sections into final structure (from ic-memo-drafter)
const compileMemo = (sections: ICMemoSection[], deal_data: any, scores: any[]): any => {
  const overall_score = scores.length > 0 ? 
    scores.reduce((sum, s) => sum + (s.weighted_score || 0), 0) / scores.length :
    deal_data.overall_score || 50;
  
  return {
    title: `Investment Committee Memo: ${deal_data.company_name}`,
    company_name: deal_data.company_name,
    overall_score: overall_score,
    recommendation: overall_score >= 75 ? 'PROCEED' : overall_score >= 60 ? 'PROCEED WITH CAUTION' : 'PASS',
    sections: sections,
    content: sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n'),
    metadata: {
      generated_at: new Date().toISOString(),
      template_version: 'v2_ic_datapoint_sourcing',
      ai_powered: true,
      model_used: 'gpt-4o-mini'
    }
  };
};

// Individual section generators using AI-powered content generation
const generateExecutiveSummary = async (deal_data: any, features: any[], scores: any[], context_chunks: any[], contextData?: any, openAIKey?: string): Promise<ICMemoSection> => {
  let content = '';
  
  if (contextData && openAIKey) {
    try {
      content = await generateAIContent('ic_executive_summary', contextData, openAIKey);
    } catch (error) {
      console.error('AI generation failed for executive summary:', error);
      // Fallback to enhanced template
      const overall_score = scores.find(s => s.category === 'overall')?.raw_score || deal_data.overall_score || 50;
      const key_features = features
        .slice(0, 3)
        .map(f => `${f.feature_name}: ${JSON.stringify(f.feature_value.value || f.feature_value)}`)
        .join('; ');

      content = `${deal_data.company_name} is a ${deal_data.industry || 'Unknown'} company with an overall score of ${overall_score?.toFixed(1) || 'Unknown'}/100. 

Key highlights: ${key_features || 'Analysis pending'}. 

Investment opportunity analysis shows ${overall_score >= 70 ? 'strong potential' : overall_score >= 50 ? 'moderate potential' : 'requires additional evaluation'} based on current data. 

Deal size: ${deal_data.deal_size ? `$${(deal_data.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}. Valuation: ${deal_data.valuation ? `$${(deal_data.valuation / 1000000).toFixed(1)}M` : 'Unknown'}.`;
    }
  } else {
    content = generateFallbackContent('ic_executive_summary', { dealData: deal_data });
  }

  return {
    title: 'Executive Summary',
    content: content,
    citations: []
  };
};

const generateCompanyOverview = async (deal_data: any, features: any[], scores: any[], context_chunks: any[], contextData?: any, openAIKey?: string): Promise<ICMemoSection> => {
  let content = '';
  
  if (contextData && openAIKey) {
    try {
      content = await generateAIContent('ic_company_overview', contextData, openAIKey);
    } catch (error) {
      console.error('AI generation failed for company overview:', error);
      content = `${deal_data.company_name} operates in the ${deal_data.industry || 'Unknown'} sector. Founded: ${deal_data.founding_year || 'Unknown'}. The company's current operational status and team composition require further analysis to provide comprehensive overview.`;
    }
  } else {
    content = generateFallbackContent('ic_company_overview', { dealData: deal_data });
  }

  return {
    title: 'Company Overview',
    content: content,
    citations: []
  };
};

const generateMarketOpportunity = async (deal_data: any, features: any[], scores: any[], context_chunks: any[], contextData?: any, openAIKey?: string): Promise<ICMemoSection> => {
  let content = '';
  const marketFeatures = features.filter(f => f.feature_value?.category === 'market');
  const growthDrivers = marketFeatures.find(f => f.feature_name === 'growth_drivers');
  
  if (contextData && openAIKey) {
    try {
      content = await generateAIContent('ic_market_opportunity', contextData, openAIKey);
    } catch (error) {
      console.error('AI generation failed for market opportunity:', error);
      content = `Market opportunity analysis for ${deal_data.company_name} in the ${deal_data.industry || 'Unknown'} sector. ${growthDrivers ? `Key growth drivers: ${JSON.stringify(growthDrivers.feature_value.value)}.` : ''} Market sizing and competitive dynamics analysis is pending comprehensive market research.`;
    }
  } else {
    content = generateFallbackContent('ic_market_opportunity', { dealData: deal_data });
  }
  
  return {
    title: 'Market Opportunity',
    content: content,
    citations: marketFeatures.map((f, i) => ({ id: i + 1, source: f.extraction_method, quote: `${f.feature_name}: ${f.feature_value.value}` }))
  };
};

const generateProductService = async (deal_data: any, features: any[], scores: any[], context_chunks: any[], contextData?: any, openAIKey?: string): Promise<ICMemoSection> => {
  let content = '';
  
  if (contextData && openAIKey) {
    try {
      content = await generateAIContent('ic_product_service', contextData, openAIKey);
    } catch (error) {
      console.error('AI generation failed for product service:', error);
      content = `Product and service analysis for ${deal_data.company_name}. Product differentiation, competitive advantages, and technical specifications require detailed assessment. Service delivery model and scalability factors are under evaluation.`;
    }
  } else {
    content = generateFallbackContent('ic_product_service', { dealData: deal_data });
  }

  return {
    title: 'Product & Service',
    content: content,
    citations: []
  };
};

const generateBusinessModel = async (deal_data: any, features: any[], scores: any[], context_chunks: any[], contextData?: any, openAIKey?: string): Promise<ICMemoSection> => {
  let content = '';
  
  if (contextData && openAIKey) {
    try {
      content = await generateAIContent('ic_business_model', contextData, openAIKey);
    } catch (error) {
      console.error('AI generation failed for business model:', error);
      content = `Business model assessment for ${deal_data.company_name}. Revenue streams, unit economics, and scalability metrics require validation through detailed financial analysis and management discussion.`;
    }
  } else {
    content = generateFallbackContent('ic_business_model', { dealData: deal_data });
  }

  return {
    title: 'Business Model',
    content: content,
    citations: []
  };
};

const generateCompetitiveLandscape = async (deal_data: any, features: any[], scores: any[], context_chunks: any[], contextData?: any, openAIKey?: string): Promise<ICMemoSection> => {
  let content = '';
  const competitiveFeatures = features.filter(f => f.feature_value?.category === 'competitive');
  const competitors = competitiveFeatures.find(f => f.feature_name === 'competitors');
  
  if (contextData && openAIKey) {
    try {
      content = await generateAIContent('ic_competitive_landscape', contextData, openAIKey);
    } catch (error) {
      console.error('AI generation failed for competitive landscape:', error);
      const competitorsList = competitors && Array.isArray(competitors.feature_value.value) ? 
        competitors.feature_value.value.join(', ') : 'Analysis pending';
      content = `Competitive landscape analysis for ${deal_data.company_name}. Key market players: ${competitorsList}. Market positioning and competitive advantages require detailed competitive intelligence gathering.`;
    }
  } else {
    content = generateFallbackContent('ic_competitive_landscape', { dealData: deal_data });
  }
  
  return {
    title: 'Competitive Landscape',
    content: content,
    citations: competitiveFeatures.map((f, i) => ({ id: i + 1, source: f.extraction_method, quote: `${f.feature_name}: ${f.feature_value.value}` }))
  };
};

const generateFinancialAnalysis = async (deal_data: any, features: any[], scores: any[], context_chunks: any[], contextData?: any, openAIKey?: string): Promise<ICMemoSection> => {
  let content = '';
  const financialFeatures = features.filter(f => f.feature_value?.category === 'financial');
  
  if (contextData && openAIKey) {
    try {
      content = await generateAIContent('ic_financial_analysis', contextData, openAIKey);
    } catch (error) {
      console.error('AI generation failed for financial analysis:', error);
      content = `Financial analysis for ${deal_data.company_name}. Deal size: ${deal_data.deal_size ? `$${(deal_data.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}. Valuation: ${deal_data.valuation ? `$${(deal_data.valuation / 1000000).toFixed(1)}M` : 'Unknown'}. Unit economics, growth metrics, and capital efficiency require detailed financial due diligence.`;
    }
  } else {
    content = generateFallbackContent('ic_financial_analysis', { dealData: deal_data });
  }
  
  return {
    title: 'Financial Analysis',
    content: content,
    citations: financialFeatures.map((f, i) => ({ 
      id: i + 1, 
      source: f.extraction_method, 
      quote: `${f.feature_name}: ${f.feature_value.value}` 
    }))
  };
};

const generateTeamAnalysis = async (deal_data: any, features: any[], scores: any[], context_chunks: any[], contextData?: any, openAIKey?: string): Promise<ICMemoSection> => {
  let content = '';
  
  if (contextData && openAIKey) {
    try {
      content = await generateAIContent('ic_management_team', contextData, openAIKey);
    } catch (error) {
      console.error('AI generation failed for management team:', error);
      content = `Management team assessment for ${deal_data.company_name}. Leadership experience, team composition, and execution track record require comprehensive evaluation through management presentations and reference checks.`;
    }
  } else {
    content = generateFallbackContent('ic_management_team', { dealData: deal_data });
  }

  return {
    title: 'Management Team',
    content: content,
    citations: []
  };
};

const generateRisksAndMitigants = async (deal_data: any, features: any[], scores: any[], context_chunks: any[], contextData?: any, openAIKey?: string): Promise<ICMemoSection> => {
  let content = '';
  
  if (contextData && openAIKey) {
    try {
      content = await generateAIContent('ic_risks_mitigants', contextData, openAIKey);
    } catch (error) {
      console.error('AI generation failed for risks and mitigants:', error);
      content = `Key risks for ${deal_data.company_name} include market adoption challenges, execution risks, competitive pressure, and capital requirements. Mitigation strategies require detailed due diligence and management team collaboration.`;
    }
  } else {
    content = generateFallbackContent('ic_risks_mitigants', { dealData: deal_data });
  }

  return {
    title: 'Risks & Mitigants',
    content: content,
    citations: []
  };
};

const generateExitStrategy = async (deal_data: any, features: any[], scores: any[], context_chunks: any[], contextData?: any, openAIKey?: string): Promise<ICMemoSection> => {
  let content = '';
  
  if (contextData && openAIKey) {
    try {
      content = await generateAIContent('ic_exit_strategy', contextData, openAIKey);
    } catch (error) {
      console.error('AI generation failed for exit strategy:', error);
      content = `Exit strategy for ${deal_data.company_name}. Multiple exit pathways available including strategic acquisition and potential public offering. Timeline and valuation scenarios require market analysis and industry dynamics assessment.`;
    }
  } else {
    content = generateFallbackContent('ic_exit_strategy', { dealData: deal_data });
  }

  return {
    title: 'Exit Strategy',
    content: content,
    citations: []
  };
};

const generateInvestmentTerms = async (deal_data: any, features: any[], scores: any[], context_chunks: any[], contextData?: any, openAIKey?: string): Promise<ICMemoSection> => {
  let content = '';
  
  if (contextData && openAIKey) {
    try {
      content = await generateAIContent('ic_investment_terms', contextData, openAIKey);
    } catch (error) {
      console.error('AI generation failed for investment terms:', error);
      content = `Proposed investment terms for ${deal_data.company_name}. Deal size: ${deal_data.deal_size ? `$${(deal_data.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}. Valuation: ${deal_data.valuation ? `$${(deal_data.valuation / 1000000).toFixed(1)}M` : 'Unknown'}. Term sheet structure and protective provisions under negotiation.`;
    }
  } else {
    content = generateFallbackContent('ic_investment_terms', { dealData: deal_data });
  }

  return {
    title: 'Investment Terms',
    content: content,
    citations: []
  };
};

const generateInvestmentRecommendation = async (deal_data: any, features: any[], scores: any[], context_chunks: any[], contextData?: any, openAIKey?: string): Promise<ICMemoSection> => {
  let content = '';
  
  if (contextData && openAIKey) {
    try {
      content = await generateAIContent('ic_investment_recommendation', contextData, openAIKey);
    } catch (error) {
      console.error('AI generation failed for investment recommendation:', error);
      const overall_score = scores.length > 0 ? 
        scores.reduce((sum, s) => sum + (s.weighted_score || 0), 0) / scores.length :
        deal_data.overall_score || 50;
        
      const recommendation = overall_score >= 75 ? 'PROCEED' : overall_score >= 60 ? 'PROCEED WITH CAUTION' : 'PASS';
      
      const nextSteps = recommendation === 'PROCEED' ? 
        'Initiate formal due diligence, term sheet preparation, management presentations' :
        recommendation === 'PROCEED WITH CAUTION' ?
        'Additional due diligence required, risk mitigation planning, follow-up analysis' :
        'Pass on opportunity, provide feedback to management team';
      
      content = `Investment Committee recommendation for ${deal_data.company_name}: **${recommendation}**. Overall score: ${overall_score.toFixed(1)}/100. Next steps: ${nextSteps}. Investment committee decision timeline: [To be determined].`;
    }
  } else {
    content = generateFallbackContent('ic_investment_recommendation', { dealData: deal_data });
  }

  return {
    title: 'Investment Recommendation',
    content: content,
    citations: []
  };
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

    // Use proven ic-memo-drafter approach for better content generation
    console.log(`📝 [IC] Starting structured memo generation using proven pipeline...`);
    
    let icMemoContent: Record<string, string> = {};
    let totalWordCount = 0;
    let contentQualityScore = 0;
    
    try {
      // Step 1: Prepare features and scores in ic-memo-drafter format
      const features = prepareFeatures(contextData);
      const scores = prepareScores(contextData);
      
      console.log(`📊 [IC] Prepared data - Features: ${features.length}, Scores: ${scores.length}`);
      
      // Step 2: Generate memo sections using structured approach with AI
      const memo_sections = await generateMemoSections(dealData, features, scores, [], contextData, openAIKey);
      
      console.log(`📋 [IC] Generated ${memo_sections.length} structured sections`);
      
      // Step 3: Compile final memo
      const final_memo = compileMemo(memo_sections, dealData, scores);
      
      console.log(`✅ [IC] Compiled final memo:`, {
        title: final_memo.title,
        sections_count: final_memo.sections.length,
        has_content: !!final_memo.content,
        content_length: final_memo.content?.length || 0
      });

      // Step 4: Prepare for database storage
      icMemoContent = {};
      
      // Map sections to IC columns
      memo_sections.forEach((section) => {
        const columnName = `ic_${section.title.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/__+/g, '_')}`;
        icMemoContent[columnName] = section.content;
      });

      console.log('🔄 [IC] Content mapping from structured sections:', {
        sectionsGenerated: memo_sections.length,
        icColumns: Object.keys(icMemoContent),
        sampleContent: Object.entries(icMemoContent).slice(0, 2).map(([key, value]) => ({
          column: key,
          contentLength: value.length,
          preview: value.substring(0, 100) + '...'
        }))
      });

      // Validate content quality
      const hasValidContent = memo_sections.some(section => 
        section.content && 
        section.content.trim().length > 50 && 
        !section.content.includes('Analysis pending') &&
        !section.content.includes('requires additional')
      );

      if (!hasValidContent) {
        throw new Error('Generated content quality insufficient');
      }

      totalWordCount = final_memo.content.split(/\s+/).filter(w => w.length > 0).length;
      const avgSectionLength = totalWordCount / memo_sections.length;
      contentQualityScore = Math.min(100, Math.max(0, Math.round((avgSectionLength / 150) * 100)));

      console.log(`📊 [IC] Structured Content Quality:
      - Sections Generated: ${memo_sections.length}
      - Total Word Count: ${totalWordCount}
      - Average Section Length: ${Math.round(avgSectionLength)} words
      - Content Quality Score: ${contentQualityScore}%`);

    } catch (structuredError) {
      console.error('❌ [IC] Structured memo generation failed:', structuredError);
      
      // Fallback to original approach if structured generation fails
      console.log('🔄 [IC] Falling back to individual section generation...');
      
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
      icMemoContent = contentResults.reduce((acc, result) => ({ ...acc, ...result }), {});
      
      console.log(`✅ Fallback generated ${Object.keys(icMemoContent).length} IC memo sections`);
      
      // Calculate metrics for fallback content
      totalWordCount = Object.values(icMemoContent).join(' ').split(/\s+/).filter(w => w.length > 0).length;
      const avgSectionLength = totalWordCount / Object.keys(icMemoContent).length;
      contentQualityScore = Math.min(100, Math.max(0, Math.round((avgSectionLength / 150) * 100)));
    }

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

    // Build memo content JSON structure with proper mapping
    const memoContent = {};
    console.log(`🐛 DEBUG - icMemoContent keys:`, Object.keys(icMemoContent));
    console.log(`🐛 DEBUG - icMemoContent has content:`, Object.keys(icMemoContent).map(k => `${k}: ${icMemoContent[k]?.length || 0} chars`));
    
    // Ensure we're working with the correct data structure
    Object.entries(icMemoContent).forEach(([key, value]) => {
      const memoKey = memoContentMapping[key];
      console.log(`🐛 DEBUG - Processing ${key} → ${memoKey}, has value: ${!!value}, length: ${value?.length || 0}`);
      
      if (memoKey && value && typeof value === 'string' && value.trim().length > 0) {
        memoContent[memoKey] = value;
        console.log(`✅ Mapped ${key} → ${memoKey} successfully`);
      } else {
        console.log(`❌ Skipped ${key} → ${memoKey}: ${!memoKey ? 'no mapping' : !value ? 'no value' : 'empty content'}`);
      }
    });

    console.log(`📝 Transformed ${Object.keys(memoContent).length} sections for memo display`);
    console.log(`🐛 DEBUG - Final memoContent keys:`, Object.keys(memoContent));
    console.log(`🐛 DEBUG - Final memoContent sample:`, Object.keys(memoContent).slice(0, 3).map(k => `${k}: "${memoContent[k]?.slice(0, 50)}..."`));

    // Only proceed if we have content to save
    if (Object.keys(memoContent).length === 0) {
      console.error('❌ No content to save to ic_memos - memoContent is empty');
      console.log('🐛 DEBUG - icMemoContent for verification:', Object.keys(icMemoContent).map(k => `${k}: ${icMemoContent[k]?.length || 0} chars`));
      
      // Skip memo table population but continue with the response
      return Response.json({
        success: true,
        deal_id: deal_id,
        sections_generated: Object.keys(icMemoContent).length,
        memo_generation: {
          success: false,
          sections_generated: Object.keys(icMemoContent).length,
          word_count: totalWordCount,
          error: "Generated content could not be mapped to memo format",
          ai_powered: true,
          model_used: 'gpt-4o-mini'
        },
        message: `IC analysis generated for ${Object.keys(icMemoContent).length} sections, but memo format mapping failed`
      }, { headers: corsHeaders });
    }

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
      // Also store the raw IC content as backup
      raw_ic_content: icMemoContent,
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