import React, { useState, useMemo } from 'react';
import { Deal } from '@/hooks/usePipelineDeals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useControlledAnalysis } from '@/hooks/useControlledAnalysis';
import { useAnalysisQueue } from '@/hooks/useAnalysisQueue';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Eye,
  Edit,
  Zap,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EnhancedDealTableViewProps {
  deals: Record<string, Deal[]>;
  onDealClick: (deal: Deal) => void;
  onDealEdit?: (deal: Deal) => void;
  onStageChange?: (dealId: string, fromStage: string, toStage: string) => void;
  stages: Array<{ id: string; name: string; color: string }>;
  loading?: boolean;
}

type SortField = 'company_name' | 'industry' | 'current_round_size' | 'overall_score' | 'updated_at' | 'status';
type SortDirection = 'asc' | 'desc';

const getRAGBadgeVariant = (ragStatus?: string) => {
  switch (ragStatus?.toLowerCase()) {
    case 'green':
    case 'exciting':
      return 'default';
    case 'amber':
    case 'promising':
      return 'secondary';
    case 'red':
    case 'needs_development':
      return 'destructive';
    default:
      return 'outline';
  }
};

const formatCurrency = (amount?: number, currency = 'USD') => {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: amount >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: amount >= 1000000 ? 1 : 0,
  }).format(amount);
};

  const formatScore = (score?: number) => {
  if (typeof score !== 'number') return '—';
  return `${Math.round(score)}/100`;
};

