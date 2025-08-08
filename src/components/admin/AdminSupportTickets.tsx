import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Star, 
  Search, 
  Filter,
  MessageCircle,
  Bug,
  Lightbulb,
  Heart,
  ArrowUpDown
} from 'lucide-react';

interface SupportTicket {
  id: string;
  user_id: string;
  email: string;
  feedback_type: 'bug' | 'feature' | 'general' | 'love';
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to: string | null;
  rating: number | null;
  fund_id: string | null;
  fund_name: string | null;
  internal_notes: string | null;
  resolution_notes: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  avg_response_time: number;
  avg_resolution_time: number;
  satisfaction_score: number;
}

const feedbackTypeIcons = {
  bug: Bug,
  feature: Lightbulb,
  general: MessageCircle,
  love: Heart
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const statusColors = {
  open: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-purple-100 text-purple-800'
};

export function AdminSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    avg_response_time: 0,
    avg_resolution_time: 0,
    satisfaction_score: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data || []) as SupportTicket[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: allTickets } = await supabase
        .from('support_tickets')
        .select('*');

      if (!allTickets) return;

      const total = allTickets.length;
      const open = allTickets.filter(t => t.status === 'open').length;
      const in_progress = allTickets.filter(t => t.status === 'in_progress').length;
      const resolved = allTickets.filter(t => t.status === 'resolved').length;
      const closed = allTickets.filter(t => t.status === 'closed').length;

      // Calculate average response time (for tickets with first_response_at)
      const respondedTickets = allTickets.filter(t => t.first_response_at);
      const avg_response_time = respondedTickets.length > 0 
        ? respondedTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at);
            const responded = new Date(ticket.first_response_at!);
            return sum + (responded.getTime() - created.getTime());
          }, 0) / respondedTickets.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Calculate average resolution time (for resolved tickets)
      const resolvedTickets = allTickets.filter(t => t.resolved_at);
      const avg_resolution_time = resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at);
            const resolved = new Date(ticket.resolved_at!);
            return sum + (resolved.getTime() - created.getTime());
          }, 0) / resolvedTickets.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // Calculate satisfaction score (average rating)
      const ratedTickets = allTickets.filter(t => t.rating);
      const satisfaction_score = ratedTickets.length > 0
        ? ratedTickets.reduce((sum, ticket) => sum + ticket.rating!, 0) / ratedTickets.length
        : 0;

      setStats({
        total,
        open,
        in_progress,
        resolved,
        closed,
        avg_response_time,
        avg_resolution_time,
        satisfaction_score
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };

      if (newStatus === 'in_progress' && !selectedTicket?.first_response_at) {
        updates.first_response_at = new Date().toISOString();
      }
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
      if (newStatus === 'closed') {
        updates.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;

      await fetchTickets();
      await fetchStats();
      toast.success('Ticket status updated');
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const addInternalNotes = async (ticketId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ internal_notes: notes })
        .eq('id', ticketId);

      if (error) throw error;

      await fetchTickets();
      toast.success('Internal notes updated');
      setInternalNotes('');
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to update notes');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || ticket.feedback_type === typeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading support tickets...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.open} open, {stats.in_progress} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avg_response_time.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Time to first response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avg_resolution_time.toFixed(1)}d</div>
            <p className="text-xs text-muted-foreground">
              Days to resolve
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.satisfaction_score.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              Average user rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="love">Appreciation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>
            Manage feedback and support requests from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => {
                const TypeIcon = feedbackTypeIcons[ticket.feedback_type];
                return (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4" />
                        <span className="capitalize">{ticket.feedback_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate font-medium">
                        {ticket.subject}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {ticket.email}
                        {ticket.fund_name && (
                          <div className="text-xs text-muted-foreground">
                            {ticket.fund_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[ticket.status]}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{ticket.rating}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setInternalNotes(ticket.internal_notes || '');
                            }}
                          >
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <TypeIcon className="h-5 w-5" />
                              {ticket.subject}
                            </DialogTitle>
                            <DialogDescription>
                              {ticket.feedback_type} from {ticket.email} • Created {new Date(ticket.created_at).toLocaleString()}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <Badge className={priorityColors[ticket.priority]}>
                                {ticket.priority}
                              </Badge>
                              <Badge className={statusColors[ticket.status]}>
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                              {ticket.rating && (
                                <Badge variant="outline">
                                  <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                  {ticket.rating}/5
                                </Badge>
                              )}
                            </div>

                            <div>
                              <Label className="text-base font-semibold">Message</Label>
                              <div className="mt-2 p-3 bg-muted rounded-md whitespace-pre-wrap">
                                {ticket.message}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Status</Label>
                                <Select 
                                  value={ticket.status} 
                                  onValueChange={(value) => updateTicketStatus(ticket.id, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Priority</Label>
                                <Select 
                                  value={ticket.priority} 
                                  onValueChange={(value) => {
                                    // Update priority logic here
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <Label>Internal Notes</Label>
                              <Textarea
                                value={internalNotes}
                                onChange={(e) => setInternalNotes(e.target.value)}
                                placeholder="Add internal notes for team members..."
                                className="mt-2"
                              />
                              <Button 
                                onClick={() => addInternalNotes(ticket.id, internalNotes)}
                                className="mt-2"
                                disabled={!internalNotes.trim()}
                              >
                                Save Notes
                              </Button>
                            </div>

                            {ticket.internal_notes && (
                              <div>
                                <Label className="text-base font-semibold">Existing Internal Notes</Label>
                                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                  {ticket.internal_notes}
                                </div>
                              </div>
                            )}

                            {ticket.resolution_notes && (
                              <div>
                                <Label className="text-base font-semibold">Resolution Notes</Label>
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                  {ticket.resolution_notes}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No tickets found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}