import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Upload,
  Filter,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EnhancedPipelineHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddDeal: () => void;
  onBatchUpload: () => void;
  onSourceDeals?: () => void;
  totalDeals: number;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

export function EnhancedPipelineHeader({
  searchQuery,
  onSearchChange,
  onAddDeal,
  onBatchUpload,
  onSourceDeals,
  totalDeals,
  showFilters,
  onToggleFilters,
}: EnhancedPipelineHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Deal Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Manage your deal flow and track opportunities
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBatchUpload} className="gap-2">
            <Upload className="h-4 w-4" />
            Batch Upload
          </Button>
          
          <Button variant="outline" onClick={onAddDeal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Deal
          </Button>
          
          <Button 
            disabled
            variant="outline"
            className="gap-2 opacity-50 cursor-not-allowed"
          >
            <Search className="h-4 w-4" />
            Source Deals
            <Badge variant="secondary" className="ml-2 text-xs">Coming Soon</Badge>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals by company, industry, or location..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className={`gap-2 ${showFilters ? 'bg-muted' : ''}`}
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>
    </div>
  );
}