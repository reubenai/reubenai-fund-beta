import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Lightbulb
} from 'lucide-react';
import { FundTypeAnalysis } from '@/types/enhanced-deal-analysis';

interface FundTypeAnalysisPanelProps {
  analysis: FundTypeAnalysis;
  className?: string;
}

export const FundTypeAnalysisPanel: React.FC<FundTypeAnalysisPanelProps> = ({
  analysis,
  className
}) => {
  const getAlignmentColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';  
    return 'text-red-600';
  };

  const getAlignmentBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {analysis.fund_type.toUpperCase()} Fund Analysis
          </CardTitle>
          <Badge className={getAlignmentBadgeColor(analysis.alignment_score)}>
            {analysis.alignment_score}% aligned
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Alignment Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Strategic Alignment</span>
            <span className={`font-semibold ${getAlignmentColor(analysis.alignment_score)}`}>
              {analysis.alignment_score}%
            </span>
          </div>
          <Progress value={analysis.alignment_score} className="h-2" />
        </div>

        {/* Focus Areas */}
        {analysis.focus_areas.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Target className="w-4 h-4 text-blue-600" />
              Focus Areas
            </div>
            <div className="flex flex-wrap gap-1">
              {analysis.focus_areas.map((area, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Key Strengths
            </div>
            <div className="space-y-1">
              {analysis.strengths.slice(0, 3).map((strength, index) => (
                <div key={index} className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                  • {strength}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concerns */}
        {analysis.concerns.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Areas of Concern
            </div>
            <div className="space-y-1">
              {analysis.concerns.slice(0, 2).map((concern, index) => (
                <div key={index} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                  • {concern}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Recommendations */}
        {analysis.strategic_recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Lightbulb className="w-4 h-4 text-purple-600" />
              Recommendations
            </div>
            <div className="space-y-1">
              {analysis.strategic_recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="text-xs text-purple-700 bg-purple-50 rounded px-2 py-1">
                  • {rec}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};