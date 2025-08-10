import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Send, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Vote, 
  Gavel,
  Clock
} from 'lucide-react';

type WorkflowState = 'draft' | 'submitted' | 'approved' | 'rejected' | 'scheduled' | 'voting' | 'decided';

interface WorkflowStatusBadgeProps {
  state: WorkflowState;
  className?: string;
}

const stateConfig = {
  draft: {
    label: 'Draft',
    variant: 'secondary' as const,
    icon: FileText,
    description: 'Memo in draft state'
  },
  submitted: {
    label: 'Under Review',
    variant: 'default' as const,
    icon: Send,
    description: 'Submitted for review'
  },
  approved: {
    label: 'Approved',
    variant: 'default' as const,
    icon: CheckCircle,
    description: 'Approved for scheduling'
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive' as const,
    icon: XCircle,
    description: 'Rejected and returned to draft'
  },
  scheduled: {
    label: 'Scheduled',
    variant: 'outline' as const,
    icon: Calendar,
    description: 'Scheduled for IC meeting'
  },
  voting: {
    label: 'Voting',
    variant: 'default' as const,
    icon: Vote,
    description: 'Voting in progress'
  },
  decided: {
    label: 'Decided',
    variant: 'default' as const,
    icon: Gavel,
    description: 'Final decision made'
  }
};

export function WorkflowStatusBadge({ state, className }: WorkflowStatusBadgeProps) {
  const config = stateConfig[state] || stateConfig.draft;
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`flex items-center gap-1 ${className || ''}`}
      title={config.description}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export function WorkflowStateIndicator({ 
  state, 
  showLabel = true 
}: { 
  state: WorkflowState; 
  showLabel?: boolean 
}) {
  const config = stateConfig[state] || stateConfig.draft;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
    <div className={`p-2 rounded-full ${
      state === 'approved' || state === 'decided' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
      state === 'rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' :
      state === 'voting' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' :
      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }`}>
        <Icon className="h-4 w-4" />
      </div>
      {showLabel && (
        <div>
          <p className="font-medium text-sm">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      )}
    </div>
  );
}