import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Deal, PipelineStage } from '@/hooks/usePipelineDeals';
import { CleanKanbanColumn } from './CleanKanbanColumn';

interface CleanKanbanViewProps {
  deals: Record<string, Deal[]>;
  stages: PipelineStage[];
  onDragEnd: (result: DropResult) => void;
  onDealClick?: (deal: Deal) => void;
  onStageEdit?: (stageId: string, newTitle: string) => void;
  onStageDelete?: (stageId: string) => void;
  onAddDeal?: (stageId?: string) => void;
}

export const CleanKanbanView: React.FC<CleanKanbanViewProps> = ({
  deals,
  stages,
  onDragEnd,
  onDealClick,
  onStageEdit,
  onStageDelete,
  onAddDeal,
}) => {
  return (
    <div className="h-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-8 h-full overflow-x-auto pb-6">
          {stages.map(stage => (
            <CleanKanbanColumn
              key={stage.id}
              stage={stage}
              deals={deals[stage.name.toLowerCase().replace(/\s+/g, '_')] || []}
              onDealClick={onDealClick}
              onStageEdit={onStageEdit}
              onStageDelete={onStageDelete}
              onAddDeal={onAddDeal}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};