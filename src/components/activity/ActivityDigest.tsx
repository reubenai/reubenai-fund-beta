import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  TrendingUp, 
  Clock, 
  Target,
  Users,
  FileText,
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react';
import { useOptimizedActivities } from '@/hooks/useOptimizedActivities';
import { useActivityIntelligence } from '@/hooks/useActivityIntelligence';
import { ActivityEvent } from '@/services/ActivityService';

interface ActivityDigestProps {
  timeRange?: string;
  showSignificantOnly?: boolean;
  maxItems?: number;
}

export function ActivityDigest({ 
  timeRange = '24h', 
  showSignificantOnly = false,
  maxItems = 10 
}: ActivityDigestProps) {
  const [digestTimeRange, setDigestTimeRange] = useState(timeRange);
  const [significantOnly, setSignificantOnly] = useState(showSignificantOnly);
  
  const { activities, loading, error } = useOptimizedActivities(50);

  // Simple relevance calculation for activities
  const calculateSimpleRelevance = (activity: any): number => {
    let score = 50; // Base score

    // Priority scoring
    const priorityScores = { critical: 40, high: 25, medium: 10, low: 5 };
    score += priorityScores[activity.priority as keyof typeof priorityScores] || 0;

    // Activity type scoring
    const typeScores = {
      investment_decision: 30,
      deal_created: 25,
      deal_stage_changed: 20,
      fund_created: 20,
      criteria_updated: 15,
      document_uploaded: 10,
      deal_note_added: 5
    };
    score += typeScores[activity.activity_type as keyof typeof typeScores] || 10;

    // Recency scoring
    const hours = (Date.now() - new Date(activity.occurred_at).getTime()) / (1000 * 60 * 60);
    if (hours < 1) score += 20;
    else if (hours < 24) score += 15;
    else if (hours < 168) score += 10;
    else score += 5;

    return Math.min(100, Math.max(0, score));
  };

  // Filter and rank activities
  const processedActivities = React.useMemo(() => {
    let filtered = activities;

    // Apply time range filter
    if (digestTimeRange !== 'all') {
      const hours = {
        '1h': 1,
        '24h': 24,
        '7d': 168,
        '30d': 720
      }[digestTimeRange] || 24;
      
      const threshold = new Date();
      threshold.setHours(threshold.getHours() - hours);
      
      filtered = filtered.filter(activity => 
        new Date(activity.occurred_at) >= threshold
      );
    }

    // Calculate relevance scores and filter if needed
    const scored = filtered.map(activity => ({
      ...activity,
      relevanceScore: calculateSimpleRelevance(activity)
    }));

    // Filter for significant activities only if requested
    if (significantOnly) {
      filtered = scored.filter(activity => activity.relevanceScore >= 70);
    }

    // Sort by relevance score and limit
    return scored
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxItems);
  }, [activities, digestTimeRange, significantOnly, maxItems, calculateSimpleRelevance]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deal_created':
      case 'deal_updated':
      case 'deal_stage_changed':
        return Target;
      case 'team_member_invited':
      case 'team_member_joined':
        return Users;
      case 'document_uploaded':
        return FileText;
      case 'investment_decision':
        return TrendingUp;
      default:
        return Calendar;
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'bg-primary text-primary-foreground';
    if (score >= 60) return 'bg-secondary text-secondary-foreground';
    if (score >= 40) return 'bg-muted text-muted-foreground';
    return 'bg-background text-muted-foreground';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Activity Digest</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Activity Digest
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={digestTimeRange} onValueChange={setDigestTimeRange}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Today</SelectItem>
                <SelectItem value="7d">This Week</SelectItem>
                <SelectItem value="30d">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={significantOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setSignificantOnly(!significantOnly)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Significant
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Failed to load activities</p>
          </div>
        ) : processedActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No activities in the selected timeframe</p>
            {significantOnly && (
              <p className="text-xs mt-1">Try disabling "Significant" filter</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {processedActivities.map((activity) => {
              const Icon = getActivityIcon(activity.activity_type);
              
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm leading-snug">
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs px-2 py-1 ${getRelevanceColor(activity.relevanceScore)}`}
                        >
                          {activity.relevanceScore}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {activity.activity_type.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(activity.occurred_at)}
                      </div>
                      {activity.priority !== 'medium' && (
                        <Badge 
                          variant={activity.priority === 'high' || activity.priority === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {activity.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {processedActivities.length === maxItems && (
              <div className="text-center pt-4 border-t">
                <Button variant="ghost" size="sm">
                  View All Activities
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}