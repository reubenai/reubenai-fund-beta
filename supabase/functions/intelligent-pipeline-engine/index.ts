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
    const { action, fundId, dealId, data } = await req.json();
    
    let result;
    switch (action) {
      case 'prioritize_deals':
        result = await prioritizeDeals(fundId);
        break;
      case 'stage_recommendations':
        result = await getStageRecommendations(dealId, fundId);
        break;
      case 'batch_analysis':
        result = await performBatchAnalysis(fundId, data.dealIds);
        break;
      case 'pipeline_intelligence':
        result = await getPipelineIntelligence(fundId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Intelligent Pipeline Engine error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function prioritizeDeals(fundId: string) {
  // Get all active deals for fund
  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('fund_id', fundId)
    .neq('stage', 'closed');

  // Query fund memory for each deal's analysis
  const dealPriorities = await Promise.all(
    deals.map(async (deal) => {
      const { data: analysis } = await supabase
        .from('deal_analyses')
        .select('*')
        .eq('deal_id', deal.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...deal,
        priority: calculatePriority(deal, analysis),
        lastAnalysis: analysis,
        riskLevel: analysis?.risk_level || 'unknown'
      };
    })
  );

  // Sort by priority
  dealPriorities.sort((a, b) => b.priority - a.priority);

  // Store insights in fund memory
  await supabase.functions.invoke('enhanced-fund-memory-engine', {
    body: {
      action: 'store',
      fundId: fundId,
      data: {
        entryType: 'pipeline_intelligence',
        content: { prioritizedDeals: dealPriorities },
        sourceService: 'intelligent-pipeline-engine',
        confidenceScore: 0.8,
        metadata: { analysisType: 'deal_prioritization' }
      }
    }
  });

  return {
    prioritizedDeals: dealPriorities,
    summary: {
      totalDeals: deals.length,
      highPriority: dealPriorities.filter(d => d.priority >= 8).length,
      mediumPriority: dealPriorities.filter(d => d.priority >= 5 && d.priority < 8).length,
      lowPriority: dealPriorities.filter(d => d.priority < 5).length
    }
  };
}

async function getStageRecommendations(dealId: string, fundId: string) {
  // Get current deal stage and analysis
  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single();

  const { data: analysis } = await supabase
    .from('deal_analyses')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Query fund memory for similar deals
  const { data: memoryContext } = await supabase.functions.invoke('enhanced-fund-memory-engine', {
    body: {
      action: 'query',
      fundId: fundId,
      context: { 
        dealId, 
        entryType: 'decision',
        industry: deal.industry,
        stage: deal.stage 
      }
    }
  });

  const recommendations = generateStageRecommendations(deal, analysis, memoryContext);

  return {
    dealId,
    currentStage: deal.stage,
    recommendations,
    confidence: 0.85,
    nextActions: generateNextActions(deal.stage, analysis),
    timeline: estimateTimeline(deal.stage, analysis)
  };
}

async function performBatchAnalysis(fundId: string, dealIds: string[]) {
  // Call enhanced-deal-analysis with batch mode
  const { data: batchResult, error } = await supabase.functions.invoke('enhanced-deal-analysis', {
    body: { 
      dealIds, 
      fundId, 
      action: 'batch' 
    }
  });

  if (error) {
    throw new Error(`Batch analysis failed: ${error.message}`);
  }

  const results = batchResult.results || [];

  const batchResults = results.map((result, index) => ({
    dealId: dealIds[index],
    status: result.status,
    data: result.status === 'fulfilled' ? result.value?.data : null,
    error: result.status === 'rejected' ? result.reason : null
  }));

  // Store batch analysis results
  await supabase.functions.invoke('enhanced-fund-memory-engine', {
    body: {
      action: 'store',
      fundId: fundId,
      data: {
        entryType: 'batch_analysis',
        content: { results: batchResults },
        sourceService: 'intelligent-pipeline-engine',
        confidenceScore: 0.9,
        metadata: { 
          analysisType: 'batch_analysis',
          dealCount: dealIds.length 
        }
      }
    }
  });

  return {
    batchId: crypto.randomUUID(),
    results: batchResults,
    summary: {
      total: dealIds.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    }
  };
}

async function getPipelineIntelligence(fundId: string) {
  // Query fund memory for pipeline insights
  const { data: memoryData } = await supabase.functions.invoke('enhanced-fund-memory-engine', {
    body: {
      action: 'pattern_discovery',
      fundId: fundId
    }
  });

  // Get current pipeline metrics
  const { data: deals } = await supabase
    .from('deals')
    .select('stage, overall_score, created_at, industry')
    .eq('fund_id', fundId);

  const intelligence = {
    pipelineHealth: calculatePipelineHealth(deals),
    stageDistribution: calculateStageDistribution(deals),
    industryBreakdown: calculateIndustryBreakdown(deals),
    trends: identifyTrends(deals),
    patterns: memoryData?.data || {},
    recommendations: generatePipelineRecommendations(deals)
  };

  return intelligence;
}

function calculatePriority(deal: any, analysis: any): number {
  let priority = 5; // Base priority

  // Factor in overall score
  if (analysis?.overall_score) {
    priority = analysis.overall_score;
  }

  // Adjust for stage urgency
  const stageMultipliers = {
    'sourced': 1.0,
    'initial_review': 1.1,
    'deep_dive': 1.3,
    'ic_review': 1.5,
    'negotiation': 1.7,
    'closed_won': 0.5,
    'closed_lost': 0.2
  };

  priority *= (stageMultipliers[deal.stage] || 1.0);

  // Adjust for recency
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceCreated > 30) priority *= 0.9;
  if (daysSinceCreated > 60) priority *= 0.8;

  return Math.min(10, Math.max(1, priority));
}

function generateStageRecommendations(deal: any, analysis: any, memoryContext: any): any[] {
  const recommendations = [];
  const currentStage = deal.stage;

  if (currentStage === 'sourced') {
    recommendations.push({
      action: 'schedule_initial_meeting',
      priority: 'high',
      description: 'Schedule initial meeting with founding team'
    });
  } else if (currentStage === 'initial_review') {
    if (analysis?.overall_score >= 6) {
      recommendations.push({
        action: 'proceed_to_deep_dive',
        priority: 'high',
        description: 'Move to deep dive stage for detailed analysis'
      });
    }
  }

  return recommendations;
}

function generateNextActions(stage: string, analysis: any): string[] {
  const actionMap = {
    'sourced': ['Review company materials', 'Schedule initial call'],
    'initial_review': ['Complete first analysis', 'Internal team discussion'],
    'deep_dive': ['Conduct detailed due diligence', 'Reference calls'],
    'ic_review': ['Prepare IC memo', 'Schedule IC presentation'],
    'negotiation': ['Finalize term sheet', 'Legal documentation']
  };

  return actionMap[stage] || ['Monitor progress'];
}

function estimateTimeline(stage: string, analysis: any): any {
  const timelines = {
    'sourced': { next: 'initial_review', estimatedDays: 7 },
    'initial_review': { next: 'deep_dive', estimatedDays: 14 },
    'deep_dive': { next: 'ic_review', estimatedDays: 21 },
    'ic_review': { next: 'negotiation', estimatedDays: 10 },
    'negotiation': { next: 'closed', estimatedDays: 30 }
  };

  return timelines[stage] || { next: 'unknown', estimatedDays: 0 };
}

function calculatePipelineHealth(deals: any[]): any {
  const totalDeals = deals.length;
  const avgScore = deals.reduce((sum, deal) => sum + (deal.overall_score || 5), 0) / totalDeals;
  
  return {
    totalDeals,
    averageScore: avgScore,
    health: avgScore >= 6 ? 'healthy' : avgScore >= 4 ? 'moderate' : 'needs_attention'
  };
}

function calculateStageDistribution(deals: any[]): any {
  const distribution = {};
  deals.forEach(deal => {
    distribution[deal.stage] = (distribution[deal.stage] || 0) + 1;
  });
  return distribution;
}

function calculateIndustryBreakdown(deals: any[]): any {
  const breakdown = {};
  deals.forEach(deal => {
    if (deal.industry) {
      breakdown[deal.industry] = (breakdown[deal.industry] || 0) + 1;
    }
  });
  return breakdown;
}

function identifyTrends(deals: any[]): any[] {
  // Simple trend analysis based on creation dates and scores
  const monthlyData = {};
  
  deals.forEach(deal => {
    const month = new Date(deal.created_at).toISOString().slice(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, totalScore: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].totalScore += deal.overall_score || 5;
  });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    dealCount: data.count,
    averageScore: data.totalScore / data.count
  }));
}

function generatePipelineRecommendations(deals: any[]): string[] {
  const recommendations = [];
  
  const lowScoreDeals = deals.filter(d => d.overall_score < 4).length;
  if (lowScoreDeals > deals.length * 0.3) {
    recommendations.push('Consider refining deal sourcing criteria');
  }
  
  const stuckDeals = deals.filter(d => {
    const daysSinceCreated = (Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreated > 45 && !['closed_won', 'closed_lost'].includes(d.stage);
  });
  
  if (stuckDeals.length > 0) {
    recommendations.push(`${stuckDeals.length} deals may be stalled - review progress`);
  }
  
  return recommendations;
}