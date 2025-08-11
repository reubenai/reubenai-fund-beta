import React, { useState, useMemo } from 'react';
import { Deal } from '@/hooks/usePipelineDeals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EnhancedDealTableViewProps {
  deals: Record<string, Deal[]>;
  onDealClick: (deal: Deal) => void;
  onStageChange?: (dealId: string, fromStage: string, toStage: string) => void;
  stages: Array<{ id: string; name: string; color: string }>;
  loading?: boolean;
}

type SortField = 'company_name' | 'industry' | 'deal_size' | 'overall_score' | 'updated_at' | 'status';
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

export const EnhancedDealTableView: React.FC<EnhancedDealTableViewProps> = ({
  deals,
  onDealClick,
  onStageChange,
  stages,
  loading = false
}) => {
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());

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
      } else if (['deal_size', 'overall_score'].includes(sortField)) {
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
      {/* Table Container with Scroll */}
      <div className="flex-1 border border-border rounded-lg bg-card overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="w-12 sticky left-0 bg-card z-20">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDeals(new Set(sortedDeals.map(d => d.id)));
                    } else {
                      setSelectedDeals(new Set());
                    }
                  }}
                />
              </TableHead>
              
              <TableHead 
                className="sticky left-12 bg-card z-20 cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[200px]"
                onClick={() => handleSort('company_name')}
              >
                <div className="flex items-center">
                  Company
                  {getSortIcon('company_name')}
                </div>
              </TableHead>
              
              <TableHead 
                className="cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[100px]"
                onClick={() => handleSort('industry')}
              >
                <div className="flex items-center">
                  Industry
                  {getSortIcon('industry')}
                </div>
              </TableHead>
              
              <TableHead 
                className="cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[100px]"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Stage
                  {getSortIcon('status')}
                </div>
              </TableHead>
              
              <TableHead 
                className="cursor-pointer select-none hover:bg-muted/50 transition-colors text-right min-w-[120px]"
                onClick={() => handleSort('deal_size')}
              >
                <div className="flex items-center justify-end">
                  Deal Size
                  {getSortIcon('deal_size')}
                </div>
              </TableHead>
              
              <TableHead 
                className="cursor-pointer select-none hover:bg-muted/50 transition-colors text-center min-w-[120px]"
                onClick={() => handleSort('overall_score')}
              >
                <div className="flex items-center justify-center">
                  ReubenAI Score
                  {getSortIcon('overall_score')}
                </div>
              </TableHead>
              
              <TableHead className="min-w-[120px]">Location</TableHead>
              
              <TableHead 
                className="cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[140px]"
                onClick={() => handleSort('updated_at')}
              >
                <div className="flex items-center">
                  Last Activity
                  {getSortIcon('updated_at')}
                </div>
              </TableHead>
              
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {sortedDeals.map((deal) => (
              <TableRow 
                key={deal.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border"
                onClick={() => onDealClick(deal)}
              >
                <TableCell className="sticky left-0 bg-card z-20" onClick={(e) => e.stopPropagation()}>
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
                </TableCell>
                
                <TableCell className="sticky left-12 bg-card z-20 min-w-[200px]">
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
                </TableCell>
                
                <TableCell>
                  {deal.industry ? (
                    <Badge variant="outline" className="text-xs">
                      {deal.industry}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                
                <TableCell>
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
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="space-y-1">
                    <div className="flex items-center justify-end space-x-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {formatCurrency(deal.deal_size, deal.currency)}
                      </span>
                    </div>
                    {deal.valuation && (
                      <div className="text-xs text-muted-foreground">
                        Val: {formatCurrency(deal.valuation, deal.currency)}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Badge variant={getRAGBadgeVariant(deal.rag_status)}>
                      {formatScore(deal.overall_score)}
                    </Badge>
                    {deal.rag_confidence && (
                      <div className="text-xs text-muted-foreground">
                        {deal.rag_confidence}% conf
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  {deal.location ? (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{deal.location}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                
                <TableCell>
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
                </TableCell>
                
                <TableCell onClick={(e) => e.stopPropagation()}>
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
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Deal
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Zap className="mr-2 h-4 w-4" />
                        Trigger Analysis
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {sortedDeals.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No deals found</h3>
            <p className="text-sm">Get started by adding your first deal to the pipeline.</p>
          </div>
        )}
      </div>
    </div>
  );
};