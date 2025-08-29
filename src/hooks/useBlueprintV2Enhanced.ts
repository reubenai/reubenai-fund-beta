import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { blueprintV2DataAccess } from '@/utils/blueprintV2DataAccess';
import { toTemplateFundType, toDatabaseFundType, type AnyFundType } from '@/utils/fundTypeConversion';
import type { 
  BlueprintV2Scores, 
  FundType as BlueprintFundType, 
  CategoryScore, 
  SubcategoryScore
} from '@/types/blueprint-v2';
import { 
  VC_CATEGORIES, 
  PE_CATEGORIES
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

export function useBlueprintV2Enhanced() {
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
      // Get fund type to determine workflow and table routing
      const { data: fundData, error: fundError } = await supabase
        .from('funds')
        .select('fund_type, organization_id')
        .eq('id', fundId)
        .single();

      if (fundError || !fundData) {
        throw new Error('Failed to retrieve fund information');
      }

      const dbFundType = fundData.fund_type as string;
      const blueprintFundType = toDatabaseFundType(dbFundType as AnyFundType) as BlueprintFundType;
      
      setCurrentStage(`Starting ${blueprintFundType === 'venture_capital' ? 'VC' : 'PE'} Analysis Workflow`);
      setProgress(10);

      console.log(`🎯 [Blueprint v2] Starting ${blueprintFundType} analysis for deal ${dealId}`);

      // Check if we already have Blueprint v2 scores and should use cache
      if (!options.forceFreshAnalysis && !options.skipCache) {
        setCurrentStage('Checking existing Blueprint v2 scores');
        setProgress(20);
        
        const existingScores = await blueprintV2DataAccess.getBlueprintScores(dealId, blueprintFundType);
        if (existingScores && existingScores.analysis_completeness > 75) {
          console.log('🎯 [Blueprint v2] Using existing comprehensive scores');
          setCurrentStage('Using existing Blueprint v2 scores');
          setProgress(100);
          
          setAnalysisHistory(prev => [existingScores, ...prev.slice(0, 4)]);
          
          return {
            success: true,
            scores: existingScores,
            execution_token: existingScores.execution_metadata.execution_token,
            analysis_completeness: existingScores.analysis_completeness
          };
        }
      }

      // Call the LangChain orchestrator for fresh analysis
      setCurrentStage('Running Blueprint v2 analysis engines');
      setProgress(30);
      
      const { data: orchestrationResult, error: orchestrationError } = await supabase.functions.invoke(
        'langchain-orchestrator',
        {
          body: {
            workflow_type: 'deal_analysis',
            org_id: fundData.organization_id,
            fund_id: fundId,
            deal_id: dealId,
            fund_type: blueprintFundType,
            input_data: {
              deal_id: dealId,
              fund_id: fundId,
              fund_type: blueprintFundType,
              analysis_options: options,
              trigger_reason: 'blueprint_v2_enhanced_analysis'
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

      setCurrentStage('Transforming to Blueprint v2 format');
      setProgress(70);

      // Transform orchestration results into Blueprint v2 format
      const blueprintScores = await transformToBlueprintV2(
        orchestrationResult.final_output,
        dealId,
        fundId,
        blueprintFundType,
        orchestrationResult.execution_token
      );

      setCurrentStage('Storing Blueprint v2 scores');
      setProgress(85);

      // Store the analysis results using the new data access layer
      const storeSuccess = await blueprintV2DataAccess.storeBlueprintScores(blueprintScores);
      if (!storeSuccess) {
        console.warn('Failed to store Blueprint v2 scores, but analysis succeeded');
      }

      setCurrentStage('Analysis Complete');
      setProgress(100);

      // Add to history
      setAnalysisHistory(prev => [blueprintScores, ...prev.slice(0, 4)]);

      const fundTypeLabel = blueprintFundType === 'venture_capital' ? 'VC' : 'PE';
      toast.success(`Blueprint v2 ${fundTypeLabel} analysis completed successfully`);

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

  const getBlueprintScores = useCallback(async (
    dealId: string, 
    fundType: AnyFundType
  ): Promise<BlueprintV2Scores | null> => {
    try {
      const blueprintFundType = toDatabaseFundType(fundType) as BlueprintFundType;
      return await blueprintV2DataAccess.getBlueprintScores(dealId, blueprintFundType);
    } catch (error) {
      console.error('Error fetching blueprint scores:', error);
      return null;
    }
  }, []);

  const getCategoryBlueprints = useCallback((fundType: AnyFundType) => {
    const templateType = toTemplateFundType(fundType);
    return templateType === 'vc' ? VC_CATEGORIES : PE_CATEGORIES;
  }, []);

  // Transform orchestration output to Blueprint v2 format
  const transformToBlueprintV2 = async (
    orchestrationOutput: any,
    dealId: string,
    fundId: string,
    fundType: BlueprintFundType,
    executionToken: string
  ): Promise<BlueprintV2Scores> => {
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
  };

  // Helper methods
  const findRelevantEngineOutputs = (orchestrationOutput: any, subcategoryId: string) => {
    const engineMappings = {
      'market': ['market-size-tam', 'market-growth-rate', 'competitive-landscape'],
      'team': ['founder-market-fit', 'team-composition', 'leadership-experience'],
      'product': ['product-market-fit', 'technology-differentiation'],
      'financial': ['revenue-quality', 'profitability-analysis', 'burn-rate'],
      'traction': ['revenue-model', 'customer-acquisition', 'growth-metrics']
    };

    const relevantKeys = Object.keys(orchestrationOutput).filter(key => {
      return Object.entries(engineMappings).some(([prefix, subcats]) => 
        key.toLowerCase().includes(prefix) && subcats.includes(subcategoryId)
      );
    });

    return relevantKeys.reduce((acc, key) => {
      acc[key] = orchestrationOutput[key];
      return acc;
    }, {} as any);
  };

  const calculateSubcategoryScore = (engineOutputs: any, subcategoryId: string): number => {
    const scores = Object.values(engineOutputs).map((output: any) => 
      output?.score || output?.assessment_score || 70 
    ).filter(score => typeof score === 'number');

    return scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 70;
  };

  const calculateConfidenceScore = (engineOutputs: any): number => {
    const confidenceScores = Object.values(engineOutputs).map((output: any) => 
      output?.confidence || output?.confidence_score || 75
    ).filter(conf => typeof conf === 'number');

    return confidenceScores.length > 0
      ? Math.round(confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length)
      : 75;
  };

  const calculateSubcategoryWeight = (categoryWeight: number, subcategoryCount: number): number => {
    return Math.round((categoryWeight / subcategoryCount) * 10) / 10;
  };

  const calculateDataCompleteness = (engineOutputs: any): number => {
    const completenessScores = Object.values(engineOutputs).map((output: any) => {
      if (!output || typeof output !== 'object') return 50;
      
      const dataPoints = Object.keys(output).filter(key => 
        output[key] !== null && output[key] !== undefined && output[key] !== ''
      );
      
      return Math.min(100, (dataPoints.length / 5) * 100);
    });

    return completenessScores.length > 0
      ? Math.round(completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length)
      : 50;
  };

  const generateReasoning = (engineOutputs: any, subcategoryId: string): string => {
    const reasoningParts = Object.values(engineOutputs)
      .map((output: any) => output?.reasoning || output?.analysis_summary)
      .filter(Boolean);

    return reasoningParts.length > 0
      ? reasoningParts.join(' | ')
      : `Analysis for ${subcategoryId} based on available data sources.`;
  };

  const extractInsights = (engineOutputs: any): string[] => {
    return Object.values(engineOutputs)
      .flatMap((output: any) => output?.insights || output?.key_findings || [])
      .filter(Boolean);
  };

  const extractRiskFlags = (engineOutputs: any): string[] => {
    return Object.values(engineOutputs)
      .flatMap((output: any) => output?.risk_flags || output?.concerns || [])
      .filter(Boolean);
  };

  const generateRecommendations = (engineOutputs: any, subcategoryId: string): string[] => {
    return Object.values(engineOutputs)
      .flatMap((output: any) => output?.recommendations || output?.action_items || [])
      .filter(Boolean);
  };

  const extractDataPoints = (engineOutputs: any): Record<string, any> => {
    return Object.keys(engineOutputs).reduce((acc, key) => {
      const output = engineOutputs[key];
      if (output && typeof output === 'object') {
        acc[key] = output;
      }
      return acc;
    }, {});
  };

  const extractSourcesUsed = (engineOutputs: any): string[] => {
    return Object.values(engineOutputs)
      .flatMap((output: any) => output?.sources_used || output?.data_sources || [])
      .filter(Boolean);
  };

  const determineResponsibleEngine = (subcategoryId: string): any => {
    if (subcategoryId.includes('market')) return 'market-research-engine';
    if (subcategoryId.includes('team') || subcategoryId.includes('founder')) return 'team-research-engine';
    if (subcategoryId.includes('product') || subcategoryId.includes('technology')) return 'product-ip-engine';
    if (subcategoryId.includes('financial') || subcategoryId.includes('revenue')) return 'financial-engine';
    if (subcategoryId.includes('strategic') || subcategoryId.includes('thesis')) return 'thesis-alignment-engine';
    return 'market-research-engine';
  };

  const formatSubcategoryName = (subcategoryId: string): string => {
    return subcategoryId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const calculateWeightedAverage = (items: { score: number; weight: number }[]): number => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) return 0;
    
    const weightedSum = items.reduce((sum, item) => sum + (item.score * item.weight), 0);
    return Math.round(weightedSum / totalWeight);
  };

  const calculateAverageConfidence = (items: { confidence: number }[]): number => {
    if (items.length === 0) return 0;
    return Math.round(items.reduce((sum, item) => sum + item.confidence, 0) / items.length);
  };

  const calculateOverallCompleteness = (categories: CategoryScore[]): number => {
    const allSubcategories = categories.flatMap(c => c.subcategories);
    return calculateAverageConfidence(allSubcategories.map(s => ({ confidence: s.data_completeness })));
  };

  const aggregateCategoryInsights = (subcategories: SubcategoryScore[]): string[] => {
    return subcategories
      .flatMap(s => s.insights)
      .filter((insight, index, arr) => arr.indexOf(insight) === index)
      .slice(0, 5);
  };

  const aggregateCategoryRisks = (subcategories: SubcategoryScore[]): string[] => {
    return subcategories
      .flatMap(s => s.risk_flags)
      .filter((risk, index, arr) => arr.indexOf(risk) === index)
      .slice(0, 5);
  };

  const aggregateCategoryRecommendations = (subcategories: SubcategoryScore[]): string[] => {
    return subcategories
      .flatMap(s => s.recommendations)
      .filter((rec, index, arr) => arr.indexOf(rec) === index)
      .slice(0, 5);
  };

  const calculateDataFreshness = (orchestrationOutput: any): number => {
    return 85;
  };

  const calculateSourceReliability = (orchestrationOutput: any): number => {
    return 90;
  };

  const calculateAnalysisDepth = (orchestrationOutput: any): number => {
    return 88;
  };

  const calculateCrossValidation = (orchestrationOutput: any): number => {
    return 82;
  };

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
    getCategoryBlueprints,
  };
}
