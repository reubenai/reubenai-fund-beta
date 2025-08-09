import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RubricBreakdown } from '@/types/enhanced-deal-analysis';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface RubricScoreRadarProps {
  rubricBreakdown: RubricBreakdown[];
  fundType: 'vc' | 'pe';
  className?: string;
}

export const RubricScoreRadar: React.FC<RubricScoreRadarProps> = ({
  rubricBreakdown,
  fundType,
  className
}) => {
  const getCategoryDisplayName = (category: string) => {
    const displayNames: Record<string, string> = {
      'team_leadership': 'Team & Leadership',
      'market_opportunity': 'Market Opportunity', 
      'product_technology': 'Product & Technology',
      'business_traction': 'Business Traction',
      'financial_health': 'Financial Health',
      'strategic_fit': 'Strategic Fit'
    };
    return displayNames[category] || category;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getConfidenceIndicator = (confidence: number) => {
    if (confidence >= 80) return { label: 'High', color: 'bg-green-100 text-green-700' };
    if (confidence >= 60) return { label: 'Med', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Low', color: 'bg-red-100 text-red-700' };
  };

  // Sort by fund type priority
  const sortedBreakdown = [...rubricBreakdown].sort((a, b) => {
    const vcPriority = ['market_opportunity', 'product_technology', 'team_leadership', 'business_traction', 'strategic_fit', 'financial_health'];
    const pePriority = ['financial_health', 'business_traction', 'team_leadership', 'market_opportunity', 'strategic_fit', 'product_technology'];
    
    const priority = fundType === 'vc' ? vcPriority : pePriority;
    const aIndex = priority.indexOf(a.category);
    const bIndex = priority.indexOf(b.category);
    
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Rubric Analysis ({fundType.toUpperCase()} Focus)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedBreakdown.map((item) => {
          const confidenceIndicator = getConfidenceIndicator(item.confidence);
          
          return (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {getCategoryDisplayName(item.category)}
                  </span>
                  <Badge variant="outline" className={`${confidenceIndicator.color} text-xs px-1 py-0`}>
                    {confidenceIndicator.label}
                  </Badge>
                </div>
                <span className={`text-sm font-semibold ${getScoreColor(item.score)}`}>
                  {item.score}%
                </span>
              </div>
              
              <div className="space-y-1">
                <Progress 
                  value={item.score} 
                  className="h-2"
                  style={{
                    '--progress-background': getProgressColor(item.score)
                  } as React.CSSProperties}
                />
                
                {/* Top insights for detailed view */}
                {item.insights.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Key: </span>
                    {item.insights[0]}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Overall weighted score */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Weighted Average</span>
            <span className={`text-sm font-bold ${getScoreColor(
              sortedBreakdown.reduce((sum, item) => sum + (item.score * item.weight / 100), 0)
            )}`}>
              {Math.round(sortedBreakdown.reduce((sum, item) => sum + (item.score * item.weight / 100), 0))}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};