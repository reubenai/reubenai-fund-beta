import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useFund } from '@/contexts/FundContext';
import { 
  Activity, 
  User, 
  Building, 
  Database, 
  Shield, 
  Filter,
  Search,
  TrendingUp,
  Eye,
  FileText,
  Target,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  activity_type: string;
  user_id: string;
  fund_id: string;
  occurred_at: string;
  context_data: any;
  priority: string;
  tags: string[];
  is_system_event: boolean;
  fund?: {
    name: string;
    organization_id: string;
  };
}

interface ActivityFilters {
  timeRange: string;
  fundId: string;
  activityType: string;
  priority: string;
  search: string;
}

export function EnhancedAdminActivityFeed() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ActivityFilters>({
    timeRange: '24h',
    fundId: 'all',
    activityType: 'all',
    priority: 'all',
    search: ''
  });
  const { isSuperAdmin, profile } = useUserRole();
  const { funds } = useFund();

  const activityStats = useMemo(() => {
    const now = new Date();
    const last24h = activities.filter(a => 
      new Date(a.occurred_at) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
    );
    
    return {
      total: activities.length,
      last24h: last24h.length,
      highPriority: activities.filter(a => a.priority === 'high' || a.priority === 'critical').length,
      uniqueFunds: new Set(activities.map(a => a.fund_id)).size,
      topActivityType: activities.reduce((acc, a) => {
        acc[a.activity_type] = (acc[a.activity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [activities]);

  useEffect(() => {
    fetchEnhancedActivities();
  }, [filters, isSuperAdmin]);

  const fetchEnhancedActivities = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('activity_events')
        .select('*')
        .eq('is_visible', true)
        .order('occurred_at', { ascending: false });

      // Apply time range filter
      if (filters.timeRange !== 'all') {
        const hours = {
          '1h': 1,
          '24h': 24,
          '7d': 168,
          '30d': 720
        }[filters.timeRange] || 24;
        
        const threshold = new Date();
        threshold.setHours(threshold.getHours() - hours);
        query = query.gte('occurred_at', threshold.toISOString());
      }

      // Apply fund filter
      if (filters.fundId !== 'all') {
        query = query.eq('fund_id', filters.fundId);
      } else if (!isSuperAdmin && profile?.organization_id) {
        // Non-super admins see only their organization's activities
        const orgFunds = funds?.map(f => f.id) || [];
        if (orgFunds.length > 0) {
          query = query.in('fund_id', orgFunds);
        }
      }

          // Apply activity type filter
          if (filters.activityType !== 'all') {
            query = query.eq('activity_type', filters.activityType as any);
          }

          // Apply priority filter
          if (filters.priority !== 'all') {
            query = query.eq('priority', filters.priority as any);
          }

      // Apply search filter
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Limit results for performance
      query = query.limit(100);

      const { data, error } = await query;

      if (error) throw error;
      setActivities((data || []) as ActivityEvent[]);
    } catch (error) {
      console.error('Error fetching enhanced activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string, isSystemEvent: boolean) => {
    if (isSystemEvent) return Shield;
    
    switch (type) {
      case 'deal_created':
      case 'deal_updated':
      case 'deal_stage_changed':
        return Target;
      case 'fund_created':
      case 'fund_updated':
        return Database;
      case 'team_member_invited':
      case 'team_member_joined':
        return User;
      case 'document_uploaded':
        return FileText;
      case 'meeting_scheduled':
        return Calendar;
      case 'investment_decision':
        return TrendingUp;
      case 'criteria_updated':
        return Eye;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string, priority: string) => {
    if (priority === 'critical') return 'text-destructive';
    if (priority === 'high') return 'text-accent-orange';
    
    switch (type) {
      case 'deal_created':
      case 'investment_decision':
        return 'text-primary';
      case 'fund_created':
      case 'fund_updated':
        return 'text-primary';
      case 'team_member_invited':
        return 'text-secondary';
      case 'system_event':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high': return 'bg-accent-orange/10 text-accent-orange border-accent-orange/20';
      case 'medium': return 'bg-primary/10 text-primary border-primary/20';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
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

  const clearFilters = () => {
    setFilters({
      timeRange: '24h',
      fundId: 'all',
      activityType: 'all',
      priority: 'all',
      search: ''
    });
  };

  // Get unique activity types for filter
  const activityTypes = Array.from(new Set(activities.map(a => a.activity_type)));
  
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Platform Activity
            {isSuperAdmin && (
              <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
                Super Admin View
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchEnhancedActivities}>
            <Activity className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <div className="text-lg font-semibold text-primary">{activityStats.total}</div>
            <div className="text-xs text-muted-foreground">Total Activities</div>
          </div>
          <div className="text-center p-3 bg-secondary/5 rounded-lg">
            <div className="text-lg font-semibold text-secondary">{activityStats.last24h}</div>
            <div className="text-xs text-muted-foreground">Last 24h</div>
          </div>
          <div className="text-center p-3 bg-accent-orange/5 rounded-lg">
            <div className="text-lg font-semibold text-accent-orange">{activityStats.highPriority}</div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-semibold">{activityStats.uniqueFunds}</div>
            <div className="text-xs text-muted-foreground">Active Funds</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Select value={filters.timeRange} onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          {isSuperAdmin && (
            <Select value={filters.fundId} onValueChange={(value) => setFilters(prev => ({ ...prev, fundId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Fund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funds</SelectItem>
                {funds?.map(fund => (
                  <SelectItem key={fund.id} value={fund.id}>{fund.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={filters.activityType} onValueChange={(value) => setFilters(prev => ({ ...prev, activityType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Activity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {activityTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        {Object.values(filters).some(v => v !== 'all' && v !== '24h' && v !== '') && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="w-fit">
            <Filter className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No activities found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const IconComponent = getActivityIcon(activity.activity_type, activity.is_system_event);
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors">
                  <div className={`w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className={`h-4 w-4 ${getActivityColor(activity.activity_type, activity.priority)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className={getPriorityColor(activity.priority)}>
                            {activity.priority}
                          </Badge>
                          
                          {activity.fund && (
                            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                              {activity.fund.name}
                            </Badge>
                          )}
                          
                          {activity.is_system_event && (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                              System
                            </Badge>
                          )}
                          
                          {activity.context_data?.cross_organization && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              Cross-Org
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0 ml-4">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.occurred_at)}
                        </span>
                        {activity.tags && activity.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 justify-end">
                            {activity.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="text-xs bg-muted px-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}