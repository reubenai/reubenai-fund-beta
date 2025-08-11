import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Trash2,
  Zap
} from 'lucide-react';
import { useAnalysisQueueManager } from '@/hooks/useAnalysisQueueManager';

export function AnalysisQueueDashboard() {
  const {
    isProcessing,
    queueStats,
    getQueueStatus,
    processQueue,
    reclaimZombieJobs,
    clearFailedJobs
  } = useAnalysisQueueManager();

  useEffect(() => {
    // Load initial stats
    getQueueStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(getQueueStatus, 30000);
    return () => clearInterval(interval);
  }, [getQueueStatus]);

  const totalJobs = queueStats?.total || 0;
  const queuedJobs = queueStats?.queued || 0;
  const processingJobs = queueStats?.processing || 0;
  const completedJobs = queueStats?.completed || 0;
  const failedJobs = queueStats?.failed || 0;

  const completionRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100) : 0;
  const failureRate = totalJobs > 0 ? ((failedJobs / totalJobs) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSystemStatus = () => {
    if (failureRate > 50) return 'error';
    if (queuedJobs > 100 || processingJobs > 20) return 'warning';
    return 'healthy';
  };

  const status = getSystemStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analysis Queue Dashboard</h2>
        <div className="flex items-center gap-2">
          <Badge variant={status === 'healthy' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}>
            {status.toUpperCase()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={getQueueStatus}
            disabled={isProcessing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Queued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queuedJobs}</div>
            <p className="text-xs text-muted-foreground">
              Waiting for processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingJobs}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedJobs}</div>
            <p className="text-xs text-muted-foreground">
              Errors encountered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Queue Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Completion Rate</span>
                <span>{completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Failure Rate</span>
                <span className={failureRate > 20 ? 'text-red-600' : ''}>{failureRate.toFixed(1)}%</span>
              </div>
              <Progress 
                value={failureRate} 
                className="h-2" 
              />
            </div>

            {queueStats?.high_priority > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {queueStats.high_priority} high priority jobs in queue
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Queue Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => processQueue()}
              disabled={isProcessing}
              className="w-full"
              size="sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Process Queue'}
            </Button>

            <Button
              onClick={reclaimZombieJobs}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reclaim Zombie Jobs
            </Button>

            {failedJobs > 0 && (
              <Button
                onClick={clearFailedJobs}
                disabled={isProcessing}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Failed Jobs
              </Button>
            )}

            <div className="text-xs text-muted-foreground mt-4">
              Queue refreshes automatically every 30 seconds
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Messages */}
      {status === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Queue Health Critical</h3>
                <p className="text-sm">
                  High failure rate detected. Check edge function logs and consider switching to Safe Mode.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'warning' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Queue Backlog Detected</h3>
                <p className="text-sm">
                  Large number of queued jobs. Consider processing in smaller batches or reclaiming zombie jobs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}