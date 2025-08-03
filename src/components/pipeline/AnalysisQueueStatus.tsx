import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Play, 
  Pause, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { useAnalysisQueue } from '@/hooks/useAnalysisQueue';
import { supabase } from '@/integrations/supabase/client';

interface AnalysisQueueStatusProps {
  dealId: string;
  autoAnalysisEnabled?: boolean;
  onAutoAnalysisChange?: (enabled: boolean) => void;
}

export const AnalysisQueueStatus: React.FC<AnalysisQueueStatusProps> = ({
  dealId,
  autoAnalysisEnabled = true,
  onAutoAnalysisChange
}) => {
  const [queueItem, setQueueItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const { 
    getQueueStatus, 
    cancelQueuedAnalysis, 
    forceAnalysisNow, 
    toggleAutoAnalysis 
  } = useAnalysisQueue();

  useEffect(() => {
    checkQueueStatus();
    
    // Set up real-time subscription for queue updates
    const channel = supabase
      .channel('analysis_queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_queue',
          filter: `deal_id=eq.${dealId}`
        },
        () => {
          checkQueueStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId]);

  useEffect(() => {
    // Simulate progress for processing items
    if (queueItem?.status === 'processing') {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 2000);

      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [queueItem?.status]);

  const checkQueueStatus = async () => {
    setLoading(true);
    const result = await getQueueStatus(dealId);
    if (result.success) {
      setQueueItem(result.queueItem);
    }
    setLoading(false);
  };

  const handleCancelAnalysis = async () => {
    if (queueItem?.id) {
      const result = await cancelQueuedAnalysis(queueItem.id);
      if (result.success) {
        checkQueueStatus();
      }
    }
  };

  const handleForceAnalysis = async () => {
    const result = await forceAnalysisNow(dealId);
    if (result.success) {
      checkQueueStatus();
    }
  };

  const handleAutoAnalysisToggle = async (enabled: boolean) => {
    const result = await toggleAutoAnalysis(dealId, enabled);
    if (result.success) {
      onAutoAnalysisChange?.(enabled);
    }
  };

  const getStatusInfo = () => {
    if (!queueItem) {
      return {
        label: 'No Analysis Queued',
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-muted-foreground'
      };
    }

    switch (queueItem.status) {
      case 'queued':
        return {
          label: 'Queued for Analysis',
          variant: 'default' as const,
          icon: Clock,
          color: 'text-blue-600'
        };
      case 'processing':
        return {
          label: 'Analyzing Now',
          variant: 'default' as const,
          icon: RefreshCw,
          color: 'text-blue-600'
        };
      case 'completed':
        return {
          label: 'Analysis Complete',
          variant: 'default' as const,
          icon: CheckCircle,
          color: 'text-green-600'
        };
      case 'failed':
        return {
          label: 'Analysis Failed',
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-red-600'
        };
      default:
        return {
          label: 'Unknown Status',
          variant: 'secondary' as const,
          icon: AlertCircle,
          color: 'text-muted-foreground'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const formatTimeRemaining = () => {
    if (!queueItem?.scheduled_for) return null;
    
    const scheduledTime = new Date(queueItem.scheduled_for);
    const now = new Date();
    const diff = scheduledTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Starting soon...';
    
    const minutes = Math.ceil(diff / (1000 * 60));
    return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Checking analysis status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Analysis Status</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Auto-Analysis</span>
            <Switch
              checked={autoAnalysisEnabled}
              onCheckedChange={handleAutoAnalysisToggle}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Status Display */}
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${statusInfo.color} ${queueItem?.status === 'processing' ? 'animate-spin' : ''}`} />
            <Badge variant={statusInfo.variant} className="text-xs">
              {statusInfo.label}
            </Badge>
          </div>

          {/* Progress Bar for Processing */}
          {queueItem?.status === 'processing' && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Running comprehensive analysis...
              </p>
            </div>
          )}

          {/* Time Remaining for Queued Items */}
          {queueItem?.status === 'queued' && (
            <p className="text-xs text-muted-foreground">
              {formatTimeRemaining()}
            </p>
          )}

          {/* Error Message */}
          {queueItem?.status === 'failed' && queueItem?.error_message && (
            <p className="text-xs text-red-600">
              {queueItem.error_message}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {queueItem?.status === 'queued' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelAnalysis}
                className="text-xs"
              >
                <Pause className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            )}
            
            {(!queueItem || ['completed', 'failed'].includes(queueItem?.status)) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceAnalysis}
                className="text-xs"
              >
                <Zap className="w-3 h-3 mr-1" />
                Analyze Now
              </Button>
            )}
          </div>

          {/* Queue Metadata */}
          {queueItem && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Trigger: {queueItem.trigger_reason?.replace('_', ' ')}</div>
              <div>Priority: {queueItem.priority}</div>
              {queueItem.attempts > 1 && (
                <div>Attempts: {queueItem.attempts}</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};