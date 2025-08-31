import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Play, RefreshCw } from "lucide-react";

export function TriggerQueueProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const triggerProcessor = async () => {
    setIsProcessing(true);
    try {
      console.log('🚀 Manually triggering universal-analysis-processor...');
      
      const { data, error } = await supabase.functions.invoke('universal-analysis-processor');
      
      if (error) {
        console.error('❌ Processor failed:', error);
        toast({
          title: "Processing Failed",
          description: error.message || "Failed to trigger processor",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Processor completed:', data);
      setLastResult(data);
      
      toast({
        title: "Queue Processing Completed",
        description: `Processed ${data?.processed || 0} items successfully (${data?.failed || 0} failed)`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error triggering processor:', error);
      toast({
        title: "Processing Error",
        description: "Failed to trigger analysis processor",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Queue Processor
        </CardTitle>
        <CardDescription>
          Manually trigger the universal analysis processor to process queued items
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={triggerProcessor} 
          disabled={isProcessing}
          className="w-full"
        >
          <Play className="mr-2 h-4 w-4" />
          {isProcessing ? "Processing..." : "Trigger Queue Processor"}
        </Button>
        
        {lastResult && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Last Processing Result:</h4>
            <div className="text-sm space-y-1">
              <div>✅ Processed: {lastResult.processed}</div>
              <div>❌ Failed: {lastResult.failed}</div>
              <div>📊 Total Items: {lastResult.totalItems}</div>
              <div>⏱️ Processing Time: {lastResult.processingTimeMs}ms</div>
              {lastResult.systemDisabled && (
                <div className="text-destructive">🚫 System was disabled</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}