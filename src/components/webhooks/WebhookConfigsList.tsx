import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2, TestTube, Loader2, ExternalLink, Activity } from 'lucide-react';
import { WebhookConfig } from '@/hooks/useWebhookConfigs';
import { formatDistanceToNow } from 'date-fns';

interface WebhookConfigsListProps {
  configs: WebhookConfig[];
  testingWebhook: string | null;
  onEdit: (config: WebhookConfig) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onTest: (id: string) => void;
  onViewLogs: (configId: string) => void;
}

export function WebhookConfigsList({
  configs,
  testingWebhook,
  onEdit,
  onDelete,
  onToggleActive,
  onTest,
  onViewLogs
}: WebhookConfigsListProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  if (configs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-muted-foreground text-center">
            <ExternalLink className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No webhook configurations</h3>
            <p className="text-sm">
              Create your first Dify webhook configuration to start receiving deal creation events.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {config.service_name === 'dify' ? 'Dify' : config.service_name} Webhook
                    </CardTitle>
                    <Badge variant={config.is_active ? 'default' : 'secondary'}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-xs">
                    {config.webhook_url}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(config)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onTest(config.id)}
                      disabled={testingWebhook === config.id}
                    >
                      {testingWebhook === config.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4 mr-2" />
                      )}
                      Test Webhook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewLogs(config.id)}>
                      <Activity className="h-4 w-4 mr-2" />
                      View Logs
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteConfirmId(config.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Fund: {config.fund_id ? 'Specific Fund' : 'All Funds'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {formatDistanceToNow(new Date(config.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={(checked) => onToggleActive(config.id, checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook configuration? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}