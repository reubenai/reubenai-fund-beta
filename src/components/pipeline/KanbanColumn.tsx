import React, { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Check, X } from 'lucide-react';
import { Deal, PipelineStage } from '@/hooks/usePipelineDeals';
import { DealCard } from './DealCard';

interface KanbanColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onDealClick?: (deal: Deal) => void;
  onStageEdit?: (stageId: string, newTitle: string) => void;
  onAddDeal?: (stageId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  deals,
  onDealClick,
  onStageEdit,
  onAddDeal
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(stage.name);

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== stage.name) {
      onStageEdit?.(stage.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(stage.name);
    setIsEditing(false);
  };

  const getTotalValue = () => {
    const total = deals.reduce((sum, deal) => sum + (deal.deal_size || 0), 0);
    if (total === 0) return null;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: total > 1000000 ? 'compact' : 'standard'
    }).format(total);
  };

  return (
    <Card className="flex-shrink-0 w-80 bg-slate-50 border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-8 text-sm font-semibold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                <Check className="w-4 h-4 text-green-600" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                <X className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 group">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              <h3 className="font-semibold text-gray-900 truncate">
                {stage.name}
              </h3>
              {onStageEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white text-gray-600">
              {deals.length}
            </Badge>
            {onAddDeal && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAddDeal(stage.id)}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Total Value */}
        {getTotalValue() && (
          <div className="text-sm text-gray-600 font-medium">
            Total: {getTotalValue()}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <Droppable droppableId={stage.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`
                min-h-[200px] transition-colors duration-200
                ${snapshot.isDraggingOver ? 'bg-emerald-50 rounded-lg' : ''}
              `}
            >
              {deals.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                  {snapshot.isDraggingOver ? 'Drop deal here' : 'No deals yet'}
                </div>
              ) : (
                deals.map((deal, index) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    index={index}
                    onDealClick={onDealClick}
                  />
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
};