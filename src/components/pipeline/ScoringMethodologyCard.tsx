import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  ChevronDown, 
  ChevronRight, 
  Target, 
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { RubricBreakdown } from '@/types/enhanced-deal-analysis';

interface ScoringMethodologyCardProps {
  rubricBreakdown: RubricBreakdown[];
  overallScore: number;
  analysisCompleteness: number;
}

export function ScoringMethodologyCard({ 
  rubricBreakdown, 
  overallScore, 
  analysisCompleteness 
}: ScoringMethodologyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate weighted score breakdown
  const totalWeight = rubricBreakdown.reduce((sum, item) => sum + item.weight, 0);
  const scoringDetails = rubricBreakdown.map(item => ({
    ...item,
    normalizedWeight: totalWeight > 0 ? (item.weight / totalWeight) * 100 : 0,
    contribution: (item.score * item.weight / totalWeight),
    confidenceImpact: item.confidence / 100
  }));

  const calculatedScore = scoringDetails.reduce((sum, item) => sum + item.contribution, 0);

  return (
    <Card className="card-xero">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-hierarchy-3">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          Scoring Methodology
          <Badge variant="outline" className="ml-auto">
            Calculated: {Math.round(calculatedScore)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* High-level calculation */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Overall Score</span>
            <span className="text-lg font-bold text-foreground">{overallScore}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Calculated Score</span>
            <span className="text-foreground">{Math.round(calculatedScore)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Analysis Completeness</span>
            <span className="text-foreground">{analysisCompleteness}%</span>
          </div>
          <Progress value={analysisCompleteness} className="h-2" />
        </div>

        {/* Expandable detailed breakdown */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="text-sm font-medium text-foreground">View Detailed Calculation</span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 mt-3">
            <div className="text-xs text-muted-foreground mb-3">
              Score = Σ(Category Score × Weight) ÷ Total Weight × Confidence Factor
            </div>
            
            {scoringDetails.map((item, index) => (
              <div key={index} className="border border-border/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground capitalize">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {item.weight}% weight
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Score: {item.score} × Weight: {item.normalizedWeight.toFixed(1)}% = {item.contribution.toFixed(1)} points
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-foreground">
                      {item.contribution.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {item.confidence >= 80 ? (
                        <CheckCircle2 className="h-3 w-3 text-success" />
                      ) : item.confidence >= 60 ? (
                        <Target className="h-3 w-3 text-warning" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-destructive" />
                      )}
                      <span className="text-muted-foreground">
                        {item.confidence}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                <Progress value={item.contribution * 10} className="h-1" />
              </div>
            ))}
            
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Data Sources:</strong> Company documents, web research, financial analysis, team assessment</p>
                <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
                <p><strong>Confidence Level:</strong> Based on data availability and analysis depth</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}