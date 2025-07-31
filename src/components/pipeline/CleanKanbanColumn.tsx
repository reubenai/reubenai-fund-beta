import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Deal, PipelineStage } from '@/hooks/usePipelineDeals';
import { CleanDealCard } from './CleanDealCard';
import { EditableStageHeader } from './EditableStageHeader';

interface CleanKanbanColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onDealClick?: (deal: Deal) => void;
  onStageEdit?: (stageId: string, newTitle: string) => void;
  onStageDelete?: (stageId: string) => void;
  onAddDeal?: (stageId: string) => void;
}

export const CleanKanbanColumn: React.FC<CleanKanbanColumnProps> = ({
  stage,
  deals,
  onDealClick,
  onStageEdit,
  onStageDelete,
  onAddDeal,
}) => {
  return (
    <div className="flex-shrink-0 w-80 bg-gray-50 rounded-lg">
      {/* Stage Header */}
      <EditableStageHeader
        stage={stage as any}
        dealCount={deals.length}
        onEdit={onStageEdit || (() => {})}
        onDelete={onStageDelete}
        onAddDeal={(stageId) => onAddDeal?.(stageId)}
      />

      {/* Droppable Area */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-96 p-4 transition-colors duration-200 ${
              snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
            }`}
          >
            <div className="space-y-3">
              {deals.map((deal, index) => (
                <CleanDealCard
                  key={deal.id}
                  deal={deal}
                  index={index}
                  onDealClick={onDealClick}
                />
              ))}
              {provided.placeholder}
              
              {/* Empty State */}
              {deals.length === 0 && !snapshot.isDraggingOver && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-sm">Drop deals here</div>
                </div>
              )}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
};