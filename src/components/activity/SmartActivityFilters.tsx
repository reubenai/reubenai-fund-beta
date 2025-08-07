import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Filter, 
  Zap, 
  Clock,
  Target,
  Users,
  TrendingUp,
  X,
  Save,
  Lightbulb,
  Star
} from 'lucide-react';
import { useSmartActivityFilters } from '@/hooks/useSmartActivityFilters';
import { ActivityEvent } from '@/services/ActivityService';

interface SmartActivityFiltersProps {
  activities: ActivityEvent[];
  onFilteredActivitiesChange: (activities: ActivityEvent[]) => void;
}

export function SmartActivityFilters({ 
  activities, 
  onFilteredActivitiesChange 
}: SmartActivityFiltersProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');

  const {
    smartFilters,
    filteredActivities,
    activeFilters,
    savedFilters,
    suggestions,
    toggleSmartFilter,
    clearAllFilters,
    saveCurrentFilter,
    applySavedFilter
  } = useSmartActivityFilters(activities);

  // Notify parent component of filtered activities
  React.useEffect(() => {
    onFilteredActivitiesChange(filteredActivities);
  }, [filteredActivities, onFilteredActivitiesChange]);

  const getFilterIcon = (filterId: string) => {
    switch (filterId) {
      case 'high-relevance': return Star;
      case 'recent-critical': return Clock;
      case 'deal-pipeline': return Target;
      case 'team-activities': return Users;
      case 'activity-spikes': return TrendingUp;
      default: return Filter;
    }
  };

  const handleSaveFilter = () => {
    if (newFilterName.trim()) {
      // In a real implementation, you'd collect current filter state
      const filterConfig = {
        timeRange: '7d',
        activityTypes: [],
        priorities: [],
        search: '',
        relevanceThreshold: 50
      };
      
      saveCurrentFilter(newFilterName.trim(), filterConfig);
      setNewFilterName('');
      setShowSaveDialog(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Smart Filters
          {activeFilters.size > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilters.size} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              Suggestions
            </div>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="text-sm p-2 bg-primary/5 rounded-lg border border-primary/10">
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Smart Filters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Smart Filters
            </h3>
            {activeFilters.size > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid gap-2">
            {smartFilters.map((filter) => {
              const Icon = getFilterIcon(filter.id);
              const isActive = filter.isActive;
              
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleSmartFilter(filter.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isActive 
                      ? 'bg-primary/10 border-primary/20 text-primary' 
                      : 'bg-card hover:bg-muted/20 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium text-sm">{filter.name}</p>
                        <p className="text-xs text-muted-foreground">{filter.description}</p>
                      </div>
                    </div>
                    <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                      {filter.count}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Saved Filters
            </h3>
            <div className="grid gap-2">
              {savedFilters.slice(0, 3).map((savedFilter) => (
                <button
                  key={savedFilter.id}
                  onClick={() => applySavedFilter(savedFilter)}
                  className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{savedFilter.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {savedFilter.isDefault ? 'Default' : 'Custom'} filter
                      </p>
                    </div>
                    <Filter className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Save Current Filter */}
        <div className="pt-4 border-t">
          {!showSaveDialog ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSaveDialog(true)}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Current Filter
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Filter name..."
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveFilter} disabled={!newFilterName.trim()}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Results Summary */}
        {activeFilters.size > 0 && (
          <div className="pt-4 border-t">
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <p className="text-sm font-medium">
                Showing {filteredActivities.length} of {activities.length} activities
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeFilters.size} filter{activeFilters.size === 1 ? '' : 's'} applied
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}