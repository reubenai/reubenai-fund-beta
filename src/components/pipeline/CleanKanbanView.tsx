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
  // Show pipeline stages immediately when available, only show empty state if no stages exist
  const totalDeals = Object.values(deals).reduce((sum, stageDeals) => sum + stageDeals.length, 0);
  
  if (stages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">Loading Pipeline Stages...</h3>
          <p className="text-sm text-muted-foreground">Setting up your deal pipeline</p>
        </div>
      </div>
    );
  }

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