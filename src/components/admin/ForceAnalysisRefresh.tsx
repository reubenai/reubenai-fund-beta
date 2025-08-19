import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Zap, 
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ForceAnalysisRefreshProps {
  dealId: string;
  companyName: string;
  onRefreshComplete?: () => void;
}

export function ForceAnalysisRefresh({ dealId, companyName, onRefreshComplete }: ForceAnalysisRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<any>(null);
  const { toast } = useToast();

  const triggerForceRefresh = async () => {
    setIsRefreshing(true);
    setRefreshResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('force-analysis-refresh', {
        body: { 
          dealId,
          skipGoogleSearch: true, // Skip to avoid quota issues
          forceRefresh: true
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setRefreshResult(data);
      
      toast({
        title: "Analysis Refreshed",
        description: `Market opportunity analysis updated for ${companyName}`,
      });

      if (onRefreshComplete) {
        onRefreshComplete();
      }

    } catch (error) {
      console.error('Force refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: `Failed to refresh analysis: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getEngineStatus = (engineResult: any) => {
    if (engineResult.success) {
      return <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Success
      </Badge>;
    } else {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Failed
      </Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Force Analysis Refresh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{companyName}</p>
            <p className="text-sm text-gray-600">Deal ID: {dealId}</p>
          </div>
          
          <Button
            onClick={triggerForceRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isRefreshing ? 'Refreshing...' : 'Force Refresh'}
          </Button>
        </div>

        {isRefreshing && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Triggering fresh analysis engines to fix market opportunity assessment. 
              This will bypass Google Search API quota issues.
            </AlertDescription>
          </Alert>
        )}

        {refreshResult && (
          <div className="space-y-3">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Analysis refreshed successfully!</strong><br />
                {refreshResult.message}
              </AlertDescription>
            </Alert>

            {refreshResult.results && refreshResult.results.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Engine Results:</h4>
                {refreshResult.results.map((result: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{result.engine}</span>
                    {getEngineStatus(result)}
                  </div>
                ))}
              </div>
            )}

            {refreshResult.skippedGoogleSearch && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Google Search API was skipped to avoid quota limits. 
                  Analysis used internal data sources and document content.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}