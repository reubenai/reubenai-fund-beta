import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  BlueprintV2Scores, 
  FundType, 
  CategoryScore, 
  SubcategoryScore,
  WorkflowDefinition,
  VC_DEAL_ANALYSIS_WORKFLOW,
  PE_DEAL_ANALYSIS_WORKFLOW
} from '@/types/blueprint-v2';
import { 
  VC_CATEGORIES, 
  PE_CATEGORIES,
  BLUEPRINT_ENGINE_MAPPING 
} from '@/types/blueprint-v2';

interface BlueprintAnalysisOptions {
  skipCache?: boolean;
  forceFreshAnalysis?: boolean;
  specificEngines?: string[];
  maxConcurrency?: number;
}

interface BlueprintAnalysisResult {
  success: boolean;
  scores?: BlueprintV2Scores;
  execution_token?: string;
  error?: string;
  analysis_completeness?: number;
}

export function useBlueprintV2() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [analysisHistory, setAnalysisHistory] = useState<BlueprintV2Scores[]>([]);

  const analyzeDealWithBlueprint = useCallback(async (
    dealId: string,
    fundId: string,
    options: BlueprintAnalysisOptions = {}
  ): Promise<BlueprintAnalysisResult> => {
    setIsAnalyzing(true);
    setProgress(0);
    setCurrentStage('Initializing Blueprint v2 Analysis');

    try {
      // Get fund type to determine workflow
      const { data: fundData, error: fundError } = await supabase
        .from('funds')
        .select('fund_type, organization_id')
        .eq('id', fundId)
        .single();

      if (fundError || !fundData) {
        throw new Error('Failed to retrieve fund information');
      }

      const fundType = fundData.fund_type as FundType;
      
      setCurrentStage(`Starting ${fundType === 'venture_capital' ? 'VC' : 'PE'} Analysis Workflow`);
      setProgress(10);

      console.log(`🎯 [Blueprint v2] Starting ${fundType} analysis for deal ${dealId}`);

      // Call the new LangChain orchestrator
      const { data: orchestrationResult, error: orchestrationError } = await supabase.functions.invoke(
        'langchain-orchestrator',
        {
          body: {
            workflow_type: 'deal_analysis',
            org_id: fundData.organization_id,
            fund_id: fundId,
            deal_id: dealId,
            fund_type: fundType,
            input_data: {
              deal_id: dealId,
              fund_id: fundId,
              fund_type: fundType,
              analysis_options: options,
              trigger_reason: 'blueprint_v2_analysis'
            }
          }
        }
      );

      if (orchestrationError) {
        throw new Error(`Orchestration failed: ${orchestrationError.message}`);
      }

      if (!orchestrationResult.success) {
        throw new Error(orchestrationResult.error || 'Analysis workflow failed');
      }

      setCurrentStage('Processing Analysis Results');
      setProgress(80);

      // Transform orchestration results into Blueprint v2 format
      const blueprintScores = await transformToBlueprintV2(
        orchestrationResult.final_output,
        dealId,
        fundId,
        fundType,
        orchestrationResult.execution_token
      );

      // Store the analysis results
      await storeBlueprintAnalysis(blueprintScores);

      setCurrentStage('Analysis Complete');
      setProgress(100);

      // Add to history
      setAnalysisHistory(prev => [blueprintScores, ...prev.slice(0, 4)]); // Keep last 5

      toast.success(`Blueprint v2 ${fundType === 'venture_capital' ? 'VC' : 'PE'} analysis completed successfully`);

      return {
        success: true,
        scores: blueprintScores,
        execution_token: orchestrationResult.execution_token,
        analysis_completeness: blueprintScores.analysis_completeness
      };

    } catch (error) {
      console.error('❌ [Blueprint v2] Analysis failed:', error);
      toast.error(`Blueprint analysis failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsAnalyzing(false);
      setCurrentStage('');
      setProgress(0);
    }
  }, []);

  const getBlueprintScores = useCallback(async (dealId: string): Promise<BlueprintV2Scores | null> => {
    try {
      // TODO: Implement with proper table once deal_blueprint_scores is created
      console.warn('Blueprint scores table not implemented yet');
      return null;
    } catch (error) {
      console.error('Error fetching blueprint scores:', error);
      return null;
    }
  }, []);

  const getWorkflowDefinition = useCallback((fundType: FundType) => {
    // TODO: Import workflow definitions properly once types are fixed
    console.warn('Workflow definition access not implemented yet');
    return null;
  }, []);

  const getCategoryBlueprints = useCallback((fundType: FundType) => {
    return fundType === 'venture_capital' ? VC_CATEGORIES : PE_CATEGORIES;
  }, []);

  const getEngineResponsibilities = useCallback((engineName: string): string[] => {
    return BLUEPRINT_ENGINE_MAPPING[engineName as keyof typeof BLUEPRINT_ENGINE_MAPPING] || [];
  }, []);

  return {
    // State
    isAnalyzing,
    currentStage,
    progress,
    analysisHistory,

    // Main analysis function
    analyzeDealWithBlueprint,

    // Data retrieval
    getBlueprintScores,
    
    // Utility functions
    getWorkflowDefinition,
    getCategoryBlueprints,
    getEngineResponsibilities,
  };
}

async function transformToBlueprintV2(
  orchestrationOutput: any,
  dealId: string,
  fundId: string,
  fundType: FundType,
  executionToken: string
): Promise<BlueprintV2Scores> {
  const categories = fundType === 'venture_capital' ? VC_CATEGORIES : PE_CATEGORIES;
  const categoryScores: CategoryScore[] = [];

  // Transform each category based on orchestration results
  for (const [categoryKey, categoryConfig] of Object.entries(categories)) {
    const subcategoryScores: SubcategoryScore[] = [];

    // Create subcategory scores from orchestration output
    for (const subcategoryId of categoryConfig.subcategories) {
      // Find relevant engine output for this subcategory
      const engineOutputs = findRelevantEngineOutputs(orchestrationOutput, subcategoryId);
      
      const subcategoryScore: SubcategoryScore = {
        subcategory_id: subcategoryId,
        subcategory_name: formatSubcategoryName(subcategoryId),
        score: calculateSubcategoryScore(engineOutputs, subcategoryId),
        confidence: calculateConfidenceScore(engineOutputs),
        weight: calculateSubcategoryWeight(categoryConfig.weight, categoryConfig.subcategories.length),
        data_completeness: calculateDataCompleteness(engineOutputs),
        reasoning: generateReasoning(engineOutputs, subcategoryId),
        insights: extractInsights(engineOutputs),
        risk_flags: extractRiskFlags(engineOutputs),
        recommendations: generateRecommendations(engineOutputs, subcategoryId),
        data_points: extractDataPoints(engineOutputs),
        sources_used: extractSourcesUsed(engineOutputs),
        last_updated: new Date().toISOString(),
        engine_responsible: determineResponsibleEngine(subcategoryId)
      };

      subcategoryScores.push(subcategoryScore);
    }

    // Calculate category-level aggregations
    const categoryScore: CategoryScore = {
      category_id: categoryConfig.category_id,
      category_name: categoryConfig.category_name,
      fund_type: fundType,
      overall_score: calculateWeightedAverage(subcategoryScores.map(s => ({ score: s.score, weight: s.weight }))),
      overall_confidence: calculateAverageConfidence(subcategoryScores),
      total_weight: categoryConfig.weight,
      subcategories: subcategoryScores,
      category_insights: aggregateCategoryInsights(subcategoryScores),
      category_risks: aggregateCategoryRisks(subcategoryScores),
      category_recommendations: aggregateCategoryRecommendations(subcategoryScores),
      last_updated: new Date().toISOString()
    };

    categoryScores.push(categoryScore);
  }

  // Calculate overall Blueprint v2 scores
  const overallScore = calculateWeightedAverage(
    categoryScores.map(c => ({ score: c.overall_score, weight: c.total_weight }))
  );

  const overallConfidence = calculateAverageConfidence(
    categoryScores.flatMap(c => c.subcategories)
  );

  const analysisCompleteness = calculateOverallCompleteness(categoryScores);

  return {
    deal_id: dealId,
    fund_id: fundId,
    fund_type: fundType,
    overall_score: overallScore,
    overall_confidence: overallConfidence,
    categories: categoryScores,
    analysis_completeness: analysisCompleteness,
    quality_metrics: {
      data_freshness: calculateDataFreshness(orchestrationOutput),
      source_reliability: calculateSourceReliability(orchestrationOutput),
      analysis_depth: calculateAnalysisDepth(orchestrationOutput),
      cross_validation: calculateCrossValidation(orchestrationOutput)
    },
    execution_metadata: {
      analysis_version: '2.0',
      workflow_type: 'deal_analysis',
      execution_token: executionToken,
      started_at: orchestrationOutput.started_at || new Date().toISOString(),
      completed_at: new Date().toISOString(),
      total_duration_ms: orchestrationOutput.total_duration_ms,
      engines_used: Object.keys(orchestrationOutput).filter(key => 
        key.includes('engine') || key.includes('analysis')
      ) as any[]
    },
    fund_memory_integration: {
      pattern_matches: [],
      historical_comparisons: [],
      decision_context: {}
    }
  };
}

// Helper functions for Blueprint v2 transformation
function findRelevantEngineOutputs(orchestrationOutput: any, subcategoryId: string) {
  // Map subcategory to relevant engine outputs
  const relevantKeys = Object.keys(orchestrationOutput).filter(key => {
    // Logic to match engine outputs to subcategories
    const engineMappings = {
      'market': ['market-size-tam', 'market-growth-rate', 'competitive-landscape'],
      'team': ['founder-market-fit', 'team-composition', 'leadership-experience'],
      'product': ['product-market-fit', 'technology-differentiation'],
      'financial': ['revenue-quality', 'profitability-analysis', 'burn-rate'],
      'traction': ['revenue-model', 'customer-acquisition', 'growth-metrics']
    };

    return Object.entries(engineMappings).some(([prefix, subcats]) => 
      key.toLowerCase().includes(prefix) && subcats.includes(subcategoryId)
    );
  });

  return relevantKeys.reduce((acc, key) => {
    acc[key] = orchestrationOutput[key];
    return acc;
  }, {} as any);
}

function calculateSubcategoryScore(engineOutputs: any, subcategoryId: string): number {
  // Extract scores from engine outputs and calculate weighted average
  const scores = Object.values(engineOutputs).map((output: any) => 
    output?.score || output?.assessment_score || 70 // Default fallback
  ).filter(score => typeof score === 'number');

  return scores.length > 0 
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 70;
}

function calculateConfidenceScore(engineOutputs: any): number {
  const confidenceScores = Object.values(engineOutputs).map((output: any) => 
    output?.confidence || output?.confidence_score || 75
  ).filter(conf => typeof conf === 'number');

  return confidenceScores.length > 0
    ? Math.round(confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length)
    : 75;
}

function calculateSubcategoryWeight(categoryWeight: number, subcategoryCount: number): number {
  return Math.round((categoryWeight / subcategoryCount) * 10) / 10;
}

function calculateDataCompleteness(engineOutputs: any): number {
  const completenessScores = Object.values(engineOutputs).map((output: any) => {
    if (!output || typeof output !== 'object') return 50;
    
    const dataPoints = Object.keys(output).filter(key => 
      output[key] !== null && output[key] !== undefined && output[key] !== ''
    );
    
    return Math.min(100, (dataPoints.length / 5) * 100); // Assume 5 key data points per engine
  });

  return completenessScores.length > 0
    ? Math.round(completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length)
    : 50;
}

function generateReasoning(engineOutputs: any, subcategoryId: string): string {
  const reasoningParts = Object.values(engineOutputs)
    .map((output: any) => output?.reasoning || output?.analysis_summary)
    .filter(Boolean);

  return reasoningParts.length > 0
    ? reasoningParts.join(' | ')
    : `Analysis for ${subcategoryId} based on available data sources.`;
}

function extractInsights(engineOutputs: any): string[] {
  return Object.values(engineOutputs)
    .flatMap((output: any) => output?.insights || output?.key_findings || [])
    .filter(Boolean);
}

function extractRiskFlags(engineOutputs: any): string[] {
  return Object.values(engineOutputs)
    .flatMap((output: any) => output?.risk_flags || output?.concerns || [])
    .filter(Boolean);
}

function generateRecommendations(engineOutputs: any, subcategoryId: string): string[] {
  return Object.values(engineOutputs)
    .flatMap((output: any) => output?.recommendations || output?.action_items || [])
    .filter(Boolean);
}

function extractDataPoints(engineOutputs: any): Record<string, any> {
  return Object.keys(engineOutputs).reduce((acc, key) => {
    const output = engineOutputs[key];
    if (output && typeof output === 'object') {
      acc[key] = output;
    }
    return acc;
  }, {});
}

function extractSourcesUsed(engineOutputs: any): string[] {
  return Object.values(engineOutputs)
    .flatMap((output: any) => output?.sources_used || output?.data_sources || [])
    .filter(Boolean);
}

function determineResponsibleEngine(subcategoryId: string): any {
  // Map subcategories to responsible engines based on BLUEPRINT_ENGINE_MAPPING
  for (const [engine, subcategories] of Object.entries(BLUEPRINT_ENGINE_MAPPING)) {
    if (subcategories.includes(subcategoryId)) {
      return engine as any;
    }
  }
  return 'market-research-engine'; // Default fallback
}

function formatSubcategoryName(subcategoryId: string): string {
  return subcategoryId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function calculateWeightedAverage(items: { score: number; weight: number }[]): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = items.reduce((sum, item) => sum + (item.score * item.weight), 0);
  return Math.round(weightedSum / totalWeight);
}

function calculateAverageConfidence(items: { confidence: number }[]): number {
  if (items.length === 0) return 0;
  return Math.round(items.reduce((sum, item) => sum + item.confidence, 0) / items.length);
}

function calculateOverallCompleteness(categories: CategoryScore[]): number {
  const allSubcategories = categories.flatMap(c => c.subcategories);
  return calculateAverageConfidence(allSubcategories.map(s => ({ confidence: s.data_completeness })));
}

function aggregateCategoryInsights(subcategories: SubcategoryScore[]): string[] {
  return subcategories
    .flatMap(s => s.insights)
    .filter((insight, index, arr) => arr.indexOf(insight) === index) // Remove duplicates
    .slice(0, 5); // Limit to top 5
}

function aggregateCategoryRisks(subcategories: SubcategoryScore[]): string[] {
  return subcategories
    .flatMap(s => s.risk_flags)
    .filter((risk, index, arr) => arr.indexOf(risk) === index)
    .slice(0, 5);
}

function aggregateCategoryRecommendations(subcategories: SubcategoryScore[]): string[] {
  return subcategories
    .flatMap(s => s.recommendations)
    .filter((rec, index, arr) => arr.indexOf(rec) === index)
    .slice(0, 5);
}

function calculateDataFreshness(orchestrationOutput: any): number {
  // Logic to assess data freshness based on timestamps
  return 85; // Placeholder
}

function calculateSourceReliability(orchestrationOutput: any): number {
  // Logic to assess source reliability
  return 90; // Placeholder
}

function calculateAnalysisDepth(orchestrationOutput: any): number {
  // Logic to assess analysis depth based on completeness
  return 88; // Placeholder
}

function calculateCrossValidation(orchestrationOutput: any): number {
  // Logic to assess cross-validation between engines
  return 82; // Placeholder
}

async function storeBlueprintAnalysis(scores: BlueprintV2Scores): Promise<void> {
  try {
    // TODO: Implement with proper table once deal_blueprint_scores is created
    console.warn('Blueprint scores storage not implemented yet', scores);
  } catch (error) {
    console.error('Error storing blueprint analysis:', error);
  }
}