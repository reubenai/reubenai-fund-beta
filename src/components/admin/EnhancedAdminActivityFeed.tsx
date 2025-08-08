import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
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
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  user?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
  };
}

interface ActivityFilters {
  timeRange: string;
  fundId: string;
  activityType: string;
  priority: string;
  search: string;
}

interface SortConfig {
  field: 'occurred_at' | 'priority' | 'activity_type' | 'title';
  direction: 'asc' | 'desc';
}

interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export function EnhancedAdminActivityFeed() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>({
    timeRange: '24h',
    fundId: 'all',
    activityType: 'all',
    priority: 'all',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'occurred_at',
    direction: 'desc'
  });
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 25,
    total: 0
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
  }, [filters, sortConfig, pagination.page, pagination.pageSize, isSuperAdmin]);

  const fetchEnhancedActivities = async () => {
    try {
      setLoading(true);
      
      // First, get the total count for pagination
      let countQuery = supabase
        .from('activity_events')
        .select('*', { count: 'exact', head: true })
        .eq('is_visible', true);

      // Apply the same filters for count
      if (filters.timeRange !== 'all') {
        const hours = {
          '1h': 1,
          '24h': 24,
          '7d': 168,
          '30d': 720
        }[filters.timeRange] || 24;
        
        const threshold = new Date();
        threshold.setHours(threshold.getHours() - hours);
        countQuery = countQuery.gte('occurred_at', threshold.toISOString());
      }

      if (filters.fundId !== 'all') {
        countQuery = countQuery.eq('fund_id', filters.fundId);
      } else if (!isSuperAdmin && profile?.organization_id) {
        const orgFunds = funds?.map(f => f.id) || [];
        if (orgFunds.length > 0) {
          countQuery = countQuery.in('fund_id', orgFunds);
        }
      }

      if (filters.activityType !== 'all') {
        countQuery = countQuery.eq('activity_type', filters.activityType as any);
      }

      if (filters.priority !== 'all') {
        countQuery = countQuery.eq('priority', filters.priority as any);
      }

      if (filters.search) {
        countQuery = countQuery.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { count } = await countQuery;

      // Now get the actual data with pagination and sorting
      let query = supabase
        .from('activity_events')
        .select(`
          *,
          fund:funds(name, organization_id),
          user:profiles(email, first_name, last_name, role)
        `)
        .eq('is_visible', true)
        .order(sortConfig.field, { ascending: sortConfig.direction === 'asc' });

      // Apply the same filters
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

      if (filters.fundId !== 'all') {
        query = query.eq('fund_id', filters.fundId);
      } else if (!isSuperAdmin && profile?.organization_id) {
        const orgFunds = funds?.map(f => f.id) || [];
        if (orgFunds.length > 0) {
          query = query.in('fund_id', orgFunds);
        }
      }

      if (filters.activityType !== 'all') {
        query = query.eq('activity_type', filters.activityType as any);
      }

      if (filters.priority !== 'all') {
        query = query.eq('priority', filters.priority as any);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const offset = (pagination.page - 1) * pagination.pageSize;
      query = query.range(offset, offset + pagination.pageSize - 1);

      const { data, error } = await query;

      if (error) throw error;
      
      setActivities((data || []) as any[]);
      setPagination(prev => ({ ...prev, total: count || 0 }));
      setError(null);
    } catch (error) {
      console.error('Error fetching enhanced activities:', error);
      setError(error instanceof Error ? error.message : 'Failed to load activities');
      setActivities([]);
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
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field: SortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getSortIcon = (field: SortConfig['field']) => {
    if (sortConfig.field !== field) return ArrowUpDown;
    return sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;
  };

  const getUserDisplayName = (user?: ActivityEvent['user']) => {
    if (!user) return 'Unknown User';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return user.email?.split('@')[0] || 'Unknown User';
  };

  const getUserInitials = (user?: ActivityEvent['user']) => {
    if (!user) return 'U';
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) return user.first_name[0].toUpperCase();
    if (user.last_name) return user.last_name[0].toUpperCase();
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const paginatedActivities = activities;

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

      <CardContent className="space-y-4">
        {/* Page Size Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select 
              value={pagination.pageSize.toString()} 
              onValueChange={(value) => {
                setPagination(prev => ({ ...prev, pageSize: parseInt(value), page: 1 }));
              }}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              entries ({pagination.total} total)
            </span>
          </div>
        </div>

        {/* Activities Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="w-12"></TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('title')}
                    className="h-8 p-0 hover:bg-transparent font-medium"
                  >
                    Activity
                    {getSortIcon('title') && React.createElement(getSortIcon('title'), { className: 'ml-2 h-4 w-4' })}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('activity_type')}
                    className="h-8 p-0 hover:bg-transparent font-medium"
                  >
                    Type
                    {getSortIcon('activity_type') && React.createElement(getSortIcon('activity_type'), { className: 'ml-2 h-4 w-4' })}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('priority')}
                    className="h-8 p-0 hover:bg-transparent font-medium"
                  >
                    Priority
                    {getSortIcon('priority') && React.createElement(getSortIcon('priority'), { className: 'ml-2 h-4 w-4' })}
                  </Button>
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Fund</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('occurred_at')}
                    className="h-8 p-0 hover:bg-transparent font-medium"
                  >
                    When
                    {getSortIcon('occurred_at') && React.createElement(getSortIcon('occurred_at'), { className: 'ml-2 h-4 w-4' })}
                  </Button>
                </TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(pagination.pageSize)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="w-8 h-8 bg-muted rounded-full animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
                    <p className="text-destructive font-medium">Error loading activities</p>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchEnhancedActivities}
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </TableCell>
                </TableRow>
              ) : paginatedActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No activities found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedActivities.map((activity) => {
                  const IconComponent = getActivityIcon(activity.activity_type, activity.is_system_event);
                  return (
                    <TableRow key={activity.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getUserInitials(activity.user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                            <IconComponent className={`h-3 w-3 ${getActivityColor(activity.activity_type, activity.priority)}`} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {activity.title}
                            {activity.user && (
                              <span className="text-muted-foreground font-normal"> by {getUserDisplayName(activity.user)}</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {activity.activity_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPriorityColor(activity.priority)}>
                          {activity.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {activity.user ? (
                          <div className="text-sm">
                            <div className="font-medium text-foreground">{getUserDisplayName(activity.user)}</div>
                            <div className="text-xs text-muted-foreground">{activity.user.email}</div>
                          </div>
                        ) : activity.is_system_event ? (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs">
                            System
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unknown User</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.fund && (
                          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 text-xs">
                            {activity.fund.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.occurred_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {activity.tags && activity.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {activity.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="text-xs bg-muted px-1 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                            {activity.tags.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{activity.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.page > 1) {
                        setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                      }
                    }}
                    className={pagination.page === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNumber = i + 1;
                  } else if (pagination.page >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = pagination.page - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPagination(prev => ({ ...prev, page: pageNumber }));
                        }}
                        isActive={pagination.page === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.page < totalPages) {
                        setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                      }
                    }}
                    className={pagination.page === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}