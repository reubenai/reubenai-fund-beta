import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Activity, User, Building, Database, Shield, RefreshCw, FileText, MessageSquare, BarChart3 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  activity_type: string;
  user_id: string;
  occurred_at: string;
  context_data: any;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url?: string | null;
  };
}

export function EnhancedPlatformActivity() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isSuperAdmin } = useUserRole();

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('activity_events')
        .select(`
          *,
          user:profiles!user_id (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .order('occurred_at', { ascending: false })
        .limit(25);

      if (fetchError) {
        throw fetchError;
      }

      setActivities(data || []);
    } catch (err: any) {
      console.error('Error fetching platform activities:', err);
      setError(err.message || 'Failed to load platform activities');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_management':
      case 'user_activity':
        return User;
      case 'organization_management':
        return Building;
      case 'fund_management':
      case 'fund_memory_activity':
        return Database;
      case 'system_access':
        return Shield;
      case 'ic_memo_activity':
        return FileText;
      case 'document_activity':
        return FileText;
      case 'note_activity':
        return MessageSquare;
      case 'deal_analysis':
        return BarChart3;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_management':
      case 'user_activity':
        return 'text-blue-600';
      case 'organization_management':
        return 'text-green-600';
      case 'fund_management':
      case 'fund_memory_activity':
        return 'text-purple-600';
      case 'system_access':
        return 'text-orange-600';
      case 'ic_memo_activity':
        return 'text-indigo-600';
      case 'document_activity':
        return 'text-cyan-600';
      case 'note_activity':
        return 'text-emerald-600';
      case 'deal_analysis':
        return 'text-rose-600';
      default:
        return 'text-gray-600';
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

  if (!isSuperAdmin) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Platform activity is only available for Super Admins
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Platform Activity
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecentActivities}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-md">
            <Shield className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

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
            <p className="text-muted-foreground">No recent platform activity</p>
            <p className="text-sm text-muted-foreground mt-1">
              Activities from all organizations will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activities.map((activity) => {
              const IconComponent = getActivityIcon(activity.activity_type);
              const isEnhanced = activity.context_data?.attribution_source === 'enhanced_activity_attribution';
              
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getUserInitials(activity.user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center`}>
                      <IconComponent className={`h-3 w-3 ${getActivityColor(activity.activity_type)}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {activity.title}
                        {activity.user && (
                          <span className="text-muted-foreground font-normal"> by {getUserDisplayName(activity.user)}</span>
                        )}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTimeAgo(activity.occurred_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {activity.activity_type && (
                        <Badge variant="outline" className="text-xs">
                          {activity.activity_type.replace('_', ' ')}
                        </Badge>
                      )}
                      {isEnhanced && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Enhanced Attribution
                        </Badge>
                      )}
                      {activity.context_data?.user_role && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {activity.context_data.user_role}
                        </Badge>
                      )}
                      {activity.user?.email && (
                        <span className="text-xs text-muted-foreground">
                          {activity.user.email}
                        </span>
                      )}
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