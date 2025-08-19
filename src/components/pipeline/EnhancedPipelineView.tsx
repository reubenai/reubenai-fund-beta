import React, { useState, useCallback, useMemo } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { usePipelineDeals, Deal } from '@/hooks/usePipelineDeals';
import { PipelineHeader } from './PipelineHeader';
import { CleanKanbanView } from './CleanKanbanView';
import { EnhancedDealTableView } from './EnhancedDealTableView';
import { AddDealModal } from './AddDealModal';
import { BatchUploadModal } from './BatchUploadModal';
import { DealDetailsModal } from './DealDetailsModal';
import { EditDealModal } from './EditDealModal';
import { DealSourcingModal } from './DealSourcingModal';
import { PipelineFilters } from './PipelineFilters';
import { useToast } from '@/hooks/use-toast';
import { useFund } from '@/contexts/FundContext';
import { usePermissions } from '@/hooks/usePermissions';

interface PipelineViewState {
  currentView: 'kanban' | 'table' | 'list' | 'funnel';
  viewDensity: 'compact' | 'comfortable' | 'detailed';
  showFilters: boolean;
  filters: {
    status?: string;
    ragStatus?: string;
    industry?: string[];
    primaryIndustry?: string[];
    specializedSectors?: string[];
    currentRoundSizeMin?: number;
    currentRoundSizeMax?: number;
    scoreMin?: number;
    scoreMax?: number;
  };
  selectedDeal: Deal | null;
  editDeal: Deal | null;
  showAddDeal: boolean;
  showBatchUpload: boolean;
  showSourceDeals: boolean;
}

interface EnhancedPipelineViewProps {
  fundId: string;
}

export const EnhancedPipelineView: React.FC<EnhancedPipelineViewProps> = ({ fundId }) => {
  const {
    deals,
    stages,
    loading,
    searchQuery,
    setSearchQuery,
    moveDeal,
    addDeal,
    refreshDeals,
    forceRefresh
  } = usePipelineDeals(fundId);

  const { selectedFund } = useFund();
  const permissions = usePermissions();
  const { toast } = useToast();

  const [state, setState] = useState<PipelineViewState>({
    currentView: 'table', // Only table view available
    viewDensity: 'comfortable',
    showFilters: false,
    filters: {},
    selectedDeal: null,
    editDeal: null,
    showAddDeal: false,
    showBatchUpload: false,
    showSourceDeals: false,
  });

  const updateState = useCallback((updates: Partial<PipelineViewState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleDragEnd = useCallback(async (result: DropResult) => {
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

  const handleAddDeal = useCallback(() => {
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

  const handleDealEdit = useCallback((deal: Deal) => {
    updateState({ editDeal: deal });
  }, [updateState]);

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

        // Investment readiness filter (RAG status)
        if (filters.ragStatus) {
          const dealRAGStatus = deal.rag_status?.toLowerCase();
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

        // Industry filter (using existing industry field for now)
        if (filters.primaryIndustry?.length && deal.industry) {
          const dealIndustry = deal.industry.toLowerCase();
          const hasMatch = filters.primaryIndustry.some(fi => dealIndustry.includes(fi.toLowerCase()));
          if (!hasMatch) return false;
        }

        // Current round size range filter
        if (filters.currentRoundSizeMin && (!deal.current_round_size || deal.current_round_size < filters.currentRoundSizeMin)) {
          return false;
        }
        if (filters.currentRoundSizeMax && (!deal.current_round_size || deal.current_round_size > filters.currentRoundSizeMax)) {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="flex gap-6 overflow-x-auto">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-shrink-0 w-80 h-96 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      <div className="border-b border-border bg-card">
        <div className="px-8 py-6 space-y-4">
          <PipelineHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddDeal={handleAddDeal}
            onBatchUpload={permissions.canBatchUpload ? () => updateState({ showBatchUpload: true }) : () => {}}
            onDealSourcing={undefined}
            currentView={state.currentView}
            onViewChange={() => {}} // Disabled - only table view
            viewDensity={state.viewDensity}
            onDensityChange={() => {}} // Disabled for now
            totalDeals={getTotalDeals()}
            showFilters={state.showFilters}
            onToggleFilters={() => updateState({ showFilters: !state.showFilters })}
            onRefresh={forceRefresh}
          />
          
          <PipelineFilters
            filters={state.filters}
            onFiltersChange={(filters) => updateState({ filters })}
            onClearFilters={() => updateState({ filters: {} })}
            isVisible={state.showFilters}
          />
        </div>
      </div>

      <div className="flex-1 bg-background overflow-hidden">
        {/* Only Table View Available */}
        <div className="h-full p-8">
          <EnhancedDealTableView
            deals={filteredDeals}
            stages={stages}
            onDealClick={handleDealClick}
            onDealEdit={handleDealEdit}
            onStageChange={permissions.canMoveDealsBetweenStages ? moveDeal : undefined}
            loading={loading}
          />
        </div>
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

      <EditDealModal
        deal={state.editDeal}
        open={!!state.editDeal}
        onClose={() => updateState({ editDeal: null })}
        onUpdateComplete={() => {
          refreshDeals();
          updateState({ editDeal: null });
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