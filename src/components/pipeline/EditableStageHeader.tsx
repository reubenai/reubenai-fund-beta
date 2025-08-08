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
        {/* Removed drag handle - stages are no longer reorderable in beta */}
        
        {/* Removed editing functionality - stage names are now read-only in beta */}
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
      </div>

      <div className="flex items-center gap-1">
        {/* Removed Add Deal, Edit Stage, and Delete Stage functionality for beta */}
      </div>
    </div>
  );
}