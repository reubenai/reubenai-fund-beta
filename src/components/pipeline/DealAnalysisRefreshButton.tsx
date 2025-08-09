import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { useEnhancedAnalysisQueue } from '@/hooks/useEnhancedAnalysisQueue';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface DealAnalysisRefreshButtonProps {
  dealId: string;
  lastAnalyzed?: string;
  size?: 'sm' | 'default';
  variant?: 'button' | 'badge';
}

export function DealAnalysisRefreshButton({ 
  dealId, 
  lastAnalyzed, 
  size = 'sm',
  variant = 'button' 
}: DealAnalysisRefreshButtonProps) {
  const { forceAnalysisNow, isProcessing } = useEnhancedAnalysisQueue();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const getAnalysisFreshness = () => {
    if (!lastAnalyzed) {
      return { status: 'never', color: 'bg-gray-500', text: 'Never analyzed', urgency: 'high' };
    }

    const lastAnalyzedDate = new Date(lastAnalyzed);
    const hoursAgo = (Date.now() - lastAnalyzedDate.getTime()) / (1000 * 60 * 60);

    if (hoursAgo < 24) {
      return { 
        status: 'fresh', 
        color: 'bg-green-500', 
        text: formatDistanceToNow(lastAnalyzedDate, { addSuffix: true }),
        urgency: 'low'
      };
    } else if (hoursAgo < 168) { // 7 days
      return { 
        status: 'aging', 
        color: 'bg-yellow-500', 
        text: formatDistanceToNow(lastAnalyzedDate, { addSuffix: true }),
        urgency: 'medium'
      };
    } else {
      return { 
        status: 'stale', 
        color: 'bg-red-500', 
        text: formatDistanceToNow(lastAnalyzedDate, { addSuffix: true }),
        urgency: 'high'
      };
    }
  };

  const handleRefreshAnalysis = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setIsLoading(true);
    try {
      const result = await forceAnalysisNow(dealId);
      
      if (result.success) {
        toast({
          title: "Analysis Started",
          description: "Deal analysis has been queued for immediate processing",
          variant: "default"
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: result.error || "Failed to start analysis",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to trigger analysis:', error);
      toast({
        title: "Error",
        description: "Failed to start analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const freshness = getAnalysisFreshness();

  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`cursor-pointer hover:opacity-80 gap-1 ${
                freshness.urgency === 'high' ? 'border-red-200 text-red-700' :
                freshness.urgency === 'medium' ? 'border-yellow-200 text-yellow-700' :
                'border-green-200 text-green-700'
              }`}
              onClick={handleRefreshAnalysis}
            >
              <div className={`w-2 h-2 rounded-full ${freshness.color}`} />
              <Clock className="w-3 h-3" />
              {freshness.text}
              {(isLoading || isProcessing) && <RefreshCw className="w-3 h-3 animate-spin" />}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to refresh analysis</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size={size}
            onClick={handleRefreshAnalysis}
            disabled={isLoading || isProcessing}
            className="gap-2"
          >
            {(isLoading || isProcessing) ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : freshness.urgency === 'high' ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh Analysis
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">Analysis Freshness</p>
            <p className="text-sm text-muted-foreground">{freshness.text}</p>
            <p className="text-xs text-muted-foreground mt-1">Click to refresh</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}