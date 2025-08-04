import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MemoryRequest {
  action: 'store' | 'query' | 'pattern_discovery' | 'contextual_memory' | 'performance_tracking';
  fundId: string;
  dealId?: string;
  data?: any;
  context?: any;
  query?: string;
}

interface MemoryEntry {
  id?: string;
  fund_id: string;
  deal_id?: string;
  memory_type: string;
  title: string;
  description?: string;
  content: string;
  ai_service_name: string;
  confidence_score?: number;
  contextual_tags?: string[];
  correlation_score?: number;
  created_by?: string | null;
  created_at?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: MemoryRequest = await req.json();
    console.log('Fund Memory Engine request:', request);

    let result;
    switch (request.action) {
      case 'store':
      case 'store_memory':
        result = await storeMemoryEntry(request);
        break;
      case 'query':
      case 'query_contextual_memory':
        result = await queryMemory(request);
        break;
      case 'pattern_discovery':
        result = await discoverPatterns(request);
        break;
      case 'contextual_memory':
        result = await getContextualMemory(request);
        break;
      case 'store_memory':
        result = await storeMemoryEntry(request);
        break;
      case 'performance_tracking':
        result = await trackPerformance(request);
        break;
      default:
        console.error(`Unknown action: ${request.action}`);
        throw new Error(`Unknown action: ${request.action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Fund Memory Engine error:', error);
    // Log full error details for debugging
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        action: 'fund_memory_error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function storeMemoryEntry(request: MemoryRequest) {
  const { fundId, dealId, data } = request;
  
  // Handle different request formats for backward compatibility
  const memoryData = data?.memoryContent || data;
  const memoryType = data?.memoryType || memoryData?.entryType || 'ai_service_interaction';
  const aiServiceName = data?.aiServiceName || memoryData?.sourceService || 'unknown';
  const confidenceScore = data?.confidenceScore || memoryData?.confidenceScore || 75;
  
  console.log('📝 Storing memory entry:', {
    fundId,
    dealId,
    memoryType,
    aiServiceName,
    confidenceScore
  });
  
  // Store memory entry with flexible data structure
  const entry: MemoryEntry = {
    fund_id: fundId,
    deal_id: dealId,
    memory_type: memoryType,
    title: data?.title || 'AI Service Interaction',
    description: data?.description || 'Automated memory entry',
    content: JSON.stringify(memoryData),
    ai_service_name: aiServiceName,
    confidence_score: confidenceScore,
    contextual_tags: data?.tags || [],
    correlation_score: data?.correlationScore || 0.5,
    created_by: data?.createdBy || null
  };

  const { data: memoryEntry, error } = await supabase
    .from('fund_memory_entries')
    .insert(entry)
    .select()
    .single();

  if (error) {
    console.error('Memory storage error:', error);
    throw error;
  }

  console.log('✅ Memory entry stored successfully:', memoryEntry.id);

  // Update fund insights if applicable
  if (memoryData && typeof memoryData === 'object') {
    try {
      await updateFundInsights(fundId, memoryData);
    } catch (insightError) {
      console.warn('Failed to update insights:', insightError);
    }
  }

  // Track service performance
  if (aiServiceName && confidenceScore) {
    try {
      await updateServicePerformance(aiServiceName, confidenceScore / 100, fundId);
    } catch (perfError) {
      console.warn('Failed to update performance:', perfError);
    }
  }

  return {
    success: true,
    memoryEntry,
    message: 'Memory entry stored successfully'
  };
}

async function queryMemory(request: MemoryRequest) {
  const { fundId, query, context } = request;
  
  // Build query based on context
  let memoryQuery = supabase
    .from('fund_memory_entries')
    .select('*')
    .eq('fund_id', fundId);

  if (context?.dealId) {
    memoryQuery = memoryQuery.eq('deal_id', context.dealId);
  }

  if (context?.entryType) {
    memoryQuery = memoryQuery.eq('entry_type', context.entryType);
  }

  if (context?.sourceService) {
    memoryQuery = memoryQuery.eq('source_service', context.sourceService);
  }

  // Add text search if query provided
  if (query) {
    memoryQuery = memoryQuery.textSearch('content', query);
  }

  const { data: memories, error } = await memoryQuery
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  // Get relevant insights
  const { data: insights } = await supabase
    .from('fund_memory_insights')
    .select('*')
    .eq('fund_id', fundId)
    .order('updated_at', { ascending: false })
    .limit(10);

  return {
    memories,
    insights: insights || [],
    context: await buildContextualIntelligence(fundId, context)
  };
}

async function discoverPatterns(request: MemoryRequest) {
  const { fundId } = request;
  
  // Analyze memory entries for patterns
  const { data: memories, error } = await supabase
    .from('fund_memory_entries')
    .select('*')
    .eq('fund_id', fundId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const patterns = {
    successPatterns: [],
    riskPatterns: [],
    performancePatterns: [],
    industryPatterns: [],
    decisionPatterns: []
  };

  // Analyze success patterns
  const successfulDeals = memories.filter(m => 
    m.content?.recommendation === 'invest' && 
    m.content?.overallScore > 7
  );

  if (successfulDeals.length > 0) {
    patterns.successPatterns = extractPatterns(successfulDeals, 'success');
  }

  // Analyze risk patterns
  const riskDeals = memories.filter(m => 
    m.content?.riskLevel === 'high' || 
    m.content?.overallScore < 4
  );

  if (riskDeals.length > 0) {
    patterns.riskPatterns = extractPatterns(riskDeals, 'risk');
  }

  // Store patterns as insights
  await storePatternInsights(fundId, patterns);

  return patterns;
}

async function getContextualMemory(request: MemoryRequest) {
  const { fundId, context } = request;
  
  // Get relevant context based on current operation
  const contextualData = {
    recentDecisions: [],
    similarDeals: [],
    historicalPerformance: [],
    strategicAlignment: {}
  };

  // Recent investment decisions
  const { data: recentMemories } = await supabase
    .from('fund_memory_entries')
    .select('*')
    .eq('fund_id', fundId)
    .eq('entry_type', 'decision')
    .order('created_at', { ascending: false })
    .limit(10);

  contextualData.recentDecisions = recentMemories || [];

  // Similar deals if context provided
  if (context?.industry || context?.stage) {
    const { data: similarDeals } = await supabase
      .from('fund_memory_entries')
      .select('*')
      .eq('fund_id', fundId)
      .contains('metadata', { 
        industry: context.industry, 
        stage: context.stage 
      })
      .limit(5);

    contextualData.similarDeals = similarDeals || [];
  }

  return contextualData;
}

async function trackPerformance(request: MemoryRequest) {
  const { fundId, data } = request;
  
  // Track AI service performance
  if (data.serviceMetrics) {
    for (const [service, metrics] of Object.entries(data.serviceMetrics)) {
      await updateServicePerformance(service, metrics.accuracy || 0.5, fundId);
    }
  }

  // Get current performance metrics
  const { data: performance } = await supabase
    .from('ai_service_performance')
    .select('*')
    .eq('fund_id', fundId)
    .order('updated_at', { ascending: false });

  return {
    performance: performance || [],
    recommendations: generatePerformanceRecommendations(performance || [])
  };
}

async function updateFundInsights(fundId: string, data: any) {
  const insightType = determineInsightType(data);
  const insight = {
    fund_id: fundId,
    insight_type: insightType,
    insight_data: data,
    confidence_score: data.confidenceScore || 0.5,
    impact_score: calculateImpactScore(data),
    metadata: {
      sourceService: data.sourceService,
      timestamp: new Date().toISOString()
    }
  };

  await supabase
    .from('fund_memory_insights')
    .upsert(insight, { onConflict: 'fund_id,insight_type' });
}

async function updateServicePerformance(service: string, accuracy: number, fundId: string) {
  const { data: existing } = await supabase
    .from('ai_service_performance')
    .select('*')
    .eq('service_name', service)
    .eq('fund_id', fundId)
    .single();

  if (existing) {
    // Update existing performance
    const newAccuracy = (existing.accuracy_score + accuracy) / 2;
    const newCallCount = existing.total_calls + 1;
    
    await supabase
      .from('ai_service_performance')
      .update({
        accuracy_score: newAccuracy,
        total_calls: newCallCount,
        last_used: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    // Create new performance record
    await supabase
      .from('ai_service_performance')
      .insert({
        fund_id: fundId,
        service_name: service,
        accuracy_score: accuracy,
        total_calls: 1,
        last_used: new Date().toISOString()
      });
  }
}

async function buildContextualIntelligence(fundId: string, context: any) {
  // Build contextual intelligence based on fund's memory
  const intelligence = {
    investmentPreferences: {},
    riskTolerance: {},
    successFactors: [],
    decisionPatterns: []
  };

  // Analyze historical preferences
  const { data: preferences } = await supabase
    .from('fund_memory_entries')
    .select('content, metadata')
    .eq('fund_id', fundId)
    .eq('entry_type', 'analysis')
    .order('created_at', { ascending: false })
    .limit(50);

  if (preferences) {
    intelligence.investmentPreferences = extractPreferences(preferences);
    intelligence.successFactors = identifySuccessFactors(preferences);
  }

  return intelligence;
}

function extractPatterns(memories: any[], patternType: string) {
  const patterns = [];
  
  // Group by common characteristics
  const characteristics = ['industry', 'stage', 'size', 'geography'];
  
  for (const char of characteristics) {
    const groupedData = memories.reduce((acc, memory) => {
      const value = memory.metadata?.[char] || memory.content?.[char];
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {});

    // Find significant patterns (appears in >20% of cases)
    const threshold = memories.length * 0.2;
    for (const [value, count] of Object.entries(groupedData)) {
      if (count > threshold) {
        patterns.push({
          characteristic: char,
          value,
          frequency: count,
          percentage: (count / memories.length) * 100,
          type: patternType
        });
      }
    }
  }

  return patterns;
}

async function storePatternInsights(fundId: string, patterns: any) {
  for (const [patternType, patternData] of Object.entries(patterns)) {
    if (Array.isArray(patternData) && patternData.length > 0) {
      await supabase
        .from('fund_memory_insights')
        .upsert({
          fund_id: fundId,
          insight_type: patternType,
          insight_data: patternData,
          confidence_score: calculatePatternConfidence(patternData),
          impact_score: calculatePatternImpact(patternData),
          metadata: {
            lastUpdated: new Date().toISOString(),
            patternCount: patternData.length
          }
        }, { onConflict: 'fund_id,insight_type' });
    }
  }
}

function determineInsightType(data: any): string {
  if (data.recommendation) return 'investment_recommendation';
  if (data.riskLevel) return 'risk_assessment';
  if (data.marketAnalysis) return 'market_intelligence';
  if (data.teamAnalysis) return 'team_assessment';
  if (data.financialAnalysis) return 'financial_analysis';
  return 'general_analysis';
}

function calculateImpactScore(data: any): number {
  let score = 0.5;
  
  if (data.overallScore) {
    score = data.overallScore / 10;
  }
  
  if (data.confidenceScore) {
    score = (score + data.confidenceScore) / 2;
  }
  
  return Math.min(1, Math.max(0, score));
}

function calculatePatternConfidence(patterns: any[]): number {
  if (!patterns.length) return 0;
  
  const avgFrequency = patterns.reduce((sum, p) => sum + p.frequency, 0) / patterns.length;
  return Math.min(1, avgFrequency / 10); // Normalize to 0-1
}

function calculatePatternImpact(patterns: any[]): number {
  if (!patterns.length) return 0;
  
  const avgPercentage = patterns.reduce((sum, p) => sum + p.percentage, 0) / patterns.length;
  return Math.min(1, avgPercentage / 100); // Normalize to 0-1
}

function extractPreferences(memories: any[]) {
  const preferences = {
    industries: {},
    stages: {},
    sizes: {},
    geographies: {}
  };

  memories.forEach(memory => {
    const content = memory.content;
    const metadata = memory.metadata;

    // Extract industry preferences
    if (content.industry || metadata.industry) {
      const industry = content.industry || metadata.industry;
      preferences.industries[industry] = (preferences.industries[industry] || 0) + 1;
    }

    // Extract stage preferences
    if (content.stage || metadata.stage) {
      const stage = content.stage || metadata.stage;
      preferences.stages[stage] = (preferences.stages[stage] || 0) + 1;
    }
  });

  return preferences;
}

function identifySuccessFactors(memories: any[]) {
  const successfulMemories = memories.filter(m => 
    m.content?.overallScore > 7 || 
    m.content?.recommendation === 'invest'
  );

  const factors = [];
  
  // Analyze common characteristics in successful deals
  const commonTraits = ['strong_team', 'large_market', 'competitive_advantage', 'scalable_model'];
  
  commonTraits.forEach(trait => {
    const traitCount = successfulMemories.filter(m => 
      m.content?.[trait] === true || 
      m.content?.strengths?.includes(trait)
    ).length;
    
    if (traitCount > 0) {
      factors.push({
        factor: trait,
        frequency: traitCount,
        percentage: (traitCount / successfulMemories.length) * 100
      });
    }
  });

  return factors.sort((a, b) => b.percentage - a.percentage);
}

function generatePerformanceRecommendations(performance: any[]) {
  const recommendations = [];
  
  performance.forEach(service => {
    if (service.accuracy_score < 0.6) {
      recommendations.push({
        type: 'improvement',
        service: service.service_name,
        message: `${service.service_name} accuracy is below 60%. Consider reviewing criteria or retraining.`,
        priority: 'high'
      });
    }
    
    if (service.total_calls < 10) {
      recommendations.push({
        type: 'usage',
        service: service.service_name,
        message: `${service.service_name} has limited usage data. More interactions needed for reliable performance metrics.`,
        priority: 'medium'
      });
    }
  });

  return recommendations;
}