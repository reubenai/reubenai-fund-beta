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
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Filter, RefreshCw, ExternalLink, ArrowUpDown, Trash2 } from 'lucide-react';

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
  onBulkDelete?: (dealIds: string[]) => Promise<void>;
  isSuperAdmin?: boolean;
}

export function AdminDealsTable({ refreshTrigger, onBulkDelete, isSuperAdmin = false }: AdminDealsTableProps) {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fundName: '',
    organization: '',
    fundType: '',
    search: ''
  });
  const [sortField, setSortField] = useState<'company_name' | 'created_at' | 'overall_score'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, [refreshTrigger]);

  const fetchDeals = async () => {
    try {
      setLoading(true);

      // 1) Fetch base deals without embedded relationships to avoid RLS join issues
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select(`
          id,
          company_name,
          status,
          overall_score,
          score_level,
          industry,
          created_at,
          fund_id
        `)
        .order('created_at', { ascending: false });

      if (dealsError) throw dealsError;

      const baseDeals = (dealsData as any[]) || [];
      if (baseDeals.length === 0) {
        setDeals([]);
        return;
      }

      // 2) Fetch funds for the returned deals
      const fundIds = Array.from(new Set(baseDeals.map((d: any) => d.fund_id).filter(Boolean)));
      const { data: fundsData, error: fundsError } = await supabase
        .from('funds')
        .select('id, name, fund_type, organization_id')
        .in('id', fundIds);
      if (fundsError) throw fundsError;

      // 3) Fetch organizations for those funds
      const orgIds = Array.from(new Set((fundsData || []).map((f: any) => f.organization_id).filter(Boolean)));
      let orgsData: any[] = [];
      if (orgIds.length > 0) {
        const { data: organizations, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);
        if (orgsError) throw orgsError;
        orgsData = organizations || [];
      }

      const fundMap = new Map((fundsData || []).map((f: any) => [f.id, f]));
      const orgMap = new Map(orgsData.map((o: any) => [o.id, o]));

      const normalizedDeals: Deal[] = baseDeals.map((d: any) => {
        const f = fundMap.get(d.fund_id);
        const o = f ? orgMap.get(f.organization_id) : null;
        return {
          id: d.id,
          company_name: d.company_name,
          status: d.status,
          overall_score: d.overall_score ?? null,
          score_level: d.score_level ?? null,
          industry: d.industry ?? null,
          created_at: d.created_at,
          fund: {
            id: f?.id || '',
            name: f?.name || 'Unknown Fund',
            fund_type: f?.fund_type || '',
            organization: {
              id: o?.id || '',
              name: o?.name || 'Unknown Org',
            },
          },
        } as Deal;
      });

      setDeals(normalizedDeals);
    } catch (error: any) {
      console.error('Error fetching deals:', error?.message || error);
      toast.error('Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };
  const filteredDeals = deals
    .filter(deal => {
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
    })
    .sort((a, b) => {
      const aValue = a[sortField] || 0;
      const bValue = b[sortField] || 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  // Pagination
  const totalPages = Math.ceil(filteredDeals.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedDeals = filteredDeals.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDeals(paginatedDeals.map(deal => deal.id));
    } else {
      setSelectedDeals([]);
    }
  };

  const handleSelectDeal = (dealId: string, checked: boolean) => {
    if (checked) {
      setSelectedDeals(prev => [...prev, dealId]);
    } else {
      setSelectedDeals(prev => prev.filter(id => id !== dealId));
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedDeals.length === 0) return;
    
    setIsDeleting(true);
    try {
      await onBulkDelete(selectedDeals);
      setSelectedDeals([]);
      setShowDeleteDialog(false);
      fetchDeals(); // Refresh the data
    } catch (error) {
      console.error('Error during bulk delete:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedDealNames = deals
    .filter(deal => selectedDeals.includes(deal.id))
    .map(deal => deal.company_name);

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">Search Companies</Label>
            <Input
              id="search"
              placeholder="Company name or industry..."
              value={filters.search}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, search: e.target.value }));
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fund-filter" className="text-sm font-medium">Fund Name</Label>
            <Input
              id="fund-filter"
              placeholder="Filter by fund..."
              value={filters.fundName}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, fundName: e.target.value }));
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-filter" className="text-sm font-medium">Organization</Label>
            <Input
              id="org-filter"
              placeholder="Filter by organization..."
              value={filters.organization}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, organization: e.target.value }));
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fund-type-filter" className="text-sm font-medium">Fund Type</Label>
            <Select value={filters.fundType} onValueChange={(value) => {
              setFilters(prev => ({ ...prev, fundType: value === "all" ? "" : value }));
              setCurrentPage(1);
            }}>
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
          <div className="space-y-2">
            <Label className="text-sm font-medium">Page Size</Label>
            <Select 
              value={pageSize.toString()} 
              onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {paginatedDeals.length} of {filteredDeals.length} deals
          </div>
          
          {/* Bulk Action Bar */}
          {selectedDeals.length > 0 && isSuperAdmin && (
            <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedDeals.length} deal{selectedDeals.length > 1 ? 's' : ''} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Bulk Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDeals([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>

        {/* Deals Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                {isSuperAdmin && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedDeals.length === paginatedDeals.length && paginatedDeals.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all deals"
                    />
                  </TableHead>
                )}
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('company_name')}
                    className="h-8 p-0 hover:bg-transparent font-medium"
                  >
                    Company
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Fund</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Fund Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('overall_score')}
                    className="h-8 p-0 hover:bg-transparent font-medium"
                  >
                    Score
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('created_at')}
                    className="h-8 p-0 hover:bg-transparent font-medium"
                  >
                    Created
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 10 : 9} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    Loading deals...
                  </TableCell>
                </TableRow>
              ) : paginatedDeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 10 : 9} className="text-center py-8 text-muted-foreground">
                    No deals found matching current filters
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    {isSuperAdmin && (
                      <TableCell>
                        <Checkbox
                          checked={selectedDeals.includes(deal.id)}
                          onCheckedChange={(checked) => handleSelectDeal(deal.id, !!checked)}
                          aria-label={`Select ${deal.company_name}`}
                        />
                      </TableCell>
                    )}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(prev => prev - 1);
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNumber);
                        }}
                        isActive={currentPage === pageNumber}
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
                      if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedDeals.length} deal{selectedDeals.length > 1 ? 's' : ''}? 
              This action cannot be undone and will also delete all associated documents, notes, and analyses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="max-h-40 overflow-y-auto border rounded p-3 bg-muted/20">
            <p className="font-medium mb-2">Deals to be deleted:</p>
            <ul className="space-y-1">
              {selectedDealNames.map((name, index) => (
                <li key={index} className="text-sm">• {name}</li>
              ))}
            </ul>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                `Delete ${selectedDeals.length} Deal${selectedDeals.length > 1 ? 's' : ''}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}