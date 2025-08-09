import React, { useState, useCallback, useMemo } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { useOptimizedPipelineDeals, Deal } from '@/hooks/useOptimizedPipelineDeals';
import { EnhancedPipelineHeader } from './EnhancedPipelineHeader';
import { CleanKanbanView } from './CleanKanbanView';
import { EnhancedKanbanView } from './EnhancedKanbanView';
import { AddDealModal } from './AddDealModal';
import { BatchUploadModal } from './BatchUploadModal';
import { DealDetailsModal } from './DealDetailsModal';
import { DealSourcingModal } from './DealSourcingModal';
import { PipelineFilters } from './PipelineFilters';
import { useToast } from '@/hooks/use-toast';
import { useFund } from '@/contexts/FundContext';
import { usePermissions } from '@/hooks/usePermissions';

interface KanbanBoardState {
  currentView: 'kanban' | 'list';
  showFilters: boolean;
  filters: {
    status?: string;
    ragStatus?: string;
    industry?: string;
    dealSizeMin?: number;
    dealSizeMax?: number;
    scoreMin?: number;
    scoreMax?: number;
  };
  selectedDeal: Deal | null;
  showAddDeal: boolean;
  showBatchUpload: boolean;
  showSourceDeals: boolean;
}

interface KanbanBoardProps {
  fundId: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ fundId }) => {
  const {
    deals,
    stages,
    loading,
    searchQuery,
    setSearchQuery,
    moveDeal,
    addDeal,
    refreshDeals
  } = useOptimizedPipelineDeals(fundId);

  const { selectedFund } = useFund();
  const permissions = usePermissions();

  const [state, setState] = useState<KanbanBoardState>({
    currentView: 'kanban',
    showFilters: false,
    filters: {},
    selectedDeal: null,
    showAddDeal: false,
    showBatchUpload: false,
    showSourceDeals: false,
  });

  const { toast } = useToast();

  const updateState = useCallback((updates: Partial<KanbanBoardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    // Check permissions before allowing drag and drop
    if (!permissions.canMoveDealsBetweenStages) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to move deals between stages",
        variant: "destructive"
      });
      return;
    }

    const { destination, source, draggableId } = result;
    
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    await moveDeal(draggableId, source.droppableId, destination.droppableId);
  }, [moveDeal, permissions.canMoveDealsBetweenStages, toast]);

  const handleAddDeal = useCallback((stageId?: string) => {
    if (!permissions.canCreateDeals) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create deals",
        variant: "destructive"
      });
      return;
    }
    updateState({ showAddDeal: true });
  }, [updateState, permissions.canCreateDeals, toast]);

  const handleDealClick = useCallback((deal: Deal) => {
    updateState({ selectedDeal: deal });
  }, [updateState]);

  const handleStageEdit = useCallback((stageId: string, newTitle: string) => {
    // Edit stage functionality
    toast({
      title: "Stage Updated",
      description: `Stage renamed to "${newTitle}"`,
    });
  }, [toast]);

  const getTotalDeals = useCallback(() => {
    return Object.values(deals).reduce((total, stageDeals) => total + stageDeals.length, 0);
  }, [deals]);

  // Filter deals based on current filters
  const filteredDeals = useMemo(() => {
    if (!state.filters || Object.keys(state.filters).length === 0) {
      return deals;
    }

    const { filters } = state;
    const filtered: Record<string, Deal[]> = {};

    Object.entries(deals).forEach(([stageKey, stageDeals]) => {
      filtered[stageKey] = stageDeals.filter((deal) => {
        // Status filter
        if (filters.status && deal.status !== filters.status) {
          return false;
        }

        // Investment readiness filter (RAG status mapped to our terminology)
        if (filters.ragStatus) {
          const dealRAGStatus = deal.rag_status?.toLowerCase();
          // Map our new filter values to existing rag_status field values  
          const filterMapping: Record<string, string[]> = {
            'exciting': ['green', 'exciting'],
            'promising': ['amber', 'promising'], 
            'needs_development': ['red', 'needs_development']
          };
          const allowedStatuses = filterMapping[filters.ragStatus] || [];
          if (!dealRAGStatus || !allowedStatuses.includes(dealRAGStatus)) {
            return false;
          }
        }

        // Industry filter
        if (filters.industry && deal.industry && !deal.industry.toLowerCase().includes(filters.industry.toLowerCase())) {
          return false;
        }

        // Deal size range filter
        if (filters.dealSizeMin && (!deal.deal_size || deal.deal_size < filters.dealSizeMin)) {
          return false;
        }
        if (filters.dealSizeMax && (!deal.deal_size || deal.deal_size > filters.dealSizeMax)) {
          return false;
        }

        // Score range filter
        if (filters.scoreMin && (!deal.overall_score || deal.overall_score < filters.scoreMin)) {
          return false;
        }
        if (filters.scoreMax && (!deal.overall_score || deal.overall_score > filters.scoreMax)) {
          return false;
        }

        return true;
      });
    });

    return filtered;
  }, [deals, state.filters]);

  if (loading || stages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="flex gap-6 overflow-x-auto">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-shrink-0 w-80 h-96 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        {stages.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading pipeline stages...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      <div className="border-b bg-white">
        <div className="px-8 py-6 space-y-4">
          <EnhancedPipelineHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddDeal={permissions.canCreateDeals ? () => updateState({ showAddDeal: true }) : undefined}
            onBatchUpload={permissions.canBatchUpload ? () => updateState({ showBatchUpload: true }) : undefined}
            onSourceDeals={permissions.canUseAISourcing ? () => updateState({ showSourceDeals: true }) : undefined}
            totalDeals={getTotalDeals()}
            showFilters={state.showFilters}
            onToggleFilters={() => updateState({ showFilters: !state.showFilters })}
          />
          
          <PipelineFilters
            filters={state.filters}
            onFiltersChange={(filters) => updateState({ filters })}
            onClearFilters={() => updateState({ filters: {} })}
            isVisible={state.showFilters}
          />
        </div>
      </div>

      <div className="flex-1 bg-gray-50 overflow-hidden">
        {state.currentView === 'kanban' && (
          <div className="h-full p-8">
            <CleanKanbanView
              deals={filteredDeals}
              stages={stages}
              onDragEnd={permissions.canMoveDealsBetweenStages ? handleDragEnd : undefined}
              onDealClick={handleDealClick}
              onStageEdit={undefined} // Stage editing disabled platform-wide
              onStageDelete={undefined} // Stage deletion disabled platform-wide
              onAddDeal={permissions.canCreateDeals ? handleAddDeal : undefined}
            />
          </div>
        )}

        {state.currentView === 'list' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-muted-foreground">List view coming soon...</p>
            </div>
          </div>
        )}
      </div>

      <AddDealModal
        open={state.showAddDeal}
        onClose={() => updateState({ showAddDeal: false })}
        onAddDeal={addDeal}
      />

      <BatchUploadModal
        open={state.showBatchUpload}
        onClose={() => updateState({ showBatchUpload: false })}
        fundId={fundId}
        onUploadComplete={refreshDeals}
      />

      <DealDetailsModal
        deal={state.selectedDeal}
        open={!!state.selectedDeal}
        onOpenChange={(open) => !open && updateState({ selectedDeal: null })}
        onDealUpdated={refreshDeals}
        onDealDeleted={() => {
          refreshDeals();
          updateState({ selectedDeal: null });
        }}
      />

      <DealSourcingModal
        open={state.showSourceDeals}
        onClose={() => updateState({ showSourceDeals: false })}
        fundId={fundId}
        fundName={selectedFund?.name || "Selected Fund"}
      />
    </div>
  );
};