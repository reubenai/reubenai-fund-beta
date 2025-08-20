import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Activity } from 'lucide-react';
import { useStrategyConflictPrevention } from '@/hooks/useStrategyConflictPrevention';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AnalysisStatusIndicatorProps {
  fundId: string;
  className?: string;
}

export function AnalysisStatusIndicator({ fundId, className }: AnalysisStatusIndicatorProps) {
  const { checkAnalysisStatus, isCheckingAnalysis } = useStrategyConflictPrevention();
  const [status, setStatus] = useState<{
    hasActiveAnalysis: boolean;
    queuedCount: number;
    processingCount: number;
    canSafelyUpdate: boolean;
    recommendation: string;
  } | null>(null);

  useEffect(() => {
    if (!fundId) return;

    const checkStatus = async () => {
      try {
        const analysisStatus = await checkAnalysisStatus(fundId);
        setStatus(analysisStatus);
      } catch (error) {
        console.error('Failed to check analysis status:', error);
      }
    };

    // Check immediately
    checkStatus();

    // Set up polling every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, [fundId, checkAnalysisStatus]);

  if (!status || isCheckingAnalysis) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={className}>
              <Clock className="w-3 h-3 mr-1" />
              Checking...
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Checking analysis queue status</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const getStatusInfo = () => {
    if (!status.hasActiveAnalysis) {
      return {
        variant: 'default' as const,
        icon: CheckCircle,
        text: 'Ready to Save',
        tooltip: 'No active analysis detected - safe to update strategy'
      };
    } else if (status.canSafelyUpdate) {
      return {
        variant: 'secondary' as const,
        icon: Activity,
        text: 'Low Activity',
        tooltip: `${status.queuedCount} queued, ${status.processingCount} processing - safe to update with retry`
      };
    } else {
      return {
        variant: 'destructive' as const,
        icon: AlertCircle,
        text: 'High Activity',
        tooltip: `${status.queuedCount} queued, ${status.processingCount} processing - updates may conflict`
      };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={statusInfo.variant} className={className}>
            <Icon className="w-3 h-3 mr-1" />
            {statusInfo.text}
            {status.hasActiveAnalysis && (
              <span className="ml-1 text-xs">
                ({status.queuedCount + status.processingCount})
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>{statusInfo.tooltip}</p>
            <p className="text-xs text-muted-foreground">{status.recommendation}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}