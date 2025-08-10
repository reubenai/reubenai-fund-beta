import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Deal, PipelineStage } from '@/hooks/usePipelineDeals';
import { EnhancedKanbanColumn } from './EnhancedKanbanColumn';
import { ProfessionalEmptyState } from './ProfessionalEmptyState';

interface CleanKanbanViewProps {
  deals: Record<string, Deal[]>;
  stages: PipelineStage[];
  onDragEnd: (result: DropResult) => void;
  onDealClick?: (deal: Deal) => void;
  onStageEdit?: (stageId: string, newTitle: string) => void;
  onStageDelete?: (stageId: string) => void;
  onAddDeal?: (stageId?: string) => void;
  onBatchUpload?: () => void;
  fundName?: string;
}

export const CleanKanbanView: React.FC<CleanKanbanViewProps> = ({
  deals,
  stages,
  onDragEnd,
  onDealClick,
  onStageEdit,
  onStageDelete,
  onAddDeal,
  onBatchUpload,
  fundName,
}) => {
  // CRITICAL DEBUG: Log what we're receiving
  console.log('🎯 [CleanKanbanView] CRITICAL DEBUG - Received stages:', stages.length, 'stage names:', stages.map(s => s.name));
  console.log('🎯 [CleanKanbanView] CRITICAL DEBUG - Received deals:', Object.keys(deals).length, 'deal keys:', Object.keys(deals));

  const totalDeals = Object.values(deals).reduce((sum, stageDeals) => sum + stageDeals.length, 0);
  
  if (stages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <h3 className="text-lg font-semibold text-muted-foreground">Loading Pipeline Stages...</h3>
          <p className="text-sm text-muted-foreground">Setting up your deal pipeline</p>
          <p className="text-xs text-muted-foreground/70">If this persists, check console for debugging info</p>
        </div>
      </div>
    );
  }

  // CRITICAL: Force render stages even if deals are empty
  console.log('🎯 [CleanKanbanView] CRITICAL SUCCESS - Rendering', stages.length, 'stages');

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-8 h-full overflow-x-auto pb-6">
          {stages.map(stage => (
            <EnhancedKanbanColumn
              key={stage.id}
              stage={stage}
              deals={deals[stage.name] || []}
              onDealClick={onDealClick}
              onStageEdit={onStageEdit}
              onAddDeal={onAddDeal}
              viewDensity="comfortable"
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};