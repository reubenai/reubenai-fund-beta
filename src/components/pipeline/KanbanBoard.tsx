import React, { useState, useCallback, useMemo } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { usePipelineDeals, Deal } from '@/hooks/usePipelineDeals';
import { PipelineHeader } from './PipelineHeader';
import { EnhancedKanbanView } from './EnhancedKanbanView';
import { AddDealModal } from './AddDealModal';
import { BatchUploadModal } from './BatchUploadModal';
import { DealDetailsModal } from './DealDetailsModal';
import { useToast } from '@/hooks/use-toast';

interface KanbanBoardState {
  currentView: 'kanban' | 'list' | 'table' | 'funnel';
  viewDensity: 'compact' | 'comfortable' | 'detailed';
  showFilters: boolean;
  selectedDeal: Deal | null;
  showAddDeal: boolean;
  showBatchUpload: boolean;
  showDealSourcing: boolean;
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

  const [state, setState] = useState<KanbanBoardState>({
    currentView: 'kanban',
    viewDensity: 'comfortable',
    showFilters: false,
    selectedDeal: null,
    showAddDeal: false,
    showBatchUpload: false,
    showDealSourcing: false
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
    console.log('Edit stage:', stageId, newTitle);
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
    <div className="space-y-6">
      <PipelineHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddDeal={() => updateState({ showAddDeal: true })}
        onBatchUpload={() => updateState({ showBatchUpload: true })}
        onDealSourcing={() => updateState({ showDealSourcing: true })}
        currentView={state.currentView}
        onViewChange={(view) => updateState({ currentView: view })}
        viewDensity={state.viewDensity}
        onDensityChange={(density) => updateState({ viewDensity: density })}
        showFilters={state.showFilters}
        onToggleFilters={() => updateState({ showFilters: !state.showFilters })}
        totalDeals={getTotalDeals()}
      />

      {state.currentView === 'kanban' && (
        <EnhancedKanbanView
          deals={filteredDeals}
          stages={stages}
          onDragEnd={handleDragEnd}
          onDealClick={handleDealClick}
          onStageEdit={handleStageEdit}
          onAddDeal={handleAddDeal}
          viewDensity={state.viewDensity}
        />
      )}

      {state.currentView === 'list' && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-gray-500">List view coming soon...</p>
        </div>
      )}

      {state.currentView === 'table' && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-gray-500">Table view coming soon...</p>
        </div>
      )}

      {state.currentView === 'funnel' && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-gray-500">Funnel view coming soon...</p>
        </div>
      )}

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
    </div>
  );
};