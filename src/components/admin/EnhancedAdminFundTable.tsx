import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { 
  Database, 
  Building, 
  Search, 
  Plus, 
  ArrowUpDown, 
  Target, 
  Kanban, 
  Upload, 
  Archive,
  ArchiveRestore,
  ExternalLink
} from 'lucide-react';

interface Fund {
  id: string;
  name: string;
  fund_type: string;
  target_size: number | null;
  currency: string;
  is_active: boolean;
  created_at: string;
  organization_id: string;
  dealCount?: number;
  activeDeals?: number;
  totalInvestments?: number;
}

interface Organization {
  id: string;
  name: string;
}

interface EnhancedAdminFundTableProps {
  funds: Fund[];
  organizations: Organization[];
  onCreateFund: () => void;
  onConfigureThesis: (fund: Fund) => void;
  onBulkUpload: (fund: Fund) => void;
  onArchiveFund: (fundId: string, fundName: string) => void;
  onUnarchiveFund: (fundId: string, fundName: string) => void;
  onRefresh: () => void;
}

export function EnhancedAdminFundTable({
  funds,
  organizations,
  onCreateFund,
  onConfigureThesis,
  onBulkUpload,
  onArchiveFund,
  onUnarchiveFund,
  onRefresh
}: EnhancedAdminFundTableProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [fundTypeFilter, setFundTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'created_at' | 'target_size' | 'dealCount'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and sort funds
  const filteredFunds = funds
    .filter(fund => {
      const matchesSearch = fund.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = fundTypeFilter === 'all' || fund.fund_type === fundTypeFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && fund.is_active) ||
        (statusFilter === 'archived' && !fund.is_active);
      const matchesOrg = orgFilter === 'all' || fund.organization_id === orgFilter;
      
      return matchesSearch && matchesType && matchesStatus && matchesOrg;
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
  const totalPages = Math.ceil(filteredFunds.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedFunds = filteredFunds.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return 'N/A';
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getOrganizationName = (orgId: string) => {
    return organizations.find(org => org.id === orgId)?.name || 'Unknown Organization';
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Database className="h-5 w-5" />
              Fund Management
            </CardTitle>
            <CardDescription>
              Manage funds across all organizations ({filteredFunds.length} funds)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={onRefresh} variant="outline" size="sm">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={onCreateFund} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Fund
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search funds..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          
          <Select value={fundTypeFilter} onValueChange={(value) => {
            setFundTypeFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Fund Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="venture_capital">Venture Capital</SelectItem>
              <SelectItem value="private_equity">Private Equity</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={orgFilter} onValueChange={(value) => {
            setOrgFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations.map(org => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select 
              value={pageSize.toString()} 
              onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('name')}
                    className="h-8 p-0 hover:bg-transparent font-medium"
                  >
                    Fund Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('target_size')}
                    className="h-8 p-0 hover:bg-transparent font-medium"
                  >
                    Target Size
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('dealCount')}
                    className="h-8 p-0 hover:bg-transparent font-medium"
                  >
                    Deals
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
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
              {paginatedFunds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No funds found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFunds.map((fund) => (
                  <TableRow key={fund.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Database className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{fund.name}</p>
                          <p className="text-xs text-muted-foreground">{fund.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{getOrganizationName(fund.organization_id)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {fund.fund_type === 'venture_capital' ? 'VC' : 'PE'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {formatCurrency(fund.target_size, fund.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{fund.dealCount || 0}</span>
                        {fund.activeDeals && (
                          <Badge variant="outline" className="text-xs">
                            {fund.activeDeals} active
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={fund.is_active ? 'default' : 'destructive'}>
                        {fund.is_active ? 'Active' : 'Archived'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(fund.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onConfigureThesis(fund)}
                          className="h-8 w-8 p-0"
                          title="Configure Thesis"
                        >
                          <Target className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/pipeline?fund=${fund.id}`)}
                          className="h-8 w-8 p-0"
                          title="View Pipeline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onBulkUpload(fund)}
                          className="h-8 w-8 p-0"
                          title="Bulk Upload"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        {fund.is_active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onArchiveFund(fund.id, fund.name)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Archive Fund"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUnarchiveFund(fund.id, fund.name)}
                            className="h-8 w-8 p-0 text-primary hover:text-primary"
                            title="Unarchive Fund"
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
    </Card>
  );
}