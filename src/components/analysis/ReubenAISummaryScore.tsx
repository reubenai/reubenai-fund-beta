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

  // Mock calculation - in real implementation, these would come from each assessment component
  useEffect(() => {
    const calculateOverallScore = async () => {
      try {
        setLoading(true);
        
        // Simulate assessment calculations
        // In real implementation, we'd get these from the actual assessment components
        const mockScores: AssessmentScore[] = [
          {
            name: 'Thesis Alignment',
            score: Math.floor(Math.random() * 40) + 60, // 60-100
            weight: 20
          },
          {
            name: 'Market Opportunity',
            score: Math.floor(Math.random() * 40) + 50, // 50-90
            weight: 25
          },
          {
            name: 'Founder & Team Strength',
            score: Math.floor(Math.random() * 40) + 55, // 55-95
            weight: 20
          },
          {
            name: 'Product & IP Moat',
            score: Math.floor(Math.random() * 40) + 45, // 45-85
            weight: 20
          },
          {
            name: 'Traction & Financial Feasibility',
            score: Math.floor(Math.random() * 40) + 50, // 50-90
            weight: 15
          }
        ];

        setAssessmentScores(mockScores);

        // Calculate simple sum product (weight * score/100 then summed)
        const finalScore = Math.round(
          mockScores.reduce((sum, score) => sum + (score.weight * score.score / 100), 0)
        );
        
        setOverallScore(finalScore);
        onScoreCalculated?.(finalScore);
        
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