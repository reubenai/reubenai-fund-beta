import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Brain, 
  MoveRight, 
  Archive, 
  Star, 
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';
import { Deal } from '@/hooks/usePipelineDeals';
import { useStrategyThresholds } from '@/hooks/useStrategyThresholds';

interface EnhancedDealBatchOperationsProps {
  deals: Deal[];
  selectedDeals: string[];
  onSelectionChange: (dealIds: string[]) => void;
  onBulkAction: (action: string, dealIds: string[], metadata?: any) => Promise<void>;
  stages: any[];
}

export const EnhancedDealBatchOperations: React.FC<EnhancedDealBatchOperationsProps> = ({
  deals,
  selectedDeals,
  onSelectionChange,
  onBulkAction,
  stages
}) => {
  const { toast } = useToast();
  const { getRAGCategory } = useStrategyThresholds();
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterRAG, setFilterRAG] = useState<string | null>(null);

  const selectedDealObjects = deals.filter(deal => selectedDeals.includes(deal.id));
  const hasSelection = selectedDeals.length > 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(deals.map(deal => deal.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleBulkAnalysis = async () => {
    if (!hasSelection) return;
    
    setIsProcessing(true);
    try {
      await onBulkAction('bulk_analysis', selectedDeals);
      toast({
        title: "Analysis Triggered",
        description: `AI analysis started for ${selectedDeals.length} deals.`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to trigger bulk analysis.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkMove = async (stageId: string) => {
    if (!hasSelection) return;
    
    setIsProcessing(true);
    try {
      await onBulkAction('move_to_stage', selectedDeals, { stageId });
      const stageName = stages.find(s => s.id === stageId)?.name || 'stage';
      toast({
        title: "Deals Moved",
        description: `${selectedDeals.length} deals moved to ${stageName}.`,
      });
      onSelectionChange([]);
    } catch (error) {
      toast({
        title: "Move Failed",
        description: "Failed to move deals.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkArchive = async () => {
    if (!hasSelection) return;
    
    setIsProcessing(true);
    try {
      await onBulkAction('archive', selectedDeals);
      toast({
        title: "Deals Archived",
        description: `${selectedDeals.length} deals archived.`,
      });
      onSelectionChange([]);
    } catch (error) {
      toast({
        title: "Archive Failed",
        description: "Failed to archive deals.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const ragStats = selectedDealObjects.reduce((acc, deal) => {
    if (deal.overall_score) {
      const rag = getRAGCategory(deal.overall_score);
      acc[rag.level] = (acc[rag.level] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Operations
            {hasSelection && (
              <Badge variant="secondary">
                {selectedDeals.length} selected
              </Badge>
            )}
          </div>
          {hasSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={hasSelection && selectedDeals.length === deals.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm">Select All ({deals.length})</span>
          </div>
          
          {/* RAG Filter */}
          <Select value={filterRAG || undefined} onValueChange={setFilterRAG}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by RAG" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exciting">Exciting</SelectItem>
              <SelectItem value="promising">Promising</SelectItem>
              <SelectItem value="needs_development">Needs Development</SelectItem>
              <SelectItem value="not_aligned">Not Aligned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selection Summary */}
        {hasSelection && (
          <div className="p-3 bg-muted rounded space-y-2">
            <h4 className="font-medium text-sm">Selection Summary</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ragStats).map(([level, count]) => {
                const rag = getRAGCategory(80); // Just for color reference
                const colors = {
                  exciting: 'bg-emerald-100 text-emerald-700',
                  promising: 'bg-amber-100 text-amber-700', 
                  needs_development: 'bg-orange-100 text-orange-700',
                  not_aligned: 'bg-red-100 text-red-700'
                };
                return (
                  <Badge key={level} variant="outline" className={colors[level as keyof typeof colors]}>
                    {level.replace('_', ' ')}: {count}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Bulk Actions</h4>
          
          <div className="grid grid-cols-1 gap-2">
            {/* AI Analysis */}
            <Button
              variant="outline"
              className="justify-start"
              onClick={handleBulkAnalysis}
              disabled={!hasSelection || isProcessing}
            >
              <Brain className="w-4 h-4 mr-2" />
              Trigger AI Analysis ({selectedDeals.length})
            </Button>

            {/* Move to Stage */}
            <div className="flex gap-2">
              <Select onValueChange={handleBulkMove} disabled={!hasSelection || isProcessing}>
                <SelectTrigger>
                  <SelectValue placeholder="Move to stage..." />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <div className="flex items-center gap-2">
                        <MoveRight className="w-4 h-4" />
                        {stage.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Archive */}
            <Button
              variant="outline"
              className="justify-start text-red-600"
              onClick={handleBulkArchive}
              disabled={!hasSelection || isProcessing}
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive Selected ({selectedDeals.length})
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Quick Select</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const excitingDeals = deals
                  .filter(deal => deal.overall_score && getRAGCategory(deal.overall_score).level === 'exciting')
                  .map(deal => deal.id);
                onSelectionChange(excitingDeals);
              }}
            >
              <Star className="w-3 h-3 mr-1" />
              Exciting Deals
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const needsAnalysis = deals
                  .filter(deal => !deal.overall_score)
                  .map(deal => deal.id);
                onSelectionChange(needsAnalysis);
              }}
            >
              <Brain className="w-3 h-3 mr-1" />
              Needs Analysis
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};