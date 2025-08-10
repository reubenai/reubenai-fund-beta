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
  // Show professional empty state only if no stages
  const totalDeals = Object.values(deals).reduce((sum, stageDeals) => sum + stageDeals.length, 0);
  
  if (stages.length === 0) {
    return (
      <ProfessionalEmptyState 
        fundName={fundName}
        onAddDeal={() => onAddDeal?.()}
        onBatchUpload={onBatchUpload}
      />
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