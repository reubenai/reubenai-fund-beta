import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Table, 
  BarChart3,
  Download,
  Settings
} from 'lucide-react';

interface PipelineHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddDeal: () => void;
  currentView: 'kanban' | 'list' | 'table' | 'funnel';
  onViewChange: (view: 'kanban' | 'list' | 'table' | 'funnel') => void;
  totalDeals: number;
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
  currentView,
  onViewChange,
  totalDeals
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
          
          <Button onClick={onAddDeal} className="bg-brand-emerald hover:bg-brand-emerald-dark">
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
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

        {/* View Controls */}
        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex bg-white border border-slate-200 rounded-lg p-1">
            {Object.entries(viewIcons).map(([view, Icon]) => (
              <Button
                key={view}
                variant={currentView === view ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange(view as any)}
                className={`h-8 px-3 ${
                  currentView === view 
                    ? 'bg-brand-emerald text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          {/* Action Buttons */}
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};