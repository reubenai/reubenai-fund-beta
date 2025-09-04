import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ExternalLink } from 'lucide-react';
import { useWebhookConfigs } from '@/hooks/useWebhookConfigs';
import { WebhookConfigForm } from './WebhookConfigForm';
import { WebhookConfigsList } from './WebhookConfigsList';
import { WebhookLogsViewer } from './WebhookLogsViewer';

type ViewState = 'list' | 'create' | 'edit' | 'logs';

export function WebhookSettingsPage() {
  const {
    configs,
    logs,
    loading,
    testingWebhook,
    fetchConfigs,
    fetchLogs,
    createConfig,
    updateConfig,
    deleteConfig,
    testWebhook
  } = useWebhookConfigs();

  const [viewState, setViewState] = useState<ViewState>('list');
  const [editingConfig, setEditingConfig] = useState(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);

  const handleCreate = async (configData) => {
    const success = await createConfig(configData);
    if (success) {
      setViewState('list');
    }
  };

  const handleUpdate = async (configData) => {
    if (editingConfig) {
      const success = await updateConfig(editingConfig.id, configData);
      if (success) {
        setViewState('list');
        setEditingConfig(null);
      }
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setViewState('edit');
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateConfig(id, { is_active: isActive });
  };

  const handleViewLogs = (configId: string) => {
    setSelectedConfigId(configId);
    fetchLogs(configId);
    setViewState('logs');
  };

  const handleCancel = () => {
    setViewState('list');
    setEditingConfig(null);
    setSelectedConfigId(null);
  };

  if (viewState === 'create') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <WebhookConfigForm
          onSubmit={handleCreate}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    );
  }

  if (viewState === 'edit' && editingConfig) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <WebhookConfigForm
          config={editingConfig}
          onSubmit={handleUpdate}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    );
  }

  if (viewState === 'logs') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleCancel}>
            ← Back to Webhooks
          </Button>
        </div>
        <WebhookLogsViewer
          logs={logs}
          loading={loading}
          onRefresh={() => fetchLogs(selectedConfigId)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Webhook Settings</h1>
            <p className="text-muted-foreground mt-2">
              Configure webhooks to send deal creation events to external services like Dify
            </p>
          </div>
          <Button onClick={() => setViewState('create')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configurations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="logs">All Logs</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-6">
          <WebhookConfigsList
            configs={configs}
            testingWebhook={testingWebhook}
            onEdit={handleEdit}
            onDelete={deleteConfig}
            onToggleActive={handleToggleActive}
            onTest={testWebhook}
            onViewLogs={handleViewLogs}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <WebhookLogsViewer
            logs={logs}
            loading={loading}
            onRefresh={() => fetchLogs()}
          />
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                About Dify Webhooks
              </CardTitle>
              <CardDescription>
                Learn how webhooks work and how to integrate with Dify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">How it works</h4>
                <p className="text-sm text-muted-foreground">
                  When a new deal is created in your organization, a webhook will be automatically sent to your configured Dify endpoint with relevant deal information.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Payload Structure</h4>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                  {JSON.stringify({
                    company_name: "Example Company",
                    industry: "Technology",
                    fund_type: "vc",
                    fund_name: "Example Fund",
                    deal_size: 1000000,
                    valuation: 10000000,
                    location: "San Francisco, CA",
                    founder: "John Doe",
                    created_at: "2024-01-15T10:30:00Z",
                    deal_id: "uuid-here",
                    organization_id: "uuid-here",
                    fund_id: "uuid-here",
                    status: "active",
                    event_type: "deal_created"
                  }, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">Retry Logic</h4>
                <p className="text-sm text-muted-foreground">
                  Failed webhook deliveries will be automatically retried up to 3 times with exponential backoff. Check the logs tab to monitor delivery status.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Security</h4>
                <p className="text-sm text-muted-foreground">
                  You can configure authentication headers (Bearer tokens, API keys) to secure your webhook endpoints. All requests are sent over HTTPS.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}