import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Target,
  Calendar,
  Zap,
  BarChart3,
  Clock
} from 'lucide-react';
import { useActivityIntelligence } from '@/hooks/useActivityIntelligence';

interface ActivityInsightsDashboardProps {
  timeRange?: string;
  className?: string;
}

export function ActivityInsightsDashboard({ 
  timeRange = '7d', 
  className = '' 
}: ActivityInsightsDashboardProps) {
  const { insights, trends, loading, error, refresh } = useActivityIntelligence(timeRange);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'pattern': return BarChart3;
      case 'alert': return AlertTriangle;
      case 'summary': return Activity;
      default: return Activity;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high': return 'bg-accent-orange/10 text-accent-orange border-accent-orange/20';
      case 'medium': return 'bg-primary/10 text-primary border-primary/20';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loading) {
    return (
      <Card className={`border-0 shadow-sm ${className}`}>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Activity Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-0 shadow-sm ${className}`}>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Activity Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={refresh}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Activity Intelligence
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <Activity className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Insights */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Key Insights
          </h3>
          <div className="grid gap-3">
            {insights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getUrgencyColor(insight.urgency)} shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{insight.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {insight.timeframe}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                    {typeof insight.value === 'number' && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-semibold text-lg">{insight.value}</span>
                        {insight.change && (
                          <Badge 
                            variant={insight.change > 0 ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {insight.change > 0 ? '+' : ''}{insight.change}%
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Trends */}
        {trends.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Activity Trends
            </h3>
            <div className="grid gap-2">
              {trends.slice(-7).map((trend, index) => {
                const maxCount = Math.max(...trends.map(t => t.count));
                const barWidth = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center gap-3 py-2">
                    <div className="w-16 text-xs text-muted-foreground text-right">
                      {trend.period}
                    </div>
                    <div className="flex-1 relative">
                      <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {trend.count}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" className="flex-1">
            <Target className="h-4 w-4 mr-1" />
            Focus Mode
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Calendar className="h-4 w-4 mr-1" />
            Schedule Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}