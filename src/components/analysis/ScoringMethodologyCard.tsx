import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, TrendingUp, Target, CheckCircle2 } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { BlueprintScoringEngine } from '@/utils/BlueprintScoringEngine';

interface ScoringMethodologyCardProps {
  deal: Deal;
}

const ScoringMethodologyCard = ({ deal }: ScoringMethodologyCardProps) => {
  // This will be replaced with actual fund type detection once available
  const fundType: 'VC' | 'PE' = 'VC'; // Default to VC for now
  
  const categoryWeights = fundType === 'VC' 
    ? BlueprintScoringEngine.getVCCategoryWeights() 
    : BlueprintScoringEngine.getPECategoryWeights();

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 80) return <Badge variant="default" className="bg-emerald-100 text-emerald-700">Excellent</Badge>;
    if (score >= 60) return <Badge variant="default" className="bg-blue-100 text-blue-700">Good</Badge>;
    if (score >= 40) return <Badge variant="default" className="bg-amber-100 text-amber-700">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Scoring Methodology
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Scoring Approach */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            {fundType} Deal Analysis Framework
          </h4>
          <p className="text-sm text-muted-foreground">
            Our {fundType} analysis uses a weighted scoring system across {Object.keys(categoryWeights).length} key categories, 
            with each category containing multiple sub-criteria for comprehensive evaluation.
          </p>
        </div>

        {/* Category Weights */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Category Weightings
          </h4>
          <div className="space-y-3">
            {Object.entries(categoryWeights).map(([category, weight]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium">{category}</span>
                  <Progress value={weight} className="flex-1 max-w-24" />
                </div>
                <span className="text-sm font-medium">{weight}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scoring Scale */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Scoring Scale
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              {getStatusBadge(85)}
              <span>80-100 points</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(70)}
              <span>60-79 points</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(50)}
              <span>40-59 points</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(30)}
              <span>0-39 points</span>
            </div>
          </div>
        </div>

        {/* Calculation Method */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Calculation Method</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Each sub-criteria is scored 0-100 based on analysis confidence and data quality</li>
            <li>• Sub-criteria scores are weighted and aggregated into category scores</li>
            <li>• Category scores are weighted according to {fundType} investment priorities</li>
            <li>• Final score is capped at 100 points with data quality adjustments</li>
          </ul>
        </div>

        {/* Data Quality Impact */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Data Quality Impact</h4>
          <p className="text-xs text-muted-foreground">
            Scores are adjusted based on data completeness and analysis confidence. 
            Incomplete data or low confidence reduces the final score to reflect uncertainty.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoringMethodologyCard;