import React, { useState, useCallback } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { usePipelineDeals, Deal } from '@/hooks/usePipelineDeals';
import { PipelineHeader } from '@/components/pipeline/PipelineHeader';
import { KanbanView } from '@/components/pipeline/KanbanView';
import { AddDealModal } from '@/components/pipeline/AddDealModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Mock fund ID - in a real app, this would come from context or props
const MOCK_FUND_ID = '550e8400-e29b-41d4-a716-446655440000';

export default function Pipeline() {
  const {
    deals,
    stages,
    loading,
    searchQuery,
    setSearchQuery,
    moveDeal,
    addDeal,
    refreshDeals
  } = usePipelineDeals(MOCK_FUND_ID);

  const [currentView, setCurrentView] = useState<'kanban' | 'list' | 'table' | 'funnel'>('kanban');
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>();
  const { toast } = useToast();

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
    setSelectedStage(stageId);
    setShowAddDealModal(true);
  }, []);

  const handleDealClick = useCallback((deal: Deal) => {
    // TODO: Open deal detail modal
    console.log('Deal clicked:', deal);
    toast({
      title: "Deal Details",
      description: `Clicked on ${deal.company_name}`,
    });
  }, [toast]);

  const handleStageEdit = useCallback((stageId: string, newTitle: string) => {
    // TODO: Implement stage editing
    console.log('Edit stage:', stageId, newTitle);
    toast({
      title: "Stage Updated",
      description: `Stage renamed to "${newTitle}"`,
    });
  }, [toast]);

  const getTotalDeals = () => {
    return Object.values(deals).reduce((total, stageDeals) => total + stageDeals.length, 0);
  };

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
        onAddDeal={() => handleAddDeal()}
        currentView={currentView}
        onViewChange={setCurrentView}
        totalDeals={getTotalDeals()}
      />

      {currentView === 'kanban' && (
        <KanbanView
          deals={deals}
          stages={stages}
          onDragEnd={handleDragEnd}
          onDealClick={handleDealClick}
          onStageEdit={handleStageEdit}
          onAddDeal={handleAddDeal}
        />
      )}

      {currentView === 'list' && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-gray-500">List view coming soon...</p>
        </div>
      )}

      {currentView === 'table' && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-gray-500">Table view coming soon...</p>
        </div>
      )}

      {currentView === 'funnel' && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-gray-500">Funnel view coming soon...</p>
        </div>
      )}

      <AddDealModal
        open={showAddDealModal}
        onClose={() => setShowAddDealModal(false)}
        onAddDeal={addDeal}
        initialStage={selectedStage}
      />
    </div>
  );
}