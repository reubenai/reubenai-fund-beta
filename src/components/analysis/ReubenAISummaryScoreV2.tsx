
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, TrendingUp, Database, Zap } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { useBlueprintV2Enhanced } from '@/hooks/useBlueprintV2Enhanced';
import { toTemplateFundType, type AnyFundType } from '@/utils/fundTypeConversion';
import type { BlueprintV2Scores, CategoryScore } from '@/types/blueprint-v2';

interface ReubenAISummaryScoreV2Props {
  deal: Deal;
  fundType: AnyFundType;
  onScoreCalculated?: (score: number) => void;
}

const getOverallStatusColor = (score: number): string => {
  if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (score >= 70) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (score >= 60) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (score >= 50) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

const getOverallStatusLabel = (score: number): string => {
  if (score >= 80) return 'Exceptional';
  if (score >= 70) return 'Strong';
  if (score >= 60) return 'Promising';
  if (score >= 50) return 'Developing';
  return 'Needs Work';
};

export function ReubenAISummaryScoreV2({ deal, fundType, onScoreCalculated }: ReubenAISummaryScoreV2Props) {
  const [blueprintScores, setBlueprintScores] = useState<BlueprintV2Scores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getBlueprintScores, analyzeDealWithBlueprint, isAnalyzing } = useBlueprintV2Enhanced();

  useEffect(() => {
    const loadBlueprintScores = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🎯 Loading Blueprint v2 scores for deal ${deal.id}, fund type ${fundType}`);
        
        // Try to get existing Blueprint v2 scores
        const scores = await getBlueprintScores(deal.id, fundType);
        
        if (scores) {
          console.log('✅ Found existing Blueprint v2 scores');
          setBlueprintScores(scores);
          onScoreCalculated?.(scores.overall_score);
        } else {
          console.log('⚠️ No Blueprint v2 scores found, will show placeholder');
          // No scores found - could trigger analysis here if desired
          setBlueprintScores(null);
        }
        
      } catch (error) {
        console.error('❌ Error loading Blueprint v2 scores:', error);
        setError(error instanceof Error ? error.message : 'Failed to load scores');
      } finally {
        setLoading(false);
      }
    };

    loadBlueprintScores();
  }, [deal.id, fundType, getBlueprintScores, onScoreCalculated]);

  const handleRunAnalysis = async () => {
    if (!deal.fund_id) {
      setError('Deal must have a fund_id to run analysis');
      return;
    }

    try {
      console.log(`🚀 Starting Blueprint v2 analysis for deal ${deal.id}`);
      const result = await analyzeDealWithBlueprint(deal.id, deal.fund_id);
      
      if (result.success && result.scores) {
        setBlueprintScores(result.scores);
        onScoreCalculated?.(result.scores.overall_score);
        setError(null);
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading Blueprint v2 scores...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const templateFundType = toTemplateFundType(fundType);
  const fundTypeLabel = templateFundType === 'vc' ? 'VC' : 'PE';

  // If no scores and not analyzing, show trigger button
  if (!blueprintScores && !isAnalyzing) {
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-muted/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-6 w-6 text-primary" />
            ReubenAI Blueprint v2 Analysis
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Blueprint v2 Analysis Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Run comprehensive {fundTypeLabel} analysis using our Blueprint v2 framework
            </p>
            
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              {isAnalyzing ? 'Running Analysis...' : `Run ${fundTypeLabel} Blueprint v2 Analysis`}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show analyzing state
  if (isAnalyzing) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Running Blueprint v2 analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show Blueprint v2 scores
  if (!blueprintScores) {
    return (
      <Card className="border-2 border-orange/20">
        <CardContent className="p-6">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No Blueprint v2 scores available</p>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-muted/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Bot className="h-6 w-6 text-primary" />
          ReubenAI Blueprint v2 Score
          <Badge variant="outline" className="ml-2 text-xs">
            v{blueprintScores.execution_metadata.analysis_version}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Score Display */}
        <div className="flex items-center justify-between p-6 rounded-lg border-2 bg-background">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{blueprintScores.overall_score}/100</p>
              <p className="text-sm text-muted-foreground">
                Blueprint v2 {fundTypeLabel} Analysis ({blueprintScores.categories.length} categories)
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge 
              variant="outline" 
              className={`${getOverallStatusColor(blueprintScores.overall_score)} text-lg px-4 py-2 mb-3`}
            >
              {getOverallStatusLabel(blueprintScores.overall_score)}
            </Badge>
            <div className="flex items-center gap-3">
              <Progress value={blueprintScores.overall_score} className="w-32 h-3" />
              <span className="text-lg font-semibold text-primary">{blueprintScores.overall_score}%</span>
            </div>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {fundTypeLabel} Categories ({blueprintScores.categories.length})
          </h4>
          
          <div className="grid gap-4">
            {blueprintScores.categories.map((category: CategoryScore) => (
              <div key={category.category_id} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm text-primary">{category.category_name}</h5>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{category.overall_score}</span>
                    <Progress value={category.overall_score} className="w-20 h-2" />
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mb-2">
                  Weight: {category.total_weight}% | Confidence: {category.overall_confidence}% | 
                  Subcategories: {category.subcategories.length}
                </div>
                
                {category.category_insights.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Key insights: {category.category_insights.slice(0, 2).join(', ')}
                    {category.category_insights.length > 2 && '...'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <h4 className="font-medium text-sm mb-3">Analysis Quality Metrics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Data Freshness:</span>
              <span className="ml-2 font-medium">{blueprintScores.quality_metrics.data_freshness}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Source Reliability:</span>
              <span className="ml-2 font-medium">{blueprintScores.quality_metrics.source_reliability}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Analysis Depth:</span>
              <span className="ml-2 font-medium">{blueprintScores.quality_metrics.analysis_depth}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cross Validation:</span>
              <span className="ml-2 font-medium">{blueprintScores.quality_metrics.cross_validation}%</span>
            </div>
          </div>
        </div>

        {/* Score Interpretation */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <h4 className="font-medium text-sm mb-2">Blueprint v2 Score Interpretation</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {blueprintScores.overall_score >= 80 && (
              <p>🎯 <strong>Exceptional opportunity</strong> - Outstanding performance across all {fundTypeLabel} Blueprint v2 categories. Strongly recommended for immediate investment consideration.</p>
            )}
            {blueprintScores.overall_score >= 70 && blueprintScores.overall_score < 80 && (
              <p>💪 <strong>Strong candidate</strong> - Solid fundamentals with high potential across key {fundTypeLabel} Blueprint v2 factors. Consider for priority review and due diligence.</p>
            )}
            {blueprintScores.overall_score >= 60 && blueprintScores.overall_score < 70 && (
              <p>📈 <strong>Promising opportunity</strong> - Good foundation with some areas for development in the {fundTypeLabel} Blueprint v2 assessment. Worth detailed investigation.</p>
            )}
            {blueprintScores.overall_score >= 50 && blueprintScores.overall_score < 60 && (
              <p>⚠️ <strong>Developing opportunity</strong> - Some concerns identified across Blueprint v2 categories. Requires careful analysis and risk assessment.</p>
            )}
            {blueprintScores.overall_score < 50 && (
              <p>🔍 <strong>Significant challenges</strong> - Multiple concerns across Blueprint v2 assessment criteria. Consider pass or require major improvements.</p>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            Analysis completed: {new Date(blueprintScores.execution_metadata.completed_at || '').toLocaleString()} | 
            Completeness: {blueprintScores.analysis_completeness}% | 
            Engines: {blueprintScores.execution_metadata.engines_used.length}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
