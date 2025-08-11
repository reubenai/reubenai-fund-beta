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

  // Temporarily hide analysis queue status to remove problematic banners
  return null;
};