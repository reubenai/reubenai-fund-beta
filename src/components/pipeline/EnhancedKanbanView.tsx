import React from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Deal, PipelineStage } from '@/hooks/usePipelineDeals';
import { EnhancedKanbanColumn } from './EnhancedKanbanColumn';

interface EnhancedKanbanViewProps {
  deals: Record<string, Deal[]>;
  stages: PipelineStage[];
  onDragEnd: (result: DropResult) => void;
  onDealClick?: (deal: Deal) => void;
  onStageEdit?: (stageId: string, newTitle: string) => void;
  onAddDeal?: (stageId?: string) => void;
  onAddStage?: () => void;
  viewDensity: 'compact' | 'comfortable' | 'detailed';
}

export const EnhancedKanbanView: React.FC<EnhancedKanbanViewProps> = ({
  deals,
  stages,
  onDragEnd,
  onDealClick,
  onStageEdit,
  onAddDeal,
  onAddStage,
  viewDensity
}) => {
  const getGridClass = () => {
    const columnCount = stages.length;
    
    if (columnCount <= 3) {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    } else if (columnCount === 4) {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6';
    } else if (columnCount <= 6) {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6';
    } else {
      return 'flex gap-6 overflow-x-auto pb-6';
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={getGridClass()}>
        {stages.map(stage => (
          <EnhancedKanbanColumn
            key={stage.id}
            stage={stage}
            deals={deals[stage.id] || []}
            onDealClick={onDealClick}
            onStageEdit={onStageEdit}
            onAddDeal={onAddDeal}
            viewDensity={viewDensity}
          />
        ))}
      </div>
    </DragDropContext>
  );
};