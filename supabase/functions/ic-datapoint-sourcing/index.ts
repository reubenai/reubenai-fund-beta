import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to extract feature value from datapoints
const extractFeatureValue = (datapoints: any, featureName: string) => {
  if (!datapoints) return null;
  return datapoints[featureName] || null;
};

// Helper function to get first N characters safely
const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + '...';
};

// Generate IC memo content using templates
const generateICMemoContent = (
  dealData: any,
  datapointsData: any,
  documentsData: any[],
  overallScore?: number
) => {
  // Extract key features for templates
  const tamFeature = extractFeatureValue(datapointsData, 'tam');
  const samFeature = extractFeatureValue(datapointsData, 'sam');
  const somFeature = extractFeatureValue(datapointsData, 'som');
  const cagrFeature = extractFeatureValue(datapointsData, 'cagr');
  const growthDriversFeature = extractFeatureValue(datapointsData, 'growth_drivers');
  const employeeCountFeature = extractFeatureValue(datapointsData, 'employee_count');
  const fundingStageFeature = extractFeatureValue(datapointsData, 'funding_stage');
  const businessModelFeature = extractFeatureValue(datapointsData, 'business_model');
  const ltvCacFeature = extractFeatureValue(datapointsData, 'ltv_cac_ratio');
  const retentionFeature = extractFeatureValue(datapointsData, 'retention_rate');
  const techStack = extractFeatureValue(datapointsData, 'technology_stack');
  const competitors = extractFeatureValue(datapointsData, 'competitors') || [];
  
  // Prepare competitors list
  const competitorsList = Array.isArray(competitors) ? competitors.join(', ') : 'Analysis pending';
  
  // Extract first 3 key features for executive summary
  const keyFeatures = [];
  if (tamFeature) keyFeatures.push(`TAM: $${tamFeature}`);
  if (ltvCacFeature) keyFeatures.push(`LTV/CAC: ${ltvCacFeature}`);
  if (retentionFeature) keyFeatures.push(`Retention: ${retentionFeature}%`);

  // Generate supporting context from first 6 document chunks
  let supportingContext = '';
  if (documentsData && documentsData.length > 0) {
    const contextChunks = documentsData
      .slice(0, 6)
      .map(doc => doc.extracted_text || doc.document_summary)
      .filter(text => text)
      .join('\n\n');
    supportingContext = truncateText(contextChunks, 4000);
  }

  // Generate risk content
  const riskContent = 'Market Risk, Execution Risk, Financial Risk';

  // Generate recommendation based on overall score
  let recommendation = 'HOLD';
  let rationale = [];
  let nextSteps = 'Continue due diligence and schedule management presentation';
  
  const calculatedScore = overallScore || dealData.overall_score || 50;
  
  if (calculatedScore >= 70) {
    recommendation = 'STRONG BUY';
    rationale.push('High overall score indicates strong fundamentals');
    nextSteps = 'Proceed to term sheet negotiations';
  } else if (calculatedScore >= 55) {
    recommendation = 'BUY';
    rationale.push('Good overall score with potential upside');
    nextSteps = 'Complete final due diligence items';
  } else if (calculatedScore >= 40) {
    recommendation = 'HOLD';
    rationale.push('Mixed results require additional evaluation');
  } else {
    recommendation = 'PASS';
    rationale.push('Below threshold scores indicate significant concerns');
    nextSteps = 'Decline investment or request significant improvements';
  }

  return {
    // 1. Executive Summary
    ic_executive_summary: `Company: ${dealData.company_name}
Industry: ${dealData.industry || 'Unknown'}
Overall Score: ${calculatedScore || 'Unknown'}

Key Features: ${keyFeatures.slice(0, 3).join(', ') || 'Analysis pending'}

Supporting Context:
${supportingContext}

Write executive summary:`,

    // 2. Company Overview
    ic_company_overview: `${dealData.company_name} is a ${dealData.industry || 'Unknown'} company. Employee count: ${employeeCountFeature ? employeeCountFeature.feature_value?.value || employeeCountFeature : 'Unknown'}. Funding stage: ${fundingStageFeature ? fundingStageFeature.feature_value?.value || fundingStageFeature : 'Unknown'}. Founded: ${dealData.founding_year || 'Unknown'}. Company overview analysis requires additional research.`,

    // 3. Market Opportunity
    ic_market_opportunity: `Market opportunity analysis for ${dealData.company_name} in the ${dealData.industry || 'Unknown'} sector. TAM: ${tamFeature ? `$${tamFeature.feature_value?.value || tamFeature}` : 'Unknown'}, SAM: ${samFeature ? `$${samFeature.feature_value?.value || samFeature}` : 'Unknown'}, SOM: ${somFeature ? `$${somFeature.feature_value?.value || somFeature}` : 'Unknown'}, Market Growth (CAGR): ${cagrFeature ? `${cagrFeature.feature_value?.value || cagrFeature}%` : 'Unknown'}. Growth drivers: ${growthDriversFeature ? JSON.stringify(growthDriversFeature.feature_value?.value || growthDriversFeature) : 'Analysis pending'}. Market timing and competitive dynamics require further evaluation.`,

    // 4. Product & Service
    ic_product_service: `Product and service analysis for ${dealData.company_name}. Technology stack: ${Array.isArray(techStack) ? techStack.join(', ') : techStack}. Product differentiation and competitive advantages require detailed analysis. Service delivery model and scalability assessment pending.`,

    // 5. Business Model
    ic_business_model: `Business model for ${dealData.company_name}: ${businessModelFeature ? businessModelFeature.feature_value?.value || businessModelFeature : 'Analysis pending'}. Unit economics - LTV/CAC: ${ltvCacFeature ? ltvCacFeature.feature_value?.value || ltvCacFeature : 'Unknown'}, Customer retention: ${retentionFeature ? `${retentionFeature.feature_value?.value || retentionFeature}%` : 'Unknown'}. Revenue streams and scalability metrics require validation.`,

    // 6. Competitive Landscape
    ic_competitive_landscape: `Competitive landscape analysis for ${dealData.company_name}. Key competitors: ${competitorsList}. Market positioning and competitive advantages require detailed analysis. Differentiation strategy and market share assessment pending.`,

    // 7. Financial Analysis
    ic_financial_analysis: `Financial analysis for ${dealData.company_name}. LTV/CAC Ratio: ${ltvCacFeature ? ltvCacFeature.feature_value?.value || ltvCacFeature : 'Unknown'}
Customer Retention: ${retentionFeature ? retentionFeature.feature_value?.value || retentionFeature : 'Unknown'}%
Funding Stage: ${fundingStageFeature ? fundingStageFeature.feature_value?.value || fundingStageFeature : 'Unknown'}
Valuation: ${dealData.valuation ? `$${(dealData.valuation / 1000000).toFixed(1)}M` : 'Unknown'}
Deal Size: ${dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}
Unit economics and growth metrics require further validation.`,

    // 8. Management Team
    ic_management_team: `Management team assessment for ${dealData.company_name}. Founder: ${dealData.founder || 'Unknown'}. Team size: Unknown. Leadership experience: Requires analysis.`,

    // 9. Risks & Mitigants
    ic_risks_mitigants: `Key risks and mitigation strategies for ${dealData.company_name}. ${riskContent}. Mitigation strategies require detailed due diligence and management team discussions.`,

    // 10. Exit Strategy
    ic_exit_strategy: `Exit strategy analysis for ${dealData.company_name}. Multiple exit pathways available including strategic acquisition, IPO readiness, or secondary sale opportunities. Market timing and industry consolidation trends support favorable exit multiples. Target exit timeline: 5-7 years with value creation milestones.`,

    // 11. Investment Terms
    ic_investment_terms: `Proposed investment terms for ${dealData.company_name}. Deal size: ${dealData.deal_size ? `$${(dealData.deal_size / 1000000).toFixed(1)}M` : 'Unknown'}. Valuation: ${dealData.valuation ? `$${(dealData.valuation / 1000000).toFixed(1)}M` : 'Unknown'}. Terms: Standard Series A terms.`,

    // 12. Investment Recommendation
    ic_investment_recommendation: `Investment Committee recommendation for ${dealData.company_name}: **${recommendation}**. Overall score: ${calculatedScore.toFixed(1)}/100. Rationale: ${rationale.length > 0 ? rationale.join(', ') : 'Comprehensive analysis completed'}. Next steps: ${nextSteps}. Investment committee decision required by: [Date TBD].`
  };
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

    const { deal_id, manual_trigger = false } = await req.json();
    
    if (!deal_id) {
      throw new Error('deal_id is required');
    }

    console.log(`🎯 IC Datapoint Sourcing - Starting analysis for deal: ${deal_id}, manual: ${manual_trigger}`);

    // Check if this is a manual trigger by reuben admin
    if (manual_trigger) {
      // Get the user's email from the JWT token in the Authorization header
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userEmail = payload.email;
          
          // Check if user is reuben admin
          if (!userEmail || (!userEmail.includes('@goreuben.com') && !userEmail.includes('@reuben.com'))) {
            throw new Error('Manual trigger only available for Reuben admins');
          }
          console.log(`✅ Manual trigger authorized for: ${userEmail}`);
        } catch (e) {
          console.error('Token verification failed:', e);
          throw new Error('Invalid authorization token');
        }
      } else {
        throw new Error('Authorization required for manual trigger');
      }
    }

    // 1. Get deal data first
    console.log('📊 Gathering deal data from multiple sources...');
    
    const dealDataResult = await supabaseClient
      .from('deals')
      .select('*')
      .eq('id', deal_id)
      .single();

    if (dealDataResult.error) {
      throw new Error(`Failed to fetch deal data: ${dealDataResult.error.message}`);
    }

    const dealData = dealDataResult.data;
    const fundId = dealData.fund_id;

    if (!fundId) {
      throw new Error('Deal does not have a fund_id');
    }

    // 2. Get fund data and datapoints in parallel
    const [fundDataResult, datapointsResult, documentsResult] = await Promise.all([
      supabaseClient
        .from('funds')
        .select('fund_type, organization_id')
        .eq('id', fundId)
        .single(),
      
      supabaseClient
        .from('deal_analysis_datapoints_vc')
        .select('*')
        .eq('deal_id', deal_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      
      supabaseClient
        .from('deal_documents')
        .select('extracted_text, document_summary')
        .eq('deal_id', deal_id)
        .order('updated_at', { ascending: false })
        .limit(10)
    ]);

    if (fundDataResult.error) {
      throw new Error(`Failed to fetch fund data: ${fundDataResult.error.message}`);
    }

    const fundData = fundDataResult.data;
    const datapointsData = datapointsResult.data;
    const documentsData = documentsResult.data || [];

    console.log(`📋 Data collected - Datapoints: ${datapointsData ? 'Found' : 'None'}, Documents: ${documentsData.length}`);

    // 3. Generate IC memo content using templates
    console.log('🔄 Generating IC memo content using templates...');
    const icMemoContent = generateICMemoContent(
      dealData,
      datapointsData,
      documentsData,
      dealData.overall_score
    );

    // 4. Check if deal_analysisresult_vc record exists
    const existingResult = await supabaseClient
      .from('deal_analysisresult_vc')
      .select('id')
      .eq('deal_id', deal_id)
      .maybeSingle();

    // 5. Create or update deal_analysisresult_vc record
    const resultData = {
      deal_id: deal_id,
      fund_id: fundId,
      organization_id: fundData.organization_id,
      ...icMemoContent,
      processing_status: 'processed',
      updated_at: new Date().toISOString()
    };

    let updateResult;
    if (existingResult.data) {
      // Update existing record
      updateResult = await supabaseClient
        .from('deal_analysisresult_vc')
        .update(resultData)
        .eq('id', existingResult.data.id);
    } else {
      // Create new record
      updateResult = await supabaseClient
        .from('deal_analysisresult_vc')
        .insert({
          ...resultData,
          created_at: new Date().toISOString()
        });
    }

    if (updateResult.error) {
      throw new Error(`Failed to update deal_analysisresult_vc: ${updateResult.error.message}`);
    }

    // 6. Log activity
    await supabaseClient
      .from('activity_events')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // System user for automatic triggers
        fund_id: fundId,
        deal_id: deal_id,
        activity_type: 'ic_analysis_completed',
        title: 'IC Analysis Generated',
        description: `IC memo sections updated using datapoint sourcing${manual_trigger ? ' (manual trigger)' : ' (automatic trigger)'}`,
        context_data: {
          trigger_type: manual_trigger ? 'manual' : 'automatic',
          sections_updated: Object.keys(icMemoContent).length,
          deal_company_name: dealData.company_name
        },
        priority: 'high'
      });

    console.log(`✅ IC Analysis completed for deal: ${deal_id}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'IC analysis completed successfully',
      deal_id: deal_id,
      sections_updated: Object.keys(icMemoContent).length,
      processing_status: 'processed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in IC Datapoint Sourcing:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});