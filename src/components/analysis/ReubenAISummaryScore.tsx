import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, TrendingUp } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { ThesisAlignmentSection } from './ThesisAlignmentSection';
import { MarketOpportunityAssessment } from './MarketOpportunityAssessment';
import { FounderTeamStrengthAssessment } from './FounderTeamStrengthAssessment';
import { ProductIPMoatAssessment } from './ProductIPMoatAssessment';
import { TractionFinancialFeasibilityAssessment } from './TractionFinancialFeasibilityAssessment';

interface ReubenAISummaryScoreProps {
  deal: Deal;
  onScoreCalculated?: (score: number) => void;
}

interface AssessmentScore {
  name: string;
  score: number;
  weight: number;
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

export function ReubenAISummaryScore({ deal, onScoreCalculated }: ReubenAISummaryScoreProps) {
  const [overallScore, setOverallScore] = useState<number>(0);
  const [assessmentScores, setAssessmentScores] = useState<AssessmentScore[]>([]);
  const [loading, setLoading] = useState(true);

  // Get real scores from deal analysis data
  useEffect(() => {
    const calculateOverallScore = async () => {
      try {
        setLoading(true);
        
        // Get actual analysis data from deal
        const analysisData = deal.enhanced_analysis;
        
        if (analysisData && typeof analysisData === 'object' && analysisData !== null && !Array.isArray(analysisData)) {
          const analysisObj = analysisData as Record<string, any>;
          if (analysisObj.rubric_breakdown) {
            // Extract actual scores from analysis
            const rubricBreakdown = analysisObj.rubric_breakdown;
            const scores: AssessmentScore[] = [];
          
          // Map rubric categories to assessment scores with proper weights
          Object.entries(rubricBreakdown).forEach(([category, categoryData]: [string, any]) => {
            if (categoryData && typeof categoryData === 'object' && categoryData.score !== undefined) {
              let weight = 20; // Default weight
              
              // Apply proper category weights based on fund type
              if (category.toLowerCase().includes('financial')) {
                weight = deal.fund_id ? 35 : 20; // PE: 35%, VC: 20%
              } else if (category.toLowerCase().includes('operational')) {
                weight = deal.fund_id ? 25 : 15; // PE: 25%, VC: 15%
              } else if (category.toLowerCase().includes('market')) {
                weight = deal.fund_id ? 15 : 25; // PE: 15%, VC: 25%
              } else if (category.toLowerCase().includes('management') || category.toLowerCase().includes('team')) {
                weight = deal.fund_id ? 10 : 20; // PE: 10%, VC: 20%
              } else if (category.toLowerCase().includes('growth')) {
                weight = deal.fund_id ? 10 : 15; // PE: 10%, VC: 15%
              } else if (category.toLowerCase().includes('strategic')) {
                weight = deal.fund_id ? 5 : 5; // PE: 5%, VC: 5%
              }
              
              scores.push({
                name: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                score: Math.max(0, Math.min(100, Math.round(categoryData.score || 0))),
                weight: weight
              });
            }
          });
          
          // If we have real scores, use them
          if (scores.length > 0) {
            setAssessmentScores(scores);
            
            // Calculate weighted average with proper bounds checking
            const totalWeight = scores.reduce((sum, score) => sum + score.weight, 0);
            
            if (totalWeight === 0) {
              setOverallScore(0);
              onScoreCalculated?.(0);
            } else {
              const weightedScore = scores.reduce((sum, score) => 
                sum + (score.weight * Math.max(0, Math.min(100, score.score))), 0
              ) / totalWeight;
              
              // Ensure final score is within 0-100 bounds
              const finalScore = Math.max(0, Math.min(100, Math.round(weightedScore)));
              
              setOverallScore(finalScore);
              onScoreCalculated?.(finalScore);
            }
          } else {
            // Fallback to mock data if no real analysis yet
            const mockScores: AssessmentScore[] = [
              { name: 'Financial Performance', score: 75, weight: 35 },
              { name: 'Operational Excellence', score: 68, weight: 25 },
              { name: 'Market Position', score: 72, weight: 15 },
              { name: 'Management Quality', score: 80, weight: 10 },
              { name: 'Growth Potential', score: 65, weight: 10 },
              { name: 'Strategic Fit', score: 85, weight: 5 }
            ];
            
            setAssessmentScores(mockScores);
            
            // Calculate proper weighted score with bounds checking
            const totalWeight = mockScores.reduce((sum, score) => sum + score.weight, 0);
            const weightedScore = totalWeight > 0 
              ? mockScores.reduce((sum, score) => 
                  sum + (score.weight * Math.max(0, Math.min(100, score.score))), 0
                ) / totalWeight
              : 0;
            
            const finalScore = Math.max(0, Math.min(100, Math.round(weightedScore)));
            setOverallScore(finalScore);
            onScoreCalculated?.(finalScore);
          }
          } else {
            // Fallback to mock PE data
            const mockScores: AssessmentScore[] = [
              { name: 'Financial Performance', score: 75, weight: 35 },
              { name: 'Operational Excellence', score: 68, weight: 25 },
              { name: 'Market Position', score: 72, weight: 15 },
              { name: 'Management Quality', score: 80, weight: 10 },
              { name: 'Growth Potential', score: 65, weight: 10 },
              { name: 'Strategic Fit', score: 85, weight: 5 }
            ];
            
            setAssessmentScores(mockScores);
            
            // Calculate proper weighted score with bounds checking
            const totalWeight = mockScores.reduce((sum, score) => sum + score.weight, 0);
            const weightedScore = totalWeight > 0 
              ? mockScores.reduce((sum, score) => 
                  sum + (score.weight * Math.max(0, Math.min(100, score.score))), 0
                ) / totalWeight
              : 0;
            
            const finalScore = Math.max(0, Math.min(100, Math.round(weightedScore)));
            setOverallScore(finalScore);
            onScoreCalculated?.(finalScore);
          }
        } else {
          // No analysis data - use placeholder scores
          const placeholderScores: AssessmentScore[] = [
            { name: 'Analysis Pending', score: 0, weight: 100 }
          ];
          
          setAssessmentScores(placeholderScores);
          setOverallScore(0);
          onScoreCalculated?.(0);
        }
        
      } catch (error) {
        console.error('Error calculating overall score:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateOverallScore();
  }, [deal, onScoreCalculated]);

  if (loading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          ReubenAI Summary Score
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
              <p className="text-2xl font-bold">{overallScore}/100</p>
              <p className="text-sm text-muted-foreground">
                Sum product calculation across {assessmentScores.length} categories
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge 
              variant="outline" 
              className={`${getOverallStatusColor(overallScore)} text-lg px-4 py-2 mb-3`}
            >
              {getOverallStatusLabel(overallScore)}
            </Badge>
            <div className="flex items-center gap-3">
              <Progress value={overallScore} className="w-32 h-3" />
              <span className="text-lg font-semibold text-primary">{overallScore}%</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Category Breakdown
          </h4>
          {assessmentScores.map((assessment, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-primary rounded-full opacity-60"></div>
                <div>
                  <p className="font-medium">{assessment.name}</p>
                  <p className="text-xs text-muted-foreground">Weight: {assessment.weight}%</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <Progress value={assessment.score} className="w-20" />
                <div className="min-w-[3rem]">
                  <span className="font-semibold">{assessment.score}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Score Interpretation */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <h4 className="font-medium text-sm mb-2">Score Interpretation</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {overallScore >= 80 && (
              <p>🎯 <strong>Exceptional opportunity</strong> - Strong alignment across all key factors. Recommended for immediate deep dive.</p>
            )}
            {overallScore >= 70 && overallScore < 80 && (
              <p>💪 <strong>Strong candidate</strong> - Good fundamentals with high potential. Consider for priority review.</p>
            )}
            {overallScore >= 60 && overallScore < 70 && (
              <p>📈 <strong>Promising deal</strong> - Solid opportunity with some areas to monitor. Worth further investigation.</p>
            )}
            {overallScore >= 50 && overallScore < 60 && (
              <p>⚠️ <strong>Developing opportunity</strong> - Some concerns present. Detailed analysis recommended.</p>
            )}
            {overallScore < 50 && (
              <p>🔍 <strong>Needs significant work</strong> - Multiple concerns identified. Consider pass or major improvements needed.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}