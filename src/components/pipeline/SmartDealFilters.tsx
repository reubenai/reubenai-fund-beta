import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Filter, 
  Brain, 
  MessageSquare, 
  TrendingUp,
  X,
  Sliders
} from 'lucide-react';
import { Deal } from '@/hooks/useOptimizedPipelineDeals';

interface SmartDealFiltersProps {
  deals: Deal[];
  onFilterChange: (filters: DealFilters) => void;
  className?: string;
}

export interface DealFilters {
  minOverallScore?: number;
  maxOverallScore?: number;
  minRubricScore?: number;
  maxRubricScore?: number;
  analysisCompleteness?: number;
  notesSentiment?: ('positive' | 'neutral' | 'negative' | 'mixed')[];
  analysisStatus?: ('complete' | 'partial' | 'pending')[];
  fundTypeAlignment?: number;
  confidenceLevel?: ('high' | 'medium' | 'low')[];
  hasNotes?: boolean;
  hasDocuments?: boolean;
  recentlyAnalyzed?: boolean;
}

export const SmartDealFilters: React.FC<SmartDealFiltersProps> = ({
  deals,
  onFilterChange,
  className
}) => {
  const [filters, setFilters] = React.useState<DealFilters>({});
  const [isExpanded, setIsExpanded] = React.useState(false);

  const updateFilters = (newFilters: Partial<DealFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && 
      value !== null && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  };

  const getAnalysisStats = () => {
    const withAnalysis = deals.filter(d => d.enhanced_analysis).length;
    const withNotes = deals.filter(d => d.notes_count && d.notes_count > 0).length;
    const recentlyAnalyzed = deals.filter(d => 
      d.enhanced_analysis?.last_comprehensive_analysis &&
      new Date(d.enhanced_analysis.last_comprehensive_analysis).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;
    
    return { withAnalysis, withNotes, recentlyAnalyzed, total: deals.length };
  };

  const stats = getAnalysisStats();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">Smart Filters</CardTitle>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              <Sliders className="w-4 h-4 mr-1" />
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            {getActiveFilterCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            {stats.withAnalysis}/{stats.total} analyzed
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {stats.withNotes} with notes
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {stats.recentlyAnalyzed} recent
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Score Ranges */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Overall Score Range</label>
              <Slider
                value={[filters.minOverallScore || 0, filters.maxOverallScore || 100]}
                onValueChange={([min, max]) => updateFilters({ minOverallScore: min, maxOverallScore: max })}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{filters.minOverallScore || 0}%</span>
                <span>{filters.maxOverallScore || 100}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Analysis Completeness</label>
              <Slider
                value={[filters.analysisCompleteness || 0]}
                onValueChange={([value]) => updateFilters({ analysisCompleteness: value })}
                max={100}
                step={10}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                Minimum {filters.analysisCompleteness || 0}% complete
              </div>
            </div>
          </div>

          {/* Sentiment Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes Sentiment</label>
            <div className="flex flex-wrap gap-2">
              {(['positive', 'neutral', 'negative', 'mixed'] as const).map(sentiment => (
                <div key={sentiment} className="flex items-center space-x-2">
                  <Checkbox
                    id={sentiment}
                    checked={filters.notesSentiment?.includes(sentiment) || false}
                    onCheckedChange={(checked) => {
                      const current = filters.notesSentiment || [];
                      const updated = checked 
                        ? [...current, sentiment]
                        : current.filter(s => s !== sentiment);
                      updateFilters({ notesSentiment: updated });
                    }}
                  />
                  <label htmlFor={sentiment} className="text-sm capitalize">
                    {sentiment}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Analysis Status</label>
            <div className="flex flex-wrap gap-2">
              {(['complete', 'partial', 'pending'] as const).map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={status}
                    checked={filters.analysisStatus?.includes(status) || false}
                    onCheckedChange={(checked) => {
                      const current = filters.analysisStatus || [];
                      const updated = checked 
                        ? [...current, status]
                        : current.filter(s => s !== status);
                      updateFilters({ analysisStatus: updated });
                    }}
                  />
                  <label htmlFor={status} className="text-sm capitalize">
                    {status}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Filters</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasNotes"
                  checked={filters.hasNotes || false}
                  onCheckedChange={(checked) => updateFilters({ hasNotes: checked as boolean })}
                />
                <label htmlFor="hasNotes" className="text-sm">
                  Has team notes
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recentlyAnalyzed"
                  checked={filters.recentlyAnalyzed || false}
                  onCheckedChange={(checked) => updateFilters({ recentlyAnalyzed: checked as boolean })}
                />
                <label htmlFor="recentlyAnalyzed" className="text-sm">
                  Analyzed in last 7 days
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};