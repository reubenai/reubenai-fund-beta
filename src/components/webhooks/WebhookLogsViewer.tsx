import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Clock, AlertCircle, CheckCircle, XCircle, Eye } from 'lucide-react';
import { WebhookLog } from '@/hooks/useWebhookConfigs';
import { formatDistanceToNow } from 'date-fns';

interface WebhookLogsViewerProps {
  logs: WebhookLog[];
  loading: boolean;
  onRefresh: () => void;
}

export function WebhookLogsViewer({ logs, loading, onRefresh }: WebhookLogsViewerProps) {
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const getStatusBadge = (log: WebhookLog) => {
    if (log.error_message) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (log.response_status && log.response_status >= 200 && log.response_status < 300) {
      return <Badge variant="default">Success</Badge>;
    }
    if (log.response_status && log.response_status >= 400) {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getStatusIcon = (log: WebhookLog) => {
    if (log.error_message) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (log.response_status && log.response_status >= 200 && log.response_status < 300) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (log.response_status && log.response_status >= 400) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhook Logs</CardTitle>
              <CardDescription>
                Recent webhook delivery attempts and their results
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No logs yet</h3>
              <p className="text-sm text-muted-foreground">
                Webhook delivery logs will appear here when deals are created.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(log)}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          Deal: {log.request_payload.company_name || log.deal_id}
                        </span>
                        {getStatusBadge(log)}
                        {log.attempt_number > 1 && (
                          <Badge variant="outline">
                            Attempt {log.attempt_number}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                        {log.response_status && (
                          <span>HTTP {log.response_status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={selectedLog !== null} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Webhook Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about the webhook delivery attempt
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[60vh] w-full">
              <div className="space-y-6">
                {/* Overview */}
                <div className="space-y-2">
                  <h4 className="font-medium">Overview</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedLog)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timestamp:</span>
                      <div className="mt-1">{new Date(selectedLog.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Response Status:</span>
                      <div className="mt-1">{selectedLog.response_status || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Attempt Number:</span>
                      <div className="mt-1">{selectedLog.attempt_number}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Request Payload */}
                <div className="space-y-2">
                  <h4 className="font-medium">Request Payload</h4>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.request_payload, null, 2)}
                  </pre>
                </div>

                {/* Response Body */}
                {selectedLog.response_body && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium">Response Body</h4>
                      <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                        {selectedLog.response_body}
                      </pre>
                    </div>
                  </>
                )}

                {/* Error Message */}
                {selectedLog.error_message && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-destructive">Error Message</h4>
                      <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-md text-sm">
                        {selectedLog.error_message}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}