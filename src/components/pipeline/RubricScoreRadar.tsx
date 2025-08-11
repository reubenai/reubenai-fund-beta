import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RubricBreakdown } from '@/types/enhanced-deal-analysis';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';

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
  const { getRAGCategory } = useStrategyThresholds();
  const getCategoryDisplayName = (category: string) => {
    const displayNames: Record<string, string> = {
      // VC Categories
      'team_leadership': 'Team & Leadership',
      'market_opportunity': 'Market Opportunity', 
      'product_technology': 'Product & Technology',
      'business_traction': 'Business Traction',
      'financial_health': 'Financial Health',
      'strategic_fit': 'Strategic Fit',
      'risks_challenges': 'Risks & Challenges',
      // PE Categories
      'financial_performance': 'Financial Performance',
      'market_position': 'Market Position',
      'operational_excellence': 'Operational Excellence',
      'growth_potential': 'Growth Potential'
    };
    return displayNames[category] || category.replace(/_/g, ' ');
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

  const getRAGIndicator = (score: number) => {
    const ragCategory = getRAGCategory(score);
    return {
      label: ragCategory.label,
      color: ragCategory.color
    };
  };

  // Sort by fund type priority
  const sortedBreakdown = [...rubricBreakdown].sort((a, b) => {
    const vcPriority = ['market_opportunity', 'product_technology', 'team_leadership', 'financial_health', 'business_traction', 'risks_challenges'];
    const pePriority = ['financial_performance', 'market_position', 'operational_excellence', 'growth_potential'];
    
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
          const ragIndicator = getRAGIndicator(item.score);
          
          return (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {getCategoryDisplayName(item.category)}
                  </span>
                  <Badge variant="outline" className={`${ragIndicator.color} text-xs px-1 py-0`}>
                    {ragIndicator.label}
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