import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Table, 
  BarChart3,
  Download,
  Settings,
  Upload,
  Zap,
  ChevronDown,
  RefreshCw,
  Database
} from 'lucide-react';

interface PipelineHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddDeal: () => void;
  onBatchUpload: () => void;
  onDealSourcing?: () => void;
  onIntegrateCRM?: () => void;
  currentView: 'kanban' | 'list' | 'table' | 'funnel';
  onViewChange: (view: 'kanban' | 'list' | 'table' | 'funnel') => void;
  viewDensity?: 'compact' | 'comfortable' | 'detailed';
  onDensityChange?: (density: 'compact' | 'comfortable' | 'detailed') => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  totalDeals: number;
  onRefresh?: () => void;
}

const viewIcons = {
  kanban: Grid3X3,
  list: List,
  table: Table,
  funnel: BarChart3
};

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onAddDeal,
  onBatchUpload,
  onDealSourcing,
  onIntegrateCRM,
  currentView,
  onViewChange,
  viewDensity = 'comfortable',
  onDensityChange,
  showFilters = false,
  onToggleFilters,
  totalDeals,
  onRefresh
}) => {
  return (
    <div className="space-y-4">
      {/* Title and Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deal Pipeline</h1>
          <p className="text-gray-600 mt-1">
            Manage and track investment opportunities
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-base py-1 px-3">
            {totalDeals} deals
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Deal
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onAddDeal}>
                <Plus className="w-4 h-4 mr-2" />
                Single Add
                <span className="ml-auto text-xs text-gray-500">Manual entry</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBatchUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Batch Upload
                <span className="ml-auto text-xs text-gray-500">CSV/Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDealSourcing}
                disabled={!onDealSourcing}
                className="opacity-50"
              >
                <Zap className="w-4 h-4 mr-2" />
                Deal Sourcing
                <span className="ml-auto text-xs text-gray-500">Coming soon</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onIntegrateCRM}>
                <Database className="w-4 h-4 mr-2" />
                Integrate CRM
                <span className="ml-auto text-xs text-gray-500">Connect your CRM</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Controls - Only Table View */}
        <div className="flex items-center gap-2">
          {/* Table View Only Badge */}
          <div className="flex bg-white border border-slate-200 rounded-lg p-1">
            <Button
              variant="default"
              size="sm"
              className="h-8 px-3 bg-emerald-600 text-white"
              disabled
            >
              <Table className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            variant="outline" 
            size="sm"
            onClick={onToggleFilters}
            className={showFilters ? 'bg-muted' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>

          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRefresh}
              title="Refresh deals data"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};