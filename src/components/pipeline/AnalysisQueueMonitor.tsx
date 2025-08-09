import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEnhancedAnalysisQueue } from '@/hooks/useEnhancedAnalysisQueue';
import { useAnalysisScheduler } from '@/hooks/useAnalysisScheduler';
import { Play, Pause, RotateCcw, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';

export function AnalysisQueueMonitor() {
  const [queueStats, setQueueStats] = useState(null);
  const [isSchedulerEnabled, setIsSchedulerEnabled] = useState(true);
  
  const { 
    processBacklog, 
    getQueueStats, 
    isProcessing 
  } = useEnhancedAnalysisQueue();
  
  const { 
    startScheduler, 
    stopScheduler, 
    forceProcessing 
  } = useAnalysisScheduler({
    enabled: isSchedulerEnabled,
    intervalMinutes: 2,
    onProcessingUpdate: (result) => {
      console.log('Scheduler update:', result);
      refreshStats();
    }
  });

  const refreshStats = async () => {
    const result = await getQueueStats();
    if (result.success) {
      setQueueStats(result.stats);
    }
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleProcessBacklog = async () => {
    await processBacklog();
    await refreshStats();
  };

  const handleForceProcess = async () => {
    await forceProcessing();
    await refreshStats();
  };

  const toggleScheduler = () => {
    if (isSchedulerEnabled) {
      stopScheduler();
      setIsSchedulerEnabled(false);
    } else {
      startScheduler();
      setIsSchedulerEnabled(true);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Analysis Queue Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Queue Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="flex flex-col items-center gap-1">
            <Badge variant="secondary" className="w-full justify-center">
              <Clock className="w-3 h-3 mr-1" />
              {queueStats?.queued || 0}
            </Badge>
            <span className="text-xs text-muted-foreground">Queued</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <Badge variant="default" className="w-full justify-center">
              <Activity className="w-3 h-3 mr-1" />
              {queueStats?.processing || 0}
            </Badge>
            <span className="text-xs text-muted-foreground">Processing</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <Badge variant="outline" className="w-full justify-center text-green-600 border-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              {queueStats?.completed || 0}
            </Badge>
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <Badge variant="destructive" className="w-full justify-center">
              <XCircle className="w-3 h-3 mr-1" />
              {queueStats?.failed || 0}
            </Badge>
            <span className="text-xs text-muted-foreground">Failed</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <Badge variant="outline" className="w-full justify-center">
              {queueStats?.total || 0}
            </Badge>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={toggleScheduler}
            variant={isSchedulerEnabled ? "default" : "outline"}
            size="sm"
            className="flex-1 min-w-0"
          >
            {isSchedulerEnabled ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Stop Auto
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Start Auto
              </>
            )}
          </Button>

          <Button
            onClick={handleForceProcess}
            variant="outline"
            size="sm"
            disabled={isProcessing}
            className="flex-1 min-w-0"
          >
            <Activity className="w-4 h-4 mr-1" />
            Process Now
          </Button>

          <Button
            onClick={handleProcessBacklog}
            variant="outline"
            size="sm"
            disabled={isProcessing}
            className="flex-1 min-w-0"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear Backlog
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSchedulerEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>Auto Scheduler: {isSchedulerEnabled ? 'Running' : 'Stopped'}</span>
          </div>
          
          {isProcessing && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Processing...</span>
            </div>
          )}
        </div>

        {/* Warning for stale queues */}
        {queueStats?.queued > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ There are {queueStats.queued} analyses waiting to be processed. 
              Use "Process Now" or "Clear Backlog" to run them immediately.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}