import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useEnhancedAnalysisQueue } from '@/hooks/useEnhancedAnalysisQueue';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Brain, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MADFundAnalysisBooster() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<any[]>([]);
  const { forceAnalysisNow } = useEnhancedAnalysisQueue();
  const { toast } = useToast();

  const processAllMADDeals = async () => {
    try {
      setIsProcessing(true);
      setProgress({ current: 0, total: 0 });
      setResults([]);

      // Get all MAD Hyperscalers Fund deals
      const { data: deals, error } = await supabase
        .from('deals')
        .select('id, company_name, enhanced_analysis')
        .eq('fund_id', 'bb53614c-0015-46b0-b298-b9af1c2c8425')
        .order('company_name');

      if (error) throw error;

      const totalDeals = deals?.length || 0;
      setProgress({ current: 0, total: totalDeals });

      console.log(`🚀 Processing ${totalDeals} MAD Hyperscalers Fund deals...`);

      toast({
        title: "Analysis Boost Started",
        description: `Processing ${totalDeals} deals with real AI engines`,
        variant: "default"
      });

      // Process each deal
      for (let i = 0; i < deals.length; i++) {
        const deal = deals[i];
        
        try {
          console.log(`🔄 Processing deal ${i + 1}/${totalDeals}: ${deal.company_name}`);
          
          // Force immediate analysis for each deal
          const result = await forceAnalysisNow(deal.id);
          
          setResults(prev => [...prev, {
            dealId: deal.id,
            companyName: deal.company_name,
            status: result.success ? 'success' : 'failed',
            error: result.error
          }]);

          setProgress({ current: i + 1, total: totalDeals });

          // Add delay between deals to respect API limits
          if (i < deals.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (error) {
          console.error(`❌ Failed to process ${deal.company_name}:`, error);
          setResults(prev => [...prev, {
            dealId: deal.id,
            companyName: deal.company_name,
            status: 'failed',
            error: error.message
          }]);
        }
      }

      const successCount = results.filter(r => r.status === 'success').length;
      const failedCount = results.filter(r => r.status === 'failed').length;

      toast({
        title: "Analysis Boost Complete",
        description: `${successCount} deals processed successfully, ${failedCount} failed`,
        variant: successCount > failedCount ? "default" : "destructive"
      });

      console.log(`✅ Analysis boost complete: ${successCount} success, ${failedCount} failed`);

    } catch (error) {
      console.error('💥 Analysis boost failed:', error);
      toast({
        title: "Analysis Boost Failed",
        description: error.message || "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAnalysisQueue = async () => {
    try {
      // Force process the entire backlog
      const { data, error } = await supabase.functions.invoke('force-analysis-queue-processor');
      
      if (error) throw error;

      toast({
        title: "Queue Cleared",
        description: `Processed ${data?.summary?.total_processed || 0} queued analyses`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error clearing queue:', error);
      toast({
        title: "Queue Clear Failed",
        description: error.message || "Failed to clear analysis queue",
        variant: "destructive"
      });
    }
  };

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          MAD Hyperscalers Fund - Analysis Booster
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-amber-800">Demo Preparation Required</span>
          </div>
          <p className="text-sm text-amber-700">
            Push all 146 MAD deals through real AI engines to ensure high-quality market analysis 
            is ready for tomorrow's Fund Manager demo.
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            onClick={processAllMADDeals}
            disabled={isProcessing}
            className="flex-1"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Boost All MAD Deals'}
          </Button>

          <Button
            onClick={clearAnalysisQueue}
            variant="outline"
            disabled={isProcessing}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Queue
          </Button>
        </div>

        {/* Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing deals...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Processing Results:</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
                  <span className="truncate">{result.companyName}</span>
                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                    {result.status === 'success' ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    )}
                    {result.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {!isProcessing && results.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">Analysis Boost Complete</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              MAD deals now have real market intelligence and AI analysis ready for demo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}