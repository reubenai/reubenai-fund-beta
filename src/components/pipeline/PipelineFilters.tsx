import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface Filters {
  status?: string;
  ragStatus?: string;
  industry?: string;
  currentRoundSizeMin?: number;
  currentRoundSizeMax?: number;
  scoreMin?: number;
  scoreMax?: number;
}

interface PipelineFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
  isVisible: boolean;
}

export const PipelineFilters: React.FC<PipelineFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  isVisible
}) => {
  if (!isVisible) return null;

  const updateFilter = (key: keyof Filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== '').length;
  };

  const hasActiveFilters = getActiveFilterCount() > 0;

  return (
    <Card className="border-0 shadow-sm bg-muted/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">Filters</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Status</Label>
            <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any status</SelectItem>
                <SelectItem value="sourced">Sourced</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="investment_committee">Investment Committee</SelectItem>
                <SelectItem value="due_diligence">Due Diligence</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* RAG Status Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Investment Readiness</Label>
            <Select value={filters.ragStatus || 'all'} onValueChange={(value) => updateFilter('ragStatus', value === 'all' ? undefined : value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Any readiness" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any readiness</SelectItem>
                <SelectItem value="exciting">Exciting</SelectItem>
                <SelectItem value="promising">Promising</SelectItem>
                <SelectItem value="needs_development">Needs Development</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Industry Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Industry</Label>
            <Input
              placeholder="Filter by industry"
              value={filters.industry || ''}
              onChange={(e) => updateFilter('industry', e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Score Range */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Score Range</Label>
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="Min"
                value={filters.scoreMin || ''}
                onChange={(e) => updateFilter('scoreMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className="h-8 text-xs"
                min="0"
                max="100"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.scoreMax || ''}
                onChange={(e) => updateFilter('scoreMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className="h-8 text-xs"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Round Size Range */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Current Round Size Range (USD)</Label>
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="Min amount"
                value={filters.currentRoundSizeMin || ''}
                onChange={(e) => updateFilter('currentRoundSizeMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className="h-8 text-xs"
                min="0"
              />
              <Input
                type="number"
                placeholder="Max amount"
                value={filters.currentRoundSizeMax || ''}
                onChange={(e) => updateFilter('currentRoundSizeMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className="h-8 text-xs"
                min="0"
              />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="pt-3 border-t">
            <div className="flex flex-wrap gap-2">
              {filters.status && (
                <Badge variant="outline" className="text-xs">
                  Status: {filters.status}
                  <button
                    onClick={() => updateFilter('status', undefined)}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.ragStatus && (
                <Badge variant="outline" className="text-xs">
                  Readiness: {filters.ragStatus === 'needs_development' ? 'Needs Development' : 
                    filters.ragStatus.charAt(0).toUpperCase() + filters.ragStatus.slice(1)}
                  <button
                    onClick={() => updateFilter('ragStatus', undefined)}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.industry && (
                <Badge variant="outline" className="text-xs">
                  Industry: {filters.industry}
                  <button
                    onClick={() => updateFilter('industry', undefined)}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(filters.scoreMin || filters.scoreMax) && (
                <Badge variant="outline" className="text-xs">
                  Score: {filters.scoreMin || 0}-{filters.scoreMax || 100}
                  <button
                    onClick={() => {
                      updateFilter('scoreMin', undefined);
                      updateFilter('scoreMax', undefined);
                    }}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(filters.currentRoundSizeMin || filters.currentRoundSizeMax) && (
                <Badge variant="outline" className="text-xs">
                  Round Size: ${filters.currentRoundSizeMin || 0}M-${filters.currentRoundSizeMax || '∞'}M
                  <button
                    onClick={() => {
                      updateFilter('currentRoundSizeMin', undefined);
                      updateFilter('currentRoundSizeMax', undefined);
                    }}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};