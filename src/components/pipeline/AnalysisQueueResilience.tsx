import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  TrendingUp,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { useAnalysisQueueResilience } from '@/hooks/useAnalysisQueueResilience';
import { useToast } from '@/hooks/use-toast';

interface AnalysisQueueResilienceProps {
  fundId?: string;
}

export const AnalysisQueueResilience: React.FC<AnalysisQueueResilienceProps> = ({ fundId }) => {
  const { 
    queueHealth, 
    forceProcessQueue, 
    drainFailedItems, 
    reclaimStuckItems,
    getProcessingEstimate 
  } = useAnalysisQueueResilience(fundId);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleForceProcess = async () => {
    setIsProcessing(true);
    try {
      await forceProcessQueue();
      toast({
        title: "Queue Processing Triggered",
        description: "Analysis queue processing has been manually triggered",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger queue processing",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrainFailed = async () => {
    setIsProcessing(true);
    try {
      const drained = await drainFailedItems();
      toast({
        title: "Failed Items Cleared",
        description: `${drained} failed items have been removed from the queue`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear failed items",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReclaimStuck = async () => {
    setIsProcessing(true);
    try {
      const reclaimed = await reclaimStuckItems();
      toast({
        title: "Stuck Items Reclaimed",
        description: `${reclaimed} stuck items have been reset for reprocessing`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reclaim stuck items",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getHealthIcon = () => {
    if (!queueHealth) return <Clock className="w-5 h-5 text-muted-foreground" />;
    if (queueHealth.isHealthy) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  };

  const getHealthBadge = () => {
    if (!queueHealth) return <Badge variant="outline">Unknown</Badge>;
    if (queueHealth.isHealthy) return <Badge className="bg-green-50 text-green-700 border-green-200">Healthy</Badge>;
    return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Attention Needed</Badge>;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Analysis Queue Health
            {getHealthBadge()}
          </span>
          {getHealthIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {queueHealth && (
          <>
            {/* Queue Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{queueHealth.totalQueued}</div>
                <div className="text-xs text-blue-600 font-medium">Queued</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{queueHealth.processingItems}</div>
                <div className="text-xs text-amber-600 font-medium">Processing</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{queueHealth.failedInLast24h}</div>
                <div className="text-xs text-red-600 font-medium">Failed (24h)</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(queueHealth.averageProcessingTime)}m
                </div>
                <div className="text-xs text-green-600 font-medium">Avg Time</div>
              </div>
            </div>

            {/* Processing Estimates */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium mb-2">Current Processing Estimates:</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>High Priority: {getProcessingEstimate('high')}</div>
                <div>Normal Priority: {getProcessingEstimate('normal')}</div>
                <div>Low Priority: {getProcessingEstimate('low')}</div>
              </div>
            </div>

            {/* Warnings */}
            {queueHealth.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {queueHealth.warnings.map((warning, index) => (
                      <div key={index}>{warning}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Control Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleForceProcess}
                disabled={isProcessing}
                size="sm"
                className="gap-2"
              >
                <Zap className="w-4 h-4" />
                Force Process
              </Button>
              
              {queueHealth.failedInLast24h > 0 && (
                <Button
                  onClick={handleDrainFailed}
                  disabled={isProcessing}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear Failed
                </Button>
              )}
              
              {queueHealth.warnings.some(w => w.includes('stuck')) && (
                <Button
                  onClick={handleReclaimStuck}
                  disabled={isProcessing}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Reclaim Stuck
                </Button>
              )}
            </div>
          </>
        )}

        {!queueHealth && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <p>Monitoring queue health...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};