// Export functionality
const exportDeals = (deals: (Deal & { stage: string })[], format: 'csv' | 'json' = 'csv') => {
  const headers = [
    'Company Name',
    'Industry', 
    'Stage',
    'Current Round Size',
    'Valuation',
    'Currency',
    'ReubenAI Score',
    'RAG Status',
    'Location',
    'Website',
    'Founder',
    'Description',
    'Created Date',
    'Updated Date'
  ];

  if (format === 'csv') {
    const csvContent = [
      headers.join(','),
      ...deals.map(deal => [
        `"${(deal.company_name || 'Unnamed Company').replace(/"/g, '""')}"`,
        `"${(deal.industry || '').replace(/"/g, '""')}"`,
        `"${deal.stage.replace(/"/g, '""')}"`,
        deal.current_round_size || '',
        deal.valuation || '',
        deal.currency || 'USD',
        deal.overall_score || '',
        deal.rag_status || '',
        `"${(deal.location || '').replace(/"/g, '""')}"`,
        `"${(deal.website || '').replace(/"/g, '""')}"`,
        `"${(deal.founder || '').replace(/"/g, '""')}"`,
        `"${(deal.description || '').replace(/"/g, '""')}"`,
        new Date(deal.created_at).toLocaleDateString(),
        new Date(deal.updated_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `deals-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};


export const EnhancedDealTableView: React.FC<EnhancedDealTableViewProps> = ({
  deals,
  onDealClick,
  onDealEdit,
  onStageChange,
  stages,
  loading = false
}) => {
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [triggeringAnalysis, setTriggeringAnalysis] = useState<Set<string>>(new Set());
  const [togglingAnalysis, setTogglingAnalysis] = useState<Set<string>>(new Set());
  
  const { triggerAnalysis } = useControlledAnalysis();
  const { toggleAutoAnalysis } = useAnalysisQueue();

  // Flatten deals from all stages
  const allDeals = useMemo(() => {
    const flattened: (Deal & { stage: string })[] = [];
    Object.entries(deals).forEach(([stageName, stageDeals]) => {
      stageDeals.forEach(deal => {
        flattened.push({ ...deal, stage: stageName });
      });
    });
    return flattened;
  }, [deals]);

  // Sort deals
  const sortedDeals = useMemo(() => {
    return [...allDeals].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle special cases
      if (sortField === 'company_name') {
        aValue = (aValue || 'Unnamed Company').toLowerCase();
        bValue = (bValue || 'Unnamed Company').toLowerCase();
      } else if (sortField === 'updated_at') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (['current_round_size', 'overall_score'].includes(sortField)) {
        aValue = aValue || 0;
        bValue = bValue || 0;
      } else if (sortField === 'status') {
        aValue = a.stage;
        bValue = b.stage;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allDeals, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedDeals.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedDeals = sortedDeals.slice(startIndex, endIndex);

  // Reset to first page when deals change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortedDeals.length]);

  // Reset selected deals when page changes
  React.useEffect(() => {
    setSelectedDeals(new Set());
  }, [currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const handleStageChange = (deal: Deal & { stage: string }, newStage: string) => {
    if (onStageChange && deal.stage !== newStage) {
      onStageChange(deal.id, deal.stage, newStage);
    }
  };

  const handleTriggerAnalysis = async (dealId: string) => {
    setTriggeringAnalysis(prev => new Set(prev).add(dealId));
    
    try {
      await triggerAnalysis({
        type: 'manual_trigger',
        dealId,
        metadata: { source: 'deal_table_action' }
      });
    } finally {
      setTriggeringAnalysis(prev => {
        const updated = new Set(prev);
        updated.delete(dealId);
        return updated;
      });
    }
  };

  const handleToggleAutoAnalysis = async (dealId: string, enabled: boolean) => {
    setTogglingAnalysis(prev => new Set(prev).add(dealId));
    
    try {
      await toggleAutoAnalysis(dealId, enabled);
    } finally {
      setTogglingAnalysis(prev => {
        const updated = new Set(prev);
        updated.delete(dealId);
        return updated;
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Table Controls */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedDeals.length)} of {sortedDeals.length} deals
          </span>
          {selectedDeals.size > 0 && (
            <Badge variant="secondary">
              {selectedDeals.size} selected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportDeals(sortedDeals)}
            disabled={sortedDeals.length === 0}
          >
            Export All ({sortedDeals.length})
          </Button>
          {selectedDeals.size > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const selectedDealsList = sortedDeals.filter(deal => selectedDeals.has(deal.id));
                exportDeals(selectedDealsList);
              }}
            >
              Export Selected ({selectedDeals.size})
            </Button>
          )}
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      </div>

      {/* Table Container with Fixed Height and Scroll */}
      <div className="flex-1 border border-border rounded-lg bg-card overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto scroll-smooth" style={{ maxHeight: 'calc(100vh - 400px)' }}>
          <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b border-border shadow-sm">
              <tr className="border-b transition-colors hover:bg-transparent [&>th]:border-b">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-12 sticky left-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-r border-border">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      const currentPageDeals = paginatedDeals.map(d => d.id);
                      setSelectedDeals(new Set([...selectedDeals, ...currentPageDeals]));
                    } else {
                      const currentPageDeals = new Set(paginatedDeals.map(d => d.id));
                      setSelectedDeals(new Set([...selectedDeals].filter(id => !currentPageDeals.has(id))));
                    }
                  }}
                  checked={paginatedDeals.length > 0 && paginatedDeals.every(deal => selectedDeals.has(deal.id))}
                  className="rounded border-border"
                />
              </th>
              
              <th 
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground sticky left-12 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[200px] border-r border-border"
                onClick={() => handleSort('company_name')}
              >
                <div className="flex items-center">
                  Company
                  {getSortIcon('company_name')}
                </div>
              </th>
              
              <th 
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[100px]"
                onClick={() => handleSort('industry')}
              >
                <div className="flex items-center">
                  Industry
                  {getSortIcon('industry')}
                </div>
              </th>
              
              <th 
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[100px]"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Stage
                  {getSortIcon('status')}
                </div>
              </th>
              
              <th 
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer select-none hover:bg-muted/50 transition-colors text-right min-w-[120px]"
                onClick={() => handleSort('current_round_size')}
              >
                <div className="flex items-center justify-end">
                  Current Round Size
                  {getSortIcon('current_round_size')}
                </div>
              </th>
              
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-right min-w-[120px]">
                <div className="flex items-center justify-end">
                  Valuation
                </div>
              </th>
              
              <th 
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer select-none hover:bg-muted/50 transition-colors text-center min-w-[120px]"
                onClick={() => handleSort('overall_score')}
              >
                <div className="flex items-center justify-center">
                  ReubenAI Score
                  {getSortIcon('overall_score')}
                </div>
              </th>
              
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-center min-w-[120px]">
                <div className="flex items-center justify-center">
                  Live Analysis
                </div>
              </th>
              
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[120px]">Location</th>
              
              <th 
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[140px]"
                onClick={() => handleSort('updated_at')}
              >
                <div className="flex items-center">
                  Last Activity
                  {getSortIcon('updated_at')}
                </div>
              </th>
              
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-12">Actions</th>
            </tr>
            </thead>
          
          <tbody className="[&_tr:last-child]:border-0">
            {paginatedDeals.map((deal) => (
              <tr 
                key={deal.id}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer border-b border-border"
                onClick={() => onDealClick(deal)}
              >
                <td className="p-4 align-middle sticky left-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40 border-r border-border" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={selectedDeals.has(deal.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedDeals);
                      if (e.target.checked) {
                        newSelected.add(deal.id);
                      } else {
                        newSelected.delete(deal.id);
                      }
                      setSelectedDeals(newSelected);
                    }}
                  />
                </td>
                
                <td className="p-4 align-middle sticky left-12 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40 min-w-[200px] border-r border-border">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-foreground">
                        {(deal.company_name && deal.company_name !== 'undefined') 
                          ? deal.company_name 
                          : 'Unnamed Company'}
                      </span>
                      {deal.website && (
                        <a
                          href={deal.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {deal.founder && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{deal.founder}</span>
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="p-4 align-middle">
                  {deal.industry ? (
                    <Badge variant="outline" className="text-xs">
                      {deal.industry}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                
                <td className="p-4 align-middle">
                  <DropdownMenu>
                    <DropdownMenuTrigger 
                      asChild 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="sm" className="h-8">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "cursor-pointer hover:bg-muted transition-colors",
                            stages.find(s => s.name === deal.stage)?.color && {
                              borderColor: stages.find(s => s.name === deal.stage)?.color
                            }
                          )}
                        >
                          {deal.stage}
                        </Badge>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {stages.map((stage) => (
                        <DropdownMenuItem
                          key={stage.id}
                          onClick={() => handleStageChange(deal, stage.name)}
                          disabled={stage.name === deal.stage}
                        >
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            <span>{stage.name}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                
                <td className="p-4 align-middle text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">
                      {formatCurrency(deal.current_round_size, deal.currency)}
                    </span>
                  </div>
                </td>
                
                <td className="p-4 align-middle text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">
                      {formatCurrency(deal.valuation, deal.currency)}
                    </span>
                  </div>
                </td>
                
                <td className="p-4 align-middle text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="font-medium">
                      {formatScore(deal.overall_score)}
                    </span>
                    {deal.rag_status && (
                      <Badge variant={getRAGBadgeVariant(deal.rag_status)} className="text-xs">
                        {deal.rag_status.charAt(0).toUpperCase() + deal.rag_status.slice(1)}
                      </Badge>
                    )}
                  </div>
                </td>
                
                <td className="p-4 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center">
                    <Switch
                      checked={deal.auto_analysis_enabled !== false}
                      onCheckedChange={(checked) => handleToggleAutoAnalysis(deal.id, checked)}
                      disabled={togglingAnalysis.has(deal.id)}
                      className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-muted"
                    />
                  </div>
                </td>
                
                <td className="p-4 align-middle">
                  {deal.location ? (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{deal.location}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                
                <td className="p-4 align-middle">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {format(new Date(deal.updated_at), 'MMM d')}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(deal.updated_at), 'h:mm a')}
                    </div>
                  </div>
                </td>
                
                <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDealClick(deal)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {onDealEdit && (
                        <DropdownMenuItem onClick={() => onDealEdit(deal)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Deal
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        
        {paginatedDeals.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No deals found</h3>
            <p className="text-sm">Get started by adding your first deal to the pipeline.</p>
          </div>
        )}
      </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-shrink-0 pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
};