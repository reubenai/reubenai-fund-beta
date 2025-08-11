import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Activity, 
  User, 
  Calendar, 
  Filter,
  Search
} from 'lucide-react';
import { EnhancedActivityEvent } from '@/hooks/useEnhancedDealActivities';

interface EnhancedActivityTableProps {
  activities: EnhancedActivityEvent[];
  loading: boolean;
}

const getActivityTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'deal_created': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'deal_updated': 'bg-blue-100 text-blue-700 border-blue-200',
    'document_uploaded': 'bg-purple-100 text-purple-700 border-purple-200',
    'note_added': 'bg-amber-100 text-amber-700 border-amber-200',
    'analysis_triggered': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'status_changed': 'bg-orange-100 text-orange-700 border-orange-200',
    'ic_memo_created': 'bg-pink-100 text-pink-700 border-pink-200',
  };
  return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    'critical': 'bg-red-100 text-red-700 border-red-200',
    'high': 'bg-orange-100 text-orange-700 border-orange-200',
    'medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'low': 'bg-green-100 text-green-700 border-green-200',
  };
  return colors[priority] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getUserDisplayName = (user?: EnhancedActivityEvent['user']): string => {
  if (!user) return 'System';
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  return user.email.split('@')[0];
};

const getUserInitials = (user?: EnhancedActivityEvent['user']): string => {
  if (!user) return 'SY';
  if (user.first_name || user.last_name) {
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
};

export function EnhancedActivityTable({ activities, loading }: EnhancedActivityTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserDisplayName(activity.user).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || activity.activity_type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || activity.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  const uniqueTypes = [...new Set(activities.map(a => a.activity_type))];
  const uniquePriorities = [...new Set(activities.map(a => a.priority))];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity (Last 30 Days)
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Activity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {uniquePriorities.map(priority => (
                <SelectItem key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No activities found</p>
            <p className="text-sm">
              {activities.length === 0 
                ? "No activities in the last 30 days" 
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">User</TableHead>
                <TableHead className="w-[150px]">Type</TableHead>
                <TableHead className="w-[100px]">Priority</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="w-[150px]">Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {getUserInitials(activity.user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {getUserDisplayName(activity.user)}
                        </span>
                        {activity.user?.email && (
                          <span className="text-xs text-muted-foreground">
                            {activity.user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className={getActivityTypeColor(activity.activity_type)}>
                      {activity.activity_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className={getPriorityColor(activity.priority)}>
                      {activity.priority.charAt(0).toUpperCase() + activity.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">{activity.title}</span>
                      {activity.description && (
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {activity.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{format(new Date(activity.occurred_at), 'MMM dd, yyyy')}</span>
                        <span className="text-xs">{format(new Date(activity.occurred_at), 'HH:mm')}</span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}