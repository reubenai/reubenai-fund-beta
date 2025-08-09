import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ProcessingResult {
  success: boolean;
  summary?: {
    iterations_run: number;
    total_processed: number;
    total_successful: number;
    total_failed: number;
    remaining_queued: number;
  };
  error?: string;
}

export function ForceAnalysisProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const { toast } = useToast();

  // Query to get current queue stats
  const { data: queueStats, refetch: refetchStats } = useQuery({
    queryKey: ['analysis-queue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_queue')
        .select('status, priority')
        .eq('status', 'queued');
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleForceProcessing = async () => {
    setIsProcessing(true);
    setProcessingResult(null);

    try {
      console.log('🚀 Starting force analysis processing...');
      
      const { data, error } = await supabase.functions.invoke('force-analysis-queue-processor');

      if (error) {
        throw new Error(error.message || 'Failed to process analysis queue');
      }

      setProcessingResult(data);
      
      if (data.success) {
        toast({
          title: "✅ Analysis Queue Processed",
          description: `Processed ${data.summary?.total_processed || 0} deals. ${data.summary?.total_successful || 0} successful, ${data.summary?.total_failed || 0} failed.`,
        });
      } else {
        toast({
          title: "❌ Processing Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }

      // Refresh queue stats
      await refetchStats();

    } catch (error) {
      console.error('Force processing error:', error);
      toast({
        title: "❌ Processing Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const queueCount = queueStats?.length || 0;
  const highPriorityCount = queueStats?.filter(q => q.priority === 'high')?.length || 0;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <RotateCcw className="h-5 w-5" />
          Force Analysis Queue Processor
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          Manually trigger processing of stuck deals in the analysis queue. This will process all queued deals through the 5 specialist engines.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Queue Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{queueCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Deals in Queue</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{highPriorityCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">High Priority</div>
          </div>
        </div>

        {/* Processing Controls */}
        <div className="flex gap-3">
          <Button
            onClick={handleForceProcessing}
            disabled={isProcessing || queueCount === 0}
            className="flex-1"
            variant={queueCount > 0 ? "default" : "secondary"}
          >
            <Play className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : `Force Process ${queueCount} Deals`}
          </Button>
          
          <Button
            onClick={() => refetchStats()}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Processing Results */}
        {processingResult && (
          <div className={`p-4 rounded-lg border ${
            processingResult.success 
              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {processingResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {processingResult.success ? 'Processing Complete' : 'Processing Failed'}
              </span>
            </div>
            
            {processingResult.success && processingResult.summary && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Iterations: {processingResult.summary.iterations_run}</div>
                <div>Processed: {processingResult.summary.total_processed}</div>
                <div>Successful: {processingResult.summary.total_successful}</div>
                <div>Failed: {processingResult.summary.total_failed}</div>
                <div className="col-span-2 font-medium">
                  Remaining: {processingResult.summary.remaining_queued}
                </div>
              </div>
            )}
            
            {!processingResult.success && (
              <div className="text-sm text-red-700 dark:text-red-300">
                {processingResult.error}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900 p-3 rounded">
          <strong>What this does:</strong> Processes deals through all 5 specialist engines (Market Intelligence, Financial Analysis, Team Research, Product IP, Thesis Alignment) to replace mock data with real AI-generated analysis including TAM/SAM/SOM, CAGR%, financial projections, and deep insights.
        </div>
      </CardContent>
    </Card>
  );
}