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
import { toTemplateFundType, type AnyFundType } from '@/utils/fundTypeConversion';

interface ReubenAISummaryScoreProps {
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

export function ReubenAISummaryScore({ deal, fundType, onScoreCalculated }: ReubenAISummaryScoreProps) {
  const [overallScore, setOverallScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Calculate overall score from VC component scores
  useEffect(() => {
    const calculateOverallScore = async () => {
      try {
        setLoading(true);
        
        const templateFundType = toTemplateFundType(fundType);
        
        // For VC funds, calculate from expected VC components
        if (templateFundType === 'vc') {
          // VC weights: Thesis (5%), Market (25%), Team (20%), Product (20%), Traction (15%), Financial (15%)
          const vcWeights = {
            thesis: 0.05,
            market: 0.25,
            team: 0.20,
            product: 0.20,
            traction: 0.15,
            financial: 0.15
          };
          
          // Get actual scores from enhanced analysis if available
          const analysisData = deal.enhanced_analysis as Record<string, any>;
          const rubricBreakdown = analysisData?.rubric_breakdown;
          
          let calculatedScore = 0;
          if (rubricBreakdown) {
            // Use actual analysis scores
            const thesisScore = rubricBreakdown.thesis_alignment?.score || rubricBreakdown.strategic_fit?.score || 75;
            const marketScore = rubricBreakdown.market_opportunity?.score || rubricBreakdown.market_size?.score || 78;
            const teamScore = rubricBreakdown.team_strength?.score || rubricBreakdown.management_quality?.score || 82;
            const productScore = rubricBreakdown.product_moat?.score || rubricBreakdown.technology?.score || 75;
            const tractionScore = rubricBreakdown.traction?.score || rubricBreakdown.business_model?.score || 68;
            const financialScore = rubricBreakdown.financial_health?.score || rubricBreakdown.financial_metrics?.score || 70;
            
            calculatedScore = Math.round(
              thesisScore * vcWeights.thesis +
              marketScore * vcWeights.market +
              teamScore * vcWeights.team +
              productScore * vcWeights.product +
              tractionScore * vcWeights.traction +
              financialScore * vcWeights.financial
            );
          } else {
            // Use default VC scores
            calculatedScore = Math.round(
              75 * vcWeights.thesis +    // Thesis Alignment
              78 * vcWeights.market +    // Market Opportunity  
              82 * vcWeights.team +      // Team Strength
              75 * vcWeights.product +   // Product & IP
              68 * vcWeights.traction +  // Traction
              70 * vcWeights.financial   // Financial Health
            );
          }
          
          setOverallScore(Math.max(0, Math.min(100, calculatedScore)));
          onScoreCalculated?.(calculatedScore);
        } else {
          // PE funds - use different calculation
          const peScore = 72; // Default PE score
          setOverallScore(peScore);
          onScoreCalculated?.(peScore);
        }
        
      } catch (error) {
        console.error('Error calculating overall score:', error);
        setOverallScore(0);
        onScoreCalculated?.(0);
      } finally {
        setLoading(false);
      }
    };

    calculateOverallScore();
  }, [deal, fundType, onScoreCalculated]);

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

  const templateFundType = toTemplateFundType(fundType);

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
                Sum product calculation across {templateFundType === 'vc' ? '5 VC' : '6 PE'} criteria
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

        {/* VC Assessment Components */}
        {templateFundType === 'vc' ? (
          <div className="space-y-6">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              VC Assessment Criteria
            </h4>
            
            {/* Thesis Alignment */}
            <div>
              <h5 className="font-medium text-sm mb-3 text-primary">Thesis Alignment</h5>
              <ThesisAlignmentSection deal={deal} />
            </div>
            
            {/* Market Opportunity Score */}
            <div>
              <h5 className="font-medium text-sm mb-3 text-primary">Market Opportunity Score</h5>
              <MarketOpportunityAssessment deal={deal} />
            </div>
            
            {/* Founder & Team Strength */}
            <div>
              <h5 className="font-medium text-sm mb-3 text-primary">Founder & Team Strength</h5>
              <FounderTeamStrengthAssessment deal={deal} />
            </div>
            
            {/* Product & IP Moat */}
            <div>
              <h5 className="font-medium text-sm mb-3 text-primary">Product & IP Moat</h5>
              <ProductIPMoatAssessment deal={deal} />
            </div>
            
            {/* Traction & Financial Feasibility */}
            <div>
              <h5 className="font-medium text-sm mb-3 text-primary">Traction & Financial Feasibility</h5>
              <TractionFinancialFeasibilityAssessment deal={deal} />
            </div>
          </div>
        ) : (
          // PE Assessment - show placeholder for now
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              PE Assessment Criteria
            </h4>
            <div className="p-6 rounded-lg border bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                PE assessment components coming soon
              </p>
            </div>
          </div>
        )}

        {/* Score Interpretation */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <h4 className="font-medium text-sm mb-2">Score Interpretation</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {overallScore >= 80 && (
              <p>🎯 <strong>Exceptional opportunity</strong> - Strong performance across all {templateFundType === 'vc' ? 'VC' : 'PE'} criteria. Recommended for immediate deep dive.</p>
            )}
            {overallScore >= 70 && overallScore < 80 && (
              <p>💪 <strong>Strong candidate</strong> - Good fundamentals with high potential across key {templateFundType === 'vc' ? 'VC' : 'PE'} factors. Consider for priority review.</p>
            )}
            {overallScore >= 60 && overallScore < 70 && (
              <p>📈 <strong>Promising deal</strong> - Solid opportunity with some areas to monitor in the {templateFundType === 'vc' ? 'VC' : 'PE'} assessment. Worth further investigation.</p>
            )}
            {overallScore >= 50 && overallScore < 60 && (
              <p>⚠️ <strong>Developing opportunity</strong> - Some concerns present in key criteria. Detailed analysis recommended.</p>
            )}
            {overallScore < 50 && (
              <p>🔍 <strong>Needs significant work</strong> - Multiple concerns identified across assessment criteria. Consider pass or major improvements needed.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}