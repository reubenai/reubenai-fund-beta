import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Deal, PipelineStage } from '@/hooks/usePipelineDeals';
import { KanbanColumn } from './KanbanColumn';

interface KanbanViewProps {
  deals: Record<string, Deal[]>;
  stages: PipelineStage[];
  onDragEnd: (result: DropResult) => void;
  onDealClick?: (deal: Deal) => void;
  onStageEdit?: (stageId: string, newTitle: string) => void;
  onAddDeal?: (stageId?: string) => void;
  onAddStage?: () => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  deals,
  stages,
  onDragEnd,
  onDealClick,
  onStageEdit,
  onAddDeal,
  onAddStage
}) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-6">
        {/* Pipeline Stages */}
        {stages.map(stage => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={deals[stage.id] || []}
            onDealClick={onDealClick}
            onStageEdit={onStageEdit}
            onAddDeal={onAddDeal}
          />
        ))}

        {/* Add Stage Column */}
        {onAddStage && (
          <Card className="flex-shrink-0 w-80 bg-white border-2 border-dashed border-gray-300 hover:border-brand-emerald hover:bg-emerald-50 transition-colors">
            <CardContent className="flex items-center justify-center h-full min-h-[300px]">
              <Button
                variant="ghost"
                onClick={onAddStage}
                className="flex flex-col items-center gap-2 text-gray-500 hover:text-brand-emerald"
              >
                <Plus className="w-8 h-8" />
                <span>Add Stage</span>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DragDropContext>
  );
};