import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useEnhancedAnalysisQueue } from '@/hooks/useEnhancedAnalysisQueue';

interface QueuePositionIndicatorProps {
  dealId: string;
  compact?: boolean;
}

export function QueuePositionIndicator({ dealId, compact = false }: QueuePositionIndicatorProps) {
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const { getQueueStatus } = useEnhancedAnalysisQueue();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await getQueueStatus(dealId);
        if (result.success && result.queueItems && result.queueItems.length > 0) {
          setQueueStatus(result.queueItems[0]); // Get the latest queue item
        } else {
          setQueueStatus(null); // Clear status if no queue items
        }
      } catch (error) {
        console.error('Error checking queue status:', error);
        setQueueStatus(null);
      }
    };

    if (dealId) {
      checkStatus();
      const interval = setInterval(checkStatus, 10000); // Check every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [dealId, getQueueStatus]);

  if (!queueStatus || !dealId) return null;

  const getStatusDisplay = () => {
    switch (queueStatus.status) {
      case 'queued':
        const estimatedWait = Math.max(1, Math.ceil(queueStatus.queue_position * 2)); // 2 min per position
        return {
          icon: Clock,
          text: compact ? `#${queueStatus.queue_position}` : `Queue #${queueStatus.queue_position} (~${estimatedWait}m)`,
          variant: 'secondary' as const,
          color: 'text-amber-600'
        };
      case 'processing':
        return {
          icon: Zap,
          text: compact ? 'Processing' : 'Analyzing now...',
          variant: 'default' as const,
          color: 'text-blue-600'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          text: compact ? 'Done' : 'Analysis complete',
          variant: 'default' as const,
          color: 'text-green-600'
        };
      case 'failed':
        return {
          icon: AlertCircle,
          text: compact ? 'Failed' : 'Analysis failed',
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
      default:
        return null;
    }
  };

  const status = getStatusDisplay();
  if (!status) return null;

  const StatusIcon = status.icon;

  return (
    <Badge variant={status.variant} className="flex items-center gap-1 text-xs">
      <StatusIcon className="w-3 h-3" />
      {status.text}
    </Badge>
  );
}