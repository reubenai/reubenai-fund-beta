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
  if (stages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-muted-foreground mb-4">No pipeline stages found for this fund.</p>
          <p className="text-sm text-muted-foreground">Pipeline stages need to be created first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-8 h-full overflow-x-auto pb-6">
          {stages.map(stage => (
            <CleanKanbanColumn
              key={stage.id}
              stage={stage}
              deals={deals[stage.name] || []}
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