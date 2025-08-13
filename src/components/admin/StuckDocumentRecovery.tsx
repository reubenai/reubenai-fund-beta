import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useStuckDocumentRecovery } from '@/hooks/useStuckDocumentRecovery';
import { useAnalysisQueueManager } from '@/hooks/useAnalysisQueueManager';

interface StuckDocumentRecoveryProps {
  documentId?: string;
  queueId?: string;
  llamaParseId?: string;
  onRecoveryComplete?: () => void;
}

export function StuckDocumentRecovery({ 
  documentId = "a87730af-f9d9-4d29-9c53-6c2ae404b9b4", 
  queueId = "a596b862-813a-492d-ae2d-f69e92c53c2a",
  llamaParseId = "8342b0c1-b106-4523-8a65-704c9e92769a",
  onRecoveryComplete 
}: StuckDocumentRecoveryProps) {
  const { isRecovering, recoverStuckDocument } = useStuckDocumentRecovery();
  const { forceProcessQueueItem, isProcessing } = useAnalysisQueueManager();
  const [recoveryStep, setRecoveryStep] = useState<string>('idle');

  const handleRecovery = async () => {
    setRecoveryStep('starting');
    
    try {
      console.log('🚀 Starting recovery for Escavox IM Teaser...');
      setRecoveryStep('queue_processing');
      
      // Force process the specific queue item
      const success = await forceProcessQueueItem(queueId, documentId);
      
      if (success) {
        setRecoveryStep('completed');
        onRecoveryComplete?.();
      } else {
        setRecoveryStep('failed');
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      setRecoveryStep('failed');
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'starting':
      case 'queue_processing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStepText = (step: string) => {
    switch (step) {
      case 'starting':
        return 'Initializing recovery...';
      case 'queue_processing':
        return 'Force processing queue item...';
      case 'completed':
        return 'Recovery completed successfully!';
      case 'failed':
        return 'Recovery failed - please try again';
      default:
        return 'Ready to recover stuck document';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Stuck Document Recovery
        </CardTitle>
        <CardDescription>
          Force process the stuck "Escavox IM Teaser" document that's been stuck in processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div>
              <h4 className="font-semibold text-orange-900">Document Details</h4>
              <p className="text-sm text-orange-700">Escavox IM Teaser.pdf</p>
              <p className="text-xs text-orange-600">ID: {documentId}</p>
            </div>
            <Badge variant="destructive">Stuck in Processing</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <h4 className="font-semibold text-blue-900">Queue Status</h4>
              <p className="text-sm text-blue-700">Queue Item ID: {queueId}</p>
              <p className="text-xs text-blue-600">LlamaParse ID: {llamaParseId}</p>
            </div>
            <Badge variant="outline">Queued</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div>
              <h4 className="font-semibold text-green-900">LlamaParse Status</h4>
              <p className="text-sm text-green-700">Successfully completed parsing</p>
              <p className="text-xs text-green-600">Status mismatch detected</p>
            </div>
            <Badge className="bg-green-500">SUCCESS</Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {getStepIcon(recoveryStep)}
          <span className="text-sm font-medium">{getStepText(recoveryStep)}</span>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleRecovery}
            disabled={isRecovering || isProcessing || recoveryStep === 'completed'}
            className="flex-1"
          >
            {isRecovering || isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : recoveryStep === 'completed' ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Recovery Complete
              </>
            ) : (
              'Start Recovery'
            )}
          </Button>
          
          {recoveryStep === 'completed' && (
            <Button 
              variant="outline"
              onClick={() => setRecoveryStep('idle')}
            >
              Reset
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Recovery Steps:</strong></p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Check LlamaParse status and reconcile if needed</li>
            <li>Force process the stuck queue item</li>
            <li>Update document status to completed</li>
            <li>Trigger analysis engines for the deal</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}