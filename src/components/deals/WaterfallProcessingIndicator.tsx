import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useWaterfallProcessing } from '@/hooks/useWaterfallProcessing';
import { EngineCompletionStatus } from '@/services/waterfallProcessingService';

interface WaterfallProcessingIndicatorProps {
  dealId: string;
  fundId: string;
  fundType: 'vc' | 'pe';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function WaterfallProcessingIndicator({
  dealId,
  fundId,
  fundType,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: WaterfallProcessingIndicatorProps) {
  const { 
    isProcessing, 
    currentStatus, 
    processingResult,
    startWaterfallProcessing, 
    getWaterfallStatus 
  } = useWaterfallProcessing();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh status
  useEffect(() => {
    if (!autoRefresh || !dealId) return;
    
    const fetchStatus = async () => {
      setIsRefreshing(true);
      await getWaterfallStatus(dealId);
      setIsRefreshing(false);
    };
    
    fetchStatus();
    
    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [dealId, autoRefresh, refreshInterval, getWaterfallStatus]);

  const handleManualProcessing = async () => {
    try {
      await startWaterfallProcessing(dealId, fundId, fundType, {
        enableAIEnhancement: true,
        timeoutMinutes: 5,
        checkIntervalSeconds: 60
      });
    } catch (error) {
      console.error('Manual waterfall processing failed:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'complete':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'error':
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const calculateProgress = (status: EngineCompletionStatus | null) => {
    if (!status) return 0;
    
    const totalEngines = status.totalEngines || 7;
    const completedCount = status.completedEngines;
    return Math.round((completedCount / totalEngines) * 100);
  };

  if (!currentStatus && !isProcessing && !processingResult) {
    return (
      <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/5">
        <Button
          onClick={handleManualProcessing}
          disabled={isProcessing}
          variant="outline"
          size="sm"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Start Waterfall Processing
        </Button>
        <span className="text-sm text-muted-foreground">
          Process all data sources and consolidate
        </span>
      </div>
    );
  }

  const progress = calculateProgress(currentStatus);
  const isCompleted = currentStatus?.overallStatus === 'completed';
  const isTimeout = currentStatus?.overallStatus === 'timeout';
  const isFailed = currentStatus?.overallStatus === 'failed';

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Waterfall Data Processing</h4>
        {isRefreshing && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Overall Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Engine Status Grid */}
      {currentStatus && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="flex items-center gap-2 text-xs">
            {getStatusIcon(currentStatus.documents_status)}
            <span>Documents</span>
            <Badge variant={getStatusVariant(currentStatus.documents_status)} className="text-xs">
              {currentStatus.documents_status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            {getStatusIcon(currentStatus.crunchbase_status)}
            <span>Crunchbase</span>
            <Badge variant={getStatusVariant(currentStatus.crunchbase_status)} className="text-xs">
              {currentStatus.crunchbase_status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            {getStatusIcon(currentStatus.linkedin_profile_status)}
            <span>LinkedIn Profile</span>
            <Badge variant={getStatusVariant(currentStatus.linkedin_profile_status)} className="text-xs">
              {currentStatus.linkedin_profile_status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            {getStatusIcon(currentStatus.linkedin_export_status)}
            <span>LinkedIn Export</span>
            <Badge variant={getStatusVariant(currentStatus.linkedin_export_status)} className="text-xs">
              {currentStatus.linkedin_export_status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            {getStatusIcon(currentStatus.perplexity_company_status)}
            <span>Company Intel</span>
            <Badge variant={getStatusVariant(currentStatus.perplexity_company_status)} className="text-xs">
              {currentStatus.perplexity_company_status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            {getStatusIcon(currentStatus.perplexity_founder_status)}
            <span>Founder Intel</span>
            <Badge variant={getStatusVariant(currentStatus.perplexity_founder_status)} className="text-xs">
              {currentStatus.perplexity_founder_status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            {getStatusIcon(currentStatus.perplexity_market_status)}
            <span>Market Intel</span>
            <Badge variant={getStatusVariant(currentStatus.perplexity_market_status)} className="text-xs">
              {currentStatus.perplexity_market_status}
            </Badge>
          </div>
        </div>
      )}

      {/* Status Message */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {isCompleted && <CheckCircle className="h-4 w-4 text-success" />}
          {isTimeout && <Clock className="h-4 w-4 text-warning" />}
          {isFailed && <AlertCircle className="h-4 w-4 text-destructive" />}
          {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          
          <span className="text-muted-foreground">
            {isCompleted && 'All engines completed successfully'}
            {isTimeout && 'Processing completed with timeout (using available data)'}
            {isFailed && 'Processing failed - please try again'}
            {isProcessing && 'Processing in progress...'}
            {!isCompleted && !isTimeout && !isFailed && !isProcessing && 'Ready to process'}
          </span>
        </div>

        {processingResult && (
          <div className="text-xs text-muted-foreground">
            {processingResult.dataPointsCreated} data points • {processingResult.completenessScore}% complete
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(isFailed || (!isProcessing && !currentStatus)) && (
        <Button
          onClick={handleManualProcessing}
          disabled={isProcessing}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              {isFailed ? 'Retry Processing' : 'Start Processing'}
            </>
          )}
        </Button>
      )}
    </div>
  );
}