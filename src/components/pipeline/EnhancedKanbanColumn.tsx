import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Check, X, MoreVertical, Palette } from 'lucide-react';
import { Deal, PipelineStage } from '@/hooks/usePipelineDeals';
import { EnhancedDealCard } from './EnhancedDealCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface EnhancedKanbanColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onDealClick?: (deal: Deal) => void;
  onStageEdit?: (stageId: string, newTitle: string) => void;
  onAddDeal?: (stageId: string) => void;
  viewDensity: 'compact' | 'comfortable' | 'detailed';
}

export const EnhancedKanbanColumn: React.FC<EnhancedKanbanColumnProps> = ({
  stage,
  deals,
  onDealClick,
  onStageEdit,
  onAddDeal,
  viewDensity
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

  const getColumnWidth = () => {
    switch (viewDensity) {
      case 'compact': return 'w-72';
      case 'detailed': return 'w-96';
      default: return 'w-80';
    }
  };

  return (
    <Card className={`flex-shrink-0 ${getColumnWidth()} bg-slate-50 border-slate-200`}>
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Title
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Palette className="w-4 h-4 mr-2" />
                    Change Color
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        
        
        {/* Stage Description */}
        {viewDensity === 'detailed' && stage.description && (
          <p className="text-xs text-gray-500 mt-1">{stage.description}</p>
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
                  <EnhancedDealCard
                    key={deal.id}
                    deal={deal as any}
                    index={index}
                    onDealClick={onDealClick}
                    viewDensity={viewDensity}
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