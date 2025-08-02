import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';

interface DealRAGSummaryProps {
  deals: Deal[];
}

export const DealRAGSummary: React.FC<DealRAGSummaryProps> = ({ deals }) => {
  const { getRAGCategory } = useStrategyThresholds();

  const ragStats = deals.reduce((acc, deal) => {
    if (deal.overall_score) {
      const rag = getRAGCategory(deal.overall_score);
      acc[rag.level] = (acc[rag.level] || 0) + 1;
      acc.totalScored++;
      acc.totalScore += deal.overall_score;
    }
    acc.total++;
    return acc;
  }, {
    exciting: 0,
    promising: 0,
    needs_development: 0,
    not_aligned: 0,
    total: 0,
    totalScored: 0,
    totalScore: 0
  });

  const averageScore = ragStats.totalScored > 0 ? ragStats.totalScore / ragStats.totalScored : 0;
  const analysisProgress = ragStats.totalScored / ragStats.total * 100;

  const ragCategories = [
    {
      key: 'exciting',
      label: 'Exciting',
      count: ragStats.exciting,
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
      iconColor: 'text-emerald-600'
    },
    {
      key: 'promising',
      label: 'Promising', 
      count: ragStats.promising,
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: TrendingUp,
      iconColor: 'text-amber-600'
    },
    {
      key: 'needs_development',
      label: 'Needs Development',
      count: ragStats.needs_development,
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: Users,
      iconColor: 'text-orange-600'
    },
    {
      key: 'not_aligned',
      label: 'Not Aligned',
      count: ragStats.not_aligned,
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: AlertTriangle,
      iconColor: 'text-red-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          RAG Analysis Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded">
            <div className="text-2xl font-bold">{ragStats.totalScored}</div>
            <div className="text-sm text-muted-foreground">Analyzed</div>
          </div>
          <div className="text-center p-3 bg-muted rounded">
            <div className="text-2xl font-bold">{Math.round(averageScore)}</div>
            <div className="text-sm text-muted-foreground">Avg Score</div>
          </div>
        </div>

        {/* Analysis Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Analysis Progress</span>
            <span>{Math.round(analysisProgress)}%</span>
          </div>
          <Progress value={analysisProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {ragStats.totalScored} of {ragStats.total} deals analyzed
          </p>
        </div>

        {/* RAG Distribution */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">RAG Distribution</h4>
          {ragCategories.map(category => {
            const Icon = category.icon;
            const percentage = ragStats.totalScored > 0 ? (category.count / ragStats.totalScored * 100) : 0;
            
            return (
              <div key={category.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${category.iconColor}`} />
                    <span className="text-sm">{category.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{category.count}</span>
                    <Badge variant="outline" className={category.color}>
                      {Math.round(percentage)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={percentage} className="h-1" />
              </div>
            );
          })}
        </div>

        {/* Insights */}
        {ragStats.totalScored > 0 && (
          <div className="space-y-2 p-3 bg-blue-50 rounded border border-blue-200">
            <h4 className="font-medium text-sm text-blue-900">Insights</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              {ragStats.exciting > 0 && (
                <li>• {ragStats.exciting} deals show high investment potential</li>
              )}
              {ragStats.promising > 0 && (
                <li>• {ragStats.promising} deals need further evaluation</li>
              )}
              {ragStats.needs_development > 0 && (
                <li>• {ragStats.needs_development} deals require development</li>
              )}
              {ragStats.not_aligned > 0 && (
                <li>• {ragStats.not_aligned} deals don't align with strategy</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};