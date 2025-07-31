import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Deal, PipelineStage } from '@/hooks/usePipelineDeals';
import { CleanDealCard } from './CleanDealCard';

interface CleanKanbanColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onDealClick?: (deal: Deal) => void;
  onStageEdit?: (stageId: string, newTitle: string) => void;
  onAddDeal?: (stageId: string) => void;
}

export const CleanKanbanColumn: React.FC<CleanKanbanColumnProps> = ({
  stage,
  deals,
  onDealClick,
  onAddDeal,
}) => {
  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-medium text-gray-900">{stage.name}</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
              {deals.length}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {deals.length} {deals.length === 1 ? 'deal' : 'deals'}
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-96 transition-colors duration-200 ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
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
                <div className="text-center py-12 text-gray-400">
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