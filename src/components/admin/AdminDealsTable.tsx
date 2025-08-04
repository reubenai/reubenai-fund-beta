import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Filter, RefreshCw, ExternalLink } from 'lucide-react';

interface Deal {
  id: string;
  company_name: string;
  status: string;
  overall_score: number | null;
  score_level: string | null;
  industry: string | null;
  created_at: string;
  fund: {
    id: string;
    name: string;
    fund_type: string;
    organization: {
      id: string;
      name: string;
    };
  };
}

interface AdminDealsTableProps {
  refreshTrigger?: number;
}

export function AdminDealsTable({ refreshTrigger }: AdminDealsTableProps) {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fundName: '',
    organization: '',
    fundType: '',
    search: ''
  });

  useEffect(() => {
    fetchDeals();
  }, [refreshTrigger]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('deals')
        .select(`
          id,
          company_name,
          status,
          overall_score,
          score_level,
          industry,
          created_at,
          fund:funds (
            id,
            name,
            fund_type,
            organization:organizations (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast.error('Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  const filteredDeals = deals.filter(deal => {
    const fundNameMatch = !filters.fundName || 
      deal.fund.name.toLowerCase().includes(filters.fundName.toLowerCase());
    
    const organizationMatch = !filters.organization || 
      deal.fund.organization.name.toLowerCase().includes(filters.organization.toLowerCase());
    
    const fundTypeMatch = !filters.fundType || 
      deal.fund.fund_type === filters.fundType;
    
    const searchMatch = !filters.search || 
      deal.company_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      deal.industry?.toLowerCase().includes(filters.search.toLowerCase());

    return fundNameMatch && organizationMatch && fundTypeMatch && searchMatch;
  });

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'sourced': 'bg-blue-100 text-blue-800',
      'initial_review': 'bg-yellow-100 text-yellow-800',
      'due_diligence': 'bg-orange-100 text-orange-800',
      'ic_review': 'bg-purple-100 text-purple-800',
      'investment': 'bg-green-100 text-green-800',
      'pass': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getScoreBadge = (scoreLevel: string | null, score: number | null) => {
    if (!scoreLevel) return null;
    
    const scoreColors: Record<string, string> = {
      'exciting': 'bg-green-100 text-green-800',
      'promising': 'bg-yellow-100 text-yellow-800',
      'needs_development': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={scoreColors[scoreLevel] || 'bg-gray-100 text-gray-800'}>
        {scoreLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        {score && ` (${score})`}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Filter className="h-5 w-5" />
              All Platform Deals
            </CardTitle>
            <CardDescription>
              View and filter all deals across the entire platform ({filteredDeals.length} of {deals.length} deals)
            </CardDescription>
          </div>
          <Button onClick={fetchDeals} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">Search Companies</Label>
            <Input
              id="search"
              placeholder="Company name or industry..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fund-filter" className="text-sm font-medium">Fund Name</Label>
            <Input
              id="fund-filter"
              placeholder="Filter by fund..."
              value={filters.fundName}
              onChange={(e) => setFilters(prev => ({ ...prev, fundName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-filter" className="text-sm font-medium">Organization</Label>
            <Input
              id="org-filter"
              placeholder="Filter by organization..."
              value={filters.organization}
              onChange={(e) => setFilters(prev => ({ ...prev, organization: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fund-type-filter" className="text-sm font-medium">Fund Type</Label>
            <Select value={filters.fundType} onValueChange={(value) => setFilters(prev => ({ ...prev, fundType: value === "all" ? "" : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All fund types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All fund types</SelectItem>
                <SelectItem value="venture_capital">Venture Capital</SelectItem>
                <SelectItem value="private_equity">Private Equity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Deals Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Fund</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Fund Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    Loading deals...
                  </TableCell>
                </TableRow>
              ) : filteredDeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No deals found matching current filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.company_name}</TableCell>
                    <TableCell>{deal.fund.name}</TableCell>
                    <TableCell>{deal.fund.organization.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {deal.fund.fund_type === 'venture_capital' ? 'VC' : 'PE'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(deal.status)}</TableCell>
                    <TableCell>{getScoreBadge(deal.score_level, deal.overall_score)}</TableCell>
                    <TableCell>{deal.industry || 'N/A'}</TableCell>
                    <TableCell>{formatDate(deal.created_at)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/pipeline?fund=${deal.fund.id}`)}
                        className="flex items-center gap-2"
                        title={`View ${deal.fund.name} pipeline`}
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Pipeline
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}