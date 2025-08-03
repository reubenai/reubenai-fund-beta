import React, { useState, useCallback, useMemo } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { usePipelineDeals, Deal } from '@/hooks/usePipelineDeals';
import { EnhancedPipelineHeader } from './EnhancedPipelineHeader';
import { CleanKanbanView } from './CleanKanbanView';
import { EnhancedKanbanView } from './EnhancedKanbanView';
import { AddDealModal } from './AddDealModal';
import { BatchUploadModal } from './BatchUploadModal';
import { DealDetailsModal } from './DealDetailsModal';
import { DealSourcingModal } from './DealSourcingModal';
import { useToast } from '@/hooks/use-toast';
import { useFund } from '@/contexts/FundContext';

interface KanbanBoardState {
  currentView: 'kanban' | 'list';
  showFilters: boolean;
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
  } = usePipelineDeals(fundId);

  const { selectedFund } = useFund();

  const [state, setState] = useState<KanbanBoardState>({
    currentView: 'kanban',
    showFilters: false,
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
    const { destination, source, draggableId } = result;
    
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    await moveDeal(draggableId, source.droppableId, destination.droppableId);
  }, [moveDeal]);

  const handleAddDeal = useCallback((stageId?: string) => {
    updateState({ showAddDeal: true });
  }, [updateState]);

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
    return deals; // Will add filtering logic later
  }, [deals]);

  if (loading) {
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
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      <div className="border-b bg-white">
        <div className="px-8 py-6">
          <EnhancedPipelineHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddDeal={() => updateState({ showAddDeal: true })}
            onBatchUpload={() => updateState({ showBatchUpload: true })}
            onSourceDeals={() => updateState({ showSourceDeals: true })}
            totalDeals={getTotalDeals()}
            showFilters={state.showFilters}
            onToggleFilters={() => updateState({ showFilters: !state.showFilters })}
          />
        </div>
      </div>

      <div className="flex-1 bg-gray-50 overflow-hidden">
        {state.currentView === 'kanban' && (
          <div className="h-full p-8">
            <CleanKanbanView
              deals={filteredDeals}
              stages={stages}
              onDragEnd={handleDragEnd}
              onDealClick={handleDealClick}
              onStageEdit={handleStageEdit}
              onStageDelete={(stageId) => {/* Delete stage functionality */}}
              onAddDeal={handleAddDeal}
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