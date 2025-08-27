import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function StaleQueueCleaner() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCleanup = async () => {
    setIsProcessing(true);
    try {
      // Clean up stale queue entries and fix Selldone
      const { data, error } = await supabase.functions.invoke('clear-stale-analysis-queue', {
        body: {
          dealId: '990212f0-a497-4eae-8e1e-9c9a1479948e' // Selldone deal ID
        }
      });

      if (error) {
        throw error;
      }

      toast.success(`✅ Cleanup completed! Cleared ${data.clearedQueueEntries} queue entries and updated ${data.updatedDeals} deals.`);
      
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error(`❌ Cleanup failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧹 Stale Analysis Queue Cleaner</CardTitle>
        <CardDescription>
          Clear stale analysis queue entries for deals with auto-analysis disabled and fix LinkedIn URLs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleCleanup}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? '🔄 Cleaning...' : '🧹 Clean Stale Queue & Fix Selldone'}
        </Button>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p><strong>This will:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Clear analysis queue entries for deals with auto_analysis_enabled = false</li>
            <li>Reset analysis_queue_status to NULL for those deals</li>
            <li>Fix Selldone's LinkedIn URL from '/about/' to clean format</li>
            <li>Enable normal deal editing for affected deals</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}