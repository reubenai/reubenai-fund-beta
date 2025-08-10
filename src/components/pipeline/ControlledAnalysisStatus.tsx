import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useEnhancedAnalysisQueue } from '@/hooks/useEnhancedAnalysisQueue';

export function ControlledAnalysisStatus() {
  const [queueStats, setQueueStats] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const { getQueueStats } = useEnhancedAnalysisQueue();

  const refreshStats = async () => {
    const result = await getQueueStats();
    if (result.success) {
      setQueueStats(result.stats);
    }
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 30000); // Less frequent updates
    return () => clearInterval(interval);
  }, []);

  const hasQueuedItems = queueStats?.queued > 0;
  const hasProcessingItems = queueStats?.processing > 0;

  const getStatusColor = () => {
    if (hasProcessingItems) return 'bg-blue-500';
    if (hasQueuedItems) return 'bg-amber-500'; 
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (hasProcessingItems) return 'Processing';
    if (hasQueuedItems) return 'Queued';
    return 'Ready';
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
            <span className="text-sm">Controlled Analysis</span>
            {hasQueuedItems && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {queueStats.queued} waiting
              </Badge>
            )}
            {hasProcessingItems && (
              <Badge variant="default" className="text-xs px-1.5 py-0">
                {queueStats.processing} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs">{getStatusText()}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-3">
        <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-border/50">
          {/* Minimal Stats Grid */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="space-y-1">
              <div className="text-lg font-medium text-amber-600 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                {queueStats?.queued || 0}
              </div>
              <div className="text-xs text-muted-foreground">Queued</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-medium text-blue-600 flex items-center justify-center gap-1">
                <Activity className="w-4 h-4" />
                {queueStats?.processing || 0}
              </div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-medium text-green-600 flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {queueStats?.completed || 0}
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-medium text-red-600 flex items-center justify-center gap-1">
                <XCircle className="w-4 h-4" />
                {queueStats?.failed || 0}
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>

          {/* Status Information */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Analysis Mode:</span>
              <span className="text-green-600 font-medium">Controlled Triggers</span>
            </div>
            <div className="flex justify-between">
              <span>Trigger Sources:</span>
              <span className="font-mono">Upload, Manual, Bulk</span>
            </div>
            <div className="flex justify-between">
              <span>Batch Limit:</span>
              <span className="font-mono">5 deals max</span>
            </div>
            <div className="flex justify-between">
              <span>Cooldown Period:</span>
              <span className="font-mono">24 hours</span>
            </div>
          </div>

          {hasQueuedItems && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-md p-3 text-xs">
              <div className="text-amber-800 dark:text-amber-200">
                <div className="font-medium">{queueStats.queued} analyses in controlled queue</div>
                <div className="text-amber-700 dark:text-amber-300 mt-1">
                  Processing automatically based on priority and delays
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}