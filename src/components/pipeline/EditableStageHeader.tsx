import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Plus,
  Check,
  X,
  GripVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PipelineStage } from '@/hooks/usePipelineStages';

interface EditableStageHeaderProps {
  stage: PipelineStage;
  dealCount: number;
  onEdit: (stageId: string, newName: string) => void;
  onDelete?: (stageId: string) => void;
  onAddDeal: (stageId: string) => void;
  isDragging?: boolean;
}

export function EditableStageHeader({ 
  stage, 
  dealCount, 
  onEdit, 
  onDelete, 
  onAddDeal,
  isDragging 
}: EditableStageHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(stage.name);

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== stage.name) {
      onEdit(stage.id, editValue.trim());
    }
    setIsEditing(false);
    setEditValue(stage.name);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(stage.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 border-b bg-white ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 flex-1">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
        
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <div>
              <h3 className="font-medium text-sm">{stage.name}</h3>
              {stage.description && (
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              )}
            </div>
            <Badge variant="secondary" className="ml-auto">
              {dealCount}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAddDeal(stage.id)}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Name
            </DropdownMenuItem>
            {onDelete && dealCount === 0 && (
              <DropdownMenuItem 
                onClick={() => onDelete(stage.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Stage
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}