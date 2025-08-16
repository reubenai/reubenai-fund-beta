import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAnalysisQueueManager } from '@/hooks/useAnalysisQueueManager';

interface StuckItem {
  id: string;
  deal_id: string;
  status: string;
  created_at: string;
  attempts: number;
  error_message?: string;
  trigger_reason: string;
  deal_name?: string;
}

interface DynamicStuckDocumentRecoveryProps {
  onRecoveryComplete?: () => void;
}

export function DynamicStuckDocumentRecovery({ onRecoveryComplete }: DynamicStuckDocumentRecoveryProps) {
  const [stuckItems, setStuckItems] = useState<StuckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState<string | null>(null);
  const { forceProcessQueueItem, reclaimZombieJobs, clearFailedJobs } = useAnalysisQueueManager();

  const checkForStuckItems = async () => {
    try {
      setLoading(true);
      
      // Query for stuck items (older than 2 hours for queued, 1 hour for processing)
      const { data: stuckQueueItems, error } = await supabase
        .from('analysis_queue')
        .select(`
          id,
          deal_id,
          status,
          created_at,
          attempts,
          error_message,
          trigger_reason,
          deals!inner(company_name)
        `)
        .or(
          `and(status.eq.queued,created_at.lt.${new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()}),` +
          `and(status.eq.processing,created_at.lt.${new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()})`
        )
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error checking stuck items:', error);
        return;
      }

      const items: StuckItem[] = (stuckQueueItems || []).map(item => ({
        id: item.id,
        deal_id: item.deal_id,
        status: item.status,
        created_at: item.created_at,
        attempts: item.attempts,
        error_message: item.error_message,
        trigger_reason: item.trigger_reason,
        deal_name: (item.deals as any)?.company_name || 'Unknown Deal'
      }));

      setStuckItems(items);
    } catch (error) {
      console.error('Error checking for stuck items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkForStuckItems();
    // Refresh every 30 seconds
    const interval = setInterval(checkForStuckItems, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRecoverItem = async (item: StuckItem) => {
    setRecovering(item.id);
    try {
      console.log(`🔧 Recovering stuck item: ${item.deal_name} (${item.id})`);
      const success = await forceProcessQueueItem(item.id, item.deal_id);
      
      if (success) {
        // Remove the item from the list if recovery was successful
        setStuckItems(prev => prev.filter(i => i.id !== item.id));
        onRecoveryComplete?.();
      }
    } catch (error) {
      console.error('Recovery failed:', error);
    } finally {
      setRecovering(null);
    }
  };

  const handleCleanupOldItems = async () => {
    try {
      setLoading(true);
      
      // Clean up very old failed items
      await clearFailedJobs();
      
      // Reclaim zombie jobs
      await reclaimZombieJobs();
      
      // Refresh the list
      await checkForStuckItems();
    } finally {
      setLoading(false);
    }
  };

  const getItemAgeText = (createdAt: string) => {
    const age = Date.now() - new Date(createdAt).getTime();
    const hours = Math.floor(age / (1000 * 60 * 60));
    const minutes = Math.floor((age % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          <span>Checking for stuck documents...</span>
        </CardContent>
      </Card>
    );
  }

  if (stuckItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            No Stuck Documents Found
          </CardTitle>
          <CardDescription>
            All documents are processing normally
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" onClick={checkForStuckItems} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Check
            </Button>
            <Button variant="outline" onClick={handleCleanupOldItems} disabled={loading}>
              <Clock className="h-4 w-4 mr-2" />
              Cleanup Old Items
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <AlertTriangle className="h-5 w-5" />
          Stuck Documents Detected ({stuckItems.length})
        </CardTitle>
        <CardDescription>
          Found {stuckItems.length} items that appear to be stuck in processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {stuckItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <h4 className="font-semibold text-orange-900">{item.deal_name}</h4>
                  <Badge variant={item.status === 'processing' ? 'destructive' : 'secondary'}>
                    {item.status}
                  </Badge>
                </div>
                <div className="text-sm text-orange-700 space-y-1">
                  <p>Stuck for: {getItemAgeText(item.created_at)}</p>
                  <p>Attempts: {item.attempts}</p>
                  <p>Trigger: {item.trigger_reason}</p>
                  {item.error_message && (
                    <p className="text-xs text-red-600">Error: {item.error_message}</p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleRecoverItem(item)}
                disabled={recovering === item.id}
                size="sm"
                className="ml-3"
              >
                {recovering === item.id ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Recovering...
                  </>
                ) : (
                  'Recover'
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={checkForStuckItems} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Check
          </Button>
          <Button variant="outline" onClick={handleCleanupOldItems} disabled={loading}>
            <Clock className="h-4 w-4 mr-2" />
            Cleanup & Reclaim
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Detection Criteria:</strong></p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Queued items older than 2 hours</li>
            <li>Processing items older than 1 hour</li>
            <li>Items with multiple failed attempts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}