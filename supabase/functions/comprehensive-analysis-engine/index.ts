import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealId, fundId } = await req.json();
    
    // Fetch deal data for enhanced context
    const { data: dealData } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();
    
    // Fetch document data for enhanced analysis
    const { data: documentData } = await supabase
      .from('deal_documents')
      .select('*')
      .eq('deal_id', dealId);
    
    const extractedTexts = documentData?.filter(doc => doc.extracted_text && doc.extracted_text.trim().length > 0)
      .map(doc => ({ 
        name: doc.name,
        category: doc.document_category,
        extracted_text: doc.extracted_text,
        parsing_status: doc.parsing_status 
      })) || [];
    
    const enhancedDocumentData = {
      documents: documentData || [],
      extractedTexts,
      documentSummary: {
        total_documents: documentData?.length || 0,
        documents_with_text: extractedTexts.length
      }
    };
    
    // Query fund memory for context
    const { data: memoryContext } = await supabase.functions.invoke('fund-memory-engine', {
      body: {
        action: 'contextual_memory',
        fundId: fundId,
        context: { dealId, service: 'comprehensive-analysis' }
      }
    });

    // Call all AI engines in parallel
    const engines = [
      'market-intelligence-engine',
      'team-research-engine', 
      'financial-engine',
      'product-ip-engine',
      'enhanced-deal-analysis'
    ];

    const engineResults = await Promise.allSettled(
      engines.map(engine => 
        supabase.functions.invoke(engine, {
          body: { 
            dealId, 
            fundId, 
            context: dealData, 
            documentData: enhancedDocumentData 
          }
        })
      )
    );

    // Process results
    const analysis = await processComprehensiveAnalysis(dealId, fundId, engineResults);
    
    // Store comprehensive analysis in fund memory
    await supabase.functions.invoke('fund-memory-engine', {
      body: {
        action: 'store',
        fundId: fundId,
        dealId: dealId,
        data: {
          entryType: 'comprehensive_analysis',
          content: analysis,
          sourceService: 'comprehensive-analysis-engine',
          confidenceScore: analysis.overallConfidence,
          metadata: { 
            analysisType: 'comprehensive',
            engineCount: engines.length,
            timestamp: new Date().toISOString() 
          }
        }
      }
    });

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Comprehensive Analysis Engine error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processComprehensiveAnalysis(dealId: string, fundId: string, engineResults: any[]) {
  const results = {
    market: null,
    team: null,
    financial: null,
    product: null,
    deal: null
  };

  // Process each engine result
  engineResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value?.data) {
      const engineName = ['market', 'team', 'financial', 'product', 'deal'][index];
      results[engineName] = result.value.data;
    }
  });

  // Calculate comprehensive scores
  const scores = {
    market: results.market?.overallScore || 5,
    team: results.team?.overallScore || 5,
    financial: results.financial?.overallScore || 5,
    product: results.product?.overallScore || 5,
    deal: results.deal?.overallScore || 5
  };

  const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / 5;
  
  // Generate investment recommendation
  const recommendation = generateRecommendation(overallScore, scores);
  
  return {
    dealId,
    fundId,
    engineResults: results,
    scores,
    overallScore,
    recommendation,
    riskLevel: calculateRiskLevel(scores),
    overallConfidence: calculateConfidence(engineResults),
    keyStrengths: extractStrengths(results),
    keyRisks: extractRisks(results),
    nextSteps: generateNextSteps(recommendation, scores),
    timestamp: new Date().toISOString()
  };
}

function generateRecommendation(overallScore: number, scores: any): string {
  if (overallScore >= 8) return 'Strong Invest';
  if (overallScore >= 6.5) return 'Invest';
  if (overallScore >= 5) return 'Consider';
  if (overallScore >= 3.5) return 'Pass with Interest';
  return 'Pass';
}

function calculateRiskLevel(scores: any): string {
  const lowScores = Object.values(scores).filter(score => score < 4).length;
  if (lowScores >= 3) return 'High';
  if (lowScores >= 2) return 'Medium';
  return 'Low';
}

function calculateConfidence(engineResults: any[]): number {
  const successfulResults = engineResults.filter(r => r.status === 'fulfilled').length;
  return successfulResults / engineResults.length;
}

function extractStrengths(results: any): string[] {
  const strengths = [];
  
  if (results.market?.overallScore >= 7) strengths.push('Strong market opportunity');
  if (results.team?.overallScore >= 7) strengths.push('Experienced team');
  if (results.financial?.overallScore >= 7) strengths.push('Strong financials');
  if (results.product?.overallScore >= 7) strengths.push('Differentiated product');
  
  return strengths;
}

function extractRisks(results: any): string[] {
  const risks = [];
  
  if (results.market?.overallScore < 5) risks.push('Market concerns');
  if (results.team?.overallScore < 5) risks.push('Team weaknesses');
  if (results.financial?.overallScore < 5) risks.push('Financial risks');
  if (results.product?.overallScore < 5) risks.push('Product risks');
  
  return risks;
}

function generateNextSteps(recommendation: string, scores: any): string[] {
  const steps = [];
  
  if (recommendation.includes('Invest')) {
    steps.push('Schedule management presentation');
    steps.push('Conduct detailed due diligence');
    steps.push('Prepare investment committee memo');
  } else if (recommendation === 'Consider') {
    steps.push('Address key concerns identified');
    steps.push('Request additional information');
    steps.push('Monitor company progress');
  } else {
    steps.push('Document feedback for company');
    steps.push('Monitor for future rounds');
  }
  
  return steps;
}