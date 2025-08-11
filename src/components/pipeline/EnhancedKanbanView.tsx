import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Deal, PipelineStage } from '@/hooks/usePipelineDeals';
import { EnhancedKanbanColumn } from './EnhancedKanbanColumn';
import { stageNameToStatus } from '@/utils/pipelineMapping';

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
        {stages.map(stage => {
          // CRITICAL FIX: Map stage name to database status for deal grouping
          const stageStatus = stageNameToStatus(stage.name);
          const stageDeals = deals[stageStatus] || [];
          
          console.log(`🔍 [KanbanView] Stage: "${stage.name}" -> Status: "${stageStatus}" -> Deals: ${stageDeals.length}`);
          
          return (
            <EnhancedKanbanColumn
              key={stage.id}
              stage={stage}
              deals={stageDeals}
              onDealClick={onDealClick}
              onStageEdit={onStageEdit}
              onAddDeal={onAddDeal}
              viewDensity={viewDensity}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
};