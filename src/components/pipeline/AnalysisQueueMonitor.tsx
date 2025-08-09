import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useEnhancedAnalysisQueue } from '@/hooks/useEnhancedAnalysisQueue';
import { useAnalysisScheduler } from '@/hooks/useAnalysisScheduler';
import { ChevronDown, Activity, RotateCcw, Zap } from 'lucide-react';

export function AnalysisQueueMonitor() {
  const [queueStats, setQueueStats] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
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
    onProcessingUpdate: () => refreshStats()
  });

  const refreshStats = async () => {
    const result = await getQueueStats();
    if (result.success) {
      setQueueStats(result.stats);
    }
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 15000);
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

  // Show warning if there are queued items
  const hasQueuedItems = queueStats?.queued > 0;
  const hasProcessingItems = queueStats?.processing > 0;

  // Minimalist status indicator
  const getStatusColor = () => {
    if (hasProcessingItems) return 'bg-blue-500';
    if (hasQueuedItems) return 'bg-amber-500';
    if (isSchedulerEnabled) return 'bg-green-500';
    return 'bg-gray-400';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-between text-muted-foreground hover:text-foreground border border-border/50 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-sm">Analysis Engine</span>
            {hasQueuedItems && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {queueStats.queued} queued
              </Badge>
            )}
            {hasProcessingItems && (
              <Badge variant="default" className="text-xs px-1.5 py-0">
                {queueStats.processing} running
              </Badge>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-3">
        <div className="bg-muted/30 rounded-lg p-4 space-y-4 border border-border/50">
          {/* Minimal Stats Grid */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="space-y-1">
              <div className="text-lg font-medium text-amber-600">{queueStats?.queued || 0}</div>
              <div className="text-xs text-muted-foreground">Queued</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-medium text-blue-600">{queueStats?.processing || 0}</div>
              <div className="text-xs text-muted-foreground">Running</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-medium text-green-600">{queueStats?.completed || 0}</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-medium text-red-600">{queueStats?.failed || 0}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleForceProcess}
              variant="outline"
              size="sm"
              disabled={isProcessing}
              className="flex-1"
            >
              <Zap className="w-3 h-3 mr-1" />
              Process Now
            </Button>

            {hasQueuedItems && (
              <Button
                onClick={handleProcessBacklog}
                variant="outline"
                size="sm"
                disabled={isProcessing}
                className="flex-1"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Clear Backlog
              </Button>
            )}

            <Button
              onClick={toggleScheduler}
              variant={isSchedulerEnabled ? "default" : "outline"}
              size="sm"
              className="flex-1"
            >
              <Activity className="w-3 h-3 mr-1" />
              Auto: {isSchedulerEnabled ? 'On' : 'Off'}
            </Button>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor()}`} />
              <span>
                {hasProcessingItems ? 'Processing analyses...' : 
                 hasQueuedItems ? `${queueStats.queued} waiting` :
                 isSchedulerEnabled ? 'Monitoring' : 'Paused'}
              </span>
            </div>
            
            {isProcessing && (
              <span className="text-blue-600">Running...</span>
            )}
          </div>

          {/* Warning for queued items */}
          {hasQueuedItems && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-xs text-amber-800">
              Some analyses are waiting. Use "Clear Backlog" to process them immediately.
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}